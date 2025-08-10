import OpenAI from 'openai';

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

    if (!metadata) {
      return res.status(400).json({ error: 'No metadata provided' });
    }

    console.log('Generating like message for metadata:', metadata);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Based on this outfit analysis: "${metadata}", generate a personalized message that starts with "You seem to like..." and describes what the user likes about this outfit's style. Focus ONLY on the style elements, colors, aesthetic, and overall vibe - NOT on how to recreate it. Keep it friendly, encouraging, and under 100 characters. Examples: "You seem to like bold color combinations and statement pieces" or "You seem to like elegant, minimalist styles with clean lines".`
        }
      ],
      max_tokens: 100
    });

    const message = response.choices[0].message.content;
    console.log('Generated like message:', message);

    res.status(200).json({ message });
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
      error: 'Failed to generate like message. Please try again.',
      details: error.message
    });
  }
}
