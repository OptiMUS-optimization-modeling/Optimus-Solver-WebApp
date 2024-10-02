from flask import Blueprint, current_app
from flask import request, jsonify
from flask import session
from flask import redirect, url_for

from api.app.routes.auth.auth import login_required

bp = Blueprint("main", __name__)


@bp.route("/", methods=["GET"])
def main_page():
    return jsonify({"message": "Welcome to the main page!"})
