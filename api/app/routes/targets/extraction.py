prompt_template = """
You are an expert mathematical formulator and an optimization professor at a top university. Your task is read the description of an optimization problem, understand it, and write it into standard optimization format.
-----
{description}
-----

You should read and understand the problem and identify 1) implicit constraints, 2) explicit constraints, 3) the objective, and 4) background and cotext. If there are any ambiguities in the problem description, you should identify them and write them down in the following format:

{{
    "ambiguities": [str]
}}

otherwise, generate a json file with the following format:

{{
    "background": "Some context on the problem like where it is happening, who and what is involved, etc.",
    "implicit_constraints": ["list", "of", "strings"],
    "explicit_constraints": ["list", "of", "strings"],
    "objective": "What the company aims to optimize"
}}


Here's an example:  

*** input ***

An office supply company makes two types of printers: color printers and black and white printers. Different sections of the factory with different teams produce each printer. The color printer team can produce at most \\param{{MaxColor}} color printers per day while the black and white printer team can produce at most \\param{{MaxBW}} black and white printers per day. Both teams require use of the same paper tray installing machine and this machine can make at most \\param{{MaxTotal}} printers of either type each day. Color printers generate a profit of \\param{{ProfitColor}} per printer while black and white printers generate a profit of \\param{{ProfitBW}} per printer. How many of each printer should be made to maximize the company's profit?
*** output ***


*** output ***
{{
    "background": "An office supply company makes two types of printers: color printers and black and white printers."
    
    "implicit_constraints": [
        "Number of color printers is integral",
        "Number of black and white printers is integral",
        "Number of color printers is non-negative", 
        "Number of black and white printers is non-negative"]
    ],
        
    "explicit_constraints": [
        "The company can make at most MaxColor color printers per day",
        "The company can make at most MaxBW black and white printers per day",
        "The company can make at most a total of MaxTotal printers per day",
    ],
    "objective": "The company aims to maximize its profit"
}}


- First take a deep breath, read the problem, and understand it. Then, generate the full json file.
- Do not combine multiple constraints into one constraint. Similarly, do not put the objective in the background.
- Use CamelCase for parameter names.

Take a deep breath, and solve the problem step by step.
"""

from flask import Blueprint, request, jsonify, current_app, session
import json
import numpy as np
import time
import random
import string

from api.app.utils.misc import get_unique_id
from api.app.routes.auth.auth import login_required, check_project_ownership


bp = Blueprint("extract_targets", __name__)


def extract_target(client, description):
    prompt = prompt_template.format(description=description)

    completion = client.chat.completions.create(
        model="gpt-4-1106-preview",
        messages=[
            {"role": "user", "content": prompt},
        ],
    )

    output = completion.choices[0].message.content

    print("-=" * 10)
    print(output)
    print("-=" * 10)

    output_json = output

    if "```json" in output_json:
        # delete until the first '```json'
        output_json = output_json[output_json.find("```json") + 7 :]

        # delete until the last '```'
        output_json = output_json[: output_json.rfind("```")]

    update = json.loads(output_json)

    update["constraints"] = [
        {
            "description": x,
            "formulation": "",
            "code": "",
        }
        for x in update["implicit_constraints"] + update["explicit_constraints"]
    ]

    del update["explicit_constraints"]
    del update["implicit_constraints"]

    update["objective"] = [
        {
            "description": update["objective"],
            "formulation": "",
            "code": "",
        }
    ]

    return update


@bp.route("/extractTargets", methods=["POST"])
@login_required
@check_project_ownership
def extract_constraints():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    formattedDescription = request.json.get("formattedDescription") + " "
    constraints = []

    print(formattedDescription)

    project = (
        current_app.clients["firestore_client"]
        .collection("projects")
        .document(project_id)
        .get()
    )

    print("working on it...")

    cnt = 3
    while cnt > 0:
        try:
            update = extract_target(
                current_app.clients["openai_client"], formattedDescription
            )
            break
        except Exception as e:
            cnt -= 1
            print(e)
            time.sleep(1)

    if cnt == 0:
        return (
            jsonify({"error": "Something went wrong! Please try again later."}),
            400,
        )

    # add a unique id to each constraint and objective
    for i in range(len(update["constraints"])):
        update["constraints"][i]["id"] = get_unique_id()

    for i in range(len(update["objective"])):
        update["objective"][i]["id"] = get_unique_id()

    print(json.dumps(update, indent=4))

    # find the user's projects in the database
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    project.update(
        {
            "formattedDescription": formattedDescription,
            "constraints": update["constraints"],
            "objective": update["objective"],
            "background": update["background"],
        }
    )

    return (
        jsonify(update),
        200,
    )


@bp.route("/updateObjective", methods=["POST"])
@login_required
@check_project_ownership
def update_objective():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    field = request.json.get("field")
    value = request.json.get("value")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)
    print("field: ", field)
    print("value: ", value)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    objective = project_data.get("objective")[0]

    objective[field] = value

    project.update(
        {
            "objective": [objective],
        }
    )

    return (
        jsonify({"success": "Targets updated!"}),
        200,
    )


@bp.route("/updateBackground", methods=["POST"])
@login_required
@check_project_ownership
def update_background():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    background = request.json.get("background")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)
    print("background: ", background)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    project_data["background"] = background

    project.update(
        {
            "background": background,
        }
    )

    return (
        jsonify({"success": "Background updated!"}),
        200,
    )


@bp.route("/addConstraint", methods=["POST"])
@login_required
@check_project_ownership
def add_constraint():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    constraints = project_data.get("constraints", [])

    constraints.append(
        {
            "description": "",
            "formulation": "",
            "code": "",
            "id": get_unique_id(),
        }
    )

    project.update(
        {
            "constraints": constraints,
        }
    )

    return (
        jsonify({"success": "Constraint added!"}),
        200,
    )


@bp.route("/deleteConstraint", methods=["POST"])
@login_required
@check_project_ownership
def delete_constraint():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    constraint_id = request.json.get("constraint_id")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)
    print("constraint_id: ", constraint_id)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    constraints = project_data.get("constraints", [])

    constraints = [x for x in constraints if x["id"] != constraint_id]

    project.update(
        {
            "constraints": constraints,
        }
    )

    return (
        jsonify({"success": "Constraint deleted!"}),
        200,
    )


@bp.route("/updateConstraint", methods=["POST"])
@login_required
@check_project_ownership
def update_constraint():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    constraint_id = request.json.get("constraint_id")
    field = request.json.get("field")
    value = request.json.get("value")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)
    print("constraint_id: ", constraint_id)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    constraints = project_data.get("constraints", [])

    for c in constraints:
        if c["id"] == constraint_id:
            c[field] = value
            break

    project.update(
        {
            "constraints": constraints,
        }
    )

    return (
        jsonify({"success": "Constraint updated!"}),
        200,
    )


@bp.route("/updateVariable", methods=["POST"])
@login_required
@check_project_ownership
def update_variable():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    variable_id = request.json.get("variable_id")
    field = request.json.get("field")
    value = request.json.get("value")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)
    print("variable_id: ", variable_id)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    variables = project_data.get("variables", [])

    variables[variable_id][field] = value

    project.update(
        {
            "variables": variables,
        }
    )

    return (
        jsonify({"success": "Variable updated!"}),
        200,
    )


@bp.route("/deleteVariable", methods=["POST"])
@login_required
@check_project_ownership
def delete_variable():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    variable_id = request.json.get("variable_id")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)
    print("variable_id: ", variable_id)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    variables = project_data.get("variables", {})

    del variables[variable_id]

    project.update(
        {
            "variables": variables,
        }
    )

    return (
        jsonify({"success": "Variable deleted!"}),
        200,
    )


@bp.route("/addVariable", methods=["POST"])
@login_required
@check_project_ownership
def add_variable():
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user_id)
    print("project_id: ", project_id)

    # find the user's projects in the database
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    variables = project_data.get("variables", {})

    variables[get_unique_id()] = {
        "symbol": "",
        "shape": "",
        "definition": "",
        "status": "",
    }

    project.update(
        {
            "variables": variables,
        }
    )

    return (
        jsonify({"success": "Variable added!"}),
        200,
    )
