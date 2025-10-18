// Simple in-memory storage for demo (use database in production)
let history = [];

export default async function handler(req, res) {
  const userId = req.headers.authorization?.replace('Bearer ', '') || 'guest';

  if (req.method === 'GET') {
    // Get user history
    const userHistory = history.filter(h => h.userId === userId);
    res.json(userHistory);

  } else if (req.method === 'POST') {
    // Save to history
    const { issue, advice } = req.body;
    
    const historyItem = {
      id: Date.now().toString(),
      userId,
      issue,
      advice,
      created_at: new Date().toISOString()
    };
    
    history.push(historyItem);
    res.json({ success: true });

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}