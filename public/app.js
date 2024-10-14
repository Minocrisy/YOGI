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
        const tabManager = initTabManager();
        const apiKeyModule = initApiKeyModule();
        const modelModule = initModelModule();
        const usageStatsModule = initUsageStatsModule();

        // Initialize modules that need to load data
        await Promise.all([
            modelModule.loadModels(),
            apiKeyModule.loadApiKeys(),
            usageStatsModule.loadUsageStats()
        ]);

        // Initialize modules that depend on loaded data
        const chatModule = initChatModule();
        const imageGenerationModule = initImageGenerationModule();
        const videoGenerationModule = initVideoGenerationModule();
        const audioGenerationModule = initAudioGenerationModule();
        const visionModule = initVisionModule();
        const uploadModule = initUploadModule(chatModule.addMessageToChat);
        const voiceInputModule = initVoiceInputModule();
        const notionModule = initNotionModule();

        // Add event listeners for updates
        modelModule.addEventListener('modelsUpdated', updateUIWithModels);
        apiKeyModule.addEventListener('apiKeysUpdated', updateUIWithApiKeys);
        usageStatsModule.addEventListener('usageStatsUpdated', updateUIWithUsageStats);

        console.log('All modules initialized successfully');
    } catch (error) {
        console.error('Error initializing modules:', error);
    }
});

function updateUIWithModels() {
    // Update UI elements that depend on models
    console.log('Models updated, refreshing UI');
}

function updateUIWithApiKeys() {
    // Update UI elements that depend on API keys
    console.log('API keys updated, refreshing UI');
}

function updateUIWithUsageStats() {
    // Update UI elements that display usage stats
    console.log('Usage stats updated, refreshing UI');
}
