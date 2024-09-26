import ollama
from flask import (
    Flask,
    Response,
    render_template,
    stream_with_context,
    request,
)
import json


app: Flask = Flask(__name__)
MODEL: str = "gemma2:2b"
client = ollama.Client(host="http://ollama:11434")


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
        chunk_json = json.dumps(chunk)
        yield f"data: {chunk_json}\n\n"


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.post("/chat")
def chat() -> Response:
    prompt: str = request.json["message"]
    return Response(
        stream_with_context(generate(prompt)), content_type="text/event-stream"
    )


def main():
    app.run(host="0.0.0.0", port=50000, debug=True)


if __name__ == "__main__":
    main()
