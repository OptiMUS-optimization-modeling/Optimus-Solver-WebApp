prompt_template = """
You are an expert mathematical formulator and an optimization professor at a top university. Your task is to model {clauseType} of the problem in the standard LP or MILP form.

Here is a summary of the problem:

-----
{problemSummary}
-----

Here's a {clauseType} we need you to model:

-----
{clauseDescription}
-----

and here is list of available input parameters:

-----
{parameters}
-----

and here is the list of available variables:

-----
{variables}
-----

Take a deep breath and explain how we should define the {clauseType}. Feel free to define new variables if you think it's necessary.

- Your formulation should be in LaTeX mathematical format (do not include the $ symbols).
- Use CamelCase and full words for symbols, and do not include indices in the symbol (e.g. ItemsSold instead of itemsSold or items_sold or ItemsSold_i)
- Only model the {clauseType}.

"""


import json
from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")


class Variable(BaseModel):
    definition: str = Field(description="Definition of the variable")
    symbol: str = Field(description="Symbol of the variable")
    shape: list = Field(
        description="Shape of the variable (a potentially-empty list of string parameter symbols, e.g. ['N', 'M'])"
    )
    type: str = Field(description="Type of the variable (BINARY, INTEGER, FLOAT)")


class FormulatedClause(BaseModel):
    formulation: str = Field(
        description="The formulation of the clause in LaTex format (include formulation for arbitrary constraints if needed)"
    )
    new_variables: list[Variable] = Field(
        description="The list of new variables defined for the clause or the arbitrary constants"
    )
    parameters_used: list[str] = Field(
        description="The list of parameters used in the clause"
    )
    variables_used: list[str] = Field(
        description="The list of variables (including the newly-defined ones) that are used in the clause"
    )


structured_llm = llm.with_structured_output(FormulatedClause)


def formulate_clause(data):
    clause_type = data["clauseType"]
    parameters = data["parameters"]
    variables = data["variables"]
    problemSummary = data["problemSummary"]

    prompt = prompt_template.format(
        clauseType=clause_type,
        clauseDescription=data["clause"]["description"],
        variables=json.dumps(
            [
                {
                    "definition": variables[v]["definition"],
                    "type": variables[v]["type"],
                    "symbol": v,
                    "shape": variables[v]["shape"],
                }
                for v in variables
            ],
            indent=4,
        ),
        parameters=json.dumps(
            [
                {
                    "definition": parameters[p]["definition"],
                    "symbol": p,
                    "shape": parameters[p]["shape"],
                }
                for p in parameters
            ],
            indent=4,
        ),
        problemSummary=problemSummary,
    )

    print("PROMPT", prompt)
    res = structured_llm.invoke(prompt)

    print("RES", res)

    output = {
        "formulation": res.formulation,
        "new_variables": {
            v.symbol: {
                "definition": v.definition,
                "type": v.type,
                "shape": v.shape,
            }
            for v in res.new_variables
        },
        "parameters_used": res.parameters_used,
        "variables_used": res.variables_used,
    }
    return output
