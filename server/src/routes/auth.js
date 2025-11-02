import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import {
  register,
  login,
  getCurrentUser,
  logout
} from '../controllers/authController.js';

const router = express.Router();

// Register user
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], register);

// Login user
router.post('/login', [
  body('login').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], login);

// Get current user
router.get('/me', auth, getCurrentUser);

// Logout (client-side token removal, but we can track it)
router.post('/logout', auth, logout);

export default router;