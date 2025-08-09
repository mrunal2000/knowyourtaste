# Fashion Taster Setup Guide

## Getting OpenAI API Working on Vercel

Your app has been updated to use Vercel API routes instead of localhost calls. Here's how to get everything working:

### 1. Environment Variables Setup

You need to add your OpenAI API key to Vercel:

1. **Go to your Vercel dashboard**
2. **Select your project** (fashion-taster)
3. **Go to Settings > Environment Variables**
4. **Add a new variable:**
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your actual OpenAI API key
   - **Environment:** Production (and Preview if you want)

### 2. What Was Fixed

✅ **Frontend API calls** now use `/api/analyze` instead of `localhost:3001`
✅ **Vercel API routes** are properly configured
✅ **Image analysis** will now work through the Vercel API
✅ **Metadata generation** uses OpenAI Vision API

### 3. How It Works Now

1. **User votes on an outfit** → Image is sent to `/api/analyze`
2. **OpenAI analyzes the image** → Generates styling advice
3. **Results are displayed** → User sees outfit analysis
4. **Fashion thesis** → Generated from liked outfits
5. **Outfit recreation tips** → Available for each liked outfit

### 4. Test the App

1. **Deploy to Vercel** (or push to GitHub if auto-deploy is enabled)
2. **Vote on a few outfits** to trigger the AI analysis
3. **Check the console** for any errors
4. **Verify metadata is generated** for each outfit

### 5. Troubleshooting

If you still don't see AI analysis:

1. **Check Vercel logs** for API errors
2. **Verify environment variable** is set correctly
3. **Check OpenAI API quota** and billing
4. **Ensure the API route** is accessible

### 6. Next Steps

Once this is working, you can:
- Add more sophisticated thesis generation
- Implement outfit recreation tips
- Add style recommendations
- Enhance the AI prompts

The app should now generate metadata and fashion insights using your OpenAI API key!
