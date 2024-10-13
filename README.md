# YOGI (Your Own Generative Interface)

YOGI is a web-based application that integrates various AI models and services, providing a unified interface for chat, image generation, vision analysis, and more.

## Features

- Chat interface with multiple AI model support (OpenAI, Anthropic, Groq, Mistral)
- Image generation using various AI models
- Vision analysis (upload an image and ask questions about it)
- Notion integration for data synchronization
- API key management for various AI services
- Usage statistics tracking
- Modular architecture for easy expansion and maintenance

## Recent Updates

- Implemented chat functionality with support for multiple AI providers
- Updated model selection to dynamically populate available models
- Added detailed logging for troubleshooting
- Improved error handling and user feedback

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/Minocrisy/YOGI.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables in a `.env` file. Required variables include:
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY
   - GROQ_API_KEY
   - MISTRAL_API_KEY
   - HUGGINGFACE_API_KEY
   - ELEVENLABS_API_KEY
   - NOTION_API_KEY
   - NOTION_DATABASE_ID

4. Start the server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000` (or the port specified in your console output).

## Usage

1. **Chat**: Select a model from the dropdown and start chatting. The application supports various AI models for text generation.

2. **Image Generation**: Choose an image generation model, provide a prompt, and generate images.

3. **Vision Analysis**: Upload an image, select a vision model, and ask questions about the image content.

4. **API Management**: Add, remove, or view API keys for different services in the API Management tab.

5. **Notion Integration**: Sync your YOGI data with Notion using the integration feature.

## Project Structure

- `server.js`: Main server file handling API routes and server setup
- `public/`: Frontend files
  - `index.html`: Main HTML file
  - `app.js`: Main JavaScript file for the frontend
  - `styles.css`: Main CSS file
  - `js/modules/`: Contains modular JavaScript files for different functionalities

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-branch-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI, Anthropic, Groq, Mistral, and other AI providers for their APIs
- The open-source community for various libraries and tools used in this project
