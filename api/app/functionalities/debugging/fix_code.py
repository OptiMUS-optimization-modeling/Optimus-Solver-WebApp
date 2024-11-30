import json
from pydantic.v1 import BaseModel, Field
import importlib
from api.app.functionalities.utils import get_structured_llm


class CodeFix(BaseModel):
    reasoning: str = Field(
        description="The undelrying reason for the error and the fix"
    )
    code: str = Field(description="The new fixed version of the code")


def fix_code(data, model="gpt-4o"):
    code = data["code"]
    error_message = data["error_message"]
    solver = data["solver"]

    # Dynamically import the prompt template based on the solver
    try:
        prompt_module = importlib.import_module(
            f"api.app.functionalities.debugging.prompts.{solver}"
        )
        prompt_template = prompt_module.prompt_template
    except (ImportError, AttributeError) as e:
        raise ImportError(
            f"Could not import prompt template for solver '{solver}': {e}"
        )

    print("Prompt template: ", prompt_template)

    prompt = prompt_template.format(
        code=code,
        error_message=error_message,
    )
    structured_llm = get_structured_llm(CodeFix, model)
    res = structured_llm.invoke(prompt)

    output = {
        "code": res.code,
        "reasoning": res.reasoning,
    }

    print("Returning ", output)
    return output
