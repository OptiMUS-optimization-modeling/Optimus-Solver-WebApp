import os
import subprocess
from api.app.functionalities.debugging.fix_code import fix_code

### auto_testing_helper functions for cvxpy
# Get variable code
def get_var_code(symbol, type, shape):
    type = type.upper()
    params = []
    if type == 'INTEGER':
        params.append('integer=True')
    elif type == 'BINARY':
        params.append('boolean=True')
    if shape:
        if len(shape) == 1:
            shape_str = shape[0]
        else:
            shape_str = f"({', '.join(shape)})"
        return f"{symbol} = cp.Variable({shape_str}, name='{symbol}'{', ' + ', '.join(params) if params else ''})"
    else:
        return f"{symbol} = cp.Variable(name='{symbol}'{', ' + ', '.join(params) if params else ''})"

# Synthesize the code
def synthesize_code_cvxpy(data, dir):

   parameters = data["parameters"]
   variables = data["variables"]
   constraints = data["constraints"]
   objective = data["objective"]

   code = []
   code.append(
     f"""
import os
import numpy as np
import json
import cvxpy as cp

with open("parameters.json", "r") as f:
   parameters = json.load(f)

constraints = []

"""
   )

   code.append("\n\n### Define the parameters\n")
   for symbol, p in parameters.items():
      code.append(f'{symbol} = parameters["{symbol}"] # shape: {p["shape"]}, definition: {p["definition"]}')
     
   code.append("\n\n### Define the variables\n")
   for symbol, v in variables.items():
      code.append(get_var_code(symbol, v["type"], v["shape"]))
     
   code.append("\n\n### Define the constraints\n")
   for c in constraints:
      code.append(c["code"])
     
   code.append("\n\n### Define the objective\n")
   code.append(objective["code"])
     
   code.append("\n\n### Optimize the model\n")
   code.append("problem = cp.Problem(objective, constraints)")
   code.append("problem.solve(verbose=True)")

   code.append(
     """
if problem.status in ["OPTIMAL", "OPTIMAL_INACCURATE"]:
    with open("output_solution.txt", "w") as f:
       f.write(str(problem.value))
else:
    with open("output_solution.txt", "w") as f:
       f.write(problem.status)
"""
       )

   code_str = "\n".join(code)

   with open(os.path.join(dir, "code.py"), "w") as f:
      f.write(code_str)

## Execute the code
def execute_code(dir, code_filename):
    try:
        code_path = os.path.join(dir, code_filename)
        # Using Python's subprocess to execute the code as a separate process
        result = subprocess.run(
            ["python", code_filename],
            capture_output=True,
            text=True,
            check=True,
            cwd=dir,
        )
        # save result in a file
        with open(os.path.join(dir, "code_output.txt"), "w") as f:
            f.write(f"Optimal Objective Value: {result.stdout}\n")
        return result.stdout, "Success"
    except subprocess.CalledProcessError as e:
        return e.stderr, "Error"

## Execute the code with debug support
def execute_and_debug(dir, max_tries=3):

    code_filename = "code.py"
    with open(os.path.join(dir, code_filename), "r") as f:
        code = f.read()

    for iteration in range(max_tries):

        # Execute the code
        output, status = execute_code(dir, code_filename)

        # Print status and update the prompt if needed
        if status == "Success":
            break
        else:
            debug_data = {
                "code": code,
                "error_message": output,
                "solver": "cvxpy",
            }
            debug_data.update(fix_code(debug_data))
            code = debug_data["code"]
            code_filename = f"code_{iteration + 1}.py"
            code_file_path = os.path.join(dir, code_filename)
            with open(code_file_path, "w") as f:
                f.write(code)