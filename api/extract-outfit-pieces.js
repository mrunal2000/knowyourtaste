import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

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
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    console.log('🔍 Extracting outfit pieces from image');

    // Use GPT Vision with structured output to extract outfit pieces
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a fashion expert who analyzes outfit images and extracts individual clothing pieces with their approximate locations. 
          
Analyze the image and identify each distinct clothing item, accessory, or outfit piece. For each piece, provide:
- type: The category (e.g., "top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory", "jewelry")
- name: Specific name/description (e.g., "white t-shirt", "blue jeans", "black leather jacket")
- color: Primary color(s)
- style: Style description (e.g., "casual", "formal", "vintage", "modern")
- details: Additional details like fit, material, patterns, etc.
- location: Approximate location as percentages of image dimensions: {x: 0-100, y: 0-100, width: 0-100, height: 0-100} where x,y is top-left corner

The location should describe where the piece appears in the image as percentages. For example, a top might be at {x: 20, y: 10, width: 60, height: 40} meaning it's centered horizontally (20% from left, 60% wide) and in the upper portion (10% from top, 40% tall).

Ignore the background completely - focus only on the clothing and accessories visible in the image.

Return a JSON object with this structure:
{
  "outfitPieces": [
    {
      "type": "string",
      "name": "string",
      "color": "string",
      "style": "string",
      "details": "string",
      "location": {"x": number, "y": number, "width": number, "height": number}
    }
  ]
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all outfit pieces from this image. Ignore the background - focus only on clothing items, shoes, bags, and accessories. Return a JSON object with an array of outfit pieces, each containing type, name, color, style, and details.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const responseContent = visionResponse.choices[0].message.content;
    let outfitPieces;
    
    try {
      const parsed = JSON.parse(responseContent);
      outfitPieces = parsed.outfitPieces || [];
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback: try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        outfitPieces = JSON.parse(jsonMatch[0]).outfitPieces || [];
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    console.log(`✅ Extracted ${outfitPieces.length} outfit pieces`);

    res.status(200).json({
      success: true,
      outfitPieces: outfitPieces,
      count: outfitPieces.length
    });

  } catch (error) {
    console.error('❌ Error extracting outfit pieces:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API quota exceeded. Please check your OpenAI account billing.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your configuration.' 
      });
    }

    res.status(500).json({
      error: 'Failed to extract outfit pieces',
      details: error.message
    });
  }
}

