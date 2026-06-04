// Standalone Netlify Function — PreAid AI Chat
// Uses official Google AI SDK + multiple fallback providers
// Model names are configurable via Netlify env vars — no code changes needed when models update

// ─── GEMINI via official SDK ──────────────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // gemini-1.5-flash: free tier, 15 req/min, 1500 req/day — most reliable free model
  // Change GEMINI_MODEL in Netlify env vars to update without touching code
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });

  const result = await genModel.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error('Gemini returned empty response');
  return { provider: `gemini (${model})`, content: text };
}

// ─── OPENAI ───────────────────────────────────────────────────────────────────
async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`OpenAI: ${data.error.message}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty response');
  return { provider: 'openai', content: text };
}

// ─── COHERE ───────────────────────────────────────────────────────────────────
async function callCohere(prompt) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error('COHERE_API_KEY not set');

  // Using v1/generate — more stable for free tier keys
  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.COHERE_MODEL || 'command',
      prompt: `You are PreAid, an AI health assistant. Answer this health question clearly and helpfully: ${prompt}`,
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cohere HTTP ${response.status}: ${err.substring(0, 200)}`);
  }
  const data = await response.json();
  const text = data?.generations?.[0]?.text;
  if (!text) throw new Error('Cohere returned empty response');
  return { provider: 'cohere', content: text.trim() };
}

// ─── HUGGINGFACE (free, no payment needed) ──────────────────────────────────────────────
function callHuggingFace(prompt) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');

  // Using Mistral-7B — free, fast, good quality
  const model = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
  return fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      inputs: `<s>[INST] You are PreAid, an AI health assistant. ${prompt} [/INST]`,
      parameters: { max_new_tokens: 1024, temperature: 0.7, return_full_text: false }
    })
  }).then(async r => {
    if (!r.ok) throw new Error(`HuggingFace HTTP ${r.status}`);
    const data = await r.json();
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    if (!text) throw new Error('HuggingFace returned empty response');
    return { provider: 'huggingface', content: text.trim() };
  });
}

// ─── ANTHROPIC ────────────────────────────────────────────────────────────────
async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048
    })
  });

  if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`Anthropic: ${data.error.message}`);
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic returned empty response');
  return { provider: 'anthropic', content: text };
}

// ─── MAIN: try providers in order ─────────────────────────────────────────────────
async function getAIResponse(prompt) {
  // Try in order: Gemini → OpenAI → Cohere → HuggingFace → Anthropic
  const providers = [callGemini, callOpenAI, callCohere, callHuggingFace, callAnthropic];
  const errors = [];

  for (const provider of providers) {
    try {
      const result = await provider(prompt);
      console.log(`✅ Success with: ${result.provider}`);
      return result;
    } catch (err) {
      console.warn(`❌ ${err.message}`);
      errors.push(err.message);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

// ─── NETLIFY HANDLER ──────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { message, history, isPartialHistory, isFullAnalysisRequest } = JSON.parse(event.body || '{}');

    if (!message) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };

    const historyContext = history && history.length > 0
      ? `\n\nMEDICAL HISTORY CONTEXT: ${history.map(h => `"${h.issue}" (${h.timeAgo})`).join(', ')}\n\nIMPORTANT: Acknowledge the connection between current symptoms and previous medical history.`
      : '';

    const fullAnalysisNote = isFullAnalysisRequest
      ? '\n\n**FULL MEDICAL HISTORY ANALYSIS COMPLETED**' : '';

    const partialHistoryNote = isPartialHistory && !isFullAnalysisRequest
      ? '\n\n**Note: Ask the same question again for a full analysis of your medical history.**' : '';

    const prompt = `You are PreAid, an emergency AI health assistant for India.
- If NOT health-related: say "This isn't a health-related issue" and answer briefly.
- If serious: start with Indian emergency numbers (108, 102, 100, 101) and give immediate safe steps.
- For high-risk procedures (CPR, choking, spinal injury): include a strong safety warning that untrained people should wait for professionals.
- Always include Indian emergency numbers: National Emergency: 108, Ambulance: 102, Police: 100, Fire: 101.
- Keep responses concise and actionable.
- End every response with: "⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment."

Question: "${message}"${historyContext}${fullAnalysisNote}${partialHistoryNote}`;

    const aiResponse = await getAIResponse(prompt);
    let advice = aiResponse.content;

    if (isPartialHistory && !isFullAnalysisRequest && !advice.includes('full analysis')) {
      advice += '\n\n**📋 Quick Analysis:** Ask the same question again for a full analysis of your medical history.';
    }

    return { statusCode: 200, headers, body: JSON.stringify({ advice }) };

  } catch (error) {
    console.error('AI service error:', error.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        error: 'AI service temporarily unavailable',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
