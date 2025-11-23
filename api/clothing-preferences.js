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

    // 🔥 Improved prompt that forces TRUE insights (not item listings)
    const prompt = `
You will receive a collection of fashion outfit descriptions. 
Analyze them **as a whole dataset** and infer statistically strong patterns 
in what the user consistently chooses.

Rules:
- DO NOT repeat or list items from the descriptions.
- DO NOT summarize or describe each outfit.
- DO NOT mention the images or metadata.
- Focus ONLY on aggregate patterns and recurring preferences.
- Identify silhouettes, fits, materials, colors, and styling tendencies.
- Include a category even if patterns are subtle — infer carefully.
- If something isn't recurring, do NOT include it.

Your answer MUST be formatted exactly like this (no extra text):

• **Tops** – [patterns in silhouettes, fits, and lengths the user frequently chooses]
• **Bottoms** – [patterns in cuts, fits, rises, fabrics]
• **Outerwear** – [patterns in structure, length, material]
• **Accessories** – [patterns in jewelry, bags, styling habits]
• **Shoes** – [patterns in style, shape, height]

All Outfit Descriptions:
${metadata.join('\n')}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
You are a senior fashion stylist and pattern-recognition expert.
You analyze multiple outfit descriptions as a dataset to find 
**recurring patterns** in what the user genuinely prefers.

CRITICAL RULES:
- Do NOT list or restate items from the descriptions.
- Do NOT describe images.
- Only output *clustered insights* (aka patterns).
- Be selective — include only consistent or repeated preferences.
- Keep insights brief, sharp, and practical.
- Never reveal reasoning; only the final insights.

Respond exactly in the 5-bullet format the user provides.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 250,
      temperature: 0.5, // more stable pattern extraction
    });

    const preferences = completion.choices[0].message.content;
    
    console.log('Generated clothing preferences:', preferences);

    res.status(200).json({ preferences });

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
      error: "Failed to generate clothing preferences. Please try again.",
      details: error.message
    });
  }
}
