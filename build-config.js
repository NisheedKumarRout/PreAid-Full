#!/usr/bin/env node

// Build script — generates env-config.js with browser-safe keys only
// AI API keys (Gemini, OpenAI etc.) are NOT included here — they live
// server-side in Netlify Functions and are never exposed to the browser.

const fs = require('fs');
const path = require('path');

// Only these two are needed in the browser (for Supabase auth)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not set!');
  console.warn('   Authentication will NOT work. Set these in Netlify > Environment Variables.');
} else {
  console.log('✅ Supabase keys configured.');
}

const envConfig = `// Environment Configuration - Auto-generated during Netlify build
// SECURITY: Only browser-safe keys are included here.
// AI API keys are kept server-side in Netlify Functions only.
window.ENV = {
  SUPABASE_URL: '${supabaseUrl}',
  SUPABASE_ANON_KEY: '${supabaseAnonKey}'
};

(function() {
  var missing = [];
  if (!window.ENV.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!window.ENV.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  if (missing.length > 0) {
    console.warn('[PreAid] Missing env vars:', missing.join(', '));
  } else {
    console.log('[PreAid] Supabase configured successfully.');
  }
})();
`;

const outputPath = path.join(__dirname, 'env-config.js');
fs.writeFileSync(outputPath, envConfig, 'utf8');
console.log('✅ env-config.js generated successfully at:', outputPath);
console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ MISSING');
console.log('   SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ MISSING');
console.log('   AI keys (Gemini/OpenAI etc): stay server-side in Netlify Functions ✅');
