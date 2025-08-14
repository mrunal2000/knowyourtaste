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

    const prompt = `Based on these fashion outfit descriptions, analyze the clothing preferences and style pieces the user gravitates towards. Focus on:

1. **Silhouette Preferences**: What shapes and cuts they prefer (fitted, loose, structured, flowy)
2. **Fabric Choices**: Types of materials and textures they're drawn to
3. **Style Categories**: Specific clothing items they consistently choose
4. **Fit Preferences**: How they prefer clothes to fit their body
5. **Layering Style**: How they combine different pieces
6. **Accessory Preferences**: What types of accessories complement their style

Outfit descriptions:
${metadata.join('\n')}

Provide a detailed analysis with specific clothing items and insights about the user's style preferences.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a fashion stylist and clothing analyst expert. Provide detailed, insightful analysis of clothing preferences and style choices based on fashion selections. Focus on specific pieces, silhouettes, and style elements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const preferences = completion.choices[0].message.content;

    res.status(200).json({ preferences });
  } catch (error) {
    console.error('Error generating clothing preferences:', error);
    res.status(500).json({ error: 'Failed to generate clothing preferences' });
  }
}
