import { getApiKey } from './apiKeyModule.js';

export function initTranscriptionModule() {
    const transcribeButton = document.querySelector('#transcription .send-button');
    const summarizeButton = document.querySelector('#transcription .summarize-button');
    const fileInput = document.querySelector('#transcription .file-input');
    const linkInput = document.querySelector('#transcription .link-input');
    const speechInput = document.querySelector('#transcription .speech-input');
    const modelSelect = document.querySelector('#transcription .model-select');
    const transcriptionDisplay = document.getElementById('transcription-display');
    const summaryDisplay = document.getElementById('summary-display');

    transcribeButton.addEventListener('click', handleTranscribe);
    summarizeButton.addEventListener('click', handleSummarize);
    speechInput.addEventListener('click', startSpeechRecognition);

    let audioBlob = null;

    function startSpeechRecognition() {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            audioBlob = new Blob([speechResult], { type: 'audio/wav' });
            handleTranscribe();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            alert('Speech recognition error: ' + event.error);
        };
    }

    async function handleTranscribe() {
        const file = fileInput.files[0];
        const url = linkInput.value.trim();
        const selectedModel = modelSelect.value;

        if (!file && !url && !audioBlob) {
            alert('Please provide a file, URL, or speech input to transcribe.');
            return;
        }

        const formData = new FormData();
        formData.append('modelId', selectedModel);

        if (file) {
            formData.append('file', file);
        } else if (url) {
            formData.append('url', url);
        } else if (audioBlob) {
            formData.append('file', audioBlob, 'speech.wav');
        }

        try {
            transcribeButton.disabled = true;
            transcribeButton.textContent = 'Transcribing...';

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            displayTranscription(result.transcription);
            summarizeButton.disabled = false;
        } catch (error) {
            console.error('Error during transcription:', error);
            alert('An error occurred during transcription: ' + error.message);
        } finally {
            transcribeButton.disabled = false;
            transcribeButton.textContent = 'Transcribe';
        }
    }

    function displayTranscription(text) {
        transcriptionDisplay.textContent = text;
    }

    async function handleSummarize() {
        const transcription = transcriptionDisplay.textContent;

        if (!transcription) {
            alert('Please transcribe something first before summarizing.');
            return;
        }

        try {
            summarizeButton.disabled = true;
            summarizeButton.textContent = 'Summarizing...';

            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcription: transcription,
                    model: 'gpt-3.5-turbo'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            displaySummary(result.summary);
        } catch (error) {
            console.error('Error during summarization:', error);
            alert('An error occurred during summarization: ' + error.message);
        } finally {
            summarizeButton.disabled = false;
            summarizeButton.textContent = 'Summarize';
        }
    }

    function displaySummary(summary) {
        summaryDisplay.textContent = summary;
    }
}
