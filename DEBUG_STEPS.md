# Debugging Steps for OpenAI API

## 🚨 **Current Issue:**
GPT is not working, not generating metadata, and not showing "how to recreate the outfit"

## 🔍 **Step 1: Test API Endpoint**
Visit this URL in your browser:
```
https://your-app-name.vercel.app/api/test
```

**Expected Result:** You should see a JSON response showing:
- `"status": "API is working"`
- `"openaiKeyConfigured": true`
- `"openaiKeyLength": [some number]`
- `"openaiKeyPrefix": "sk-..."`

**If this fails:** Your API routes aren't working

## 🔍 **Step 2: Check Environment Variables**
In your Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Verify `OPENAI_API_KEY` exists (not `openai_api_key`)
3. Check that the value starts with `sk-`
4. Ensure it's set for Production environment

## 🔍 **Step 3: Test with Browser Console**
1. Open your app in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Vote on an outfit
5. Look for these logs:
   - "Starting metadata generation for image: /screenshot.png"
   - "Image blob size: X bytes"
   - "Base64 conversion complete, length: X"
   - "Calling /api/analyze endpoint..."
   - "API response status: X"

## 🔍 **Step 4: Check Vercel Function Logs**
1. Go to Vercel dashboard
2. Select your project
3. Go to Functions tab
4. Click on `api/analyze.js`
5. Check the logs for errors

## 🚨 **Common Issues & Solutions:**

### Issue 1: "API is working" but `openaiKeyConfigured: false`
**Solution:** Your environment variable isn't set correctly in Vercel

### Issue 2: "API is working" but `openaiKeyConfigured: true` and still not working
**Solution:** Check OpenAI account for quota/billing issues

### Issue 3: No console logs appear
**Solution:** The frontend isn't calling the API - check if the code is deployed

### Issue 4: Console shows errors
**Solution:** Check the specific error message and let me know

## 📋 **What to Report Back:**
1. What does `/api/test` return?
2. What console logs do you see when voting?
3. Any error messages in console?
4. What do the Vercel function logs show?

## 🆘 **If Still Not Working:**
Share the results from each step above and I'll help you fix it!
