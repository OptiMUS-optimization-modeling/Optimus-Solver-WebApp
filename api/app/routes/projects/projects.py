from flask import Flask, jsonify, request, session, Blueprint, current_app
from firebase_admin import auth
from functools import wraps
from api.app.routes.auth.auth import login_required, check_project_ownership
from google.cloud import firestore

# Assuming Firebase Admin is initialized elsewhere in your application

bp = Blueprint("projects", __name__)


@bp.route("/getList", methods=["POST"])
@login_required
def get_projects_list():
    user = session.get("user_id")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user)
    projects = db.collection("projects").where("user_id", "==", user).stream()
    projects = list(projects)
    project_list = []
    for project in projects:
        project_data = project.to_dict()
        project_list.append(
            {
                "id": project.id,
                "title": project_data.get("title", "No description"),
                "owner": "You",
                "lastUpdated": project_data.get("lastUpdated", "Unknown"),
            }
        )

    print(project_list)
    return jsonify({"projects": project_list}), 200


@bp.route("/getProject", methods=["POST"])
@login_required
def get_project():
    user = session.get("user_id")
    project_id = request.json.get("project_id")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user)
    project = db.collection("projects").document(project_id).get()
    project_data = project.to_dict()
    project_data["id"] = project.id
    return jsonify({"project": project_data}), 200


@bp.route("/createProject", methods=["POST"])
@login_required
def create_project():

    user = session.get("user_id")
    db = current_app.clients["firestore_client"]
    project = db.collection("projects").document()
    project.set(
        {
            "user_id": user,
            "title": request.json.get("title", "New Project"),
            "description": "",
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "objective": [
                {
                    "description": "",
                    "formulation": "",
                    "code": "",
                }
            ],
            "constraints": [],
            "parameters": {},
            "background": "",
            "variables": {},
            "solver": "",
        }
    )
    return jsonify({"project_id": project.id}), 200


@bp.route("/deleteProject", methods=["POST"])
@login_required
@check_project_ownership
def delete_project():
    user = session.get("user_id")
    project_id = request.json.get("project_id")
    db = current_app.clients["firestore_client"]

    print("user_id: ", user)
    print("project_id: ", project_id)

    project_ref = db.collection("projects").document(project_id)
    project_ref.delete()

    return jsonify({"message": "Project deleted successfully"}), 200
