"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
function addMessage(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageElement;
}
function getStreamID(message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch("/prompt", {
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': JSON.stringify({
                    'message': message
                })
            });
            if (!res.ok) {
                throw new Error("Request failed with status ${res.status}");
            }
            const json = yield res.json();
            return json.id;
        }
        catch (error) {
            console.error(error);
            return null;
        }
    });
}
function sendMessage(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield getStreamID(message);
        if (!res) {
            console.error(`Failed to recieve prompt ID for message '${message}'.`);
        }
        const promptID = res;
        const eventSource = new EventSource(`/stream/${promptID}`);
        const llmMessageElement = addMessage('LLM', '');
        let fullResponse = '';
        eventSource.onopen = function () { };
        eventSource.onmessage = function (event) {
            fullResponse += event.data;
            llmMessageElement.innerHTML = `<strong>LLM:</strong> ${fullResponse}`;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        };
        eventSource.onerror = function (error) {
            console.error(error);
            eventSource.close();
            if (fullResponse === '') {
                llmMessageElement.innerHTML = '<strong>LLM:</strong> Error: Failed to get response from the server';
            }
        };
    });
}
function sendHandler() {
    const message = userInput.value.trim();
    if (message.length != 0) {
        console.log("Sending message: " + message);
        addMessage('You', message);
        userInput.value = '';
        sendMessage(message);
    }
}
sendButton.addEventListener('click', sendHandler);
userInput.addEventListener('keypress', (keypress) => {
    if (keypress.key == 'Enter') {
        sendHandler();
    }
});
