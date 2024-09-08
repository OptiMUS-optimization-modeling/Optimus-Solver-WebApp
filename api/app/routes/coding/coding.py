variable_definition_prompt_templates = r"""
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to write {solver} code for defining variables of the problem. Here's a variable we need you to write the code for defining:

-----
{variable}
-----

Assume the parameters are defined. Now generate a code accordingly and enclose it between "=====" lines. Only generate the code, and don't generate any other text. Here's an example:

**input**:

{{
    "definition": "Quantity of oil i bought in month m",
    "symbol": "buy_{{i,m}}",
    "shape": ["I","M"] 
}}

***output***:

=====
buy = model.addVars(I, M, vtype=gp.GRB.CONTINUOUS, name="buy")
=====


- Note that the indices in symbol (what comes after _) are not a part of the variable name in code.

"""

main_prompt_template = r"""
You're an expert programmer in a team of optimization experts. The goal of the team is to solve an optimization problem. Your task is to write {solver} code for the {targetType} of the problem.

Here's the {targetType} we need you to write the code for, along with the list of related variables and parameters:

-----
{context}
-----

Assume the parameters and variables are defined, and gurobipy is imported as gp. Now generate a code accordingly and enclose it between "=====" lines.  Here's an example:

{example}

Only generate the code, and don't generate any other text. Take a deep breath, and solve the problem step by step.

"""

examples = {
    "objective": r"""
**input**:

{{
    "definition": "Maximize the total profit from selling goods",
    "formulation": "Maximize \\(Z = \\sum_{{k=1}}^{{K}} \\sum_{{i=1}}^{{I}} (profit_k \\cdot x_{{k,i}} - storeCost \\cdot s_{{k,i}})\)",
    "related_variables": [
        {{
            "symbol": "x_{{k,i}}",
            "definition": "quantity of product k produced in month i",
            "shape": [
                "K",
                "I"
            ],
            "code": "x = model.addVars(K, I, vtype=gp.GRB.CONTINUOUS, name='x')"
        }},
        {{
            "symbol": "s_{{k,i}}",
            "definition": "quantity of product k stored in month i",
            "shape": [
                "K",
                "I"
            ],
            "code": "s = model.addVars(K, I, vtype=gp.GRB.CONTINUOUS, name='s')"
        }}
    ],
    "related_parameters": [
        {{
            "symbol": "profit_{{k}}",
            "definition": "profit from selling product k",
            "shape": [
                "K"
            ]
        }},
        {{
            "symbol": "storeCost",
            "definition": "price of storing one unit of product",
            "shape": []
        }}
    ]
}}


***output***:

=====
# Set objective
m.setObjective(quicksum(profit[k] * x[k, i] - storeCost * s[k, i] for k in range(K) for i in range(I)), gp.GRB.MAXIMIZE)
=====

""",
    "constraint": r"""

**input**:

{{
    "definition": "in month m, it is possible to store up to storageSize_{{m}} tons of each raw oil for use later.",
    "formulation": "\\(storage_{{i,m}} \\leq storageSize, \\quad \\forall i, m\\)",
    "related_variables": [
        {{
            "symbol": "storage_{{i,m}}",
            "definition": "quantity of oil i stored in month m",
            "shape": [
                "I",
                "M"
            ]
        }}
        ],
    "related_parameters": [
        {{
            "symbol": "storageSize_{{m}}",
            "definition": "storage size available in month m",
            "shape": [
                "M"
            ]
        }}
    ]
}}

***output***:

=====
# Add storage capacity constraints
for i in range(I):
    for m in range(M):
        model.addConstr(storage[i, m] <= storageSize[m], name="storage_capacity")
=====

""",
}

from flask import Blueprint, request, jsonify, current_app, session
import json
import numpy as np
import time
import threading

from api.app.utils.misc import get_unique_id
from api.app.utils.communication import get_llm_response, process_with_retries
from api.app.routes.auth.auth import login_required

bp = Blueprint("code_targets", __name__)


def code_variable(variable):
    context = {}
    context["definition"] = variable["definition"]
    context["symbol"] = variable["symbol"]
    context["shape"] = variable["shape"]

    if (
        variable["shape"] == ""
        or variable["symbol"] == ""
        or variable["definition"] == ""
    ):
        raise Exception(f"Variable {variable['symbol']} is missing some information!")

    prompt = variable_definition_prompt_templates.format(
        solver="gurobipy",
        variable=json.dumps(context, indent=4),
    )

    # completion = client.chat.completions.create(
    #     # model="gpt-4-1106-preview",
    #     model="gpt-3.5-turbo",
    #     messages=[
    #         {"role": "user", "content": prompt},
    #     ],
    # )

    # output = completion.choices[0].message.content

    output = get_llm_response(prompt)

    code = [r.strip() for r in output.split("=====") if len(r.strip()) > 2][-1]
    variable["code"] = code
    return code


def code_target(target, target_type, user_id, project_id):

    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)

    variables = project.get().to_dict().get("variables", {})
    parameters = project.get().to_dict().get("parameters", {})

    context = {}
    context["description"] = target["description"]
    context["formulation"] = target["formulation"]
    context["related_variables"] = []
    context["related_parameters"] = []

    for p in parameters:
        parameter = parameters[p]
        if parameter["symbol"] in target["related_parameters"]:
            context["related_parameters"].append(parameter)

    for v in variables:
        variable = variables[v]
        if variable["symbol"] in target["related_variables"]:
            if not "code" in variable or variable["code"] == "":
                variable["code"] = code_variable(variable)

            context["related_variables"].append(
                {
                    "symbol": variable["symbol"],
                    "definition": variable["definition"],
                    "shape": variable["shape"],
                    "code": variable["code"],
                }
            )

    prompt = main_prompt_template.format(
        solver="gurobipy",
        targetType=target_type,
        context=json.dumps(context, indent=4),
        example=examples[target_type],
    )

    # completion = client.chat.completions.create(
    #     model="gpt-4-1106-preview",
    #     messages=[
    #         {"role": "user", "content": prompt},
    #     ],
    # )

    # output = completion.choices[0].message.content

    output = get_llm_response(prompt)

    code = [r.strip() for r in output.split("=====") if len(r.strip()) > 2][-1]

    target["code"] = code

    # find the user's projects in the database
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document(project_id)
    if not project.get().exists:
        return jsonify({"error": "Project not found"}), 404
    else:
        if target_type == "constraint":
            target_type = "constraints"

        project_data = project.get().to_dict()
        target_array = project_data[target_type]

        print(target_array)
        print("==== ", target["description"])
        # Find and update the target in the array
        for t in target_array:
            if t["id"] == target["id"]:
                print("found it!")
                t.update(target)
                break

        print("Herererere")
        print(target_type)
        print(target_array)
        print("Herererere")

        project.update({target_type: target_array})
        project.update({"variables": variables})

    return {"target": target, "variables": variables}


@bp.route("/codeTarget", methods=["POST"])
@login_required
def handle_code():
    target = request.json["target"]
    target_type = request.json["target_type"]
    user_id = session.get("user_id")
    project_id = request.json.get("project_id")

    request_id = request.json["request_id"]
    athread = threading.Thread(
        target=process_with_retries,
        args=(
            current_app.app_context(),
            request_id,
            3,
            code_target,
            target,
            target_type,
            user_id,
            project_id,
        ),
    )

    athread.start()

    return jsonify({"received": True, "request_id": request_id}), 200
