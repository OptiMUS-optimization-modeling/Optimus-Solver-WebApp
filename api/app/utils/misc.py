import random
import string
import time

from flask import current_app, jsonify
import threading
from api.app.utils.communication import process_with_retries


def get_unique_id():
    return "".join(
        random.choice(string.ascii_uppercase + string.digits) for _ in range(10)
    )


def log_err(err_str):
    # random id + time
    name = time.strftime("%Y-%m-%d-%H-%M-%S") + get_unique_id()
    with open(f"error_logs/{name}.txt", "w") as f:
        f.write(err_str)


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
