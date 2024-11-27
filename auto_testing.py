import os
import time
import json
import sys
import io
from contextlib import redirect_stdout

from api.app.functionalities.parameters.extract_params import extract_params
from api.app.functionalities.clauses.extract_clauses import extract_clauses
from api.app.functionalities.formulation.formulate_clause import formulate_clause
from api.app.functionalities.coding.code_clause import code_clause
from api.app.functionalities.debugging.fix_code import fix_code
from auto_testing_helper_functions.auto_testing_helper_functions_gurobipy import (
    synthesize_code_cvxpy,
    execute_and_debug,
)


### Helper functions
def testing_for_one(state, dir):

    model = "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"
    #  model = "o1-mini"

    test_dir = os.path.join(dir, f"test_results")
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    # Copy parameters.json to test_dir
    os.system(f"cp {os.path.join(dir, 'parameters.json')} {test_dir}")

    ## State 1: Get formated description
    with open(os.path.join(dir, "problem_info.json"), "r") as f:
        prob_info = f.read()

    prob_info = json.loads(prob_info)
    desc = prob_info["parametrized_description"]
    state["problemDescription"] = desc
    state["background"] = "This is a linear programming problem."
    state["formattedDescription"] = desc
    state["parameters"] = prob_info["parameters"]

    for param in state["parameters"].items():
        param[1]["definition"] = param[1].pop("description")

    ## State 2: Get objective and constraints (in text)
    state.update(extract_clauses(state, model=model))

    ## State 3-1: Get objectice formulation (in latex)
    obj_data_latex = {
        "clause": {"description": state["objective"]},
        "clauseType": "objective",
        "parameters": state["parameters"],
        "variables": state["variables"],
        "background": state["background"],
        "solver": state["solver"],
    }
    obj_data_latex.update(formulate_clause(obj_data_latex, model=model))
    obj_data_latex["clause"].update({"formulation": obj_data_latex["formulation"]})
    state["variables"].update(obj_data_latex["new_variables"])

    ## State 3-2: Get constraints formulation (in latex)
    cons_data_latex_list = []
    for c in state["constraints"]:
        cons_data_latex = {
            "clause": state["constraints"][c],
            "clauseType": "constraint",
            "parameters": state["parameters"],
            "variables": state["variables"],
            "background": state["background"],
            "solver": state["solver"],
        }
        cons_data_latex.update(formulate_clause(cons_data_latex, model=model))
        cons_data_latex["clause"].update(
            {"formulation": cons_data_latex["formulation"]}
        )
        state["variables"].update(cons_data_latex["new_variables"])
        cons_data_latex_list.append(cons_data_latex.copy())

    ## State 4-1: Get objective code (in python)
    obj_data_code = {
        "clauseType": "objective",
        "clause": obj_data_latex["clause"],
        "relatedVariables": {},
        "relatedParameters": {},
        "background": state["background"],
        "solver": state["solver"],
    }
    for v in obj_data_latex["variables_used"]:
        obj_data_code["relatedVariables"][v] = state["variables"][v]
    for p in obj_data_latex["parameters_used"]:
        obj_data_code["relatedParameters"][p] = state["parameters"][p]
        obj_data_code["relatedParameters"][p].update({"symbol": p})

    obj_data_code.update(code_clause(obj_data_code, model=model))

    ## State 4-2: Get constraints code (in python)
    cons_data_code_list = []
    for cons_data_latex in cons_data_latex_list:
        cons_data_code = {
            "clauseType": "constraint",
            "clause": cons_data_latex["clause"],
            "relatedVariables": {},
            "relatedParameters": {},
            "background": state["background"],
            "solver": state["solver"],
        }
        for v in cons_data_latex["variables_used"]:
            cons_data_code["relatedVariables"][v] = state["variables"][v]
        for p in cons_data_latex["parameters_used"]:
            cons_data_code["relatedParameters"][p] = state["parameters"][p]
            cons_data_code["relatedParameters"][p].update({"symbol": p})

        cons_data_code.update(code_clause(cons_data_code, model=model))
        cons_data_code_list.append(cons_data_code.copy())

    ## State 5: Symthsize the code
    code_synthesis_data = {
        "variables": state["variables"],
        "parameters": state["parameters"],
        "constraints": cons_data_code_list,
        "objective": obj_data_code,
    }
    synthesize_code_cvxpy(code_synthesis_data, test_dir)

    ## State 6: Run the code
    execute_and_debug(test_dir)


def check_solution(dir):

    with open(os.path.join(dir, "test_results", "output_solution.txt"), "r") as f:
        solution = float(f.read())

    with open(os.path.join(dir, "solution.json"), "r") as f:
        expected_solution = json.load(f)

    if (
        abs(solution - expected_solution["objective"])
        <= abs(expected_solution["objective"]) * 0.1
    ):
        return True
    else:
        return False


### Main
SOLVER = "gurobipy"
TESTPATH = "."


if __name__ == "__main__":

    n_solved = 0
    n_mismatch = 0
    n_failed = 0

    for i in range(1, 251):

        dir = os.path.join(TESTPATH, f"{i}")
        state = {"solver": SOLVER, "variables": {}}
        os.system(f"rm -rf {os.path.join(dir, 'test_results')}")
        testing_for_one(state, dir)
        break

        if not os.path.exists(dir):
            print(f"Test case {i} passed.")
            n_solved += 1
            continue

        try:
            status = check_solution(dir)
            if status:
                print(f"Test case {i} passed.")
                n_solved += 1
            else:
                print(f"Test case {i} has mismatched obj.")
                n_mismatch += 1
                continue
        except:
            print(f"Test case {i} error.")
            n_failed += 1
            try:
                state = {"solver": SOLVER, "variables": {}}
                os.system(f"rm -rf {os.path.join(dir, 'test_results')}")

                # Dump log
                buffer = io.StringIO()
                with redirect_stdout(buffer):
                    testing_for_one(state, dir)
                output = buffer.getvalue()
                buffer.close()

                # Write output
                with open(
                    os.path.join(dir, "test_results", "optimus_log.txt"), "w"
                ) as f:
                    f.write(output)

            except Exception as e:
                print(f"Error in {dir}: {e}")
            continue

    print("Summary:")
    print(f"Total: {n_solved + n_mismatch + n_failed}")
    print(f"Solved: {n_solved}")
    print(f"Mismatch: {n_mismatch}")
    print(f"Failed: {n_failed}")
    print(f"Success rate: {n_solved / (n_solved + n_mismatch + n_failed)}")
