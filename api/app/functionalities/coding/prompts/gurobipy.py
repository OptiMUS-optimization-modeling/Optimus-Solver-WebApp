prompt_template = """
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to write gurobipy code for the {clauseType} of the problem.

Here's the {clauseType} we need you to write the code for:

-----
Description: {clauseDescription}
Formulation: {clauseFormulation}
-----

Here's the list of variables:

{relatedVariables}

Here's the list of parameters:

{relatedParameters}

Here's the problem summary:
{background}

Assume the parameters and variables are already defined and added to the model, gurobipy is imported as gp, and the model is named model. Generate the code needed to define the {clauseType} and add it to the model accordingly.

Here is an example of code to add the objective to the model:

model.setObjective(quicksum(profit[k] * x[k, i] - storeCost * s[k, i] for k in range(K) for i in range(I)), gp.GRB.MAXIMIZE)

Here is an example of code to add a constraint to the model:

for i in range(I):
    for m in range(M):
        model.addConstr(storage[i, m] <= storageSize[m], name="storage_capacity")

Here is an example of code to add a variable to the model:

y = model.addVar(name="y", vtype=GRB.BINARY)

- Only generate the code needed to define the {clauseType} and add it to the model accordingly. 
- Do not include any comments or explanations, unless no code is needed. If no code is needed, just return a comment saying "No code needed".
- Assume imports, parameters definitions, variable definitions, and other setup code is already written. You must not include any setup code.

- Even for simple constraints like non-negativity or sign constraints, include code to add them to the model explicitly (they are not added in the variable definition step).

Take a deep breath, and solve the problem step by step.
"""


import_code = "import gurobipy as gp"


# This code is used to get the solver information after the model is run. It should support all status (OPTIMAL, INFEASIBLE, UNBOUNDED, etc.) and store the objective value, variables, runtime, and iteration count in the solving_info dictionary.
get_info_code = """
# Get solver information
solving_info = {}

if status == gp.GRB.OPTIMAL:
    solving_info["status"] = "Optimal (2)"
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
else:
    status_dict = {
        gp.GRB.INFEASIBLE: "Infeasible",
        gp.GRB.INF_OR_UNBD: "Infeasible or Unbounded",
        gp.GRB.UNBOUNDED: "Unbounded",
        gp.GRB.OPTIMAL: "Optimal",
    }
    solving_info["status"] = (
        status_dict[model.status] + f" ({model.status})"
        if model.status in status_dict
        else status_dict[model.status]
    )
    solving_info["objective_value"] = None
    solving_info["variables"] = []
    solving_info["runtime"] = None
    solving_info["iteration_count"] = None
"""


from typing import List


# This code is used to generate the code to add a variable to the model.
def generate_variable_code(symbol: str, type: str, shape: List[int]):
    """
    symbol: The symbol of the variable to add.
    type: The type of the variable to add. One of "CONTINUOUS", "INTEGER", "BINARY".
    shape: The shape of the variable to add. An empty list if scalar, otherwise a list of symbols of scalar parameters as dimensions
    """

    print(f"symbol: {symbol}, type: {type}, shape: {shape}")
    if not shape or len(shape) == 0:
        return f"{symbol} = model.addVar(name='{symbol}', vtype=gp.GRB.{type.upper()})"
    else:
        shape_args = ", ".join(shape)
        return f"{symbol} = model.addVars({shape_args}, name='{symbol}', vtype=gp.GRB.{type.upper()})"
