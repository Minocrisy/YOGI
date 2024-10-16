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
import { initTranscriptionModule } from './js/modules/transcriptionModule.js';

async function initializeApp() {
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
                modelModule.loadModels().catch(error => {
                    console.error('Error loading models:', error);
                    return null;
                }),
                apiKeyModule.loadApiKeys().catch(error => {
                    console.error('Error loading API keys:', error);
                    return null;
                }),
                usageStatsModule.loadUsageStats().catch(error => {
                    console.error('Error loading usage stats:', error);
                    return null;
                })
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
        const transcriptionModule = initTranscriptionModule();
        console.log('Dependent modules initialized');

        // Add event listeners for updates
        modelModule.addEventListener('modelsUpdated', updateUIWithModels);
        apiKeyModule.addEventListener('apiKeysUpdated', updateUIWithApiKeys);
        usageStatsModule.addEventListener('usageStatsUpdated', updateUIWithUsageStats);

        // Set up event listeners for transcription
        const fileInput = document.querySelector('#transcription .file-input');
        const linkInput = document.querySelector('#transcription .link-input');
        const transcribeButton = document.querySelector('#transcription .send-button');
        const summarizeButton = document.querySelector('#transcription .summarize-button');
        const speechInput = document.querySelector('#transcription .speech-input');

        if (fileInput && linkInput && transcribeButton && summarizeButton && speechInput) {
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    transcribeButton.disabled = false;
                    linkInput.value = ''; // Clear link input when file is selected
                } else {
                    transcribeButton.disabled = !linkInput.value.trim();
                }
            });

            linkInput.addEventListener('input', (event) => {
                const url = event.target.value.trim();
                transcribeButton.disabled = !url && !fileInput.files[0];
                if (url) {
                    fileInput.value = ''; // Clear file input when link is entered
                }
            });

            transcribeButton.addEventListener('click', () => {
                const file = fileInput.files[0];
                const url = linkInput.value.trim();
                const selectedModel = document.querySelector('#transcription .model-select').value;
                
                if (file || url) {
                    transcriptionModule.handleTranscribe();
                }
                summarizeButton.disabled = false;
            });

            summarizeButton.addEventListener('click', () => {
                transcriptionModule.handleSummarize();
            });

            speechInput.addEventListener('click', () => {
                transcriptionModule.startSpeechRecognition();
            });
        } else {
            console.error('One or more transcription elements not found');
        }

        console.log('All modules initialized successfully');
    } catch (error) {
        console.error('Error initializing modules:', error);
        console.error('Error stack:', error.stack);
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    // Delay the initialization slightly to ensure DOM is fully loaded
    setTimeout(initializeApp, 100);
});

// Add event listener for resource load errors
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'LINK' || e.target.tagName === 'SCRIPT') {
        console.error('Failed to load resource:', e.target.src || e.target.href);
    }
}, true);
