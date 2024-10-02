import openai
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import base64


def get_clients(config):
    openai_client = openai.OpenAI(api_key=config["OPENAI_API_KEY"])

    # Decode Firebase credentials from environment variable

    firebase_creds_json = base64.b64decode(config["FIREBASE_CREDENTIALS"]).decode(
        "utf-8"
    )
    firebase_creds = json.loads(firebase_creds_json)

    print(json.dumps(firebase_creds, indent=2))
    cred = credentials.Certificate(firebase_creds)

    firebase_admin.initialize_app(cred)

    db = firestore.client()

    return {"openai_client": openai_client, "firestore_client": db}
