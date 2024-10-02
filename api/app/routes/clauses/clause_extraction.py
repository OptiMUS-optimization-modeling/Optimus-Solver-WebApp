from flask import Blueprint, request, jsonify, current_app, session
import json
import numpy as np
import time
import random
import string

from api.app.utils.misc import get_unique_id
from api.app.routes.auth.auth import login_required, check_project_ownership


bp = Blueprint("extract_targets", __name__)


from flask import Blueprint, request, jsonify, current_app, session
import json
from copy import deepcopy
import time

from api.app.utils.misc import get_unique_id, handle_request_async
from api.app.routes.auth.auth import login_required, check_project_ownership
from api.app.functionalities.extract_clauses import extract_clauses

bp = Blueprint("extract_clauses", __name__)


def extract_clauses_wrapper(user_id, project_id, data):
    res = extract_clauses(data)
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    print(json.dumps(res, indent=4))

    project.update(
        {
            "constraints": [
                {
                    "id": c,
                    "description": res["constraints"][c]["description"],
                    "type": res["constraints"][c]["type"],
                    "formulation": "",
                    "code": "",
                }
                for c in res["constraints"]
            ],
            "objective": [
                {
                    "id": get_unique_id(),
                    "description": res["objective"],
                    "formulation": "",
                    "code": "",
                }
            ],
        }
    )

    project_data = project.get().to_dict()
    return {
        "background": project_data.get("background"),
        "objective": project_data.get("objective"),
    }


@bp.route("/extract_clauses", methods=["POST"])
@login_required
def handle_extract_clauses():
    data = request.json
    project_id = data["project_id"]
    user_id = session["user_id"]

    print(
        f"Extracting clauses for project {project_id} with user {user_id},\ndata: {data}"
    )
    return handle_request_async(extract_clauses_wrapper, user_id, project_id, data)


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
    symbol = request.json.get("symbol")
    shape = request.json.get("shape")
    definition = request.json.get("definition")
    type = request.json.get("type")

    print("user_id: ", user_id)
    print("project_id: ", project_id)
    print("variable_id: ", variable_id)
    print("symbol: ", symbol)
    print("shape: ", shape)
    print("definition: ", definition)
    print("type: ", type)

    shape = [x.replace('"', "").replace("'", "") for x in shape]

    # find the user's projects in the database

    if not variable_id:
        return jsonify({"error": "Missing variable_id"}), 400

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    variables = project.get().to_dict().get("variables", {})

    if not variable_id in variables:
        return jsonify({"error": "Variable not found!"}), 400

    variables[variable_id]["symbol"] = symbol
    variables[variable_id]["shape"] = shape
    variables[variable_id]["definition"] = definition
    variables[variable_id]["type"] = type

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
