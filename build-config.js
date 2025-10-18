#!/usr/bin/env node

// Build script to generate environment configuration for deployment
// This script runs during Netlify build process and creates the env-config.js file

const fs = require('fs');
const path = require('path');

const envConfig = `// Environment Configuration - Generated during build
// This file is auto-generated during deployment - do not edit manually
window.ENV = {
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}',
  GEMINI_API_KEY: '${process.env.GEMINI_API_KEY || ''}',
  OPENAI_API_KEY: '${process.env.OPENAI_API_KEY || ''}',
  COHERE_API_KEY: '${process.env.COHERE_API_KEY || ''}',
  HUGGINGFACE_API_KEY: '${process.env.HUGGINGFACE_API_KEY || ''}',
  TOGETHER_API_KEY: '${process.env.TOGETHER_API_KEY || ''}',
  ANTHROPIC_API_KEY: '${process.env.ANTHROPIC_API_KEY || ''}'  
};

// Debug information (will be removed in production)
console.log('Environment loaded:', {
  hasSupabaseUrl: !!window.ENV.SUPABASE_URL,
  hasSupabaseKey: !!window.ENV.SUPABASE_ANON_KEY,
  hasGeminiKey: !!window.ENV.GEMINI_API_KEY,
  hasOpenAIKey: !!window.ENV.OPENAI_API_KEY,
  hasCohereKey: !!window.ENV.COHERE_API_KEY,
  hasHuggingFaceKey: !!window.ENV.HUGGINGFACE_API_KEY,
  hasTogetherKey: !!window.ENV.TOGETHER_API_KEY,
  hasAnthropicKey: !!window.ENV.ANTHROPIC_API_KEY
});`;

const outputPath = path.join(__dirname, 'env-config.js');

fs.writeFileSync(outputPath, envConfig);
console.log('Environment configuration generated successfully');
console.log('Config file created at:', outputPath);
