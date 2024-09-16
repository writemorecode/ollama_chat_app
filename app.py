from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/send_message", methods=["POST"])
def send_message():
    user_message = request.json["message"]

    payload = {
        "model": "gemma2:2b",
        "messages": [{"role": "user", "content": user_message}],
        "stream": False,
    }

    # Send the message to the local LLM endpoint
    llm_response = requests.post("http://localhost:11434/api/chat", json=payload)

    if llm_response.status_code == 200:
        return jsonify({"response": llm_response.json()["message"]["content"]})
    else:
        return jsonify({"response": "Error: Unable to get response from LLM"}), 500


if __name__ == "__main__":
    app.run(debug=True)
