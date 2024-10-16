const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const multer = require('multer');
const { Client } = require('@notionhq/client');
const { Groq } = require('groq-sdk');
const { HfInference } = require('@huggingface/inference');
const OpenAI = require('openai');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
require('dotenv').config();

const app = express();
const DEFAULT_PORT = 3000;
let PORT = process.env.PORT || DEFAULT_PORT;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fsPromises.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Set up multer for handling file uploads
const upload = multer({ dest: uploadsDir });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Initialize API keys
let apiKeys = [
  { id: 'notion', name: 'Notion', value: process.env.NOTION_API_KEY },
  { id: 'groq', name: 'Groq', value: process.env.GROQ_API_KEY },
  { id: 'huggingface', name: 'HuggingFace', value: process.env.HUGGINGFACE_API_KEY },
  { id: 'openai', name: 'OpenAI', value: process.env.OPENAI_API_KEY },
  { id: 'gemini', name: 'Gemini', value: process.env.GEMINI_API_KEY },
  { id: 'mistral', name: 'Mistral AI', value: process.env.MISTRAL_API_KEY },
  { id: 'anthropic', name: 'Anthropic', value: process.env.ANTHROPIC_API_KEY },
  { id: 'elevenlabs', name: 'ElevenLabs', value: process.env.ELEVENLABS_API_KEY },
];

// Helper function to get API key
function getApiKey(name) {
  const key = apiKeys.find(k => k.name === name);
  return key ? key.value : null;
}

// Initialize clients
let notion = new Client({ auth: getApiKey('Notion') });
let groq = new Groq({ apiKey: getApiKey('Groq') });
let hf = new HfInference(getApiKey('HuggingFace'));
let openai = new OpenAI({ apiKey: getApiKey('OpenAI') });
let genai = new GoogleGenerativeAI(getApiKey('Gemini'));

// Function to update API clients
function updateApiClients() {
  notion = new Client({ auth: getApiKey('Notion') });
  groq = new Groq({ apiKey: getApiKey('Groq') });
  hf = new HfInference(getApiKey('HuggingFace'));
  openai = new OpenAI({ apiKey: getApiKey('OpenAI') });
  genai = new GoogleGenerativeAI(getApiKey('Gemini'));
}

// Initialize models
let models = [
  { id: 'groq-mixtral', name: 'Groq Mixtral', type: 'text', provider: 'groq' },
  { id: 'hf-flux', name: 'Hugging Face FLUX', type: 'image', provider: 'huggingface' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini Vision', type: 'vision', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini', type: 'text', provider: 'openai' },
  { id: 'openai-dalle3', name: 'OpenAI DALL-E 3', type: 'image', provider: 'openai' },
  { id: 'mistral-large', name: 'Mistral Large', type: 'text', provider: 'mistral' },
  { id: 'elevenlabs-tts', name: 'ElevenLabs TTS', type: 'audio', provider: 'elevenlabs' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', type: 'text', provider: 'anthropic' },
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', type: 'text', provider: 'anthropic' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', type: 'text', provider: 'anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', type: 'text', provider: 'google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro Vision', type: 'vision', provider: 'google' },
  { id: 'stabilityai/stable-video-diffusion-img2vid-xt', name: 'Stable Video Diffusion', type: 'video', provider: 'huggingface' },
  { id: 'whisper-1', name: 'Whisper', type: 'transcription', provider: 'openai' },
  { id: 'google-speech-to-text', name: 'Google Speech-to-Text', type: 'transcription', provider: 'google' },
  { id: 'amazon-transcribe', name: 'Amazon Transcribe', type: 'transcription', provider: 'amazon' },
];

// Initialize usage stats
let usageStats = { totalCalls: 0, totalCost: 0, byModel: {} };

// API Key routes
app.get('/api/keys', (req, res) => {
  res.json(apiKeys.map(key => ({ id: key.id, name: key.name })));
});

app.post('/api/keys', (req, res) => {
  const { name, value } = req.body;
  const newKey = { id: Date.now().toString(), name, value };
  apiKeys.push(newKey);
  updateApiClients();
  res.status(201).json({ id: newKey.id, name: newKey.name });
});

app.delete('/api/keys/:id', (req, res) => {
  const { id } = req.params;
  apiKeys = apiKeys.filter(key => key.id !== id);
  updateApiClients();
  res.sendStatus(204);
});

// Model routes
app.get('/api/models', (req, res) => {
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

// Chat route
app.post('/api/chat', upload.single('file'), async (req, res) => {
  const { modelId, type } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      return res.status(400).json({ error: 'Invalid model selected for chat' });
    }

    let message;
    let response;
    let cost = 0;

    // Process input based on type
    switch (type) {
      case 'text':
        message = req.body.message;
        break;
      case 'file':
      case 'image':
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileContent = await fsPromises.readFile(req.file.path, 'utf8');
        message = `File content: ${fileContent}`;
        break;
      case 'audio':
        if (!req.file) {
          return res.status(400).json({ error: 'No audio file uploaded' });
        }
        // Here you would typically transcribe the audio file
        // For now, we'll just acknowledge receipt of the audio file
        message = "Audio file received. Transcription: [Audio content would be transcribed here]";
        break;
      default:
        return res.status(400).json({ error: 'Invalid input type' });
    }

    // Process message with selected model
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
          model: "gpt-4o-mini",
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
            'x-api-key': getApiKey('Anthropic'),
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
            'Authorization': `Bearer ${getApiKey('Mistral AI')}`,
            'Content-Type': 'application/json'
          }
        });
        response = mistralResponse.data.choices[0].message.content;
        cost = 0.01; // Example cost
        break;
      case 'google':
        const geminiModel = genai.getGenerativeModel({ model: "gemini-pro" });
        const result = await geminiModel.generateContent(message);
        response = result.response.text();
        cost = 0.02; // Example cost
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
  } finally {
    // Clean up uploaded file if it exists
    if (req.file) {
      fsPromises.unlink(req.file.path).catch(console.error);
    }
  }
});

// Image Generation route
app.post('/api/generate-image', async (req, res) => {
  const { prompt, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'image') {
      return res.status(400).json({ error: 'Invalid model selected for image generation' });
    }

    let imageUrl;
    let cost = 0;

    switch (model.provider) {
      case 'huggingface':
        try {
          console.log('Attempting to generate image with Hugging Face API');
          console.log('Prompt:', prompt);
          console.log('Model:', model.id);
          
          const hfResponse = await hf.textToImage({
            inputs: prompt,
            model: "black-forest-labs/FLUX.1-dev",
            parameters: {
              guidance_scale: 7.5,
              num_inference_steps: 50,
              width: 768,
              height: 768,
            },
          });
          
          console.log('Hugging Face API response received');
          const buffer = Buffer.from(await hfResponse.arrayBuffer());
          const fileName = `${Date.now()}.png`;
          const filePath = path.join(uploadsDir, fileName);
          await fsPromises.writeFile(filePath, buffer);
          imageUrl = `/uploads/${fileName}`;
          cost = 0.05; // Example cost
          console.log('Image saved successfully:', imageUrl);
        } catch (error) {
          console.error('Hugging Face API error:', error);
          console.error('Error details:', error.response ? error.response.data : 'No additional details');
          return res.status(500).json({ error: 'Failed to generate image with Hugging Face API', details: error.message });
        }
        break;
      case 'openai':
        try {
          const openaiResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
          });
          imageUrl = openaiResponse.data[0].url;
          cost = 0.1; // Example cost
        } catch (error) {
          console.error('OpenAI API error:', error);
          return res.status(500).json({ error: 'Failed to generate image with OpenAI API', details: error.message });
        }
        break;
      default:
        return res.status(501).json({ error: 'Image generation not implemented for this provider' });
    }

    // Update usage stats
    usageStats.totalCalls++;
    usageStats.totalCost += cost;
    usageStats.byModel[model.name] = (usageStats.byModel[model.name] || 0) + 1;

    res.json({ imageUrl, cost });
  } catch (error) {
    console.error('Error in image generation:', error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
});

// Video Generation route
app.post('/api/generate-video', async (req, res) => {
  const { prompt, modelId, imageData } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'video') {
      return res.status(400).json({ error: 'Invalid model selected for video generation' });
    }

    let videoUrl;
    let cost = 0;

    if (model.provider === 'huggingface') {
      try {
        console.log('Attempting to generate video with Hugging Face API');
        console.log('Prompt:', prompt);
        console.log('Model:', model.id);

        if (imageData) {
          // Image to Video using Hugging Face API
          const hfResponse = await axios.post(
            `https://api-inference.huggingface.co/models/${model.id}`,
            {
              inputs: imageData,
              parameters: {
                prompt: prompt,
                num_inference_steps: 50,
                num_frames: 16,
                height: 320,
                width: 576,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${getApiKey('HuggingFace')}`,
                'Content-Type': 'application/json',
              },
              responseType: 'arraybuffer',
            }
          );

          console.log('Hugging Face API response received');
          const buffer = Buffer.from(hfResponse.data);
          const fileName = `${Date.now()}.mp4`;
          const filePath = path.join(uploadsDir, fileName);
          await fsPromises.writeFile(filePath, buffer);
          videoUrl = `/uploads/${fileName}`;
          cost = 0.5; // Example cost, adjust as needed
          console.log('Video saved successfully:', videoUrl);
        } else {
          console.log('Text to Video generation is not yet implemented');
          return res.status(501).json({ error: 'Text to Video generation is not yet implemented' });
        }
      } catch (error) {
        console.error('Hugging Face API error:', error);
        let errorMessage = 'Unknown error occurred';
        if (error.response) {
          if (error.response.data instanceof Buffer) {
            errorMessage = error.response.data.toString('utf8');
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        }
        console.error('Error details:', errorMessage);
        return res.status(500).json({ error: 'Failed to generate video with Hugging Face API', details: errorMessage });
      }
    } else {
      return res.status(501).json({ error: 'Video generation not implemented for this provider' });
    }

    // Update usage stats
    usageStats.totalCalls++;
    usageStats.totalCost += cost;
    usageStats.byModel[model.name] = (usageStats.byModel[model.name] || 0) + 1;

    res.json({ videoUrl, cost });
  } catch (error) {
    console.error('Error in video generation:', error);
    res.status(500).json({ error: 'Failed to generate video', details: error.message });
  }
});

// Audio Generation route
app.post('/api/generate-audio', async (req, res) => {
  const { prompt, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'audio') {
      return res.status(400).json({ error: 'Invalid model selected for audio generation' });
    }

    let audioUrl;
    let cost = 0;

    if (model.provider === 'elevenlabs') {
      try {
        console.log('Attempting to generate audio with ElevenLabs API');
        console.log('Prompt:', prompt);
        console.log('Model:', model.id);

        const elevenLabsResponse = await axios.post(
          'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
          {
            text: prompt,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          },
          {
            headers: {
              'Accept': 'audio/mpeg',
              'xi-api-key': getApiKey('ElevenLabs'),
              'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'
          }
        );

        console.log('ElevenLabs API response received');
        const buffer = Buffer.from(elevenLabsResponse.data);
        const fileName = `${Date.now()}.mp3`;
        const filePath = path.join(uploadsDir, fileName);
        await fsPromises.writeFile(filePath, buffer);
        audioUrl = `/uploads/${fileName}`;
        cost = 0.05; // Example cost, adjust as needed
        console.log('Audio saved successfully:', audioUrl);
      } catch (error) {
        console.error('ElevenLabs API error:', error);
        let errorMessage = 'Unknown error occurred';
        if (error.response) {
          if (error.response.data instanceof Buffer) {
            errorMessage = error.response.data.toString('utf8');
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        }
        console.error('Error details:', errorMessage);
        return res.status(500).json({ error: 'Failed to generate audio with ElevenLabs API', details: errorMessage });
      }
    } else {
      return res.status(501).json({ error: 'Audio generation not implemented for this provider' });
    }

    // Update usage stats
    usageStats.totalCalls++;
    usageStats.totalCost += cost;
    usageStats.byModel[model.name] = (usageStats.byModel[model.name] || 0) + 1;

    res.json({ audioUrl, cost });
  } catch (error) {
    console.error('Error in audio generation:', error);
    res.status(500).json({ error: 'Failed to generate audio', details: error.message });
  }
});

// Vision Analysis route
app.post('/api/analyze-vision', upload.single('image'), async (req, res) => {
  const { question, modelId } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'vision') {
      return res.status(400).json({ error: 'Invalid model selected for vision analysis' });
    }

    let result;
    let cost = 0;

    const imageBuffer = await fsPromises.readFile(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    switch (model.provider) {
      case 'openai':
        try {
          const openaiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: question },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ],
              },
            ],
          });
          result = openaiResponse.choices[0].message.content;
          cost = 0.1; // Example cost
        } catch (error) {
          console.error('OpenAI Vision API error:', error);
          return res.status(500).json({ error: 'Failed to analyze image with OpenAI Vision API', details: error.message });
        }
        break;
      case 'google':
        try {
          const geminiModel = genai.getGenerativeModel({ model: "gemini-1.5-pro" });
          const geminiResponse = await geminiModel.generateContent([
            question,
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          ]);
          result = geminiResponse.response.text();
          cost = 0.05; // Example cost
        } catch (error) {
          console.error('Gemini Vision API error:', error);
          return res.status(500).json({ error: 'Failed to analyze image with Gemini Vision API', details: error.message });
        }
        break;
      default:
        return res.status(501).json({ error: 'Vision analysis not implemented for this provider' });
    }

    // Update usage stats
    usageStats.totalCalls++;
    usageStats.totalCost += cost;
    usageStats.byModel[model.name] = (usageStats.byModel[model.name] || 0) + 1;

    res.json({ result, cost });
  } catch (error) {
    console.error('Error in vision analysis:', error);
    res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  } finally {
    // Clean up the uploaded file
    if (req.file) {
      fsPromises.unlink(req.file.path).catch(console.error);
    }
  }
});

// Transcription route
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  const { modelId, url } = req.body;
  try {
    const model = models.find(m => m.id === modelId);
    if (!model || model.type !== 'transcription') {
      return res.status(400).json({ error: 'Invalid model selected for transcription' });
    }

    let transcription;
    let cost = 0;

    if (url) {
      // Handle URL transcription
      transcription = await transcribeUrl(url, model);
    } else if (req.file) {
      // Handle file transcription
      transcription = await transcribeFile(req.file.path, model);
    } else {
      return res.status(400).json({ error: 'No file or URL provided for transcription' });
    }

    // Update usage stats
    usageStats.totalCalls++;
    usageStats.totalCost += cost;
    usageStats.byModel[model.name] = (usageStats.byModel[model.name] || 0) + 1;

    res.json({ transcription, cost });
  } catch (error) {
    console.error('Error in transcription:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  } finally {
    // Clean up the uploaded file if it exists
    if (req.file) {
      fsPromises.unlink(req.file.path).catch(console.error);
    }
  }
});

async function transcribeFile(filePath, model) {
  const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
  const fileExtension = path.extname(filePath).toLowerCase().slice(1);

  if (!supportedFormats.includes(fileExtension)) {
    const convertedFilePath = await convertToSupportedFormat(filePath);
    filePath = convertedFilePath;
  }

  switch (model.provider) {
    case 'openai':
      const transcriptionFile = fs.createReadStream(filePath);
      try {
        const openaiResponse = await openai.audio.transcriptions.create({
          file: transcriptionFile,
          model: "whisper-1",
        });
        return openaiResponse.text;
      } finally {
        transcriptionFile.close();
      }
    case 'google':
      // Implement Google Speech-to-Text API call here
      return "Google Speech-to-Text transcription not implemented yet";
    case 'amazon':
      // Implement Amazon Transcribe API call here
      return "Amazon Transcribe transcription not implemented yet";
    default:
      throw new Error('Transcription not implemented for this provider');
  }
}

async function transcribeUrl(url, model) {
  try {
    const tempFilePath = path.join(uploadsDir, `temp_${Date.now()}.mp3`);
    
    if (ytdl.validateURL(url)) {
      // If it's a YouTube URL, use ytdl to download the audio
      await new Promise((resolve, reject) => {
        ytdl(url, { filter: 'audioonly' })
          .pipe(fs.createWriteStream(tempFilePath))
          .on('finish', resolve)
          .on('error', reject);
      });
    } else {
      // For other URLs, use axios to download the file
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
      });
      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }

    // Transcribe the downloaded file
    const transcription = await transcribeFile(tempFilePath, model);

    // Clean up the temporary file
    await fsPromises.unlink(tempFilePath);

    return transcription;
  } catch (error) {
    console.error('Error in URL transcription:', error);
    throw new Error('Failed to transcribe URL');
  }
}

async function convertToSupportedFormat(inputPath) {
  const outputPath = path.join(uploadsDir, `converted_${Date.now()}.mp3`);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .on('error', (err) => {
        console.error('Error converting file:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('Conversion finished');
        resolve(outputPath);
      })
      .save(outputPath);
  });
}

// Summarization route
app.post('/api/summarize', async (req, res) => {
  const { transcription, model } = req.body;
  try {
    if (!transcription) {
      return res.status(400).json({ error: 'No transcription provided for summarization' });
    }

    const openaiResponse = await openai.chat.completions.create({
      model: model || "gpt-3.5-turbo",
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes transcriptions.' },
        { role: 'user', content: `Please summarize the following transcription:\n\n${transcription}` }
      ],
    });

    const summary = openaiResponse.choices[0].message.content;
    res.json({ summary });
  } catch (error) {
    console.error('Error in summarization:', error);
    res.status(500).json({ error: 'Failed to summarize transcription', details: error.message });
  }
});

// Usage stats route
app.get('/api/usage-stats', (req, res) => {
  res.json(usageStats);
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
