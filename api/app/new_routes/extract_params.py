prompt_template = """
You are an expert mathematical modeler and an optimization professor at a top university. Your task is to read a given optimization problem. Your goal is to identify the parameters in the problem description (parameters are known values upon which the model is built, and they do not change during the optimization process).

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

Take a deep breath and tackle the problem step by step.
"""


import json
from flask import Blueprint, request, jsonify, current_app, session
import time
import threading
import json
from pydantic.v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

from api.app.utils.misc import get_unique_id
from api.app.utils.communication import get_llm_response, process_with_retries
from api.app.routes.auth.auth import login_required

bp = Blueprint("extract_params", __name__)


class Parameter(BaseModel):
    definition: str = Field(description="The definition of the parameter")
    symbol: str = Field(
        description="The symbol of the parameter (CamelCase or single capital letter for scalar parameters used to define the dimensions of other parameters)"
    )
    value: str = Field(
        description="The value of the parameter (if it is given in the description)"
    )
    shape: str = Field(
        description="The shape of the parameter (a potentially-empty list of other parameters, e.g. [N, M] or [] for a scalar)"
    )


class ReformattedProblem(BaseModel):
    parameters: list[Parameter] = Field(description="The list of parameters")
    reformattedDescription: str = Field(
        description="The reformatted problem description where the problem statement has been rewritten to use the accurate parameter symbols."
    )
    problemSummary: str = Field(description="A 2-3 sentence summary of the problem.")


structured_llm = llm.with_structured_output(ReformattedProblem)


def transform_description(description):
    prompt = prompt_template.format(description=description)
    parameters = structured_llm.invoke(prompt)

    output = {
        "parameters": {
            p.symbol: {
                "definition": p.definition,
                # "value": p.value,
                "shape": p.shape,
            }
            for p in parameters.parameters
        },
        "reformattedDescription": parameters.reformattedDescription,
        "problemSummary": parameters.problemSummary,
    }

    return output


@bp.route("/extract_params", methods=["POST"])
def extract_params():
    data = request.json

    print("working on it...")
    description = data["problemDescription"]
    request_id = data["request_id"]

    if not request_id:
        return jsonify({"error": "Missing request_id"}), 400

    # Start the long-running task in a separate thread
    athread = threading.Thread(
        target=process_with_retries,
        args=(
            current_app.app_context(),
            request_id,
            3,
            transform_description,
            description,
        ),
    )

    athread.start()

    return jsonify({"received": True, "request_id": request_id}), 200
