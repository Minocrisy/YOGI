export function initChatModule() {
    const chatMessages = document.querySelector('#chat-messages');
    const chatInput = document.querySelector('#chat .user-input');
    const chatSendButton = document.querySelector('#chat .send-button');
    const chatModelSelect = document.querySelector('#chat .model-select');
    const fileButton = document.querySelector('#chat .file-upload');
    const imageButton = document.querySelector('#chat .image-upload');
    const voiceButton = document.querySelector('#chat .voice-input');

    chatSendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    fileButton.addEventListener('click', handleFileUpload);
    imageButton.addEventListener('click', handleImageUpload);
    voiceButton.addEventListener('click', handleVoiceInput);

    async function handleSendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            await sendChatMessage(message);
            chatInput.value = '';
        }
    }

    async function handleFileUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.pdf,.doc,.docx';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const content = e.target.result;
                    await sendChatMessage(`File content: ${content}`, 'file', file.name);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    async function handleImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const content = e.target.result;
                    await sendChatMessage(content, 'image', file.name);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    async function handleVoiceInput() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", (event) => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", async () => {
                const audioBlob = new Blob(audioChunks);
                const audioUrl = URL.createObjectURL(audioBlob);
                await sendChatMessage(audioUrl, 'audio', 'Voice message');
            });

            mediaRecorder.start();
            voiceButton.textContent = 'Stop Recording';
            voiceButton.onclick = () => {
                mediaRecorder.stop();
                stream.getTracks().forEach(track => track.stop());
                voiceButton.textContent = 'Voice Input';
                voiceButton.onclick = handleVoiceInput;
            };
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Unable to access the microphone. Please check your browser settings.');
        }
    }

    async function sendChatMessage(message, type = 'text', fileName = '') {
        addMessageToChat('User', type === 'text' ? message : `Sent a ${type}: ${fileName}`);
        try {
            chatSendButton.disabled = true;
            chatSendButton.innerHTML = 'Sending... <span class="loading"></span>';
            
            const selectedModelId = chatModelSelect.value;

            const formData = new FormData();
            formData.append('modelId', selectedModelId);
            formData.append('type', type);

            if (type === 'text') {
                formData.append('message', message);
            } else if (type === 'file' || type === 'image') {
                const blob = await fetch(message).then(r => r.blob());
                formData.append('file', blob, fileName);
            } else if (type === 'audio') {
                const blob = await fetch(message).then(r => r.blob());
                formData.append('audio', blob, 'voice_message.webm');
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
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
