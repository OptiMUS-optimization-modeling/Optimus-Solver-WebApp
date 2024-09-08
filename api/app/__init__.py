from flask import Flask
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
    app = Flask(__name__)
    
    # Apply CORS to the Flask app for all routes
    CORS(app, origins=origins, supports_credentials=True)

    # Load config
    app.config.from_object("config.Config")

    # Print all items of config
    # for key, value in app.config.items():
    #     print(f"{key}: {value}")

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
    if not os.path.exists("tmpData/"):
        os.mkdir("tmpData/")

    # if error_logs folder doesn't exist, create it
    if not os.path.exists("error_logs/"):
        os.mkdir("error_logs/")

    # if data folder doesn't exist, create it
    if not os.path.exists("projectData/"):
        os.mkdir("projectData/")

    # Register blueprints
    app.register_blueprint(main.bp)
    app.register_blueprint(analyze.bp)
    app.register_blueprint(scan_parameters.bp)
    app.register_blueprint(process_data.bp)
    app.register_blueprint(extraction.bp)
    app.register_blueprint(formulation.bp)
    app.register_blueprint(coding.bp)
    app.register_blueprint(evaluation.bp)
    app.register_blueprint(misc.bp)
    app.register_blueprint(auth.bp, url_prefix="/auth")
    app.register_blueprint(projects.bp, url_prefix="/projects")

    return app
