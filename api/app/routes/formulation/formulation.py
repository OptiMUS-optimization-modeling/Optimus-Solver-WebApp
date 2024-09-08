prompt_template = """
You are an expert mathematical formulator and an optimization professor at a top university. Your task is to model {targetType} of the problem in the standard LP or MILP form.

Here's a {targetType} we need you to model:

-----
{targetDescription}
-----

and here is the list of available variables:

-----
{variables}
-----

and finally, here is list of available input parameters:

-----
{parameters}
-----

First, take a deep breath and explain how we should define the {targetType}. Feel free to define new variables if you think it's necessary.
Then, generate a json file accordingly with the following format:


{{
    "{targetType}": {{
      "description": "A description of the {targetType}",
      "formulation": "A formulation of the {targetType} in LaTeX mathematical format",
    }}
    "new_variables": [
        "definition": "A definition of the variable",
        "symbol": "A symbol for the variable",
        "shape": [ "symbol1", "symbol2", ... ],
    ]
    "variables_used": [ "symbol1", "symbol2", ... ],
    "parameters_used": [ "symbol1", "symbol2", ... ],
}}



- Don't include dimension parameters in parameters_used. 
- Your formulation should be in LaTeX mathematical format (do not include the $ symbols).
- Note that I'm going to use python json.loads() function to parse the json file, so please make sure the format is correct (don't add ',' before enclosing '}}' or ']' characters.
- Generate the complete json file and don't omit anything.
- Use '```json' and '```' to enclose the json file.
- Use CamelCase and full words for symbols, and do not include indices in the symbol (e.g. ItemsSold instead of itemsSold or items_sold or ItemsSold_i)
- Use \\textup{{}} when writing variable and parameter names. For example (\\sum_{{i=1}}^{{N}} \\textup{{ItemsSold}}_{{i}} instead of \\sum_{{i=1}}^{{N}} ItemsSold_{{i}})
- Use \\quad for spaces.
- Use braces for "for all" and "for any", and put it at the end of the expression (e.g. \\forall i \\in {{1,2, \\ldots, N}})
- Use empty list ([]) if any of the lists are empty (for example, if there are no parameters used, use "parameters_used": []).

"""

from flask import Blueprint, request, jsonify, current_app, session
import json
import time
import threading


from app.utils.misc import get_unique_id
from app.utils.communication import get_llm_response, process_with_retries
from app.routes.auth.auth import login_required, check_project_ownership


bp = Blueprint("formulate_targets", __name__)


def formulate_target(target, target_type, user_id, project_id):

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    variables = project.get().to_dict().get("variables", {})
    parameters = project.get().to_dict().get("parameters", {})

    prompt = prompt_template.format(
        targetType=target_type,
        targetDescription=target["description"],
        variables=json.dumps(
            [
                {
                    "definition": variables[v]["definition"],
                    "symbol": variables[v]["symbol"],
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
                    "symbol": parameters[p]["symbol"],
                    "shape": parameters[p]["shape"],
                }
                for p in parameters
            ],
            indent=4,
        ),
    )

    output = get_llm_response(prompt)

    output = output[output.find("```json") + 7 :]
    output = output[: output.rfind("```")]

    # go back until the last character is a }
    while output[-1] != "}":
        output = output[:-1]

    # go forward until the first character is a {
    while output[0] != "{":
        output = output[1:]

    # if there are '$' in the output, remove them
    if "$" in output:
        output = output.replace("$", "")

    # find "formulation": " in output
    formulation_start = output.find('"formulation"')
    # find "new_variables": " in output
    new_variables_start = output.find('"new_variables"')
    # go back until you find a closed bracket
    while output[new_variables_start] != "}":
        new_variables_start -= 1
    while output[new_variables_start] != '"':
        new_variables_start -= 1

    # extract the formulation
    formulation = output[formulation_start + 16 : new_variables_start]
    # remove it from the output
    output = output[: formulation_start + 16] + output[new_variables_start:]

    formulation = formulation.replace("\\\\", "\\")

    update = json.loads(output)

    update[target_type]["formulation"] = formulation

    all_symbols = [v["symbol"] for v in variables.values()]

    for variable in update["new_variables"]:
        if variable["symbol"] in all_symbols:
            raise Exception(f"Variable {variable['symbol']} already exists!")
        else:
            id = get_unique_id()
            variable["status"] = "formulated"
            variables[id] = variable
            all_symbols.append(variable["symbol"])
            if not variable["symbol"] in update["variables_used"]:
                update["variables_used"].append(variable["symbol"])

    target["description"] = update[target_type]["description"]
    target["formulation"] = update[target_type]["formulation"]
    target["status"] = "formulated"

    target["related_variables"] = (
        update["variables_used"]
        if ("variables_used" in update and update["variables_used"] != None)
        else []
    )
    target["related_parameters"] = (
        update["parameters_used"]
        if ("parameters_used" in update and update["parameters_used"] != None)
        else []
    )

    # find the user's projects in the database
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    if not project.get().exists:
        return jsonify({"error": "Project not found"}), 404
    else:
        print("=====")
        print(target_type, target)
        if target_type == "constraint":
            target_type = "constraints"

        project_data = project.get().to_dict()
        target_array = project_data[target_type]

        print(target_array)
        print("==== ", target["description"])
        # Find and update the target in the array
        for t in target_array:
            if t["id"] == target["id"]:
                print("found it!")
                t.update(target)
                break

        # print("Herererere")
        # print(target_type)
        # print(target_array)
        # print("Herererere")
        # Now update the array in Firestore
        project.update({target_type: target_array})

        # Now update the variables in Firestore
        project.update({"variables": variables})

    return {"target": target, "variables": variables}
    # return target, variables


@bp.route("/formulateTarget", methods=["POST"])
@login_required
@check_project_ownership
def handle_formulation():
    target = request.json["target"]
    target_type = request.json["target_type"]
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")

    # Start the long-running task in a separate thread

    request_id = request.json["request_id"]
    athread = threading.Thread(
        target=process_with_retries,
        args=(
            current_app.app_context(),
            request_id,
            3,
            formulate_target,
            target,
            target_type,
            user_id,
            project_id,
        ),
    )

    athread.start()

    return jsonify({"received": True, "request_id": request_id}), 200
