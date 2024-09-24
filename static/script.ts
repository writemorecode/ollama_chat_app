const chatContainer = document.getElementById('chat-container') as HTMLElement;
const userInput = document.getElementById('user-input') as HTMLInputElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;

function addMessage(sender: string, message: string): HTMLParagraphElement {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageElement;
}

async function getStreamID(message: string): Promise<number | null> {
    try {
        const res = await fetch("/prompt", {
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
        const json = await res.json();
        return json.id;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function sendMessage(message: string) {
    const res = await getStreamID(message);
    if (!res) {
        console.error(`Failed to recieve prompt ID for message '${message}'.`);
    }
    const promptID = res as number;

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

}

function sendHandler() {
    const message: string = userInput.value.trim();
    if (message.length != 0) {
        console.log("Sending message: " + message);
        addMessage('You', message);
        userInput.value = '';
        sendMessage(message);
    }
}

sendButton.addEventListener('click', sendHandler);
userInput.addEventListener('keypress', (keypress: KeyboardEvent) => {
    if (keypress.key == 'Enter') {
        sendHandler();
    }
});