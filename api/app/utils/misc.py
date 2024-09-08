import random
import string
import time


def get_unique_id():
    return "".join(
        random.choice(string.ascii_uppercase + string.digits) for _ in range(10)
    )


def log_err(err_str):
    # random id + time
    name = time.strftime("%Y-%m-%d-%H-%M-%S") + get_unique_id()
    with open(f"error_logs/{name}.txt", "w") as f:
        f.write(err_str)
