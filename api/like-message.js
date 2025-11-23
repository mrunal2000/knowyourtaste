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
    return res.status(200).end();
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
          role: "system",
          content: `
You are a fashion stylist AI. Analyze the outfit metadata in detail. 

Instructions:
- Focus ONLY on concrete style elements: colors, patterns, textures, accessories, and overall vibe.
- Be precise: mention standout pieces or combinations (e.g., "bright mustard jacket," "floral midi dress," "chunky sneakers").
- Avoid vague adjectives like "edgy" or "relaxed."
- Start the message with "You seem to like..."
- Keep it friendly, encouraging, and under 100 characters.
- Examples:
  • "You seem to like mustard jackets paired with statement sneakers"
  • "You seem to like floral dresses with delicate, pastel accessories"
`
        },
        {
          role: "user",
          content: `Outfit metadata: "${metadata}"`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    let message = response.choices[0].message.content.trim();

    // Ensure message is <= 100 characters
    if (message.length > 100) {
      message = message.slice(0, 97) + '...';
    }

    console.log('Generated like message:', message);

    res.status(200).json({ message });

  } catch (error) {
    console.error('OpenAI API error:', error);

    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ error: 'OpenAI API quota exceeded. Please check your billing.' });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid OpenAI API key. Please check your configuration.' });
    }

    res.status(500).json({
      error: 'Failed to generate like message. Please try again.',
      details: error.message
    });
  }
}
