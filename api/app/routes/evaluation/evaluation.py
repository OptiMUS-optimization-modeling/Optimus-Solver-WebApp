fix_prompt = """
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to debug the code for the {targetType} of the problem.

Here's the code you need to debug:

-----
{error_line}
-----

and here is the error message:

-----
{error_message}
-----

First reason about the source of the error, fix the code and generate a json file with the following format:

{{
    "bug explanation": str,
    "fixed_code": str,
}}

- Bug explanation should be a string that explains the source of the error.
- Fixed code should be the fixed code to be used instead of the bogus code.
- Do not generate anything after the json file.
- Use '```json' and '```' to enclose the json file.

"""


from flask import Blueprint, request, jsonify, current_app, session
import json
import numpy as np
import random
import string
from typing import Dict
import os
import threading


from api.app.utils.communication import get_llm_response, process_with_retries
from api.app.routes.auth.auth import login_required, check_project_ownership

from flask import Blueprint, request, jsonify, current_app, session
import json
from copy import deepcopy

from api.app.utils.misc import get_unique_id, handle_request_async
from api.app.routes.auth.auth import login_required, check_project_ownership
from api.app.functionalities.debugging.fix_code import fix_code
from api.app.functionalities.code_synthesis import piece_code_together

bp = Blueprint("eval", __name__)

# solver_list = json.load(open("api/solver_list.json"))


def prep_problem_json(state):
    for p in state["parameters"]:
        parameter = state["parameters"][p]
        assert "shape" in parameter.keys(), "shape is not defined for parameter"
        assert "symbol" in parameter.keys(), "symbol is not defined for parameter"
        assert (
            "definition" in parameter.keys() and len(parameter["definition"]) > 0
        ), "definition is not defined for parameter"

        if parameter["shape"] and len(parameter["shape"]) > 2:
            code_symbol = parameter["symbol"].split("_")[0]

            parameter["code"] = (
                f'{code_symbol} = np.array(data["{parameter["symbol"]}"])'
            )
        else:
            code_symbol = parameter["symbol"].split("_")[0]
            parameter["code"] = f'{code_symbol} = data["{parameter["symbol"]}"]'

    return state


def run_code(code, data):
    local_env = {}
    print("CODE", code)
    try:
        res = exec(code, local_env, local_env)

        return {
            "success": True,
            "obj_val": local_env["obj_val"] if "obj_val" in local_env else None,
            "status": local_env["status"] if "status" in local_env else None,
            "solving_info": (
                local_env["solving_info"] if "solving_info" in local_env else None
            ),
            "error_message": None,
            "error_traceback": None,
        }
    except Exception as e:
        print(e)
        import traceback

        error_msg = traceback.format_exc()

        return {
            "success": False,
            "error_message": str(e),
            "error_traceback": error_msg,
        }


import importlib


def generate_variable_code(symbol, type, shape, solver):
    prompt_module = importlib.import_module(
        f"api.app.functionalities.coding.prompts.{solver}"
    )
    generate_variable_code_function = prompt_module.generate_variable_code

    return generate_variable_code_function(symbol, type, shape)


@bp.route("/getFullCode", methods=["POST"])
@login_required
@check_project_ownership
def get_full_code():
    # parameters = request.json["parameters"]
    # constraints = request.json["constraints"]
    # objective = request.json["objective"]
    # variables = request.json["variables"]

    # data = request.json["data"]
    project_id = request.json["project_id"]
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    project_data = project.get().to_dict()
    parameters = project_data.get("parameters", {})
    constraints = project_data.get("constraints", {})
    objective = project_data.get("objective", {})
    variables = project_data.get("variables", {})
    solver = project_data.get("solver", "none")

    # iterate over variables and generate the code for the ones that don't have it
    for v in variables:
        variable = variables[v]
        if not variable.get("shape") or len(variable["shape"]) == 0:
            variable["shape"] = []
        variable["code"] = generate_variable_code(
            variable["symbol"], variable["type"], variable["shape"], solver
        )

    # Update the project with the modified variables
    project.update({"variables": variables})

    state = {
        "parameters": parameters,
        "constraints": constraints,
        "objective": objective,
        "variables": variables,
        "solver": solver,
        "data_json_path": f"tmpData/{project_id}/data.json",
    }

    try:
        state = prep_problem_json(state)
        code = piece_code_together(
            state,
            interpret=False,
        )["code"]

    except Exception as e:
        code = "ERROR!: " + str(e)
        print(e)

    project.update({"code": code})

    return {"code": code}, 200


@bp.route("/runCode", methods=["POST"])
@login_required
@check_project_ownership
def get_run_results():

    print("SSSS")
    data = request.json["data"]
    code = request.json["code"]
    project_id = request.json["project_id"]

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    project.update({"code": code})
    solver = project.get().to_dict().get("solver", "none")

    # if tmp folder doesn't exist, create it
    if not os.path.exists("tmpData/"):
        os.mkdir("tmpData/")

    name = project_id
    path = f"tmpData/{name}"
    print("PATH", path)
    print("DATA", data)
    if not os.path.exists(path):
        os.mkdir(path)
    with open(f"{path}/data.json", "w") as f:
        json.dump(data, f)

    with open(f"{path}/data.json", "r") as f:
        tmp = f.read()
        print("TMP", tmp)

    state = {
        "solver": solver,
        "data_json_path": f"{path}/data.json",
    }

    run_result = run_code(code, data)

    print("====$$")
    print(json.dumps(run_result, indent=4))
    print("====")

    # delete the tmp folder
    os.system(f"rm -rf {path}")

    return jsonify({"success": run_result["success"], "run_result": run_result}), 200


@bp.route("/updateCode", methods=["POST"])
@login_required
@check_project_ownership
def update_code():
    project_id = request.json["project_id"]
    new_code = request.json["code"]
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    try:
        project.update({"code": new_code})
        return (
            jsonify({"status": "success", "message": "Code updated successfully"}),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def fix_code_wrapper(user_id, project_id, data):
    new_data = deepcopy(data)

    code = new_data["code"]
    error_message = new_data["error_message"]

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    solver = project.get().to_dict().get("solver", "none")

    project.update({"code": new_data["code"]})

    res = fix_code({"code": code, "error_message": error_message, "solver": solver})

    new_data["code"] = res["code"]

    project.update({"code": new_data["code"]})

    print("-------RESULTS:   ", json.dumps(res, indent=4))

    return {
        "status": "success",
        "code": new_data["code"],
        "reasoning": res["reasoning"],
    }


@bp.route("/fixCode", methods=["POST"])
@login_required
def handle_fix_code():
    rj = request.json
    project_id = rj["project_id"]
    user_id = session["user_id"]

    code = rj["code"]
    error_message = rj["error_message"]

    return handle_request_async(
        fix_code_wrapper,
        user_id,
        project_id,
        {"code": code, "error_message": error_message},
    )
