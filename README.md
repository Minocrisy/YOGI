# YOGI - Your Own Generative Interface

YOGI is a versatile AI-powered application that integrates various generative AI models for text, image, and video generation. It provides a user-friendly interface for interacting with different AI models and managing API keys.

## Features

- **Chat Generation**: Engage in conversations with various language models.
- **Image Generation**: Create images from text descriptions.
- **Vision Analysis**: Analyze and describe images.
- **Video Generation**: Generate videos from text prompts or images (currently in development).
- **Audio Generation**: Create audio content (placeholder for future implementation).
- **Notion Integration**: Sync data with Notion (placeholder for future implementation).
- **API Key Management**: Securely manage API keys for different services.
- **Model Management**: Add, remove, and select different AI models.
- **Usage Tracking**: Monitor API calls and associated costs.

## Recent Updates

- Implemented image generation functionality.
- Added vision analysis capabilities.
- Integrated multiple chat models (Groq, OpenAI, Anthropic, Mistral, Google).
- Started development on video generation feature (currently facing some challenges).
- Improved error handling and user feedback.

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

1. Select the desired tab for the type of generation you want (Chat, Image, Vision, etc.).
2. Choose a model from the dropdown menu.
3. Enter your prompt or upload an image as required.
4. Click the generate button to receive the AI-generated response.

## Known Issues

- Video generation is currently not functioning as expected. We are working on resolving issues with the Hugging Face API integration for this feature.

## Future Plans

- Implement text-to-video generation.
- Add audio generation capabilities.
- Enhance Notion integration features.
- Improve error handling and user experience.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
