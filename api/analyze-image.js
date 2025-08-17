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
    const { image, filename, imageIndex } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    console.log(`🔍 Analyzing image ${imageIndex + 1}: ${filename}`);

    // Use GPT Vision to analyze the fashion image
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a fashion expert who analyzes outfit images and provides detailed, accurate descriptions. Focus on:

1. **Clothing Items**: Be specific about tops, bottoms (pants/skirts), outerwear, dresses
2. **Fit & Silhouette**: Describe the fit (fitted, loose, oversized) and silhouette
3. **Colors**: Identify the main colors and color scheme
4. **Accessories**: Note jewelry, bags, shoes, belts, etc.
5. **Style**: Describe the overall aesthetic (casual, formal, trendy, classic, etc.)
6. **Details**: Fabric textures, patterns, layering, proportions

Be precise and avoid generic descriptions. If you see pants, say pants. If you see a skirt, say skirt.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this fashion outfit image and provide a detailed description. Focus on what you actually see in the image. Be specific about clothing items, colors, accessories, and style.`
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
      max_tokens: 300,
      temperature: 0.3
    });

    const analysis = visionResponse.choices[0].message.content;
    
    // Format the metadata with the outfit number
    const metadata = `Outfit ${imageIndex + 1}: ${analysis}`;

    console.log(`✅ Generated metadata for ${filename}:`, metadata.substring(0, 100) + '...');

    res.status(200).json({
      metadata: metadata,
      analysis: analysis,
      filename: filename,
      imageIndex: imageIndex
    });

  } catch (error) {
    console.error('❌ Error analyzing image with GPT Vision:', error);
    
    res.status(500).json({
      error: 'Failed to analyze image',
      details: error.message
    });
  }
}
