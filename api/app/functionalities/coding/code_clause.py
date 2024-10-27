import json
from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
import importlib

llm = ChatOpenAI(model="gpt-4o")


class CodeClause(BaseModel):
    code: str = Field(description="The code specific to the clause to add to the model")


structured_llm = llm.with_structured_output(CodeClause)


def code_clause(data):
    clause_type = data["clauseType"]
    clause = data["clause"]
    related_variables = data["relatedVariables"]
    related_parameters = data["relatedParameters"]

    background = data["background"]
    solver = data["solver"]

    print("related_variables ", related_variables)
    print("related_parameters ", related_parameters)

    # Dynamically import the prompt template based on the solver
    try:
        prompt_module = importlib.import_module(
            f"api.app.functionalities.coding.prompts.{solver}"
        )
        prompt_template = prompt_module.prompt_template
    except (ImportError, AttributeError) as e:
        raise ImportError(
            f"Could not import prompt template for solver '{solver}': {e}"
        )

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
                    "symbol": related_parameters[p]["symbol"],
                    "shape": related_parameters[p]["shape"],
                }
                for p in related_parameters
            ],
            indent=4,
        ),
        background=background,
    )

    res = structured_llm.invoke(prompt)

    output = {
        "code": res.code,
    }

    print("Returining ", output)
    return output
