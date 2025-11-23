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

    console.log('Generating brand suggestions with metadata count:', metadata.length);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a personal fashion stylist and brand recommendation expert. Analyze outfit descriptions to suggest brands that match the user's style.`
        },
        {
          role: "user",
          content: `You are analyzing outfit descriptions that a user has liked: "${combinedContext}".

Based on the style patterns, fits, colors, fabrics, and overall aesthetic visible in these outfits, suggest 3-5 specific fashion brands that would match this user's style.

IMPORTANT: 
- Output ONLY brand names separated by commas
- Do NOT include any explanations, descriptions, or extra text
- Do NOT use bullet points or formatting
- Just list the brand names like: Zara, COS, Everlane, Aritzia, Reformation
- If you cannot determine brands, suggest general brands like: Zara, H&M, Uniqlo, Mango, ASOS

Output format (example): Zara, COS, Everlane, Aritzia, Reformation`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('Invalid OpenAI response structure:', JSON.stringify(response, null, 2));
      return res.status(500).json({ 
        error: 'Invalid response from OpenAI',
        details: 'Response structure is invalid'
      });
    }

    let brands = response.choices[0].message.content;
    console.log('Raw OpenAI response content:', brands);
    console.log('Raw content type:', typeof brands);
    
    if (!brands) {
      console.error('OpenAI returned null/undefined content');
      return res.status(500).json({ 
        error: 'OpenAI returned empty content',
        details: 'No content in response'
      });
    }

    brands = brands.trim();
    console.log('Trimmed brands:', brands);
    console.log('Brands length:', brands.length);

    // Remove any markdown formatting, bullet points, or extra text
    brands = brands
      .replace(/^[-•*]\s*/gm, '') // Remove bullet points
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '') // Remove italic markdown
      .replace(/^Brands?:\s*/i, '') // Remove "Brands:" prefix
      .replace(/^Suggested brands?:\s*/i, '') // Remove "Suggested brands:" prefix
      .trim();

    console.log('Cleaned brands:', brands);

    if (!brands || brands.length === 0) {
      console.warn('OpenAI returned empty brands after cleaning');
      // Return a default set of brands instead of the fallback message
      brands = 'Zara, H&M, Uniqlo, Mango, ASOS';
      console.log('Using default brands:', brands);
    }

    console.log('Final brands being sent:', brands);
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
