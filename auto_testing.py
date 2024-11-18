import os
import time
import json

from api.app.functionalities.parameters.extract_params import extract_params
from api.app.functionalities.clauses.extract_clauses import extract_clauses
from api.app.functionalities.formulation.formulate_clause import formulate_clause
from api.app.functionalities.coding.code_clause import code_clause
from api.app.functionalities.debugging.fix_code import fix_code
from auto_testing_helper_functions.auto_testing_helper_functions_cvxpy import synthesize_code_cvxpy, execute_code


### Helper functions
def testing_for_one(state, dir):
   test_dir = os.path.join(dir, f"test_results")
   if not os.path.exists(test_dir):
      os.makedirs(test_dir)

   ## State 1: Get formated description
   with open(os.path.join(dir, 'description.txt'), 'r') as f:
      desc = f.read()
   state["problemDescription"] = desc
   state.update(extract_params(state))
   # Save parameters {symbol: value} to json file
   with open(os.path.join(test_dir, 'parameters.json'), 'w') as f:
      for symbol, p in state["parameters"].items():
         json.dump({symbol: float(p["value"])}, f)

   ## State 2: Get objective and constraints (in text)
   state.update(extract_clauses(state))

   ## State 3-1: Get objectice formulation (in latex)
   obj_data_latex = {
      "clause": {"description": state["objective"]},
      "clauseType": "objective",
      "parameters": state["parameters"],
      "variables": state["variables"],
      "background": state["background"],
      "solver": state["solver"]
   }
   obj_data_latex.update(formulate_clause(obj_data_latex))
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
         "solver": state["solver"]
      }
      cons_data_latex.update(formulate_clause(cons_data_latex))
      cons_data_latex["clause"].update({"formulation": cons_data_latex["formulation"]})
      state["variables"].update(cons_data_latex["new_variables"])
      cons_data_latex_list.append(cons_data_latex.copy())

   ## State 4-1: Get objective code (in python)
   obj_data_code = {
      "clauseType": "objective",
      "clause": obj_data_latex["clause"],
      "relatedVariables": obj_data_latex["variables_used"],
      "relatedParameters": obj_data_latex["parameters_used"],
      "background": state["background"],
      "solver": state["solver"]
   }
   obj_data_code.update(code_clause(obj_data_code))

   ## State 4-2: Get constraints code (in python)
   cons_data_code_list = []
   for cons_data_latex in cons_data_latex_list:
      cons_data_code = {
         "clauseType": "constraint",
         "clause": cons_data_latex["clause"],
         "relatedVariables": cons_data_latex["variables_used"],
         "relatedParameters": cons_data_latex["parameters_used"],
         "background": state["background"],
         "solver": state["solver"]
      }
      cons_data_code.update(code_clause(cons_data_code))
      cons_data_code_list.append(cons_data_code.copy())

   ## State 5: Symthsize the code
   code_synthesis_data = {
      "variables": state["variables"],
      "parameters": state["parameters"],
      "constraints": cons_data_code_list,
      "objective": obj_data_code
   }
   synthesize_code_cvxpy(code_synthesis_data, test_dir)

   ## State 6: Run the code
   execute_code(test_dir)


### Main
SOLVER = "cvxpy"
TESTPATH = "/Users/yinjunwang/Desktop/Research/nl4opt-sample-data"

state = {"solver": SOLVER, "variables": {}}
for i in range(1, 2):
   dir = os.path.join(TESTPATH, f"{i}")
   if not os.path.exists(dir):
      continue
   testing_for_one(state, dir)