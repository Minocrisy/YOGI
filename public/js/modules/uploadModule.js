export function initUploadModule(addMessageToChat) {
    const fileUploadBtn = document.querySelector('.file-upload');
    const imageUploadBtn = document.querySelector('.image-upload');

    fileUploadBtn.addEventListener('click', handleFileUpload);
    imageUploadBtn.addEventListener('click', handleImageUpload);

    function handleFileUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.pdf,.doc,.docx';
        fileInput.onchange = processFileUpload;
        fileInput.click();
    }

    function handleImageUpload() {
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.onchange = processImageUpload;
        imageInput.click();
    }

    async function processFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target.result;
                addMessageToChat('User', `Uploaded file: ${file.name}`);
                // Here you would typically send the file content to the server
                // For now, we'll just add it to the chat
                addMessageToChat('YOGI', `File content received: ${file.name}`);
            };
            reader.readAsText(file);
        }
    }

    async function processImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                addMessageToChat('User', `Uploaded image: ${file.name}`);
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '200px';
                img.style.maxHeight = '200px';
                const lastMessage = document.querySelector('#chat-messages').lastElementChild;
                lastMessage.appendChild(img);
                // Here you would typically send the image to the server
                // For now, we'll just add a confirmation message
                addMessageToChat('YOGI', `Image received: ${file.name}`);
            };
            reader.readAsDataURL(file);
        }
    }

    return { handleFileUpload, handleImageUpload };
}
