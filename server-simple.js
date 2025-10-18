require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Simple health advice endpoint
app.post('/api/health-advice', async (req, res) => {
  try {
    const { issue } = req.body;
    
    if (!issue) {
      return res.status(400).json({ error: 'Health issue required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `You are a helpful health assistant. Provide caring advice for: ${issue}`;
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const response = await new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    const advice = response.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate advice';
    res.json({ advice });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get advice' });
  }
});

// Simple auth (guest mode only for now)
app.post('/api/auth', (req, res) => {
  res.json({ user: { name: 'Guest User' }, token: 'guest-token' });
});

app.get('/api/history', (req, res) => {
  res.json([]);
});

app.post('/api/history', (req, res) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Key configured:', !!GEMINI_API_KEY);
});