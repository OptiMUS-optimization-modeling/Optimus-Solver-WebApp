from flask import Blueprint, request, jsonify, current_app, session
import json

import threading

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
                }
                for c in res["constraints"]
            ],
            "objective": [
                {
                    "id": get_unique_id(),
                    "description": res["objective"],
                }
            ],
        }
    )


def formulate_clause_wrapper(user_id, project_id, data):
    res = formulate_clause(data)
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    project.update(
        {
            "formulation": res["formulation"],
            "newVariables": res["new_variables"],
            "parametersUsed": res["parameters_used"],
            "variablesUsed": res["variables_used"],
        }
    )


def code_clause_wrapper(user_id, project_id, data):
    res = code_clause(data)
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    project.update(
        {
            "code": res["code"],
        }
    )


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
    return handle_request_async(formulate_clause_wrapper, data)


@bp.route("/code_clause", methods=["POST"])
def handle_code_clause():
    data = request.json
    return handle_request_async(code_clause_wrapper, data)
