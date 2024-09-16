const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function addMessage(sender, message) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessage('You', message);
        userInput.value = '';

        try {
            const response = await fetch('/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (response.ok) {
                const data = await response.json();
                addMessage('LLM', data.response);
            } else {
                addMessage('Error', 'Failed to get response from the server');
            }
        } catch (error) {
            addMessage('Error', 'An error occurred while sending the message');
        }
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

