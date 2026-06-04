// Standalone Netlify Function — PreAid AI Chat
// Uses the official Google Generative AI SDK for Gemini (permanent, version-safe)
// Falls back to OpenAI, Cohere, and Anthropic if Gemini is unavailable

// ─── GEMINI via official SDK ──────────────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // Model name is read from env var — change it in Netlify dashboard without touching code
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });

  const result = await genModel.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error('Gemini returned empty response');
  return { provider: 'gemini', content: text };
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

  const response = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.COHERE_MODEL || 'command-r',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048
    })
  });

  if (!response.ok) throw new Error(`Cohere HTTP ${response.status}`);
  const data = await response.json();
  const text = data?.message?.content?.[0]?.text;
  if (!text) throw new Error('Cohere returned empty response');
  return { provider: 'cohere', content: text };
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

// ─── MAIN: try providers in order ─────────────────────────────────────────────
async function getAIResponse(prompt) {
  const providers = [callGemini, callOpenAI, callCohere, callAnthropic];
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
