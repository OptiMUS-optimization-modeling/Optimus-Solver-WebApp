prompt_template = """
You are an expert mathematical modeler and an optimization professor at a top university. Your task is to read a given optimization problem, and re-write it in a text-book format.

Here is the problem:

-----
{description}
-----

you should go through the statements one by one, and identify and separate the parameters of the problem, and put them in a json file and a string in this format:

=====
{{
    "parameters": {{
        "definition": str
        "symbol": str
        "value": number
        "shape": [str]
    }}
}}
=====
*updated description* 
=====

Where 
- "definition" is the the definition of the parameter.
- "symbol" is the mathematical symbol you want to use to represent the parameter.
- "value" a float or int, representing the numerical value of the variable (use 0.33 instead of 1/3.0)
- "shape" is a possibly empty list of string representing the dimensions of the parameter in terms of other parameters.
- *updated description* is the original description of the problem with its numbers replaced with the corresponding variable symbols.

Here is an example:

*** input ***

A firm produces M different goods using 10 different raw materials. The firm has available_{{i}} of raw material i available. Good j requires req_{{i,j}} units of material i per unit produced. Good j results in a revenue of price_{{j}} per unit produced. How much of each good should the firm produce in order to maximize its total revenue?


*** output ***

=====
{{
    "parameters": [
    {{
        "definition": "Number of different goods produced",
        "symbol": "M",
        "value": ""
        "shape": []
    }},
    {{
        "definition": "Number of different raw materials",
        "symbol": "N",
        "value": 10,
        "shape": []
    }}
    {{
        "definition": "Amount of raw material i available",
        "symbol": "Available",
        "value": "",
        "shape": ["N"]
    }},
    {{
        "definition": "Amount of raw material i required to produce one unit of good j",
        "symbol": "Required",
        "value": "",
        "shape": ["N", "M"]
    }},
    {{
        "definition": "Price of good j",
        "symbol": "Price",
        "value": "",
        "shape": ["M"]
    }}
    ]
}}
=====
A firm produces \\param{{M}} different goods using \\param{{N}} different raw materials. The firm has \\param{{Available}} of raw material i available. Good j requires \\param{{Required}} units of material i per unit produced. Good j results in a revenue of \\param{{Price}} per unit produced. How much of each good should the firm produce in order to maximize its total revenue?
=====

- Only generate the json file and the updated description, and do not generate anything else.
- Include the ===== lines in the output.
- Avoid using fractions and use floating point numbers instead (0.2 instead of 1/5)
- Note that indices are not separate parameters.
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


from api.app.utils.misc import get_unique_id
from api.app.utils.communication import get_llm_response, process_with_retries
from api.app.routes.auth.auth import login_required

bp = Blueprint("analyze", __name__)


def transform_description(description, user_id, project_id):
    prompt = prompt_template.format(description=description)
    output = get_llm_response(prompt)

    output = output.split("=====")
    output = [x.strip() for x in output if len(x.strip()) > 0]

    output_json = output[0]
    output_desc = output[1]

    if "```json" in output_json:
        # delete until the first '```json'
        output_json = output_json[output_json.find("```json") + 7 :]

        # delete until the last '```'
        output_json = output_json[: output_json.rfind("```")]

    update = json.loads(output_json)
    update["formattedDescription"] = output_desc

    print(user_id)
    print(project_id)

    update["parameters"] = {
        get_unique_id(): {
            "definition": param["definition"],
            "symbol": param["symbol"],
            "value": param["value"],
            "shape": str(param["shape"]),
            "status": "",
        }
        for param in update["parameters"]
    }

    # find the user's projects in the database
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    project.update(
        {
            "description": description,
            "formattedDescription": update["formattedDescription"],
            "parameters": update["parameters"],
            "user_id": user_id,
        }
    )

    return update


@bp.route("/analyze", methods=["POST"])
@login_required
def analyze():
    data = request.json

    print("working on it...")
    description = data["problemDescription"]
    request_id = data["request_id"]

    user_id = session.get("user_id")
    project_id = data.get("project_id")

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
            user_id,
            project_id,
        ),
    )

    athread.start()

    return jsonify({"received": True, "request_id": request_id}), 200
