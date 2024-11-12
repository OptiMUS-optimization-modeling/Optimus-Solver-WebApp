from flask import Blueprint, request, jsonify, current_app, session
import json
from copy import deepcopy
import time

from api.app.utils.misc import get_unique_id, handle_request_async
from api.app.routes.auth.auth import login_required, check_project_ownership
from api.app.functionalities.formulation.formulate_clause import formulate_clause
import random

bp = Blueprint("formulation", __name__)


def formulate_clause_wrapper(user_id, project_id, data):

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

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    new_data["solver"] = project.get().to_dict().get("solver", "none")

    res = formulate_clause(new_data)

    print("-------RESULTS:   ", json.dumps(res, indent=4))

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
                        "formulationConfidence": res["formulationConfidence"],
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
                        "formulationConfidence": res["formulationConfidence"],
                    }
                )
        project.update({"constraints": constraints})

    time.sleep(0.5)


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
