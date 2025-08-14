import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { metadata } = req.body;

    if (!metadata || !Array.isArray(metadata)) {
      return res.status(400).json({ error: 'Metadata array is required' });
    }

    const prompt = `Analyze ALL of these fashion outfit descriptions TOGETHER to create ONE comprehensive style blueprint. Look for patterns and common themes across all outfits to identify the user's overall style preferences.

Provide ONLY key style insights in this exact format:

• **Silhouette** - [2-3 words max - overall preference across all outfits]
• **Fabrics** - [2-3 words max - common materials they choose]
• **Key Pieces** - [2-3 words max - signature items they gravitate toward]
• **Fit Style** - [2-3 words max - how they prefer clothes to fit]
• **Layering** - [2-3 words max - their layering approach]

Keep each bullet point extremely brief and focused. No explanations, just key terms.

ALL Outfit Descriptions (analyze together):
${metadata.join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a fashion stylist expert. Analyze ALL outfit descriptions TOGETHER to find common patterns and create ONE comprehensive style blueprint. Provide ONLY brief, key insights in the exact bullet-point format requested. Keep responses extremely concise - no explanations, just key terms."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    const preferences = completion.choices[0].message.content;

    res.status(200).json({ preferences });
  } catch (error) {
    console.error('Error generating clothing preferences:', error);
    res.status(500).json({ error: 'Failed to generate clothing preferences' });
  }
}
