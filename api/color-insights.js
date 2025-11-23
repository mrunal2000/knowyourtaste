import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metadata } = req.body;

    if (!metadata || !Array.isArray(metadata)) {
      return res.status(400).json({ error: 'Metadata array is required' });
    }

    const prompt = `Based on these fashion outfit descriptions, analyze the color preferences and create a color palette. 

IMPORTANT: Provide colors in this EXACT format:
#HEXCODE - Color Name (e.g., #FF6B6B - Coral Red)

Focus on:
1. **Primary Colors**: 3-4 main colors the user gravitates toward
2. **Accent Colors**: 2-3 complementary colors they use
3. **Neutral Colors**: 2-3 neutral/base colors they prefer

Outfit descriptions:
${metadata.join('\n')}

Provide ONLY the color palette in hex format with color names. No explanations, just the colors.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a fashion color analyst expert. Provide ONLY a color palette in hex format with color names. Use the exact format: #HEXCODE - Color Name. Focus on identifying the actual colors the user chooses, not abstract analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const insights = completion.choices[0].message.content;

    res.status(200).json({ insights });
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
      error: 'Failed to generate color insights. Please try again.',
      details: error.message
    });
  }
}
