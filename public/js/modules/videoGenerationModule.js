import { getApiKey } from './apiKeyModule.js';

export function initVideoGenerationModule() {
    const videoInput = document.querySelector('#video-generation .user-input');
    const videoGenerateButton = document.querySelector('#video-generation .send-button');
    const videoModelSelect = document.querySelector('#video-generation .model-select');
    const videoResult = document.querySelector('#video-result');
    const imageUploadInput = document.querySelector('#video-generation .image-upload');

    videoGenerateButton.addEventListener('click', handleGenerateVideo);
    imageUploadInput.addEventListener('change', handleImageUpload);

    async function handleGenerateVideo() {
        const prompt = videoInput.value.trim();
        if (prompt) {
            await generateVideo(prompt);
            videoInput.value = '';
        } else {
            showError('Please enter a prompt for video generation.');
        }
    }

    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const imageData = e.target.result;
                    await generateVideo(videoInput.value.trim(), imageData);
                };
                reader.readAsDataURL(file);
            } else {
                showError('Please upload a valid image file.');
            }
        }
    }

    async function generateVideo(prompt, imageData = null) {
        try {
            showLoading('Generating video... This may take a while.');
            videoGenerateButton.disabled = true;
            imageUploadInput.disabled = true;

            const modelId = videoModelSelect.value;
            const apiKey = getApiKey('HuggingFace');

            const requestBody = {
                prompt,
                modelId
            };

            if (imageData) {
                requestBody.imageData = imageData;
            }

            const response = await fetch('/api/generate-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.videoUrl) {
                showVideo(result.videoUrl);
            } else {
                throw new Error('No video URL returned from the server');
            }
        } catch (error) {
            console.error('Error generating video:', error);
            showError(`Error generating video: ${error.message}`);
        } finally {
            videoGenerateButton.disabled = false;
            imageUploadInput.disabled = false;
        }
    }

    function showLoading(message) {
        videoResult.innerHTML = `<p>${message}</p>`;
    }

    function showError(message) {
        videoResult.innerHTML = `<p class="error">${message}</p>`;
    }

    function showVideo(url) {
        videoResult.innerHTML = `
            <video controls>
                <source src="${url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }

    return { generateVideo };
}
