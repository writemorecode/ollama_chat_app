from flask import (
    Flask,
    Response,
    render_template,
    stream_with_context,
)
import ollama
import base64

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/stream/<prompt_b64>")
def stream(prompt_b64: str):
    prompt = base64.b64decode(prompt_b64).decode()

    def generate():
        stream = ollama.chat(
            model="gemma2:2b",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            stream=True,
        )
        for chunk in stream:
            yield f"data: {chunk['message']['content']}\n\n"

    return Response(stream_with_context(generate()), content_type="text/event-stream")


if __name__ == "__main__":
    app.run(debug=True)
