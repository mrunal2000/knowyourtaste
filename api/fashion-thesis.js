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

    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return res.status(400).json({ error: 'No metadata array provided' });
    }

    console.log('Generating fashion thesis with metadata count:', metadata.length);

    // Combine all metadata into a single context
    const combinedContext = metadata.join('. ');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fashion expert who gives simple, direct advice. Use plain, everyday language. No fancy words, no flowery descriptions, no verbose language. Write like you're talking to a friend - simple and clear."
        },
        {
          role: "user",
          content: `Based on these outfit analyses: "${combinedContext}", write a simple fashion summary in exactly 3 short sentences. Use plain, everyday words. Say: 1) What style you like (simple words), 2) What clothes you prefer, 3) One tip. NO fancy language, NO long sentences, NO decorative words.`
        }
      ],
      max_tokens: 100
    });

    const thesis = response.choices[0].message.content;
    console.log('Generated fashion thesis:', thesis);

    res.status(200).json({ thesis });
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
      error: 'Failed to generate fashion thesis. Please try again.',
      details: error.message
    });
  }
}
