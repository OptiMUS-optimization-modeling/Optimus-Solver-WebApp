
import importlib
from typing import Dict


prep_code = """
import json
import numpy as np

{solver_import_code}

with open("{data_json_path}", "r") as f:
    data = json.load(f)

"""


def piece_code_together(state: Dict, interpret: bool = False):
    local_env = {}
    code = ""
    last_line = ""
    bogus_context = None

    prompt_module = importlib.import_module(
        f"api.app.functionalities.coding.prompts.{state['solver']}"
    )
    get_info_code = prompt_module.get_info_code
    solver_import_code = prompt_module.import_code

    try:

        last_line = prep_code.format(
            solver_import_code=solver_import_code,
            data_json_path=state["data_json_path"],
        )

        code += last_line + "\n"

        if interpret:
            exec(
                last_line,
                local_env,
                local_env,
            )

        for p in state["parameters"]:
            parameter = state["parameters"][p]
            if not "code" in parameter:
                raise Exception(f"Parameter {parameter} is not coded yet!")
            last_line = parameter["code"]
            code += last_line + "\n"
            if interpret:
                exec(last_line, local_env, local_env)

        last_line = f"\n# Define model\nmodel = gp.Model('model')\n"
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        code += "\n# ====== Define variables ====== \n"

        for v in state["variables"]:
            variable = state["variables"][v]
            bogus_context = variable
            if "code" in variable and variable["code"] and len(variable["code"]) > 0:
                last_line = variable["code"]
            else:
                last_line = f"# Variable {variable['symbol']} is not coded yet!"
            code += last_line + "\n"
            if interpret:
                exec(last_line, local_env, local_env)

        code += "\n# ====== Define constraints ====== \n"

        for constraint in state["constraints"]:
            bogus_context = constraint
            if (
                "code" in constraint
                and constraint["code"]
                and len(constraint["code"]) > 0
            ):
                last_line = constraint["code"]
            else:
                last_line = f"# Constraint {constraint['symbol']} is not coded yet!"
            code += "\n" + last_line + "\n"
            if interpret:
                exec(last_line, local_env, local_env)

        code += "\n# ====== Define objective ====== \n"

        bogus_context = state["objective"][0]
        if (
            "code" in state["objective"][0]
            and state["objective"][0]["code"]
            and len(state["objective"][0]["code"]) > 0
        ):
            last_line = state["objective"][0]["code"]
        else:
            last_line = (
                f"# Objective {state['objective'][0]['symbol']} is not coded yet!"
            )

        code += "\n" + last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        bogus_context = "OPTIMIZATION_CALL"
        last_line = f"\n# Optimize model\nmodel.optimize()\n"
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        bogus_context = None
        last_line = f"\n# Get model status\nstatus = model.status\n"
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        bogus_context = None

        last_line = get_info_code
        code += last_line + "\n"
        if interpret:
            exec(last_line, local_env, local_env)

        if interpret:
            ret = {
                "success": True,
                "error_line": None,
                "code": code,
                "obj_val": local_env["obj_val"],
                "status": local_env["status"],
                "solving_info": local_env["solving_info"],
                "error_message": None,
                "bogus_context": bogus_context,
            }

            return ret

        else:
            return {
                "code": code,
            }

    except Exception as e:
        if not bogus_context:
            print(local_env)
            print()
            print(code)
            print()

            import traceback

            error_msg = traceback.format_exc()
            raise Exception(
                f"Unexpected error in running code at {last_line}: "
                + "\n"
                + str(e)
                + "\n\n\n"
                + error_msg
            )

        if bogus_context and type(bogus_context) == dict:
            bogus_context["status"] = "bogus"
            bogus_context["error_message"] = str(e)
        elif bogus_context and bogus_context == "DATA_LOAD":
            e = f"The data is not properly configured! \n {str(e)}"
        return {
            "success": False,
            "error_line": last_line,
            "bogus_context": bogus_context,
            "code": code,
            "obj_val": None,
            "status": None,
            "error_message": str(e),
        }
