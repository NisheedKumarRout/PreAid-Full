# Deployment & Security Guide

## 🔐 Security Features

This project has been secured to prevent exposure of API keys in production:

### ✅ Fixed Security Issues
- ❌ **Removed hardcoded OpenAI API key** from `test-api.html`
- ❌ **Removed hardcoded Supabase keys** from `script.js`
- ✅ **Environment variables** are now used for all sensitive keys
- ✅ **Generated config** approach for safe deployment

## 🚀 Netlify Deployment Setup

### 1. Environment Variables Required

In your Netlify dashboard, add these environment variables:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Build Process

The project uses an automated build process that:
1. Runs `node build-config.js` during deployment
2. Generates `env-config.js` with your environment variables
3. This file is loaded before your main application scripts

### 3. Files Structure

```
├── build-config.js          # Build script (generates env config)
├── env-config.js           # Generated config file (excluded from git)
├── script.js               # Main app (now uses window.ENV)
├── netlify.toml            # Netlify configuration
├── package.json            # Build scripts configuration
└── .gitignore              # Excludes sensitive files
```

## 🛡️ Security Best Practices Applied

### Environment Variables
- All API keys moved to environment variables
- No hardcoded keys in any committed files
- Build-time generation of configuration

### Git Security
- `.env` files excluded from version control
- Generated `env-config.js` excluded from git
- Only template files committed

### Runtime Security
- Environment variables loaded at build time
- No client-side exposure of raw environment variables
- Safe fallbacks for missing configurations

## 📝 Local Development

### 1. Create your `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Generate config for local testing:
```bash
npm run build
```

### 3. Start development server:
```bash
npm run dev
```

## 🔍 How It Works

1. **Development**: Uses `.env` file (not committed to git)
2. **Build Process**: `build-config.js` reads environment variables and generates `env-config.js`
3. **Runtime**: `script.js` reads from `window.ENV` object
4. **Security**: No hardcoded keys, all values from environment

## ✅ Verification Steps

After deployment, verify:

1. **Check environment variables are loaded**:
   - Open browser console
   - Should see: "Environment loaded: {hasSupabaseUrl: true, hasSupabaseKey: true, hasGeminiKey: true}"

2. **Test functionality**:
   - Gemini API calls work (your main feature)
   - Supabase authentication works (if using)
   - No exposed keys in browser source

3. **Security check**:
   - View page source - no API keys visible
   - Check browser dev tools - only environment flags visible

## 🚨 Important Notes

- **Never commit** `.env` files or actual API keys
- **Always use environment variables** for sensitive data in production
- **The generated `env-config.js`** is created during build and should not be manually edited
- **Test files** (`test-api.html`, `test-gemini.html`) require manual key input - this is safe

## 📞 Support

If you encounter any issues with deployment or security configuration, check:
1. Environment variables are correctly set in Netlify
2. Build logs show successful config generation
3. Console shows successful environment loading
