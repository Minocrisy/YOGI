export function initImageGenerationModule() {
    const imageInput = document.querySelector('#image-generation .user-input');
    const imageGenerateButton = document.querySelector('#image-generation .send-button');
    const imageModelSelect = document.querySelector('#image-generation .model-select');
    const imageResult = document.querySelector('#image-result');

    imageGenerateButton.addEventListener('click', handleGenerateImage);

    async function handleGenerateImage() {
        const prompt = imageInput.value.trim();
        if (prompt) {
            await generateImage(prompt);
            imageInput.value = '';
        }
    }

    async function generateImage(prompt) {
        imageResult.innerHTML = '<p>Generating image... <span class="loading"></span></p>';
        try {
            const selectedModelId = imageModelSelect.value;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5-minute timeout

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, modelId: selectedModelId }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.imageUrl) {
                const modelName = imageModelSelect.options[imageModelSelect.selectedIndex].text;
                imageResult.innerHTML = `
                    <img src="${data.imageUrl}" alt="Generated Image">
                    <p>Generated using ${modelName}</p>
                    <p>Prompt: ${prompt}</p>
                    <p>Cost: $${data.cost.toFixed(2)}</p>
                `;
            } else {
                throw new Error('No image URL in the response');
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
                imageResult.innerHTML = '<p>Image generation timed out. Please try again.</p>';
            } else {
                imageResult.innerHTML = '<p>Error generating image. Please try again.</p>';
            }
        }
    }

    return { generateImage };
}
