export function initVisionModule() {
    const visionFileInput = document.querySelector('#vision .file-input');
    const visionAnalyzeButton = document.querySelector('#vision .send-button');
    const visionInput = document.querySelector('#vision .user-input');
    const visionModelSelect = document.querySelector('#vision .model-select');
    const visionResult = document.getElementById('vision-result');

    visionAnalyzeButton.addEventListener('click', handleVisionAnalysis);

    // Fetch and populate vision models
    async function fetchVisionModels() {
        try {
            const response = await fetch('/api/models');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const models = await response.json();
            const visionModels = models.filter(model => model.type === 'vision');
            visionModelSelect.innerHTML = visionModels.map(model => 
                `<option value="${model.id}">${model.name} (${model.provider})</option>`
            ).join('');
        } catch (error) {
            console.error('Error fetching vision models:', error);
            visionModelSelect.innerHTML = '<option>Error loading models</option>';
        }
    }

    async function handleVisionAnalysis() {
        console.log('Vision analysis started');
        const file = visionFileInput.files[0];
        const question = visionInput.value.trim();
        if (!file) {
            alert('Please select an image file.');
            return;
        }
        if (!question) {
            alert('Please enter a question about the image.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('question', question);
        formData.append('modelId', visionModelSelect.value);

        visionResult.innerHTML = '<p>Analyzing image... <div class="loader"></div></p>';
        visionAnalyzeButton.disabled = true;

        try {
            console.log('Sending vision analysis request');
            const response = await fetch('/api/analyze-vision', {
                method: 'POST',
                body: formData
            });

            console.log('Response received:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Analysis result:', data);
            visionResult.innerHTML = `
                <h3>Analysis Result:</h3>
                <p>${data.result}</p>
                <p>Cost: $${data.cost.toFixed(4)}</p>
                <img src="${URL.createObjectURL(file)}" alt="Analyzed Image" style="max-width: 100%; margin-top: 10px;">
            `;
        } catch (error) {
            console.error('Error in vision analysis:', error);
            visionResult.innerHTML = `<p>Error analyzing image: ${error.message}</p>`;
        } finally {
            visionAnalyzeButton.disabled = false;
            visionFileInput.value = ''; // Reset file input
            visionInput.value = ''; // Reset question input
        }
    }

    // Call fetchVisionModels when the module is initialized
    fetchVisionModels();

    return { handleVisionAnalysis, fetchVisionModels };
}

// Add this CSS to your styles.css file or include it in the <style> tag of your HTML
/*
.loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-left: 10px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
*/
