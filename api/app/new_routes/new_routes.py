from flask import Blueprint, request, jsonify, current_app, session
import json

import threading

from api.app.utils.misc import get_unique_id
from api.app.utils.communication import process_with_retries

from .formulate_clauses import formulate_clause
from .extract_params import extract_params
from .extract_clauses import extract_clauses
from .code_clause import code_clause


bp = Blueprint("new_routes", __name__)


def handle_request_async(function, data):
    request_id = get_unique_id()
    athread = threading.Thread(
        target=process_with_retries,  # Changed 'clause' to 'target'
        args=(current_app.app_context(), request_id, 3, function, data),
    )
    athread.start()
    return jsonify({"received": True, "request_id": request_id}), 200


@bp.route("/extract_params", methods=["POST"])
def handle_extract_params():
    data = request.json
    return handle_request_async(extract_params, data)


@bp.route("/extract_clauses", methods=["POST"])
def handle_extract_clauses():
    data = request.json
    return handle_request_async(extract_clauses, data)


@bp.route("/formulate_clause", methods=["POST"])
def handle_formulation():
    data = request.json
    return handle_request_async(formulate_clause, data)


@bp.route("/code_clause", methods=["POST"])
def handle_code_clause():
    data = request.json
    return handle_request_async(code_clause, data)
