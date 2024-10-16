let apiKeys = [];
const eventTarget = new EventTarget();

export function initApiKeyModule() {
    const apiKeysList = document.getElementById('api-keys-list');
    const addApiKeyBtn = document.getElementById('add-api-key');

    addApiKeyBtn.addEventListener('click', () => addApiKey());

    async function loadApiKeys() {
        try {
            console.log('Fetching API keys...');
            const response = await fetch('/api/keys');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            apiKeys = await response.json();
            console.log('API keys loaded successfully:', apiKeys);
            updateApiKeysList();

            // Check for required API keys
            const requiredKeys = ['Anthropic', 'Groq', 'HuggingFace', 'ElevenLabs'];
            const textGenerationKeys = ['Mistral AI', 'OpenAI'];
            
            // First, check for Mistral AI or OpenAI
            const hasTextGenerationKey = apiKeys.some(key => textGenerationKeys.includes(key.name));
            if (!hasTextGenerationKey) {
                const shouldAddMistral = confirm(`Mistral AI API key is missing. Would you like to add it now?`);
                if (shouldAddMistral) {
                    await addApiKey('Mistral AI');
                } else {
                    const shouldAddOpenAI = confirm(`OpenAI API key is missing. Would you like to add it now?`);
                    if (shouldAddOpenAI) {
                        await addApiKey('OpenAI');
                    }
                }
            }

            // Then check for other required keys
            for (const requiredKey of requiredKeys) {
                if (!apiKeys.some(key => key.name === requiredKey)) {
                    const shouldAdd = confirm(`${requiredKey} API key is missing. Would you like to add it now?`);
                    if (shouldAdd) {
                        await addApiKey(requiredKey);
                    }
                }
            }

            eventTarget.dispatchEvent(new Event('apiKeysUpdated'));
        } catch (error) {
            console.error('Error loading API keys:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            apiKeysList.innerHTML = '<p>Error loading API keys. Please try refreshing the page.</p>';
            throw error; // Re-throw the error so it can be caught by the caller
        }
    }

    function updateApiKeysList() {
        apiKeysList.innerHTML = apiKeys.map(key => `
            <div>
                <span>${key.name}: ${key.value ? key.value.substring(0, 5) + '...' : 'No value'}</span>
                <button onclick="removeApiKey('${key.id}')">Remove</button>
            </div>
        `).join('');
    }

    async function addApiKey(suggestedName = '') {
        const name = suggestedName || prompt('Enter a name for the API key:');
        const value = prompt(`Enter the API key for ${name}:`);
        if (name && value) {
            try {
                const response = await fetch('/api/keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, value })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await loadApiKeys();
            } catch (error) {
                console.error('Error adding API key:', error);
                alert('Failed to add API key. Please try again.');
            }
        }
    }

    async function removeApiKey(id) {
        if (confirm('Are you sure you want to remove this API key?')) {
            try {
                const response = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await loadApiKeys();
            } catch (error) {
                console.error('Error removing API key:', error);
                alert('Failed to remove API key. Please try again.');
            }
        }
    }

    // Make removeApiKey global
    window.removeApiKey = removeApiKey;

    return {
        loadApiKeys,
        addApiKey,
        removeApiKey,
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        removeEventListener: eventTarget.removeEventListener.bind(eventTarget)
    };
}

export function getApiKey(name) {
    const key = apiKeys.find(k => k.name === name);
    return key ? key.value : null;
}
