import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { User } from './models/User.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus_ai';
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_jwt_secret_in_production';

// Middleware
app.use(cors());
app.use(express.json());

// In-Memory Fallback User Store (used if MongoDB local service is initializing)
const memoryUsers = new Map();

// MongoDB Connection
let isMongoConnected = false;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB successfully!');
  })
  .catch((err) => {
    console.warn('⚠️ MongoDB connection warning:', err.message);
    console.log('ℹ️ Running in memory-safe fallback mode for user authentication.');
  });

// Helper to generate JWT Token
const generateToken = (userId, email) => {
  return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    mongoConnected: isMongoConnected,
    timestamp: new Date().toISOString(),
  });
});

// 1. SIGNUP ENDPOINT
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists in MongoDB or Memory
    if (isMongoConnected) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this email address already exists. Please sign in.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user in MongoDB
      const newUser = new User({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      });

      await newUser.save();
      const token = generateToken(newUser._id, newUser.email);

      return res.status(201).json({
        message: 'Account created successfully!',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl,
        },
      });
    } else {
      // Memory Fallback Mode
      if (memoryUsers.has(cleanEmail)) {
        return res.status(400).json({ message: 'An account with this email address already exists. Please sign in.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const userId = `user_${Date.now()}`;

      const memoryUser = {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      };

      memoryUsers.set(cleanEmail, memoryUser);
      const token = generateToken(userId, cleanEmail);

      return res.status(201).json({
        message: 'Account created successfully!',
        token,
        user: {
          id: memoryUser.id,
          name: memoryUser.name,
          email: memoryUser.email,
          avatarUrl: memoryUser.avatarUrl,
        },
      });
    }
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ message: error.message || 'Server error during signup.' });
  }
});

// 2. LOGIN ENDPOINT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please provide your email address.' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Please enter your password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isMongoConnected) {
      // Find User in MongoDB
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials. User with this email does not exist.' });
      }

      // Verify Password with bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password. Please check your credentials and try again.' });
      }

      const token = generateToken(user._id, user.email);

      return res.json({
        message: 'Signed in successfully!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    } else {
      // Memory Fallback Mode
      const user = memoryUsers.get(cleanEmail);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials. User with this email does not exist.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password. Please check your credentials and try again.' });
      }

      const token = generateToken(user.id, user.email);

      return res.json({
        message: 'Signed in successfully!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: error.message || 'Server error during login.' });
  }
});

// 3. GET CURRENT AUTHENTICATED USER ME ENDPOINT
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (isMongoConnected) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User account not found.' });
      }
      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    } else {
      const user = Array.from(memoryUsers.values()).find((u) => u.id === decoded.id || u.email === decoded.email);
      if (!user) {
        return res.status(401).json({ message: 'User account not found.' });
      }
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Nexus AI Auth Backend server running on http://localhost:${PORT}`);
});
