// PreAid AI Chat — Netlify Serverless Function
// Provider order: Cohere → HuggingFace → Gemini (multi-model) → OpenAI → Anthropic
// All model names configurable via Netlify environment variables

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are PreAid, an emergency AI health assistant for India.
Rules:
- If NOT health-related: say "This isn't a health-related issue" and answer briefly.
- If serious: start with Indian emergency numbers (108, 102, 100, 101) and give immediate safe steps.
- For high-risk procedures (CPR, choking, spinal): include strong safety warning that untrained people should wait for professionals.
- Always include Indian emergency numbers when relevant: National Emergency: 108, Ambulance: 102, Police: 100, Fire: 101.
- Keep responses concise and actionable.
- End every response with: "⚠️ **Disclaimer:** I'm an AI assistant providing general information only. Always consult qualified healthcare professionals for proper medical diagnosis and treatment."`;

// ─── COHERE (lead provider — v2 Chat API) ──────────────────────────────────────
async function callCohere(prompt) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) throw new Error('COHERE_API_KEY not set');

  const modelsToTry = process.env.COHERE_MODEL
    ? [process.env.COHERE_MODEL]
    : ['command-r-08-2024', 'command-a-03-2025', 'command-r7b-12-2024', 'command-r-plus-08-2024', 'command-a-plus-05-2026'];

  const errors = [];
  for (const model of modelsToTry) {
    try {
      console.log(`Trying Cohere model: ${model}...`);
      const response = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: `${SYSTEM_PROMPT}\n\n${prompt}` }
          ]
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`HTTP ${response.status}: ${err.substring(0, 200)}`);
      }
      const data = await response.json();
      const text = data?.message?.content?.[0]?.text;
      if (!text) throw new Error('Empty response');
      return { provider: `cohere (${model})`, content: text };
    } catch (err) {
      console.warn(`Cohere model ${model} failed: ${err.message}`);
      errors.push(`${model}: ${err.message}`);
    }
  }
  throw new Error(`All Cohere models failed: ${errors.join('; ')}`);
}

// ─── HUGGINGFACE (free — OpenAI-compatible router) ─────────────────────────────
async function callHuggingFace(prompt) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not set');

  const modelsToTry = process.env.HUGGINGFACE_MODEL
    ? [process.env.HUGGINGFACE_MODEL]
    : [
        'meta-llama/Llama-3.2-3B-Instruct',
        'microsoft/Phi-3.5-mini-instruct',
        'Qwen/Qwen2.5-72B-Instruct',
        'HuggingFaceH4/zephyr-7b-beta'
      ];

  const errors = [];
  for (const model of modelsToTry) {
    try {
      console.log(`Trying Hugging Face model: ${model}...`);
      const response = await fetch(
        `https://router.huggingface.co/hf-inference/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            max_tokens: 1024,
            temperature: 0.7
          })
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`HTTP ${response.status}: ${err.substring(0, 200)}`);
      }
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response');
      return { provider: `huggingface (${model})`, content: text.trim() };
    } catch (err) {
      console.warn(`HuggingFace model ${model} failed: ${err.message}`);
      errors.push(`${model}: ${err.message}`);
    }
  }
  throw new Error(`All Hugging Face models failed: ${errors.join('; ')}`);
}

// ─── GEMINI (raw fetch, tries multiple models) ─────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  // Try models in order — if one returns 404 we try the next
  const modelsToTry = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL]
    : ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-flash-8b', 'gemini-1.0-pro'];

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${prompt}`;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.8 }
        })
      });

      if (response.status === 404) {
        console.warn(`Gemini model ${model} not found, trying next...`);
        continue;
      }
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini HTTP ${response.status}: ${err.substring(0, 300)}`);
      }

      const data = await response.json();
      if (data?.promptFeedback?.blockReason) {
        throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
      }
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('');
      if (!text) throw new Error('Gemini returned empty response');
      return { provider: `gemini (${model})`, content: text };
    } catch (err) {
      if (modelsToTry.indexOf(model) === modelsToTry.length - 1) throw err;
      console.warn(`Gemini ${model} failed: ${err.message}`);
    }
  }
  throw new Error('All Gemini models failed');
}

// ─── OPENAI ────────────────────────────────────────────────────────────────────
async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${err.substring(0, 300)}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(`OpenAI: ${data.error.message}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty response');
  return { provider: `openai (${model})`, content: text };
}

// ─── ANTHROPIC ─────────────────────────────────────────────────────────────────
async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic HTTP ${response.status}: ${err.substring(0, 300)}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(`Anthropic: ${data.error.message}`);
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic returned empty response');
  return { provider: `anthropic (${model})`, content: text };
}

// ─── MAIN FALLBACK CHAIN ───────────────────────────────────────────────────────
async function getAIResponse(prompt) {
  // Order: Cohere → HuggingFace → Gemini → OpenAI → Anthropic
  const providers = [
    { name: 'Cohere', fn: callCohere },
    { name: 'HuggingFace', fn: callHuggingFace },
    { name: 'Gemini', fn: callGemini },
    { name: 'OpenAI', fn: callOpenAI },
    { name: 'Anthropic', fn: callAnthropic }
  ];

  const errors = [];
  for (const { name, fn } of providers) {
    try {
      console.log(`🔄 Trying ${name}...`);
      const result = await fn(prompt);
      console.log(`✅ Success with: ${result.provider}`);
      return result;
    } catch (err) {
      console.warn(`❌ ${name} failed: ${err.message}`);
      errors.push(`${name}: ${err.message}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

// ─── NETLIFY HANDLER ───────────────────────────────────────────────────────────
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
    const body = JSON.parse(event.body || '{}');
    const { message, history, isPartialHistory, isFullAnalysisRequest } = body;

    if (!message) return {
      statusCode: 400, headers,
      body: JSON.stringify({ error: 'Message is required' })
    };

    // Build context from history
    const historyContext = history && history.length > 0
      ? `\n\nMEDICAL HISTORY CONTEXT: ${history.map(h => `"${h.issue}" (${h.timeAgo})`).join(', ')}\nPlease acknowledge the connection between current symptoms and previous medical history.`
      : '';

    const fullAnalysisNote = isFullAnalysisRequest
      ? '\n\n**FULL MEDICAL HISTORY ANALYSIS COMPLETED**' : '';

    const partialNote = isPartialHistory && !isFullAnalysisRequest
      ? '\n\n**Note: Ask the same question again for a full analysis of your medical history.**' : '';

    const userPrompt = `Question: "${message}"${historyContext}${fullAnalysisNote}${partialNote}`;

    const aiResponse = await getAIResponse(userPrompt);

    let advice = aiResponse.content;
    if (isPartialHistory && !isFullAnalysisRequest && !advice.includes('full analysis')) {
      advice += '\n\n**📋 Ask the same question again for a full analysis of your medical history.**';
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ advice, provider: aiResponse.provider })
    };

  } catch (error) {
    console.error('All AI providers failed:', error.message);
    return {
      statusCode: 502, headers,
      body: JSON.stringify({
        error: 'AI service temporarily unavailable',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
