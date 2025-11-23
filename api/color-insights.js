import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS
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

    if (!metadata || !Array.isArray(metadata)) {
      return res.status(400).json({ error: 'Metadata array is required' });
    }

    // 🔥 Improved prompt that avoids randomness + ensures real pattern extraction
    const prompt = `
You will receive a collection of outfit descriptions. 
Analyze **all descriptions together** and extract recurring color patterns.

Rules:
- DO NOT describe the outfits.
- DO NOT list colors from each description individually.
- Only include colors that appear repeatedly or strongly implied by multiple outfits.
- Infer a cohesive palette based on dominant tones and common accents.
- Avoid unrealistic or overly aesthetic names.
- Only output the colors in the required sections.

Your output must use EXACTLY this structure (nothing before or after):

**Primary Colors**
#HEXCODE - Color Name
#HEXCODE - Color Name
#HEXCODE - Color Name

**Accent Colors**
#HEXCODE - Color Name
#HEXCODE - Color Name

**Neutral Colors**
#HEXCODE - Color Name
#HEXCODE - Color Name
#HEXCODE - Color Name

All Outfit Descriptions:
${metadata.join('\n')}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
You are a senior fashion color analyst. 
Your job is to identify color patterns across multiple outfit descriptions 
using aggregate analysis — not listing or restating items.

CRITICAL RULES:
- Do NOT provide explanations.
- Do NOT describe the images.
- Do NOT output anything except the required palette format.
- Choose only realistic hex codes that approximate the repeated tones.
- Keep color names simple and recognizable (e.g., "Dusty Pink", "Charcoal", "Olive").
- Do not output more or fewer colors than requested.
`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.4 // lower temp = stable, non-random palette
    });

    const insights = completion.choices[0].message.content;

    res.status(200).json({ insights });

  } catch (error) {
    console.error("OpenAI API error:", error);

    if (error.code === "insufficient_quota") {
      return res.status(402).json({
        error: "OpenAI API quota exceeded. Check your billing."
      });
    }

    if (error.code === "invalid_api_key") {
      return res.status(401).json({
        error: "Invalid OpenAI API key. Check configuration."
      });
    }

    res.status(500).json({
      error: "Failed to generate color insights. Please try again.",
      details: error.message
    });
  }
}
