from flask import Flask, send_from_directory
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth

import os


from .routes.parameters import scan_parameters, process_data
from .routes.targets import extraction
from .routes.formulation import formulation
from .routes.coding import coding
from .routes.evaluation import evaluation
from .routes.auth import auth
from .routes.projects import projects

from .routes import main, analyze, misc
from .utils.setup import get_clients


# List of allowed origins
origins = [
    "http://localhost:3000",  # Local development frontend address
    "https://optimus-cme-front.vercel.app",  # Production frontend address
    "https://optimus-cme-front-teshnizi.vercel.app",  # Production frontend address
    "https://optimus-solver.vercel.app",  # Production frontend address
]




def create_app():
    app = Flask(__name__, 
                static_folder=os.path.abspath('./interface/build'), 
                template_folder=os.path.abspath('./interface/build'))
    
    # Apply CORS to the Flask app for all routes
    CORS(app, origins=origins, supports_credentials=True)

    # Load config
    app.config.from_object("api.config.Config")

    # Load clients
    app.clients = get_clients(app.config)

    app.config.update(
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE="None",
        API_URL=app.config['API_URL'],
        OPENAI_API_KEY=app.config['OPENAI_API_KEY'],
        ANTHROPIC_API_KEY=app.config['ANTHROPIC_API_KEY']
    )

    # if tmp folder doesn't exist, create it
    if not os.path.exists("api/tmpData/"):
        os.mkdir("api/tmpData/")

    # if error_logs folder doesn't exist, create it
    if not os.path.exists("api/error_logs/"):
        os.mkdir("api/error_logs/")

    # if data folder doesn't exist, create it
    if not os.path.exists("api/projectData/"):
        os.mkdir("api/projectData/")

    # Register blueprints with /api prefix
    app.register_blueprint(main.bp, url_prefix="/api")
    app.register_blueprint(analyze.bp, url_prefix="/api")
    app.register_blueprint(scan_parameters.bp, url_prefix="/api")
    app.register_blueprint(process_data.bp, url_prefix="/api")
    app.register_blueprint(extraction.bp, url_prefix="/api")
    app.register_blueprint(formulation.bp, url_prefix="/api")
    app.register_blueprint(coding.bp, url_prefix="/api")
    app.register_blueprint(evaluation.bp, url_prefix="/api")
    app.register_blueprint(misc.bp, url_prefix="/api")
    app.register_blueprint(auth.bp, url_prefix="/api/auth")
    app.register_blueprint(projects.bp, url_prefix="/api/projects")

    # Serve React App
    @app.route('/')
    def serve():
        print(f"Serving index.html from {app.static_folder}")
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            print(f"Serving {path} from {app.static_folder}")
            return send_from_directory(app.static_folder, path)
        else:
            print(f"Path {path} not found. Serving index.html from {app.static_folder}")
            return send_from_directory(app.static_folder, 'index.html')

        
    return app


app = create_app()
