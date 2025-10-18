// Environment Configuration - Generated during build
// This file is auto-generated during deployment - do not edit manually
window.ENV = {
  SUPABASE_URL: 'your_supabase_url_here',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key_here',
  GEMINI_API_KEY: 'your_gemini_api_key_here',
  OPENAI_API_KEY: '',
  COHERE_API_KEY: '',
  HUGGINGFACE_API_KEY: '',
  TOGETHER_API_KEY: '',
  ANTHROPIC_API_KEY: ''  
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
});