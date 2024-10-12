const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { Client } = require('@notionhq/client');
const { Groq } = require('groq-sdk');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize clients
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Set up multer for handling file uploads
const upload = multer({ dest: uploadsDir });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize storage from .env
let apiKeys = Object.entries(process.env)
  .filter(([key]) => key.endsWith('_API_KEY'))
  .map(([key, value]) => ({
    id: key,
    name: key.replace('_API_KEY', ''),
    value: value
  }));

// Default models
let models = [
  { id: 'groq-mixtral', name: 'Groq Mixtral', type: 'text', provider: 'groq' },
  { id: 'hf-flux', name: 'Hugging Face FLUX', type: 'image', provider: 'huggingface' },
  { id: 'meta-llama/Llama-3.2-11B-Vision-Instruct', name: 'Llama 3.2 Vision', type: 'vision', provider: 'huggingface' },
  { id: 'openai-gpt4', name: 'OpenAI GPT-4', type: 'text', provider: 'openai' },
  { id: 'openai-dalle3', name: 'OpenAI DALL-E 3', type: 'image', provider: 'openai' },
  { id: 'mistral-large', name: 'Mistral Large', type: 'text', provider: 'mistral' },
  { id: 'elevenlabs-tts', name: 'ElevenLabs TTS', type: 'audio', provider: 'elevenlabs' },
  { id: 'anthropic-claude', name: 'Anthropic Claude', type: 'text', provider: 'anthropic' },
  { id: 'placeholder-video', name: 'Placeholder Video Model', type: 'video', provider: 'placeholder' },
];

let usageStats = { totalCalls: 0, totalCost: 0, byModel: {} };

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Management Routes

// API Keys
app.get('/api/keys', (req, res) => {
  res.json(apiKeys.map(key => ({ id: key.id, name: key.name, value: '****' + key.value.slice(-4) })));
});

app.post('/api/keys', async (req, res) => {
  const { name, value } = req.body;
  const id = `${name.toUpperCase()}_API_KEY`;
  const newKey = { id, name, value };
  apiKeys.push(newKey);
  
  // Update .env file
  await fs.appendFile('.env', `\n${id}=${value}`);
  
  res.status(201).json({ id: newKey.id, name: newKey.name });
});

app.delete('/api/keys/:id', async (req, res) => {
  const { id } = req.params;
  apiKeys = apiKeys.filter(key => key.id !== id);
  
  // Update .env file
  const envContent = await fs.readFile('.env', 'utf-8');
  const updatedContent = envContent.split('\n').filter(line => !line.startsWith(`${id}=`)).join('\n');
  await fs.writeFile('.env', updatedContent);
  
  res.sendStatus(204);
});

// Models
app.get('/api/models', (req, res) => {
  console.log('Sending models:', models);
  res.json(models);
});

app.post('/api/models', (req, res) => {
  const { name, type, provider } = req.body;
  const newModel = { id: Date.now().toString(), name, type, provider };
  models.push(newModel);
  res.status(201).json(newModel);
});

app.delete('/api/models/:id', (req, res) => {
  const { id } = req.params;
  models = models.filter(model => model.id !== id);
  res.sendStatus(204);
});

// Usage Stats
app.get('/api/usage', (req, res) => {
  res.json(usageStats);
});

// Helper function to update usage stats
function updateUsageStats(model, cost) {
  usageStats.totalCalls++;
  usageStats.totalCost += cost;
  usageStats.byModel[model] = (usageStats.byModel[model] || 0) + 1;
}

// Chat route
app.post('/api/chat', async (req, res) => {
  const { message, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'text') {
      return res.status(400).json({ error: 'Invalid model selected for chat' });
    }

    let response;
    let cost = 0;

    if (model.provider === 'groq') {
      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: message }],
          model: "mixtral-8x7b-32768",
        });
        response = completion.choices[0]?.message?.content || 'No response generated';
        cost = 0.01; // Example cost
      } catch (error) {
        if (error.status === 503) {
          return res.status(503).json({ error: 'Groq service is currently unavailable. Please try again later.' });
        }
        throw error; // Re-throw if it's not a 503 error
      }
    } else {
      // Placeholder for other providers
      response = `Chat response from ${model.name} (${model.provider}) - Not yet implemented`;
      cost = 0.01; // Example cost
    }

    updateUsageStats(model.name, cost);
    res.json({ response, cost });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to generate response. Please try again later.' });
  }
});

// Image generation route
app.post('/api/generate-image', async (req, res) => {
  const { prompt, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'image') {
      return res.status(400).json({ error: 'Invalid model selected for image generation' });
    }

    let imageUrl;
    let cost = 0;

    if (model.provider === 'huggingface') {
      const response = await hf.textToImage({
        inputs: prompt,
        model: "black-forest-labs/FLUX.1-dev",
      });

      // Convert the blob to base64
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      imageUrl = `data:image/jpeg;base64,${base64}`;
      cost = 0.02; // Example cost
    } else {
      // Placeholder for other providers
      imageUrl = 'https://via.placeholder.com/512x512.png?text=Image+Generation+Not+Implemented';
      cost = 0.02; // Example cost
    }

    updateUsageStats(model.name, cost);
    res.json({ imageUrl, cost });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Vision analysis route
app.post('/api/analyze-vision', upload.single('image'), async (req, res) => {
  console.log('Vision analysis request received');
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { question, modelId } = req.body;

    if (!question) {
      console.error('No question provided');
      return res.status(400).json({ error: 'No question provided' });
    }

    console.log('Question:', question);
    console.log('Model ID:', modelId);

    const imagePath = req.file.path;
    console.log('Image saved at:', imagePath);

    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'vision') {
      console.error('Invalid model selected:', modelId);
      return res.status(400).json({ error: 'Invalid model selected for vision analysis' });
    }

    let result;
    let cost = 0;

    if (model.provider === 'huggingface') {
      console.log('Using Hugging Face for vision analysis');
      const image = await fs.readFile(imagePath);
      const response = await hf.visualQuestionAnswering({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
        inputs: {
          image: image,
          question: question,
        },
      });
      result = response.answer;
      cost = 0.05; // Example cost
      console.log('Vision analysis result:', result);
    } else {
      // Placeholder for other providers
      console.log('Using placeholder for vision analysis');
      result = `Vision analysis from ${model.name} (${model.provider}) - Not yet implemented`;
      cost = 0.05; // Example cost
    }

    updateUsageStats(model.name, cost);
    res.json({ result, cost });

    // Clean up the uploaded file
    await fs.unlink(imagePath);
    console.log('Temporary image file deleted');
  } catch (error) {
    console.error('Error in vision analysis:', error);
    res.status(500).json({ error: 'Failed to analyze image. Please try again later.', details: error.message });
  }
});

// Video generation route (placeholder)
app.post('/api/generate-video', async (req, res) => {
  const { prompt, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'video') {
      return res.status(400).json({ error: 'Invalid model selected for video generation' });
    }

    // Placeholder response
    res.json({ message: 'Video generation is not yet implemented.' });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

// Audio generation route (placeholder)
app.post('/api/generate-audio', async (req, res) => {
  const { prompt, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'audio') {
      return res.status(400).json({ error: 'Invalid model selected for audio generation' });
    }

    // Placeholder response
    res.json({ message: 'Audio generation is not yet implemented.' });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// Notion sync route
app.post('/api/sync-notion', async (req, res) => {
  try {
    // Here you would implement the actual Notion synchronization logic
    // For now, we'll just return a success message
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate some work
    res.json({ message: 'Successfully synced with Notion' });
  } catch (error) {
    console.error('Error syncing with Notion:', error);
    res.status(500).json({ error: 'Failed to sync with Notion' });
  }
});

// New Notion command route
app.post('/api/notion-command', async (req, res) => {
  const { command } = req.body;
  try {
    // Here you would implement the logic to handle different Notion commands
    // For now, we'll just return a success message
    let result;
    if (command.startsWith('https://www.notion.so/')) {
      result = 'Fetched Notion page content';
    } else {
      result = 'Executed Notion command';
    }
    res.json({ message: result });
  } catch (error) {
    console.error('Error executing Notion command:', error);
    res.status(500).json({ error: 'Failed to execute Notion command' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});
