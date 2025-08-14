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

    const prompt = `Analyze ALL of these fashion outfit descriptions TOGETHER to identify the specific clothing pieces and accessories the user consistently likes. Look for patterns in their actual clothing choices.

Provide ONLY key style insights in this exact format:

• **Tops** - [specific types like: loose tops, fitted tops, crop tops, oversized sweaters, etc.]
• **Bottoms** - [specific types like: tailored trousers, high-waisted jeans, midi skirts, etc.]
• **Outerwear** - [specific types like: blazers, leather jackets, oversized coats, etc.]
• **Accessories** - [specific types like: bold jewelry, gold accessories, statement bags, etc.]
• **Shoes** - [specific types like: ankle boots, sneakers, heels, etc.]

Focus on identifying the actual clothing pieces they choose, not abstract style concepts. Keep each bullet point specific and brief.

ALL Outfit Descriptions (analyze together):
${metadata.join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a fashion stylist expert. Analyze ALL outfit descriptions TOGETHER to identify the specific clothing pieces and accessories the user consistently chooses. Focus on actual clothing items, not abstract style concepts. Provide ONLY brief, specific insights in the exact bullet-point format requested."
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
