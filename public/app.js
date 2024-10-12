document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const modelSelects = document.querySelectorAll('.model-select');
    const sendButtons = document.querySelectorAll('.send-button');
    const userInputs = document.querySelectorAll('.user-input');
    const syncNotionBtn = document.getElementById('sync-notion');
    const notionStatus = document.getElementById('notion-status');

    // Vision tab elements
    const visionFileInput = document.querySelector('#vision .file-input');
    const visionAnalyzeButton = document.querySelector('#vision .send-button');
    const visionResult = document.getElementById('vision-result');

    // API Management elements
    const apiKeysList = document.getElementById('api-keys-list');
    const addApiKeyBtn = document.getElementById('add-api-key');
    const modelsList = document.getElementById('models-list');
    const addModelBtn = document.getElementById('add-model');
    const usageStats = document.getElementById('usage-stats');

    let currentTab = 'chat';
    let availableModels = [];

    // Load models on page load
    loadModels();

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = tab.getAttribute('data-tab');
            switchTab(targetId);
        });
    });

    function switchTab(tabId) {
        currentTab = tabId;
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    // Event listeners for send/generate buttons
    sendButtons.forEach(button => {
        button.addEventListener('click', handleSendMessage);
    });

    userInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
            }
        });
    });

    // Vision tab event listeners
    visionAnalyzeButton.addEventListener('click', (e) => {
        e.preventDefault();
        handleVisionAnalysis();
    });

    async function handleSendMessage(event) {
        const tabContent = event.target.closest('.tab-content');
        const userInput = tabContent.querySelector('.user-input');
        const message = userInput.value.trim();
        if (message) {
            const tabId = tabContent.id;
            switch(tabId) {
                case 'chat':
                    await sendChatMessage(message, tabContent);
                    break;
                case 'image-generation':
                    await generateImage(message, tabContent);
                    break;
                case 'video-generation':
                    await generateVideo(message, tabContent);
                    break;
                case 'audio-generation':
                    await generateAudio(message, tabContent);
                    break;
            }
            userInput.value = '';
        }
    }

    async function handleVisionAnalysis() {
        console.log('Vision analysis started');
        const file = visionFileInput.files[0];
        const question = document.querySelector('#vision .user-input').value.trim();
        if (!file) {
            alert('Please select an image file.');
            return;
        }
        if (!question) {
            alert('Please enter a question about the image.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('question', question);
        formData.append('modelId', document.querySelector('#vision .model-select').value);

        visionResult.innerHTML = '<p>Analyzing image... <span class="loading"></span></p>';
        visionAnalyzeButton.disabled = true;

        try {
            console.log('Sending vision analysis request');
            const response = await fetch('/api/analyze-vision', {
                method: 'POST',
                body: formData
            });

            console.log('Response received:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Analysis result:', data);
            visionResult.innerHTML = `
                <h3>Analysis Result:</h3>
                <p>${data.result}</p>
                <img src="${URL.createObjectURL(file)}" alt="Analyzed Image" style="max-width: 100%; margin-top: 10px;">
            `;
        } catch (error) {
            console.error('Error in vision analysis:', error);
            visionResult.innerHTML = `<p>Error analyzing image: ${error.message}</p>`;
        } finally {
            visionAnalyzeButton.disabled = false;
            visionFileInput.value = ''; // Reset file input
            document.querySelector('#vision .user-input').value = ''; // Reset question input
        }
    }

    async function sendChatMessage(message, tabContent) {
        const chatMessages = tabContent.querySelector('#chat-messages');
        addMessageToChat(chatMessages, 'User', message);
        try {
            const sendButton = tabContent.querySelector('.send-button');
            sendButton.disabled = true;
            sendButton.innerHTML = 'Sending... <span class="loading"></span>';
            
            const selectedModelId = tabContent.querySelector('.model-select').value;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, modelId: selectedModelId })
            });

            const data = await response.json();

            if (response.status === 503) {
                addMessageToChat(chatMessages, 'YOGI', 'I apologize, but the chat service is currently unavailable. Please try again later.');
            } else if (!response.ok) {
                throw new Error(data.error || 'An error occurred while processing your request.');
            } else {
                addMessageToChat(chatMessages, 'YOGI', data.response);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessageToChat(chatMessages, 'YOGI', 'Sorry, I encountered an error. Please try again later.');
        } finally {
            const sendButton = tabContent.querySelector('.send-button');
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        }
    }

    function addMessageToChat(chatMessages, sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender.toLowerCase());
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function generateImage(prompt, tabContent) {
        const imageResult = tabContent.querySelector('#image-result');
        imageResult.innerHTML = '<p>Generating image... <span class="loading"></span></p>';
        try {
            const selectedModelId = tabContent.querySelector('.model-select').value;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5-minute timeout

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, modelId: selectedModelId }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.imageUrl) {
                imageResult.innerHTML = `<img src="${data.imageUrl}" alt="Generated Image">`;
            } else {
                throw new Error('No image URL in the response');
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
                imageResult.innerHTML = '<p>Image generation timed out. Please try again.</p>';
            } else {
                imageResult.innerHTML = '<p>Error generating image. Please try again.</p>';
            }
        }
    }

    async function generateVideo(prompt, tabContent) {
        const videoResult = tabContent.querySelector('#video-result');
        videoResult.innerHTML = '<p>Video generation is not yet implemented.</p>';
    }

    async function generateAudio(prompt, tabContent) {
        const audioResult = tabContent.querySelector('#audio-result');
        audioResult.innerHTML = '<p>Audio generation is not yet implemented.</p>';
    }

    // Notion Integration
    syncNotionBtn.addEventListener('click', syncNotion);

    async function syncNotion() {
        try {
            syncNotionBtn.disabled = true;
            syncNotionBtn.innerHTML = 'Syncing... <span class="loading"></span>';
            const response = await fetch('/api/sync-notion', { method: 'POST' });
            const data = await response.json();
            notionStatus.textContent = data.message;
        } catch (error) {
            console.error('Error:', error);
            notionStatus.textContent = 'Error syncing with Notion.';
        } finally {
            syncNotionBtn.disabled = false;
            syncNotionBtn.textContent = 'Sync with Notion';
        }
    }

    // API Management Functions
    async function loadApiKeys() {
        try {
            const response = await fetch('/api/keys');
            const keys = await response.json();
            apiKeysList.innerHTML = keys.map(key => `
                <div>
                    <span>${key.name}: ${key.value.substring(0, 5)}...</span>
                    <button onclick="removeApiKey('${key.id}')">Remove</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading API keys:', error);
        }
    }

    async function loadModels() {
        try {
            const response = await fetch('/api/models');
            availableModels = await response.json();
            updateModelSelects();
            updateModelsList();
        } catch (error) {
            console.error('Error loading models:', error);
        }
    }

    function updateModelSelects() {
        modelSelects.forEach(select => {
            const modelType = select.getAttribute('data-type');
            const filteredModels = availableModels.filter(model => model.type === modelType);
            select.innerHTML = filteredModels.map(model => 
                `<option value="${model.id}">${model.name} (${model.provider})</option>`
            ).join('');
        });
    }

    function updateModelsList() {
        modelsList.innerHTML = availableModels.map(model => `
            <div>
                <span>${model.name} (${model.type}, ${model.provider})</span>
                <button onclick="removeModel('${model.id}')">Remove</button>
            </div>
        `).join('');
    }

    async function addApiKey() {
        const name = prompt('Enter a name for the API key:');
        const value = prompt('Enter the API key:');
        if (name && value) {
            try {
                await fetch('/api/keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, value })
                });
                loadApiKeys();
            } catch (error) {
                console.error('Error adding API key:', error);
            }
        }
    }

    async function removeApiKey(id) {
        if (confirm('Are you sure you want to remove this API key?')) {
            try {
                await fetch(`/api/keys/${id}`, { method: 'DELETE' });
                loadApiKeys();
            } catch (error) {
                console.error('Error removing API key:', error);
            }
        }
    }

    async function addModel() {
        const name = prompt('Enter a name for the model:');
        const type = prompt('Enter the model type (text, image, video, audio, or vision):');
        const provider = prompt('Enter the provider name:');
        if (name && type && provider) {
            try {
                await fetch('/api/models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, type, provider })
                });
                loadModels();
            } catch (error) {
                console.error('Error adding model:', error);
            }
        }
    }

    async function removeModel(id) {
        if (confirm('Are you sure you want to remove this model?')) {
            try {
                await fetch(`/api/models/${id}`, { method: 'DELETE' });
                loadModels();
            } catch (error) {
                console.error('Error removing model:', error);
            }
        }
    }

    async function loadUsageStats() {
        try {
            const response = await fetch('/api/usage');
            const stats = await response.json();
            usageStats.innerHTML = `
                <p>Total API Calls: ${stats.totalCalls}</p>
                <p>Total Cost: $${stats.totalCost.toFixed(2)}</p>
                <h4>Usage by Model:</h4>
                <ul>
                    ${Object.entries(stats.byModel).map(([model, calls]) => `
                        <li>${model}: ${calls} calls</li>
                    `).join('')}
                </ul>
            `;
        } catch (error) {
            console.error('Error loading usage stats:', error);
        }
    }

    // Event listeners for API Management
    addApiKeyBtn.addEventListener('click', addApiKey);
    addModelBtn.addEventListener('click', addModel);

    // Make removeApiKey and removeModel global
    window.removeApiKey = removeApiKey;
    window.removeModel = removeModel;

    // Initial load
    switchTab('chat');
    loadModels();
    loadApiKeys();
    loadUsageStats();
});
