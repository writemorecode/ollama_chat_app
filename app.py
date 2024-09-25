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

import uuid

app: Flask = Flask(__name__)
MODEL: str = "gemma2:2b"
client = ollama.Client(host="http://ollama:11434")
#client = ollama.Client(host="http://localhost:11434")

prompts: dict[str, str] = {}


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


@app.post("/stream")
def prompt():
    try:
        prompt: str = request.json["message"]
    except KeyError:
        abort(400)
    stream_id: str = str(uuid.uuid4())
    prompts[stream_id] = prompt
    return jsonify({"id": stream_id})


@app.get("/chat/<string:stream_id>")
def chat(stream_id: str) -> Response:
    try:
        prompt: str = prompts[stream_id]
    except KeyError:
        abort(404)

    return Response(
        stream_with_context(generate(prompt)), content_type="text/event-stream"
    )


def main():
    app.run(host="0.0.0.0", port=50000, debug=True)


if __name__ == "__main__":
    main()
