prompt_template = """
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to debug a piece of code.

Here's the code:

-----
{code}
-----

Here's the error message:

-----
{error_message}
-----


Take a deep breath, and solve the problem step by step.
"""

import json
from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")


class CodeFix(BaseModel):
    reasoning: str = Field(
        description="The undelrying reason for the error and the fix"
    )
    code: str = Field(description="The new fixed version of the code")


structured_llm = llm.with_structured_output(CodeFix)


def fix_code(code, error_message):

    prompt = prompt_template.format(
        code=code,
        error_message=error_message,
    )

    res = structured_llm.invoke(prompt)

    output = {
        "code": res.code,
        "reasoning": res.reasoning,
    }

    print("Returining ", output)
    return output
