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

    const combinedContext = metadata.join('. ');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are a personal fashion stylist focused on brand recommendations.

- Analyze the user's liked outfit images to determine style patterns: fits, colors, fabrics, and repeated items.
- Suggest 3–5 brands that best match the user's style.
- Keep brand suggestions practical and aligned with the outfits.
- Use simple, clear language. No filler.
- Output only a short list of brands.
          `
        },
        {
          role: "user",
          content: `
The user has liked these outfit images: "${combinedContext}".

Suggest 3–5 brands the user might like based on these outfits.
Output as a short, comma-separated list.
          `
        }
      ],
      max_tokens: 80
    });

    const brands = response.choices[0].message.content.trim();

    res.status(200).json({ brands });

  } catch (error) {
    console.error('OpenAI API error:', error);

    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ error: 'OpenAI API quota exceeded.' });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    res.status(500).json({
      error: 'Failed to generate brand suggestions.',
      details: error.message
    });
  }
}
