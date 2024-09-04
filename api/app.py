from flask import Flask, jsonify, request, send_from_directory
import os

app = Flask(__name__, static_folder='../interface/build')

@app.route('/extract_params', methods=['POST'])
def extract_params():
    return jsonify({
        "parameters": {},
        "problem_summary": "dummy_summary",
        "reformatted_problem_description": "dummy_description"
    })

@app.route('/extract_clauses', methods=['POST'])
def extract_clauses():
    return jsonify({
        "clauses": {},
        "graph": {}
    })

@app.route('/formulate_clause', methods=['POST'])
def formulate_clause():
    return jsonify({
        "updated_variables": {},
        "related_variables": [],
        "clause_formulation": "dummy_formulation"
    })

@app.route('/code_clause', methods=['POST'])
def code_clause():
    return jsonify({
        "clause_code": "dummy_code"
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)