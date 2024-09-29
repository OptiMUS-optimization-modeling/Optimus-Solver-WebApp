from flask import Blueprint, current_app, request, jsonify
from api.app.routes.auth.auth import login_required
from redis import Redis
import json

bp = Blueprint("misc", __name__)


@bp.route("/pollResult", methods=["POST"])
def poll_result():

    request_id = request.json.get("request_id")
    if not request_id:
        return jsonify({"error": "Missing request_id"}), 400

    redis_client: Redis = current_app.redis
    task_key = f"task:{request_id}"
    task_data = redis_client.hgetall(task_key)

    print(f"Polling result for request ID: {request_id}, task data: {task_data}")

    if not task_data:
        return jsonify({"error": "No such task"}), 404

    # Decode and deserialize the task data
    try:
        task = {
            "status": task_data.get(b"status", b"").decode("utf-8"),
            "errors": json.loads(task_data.get(b"errors", b"[]").decode("utf-8")),
            "result": json.loads(task_data.get(b"result", b"null").decode("utf-8")),
            "lastUpdated": float(task_data.get(b"lastUpdated", b"0")),
        }
    except (ValueError, TypeError) as e:
        print(f"Error decoding task data: {e}")
        return jsonify({"error": "Invalid task data"}), 500

    print(f"Task Data: {task}")

    return jsonify({"data": task}), 200
