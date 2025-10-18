// Import the multi-AI service
const path = require('path');

// Try multiple paths to resolve the module in Netlify environment
let getAIService;
try {
  // First try relative path from functions folder
  ({ getAIService } = require('../../api/multi-ai-service.js'));
} catch (e1) {
  try {
    // Try absolute path resolution
    ({ getAIService } = require(path.resolve(__dirname, '../../api/multi-ai-service.js')));
  } catch (e2) {
    try {
      // Try from project root
      ({ getAIService } = require(path.join(process.cwd(), 'api/multi-ai-service.js')));
    } catch (e3) {
      console.error('Failed to load multi-ai-service:', e1.message, e2.message, e3.message);
      throw new Error('Cannot find multi-ai-service module');
    }
  }
}

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

    const rules = `You are PreAid, an emergency AI health assistant for India.
- If NOT health-related: say "This isn't a health-related issue" and answer briefly.
- If serious: start with Indian emergency numbers (108, 102, 100, 101) and give immediate safe steps.
- For high-risk procedures: include strong safety warning that untrained people should wait for professionals.
- Always include Indian emergency numbers: National Emergency: 108, Ambulance: 102, Police: 100, Fire: 101.
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
        advice = beforeDisclaimer + '\n\n**📋 Quick Analysis:** If you want a full analysis of your medical history, please ask the same question again.\n\n' + disclaimer;
      } else {
        advice += '\n\n**📋 Quick Analysis:** If you want a full analysis of your medical history, please ask the same question again.';
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

function safeTruncate(text, max) {
  try {
    if (typeof text !== 'string') return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  } catch {
    return '';
  }
}