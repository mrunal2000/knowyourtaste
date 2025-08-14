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

    const prompt = `Based on these fashion outfit descriptions, analyze the color preferences and create a comprehensive color palette analysis. Focus on:

1. **Primary Colors**: What main colors appear most frequently
2. **Color Combinations**: How colors are paired together
3. **Color Psychology**: What these color choices say about style preferences
4. **Seasonal Color Trends**: Any seasonal color patterns
5. **Color Intensity**: Preference for bold vs. muted colors

Outfit descriptions:
${metadata.join('\n')}

Provide a detailed analysis with specific color names and insights about the user's color preferences.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a fashion color analyst expert. Provide detailed, insightful analysis of color preferences based on fashion choices. Use specific color names and explain the psychology behind color choices."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const insights = completion.choices[0].message.content;

    res.status(200).json({ insights });
  } catch (error) {
    console.error('Error generating color insights:', error);
    res.status(500).json({ error: 'Failed to generate color insights' });
  }
}
