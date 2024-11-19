prompt_template = """
You are an expert mathematical modeler and an optimization professor at a top university. Your goal is to read the description for an optimization problem and identify the parameters in the problem description (parameters are known values upon which the model is built, and they do not change during the optimization process).

Here is the problem description:
-----
{description}
-----

you should go through the statements one by one, and identify and separate the parameters of the problem.

- Feel free to define new symbols for parameters that do not have a symbol.
- Use CamelCase and full words for symbols, and don't include the indices (e.g. MaxColor instead of maxColor or max_color or maxcolor or MaxCol or MaxColor_i or MaxColor_{{i}})
- Use single capital letters for symbols that represent dimensions for indices of other parameters (e.g. N, M, etc.)
- Note that parameters are known values upon which the model is built, and they do not change during the optimization process.  However, variables are the unknowns that the optimization process seeks to solve. DO NOT include variables in the parameters list!
- Make sure you include all the parameters in the updated problem description.
- Replace constant values with parameters where needed. The formatted description should not contain any constants.
- Combine multiple paramaters of the same type into a higher-dimensional parameter if appropriate.

Take a deep breath and tackle the problem step by step.
"""


from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

from api.app.functionalities.parameters.structure_detection import detect_structure


class Parameter(BaseModel):
    definition: str = Field(description="The definition of the parameter")
    symbol: str = Field(
        description="The symbol of the parameter (CamelCase or single capital letter for scalar parameters used to define the dimensions of other parameters)"
    )
    value: str = Field(
        description="The value of the parameter (if it is given in the description)"
    )
    shape: list[str] = Field(
        description="The shape of the parameter (a potentially-empty list of other parameters, e.g. ['N', 'M'] or [] for a scalar)"
    )


class FormattedProblem(BaseModel):
    parameters: list[Parameter] = Field(description="The list of parameters")
    formattedDescription: str = Field(
        description="The formatted problem description where the problem statement has been rewritten to use the accurate parameter symbols."
    )
    background: str = Field(description="A 2-3 sentence summary of the problem.")


structured_llm = llm.with_structured_output(FormattedProblem)


def extract_params(data):

    description = data["problemDescription"]
    problem_type, explanation = detect_structure(description)
    prompt = prompt_template.format(description=description)
    res = structured_llm.invoke(prompt)

    output = {
        "parameters": {
            p.symbol: {
                "definition": p.definition,
                "shape": p.shape,
                "value": p.value,
            }
            for p in res.parameters
        },
        "formattedDescription": res.formattedDescription,
        "background": res.background,
    }

    output["structuredProblemType"] = {
        "type": problem_type,
        "explanation": explanation,
    }

    return output
