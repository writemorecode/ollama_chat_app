import base64
import ollama
from flask import (
    Flask,
    Response,
    render_template,
    stream_with_context,
    request,
    abort,
    jsonify,
)

import random

app: Flask = Flask(__name__)
MODEL: str = "gemma2:2b"
# client = ollama.Client(host="http://ollama:11434")
client = ollama.Client(host="http://localhost:11434")

prompts: dict[int, str] = {}


def generate(prompt: str):
    stream = client.chat(
        model=MODEL,
        stream=True,
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )
    for chunk in stream:
        data = chunk["message"]["content"]
        yield f"data: {data}\n\n"


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.post("/prompt")
def prompt():
    try:
        prompt: str = request.json["message"]
    except KeyError:
        abort(400)
    id: int = random.randrange(0, 1_000_000)
    prompts[id] = prompt
    return jsonify({"id": id})


@app.get("/stream/<int:id>")
def stream(id: int) -> Response:
    try:
        prompt: str = prompts[id]
    except KeyError:
        abort(404)

    return Response(
        stream_with_context(generate(prompt)), content_type="text/event-stream"
    )


def main():
    # print("---- RUNNING MAIN FUNCTION ----")
    # print(f"Pulling {MODEL=}...")
    try:
        client.pull(model=MODEL)
    except Exception as exc:
        print(exc)
        return
    # print(f"Finished pulling {MODEL=}.")

    # print(f"Loading {MODEL=} into memory...")
    try:
        client.generate(model=MODEL)
    except Exception as exc:
        print(exc)
        return
    # print(f"Finished loading {MODEL=} into memory.")

    app.run(host="localhost", port=5000, debug=True)


if __name__ == "__main__":
    main()
