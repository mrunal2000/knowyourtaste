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

    console.log('Generating stylist-like like message for metadata:', metadata);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are a professional fashion stylist AI. Analyze the outfit metadata to generate a **friendly, stylist-like "like message"** that feels personal and encouraging.

Rules:
- Focus on patterns, standout combinations, textures, colors, or accessories the user favors.
- Avoid literal repetition of all items.
- Highlight what makes the outfit interesting or stylish.
- Keep it short, concise, under 100 characters.
- Start the message with "You seem to like..."
- Use natural, friendly language like a stylist giving a compliment.
- Examples:
  • "You seem to like playful mixes of pastel dresses and delicate jewelry"
  • "You seem to like bold jackets paired with casual sneakers"
  • "You seem to like cozy layers with standout textures"
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

    console.log('Generated stylist-like like message:', message);

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
