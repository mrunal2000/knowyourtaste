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

    console.log('🎨 Removing background from image');

    // Use OpenAI's DALL-E or a background removal approach
    // For now, we'll use a simple approach with remove.bg API if available
    // Otherwise, we can use a client-side solution
    
    // Check if REMOVE_BG_API_KEY is available
    if (process.env.REMOVE_BG_API_KEY) {
      // Use remove.bg API
      const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': process.env.REMOVE_BG_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_file_b64: image,
          size: 'auto',
          format: 'png'
        }),
      });

      if (!removeBgResponse.ok) {
        throw new Error(`Remove.bg API failed: ${removeBgResponse.status}`);
      }

      const buffer = await removeBgResponse.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      res.status(200).json({
        success: true,
        image: base64,
        format: 'png'
      });
    } else {
      // Fallback: return the original image (background removal would need to be done client-side)
      // For now, we'll use a client-side solution
      res.status(200).json({
        success: true,
        image: image,
        format: 'jpeg',
        note: 'Background removal will be done client-side'
      });
    }

  } catch (error) {
    console.error('❌ Error removing background:', error);
    
    res.status(500).json({
      error: 'Failed to remove background',
      details: error.message
    });
  }
}

