import openai
import firebase_admin
from firebase_admin import credentials, firestore


def get_clients(config):
    openai_client = openai.OpenAI(
        api_key=config["OPENAI_API_KEY"]
    )

    cred = credentials.Certificate(
        "optimus-6fcd1-firebase-adminsdk-pfxyc-38c6bac4e3.json"
    )
    firebase_admin.initialize_app(cred)

    db = firestore.client()

    return {"openai_client": openai_client, "firestore_client": db}
