const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { Client } = require('@notionhq/client');
const { Groq } = require('groq-sdk');
const { HfInference } = require('@huggingface/inference');
const OpenAI = require('openai');
const axios = require('axios');
require('dotenv').config();

const app = express();
const DEFAULT_PORT = 3000;
let PORT = process.env.PORT || DEFAULT_PORT;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Set up multer for handling file uploads
const upload = multer({ dest: uploadsDir });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize clients
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize models
let models = [
  { id: 'groq-mixtral', name: 'Groq Mixtral', type: 'text', provider: 'groq' },
  { id: 'hf-flux', name: 'Hugging Face FLUX', type: 'image', provider: 'huggingface' },
  { id: 'salesforce/blip-image-captioning-large', name: 'BLIP Image Captioning', type: 'vision', provider: 'huggingface' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini Vision', type: 'vision', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini', type: 'text', provider: 'openai' },
  { id: 'openai-dalle3', name: 'OpenAI DALL-E 3', type: 'image', provider: 'openai' },
  { id: 'mistral-large', name: 'Mistral Large', type: 'text', provider: 'mistral' },
  { id: 'elevenlabs-tts', name: 'ElevenLabs TTS', type: 'audio', provider: 'elevenlabs' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', type: 'text', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', type: 'text', provider: 'anthropic' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', type: 'text', provider: 'anthropic' },
  { id: 'placeholder-video', name: 'Placeholder Video Model', type: 'video', provider: 'placeholder' },
];

// Initialize usage stats
let usageStats = { totalCalls: 0, totalCost: 0, byModel: {} };

// API routes
app.get('/api/models', (req, res) => {
  console.log('GET /api/models - Sending models');
  console.log('Models:', JSON.stringify(models, null, 2));
  try {
    res.json(models);
  } catch (error) {
    console.error('Error sending models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/models', (req, res) => {
  console.log('POST /api/models - Adding new model');
  const { name, type, provider } = req.body;
  const newModel = { id: Date.now().toString(), name, type, provider };
  models.push(newModel);
  res.status(201).json(newModel);
});

app.delete('/api/models/:id', (req, res) => {
  console.log(`DELETE /api/models/${req.params.id} - Removing model`);
  const { id } = req.params;
  models = models.filter(model => model.id !== id);
  res.sendStatus(204);
});

// Chat route
app.post('/api/chat', async (req, res) => {
  console.log('POST /api/chat - Processing chat request');
  const { message, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      return res.status(400).json({ error: 'Invalid model selected for chat' });
    }

    let response;
    let cost = 0;

    switch (model.provider) {
      case 'groq':
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: message }],
          model: "mixtral-8x7b-32768",
        });
        response = completion.choices[0]?.message?.content || 'No response generated';
        cost = 0.01; // Example cost
        break;
      case 'openai':
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Using gpt-4o-mini as specified
          messages: [{ role: "user", content: message }],
          max_tokens: 300,
        });
        response = openaiResponse.choices[0].message.content;
        cost = 0.03; // Example cost
        break;
      case 'anthropic':
        const anthropicResponse = await axios.post('https://api.anthropic.com/v1/messages', {
          model: model.id,
          max_tokens: 1024,
          messages: [{ role: "user", content: message }]
        }, {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        });
        response = anthropicResponse.data.content[0].text;
        cost = 0.02; // Example cost
        break;
      case 'mistral':
        const mistralResponse = await axios.post('https://api.mistral.ai/v1/chat/completions', {
          model: "mistral-large-latest",
          messages: [{ role: "user", content: message }],
          max_tokens: 300
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        response = mistralResponse.data.choices[0].message.content;
        cost = 0.01; // Example cost
        break;
      default:
        response = `Chat response from ${model.name} (${model.provider}) - Not yet implemented`;
        cost = 0.01; // Example cost
    }

    // Update usage stats
    usageStats.totalCalls++;
    usageStats.totalCost += cost;
    usageStats.byModel[model.name] = (usageStats.byModel[model.name] || 0) + 1;

    res.json({ response, cost });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

// Vision analysis route
app.post('/api/analyze-vision', upload.single('image'), async (req, res) => {
  console.log('POST /api/analyze-vision - Processing vision analysis request');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { question, modelId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }

    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'vision') {
      return res.status(400).json({ error: 'Invalid model selected for vision analysis' });
    }

    const imagePath = req.file.path;
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    let result;
    let cost = 0;

    switch (model.provider) {
      case 'huggingface':
        try {
          const response = await hf.imageToText({
            model: "salesforce/blip-image-captioning-large",
            data: imageBuffer,
          });
          result = `Image caption: ${response.generated_text}\n\nQuestion: ${question}\n\nUnfortunately, I can't answer specific questions about the image content. I can only provide a general caption of what I see in the image.`;
          cost = 0.05; // Example cost
        } catch (error) {
          console.error('Hugging Face API error:', error);
          throw new Error('Failed to analyze image with Hugging Face API');
        }
        break;

      case 'openai':
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: question },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 300,
          });
          result = response.choices[0].message.content;
          cost = 0.1; // Example cost
        } catch (error) {
          console.error('OpenAI API error:', error);
          throw new Error('Failed to analyze image with OpenAI API');
        }
        break;

      default:
        throw new Error('Vision analysis not implemented for this provider');
    }

    // Update usage stats
    usageStats.totalCalls++;
    usageStats.totalCost += cost;
    usageStats.byModel[model.name] = (usageStats.byModel[model.name] || 0) + 1;

    res.json({ result, cost });

    // Clean up the uploaded file
    await fs.unlink(imagePath);
  } catch (error) {
    console.error('Error in vision analysis:', error);
    res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  }
});

function startServer(port) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Uploads directory: ${uploadsDir}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying the next one...`);
      startServer(port + 1);
    } else {
      console.error('Error starting server:', err);
    }
  });
}

startServer(PORT);
