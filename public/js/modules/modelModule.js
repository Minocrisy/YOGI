export function initModelModule() {
    const modelsList = document.getElementById('models-list');
    const addModelBtn = document.getElementById('add-model');
    const modelSelects = document.querySelectorAll('.model-select');
    let availableModels = [];

    addModelBtn.addEventListener('click', addModel);

    async function loadModels() {
        try {
            const response = await fetch('/api/models');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            availableModels = await response.json();

            // Check and add default models if they don't exist
            const defaultModels = [
                { name: 'Mistral Large', type: 'text', provider: 'Mistral AI' },
                { name: 'Claude 3 Haiku', type: 'text', provider: 'Anthropic' },
                { name: 'Claude 3.5 Sonnet', type: 'text', provider: 'Anthropic' },
                { name: 'Claude 3 Opus', type: 'text', provider: 'Anthropic' },
                { name: 'Hugging Face FLUX', type: 'image', provider: 'huggingface' },
                { name: 'OpenAI DALL-E 3', type: 'image', provider: 'openai' },
                { name: 'Imagen 3', type: 'image', provider: 'google' }
            ];

            for (const defaultModel of defaultModels) {
                if (!availableModels.some(model => model.name === defaultModel.name)) {
                    await addModel(defaultModel.name, defaultModel.type, defaultModel.provider);
                }
            }

            updateModelSelects();
            updateModelsList();
        } catch (error) {
            console.error('Error loading models:', error);
            modelsList.innerHTML = '<p>Error loading models. Please try refreshing the page.</p>';
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

    async function addModel(name, type, provider) {
        if (!name || !type || !provider) {
            name = prompt('Enter a name for the model:');
            type = prompt('Enter the model type (text, image, video, audio, or vision):');
            provider = prompt('Enter the provider name:');
        }
        if (name && type && provider) {
            try {
                const response = await fetch('/api/models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, type, provider })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await loadModels();
            } catch (error) {
                console.error('Error adding model:', error);
                alert('Failed to add model. Please try again.');
            }
        }
    }

    async function removeModel(id) {
        if (confirm('Are you sure you want to remove this model?')) {
            try {
                const response = await fetch(`/api/models/${id}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await loadModels();
            } catch (error) {
                console.error('Error removing model:', error);
                alert('Failed to remove model. Please try again.');
            }
        }
    }

    // Make removeModel global
    window.removeModel = removeModel;

    return { loadModels, addModel, removeModel };
}
