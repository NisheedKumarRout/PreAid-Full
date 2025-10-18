const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'preaid-super-secret-jwt-key-2024-health-assistant-secure';
const USERS_FILE = path.join(__dirname, '..', 'users.json');

// Initialize users file
async function initUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([]));
  }
}

async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

initUsersFile();

router.post('/', async (req, res) => {
  try {
    const { action, email, password, name } = req.body;
    const users = await getUsers();

    if (action === 'register') {
      // Check if user exists
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      await saveUsers(users);

      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);

      res.json({
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        token
      });

    } else if (action === 'login') {
      // Find user
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);

      res.json({
        user: { id: user.id, email: user.email, name: user.name },
        token
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;