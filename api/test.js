export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const openaiKeyConfigured = !!process.env.OPENAI_API_KEY;
    const openaiKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    const openaiKeyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'none';

    res.status(200).json({ 
      status: 'API is working',
      timestamp: new Date().toISOString(),
      environment: {
        openaiKeyConfigured,
        openaiKeyLength,
        openaiKeyPrefix: openaiKeyPrefix === 'none' ? 'none' : `${openaiKeyPrefix}...`,
        nodeEnv: process.env.NODE_ENV || 'not set'
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Test endpoint failed',
      details: error.message 
    });
  }
}
