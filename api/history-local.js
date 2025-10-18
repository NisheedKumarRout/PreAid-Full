const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'preaid-super-secret-jwt-key-2024-health-assistant-secure';
const HISTORY_FILE = path.join(__dirname, '..', 'consultations.json');

// Initialize history file
async function initHistoryFile() {
  try {
    await fs.access(HISTORY_FILE);
  } catch {
    await fs.writeFile(HISTORY_FILE, JSON.stringify([]));
  }
}

async function getConsultations() {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveConsultations(consultations) {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(consultations, null, 2));
}

initHistoryFile();

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader === 'Guest') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Get user history
router.get('/', verifyToken, async (req, res) => {
  try {
    const consultations = await getConsultations();
    const userConsultations = consultations
      .filter(c => c.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    res.json(userConsultations);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// Save consultation to history
router.post('/', verifyToken, async (req, res) => {
  try {
    const { issue, advice } = req.body;
    const consultations = await getConsultations();

    const newConsultation = {
      id: Date.now().toString(),
      userId: req.userId,
      issue,
      advice,
      createdAt: new Date().toISOString()
    };

    consultations.push(newConsultation);
    await saveConsultations(consultations);

    res.json({ success: true });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ error: 'Failed to save consultation' });
  }
});

module.exports = router;