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

redundancy_prompt_template = """
You are an expert in optimization modeling and constraint analysis. You are provided with a list of constraints for a problem extracted by your colleague. Here is the problem description:

{problem_description}

Your task is to identify any redundant constraints within the list and provide a final list with the redundant constraints removed.

Constraints:
{constraints}

Please list only the non-redundant constraints in the same natural language format.
"""

from pydantic.v1 import BaseModel, Field
from api.app.functionalities.utils import get_structured_llm
from api.app.utils.misc import get_unique_id


class FinalConstraints(BaseModel):
    implicit_constraints: list[str] = Field(
        description="Final list of implicit constraints"
    )
    explicit_constraints: list[str] = Field(
        description="Final list of explicit constraints"
    )


def remove_redundant_constraints(constraints, problem_description, model="gpt-4o"):
    structured_llm = get_structured_llm(FinalConstraints, model)
    prompt = redundancy_prompt_template.format(
        problem_description=problem_description,
        constraints=constraints,
    )
    return structured_llm.invoke(prompt)


class ExtractedClauses(BaseModel):
    implicit_constraints: list[str] = Field(
        description="Implicit constraints of the problem"
    )
    explicit_constraints: list[str] = Field(
        description="Explicit constraints of the problem"
    )
    objective: str = Field(description="Objective of the problem")


def extract_clauses(data, model="gpt-4o"):
    structured_llm = get_structured_llm(ExtractedClauses, model)
    formatted_description = data["formattedDescription"]

    prompt = prompt_template.format(
        formatted_description=formatted_description,
    )
    extracted_clauses = structured_llm.invoke(prompt)

    all_constraints = (
        extracted_clauses.explicit_constraints + extracted_clauses.implicit_constraints
    )
    final_constraints = remove_redundant_constraints(
        all_constraints, formatted_description, model
    )

    print("final_constraints: ", final_constraints)
    extracted_clauses.explicit_constraints = final_constraints.explicit_constraints
    extracted_clauses.implicit_constraints = final_constraints.implicit_constraints

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
