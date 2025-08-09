import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Test endpoint
app.get('/api/test', (req, res) => {
  const openaiKeyConfigured = !!process.env.OPENAI_API_KEY;
  const openaiKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
  const openaiKeyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'none';

  res.json({ 
    status: 'Local API is working',
    timestamp: new Date().toISOString(),
    environment: {
      openaiKeyConfigured,
      openaiKeyLength,
      openaiKeyPrefix: openaiKeyPrefix === 'none' ? 'none' : `${openaiKeyPrefix}...`,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// OpenAI analyze endpoint (same as Vercel)
app.post('/api/analyze', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log('Received image request, image length:', image ? image.length : 0);
    console.log('OpenAI API key configured:', !!process.env.OPENAI_API_KEY);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Convert base64 to data URL format that OpenAI expects
    const imageUrl = `data:image/jpeg;base64,${image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this fashion outfit in 2-3 short sentences. Focus on: 1) Key clothing items to recreate the look, 2) One specific styling tip. Keep it concise and actionable."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 150
    });

    const analysis = response.choices[0].message.content;
    console.log('OpenAI analysis generated successfully, length:', analysis.length);

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded. Please check your OpenAI account billing.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your configuration.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to analyze image. Please try again.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local test server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔍 OpenAI API key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  if (process.env.OPENAI_API_KEY) {
    console.log(`🔑 API key prefix: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
  }
});
