import os
import subprocess
from api.app.functionalities.debugging.fix_code import fix_code

### auto_testing_helper functions for cvxpy
# Get variable code
def get_var_code(symbol, shape, type, definition, solver="gurobipy"):

    if solver == "gurobipy":
        if shape == []:
            return (
                f'{symbol} = model.addVar(vtype=GRB.{type.upper()}, name="{symbol}")\n'
            )
        else:
            return (
                f"{symbol} = model.addVars("
                + ", ".join([str(i) for i in shape])
                + f', vtype=GRB.{type.upper()}, name="{symbol}")\n'
            )
    else:
        raise NotImplementedError(f"Solver {solver} is not implemented")

def get_param_code(symbol, shape, definition):
    return f'{symbol} = data["{symbol}"] # shape: {shape}, definition: {definition}\n'

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
from gurobipy import Model, GRB, quicksum
import gurobipy as gp


model = Model("OptimizationProblem")

with open("parameters.json", "r") as f:
    data = json.load(f)

""")
    code.append("\n\n### Define the parameters\n")
    for symbol, v in data["parameters"].items():
        print(v)
        code.append(get_param_code(symbol, v["shape"], v["definition"]))
    code.append("\n\n### Define the variables\n")
    for symbol, v in data["variables"].items():
        code.append(
            get_var_code(
                symbol,
                v["shape"],
                v["type"],
                v["definition"],
                solver="gurobipy",
            )
        )

    code.append("\n\n### Define the constraints\n")
    for c in data["constraints"]:
        code.append(c["code"])

    code.append("\n\n### Define the objective\n")
    code.append(data["objective"]["code"])

    code.append("\n\n### Optimize the model\n")
    code.append("model.optimize()\n")

    code.append("\n\n### Output optimal objective value\n")
    code.append(f'print("Optimal Objective Value: ", model.objVal)\n')

    # code to save the optimal value if it exists
    code.append(
        """
if model.status == GRB.OPTIMAL:
    with open("output_solution.txt", "w") as f:
        f.write(str(model.objVal))
    print("Optimal Objective Value: ", model.objVal)
else:
    with open("output_solution.txt", "w") as f:
        f.write(model.status)
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
                "solver": "gurobipy",
            }
            debug_data.update(fix_code(debug_data))
            code = debug_data["code"]
            code_filename = f"code_{iteration + 1}.py"
            code_file_path = os.path.join(dir, code_filename)
            with open(code_file_path, "w") as f:
                f.write(code)