from flask import Blueprint, request, jsonify, current_app, session
import json
import time
from api.app.utils.misc import get_unique_id, handle_request_async
from api.app.routes.auth.auth import login_required, check_project_ownership
from api.app.functionalities.extract_params import extract_params


bp = Blueprint("analyze", __name__)


def extract_params_wrapper(user_id, project_id, data):
    res = extract_params(data)
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    print(json.dumps(res, indent=4))
    project.update(
        {
            "problemDescription": data["problemDescription"],
            "background": res["background"],
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

    time.sleep(0.5)


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
