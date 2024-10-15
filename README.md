# YOGI - Your Own Generative Interface

YOGI is a versatile AI-powered application that integrates various generative AI models for text, image, audio, and vision analysis. It provides a user-friendly interface for interacting with different AI models and managing API keys.

## Features

- **Chat Generation**: Engage in conversations with various language models, now supporting text, file, image, and audio inputs.
- **Image Generation**: Create images from text descriptions.
- **Vision Analysis**: Analyze and describe images using OpenAI's GPT-4o-mini or Google's Gemini 1.5 Pro Vision.
- **Video Generation**: Generate videos from text prompts or images (currently in development).
- **Audio Generation**: Create audio content using ElevenLabs TTS.
- **Notion Integration**: Sync data with Notion (placeholder for future implementation).
- **API Key Management**: Securely manage API keys for different services.
- **Model Management**: Add, remove, and select different AI models.
- **Usage Tracking**: Monitor API calls and associated costs.

## Recent Updates

- Enhanced chat functionality to support text, file, image, and audio inputs.
- Updated the chat UI to include buttons for file, image, and voice input.
- Improved error handling and user feedback across all modules.
- Enhanced vision analysis capabilities, now supporting both OpenAI's GPT-4o-mini and Google's Gemini 1.5 Pro Vision.
- Implemented audio generation functionality using ElevenLabs TTS.
- Integrated multiple chat models (Groq, OpenAI, Anthropic, Mistral, Google).

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/YOGI.git
   cd YOGI
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your API keys:
   ```
   NOTION_API_KEY=your_notion_api_key
   GROQ_API_KEY=your_groq_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Usage

1. Select the desired tab for the type of generation you want (Chat, Image, Vision, Audio, etc.).
2. Choose a model from the dropdown menu.
3. Enter your prompt or upload a file/image/audio as required.
4. Click the generate button to receive the AI-generated response.

### Chat

The chat feature now supports multiple input types:
1. Text: Type your message in the input field.
2. File: Click the file button to upload and send a text file.
3. Image: Click the image button to upload and send an image file.
4. Voice: Click the voice button to record and send an audio message.

### Vision Analysis

To use the vision analysis feature:

1. Go to the Vision tab.
2. Select either "GPT-4o-mini Vision" (OpenAI) or "Gemini 1.5 Pro Vision" (Google) from the model dropdown.
3. Upload an image using the file input.
4. Enter a question or prompt about the image in the text input.
5. Click the "Analyze" button to get the AI's analysis of the image.
6. A loading indicator will appear during the analysis process.
7. Once complete, the analysis result will be displayed along with the cost of the operation.

## Known Issues

- Video generation is currently not functioning as expected. We are working on resolving issues with the Hugging Face API integration for this feature.

## Future Plans

- Implement text-to-video generation.
- Enhance Notion integration features.
- Improve error handling and user experience.
- Add support for more vision analysis models.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
