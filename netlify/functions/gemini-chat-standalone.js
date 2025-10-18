// Standalone Netlify Function with embedded Multi-AI Service
// This avoids module resolution issues in Netlify Functions environment

// Multi-AI Service implementation (embedded)
class MultiAIService {
  constructor() {
    this.providers = [
      {
        name: 'gemini',
        apiKey: process.env.GEMINI_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent',
        formatRequest: this.formatGeminiRequest.bind(this),
        parseResponse: this.parseGeminiResponse.bind(this),
        tier: 'free',
        limit: '15 req/min'
      },
      {
        name: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        formatRequest: this.formatOpenAIRequest.bind(this),
        parseResponse: this.parseOpenAIResponse.bind(this),
        tier: 'freemium',
        limit: '$5 credits'
      },
      {
        name: 'cohere',
        apiKey: process.env.COHERE_API_KEY,
        baseUrl: 'https://api.cohere.ai/v1/generate',
        formatRequest: this.formatCohereRequest.bind(this),
        parseResponse: this.parseCohereResponse.bind(this),
        tier: 'free',
        limit: '5000 calls/month'
      },
      {
        name: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1/messages',
        formatRequest: this.formatAnthropicRequest.bind(this),
        parseResponse: this.parseAnthropicResponse.bind(this),
        tier: 'paid',
        limit: 'pay-per-use'
      }
    ];

    // Filter out providers without API keys
    this.availableProviders = this.providers.filter(provider => 
      provider.apiKey && provider.apiKey !== 'your_api_key_here' && provider.apiKey.length > 10
    );

    if (this.availableProviders.length === 0) {
      console.warn('⚠️ No AI providers configured! Please add at least one API key to your environment variables.');
    } else {
      console.log(`✅ Configured AI providers: ${this.availableProviders.map(p => p.name).join(', ')}`);
    }
  }

  // Gemini API formatting
  formatGeminiRequest(prompt, config = {}) {
    const provider = this.providers.find(p => p.name === 'gemini');
    const url = `${provider.baseUrl}?key=${provider.apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature || 0.7,
        maxOutputTokens: config.maxTokens || 2048,
        topP: config.topP || 0.8,
        topK: config.topK || 40
      }
    };
    
    return {
      url,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    };
  }

  parseGeminiResponse(data) {
    if (data?.promptFeedback?.blockReason) {
      throw new Error(`Request blocked by safety filters: ${data.promptFeedback.blockReason}`);
    }
    
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => (typeof p.text === 'string' ? p.text : '')).filter(Boolean).join('\n\n');
    
    if (!text) {
      throw new Error('No content generated');
    }
    
    return text;
  }

  // OpenAI API formatting
  formatOpenAIRequest(prompt, config = {}) {
    const provider = this.providers.find(p => p.name === 'openai');
    const url = provider.baseUrl;
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2048,
      top_p: config.topP || 0.8
    };
    
    return {
      url,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify(body)
      }
    };
  }

  parseOpenAIResponse(data) {
    if (data.error) {
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }
    
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('No content generated');
    }
    
    return text;
  }

  // Cohere API formatting
  formatCohereRequest(prompt, config = {}) {
    const provider = this.providers.find(p => p.name === 'cohere');
    const url = provider.baseUrl;
    const body = {
      model: 'command-light',
      prompt: `You are PreAid, an AI health assistant. Provide medical advice for: ${prompt}`,
      max_tokens: config.maxTokens || 2048,
      temperature: config.temperature || 0.7,
      k: config.topK || 40,
      p: config.topP || 0.8
    };
    
    return {
      url,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify(body)
      }
    };
  }

  parseCohereResponse(data) {
    if (data.message && data.message.includes('error')) {
      throw new Error(`Cohere API error: ${data.message}`);
    }
    
    const text = data?.generations?.[0]?.text;
    if (!text) {
      throw new Error('No content generated');
    }
    
    return text.trim();
  }

  // Anthropic API formatting
  formatAnthropicRequest(prompt, config = {}) {
    const provider = this.providers.find(p => p.name === 'anthropic');
    const url = provider.baseUrl;
    const body = {
      model: 'claude-3-sonnet-20240229',
      max_tokens: config.maxTokens || 2048,
      temperature: config.temperature || 0.7,
      messages: [
        { role: 'user', content: prompt }
      ]
    };
    
    return {
      url,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      }
    };
  }

  parseAnthropicResponse(data) {
    if (data.error) {
      throw new Error(`Anthropic API error: ${data.error.message}`);
    }
    
    const text = data?.content?.[0]?.text;
    if (!text) {
      throw new Error('No content generated');
    }
    
    return text;
  }

  // Main method to generate response with automatic fallback
  async generateResponse(prompt, config = {}) {
    if (this.availableProviders.length === 0) {
      throw new Error('No AI providers configured');
    }

    const errors = [];
    
    for (const provider of this.availableProviders) {
      console.log(`🔄 Trying ${provider.name}...`);
      
      try {
        const { url, options } = provider.formatRequest(prompt, config);
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        const result = provider.parseResponse(data);
        
        console.log(`✅ Success with ${provider.name}`);
        return {
          success: true,
          provider: provider.name,
          content: result
        };
        
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error.message);
        errors.push({
          provider: provider.name,
          error: error.message
        });
        
        // Continue to next provider
        continue;
      }
    }
    
    // All providers failed
    throw new Error(`All AI providers failed. Errors: ${JSON.stringify(errors)}`);
  }

  // Health check for available providers
  getProviderStatus() {
    return {
      total: this.providers.length,
      available: this.availableProviders.length,
      providers: this.providers.map(p => ({
        name: p.name,
        configured: !!p.apiKey && p.apiKey !== 'your_api_key_here' && p.apiKey.length > 10
      }))
    };
  }
}

// Export singleton instance
let aiService;
function getAIService() {
  if (!aiService) {
    aiService = new MultiAIService();
  }
  return aiService;
}

// Netlify Function Handler
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { message, history, isPartialHistory, isFullAnalysisRequest } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Get the multi-AI service instance
    const aiService = getAIService();
    
    // Check if any providers are available
    const providerStatus = aiService.getProviderStatus();
    if (providerStatus.available === 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No AI providers configured', 
          details: 'Please add at least one API key to environment variables',
          providers: providerStatus.providers
        })
      };
    }

    const historyContext = history && history.length > 0 ? 
      `\\n\\nMEDICAL HISTORY CONTEXT: ${history.map(h => `"${h.issue}" (${h.timeAgo})`).join(', ')}\\n\\nIMPORTANT: Start your response by acknowledging the connection between current symptoms and previous medical history.` : '';

    const partialHistoryNote = isPartialHistory && !isFullAnalysisRequest ? 
      '\\n\\n**Note: If you want a full analysis of your medical history, please ask the same question again.**' : '';

    const fullAnalysisNote = isFullAnalysisRequest ? 
      '\\n\\n**FULL MEDICAL HISTORY ANALYSIS COMPLETED** - This response includes comprehensive analysis of your medical history.' : '';

    const rules = `You are PreAid, an emergency AI health assistant.
- If NOT health-related: say "This ain't a medical emergency!" and answer briefly.
- If serious: start with ambulance warning and give immediate safe steps.
- For high-risk (CPR/choking/spinal): include strong safety warning.
- Keep it concise and actionable.
- End with the disclaimer.`;

    const userPrompt = `${rules}

Question: "${message}"${historyContext}

${fullAnalysisNote}${partialHistoryNote}`;

    console.log(`🚀 Using multi-AI service with ${providerStatus.available} available providers:`, 
      providerStatus.providers.filter(p => p.configured).map(p => p.name).join(', '));
    
    // Use the multi-AI service with automatic fallback
    const aiResponse = await aiService.generateResponse(userPrompt, {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.8,
      topK: 40
    });
    
    console.log(`✅ Successfully got response from: ${aiResponse.provider}`);
    let advice = aiResponse.content;
    
    // If the response is too short, try with a more detailed prompt
    if (!advice || advice.length < 50) {
      console.log('⚠️ Response too short, trying with detailed prompt...');
      const detailedPrompt = `You are PreAid, an AI health assistant. Provide comprehensive first aid advice for: "${message}".
- Include step-by-step instructions
- Add emergency warnings if necessary
- Provide 6-10 actionable points
- End with the medical disclaimer`;
      
      const retryResponse = await aiService.generateResponse(detailedPrompt, {
        temperature: 0.6,
        maxTokens: 1500
      });
      
      advice = retryResponse.content;
      console.log(`✅ Retry successful with: ${retryResponse.provider}`);
    }

    // Add partial history warning if needed
    if (isPartialHistory && !isFullAnalysisRequest && !advice.includes('full analysis')) {
      const disclaimerIndex = advice.lastIndexOf('⚠️ **Disclaimer:**');
      if (disclaimerIndex > -1) {
        const beforeDisclaimer = advice.substring(0, disclaimerIndex);
        const disclaimer = advice.substring(disclaimerIndex);
        advice = beforeDisclaimer + '\\n\\n**📋 Quick Analysis:** If you want a full analysis of your medical history, please ask the same question again.\\n\\n' + disclaimer;
      } else {
        advice += '\\n\\n**📋 Quick Analysis:** If you want a full analysis of your medical history, please ask the same question again.';
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ advice })
    };

  } catch (error) {
    console.error('Multi-AI service error:', error);
    
    // Try to parse the error for more details
    let errorDetails = error?.message || String(error);
    let statusCode = 500;
    
    // If all providers failed, show more helpful error
    if (errorDetails.includes('All AI providers failed')) {
      statusCode = 502;
      errorDetails = 'All AI services are currently unavailable. Please try again in a few minutes.';
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: 'AI service temporarily unavailable', 
        details: errorDetails,
        timestamp: new Date().toISOString()
      })
    };
  }
};
