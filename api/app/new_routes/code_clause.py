prompt_template = """
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to write {solver} code for the {clauseType} of the problem.

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
{problemSummary}

Assume the parameters and variables are already defined and added to the model, gurobipy is imported as gp, and the model is named model. Generate the code needed to define the {clauseType} and add it to the model accordingly.

Only generate the code needed to define the {clauseType} and add it to the model accordingly. 

Here is an example of code to add the objective to the model:

m.setObjective(quicksum(profit[k] * x[k, i] - storeCost * s[k, i] for k in range(K) for i in range(I)), gp.GRB.MAXIMIZE)

Here is an example of code to add a constraint to the model:

for i in range(I):
    for m in range(M):
        model.addConstr(storage[i, m] <= storageSize[m], name="storage_capacity")

Here is an example of code to add a variable to the model:

y = model.addVar(name="y", vtype=GRB.BINARY)


Take a deep breath, and solve the problem step by step.
"""

import json
from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")


class CodeClause(BaseModel):
    code: str = Field(description="The code specific to the clause to add to the model")


structured_llm = llm.with_structured_output(CodeClause)


def code_clause(data):
    clause_type = data["clauseType"]
    clause = data["clause"]
    related_variables = data["relatedVariables"]
    related_parameters = data["relatedParameters"]

    problemSummary = data["problemSummary"]
    solver = data["solver"]

    prompt = prompt_template.format(
        solver=solver,
        clauseType=clause_type,
        clauseDescription=clause["description"],
        clauseFormulation=clause["formulation"],
        relatedVariables=json.dumps(
            [
                {
                    "definition": related_variables[v]["definition"],
                    "type": related_variables[v]["type"],
                    "symbol": v,
                    "shape": related_variables[v]["shape"],
                }
                for v in related_variables
            ],
            indent=4,
        ),
        relatedParameters=json.dumps(
            [
                {
                    "definition": related_parameters[p]["definition"],
                    "symbol": p,
                    "shape": related_parameters[p]["shape"],
                }
                for p in related_parameters
            ],
            indent=4,
        ),
        problemSummary=problemSummary,
    )

    res = structured_llm.invoke(prompt)

    output = {
        "code": res.code,
    }
    return output
