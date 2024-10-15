import { getApiKey } from './apiKeyModule.js';

export function initAudioGenerationModule() {
    const audioInput = document.querySelector('#audio-generation .user-input');
    const audioGenerateButton = document.querySelector('#audio-generation .send-button');
    const audioModelSelect = document.querySelector('#audio-generation .model-select');
    const audioResult = document.querySelector('#audio-result');

    audioGenerateButton.addEventListener('click', handleGenerateAudio);

    async function handleGenerateAudio() {
        const prompt = audioInput.value.trim();
        if (prompt) {
            await generateAudio(prompt);
            audioInput.value = '';
        }
    }

    async function generateAudio(prompt) {
        try {
            audioResult.innerHTML = '<p>Generating audio...</p>';
            const apiKey = getApiKey('ElevenLabs');
            const response = await fetch('/api/generate-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, modelId: audioModelSelect.value }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Audio generation failed');
            }

            const result = await response.json();
            
            audioResult.innerHTML = `
                <p>Audio generated successfully:</p>
                <audio controls>
                    <source src="${result.audioUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <p>Cost: $${result.cost.toFixed(4)}</p>
            `;
        } catch (error) {
            console.error('Error generating audio:', error);
            audioResult.innerHTML = `<p>Error generating audio: ${error.message}</p>`;
        }
    }

    return { generateAudio };
}
