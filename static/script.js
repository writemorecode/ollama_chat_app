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

async function sendMessage() {
    const message = userInput.value.trim();
    const message_b64 = btoa(message);
    if (message) {
        addMessage('You', message);
        userInput.value = '';

        const llmMessageElement = addMessage('LLM', '');
        let fullResponse = '';

        const eventSource = new EventSource(`/stream/` + message_b64);

        eventSource.onmessage = function(event) {
            console.log(event.data);
            fullResponse += event.data;
            llmMessageElement.innerHTML = `<strong>LLM:</strong> ${fullResponse}`;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        };

        eventSource.onerror = function(error) {
            console.log(error);
            eventSource.close();
            if (fullResponse === '') {
                llmMessageElement.innerHTML = '<strong>LLM:</strong> Error: Failed to get response from the server';
            }
        };

        eventSource.onopen = function() {
            fetch('/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });
        };
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

