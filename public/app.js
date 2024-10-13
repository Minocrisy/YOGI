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

document.addEventListener('DOMContentLoaded', () => {
    const tabManager = initTabManager();
    const chatModule = initChatModule();
    const imageGenerationModule = initImageGenerationModule();
    const videoGenerationModule = initVideoGenerationModule();
    const audioGenerationModule = initAudioGenerationModule();
    const visionModule = initVisionModule();
    const uploadModule = initUploadModule(chatModule.addMessageToChat);
    const voiceInputModule = initVoiceInputModule();
    const notionModule = initNotionModule();
    const apiKeyModule = initApiKeyModule();
    const modelModule = initModelModule();
    const usageStatsModule = initUsageStatsModule();

    // Initialize modules that need to load data
    modelModule.loadModels();
    apiKeyModule.loadApiKeys();
    usageStatsModule.loadUsageStats();
});
