require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

const HISTORY_FILE = 'user_history.json';

async function loadHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveHistory(history) {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function getUserId(req) {
  return req.headers['x-user-id'] || 'anonymous';
}

app.post('/api/health-advice', async (req, res) => {
  console.log('Health advice request received:', req.body);
  
  try {
    const { issue } = req.body;
    const userId = getUserId(req);
    
    if (!issue) {
      console.log('No issue provided');
      return res.status(400).json({ error: 'Health issue is required' });
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
      console.log('API key not configured');
      return res.status(500).json({ error: 'API key not configured. Please add GEMINI_API_KEY to .env file' });
    }

    console.log('Loading history for user:', userId);
    const history = await loadHistory();
    const userHistory = history[userId] || [];
    
    let contextPrompt = `Provide first aid or health advice for: ${issue}`;
    if (userHistory.length > 0) {
      const recentIssues = userHistory.slice(-3).map(h => h.issue).join(', ');
      contextPrompt += `\n\nUser's recent health concerns: ${recentIssues}. Consider any patterns or related conditions.`;
    }

    console.log('Calling Gemini API...');
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
      })
    });

    console.log('Gemini API response status:', response.status);
    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!advice) {
      throw new Error('No advice generated');
    }

    userHistory.push({
      issue,
      advice,
      timestamp: new Date().toISOString()
    });
    
    history[userId] = userHistory;
    await saveHistory(history);

    console.log('Sending advice response');
    res.json({ advice });
  } catch (error) {
    console.error('Error in health-advice endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const userId = getUserId(req);
    const history = await loadHistory();
    res.json(history[userId] || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load history' });
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    const userId = getUserId(req);
    const index = parseInt(req.query.index);
    const history = await loadHistory();
    const userHistory = history[userId] || [];
    
    if (index >= 0 && index < userHistory.length) {
      userHistory.splice(index, 1);
      history[userId] = userHistory;
      await saveHistory(history);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'History item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Key configured:', !!GEMINI_API_KEY);
  console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
});