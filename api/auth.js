import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Simple in-memory storage for demo (use database in production)
let users = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, email, password, name } = req.body;

    if (action === 'register') {
      // Check if user exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = {
        id: Date.now().toString(),
        email,
        name,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      
      users.push(user);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });

    } else if (action === 'login') {
      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}