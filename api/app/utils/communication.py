import traceback
from flask import current_app
import time
from redis import Redis
import json


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
    """
    Process a function with retries and store task status in Redis.

    Args:
        app_context: Current application context.
        request_id: Unique identifier for the request.
        count: Number of retry attempts.
        func: The function to execute.
        *args: Positional arguments for the function.
        **kwargs: Keyword arguments for the function.
    """
    app_context.push()
    redis_client: Redis = current_app.redis

    # Initialize task data
    task_key = f"task:{request_id}"
    initial_task = {
        "status": "processing",
        "errors": json.dumps([]),
        "result": json.dumps(None),
        "lastUpdated": time.time(),
    }
    redis_client.hmset(task_key, initial_task)
    # Set expiration to 120 seconds (2 minutes)
    redis_client.expire(task_key, 180)

    # print all tasks
    print(redis_client.keys("task:*"))

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
            time.sleep(1)  # Optional: wait before retrying

    if count == 0:
        # Update task as failed
        updated_task = {
            "status": "failed",
            "errors": json.dumps(errs),
            "lastUpdated": time.time(),
        }
        redis_client.hmset(task_key, updated_task)
    else:
        # Update task as done
        updated_task = {
            "status": "done",
            "errors": json.dumps(errs),
            "result": json.dumps(res),
            "lastUpdated": time.time(),
        }
        redis_client.hmset(task_key, updated_task)

    # Reset expiration upon task completion
    redis_client.expire(task_key, 180)
