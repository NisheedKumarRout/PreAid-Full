# PreAid Multi-AI Setup Guide 🚀

## Overview
Your PreAid application now supports **6 different AI providers** with automatic failover. If one API fails, it automatically tries the next one. Here's how to set them up:

## 🎯 Quick Priority Setup (Recommended)

### **Tier 1: Free APIs (Set up first)**
1. **Google Gemini** ✅ (Already configured)
2. **Cohere** (5,000 free calls/month)
3. **Hugging Face** (Free with rate limits)

### **Tier 2: Freemium APIs (Great for reliability)**
4. **OpenAI GPT-4o-mini** ($5 free credits)
5. **Together AI** ($25 free credits)

### **Tier 3: Paid APIs (Optional)**
6. **Anthropic Claude** (Pay-per-use)

---

## 🔑 Step-by-Step API Key Setup

### 1. Cohere (FREE - 5,000 calls/month)
**Steps:**
1. Go to [https://cohere.ai/](https://cohere.ai/)
2. Click **"Get Started Free"**
3. Sign up with email or Google account
4. Verify your email
5. Go to [https://dashboard.cohere.ai/api-keys](https://dashboard.cohere.ai/api-keys)
6. Copy your API key
7. Add to Netlify: **Environment Variables** → `COHERE_API_KEY`

### 2. Hugging Face (FREE - Rate limited)
**Steps:**
1. Go to [https://huggingface.co/join](https://huggingface.co/join)
2. Sign up with email
3. Verify your email
4. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
5. Click **"New token"** → **"Read"** access
6. Name it "PreAid API" and create
7. Copy the token (starts with `hf_`)
8. Add to Netlify: **Environment Variables** → `HUGGINGFACE_API_KEY`

### 3. OpenAI GPT-4o-mini (FREEMIUM - $5 credits)
**Steps:**
1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Sign up with email/phone verification
3. Verify your phone number (required)
4. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
5. Click **"Create new secret key"**
6. Name it "PreAid" and create
7. Copy the key (starts with `sk-proj-`)
8. Add to Netlify: **Environment Variables** → `OPENAI_API_KEY`

### 4. Together AI (FREEMIUM - $25 credits)
**Steps:**
1. Go to [https://together.ai/](https://together.ai/)
2. Sign up for free account
3. Complete email verification
4. Go to [https://api.together.xyz/settings/api-keys](https://api.together.xyz/settings/api-keys)
5. Click **"Create API Key"**
6. Copy the API key
7. Add to Netlify: **Environment Variables** → `TOGETHER_API_KEY`

### 5. Anthropic Claude (PAID - Optional)
**Steps:**
1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up and verify email
3. Add payment method (required)
4. Go to [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
5. Create API key
6. Copy the key (starts with `sk-ant-`)
7. Add to Netlify: **Environment Variables** → `ANTHROPIC_API_KEY`

---

## 🛠️ Adding API Keys to Netlify

1. Go to your [Netlify Dashboard](https://app.netlify.com/)
2. Select your PreAid project
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"**
5. Add each API key:

```
Variable Name: COHERE_API_KEY
Value: [your-cohere-api-key]

Variable Name: HUGGINGFACE_API_KEY  
Value: [your-huggingface-token]

Variable Name: OPENAI_API_KEY
Value: [your-openai-api-key]

Variable Name: TOGETHER_API_KEY
Value: [your-together-api-key]

Variable Name: ANTHROPIC_API_KEY
Value: [your-anthropic-api-key]
```

6. **Redeploy** your site after adding keys

---

## ✅ Priority Order & Failover

The system tries APIs in this order:
1. **Gemini** (Your current primary)
2. **OpenAI GPT-4o-mini** 
3. **Cohere**
4. **Hugging Face**
5. **Together AI**
6. **Anthropic Claude**

**Automatic Failover:** If any API fails (rate limit, outage, etc.), it instantly tries the next one.

---

## 🔍 How to Verify It's Working

1. **Redeploy** your site after adding API keys
2. Open browser **Developer Tools** (F12)
3. Check the **Console** tab
4. Look for messages like:
   ```
   🚀 Using multi-AI service with 4 available providers: gemini, openai, cohere, huggingface
   ✅ Successfully got response from: openai
   ```

---

## 🚨 Troubleshooting

### "No AI providers configured"
- **Fix**: Add at least one API key to Netlify environment variables and redeploy

### "All AI providers failed"  
- **Check**: Are your API keys valid?
- **Try**: Wait 10-15 minutes (rate limit cooldown)
- **Verify**: API keys are correctly added to Netlify (no extra spaces)

### Site loads but still shows 503 errors
- **Solution**: Redeploy your site after adding API keys
- **Wait**: Allow 5-10 minutes for full deployment

---

## 💡 Cost Management Tips

### Free Tier Limits:
- **Gemini**: 15 requests/minute
- **Cohere**: 5,000 calls/month  
- **Hugging Face**: Rate limited but generous
- **OpenAI**: $5 free credits (3 months)
- **Together AI**: $25 free credits

### Recommendations:
1. **Start with 2-3 free APIs** (Gemini + Cohere + Hugging Face)
2. **Add OpenAI** for higher quality when free credits are available
3. **Monitor usage** in each provider's dashboard
4. **Set billing alerts** for paid services

---

## 🎉 Expected Results

After setup, your PreAid will:
- ✅ **Never fail** due to single API outage
- ✅ **Automatically switch** between providers
- ✅ **Handle rate limits** seamlessly  
- ✅ **Provide faster responses** with multiple options
- ✅ **Show clear logs** of which API was used

Your health assistant is now **bulletproof**! 🛡️

---

## 📞 Need Help?

If you encounter issues:
1. Check Netlify **Deploy logs** for errors
2. Verify API keys in **Site settings** → **Environment variables** 
3. Ensure **redeploy** happened after adding keys
4. Wait 10-15 minutes for changes to propagate

**Your site will be much more reliable with multiple AI providers!** 🚀
