# 🧪 Local OpenAI API Testing Guide

## 🚀 **Step 1: Set Up Environment Variables**

1. **Create a `.env` file** in your project root:
   ```bash
   cp env.local.template .env
   ```

2. **Edit `.env` file** and add your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your_actual_api_key_here
   ```

## 🖥️ **Step 2: Start Local Test Server**

1. **Install dependencies** (if not already installed):
   ```bash
   npm install express cors dotenv
   ```

2. **Start the local server**:
   ```bash
   node local-test.js
   ```

3. **You should see**:
   ```
   🚀 Local test server running on http://localhost:3001
   📝 Test endpoint: http://localhost:3001/api/test
   🔍 OpenAI API key configured: Yes
   🔑 API key prefix: sk-...
   ```

## 🧪 **Step 3: Test the API Endpoints**

1. **Test the test endpoint**:
   ```bash
   curl http://localhost:3001/api/test
   ```
   Or visit: http://localhost:3001/api/test

2. **Expected response**:
   ```json
   {
     "status": "Local API is working",
     "environment": {
       "openaiKeyConfigured": true,
       "openaiKeyLength": 51,
       "openaiKeyPrefix": "sk-..."
     }
   }
   ```

## 🎯 **Step 4: Test with Frontend**

1. **Start your React app** (in a new terminal):
   ```bash
   npm run dev
   ```

2. **Open browser** to your local React app (usually http://localhost:5173)

3. **Open Developer Tools** (F12) → Console tab

4. **Vote on an outfit** and watch the console logs

5. **You should see**:
   - "Starting metadata generation for image: /screenshot.png"
   - "Image blob size: X bytes"
   - "Using API URL: http://localhost:3001/api/analyze"
   - "API response status: 200"
   - "Analysis content: [OpenAI generated text]"

## 🚨 **Troubleshooting**

### If you see "OpenAI API key configured: No":
- Check your `.env` file exists
- Verify the variable name is exactly `OPENAI_API_KEY`
- Restart the local server after changing `.env`

### If you get API errors:
- Check the server console for detailed error logs
- Verify your OpenAI API key is valid
- Check your OpenAI account for quota/billing issues

### If the frontend can't connect:
- Ensure the local server is running on port 3001
- Check that CORS is working (no CORS errors in console)

## ✅ **Success Indicators**

- ✅ Local server starts without errors
- ✅ `/api/test` returns `openaiKeyConfigured: true`
- ✅ Frontend can call the local API
- ✅ OpenAI generates fashion analysis text
- ✅ Console shows successful API calls

## 🔄 **Next Steps**

Once local testing works:
1. Fix any issues found
2. Push changes to GitHub
3. Deploy to Vercel
4. Set environment variables in Vercel dashboard
5. Test production deployment
