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


remove_redundant_params_prompt_template = """
You are an expert mathematical modeler and an optimization professor at a top university. Here is the problem description for an optimization problem:

-----
{description}
-----

And here is a list of parameters that someone has extracted from the description:

-----
{params}
-----

Consider parameter "{targetParam}". Is the value of it already known or not? Based on that, how confident are you that this is a parameter (from 1 to 5)?
"""


from pydantic.v1 import BaseModel, Field
from api.app.functionalities.utils import get_structured_llm
from api.app.functionalities.parameters.structure_detection import detect_structure


class ParameterConfidence(BaseModel):
    confidence: int = Field(
        description="The confidence level (from 1 to 5) that the proposed parameter is a actually a parameter in the context of the given optimization problem."
    )


def check_parameters_confidence(params, description, model="gpt-4o"):
    final_params = []
    for param in params:
        structured_llm = get_structured_llm(ParameterConfidence, model)
        prompt = remove_redundant_params_prompt_template.format(
            description=description, params=params, targetParam=param
        )
        res = structured_llm.invoke(prompt)
        if res.confidence >= 3:
            final_params.append(param)
    return final_params


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


def extract_params(data, model="gpt-4o"):
    structured_llm = get_structured_llm(FormattedProblem, model)
    description = data["problemDescription"]
    problem_type, explanation = detect_structure(description)
    prompt = prompt_template.format(description=description)
    res = structured_llm.invoke(prompt)

    params = check_parameters_confidence(res.parameters, description, model)

    output = {
        "parameters": {
            p.symbol: {
                "definition": p.definition,
                "shape": p.shape,
                "value": p.value,
            }
            for p in params
        },
        "formattedDescription": res.formattedDescription,
        "background": res.background,
    }

    output["structuredProblemType"] = {
        "type": problem_type,
        "explanation": explanation,
    }

    return output
