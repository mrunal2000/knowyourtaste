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
You are a personal fashion stylist giving practical style advice and brand suggestions.

- Analyze the user’s liked outfit images to find clear, repeated patterns: silhouettes, fits, colors, fabrics.
- Use second person (“You like…”, “You prefer…”).
- Suggest concrete clothing items or combinations the user favors.
- Recommend 2–4 brands that match their style, based on what you observe.
- Give one actionable tip for building or expanding a wardrobe.
- Keep your language simple, clear, and direct; no filler or flowery writing.
- Output exactly 4 sentences: patterns, items, brands, and the tip.
          `
        },
        {
          role: "user",
          content: `
The user has liked these outfit images: "${combinedContext}".

Write a 4-sentence style summary:
1. “You like…” → the repeated patterns in silhouettes, colors, fits, or fabrics.
2. “You prefer…” → specific items or outfit combinations.
3. “Brands you might like:” → suggest 2–4 brands aligned with the user’s style.
4. One short, practical tip to recreate looks or build a wardrobe.

Use only simple, clear words. Make it directly helpful.
          `
        }
      ],
      max_tokens: 200
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
