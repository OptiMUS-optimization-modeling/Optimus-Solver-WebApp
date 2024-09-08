from flask import Blueprint, current_app
from flask import request, jsonify
from api.app.routes.auth.auth import login_required

bp = Blueprint("misc", __name__)


@bp.route("/pollResult", methods=["POST"])
@login_required
def poll_result():
    print("polling result...")

    request_id = request.json["request_id"]
    print(request_id)

    db = current_app.clients["firestore_client"]
    doc = db.collection("tasks").document(request_id).get()
    if not doc.exists:
        return jsonify({"error": "No such task"}), 404

    data = doc.to_dict()

    print(data)
    # if data["status"] == "done":
    #     db.collection("tasks").document(request_id).delete()

    return jsonify({"data": data}), 200
