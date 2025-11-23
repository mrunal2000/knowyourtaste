import OpenAI from 'openai';

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

    if (!metadata) {
      return res.status(400).json({ error: 'No metadata provided' });
    }

    console.log('Generating outfit recreation tips for metadata:', metadata);

    // 🔥 MUCH BETTER PROMPT: Stylist tone, concise, no repetition
    const prompt = `
You are a senior fashion stylist. 
You will receive an outfit insight or outfit analysis. 
Your job is to give clear, stylist-level guidance on how someone can recreate the look.

Rules:
- DO NOT repeat or describe the original metadata.
- DO NOT restate items from the text.
- Focus on what someone should *do* to recreate the vibe.
- Keep the tone: confident, precise, stylist-approved.
- Output ONLY 3–4 numbered tips.
- Every tip must be practical and specific:
  • what clothing pieces to look for  
  • styling techniques  
  • proportions/silhouettes to match  
  • accessories to elevate  
  • how to achieve the overall vibe  

Respond ONLY in a numbered list.

Outfit insight:
"${metadata}"
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `
You are a luxury fashion stylist known for giving concise, actionable, 
expert-level outfit recreation guidance. You never repeat the user's text — 
you only deliver elevated, specific styling instructions.
`},
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.55, // balanced: stylish, not chaotic
    });

    const tips = response.choices[0].message.content;
    console.log("Generated outfit tips:", tips);

    res.status(200).json({ tips });

  } catch (error) {
    console.error("OpenAI API error:", error);

    if (error.code === "insufficient_quota") {
      return res.status(402).json({
        error: "OpenAI API quota exceeded. Please check your OpenAI account billing."
      });
    }

    if (error.code === "invalid_api_key") {
      return res.status(401).json({
        error: "Invalid OpenAI API key. Please check your configuration."
      });
    }

    res.status(500).json({
      error: "Failed to generate outfit tips. Please try again.",
      details: error.message
    });
  }
}
