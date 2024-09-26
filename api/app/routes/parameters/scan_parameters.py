import json
from flask import Blueprint, current_app, request, jsonify, session
import time

from api.app.utils.misc import get_unique_id
from api.app.routes.auth.auth import login_required, check_project_ownership

bp = Blueprint("scan_parameters", __name__)


@bp.route("/deleteParameter", methods=["POST"])
@login_required
@check_project_ownership
def delete_parameter():
    data = request.json
    user_id = session.get("user_id")
    project_id = data.get("project_id")
    parameter_id = data.get("parameter_id")

    if not parameter_id:
        return jsonify({"error": "Missing parameter_id"}), 400

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    parameters = project.get().to_dict().get("parameters", {})
    if not parameter_id in parameters:
        return jsonify({"error": "Parameter not found!"}), 400

    del parameters[parameter_id]
    project.update({"parameters": parameters})

    print("done")
    return jsonify({"success": "Parameter deleted!"}), 200


@bp.route("/addParameter", methods=["POST"])
@login_required
@check_project_ownership
def add_parameter():
    data = request.json
    user_id = session.get("user_id")
    project_id = data.get("project_id")

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    parameters = project.get().to_dict().get("parameters", {})

    print("HE ", parameters)
    print("&" * 10)
    parameters[get_unique_id()] = {
        "symbol": "",
        "shape": "",
        "definition": "",
        "value": "",
        "status": "",
    }
    project.update({"parameters": parameters})

    print("done")
    return jsonify({"success": "Parameter added!"}), 200


@bp.route("/updateParameter", methods=["POST"])
@login_required
@check_project_ownership
def update_parameter():

    try:
        data = request.json
        user_id = session.get("user_id")

        project_id = data.get("project_id")
        parameter_id = data.get("parameter_id")
        symbol = data.get("symbol")
        shape = data.get("shape")
        definition = data.get("definition")

        if not parameter_id:
            return jsonify({"error": "Missing parameter_id"}), 400

        db = current_app.clients["firestore_client"]
        project = db.collection("projects").document(project_id)

        parameters = project.get().to_dict().get("parameters", {})

        print(parameters)
        if not parameter_id in parameters:
            return jsonify({"error": "Parameter not found!"}), 400

        parameters[parameter_id]["symbol"] = symbol
        parameters[parameter_id]["shape"] = shape
        parameters[parameter_id]["definition"] = definition

        print(json.dumps(parameters, indent=4))
        project.update({"parameters": parameters})

        print("done")

        return jsonify({"success": "Parameter updated!"}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Something went wrong! Please try again later."}), 400
