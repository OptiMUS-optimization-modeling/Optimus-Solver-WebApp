from flask import Blueprint, current_app
from flask import request, jsonify
from flask import session
from flask import redirect, url_for

from api.app.routes.auth.auth import login_required

bp = Blueprint("main", __name__)


@bp.route("/", methods=["GET"])
# @login_required
def main_page():
    # user_id = session.get("user_id")
    # if not user_id:
    #     return redirect(url_for("login"))
    return jsonify({"message": "Welcome to the main page!"})
