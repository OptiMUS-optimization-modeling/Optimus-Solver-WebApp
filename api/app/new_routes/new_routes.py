from flask import Blueprint, request, jsonify, current_app, session
import json

import threading
from copy import deepcopy

from api.app.utils.misc import get_unique_id
from api.app.utils.communication import process_with_retries

from .formulate_clauses import formulate_clause
from .extract_params import extract_params
from .extract_clauses import extract_clauses
from .code_clause import code_clause
from api.app.routes.auth.auth import login_required, check_project_ownership

from redis import Redis

bp = Blueprint("new_routes", __name__)


def handle_request_async(function, user_id, project_id, data):
    request_id = get_unique_id()

    athread = threading.Thread(
        target=process_with_retries,  # Changed 'clause' to 'target'
        args=(
            current_app.app_context(),
            request_id,
            3,
            function,
            user_id,
            project_id,
            data,
        ),
    )
    athread.start()
    return jsonify({"received": True, "request_id": request_id}), 200


def extract_params_wrapper(user_id, project_id, data):
    res = extract_params(data)
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    print(json.dumps(res, indent=4))
    project.update(
        {
            "problemDescription": data["problemDescription"],
            "problemSummary": res["problemSummary"],
            "parameters": {
                get_unique_id(): {
                    "definition": res["parameters"][p]["definition"],
                    "shape": res["parameters"][p]["shape"],
                    "symbol": p,
                }
                for p in res["parameters"]
            },
            "formattedDescription": res["formattedDescription"],
        }
    )


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


def formulate_clause_wrapper(user_id, project_id, data):

    print("-------DATA:   ", json.dumps(data, indent=4))

    clause_type = data["clauseType"]
    if clause_type == "objective":
        clause_id = 0
    else:
        clause_id = data["clause"]["id"]

    new_data = deepcopy(data)  # Changed to deep copy

    parameters = {
        new_data["parameters"][p]["symbol"]: {
            "shape": new_data["parameters"][p]["shape"],
            "definition": new_data["parameters"][p]["definition"],
        }
        for p in new_data["parameters"]
    }

    new_data["parameters"] = parameters

    variables = {
        new_data["variables"][v]["symbol"]: {
            "definition": new_data["variables"][v]["definition"],
            "type": new_data["variables"][v]["type"],
            "shape": new_data["variables"][v]["shape"],
        }
        for v in new_data["variables"]
    }
    new_data["variables"] = variables

    res = formulate_clause(new_data)

    print("-------RESULTS:   ", json.dumps(res, indent=4))

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    # Retrieve current variables and add new variables
    current_variables = project.get().to_dict().get("variables", {})
    current_variable_symbols = [
        current_variables[v]["symbol"] for v in current_variables
    ]
    new_variables = {
        get_unique_id(): {
            "definition": v["definition"],
            "type": v["type"],
            "shape": v["shape"],
            "symbol": symbol,
        }
        for symbol, v in res["new_variables"].items()
        if symbol not in current_variable_symbols
    }
    updated_variables = {**current_variables, **new_variables}
    project.update({"variables": updated_variables})

    if clause_type == "objective":
        project.update(
            {
                "objective": [
                    {
                        "description": project.get()
                        .to_dict()
                        .get("objective", [{}])[0]["description"],
                        "formulation": res["formulation"],
                        "parametersUsed": res["parameters_used"],
                        "variablesUsed": res["variables_used"],
                    }
                ]
            }
        )
    elif clause_type == "constraint":
        constraints = project.get().to_dict().get("constraints", [])
        for constraint in constraints:
            if constraint["id"] == clause_id:
                constraint.update(
                    {
                        "id": clause_id,
                        "description": constraint["description"],
                        "formulation": res["formulation"],
                        "parametersUsed": res["parameters_used"],
                        "variablesUsed": res["variables_used"],
                    }
                )
        project.update({"constraints": constraints})


def code_clause_wrapper(user_id, project_id, data):
    clause_type = data["clauseType"]
    if clause_type == "objective":
        clause_id = 0
    else:
        clause_id = data["clause"]["id"]

    new_data = deepcopy(data)  # Changed to deep copy

    print("-------DATA:   ", json.dumps(new_data, indent=4))

    related_parameters = {
        new_data["relatedParameters"][p]["symbol"]: {
            "shape": new_data["relatedParameters"][p]["shape"],
            "definition": new_data["relatedParameters"][p]["definition"],
        }
        for p in new_data["relatedParameters"]
    }

    new_data["related_parameters"] = related_parameters

    related_variables = {
        new_data["relatedVariables"][v]["symbol"]: {
            "definition": new_data["relatedVariables"][v]["definition"],
            "type": new_data["relatedVariables"][v]["type"],
            "shape": new_data["relatedVariables"][v]["shape"],
        }
        for v in new_data["relatedVariables"]
    }
    new_data["relatedVariables"] = related_variables

    res = code_clause(new_data)

    print("-------RESULTS:   ", json.dumps(res, indent=4))

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    if clause_type == "objective":
        objective = project.get().to_dict().get("objective", [{}])[0]
        project.update(
            {
                "objective": [
                    {
                        "description": objective["description"],
                        "formulation": objective["formulation"],
                        "parametersUsed": objective["parametersUsed"],
                        "variablesUsed": objective["variablesUsed"],
                        "code": res["code"],
                    }
                ]
            }
        )
    elif clause_type == "constraint":
        constraints = project.get().to_dict().get("constraints", [])
        for constraint in constraints:
            if constraint["id"] == clause_id:
                constraint.update(
                    {
                        "id": clause_id,
                        "description": constraint["description"],
                        "formulation": constraint["formulation"],
                        "parametersUsed": constraint["parametersUsed"],
                        "variablesUsed": constraint["variablesUsed"],
                        "code": res["code"],
                    }
                )
        project.update({"constraints": constraints})


@bp.route("/extract_params", methods=["POST"])
@login_required
@check_project_ownership
def handle_extract_params():

    data = request.json
    project_id = data["project_id"]
    user_id = session["user_id"]

    print(
        f"Extracting params for project {project_id} with user {user_id},\ndata: {data}"
    )
    return handle_request_async(extract_params_wrapper, user_id, project_id, data)


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


@bp.route("/formulate_clause", methods=["POST"])
@login_required
def handle_formulation():
    data = request.json
    project_id = data["project_id"]
    user_id = session["user_id"]

    print(
        f"Formulating clause for project {project_id} with user {user_id},\ndata: {data}"
    )
    return handle_request_async(formulate_clause_wrapper, user_id, project_id, data)


@bp.route("/code_clause", methods=["POST"])
def handle_code_clause():
    data = request.json
    project_id = data["project_id"]
    user_id = session["user_id"]

    print(
        f"Formulating clause for project {project_id} with user {user_id},\ndata: {data}"
    )
    return handle_request_async(code_clause_wrapper, user_id, project_id, data)
