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

async function getStreamID(message: string): Promise<string | null> {
    try {
        const res = await fetch("/stream", {
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
    const response = await getStreamID(message);
    if (!response) {
        console.error(`Failed to recieve prompt ID for message '${message}'.`);
        return
    }
    const promptID: string = response;

    const eventSource = new EventSource(`/chat/${promptID}`);
    const llmMessageElement = addMessage('LLM', '');
    let fullResponse = '';

    eventSource.onopen = function() { };

    eventSource.onmessage = function(event) {
        fullResponse += event.data;
        llmMessageElement.innerHTML = `<strong>LLM:</strong> ${fullResponse}`;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    eventSource.onerror = function(error: Event) {
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
        userInput.value = '';
        addMessage('You', message);
        sendMessage(message);
    }
}

sendButton.addEventListener('click', sendHandler);
userInput.addEventListener('keypress', (keypress: KeyboardEvent) => {
    if (keypress.key == 'Enter') {
        sendHandler();
    }
});
