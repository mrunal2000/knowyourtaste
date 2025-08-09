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
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('Received image request, image length:', image ? image.length : 0);
    console.log('OpenAI API key configured:', !!process.env.OPENAI_API_KEY);

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
              text: "Analyze this fashion outfit and provide styling advice. Give me specific suggestions for how to recreate this look, including clothing items, accessories, colors, and styling tips. Be detailed and practical in your recommendations."
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
      max_tokens: 500
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
}
