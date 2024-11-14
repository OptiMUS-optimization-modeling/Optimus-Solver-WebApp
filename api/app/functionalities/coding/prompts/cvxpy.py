prompt_template = """
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to write cvxpy code for the {clauseType} of the problem.

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

Assume the parameters and variables are already defined and added to the model, cvxpy is imported as cp. Generate the code needed to define the {clauseType} and add it to the model accordingly.

Here is an example of code to add the objective, $\\max \\sum_{{i=1}}^{{N}} price_i x_i$ where the shape of both price and x is [N], to the model:

objective = cp.Maximize(cp.sum(cp.multiply(price, x)))

Here is an example of code to add a constraint, $\\forall i, SalesVolumes[i] \leq MaxProductionVolumes[i]$ where the shape of both SalesVolumes and MaxProductionVolumes is [N], to the model:

constraints.append(SalesVolumes <= MaxProductionVolumes)

- Only generate the code needed to define the {clauseType} and add it to the model accordingly. 
- Do not include any comments or explanations, unless no code is needed. If no code is needed, just return a comment saying "No code needed".
- Assume imports, parameters definitions, variable definitions, and other setup code is already written. You must not include any setup code.
- Even for simple constraints like non-negativity or sign constraints, include code to add them to the model explicitly (they are not added in the variable definition step).

Take a deep breath, and solve the problem step by step.
"""


def generate_variable_code(symbol, type, shape):
    if not shape or len(shape) == 0:
        return f"{symbol} = cp.Variable(name='{symbol}', {type})"
    else:
        shape_args = ", ".join(shape)
        return f"{symbol} = cp.Variable({shape_args}, name='{symbol}', {type})"
