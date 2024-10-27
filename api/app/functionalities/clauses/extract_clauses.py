prompt_template = """
You are an expert mathematical formulator and an optimization professor at a top university. Your task is read the description of an optimization problem, understand it, and extract constraints and the objective of the problem.

Here is the description of the problem:
-----
{formatted_description}
-----

You should read and understand the problem and identify 1) implicit constraints (e.g. number of items produced can not be negative), 2) explicit constraints, and 3) the objective. 

- Do not combine multiple constraints into one constraint. 
- Do not include any clauses related to variable integrality (e.g. integer or binary variables). We will cover those in the variable definition step.

- The constraint should be in natural language, not mathematical (e.g. "The number of items produced should be less than the number of items sold, as opposed to itemsProduced <= itemsSold")

Take a deep breath, and solve the problem step by step.
"""

from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
from api.app.utils.misc import get_unique_id


llm = ChatOpenAI(model="gpt-4o")


class ExtractedClauses(BaseModel):
    implicit_constraints: list[str] = Field(
        description="Implicit constraints of the problem"
    )
    explicit_constraints: list[str] = Field(
        description="Explicit constraints of the problem"
    )
    objective: str = Field(description="Objective of the problem")


structured_llm = llm.with_structured_output(ExtractedClauses)


def extract_clauses(data):
    formatted_description = data["formattedDescription"]

    prompt = prompt_template.format(
        formatted_description=formatted_description,
    )
    extracted_clauses = structured_llm.invoke(prompt)

    output = {
        "constraints": {},
        "objective": extracted_clauses.objective,
    }

    for c in extracted_clauses.explicit_constraints:
        output["constraints"][get_unique_id()] = {
            "description": c,
            "type": "explicit",
        }

    for c in extracted_clauses.implicit_constraints:
        output["constraints"][get_unique_id()] = {
            "description": c,
            "type": "implicit",
        }
    return output
