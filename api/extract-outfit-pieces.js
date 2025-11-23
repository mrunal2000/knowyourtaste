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
          content: `You are a fashion expert analyzing an outfit image. Your task is to identify each distinct clothing piece and provide its approximate location in the image.

For EACH visible clothing item, accessory, or piece, provide:
- type: Category ("top", "bottom", "dress", "outerwear", "shoes", "bag", "accessory", "jewelry")
- name: Specific description (e.g., "white t-shirt", "blue jeans", "black leather jacket")
- color: Primary color(s)
- style: Style description ("casual", "formal", "vintage", "modern", etc.)
- details: Additional details (fit, material, patterns, etc.)
- location: Approximate bounding box as percentages of image dimensions
  - x: horizontal position where the piece starts (0-100, percentage from left edge)
  - y: vertical position where the piece starts (0-100, percentage from top edge)  
  - width: how wide the piece is (0-100, percentage of total image width)
  - height: how tall the piece is (0-100, percentage of total image height)

IMPORTANT for location accuracy:
- Look at the image carefully and estimate where each piece is located
- For a top/shirt: usually in upper-middle area (y: 20-40%, height: 30-50%)
- For pants/bottoms: usually in lower-middle area (y: 50-80%, height: 30-40%)
- For a dress: spans upper to lower area (y: 20-30%, height: 50-70%)
- For shoes: at the bottom (y: 80-95%, height: 10-15%)
- For bags: can be anywhere, estimate based on visible position
- Center items horizontally: x around 30-40%, width around 30-50%
- Include some padding in your estimates to ensure the full piece is captured

Think step by step: First identify what pieces are visible, then estimate where each one is positioned in the image frame.

Return JSON with this exact structure:
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
      max_tokens: 2000,
      temperature: 0.1
    });

    const responseContent = visionResponse.choices[0].message.content;
    let outfitPieces;
    
    try {
      const parsed = JSON.parse(responseContent);
      outfitPieces = parsed.outfitPieces || [];
      
      // Validate and fix location coordinates
      outfitPieces = outfitPieces.map(piece => {
        if (piece.location) {
          // Ensure coordinates are within valid range
          piece.location.x = Math.max(0, Math.min(100, piece.location.x || 0));
          piece.location.y = Math.max(0, Math.min(100, piece.location.y || 0));
          piece.location.width = Math.max(5, Math.min(100, piece.location.width || 20));
          piece.location.height = Math.max(5, Math.min(100, piece.location.height || 20));
          
          // Ensure x + width doesn't exceed 100
          if (piece.location.x + piece.location.width > 100) {
            piece.location.width = 100 - piece.location.x;
          }
          // Ensure y + height doesn't exceed 100
          if (piece.location.y + piece.location.height > 100) {
            piece.location.height = 100 - piece.location.y;
          }
        }
        return piece;
      });
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response content:', responseContent);
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

