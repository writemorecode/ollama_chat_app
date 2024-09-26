async function* sseStreamIterator(apiUrl: string, requestBody: {}, extraHeaders: {}) {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { ...{ 'Content-Type': 'application/json' }, ...(extraHeaders || {}) },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error: Status ${response.status} Text '${text}'`);
    }

    if (!response.body) { throw new Error("No body in response"); }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const prefix = 'data: ';

    while (true) {
        const { done, value } = await reader.read();
        if (done) { break; }
        const buffer = decoder.decode(value, { stream: true })
        const jsonString = buffer.slice(prefix.length);
        const json = JSON.parse(jsonString);
        const messageChunk: string = json['message']['content']
        if (json['done']) { break; }
        yield messageChunk;
    }
}

async function sendMessage(message: string) {
    const llmMessageElement = addMessage('LLM', '');
    let fullResponse = '';

    const apiUrl = 'http://localhost:50000/chat';
    const requestBody = {
        'message': message
    };
    const extraHeaders = {};
    for await (const event of sseStreamIterator(apiUrl, requestBody, extraHeaders)) {
        fullResponse += event
        llmMessageElement.innerHTML = `<strong>LLM:</strong> ${fullResponse}`;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

}

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

async function sendHandler() {
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
