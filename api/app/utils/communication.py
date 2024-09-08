import traceback
from flask import current_app
import time
from google.cloud import firestore


def get_llm_response(prompt, model="gpt-4-1106-preview"):
    client = current_app.clients["openai_client"]

    print(current_app.clients.keys())

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": prompt},
        ],
    )

    output = completion.choices[0].message.content

    return output


def process_with_retries(app_context, request_id, count, func, *args, **kwargs):
    # create a new task in the database

    app_context.push()
    db = current_app.clients["firestore_client"]
    db.collection("tasks").document(request_id).set(
        {
            "status": "processing",
            "errors": [],
            "result": None,
            "lastUpdated": firestore.SERVER_TIMESTAMP,
        }
    )

    errs = []
    while count > 0:
        try:
            res = func(*args, **kwargs)
            break
        except Exception as e:
            full_err = traceback.format_exc()

            full_err += "\n" + str(e)
            errs.append(full_err)
            print(e)
            count -= 1

    if count == 0:
        db.collection("tasks").document(request_id).update(
            {"status": "failed", "errors": errs}
        )
    else:
        db.collection("tasks").document(request_id).update(
            {"status": "done", "errors": errs, "result": res}
        )
