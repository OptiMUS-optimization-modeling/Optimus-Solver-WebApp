import json
from flask import Blueprint, current_app, request, jsonify, session
import time

from api.app.utils.misc import get_unique_id
from api.app.routes.auth.auth import login_required, check_project_ownership

bp = Blueprint("scan_parameters", __name__)


# @bp.route("/scanParameters", methods=["POST"])
# @login_required
# def scan_parameters():
#     data = request.json
#     update = "received!"

#     parameters = data["parameters"]
#     formattedDescription = data["formattedDescription"] + " "

#     print(parameters)
#     print(formattedDescription)

#     # wait for 0.5 seconds
#     time.sleep(0.5)

#     extracted_parameters = []

#     try:
#         for i in range(len(formattedDescription)):
#             if formattedDescription[i : i + 7] == "\\param{":
#                 # find the end of the parameter
#                 end = i + 7
#                 open_brackets = 1
#                 while open_brackets > 0:
#                     if formattedDescription[end] == "{":
#                         open_brackets += 1
#                     elif formattedDescription[end] == "}":
#                         open_brackets -= 1

#                     end += 1
#                     if end >= len(formattedDescription):
#                         raise Exception("Malformed Description!")
#                 extracted_parameters.append(formattedDescription[i + 7 : end - 1])
#     except Exception as e:
#         print(e)
#         return (
#             jsonify(
#                 {
#                     "error": "Malformed Description! Please make sure all parameters are properly marked using \\param{}"
#                 }
#             ),
#             200,
#         )

#     print("====")
#     print(extracted_parameters)
#     updated_parameters = {}

#     for p in parameters:
#         if parameters[p]["symbol"] in extracted_parameters:
#             updated_parameters[p] = parameters[p]

#     all_symbols = [p["symbol"] for p in parameters.values()]
#     for param in extracted_parameters:
#         if not param in all_symbols:
#             updated_parameters[get_unique_id()] = {
#                 "symbol": param,
#                 "shape": "",
#                 "definition": "",
#                 "value": "",
#                 "status": "",
#             }

#     print(json.dumps(updated_parameters, indent=4))

#     update = {
#         "parameters": updated_parameters,
#     }

#     return jsonify(update), 200


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
