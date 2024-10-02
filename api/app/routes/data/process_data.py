from flask import Blueprint, request, jsonify, current_app
import json
import numpy as np
from api.app.routes.auth.auth import login_required


bp = Blueprint("process_data", __name__)


@bp.route("/uploadData", methods=["POST"])
@login_required
def process_data():
    # Check if the file is in the request
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 200

    file = request.files["file"]
    parameters = request.form.get("parameters")

    # If the user does not select a file, the browser submits an
    # empty file without a filename.
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 200

    try:
        parameters = json.loads(parameters)
    except Exception as e:
        print(e)
        return (jsonify({"error": "Can't load the parameters list!"}), 200)

    if file:
        # Assuming the file is a JSON file, parse it
        try:
            data = json.load(file)
        except Exception as e:
            print(e)
            return (jsonify({"error": "Can't load the json file!"}), 200)
    else:
        return (jsonify({"error": "Didn't receive any file!"}), 200)

    all_symbols = [p["symbol"] for p in parameters.values()]
    for key in data.keys():
        if not key in all_symbols:
            return (jsonify({"error": f"Key {key} is not in parameters"}), 200)

    for key in all_symbols:
        if not key in data:
            return (jsonify({"error": f"Parameter {key} is not in data"}), 200)

        print("=" * 20)
        print(json.dumps(data, indent=4))
        print(json.dumps(parameters, indent=4))
        print("=" * 20)

        for p in parameters:
            parameters[p]["status"] = "pass"
            # turn string into list of strings (e.g. "['M', 'N']" -> ["M", "N"])
            # parameters[p]["shape"] = parameters[p]["shape"].replace("'", '"')
            print(p, parameters[p]["shape"], type(parameters[p]["shape"]))

            try:
                if isinstance(parameters[p]["shape"], str):
                    parameters[p]["shape"] = parameters[p]["shape"].replace("'", '"')
                    parameters[p]["shape"] = json.loads(parameters[p]["shape"])
                if not isinstance(parameters[p]["shape"], list):
                    parameters[p]["status"] = "Shape is not a list!"
                    continue
            except Exception as e:
                print(e)
                parameters[p]["status"] = "Shape is invalid!"
                continue

            actual_shape = []
            for item in parameters[p]["shape"]:
                if not isinstance(item, str):
                    parameters[p]["status"] = "Shape is not a list of strings!"
                    break

                if not item in all_symbols:
                    parameters[p][
                        "status"
                    ] = f"Shape contains an unknown parameter: {item}"
                    break

                # make sure data[item] is a number
                if not isinstance(data[item], (int)):
                    parameters[p][
                        "status"
                    ] = f"Shape contains a parameter that is not an integer: {item}"
                    break
                actual_shape.append(data[item])

            # make sure the shape matches the data
            if parameters[p]["status"] != "pass":
                continue

            try:
                np_arr = np.array(data[parameters[p]["symbol"]])
                # make sure the shape matches the data

                if not np_arr.shape == tuple(actual_shape):
                    parameters[p][
                        "status"
                    ] = f"Shape does not match the data for parameter {parameters[p]['symbol']}. Data shape: {np_arr.shape}, parameter shape: {tuple(actual_shape)}"
                    continue

            except Exception as e:
                print(e)
                parameters[p]["status"] = "Data is not a valid array!"
                continue
        all_pass = True
        for p in parameters:
            if parameters[p]["status"] != "pass":
                all_pass = False
            parameters[p]["shape"] = str(parameters[p]["shape"])
        return jsonify({"all_pass": all_pass, "parameters": parameters}), 200

    else:
        return (
            jsonify(
                {"error": "Something went wrong. Please contact teshnizi@stanford.edu"}
            ),
            200,
        )


@bp.route("/generateDummyData", methods=["POST"])
@login_required
def generate_dummy_data():

    project_id = request.json.get("project_id")
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    parameters = project_data.get("parameters", {})

    data = {}
    for p in parameters:
        shape = parameters[p]["shape"]
        if isinstance(shape, str):
            shape = json.loads(shape)
        data[p] = np.random.rand(*shape).tolist()
    return data
