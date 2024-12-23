import json
from pydantic.v1 import BaseModel, Field
import importlib
from api.app.functionalities.utils import get_structured_llm


class Variable(BaseModel):
    definition: str = Field(description="Definition of the variable")
    symbol: str = Field(description="Symbol of the variable")
    shape: list = Field(
        description="Shape of the variable (a potentially-empty list of string parameter symbols, e.g. ['N', 'M'])"
    )
    type: str = Field(description="Type of the variable (BINARY, INTEGER, CONTINUOUS)")


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
    formulationConfidence: int = Field(
        description="From 1 to 5, how confident are you that the formulation is correct?"
    )


def formulate_clause(data, model="gpt-4o"):

    structured_llm = get_structured_llm(FormulatedClause, model)
    clause_type = data["clauseType"]
    parameters = data["parameters"]
    variables = data["variables"]
    background = data["background"]
    solver = data["solver"]

    # Dynamically import the prompt template based on the solver
    try:
        prompt_module = importlib.import_module(
            f"api.app.functionalities.formulation.prompts.{solver}"
        )
        prompt_template = prompt_module.prompt_template
    except (ImportError, AttributeError) as e:
        raise ImportError(
            f"Could not import prompt template for solver '{solver}': {e}"
        )

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
        background=background,
    )

    res = structured_llm.invoke(prompt)

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
        "formulationConfidence": res.formulationConfidence,
    }
    return output
