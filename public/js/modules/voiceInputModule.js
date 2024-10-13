export function initVoiceInputModule() {
    const voiceInputBtn = document.querySelector('.voice-input');
    const chatInput = document.querySelector('#chat .user-input');

    voiceInputBtn.addEventListener('click', handleVoiceInput);

    function handleVoiceInput() {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                voiceInputBtn.textContent = 'Listening...';
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                chatInput.value = transcript;
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                voiceInputBtn.textContent = 'Voice Input';
            };

            recognition.onend = () => {
                voiceInputBtn.textContent = 'Voice Input';
            };

            recognition.start();
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    }

    return { handleVoiceInput };
}
