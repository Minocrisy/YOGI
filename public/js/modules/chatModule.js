export function initChatModule() {
    const chatMessages = document.querySelector('#chat-messages');
    const chatInput = document.querySelector('#chat .user-input');
    const chatSendButton = document.querySelector('#chat .send-button');
    const chatModelSelect = document.querySelector('#chat .model-select');

    chatSendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    async function handleSendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            await sendChatMessage(message);
            chatInput.value = '';
        }
    }

    async function sendChatMessage(message) {
        addMessageToChat('User', message);
        try {
            chatSendButton.disabled = true;
            chatSendButton.innerHTML = 'Sending... <span class="loading"></span>';
            
            const selectedModelId = chatModelSelect.value;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, modelId: selectedModelId })
            });

            const data = await response.json();

            if (response.status === 503) {
                addMessageToChat('YOGI', 'I apologize, but the chat service is currently unavailable. Please try again later.');
            } else if (!response.ok) {
                throw new Error(data.error || 'An error occurred while processing your request.');
            } else {
                addMessageToChat('YOGI', data.response);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessageToChat('YOGI', 'Sorry, I encountered an error. Please try again later.');
        } finally {
            chatSendButton.disabled = false;
            chatSendButton.textContent = 'Send';
        }
    }

    function addMessageToChat(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender.toLowerCase());
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    return { sendChatMessage };
}
