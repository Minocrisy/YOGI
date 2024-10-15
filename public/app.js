import { initTabManager } from './js/modules/tabManager.js';
import { initChatModule } from './js/modules/chatModule.js';
import { initImageGenerationModule } from './js/modules/imageGenerationModule.js';
import { initVideoGenerationModule } from './js/modules/videoGenerationModule.js';
import { initAudioGenerationModule } from './js/modules/audioGenerationModule.js';
import { initVisionModule } from './js/modules/visionModule.js';
import { initUploadModule } from './js/modules/uploadModule.js';
import { initVoiceInputModule } from './js/modules/voiceInputModule.js';
import { initNotionModule } from './js/modules/notionModule.js';
import { initApiKeyModule } from './js/modules/apiKeyModule.js';
import { initModelModule } from './js/modules/modelModule.js';
import { initUsageStatsModule } from './js/modules/usageStatsModule.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing modules...');
        const tabManager = initTabManager();
        console.log('Tab manager initialized');

        const apiKeyModule = initApiKeyModule();
        console.log('API key module initialized');

        const modelModule = initModelModule();
        console.log('Model module initialized');

        const usageStatsModule = initUsageStatsModule();
        console.log('Usage stats module initialized');

        console.log('Loading initial data...');
        // Initialize modules that need to load data
        try {
            await Promise.all([
                modelModule.loadModels(),
                apiKeyModule.loadApiKeys(),
                usageStatsModule.loadUsageStats()
            ]);
            console.log('Initial data loaded successfully');
        } catch (dataLoadError) {
            console.error('Error loading initial data:', dataLoadError);
        }

        console.log('Initial data loaded, updating UI...');
        // Initial UI update
        await updateUIWithModels();

        // Initialize modules that depend on loaded data
        console.log('Initializing dependent modules...');
        const chatModule = initChatModule();
        const imageGenerationModule = initImageGenerationModule();
        const videoGenerationModule = initVideoGenerationModule();
        const audioGenerationModule = initAudioGenerationModule();
        const visionModule = initVisionModule();
        const uploadModule = initUploadModule(chatModule.addMessageToChat);
        const voiceInputModule = initVoiceInputModule();
        const notionModule = initNotionModule();
        console.log('Dependent modules initialized');

        // Add event listeners for updates
        modelModule.addEventListener('modelsUpdated', updateUIWithModels);
        apiKeyModule.addEventListener('apiKeysUpdated', updateUIWithApiKeys);
        usageStatsModule.addEventListener('usageStatsUpdated', updateUIWithUsageStats);

        console.log('All modules initialized successfully');
    } catch (error) {
        console.error('Error initializing modules:', error);
        console.error('Error stack:', error.stack);
    }
});

async function updateUIWithModels() {
    console.log('Updating UI with models...');
    const modelSelects = document.querySelectorAll('.model-select');
    for (const select of modelSelects) {
        const modelType = select.getAttribute('data-type');
        try {
            console.log(`Fetching models for type: ${modelType}`);
            const response = await fetch('/api/models');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const models = await response.json();
            console.log('Fetched models:', models);
            const filteredModels = models.filter(model => model.type === modelType);
            console.log(`Filtered models for ${modelType}:`, filteredModels);
            select.innerHTML = filteredModels.map(model => 
                `<option value="${model.id}">${model.name} (${model.provider})</option>`
            ).join('');
            console.log(`Updated select for ${modelType}:`, select.innerHTML);
        } catch (error) {
            console.error(`Error fetching models for ${modelType}:`, error);
            select.innerHTML = '<option>Error loading models</option>';
        }
    }
    console.log('Models updated, UI refreshed');
}

function updateUIWithApiKeys() {
    console.log('API keys updated, refreshing UI');
    // Update UI elements that depend on API keys
}

function updateUIWithUsageStats() {
    console.log('Usage stats updated, refreshing UI');
    // Update UI elements that display usage stats
}
