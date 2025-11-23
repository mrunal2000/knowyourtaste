import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Test endpoint
app.get('/api/test', (req, res) => {
  const openaiKeyConfigured = !!process.env.OPENAI_API_KEY;
  const openaiKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
  const openaiKeyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'none';

  res.json({ 
    status: 'Local API is working',
    timestamp: new Date().toISOString(),
    environment: {
      openaiKeyConfigured,
      openaiKeyLength,
      openaiKeyPrefix: openaiKeyPrefix === 'none' ? 'none' : `${openaiKeyPrefix}...`,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// OpenAI analyze endpoint (same as Vercel)
app.post('/api/analyze', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log('Received image request, image length:', image ? image.length : 0);
    console.log('OpenAI API key configured:', !!process.env.OPENAI_API_KEY);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Convert base64 to data URL format that OpenAI expects
    const imageUrl = `data:image/jpeg;base64,${image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this fashion outfit in 2-3 short sentences. Focus on: 1) Key clothing items to recreate the look, 2) One specific styling tip. Keep it concise and actionable."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 150
    });

    const analysis = response.choices[0].message.content;
    console.log('OpenAI analysis generated successfully, length:', analysis.length);

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
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
      error: 'Failed to analyze image. Please try again.',
      details: error.message
    });
  }
});

// OpenAI like-message endpoint (same as Vercel)
app.post('/api/like-message', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: 'No metadata provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log('Generating like message for metadata:', metadata);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Based on this outfit analysis: "${metadata}", generate a personalized message that starts with "You seem to like..." and describes what the user likes about this outfit's style. Focus ONLY on the style elements, colors, aesthetic, and overall vibe - NOT on how to recreate it. Keep it friendly, encouraging, and under 100 characters. Examples: "You seem to like bold color combinations and statement pieces" or "You seem to like elegant, minimalist styles with clean lines".`
        }
      ],
      max_tokens: 100
    });

    const message = response.choices[0].message.content;
    console.log('Generated like message:', message);

    res.status(200).json({ message });
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
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
      error: 'Failed to generate like message. Please try again.',
      details: error.message
    });
  }
});

// OpenAI outfit-tips endpoint (same as Vercel)
app.post('/api/outfit-tips', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({ error: 'No metadata provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log('Generating outfit recreation tips for metadata:', metadata);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `Based on this outfit analysis: "${metadata}", provide 3-4 specific, actionable tips on how to recreate this outfit. Focus on: 1) Key clothing items to find, 2) Specific styling techniques, 3) Accessories and details, 4) How to achieve the overall look. Keep each tip concise and practical. Format as a numbered list.`
        }
      ],
      max_tokens: 200
    });

    const tips = response.choices[0].message.content;
    console.log('Generated outfit tips:', tips);

    res.status(200).json({ tips });
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
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
      error: 'Failed to generate outfit tips. Please try again.',
      details: error.message
    });
  }
});

// OpenAI fashion-thesis endpoint (same as Vercel)
app.post('/api/fashion-thesis', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return res.status(400).json({ error: 'No metadata array provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log('Generating fashion thesis with metadata count:', metadata.length);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Combine all metadata into a single context
    const combinedContext = metadata.join('. ');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `You are a professional fashion stylist and trend analyst. I will give you a list of outfit metadata that I personally like. These represent outfits, colors, silhouettes, textures, and accessories that resonate with me. Study the common patterns across all these metadata — considering style elements, color palette, fit, proportions, vibe, and subtle recurring details. Then, write a single, natural-sounding paragraph that captures my fashion thesis — a vivid, human description of my style that feels personal and insightful, avoiding vague terms like 'nice' or 'good'. It should help me easily explain my style to someone else and guide my future outfit choices. End with 3–5 concise, actionable style guidelines I can follow when putting together outfits.

Here are the outfit metadata to analyze: "${combinedContext}"`
        }
      ],
      max_tokens: 120
    });

    const thesis = response.choices[0].message.content;
    console.log('Generated fashion thesis:', thesis);

    res.status(200).json({ thesis });
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      type: error.type
    });
    
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
      error: 'Failed to generate fashion thesis. Please try again.',
      details: error.message
    });
  }
});

// OpenAI color-insights endpoint
app.post('/api/color-insights', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return res.status(400).json({ error: 'No metadata array provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log('Generating color insights with metadata count:', metadata.length);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Combine all metadata into a single context
    const combinedContext = metadata.join('. ');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `You are a professional color analyst and fashion expert. I will give you a list of outfit metadata that I personally like. From these, analyze my color preferences and create a personalized color palette.

First, provide a brief analysis of my color style (2-3 sentences about what colors I'm drawn to and how I use them).

Then, output 6-8 hex color codes that represent my signature color palette. These should be colors that work well together and reflect my style. You MUST output at least 6 colors in this exact format:

• #HEXCODE1 - Color name
• #HEXCODE2 - Color name  
• #HEXCODE3 - Color name
• #HEXCODE4 - Color name
• #HEXCODE5 - Color name
• #HEXCODE6 - Color name
• #HEXCODE7 - Color name (optional)
• #HEXCODE8 - Color name (optional)

IMPORTANT: Always provide at least 6 colors. Do not cut off or leave incomplete. Each color must have a complete hex code and descriptive name.

Here are the outfit metadata to analyze: "${combinedContext}"`
        }
      ],
      max_tokens: 120
    });

    const insights = response.choices[0].message.content;
    console.log('Generated color insights:', insights);

    res.status(200).json({ insights });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate color insights. Please try again.',
      details: error.message
    });
  }
});

// OpenAI analyze-image endpoint (GPT Vision)
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { image, filename, imageIndex, category, categoryPrompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log(`🔍 Analyzing ${category} image ${imageIndex + 1}: ${filename}`);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Use category-specific system prompt
    let systemPrompt = '';
    if (category === 'shoes') {
      systemPrompt = `You are a fashion expert who analyzes SHOE images and provides detailed, accurate descriptions. Focus ONLY on:

1. **Shoe Type**: Be specific about the type of shoe (sneakers, sandals, boots, heels, flats, etc.)
2. **Style & Design**: Describe the overall style (casual, formal, trendy, classic, edgy, etc.)
3. **Heel Height**: If applicable, specify heel height (flat, low, mid, high, platform)
4. **Materials**: Note the materials used (leather, suede, canvas, mesh, etc.)
5. **Colors**: Identify the main colors - be specific about color names and combinations
6. **Details**: Describe straps, buckles, laces, embellishments, patterns, textures
7. **Fit & Comfort**: Note any comfort features or fit characteristics

CRITICAL: Focus ONLY on the shoes. Ignore any background elements, clothing, accessories, or other items in the image. Only analyze what you see in the shoes themselves.`;
    } else if (category === 'bag') {
      systemPrompt = `You are a fashion expert who analyzes BAG/ACCESSORY images and provides detailed, accurate descriptions. Focus on:

1. **Bag Type**: Be specific about the type of bag (crossbody, tote, clutch, backpack, etc.)
2. **Style & Design**: Describe the overall style (casual, formal, trendy, classic, etc.)
3. **Size & Shape**: Note the size (small, medium, large) and shape characteristics
4. **Materials**: Identify the materials used (leather, canvas, nylon, etc.)
5. **Colors**: Be specific about color names and combinations
6. **Details**: Describe straps, hardware, pockets, closures, embellishments
7. **Functionality**: Note any practical features or design elements

If no bag is visible, focus on the overall outfit style and any visible accessories.`;
    } else {
      systemPrompt = `You are a fashion expert who analyzes outfit images and provides detailed, accurate descriptions. Focus on:

1. **Clothing Items**: Be specific about tops, bottoms (pants/skirts), outerwear, dresses
2. **Fit & Silhouette**: Describe the fit (fitted, loose, oversized) and silhouette
3. **Colors**: Identify the main colors and color scheme - be specific about color names and combinations
4. **Accessories**: Note jewelry, bags, shoes, belts, etc.
5. **Style**: Describe the overall aesthetic (casual, formal, trendy, classic, etc.)
6. **Details**: Fabric textures, patterns, layering, proportions

IMPORTANT COLOR ANALYSIS RULES:
- ONLY analyze colors from CLOTHING and ACCESSORIES (tops, bottoms, outerwear, shoes, bags, jewelry)
- IGNORE background colors, wall colors, floor colors, or any environmental elements
- Focus on the actual outfit colors: fabric colors, accessory colors, shoe colors
- Be specific about color names (e.g., "navy blue", "cream", "gold", "black", "white", "denim blue")
- If you see a white shirt, blue jeans, and gold belt - only mention white, blue, and gold

Be precise and avoid generic descriptions. If you see pants, say pants. If you see a skirt, say skirt.`;
    }

    // Use GPT Vision to analyze the fashion image
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: categoryPrompt || `Analyze this ${category} image and provide a detailed description. Focus on what you actually see in the image. Be specific about the key elements and style characteristics.`
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
    
    // Format the metadata with the category and outfit number
    const metadata = `${category.charAt(0).toUpperCase() + category.slice(1)} ${imageIndex + 1}: ${analysis}`;

    console.log(`✅ Generated ${category} metadata for ${filename}:`, metadata.substring(0, 100) + '...');

    res.status(200).json({
      metadata: metadata,
      analysis: analysis,
      filename: filename,
      imageIndex: imageIndex,
      category: category
    });

  } catch (error) {
    console.error('❌ Error analyzing image with GPT Vision:', error);
    
    res.status(500).json({
      error: 'Failed to analyze image',
      details: error.message
    });
  }
});

// OpenAI clothing-preferences endpoint
app.post('/api/clothing-preferences', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata || !Array.isArray(metadata) || metadata.length === 0) {
      return res.status(400).json({ error: 'No metadata array provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY environment variable'
      });
    }

    console.log('Generating clothing preferences with metadata count:', metadata.length);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Combine all metadata into a single context
    const combinedContext = metadata.join('. ');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `You are a professional fashion stylist. I will give you a list of outfit metadata that I personally like. Based on these, identify the key clothing pieces I prefer.

Output format - use EXACTLY this format with **bold** markdown:
• **Outerwear** - Structured blazers
• **Tops** - Fitted button-downs
• **Bottoms** - High-waisted pants
• **Accessories** - Statement jewelry
• **Footwear** - Classic pumps

IMPORTANT: 
- Use **bold** markdown formatting for ALL category names
- Keep each line to 3-5 words maximum
- Focus on the main categories and pieces, not detailed descriptions
- Maximum 6-8 bullet points total
- Output the text exactly as shown above with ** ** around category names
- NO long descriptions, just category - brief item type

Here are the outfit metadata to analyze: "${combinedContext}"`
        }
      ],
      max_tokens: 120
    });

    const preferences = response.choices[0].message.content;
    console.log('Generated clothing preferences:', preferences);

    res.status(200).json({ preferences });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate clothing preferences. Please try again.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local test server running on http://localhost:${PORT}`);
  console.log(`📝 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔍 OpenAI API key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  if (process.env.OPENAI_API_KEY) {
    console.log(`🔑 API key prefix: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
  }
});
