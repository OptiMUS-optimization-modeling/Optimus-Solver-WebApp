from flask import Flask, jsonify, request, session, Blueprint, current_app
from firebase_admin import auth
from functools import wraps
import firebase_admin
from firebase_admin import credentials

# Assuming Firebase Admin is initialized elsewhere in your application

bp = Blueprint("auth", __name__)


@bp.route("/verifyToken", methods=["POST"])
def verify_token():
    token = request.json.get("token")
    # print session id

    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        session["user_id"] = uid  # Set user ID in session
        secret_key = current_app.config["SECRET_KEY"]
        return jsonify({"uid": uid}), 200

    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid ID token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@bp.route("/test", methods=["GET"])
def auth_test():
    userid = session.get("user_id")
    secret_key = current_app.config["SECRET_KEY"]
    return jsonify({"uid": userid}), 200


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("user_id"):
            # User not logged in, return an error or redirect to login
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)

    return decorated_function


def check_project_ownership(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get("user_id")
        project_id = request.json.get("project_id")
        db = current_app.clients["firestore_client"]

        # Check if project_id belongs to user
        project_ref = db.collection("projects").document(project_id)
        project = project_ref.get()
        if not project.exists:
            return jsonify({"error": "Project not found"}), 404

        project_data = project.to_dict()
        if project_data["user_id"] != user_id:
            return jsonify({"error": "Unauthorized access"}), 403

        return f(*args, **kwargs)

    return decorated_function
