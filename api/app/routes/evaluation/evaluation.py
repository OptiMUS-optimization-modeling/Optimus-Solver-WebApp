prep_code = """
import json
import numpy as np

{solver_import_code}

with open("{data_json_path}", "r") as f:
    data = json.load(f)

"""


get_info_code = """
# Get solver information
solving_info = {}
if status == gp.GRB.OPTIMAL:
    solving_info["status"] = model.status
    solving_info["objective_value"] = model.objVal
    solving_info["variables"] = [
        {
            "symbol": var.VarName,
            "value": var.X,
        }
        for var in model.getVars()
    ]
    solving_info["runtime"] = model.Runtime
    solving_info["iteration_count"] = model.IterCount
    

"""


fix_prompt = """
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to debug the code for the {targetType} of the problem.

Here's the code you need to debug:

-----
{error_line}
-----

and here is the error message:

-----
{error_message}
-----

First reason about the source of the error, fix the code and generate a json file with the following format:

{{
    "bug explanation": str,
    "fixed_code": str,
}}

- Bug explanation should be a string that explains the source of the error.
- Fixed code should be the fixed code to be used instead of the bogus code.
- Do not generate anything after the json file.
- Use '```json' and '```' to enclose the json file.

"""


from flask import Blueprint, request, jsonify, current_app, session
import json
import numpy as np
import random
import string
from typing import Dict
import os
import threading


from api.app.utils.communication import get_llm_response, process_with_retries
from api.app.routes.auth.auth import login_required, check_project_ownership


bp = Blueprint("eval", __name__)


def prep_problem_json(state):
    for p in state["parameters"]:
        parameter = state["parameters"][p]
        assert "shape" in parameter.keys(), "shape is not defined for parameter"
        assert "symbol" in parameter.keys(), "symbol is not defined for parameter"
        assert (
            "definition" in parameter.keys() and len(parameter["definition"]) > 0
        ), "definition is not defined for parameter"

        if parameter["shape"] and len(parameter["shape"]) > 2:
            code_symbol = parameter["symbol"].split("_")[0]

            parameter["code"] = (
                f'{code_symbol} = np.array(data["{parameter["symbol"]}"])'
            )
        else:
            code_symbol = parameter["symbol"].split("_")[0]
            parameter["code"] = f'{code_symbol} = data["{parameter["symbol"]}"]'

    return state


def run_code(state: Dict, interpret: bool = False):
    local_env = {}
    code = ""
    last_line = ""
    bogus_context = None

    try:
        last_line = prep_code.format(
            solver_import_code=get_solver_import_code(state["solver"]),
            data_json_path=state["data_json_path"],
        )

        code += last_line + "\n"

        if interpret:
            exec(
                last_line,
                local_env,
                local_env,
            )

        bogus_context = "DATA_LOAD"
        for p in state["parameters"]:
            parameter = state["parameters"][p]
            if not "code" in parameter:
                raise Exception(f"Parameter {parameter} is not coded yet!")
            last_line = parameter["code"]
            code += last_line + "\n"
            if interpret:
                exec(last_line, local_env, local_env)

        last_line = f"\n# Define model\nmodel = gp.Model('model')\n"
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        code += "\n# ====== Define variables ====== \n"

        for v in state["variables"]:
            variable = state["variables"][v]
            bogus_context = variable
            if "code" in variable and variable["code"] and len(variable["code"]) > 0:
                last_line = variable["code"]
            else:
                last_line = f"# Variable {variable['symbol']} is not coded yet!"
            code += last_line + "\n"
            if interpret:
                exec(last_line, local_env, local_env)

        code += "\n# ====== Define constraints ====== \n"

        for constraint in state["constraints"]:
            bogus_context = constraint
            if (
                "code" in constraint
                and constraint["code"]
                and len(constraint["code"]) > 0
            ):
                last_line = constraint["code"]
            else:
                last_line = f"# Constraint {constraint['symbol']} is not coded yet!"
            code += "\n" + last_line + "\n"
            if interpret:
                exec(last_line, local_env, local_env)

        code += "\n# ====== Define objective ====== \n"

        bogus_context = state["objective"][0]
        if (
            "code" in state["objective"][0]
            and state["objective"][0]["code"]
            and len(state["objective"][0]["code"]) > 0
        ):
            last_line = state["objective"][0]["code"]
        else:
            last_line = (
                f"# Objective {state['objective'][0]['symbol']} is not coded yet!"
            )

        code += "\n" + last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        bogus_context = "OPTIMIZATION_CALL"
        last_line = f"\n# Optimize model\nmodel.optimize()\n"
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        bogus_context = None
        last_line = f"\n# Get model status\nstatus = model.status\n"
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        bogus_context = None
        last_line = get_info_code
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        last_line = f"\n# Get objective value\nobj_val = model.objVal\n"
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        if interpret:
            ret = {
                "success": True,
                "error_line": None,
                "code": code,
                "obj_val": local_env["obj_val"],
                "status": local_env["status"],
                "solving_info": local_env["solving_info"],
                "error_message": None,
                "bogus_context": bogus_context,
            }

            return ret

        else:
            return {
                "code": code,
            }

    except Exception as e:
        if not bogus_context:
            print(local_env)
            print()
            print(code)
            print()

            import traceback

            error_msg = traceback.format_exc()
            raise Exception(
                f"Unexpected error in running code at {last_line}: "
                + "\n"
                + str(e)
                + "\n\n\n"
                + error_msg
            )

        if bogus_context and type(bogus_context) == dict:
            bogus_context["status"] = "bogus"
            bogus_context["error_message"] = str(e)
        elif bogus_context and bogus_context == "DATA_LOAD":
            e = f"The data is not properly configured! \n {str(e)}"
        return {
            "success": False,
            "error_line": last_line,
            "bogus_context": bogus_context,
            "code": code,
            "obj_val": None,
            "status": None,
            "error_message": str(e),
        }


@bp.route("/getFullCode", methods=["POST"])
@login_required
@check_project_ownership
def get_full_code():
    # parameters = request.json["parameters"]
    # constraints = request.json["constraints"]
    # objective = request.json["objective"]
    # variables = request.json["variables"]

    solver = "gurobipy"  # TODO: make this a parameter
    # data = request.json["data"]
    project_id = request.json["project_id"]
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    parameters = project_data.get("parameters", {})
    constraints = project_data.get("constraints", {})
    objective = project_data.get("objective", {})
    variables = project_data.get("variables", {})

    # iterate over variables and generate the code for the ones that don't have it
    for v in variables:
        variable = variables[v]

        if not variable.get("shape") or len(variable["shape"]) == 0:
            variable["code"] = (
                f"{variable['symbol']} = model.addVar(name='{variable['symbol']}', vtype=gp.GRB.{variable['type'].upper()})"
            )
        else:
            # Unpack the shape list into separate arguments
            shape_args = ", ".join(variable["shape"])
            variable["code"] = (
                f"{variable['symbol']} = model.addVars({shape_args}, name='{variable['symbol']}', vtype=gp.GRB.{variable['type'].upper()})"
            )

    # Update the project with the modified variables
    project.update({"variables": variables})

    state = {
        "parameters": parameters,
        "constraints": constraints,
        "objective": objective,
        "variables": variables,
        "solver": solver,
        "data_json_path": "tmpData/data.json",
    }

    try:
        state = prep_problem_json(state)
        code = run_code(
            state,
            interpret=False,
        )["code"]

    except Exception as e:
        code = "ERROR!: " + str(e)
        print(e)

    project.update({"code": code})

    return {"code": code}, 200


@bp.route("/runCode", methods=["POST"])
@login_required
@check_project_ownership
def get_run_results():
    # parameters = request.json["parameters"]
    # constraints = request.json["constraints"]
    # objective = request.json["objective"]
    # variables = request.json["variables"]
    solver = "gurobipy"  # TODO: make this a parameter
    data = request.json["data"]
    project_id = request.json["project_id"]
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    parameters = project_data.get("parameters", {})
    constraints = project_data.get("constraints", {})
    objective = project_data.get("objective", {})
    variables = project_data.get("variables", {})

    # if tmp folder doesn't exist, create it
    if not os.path.exists("tmpData/"):
        os.mkdir("tmpData/")

    name = "".join(random.choices(string.ascii_uppercase + string.digits, k=10))
    path = f"tmpData/{name}"
    os.mkdir(path)
    with open(f"{path}/data.json", "w") as f:
        json.dump(data, f)

    state = {
        "parameters": parameters,
        "constraints": constraints,
        "objective": objective,
        "variables": variables,
        "solver": solver,
        "data_json_path": f"{path}/data.json",
    }

    print(json.dumps(state, indent=4))
    try:
        state = prep_problem_json(state)
        run_result = run_code(
            state,
            interpret=True,
        )
        print("====$$")
        print(json.dumps(state, indent=4))
        print("====")
        print(json.dumps(run_result, indent=4))
        print("====")

    except Exception as e:
        code = "ERROR!: " + str(e)
        print(e)

    # delete the tmp folder
    # os.system(f"rm -rf {path}")

    return jsonify({"status": "success", "run_result": run_result, "state": state}), 200


def get_solver_import_code(solver):
    if solver == "gurobipy":
        return "import gurobipy as gp"
    else:
        raise Exception(f"Solver {solver} is not supported yet!")


def fix_code(parameters, variables, constraints, objective, solver, data):
    bogus_context = None
    target_type = None

    for c in constraints:
        if "status" in c and c["status"] == "bogus":
            bogus_context = c
            target_type = "constraint"
            break
    for o in objective:
        if "status" in o and o["status"] == "bogus":
            bogus_context = o
            target_type = "objective"
            break
    for v in variables:
        if "status" in v and v["status"] == "bogus":
            bogus_context = v
            target_type = "variable"
            break

    if not bogus_context:
        return {
            "parameters": parameters,
            "variables": variables,
            "constraints": constraints,
            "objective": objective,
            "bug_explanation": "No bug found!",
        }

    prompt = fix_prompt.format(
        targetType=target_type,
        error_line=bogus_context["code"],
        error_message=bogus_context["error_message"],
    )

    output = get_llm_response(prompt)
    output = output.split("```json")[1].split("```")[0].strip()

    print(output)
    output = json.loads(output)
    bogus_context["status"] = "fixed"
    bogus_context["code"] = output["fixed_code"]

    return {
        "parameters": parameters,
        "variables": variables,
        "constraints": constraints,
        "objective": objective,
        "bug_explanation": output["bug explanation"],
    }


@bp.route("/fixCode", methods=["POST"])
@login_required
def get_fixed_code():
    parameters = request.json["parameters"]
    constraints = request.json["constraints"]
    objective = request.json["objective"]
    variables = request.json["variables"]
    solver = "gurobipy"  # TODO: make this a parameter
    data = request.json["data"]

    # if tmp folder doesn't exist, create it
    if not os.path.exists("tmpData/"):
        os.mkdir("tmpData/")

    request_id = request.json["request_id"]
    athread = threading.Thread(
        target=process_with_retries,
        args=(
            current_app.app_context(),
            request_id,
            3,
            fix_code,
            parameters,
            variables,
            constraints,
            objective,
            solver,
            data,
        ),
    )

    athread.start()

    return jsonify({"received": True, "request_id": request_id}), 200


@bp.route("/updateCode", methods=["POST"])
@login_required
@check_project_ownership
def update_code():
    project_id = request.json["project_id"]
    new_code = request.json["code"]
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    try:
        project.update({"code": new_code})
        return (
            jsonify({"status": "success", "message": "Code updated successfully"}),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
