import base64
from typing import Generator

import ollama
from flask import (
    Flask,
    Response,
    render_template,
    stream_with_context,
)

app = Flask(__name__)
MODEL = "gemma2:2b"
client = ollama.Client(host="http://ollama:11434")


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.route("/stream/<prompt_b64>")
def stream(prompt_b64: str) -> Response:
    prompt = base64.b64decode(prompt_b64).decode()

    def generate():
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
            yield f"data: {chunk['message']['content']}\n\n"

    return Response(stream_with_context(generate()), content_type="text/event-stream")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
