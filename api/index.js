const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Import routes (use local file-based storage for development)
const authRoutes = require('./auth-local');
const healthRoutes = require('./health-advice');
const historyRoutes = require('./history-local');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/health-advice', healthRoutes);
app.use('/api/history', historyRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Visit the app at: http://localhost:' + PORT);
  });
}

module.exports = app;