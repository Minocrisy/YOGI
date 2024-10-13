export function initApiKeyModule() {
    const apiKeysList = document.getElementById('api-keys-list');
    const addApiKeyBtn = document.getElementById('add-api-key');

    addApiKeyBtn.addEventListener('click', addApiKey);

    async function loadApiKeys() {
        try {
            const response = await fetch('/api/keys');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const keys = await response.json();
            apiKeysList.innerHTML = keys.map(key => `
                <div>
                    <span>${key.name}: ${key.value.substring(0, 5)}...</span>
                    <button onclick="removeApiKey('${key.id}')">Remove</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading API keys:', error);
            apiKeysList.innerHTML = '<p>Error loading API keys. Please try refreshing the page.</p>';
        }
    }

    async function addApiKey() {
        const name = prompt('Enter a name for the API key:');
        const value = prompt('Enter the API key:');
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
                loadApiKeys();
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
                loadApiKeys();
            } catch (error) {
                console.error('Error removing API key:', error);
                alert('Failed to remove API key. Please try again.');
            }
        }
    }

    // Make removeApiKey global
    window.removeApiKey = removeApiKey;

    return { loadApiKeys, addApiKey, removeApiKey };
}
