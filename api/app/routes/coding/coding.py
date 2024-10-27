from flask import Blueprint, request, jsonify, current_app, session
import json
from copy import deepcopy

from api.app.utils.misc import get_unique_id, handle_request_async
from api.app.routes.auth.auth import login_required, check_project_ownership
from api.app.functionalities.coding.code_clause import code_clause

bp = Blueprint("code_clauses", __name__)


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

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    new_data["solver"] = project.get().to_dict().get("solver", "none")

    res = code_clause(new_data)

    print("-------RESULTS:   ", json.dumps(res, indent=4))

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


@bp.route("/codeClause", methods=["POST"])
@login_required
def handle_code_clause():
    data = request.json
    project_id = data["project_id"]
    user_id = session["user_id"]

    print(
        f"Formulating clause for project {project_id} with user {user_id},\ndata: {data}"
    )
    return handle_request_async(code_clause_wrapper, user_id, project_id, data)
