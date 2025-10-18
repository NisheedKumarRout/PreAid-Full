// Multi-AI Service with Automatic Fallback
// Supports Google Gemini, OpenAI GPT, Anthropic Claude, Cohere, Hugging Face, and Together AI

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
        name: 'huggingface',
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseUrl: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
        formatRequest: this.formatHuggingFaceRequest.bind(this),
        parseResponse: this.parseHuggingFaceResponse.bind(this),
        tier: 'free',
        limit: 'rate limited'
      },
      {
        name: 'together',
        apiKey: process.env.TOGETHER_API_KEY,
        baseUrl: 'https://api.together.xyz/inference',
        formatRequest: this.formatTogetherRequest.bind(this),
        parseResponse: this.parseTogetherResponse.bind(this),
        tier: 'freemium',
        limit: '$25 credits'
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
    const url = `${this.providers[0].baseUrl}?key=${this.providers[0].apiKey}`;
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
      model: 'gpt-4o-mini', // More cost-effective than gpt-4
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

  // Hugging Face API formatting
  formatHuggingFaceRequest(prompt, config = {}) {
    const provider = this.providers.find(p => p.name === 'huggingface');
    const url = provider.baseUrl;
    const body = {
      inputs: `User: You are PreAid, a medical AI assistant. ${prompt}\nAssistant:`,
      parameters: {
        max_length: config.maxTokens || 2048,
        temperature: config.temperature || 0.7,
        top_p: config.topP || 0.8,
        do_sample: true,
        return_full_text: false
      },
      options: {
        wait_for_model: true,
        use_cache: false
      }
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

  parseHuggingFaceResponse(data) {
    if (data.error) {
      throw new Error(`Hugging Face API error: ${data.error}`);
    }
    
    const text = data?.[0]?.generated_text || data?.generated_text;
    if (!text) {
      throw new Error('No content generated');
    }
    
    return text.trim();
  }

  // Together AI API formatting
  formatTogetherRequest(prompt, config = {}) {
    const provider = this.providers.find(p => p.name === 'together');
    const url = provider.baseUrl;
    const body = {
      model: 'meta-llama/Llama-2-7b-chat-hf',
      prompt: `You are PreAid, an AI health assistant. Provide medical advice for: ${prompt}`,
      max_tokens: config.maxTokens || 2048,
      temperature: config.temperature || 0.7,
      top_p: config.topP || 0.8,
      top_k: config.topK || 40
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

  parseTogetherResponse(data) {
    if (data.error) {
      throw new Error(`Together AI error: ${data.error.message || data.error}`);
    }
    
    const text = data?.output?.choices?.[0]?.text || data?.choices?.[0]?.text;
    if (!text) {
      throw new Error('No content generated');
    }
    
    return text.trim();
  }

  // Anthropic Claude API formatting
  formatAnthropicRequest(prompt, config = {}) {
    const provider = this.providers.find(p => p.name === 'anthropic');
    const url = provider.baseUrl;
    const body = {
      model: 'claude-3-haiku-20240307', // Fast and cost-effective
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: config.maxTokens || 2048,
      temperature: config.temperature || 0.7
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

  async generateResponse(prompt, config = {}) {
    if (this.availableProviders.length === 0) {
      throw new Error('No AI providers configured. Please add API keys to your environment variables.');
    }

    const errors = [];
    
    // Try each provider in order
    for (const provider of this.availableProviders) {
      try {
        console.log(`🤖 Trying ${provider.name}...`);
        
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

module.exports = { MultiAIService, getAIService };
