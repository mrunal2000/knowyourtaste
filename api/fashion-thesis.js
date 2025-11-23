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

    // Generate style thesis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are a personal fashion stylist creating actionable style advice for a user.

Rules:
- Analyze the user’s liked outfit images and find patterns.
- Use second person (“You like…”, “You prefer…”).
- Include repeated patterns in silhouettes, fits, colors, fabrics, or textures.
- Suggest concrete clothing items, combinations, or ways to recreate looks.
- Include one practical tip for building or expanding a wardrobe.
- Keep sentences simple and clear. Do not use filler or flowery language.
- Make it directly useful for someone who wants to shop or recreate these outfits.
- Output exactly 3 sentences: patterns, items, and tip.
          `
        },
        {
          role: "user",
          content: `
The user has liked these outfit images: "${combinedContext}".

Write a 3-sentence style summary:

1. “You like…” → repeated patterns in silhouettes, colors, fits, or fabrics.
2. “You prefer…” → specific items or combinations visible in the images.
3. One short, actionable tip to recreate looks or build a wardrobe.

Keep all sentences simple, clear, and practical.
          `
        }
      ],
      max_tokens: 150
    });

    const thesis = response.choices[0].message.content.trim();

    res.status(200).json({ thesis });

  } catch (error) {
    console.error('OpenAI API error:', error);

    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ error: 'OpenAI API quota exceeded.' });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    res.status(500).json({
      error: 'Failed to generate fashion thesis.',
      details: error.message
    });
  }
}
