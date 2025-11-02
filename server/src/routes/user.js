import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount,
  getDashboard
} from '../controllers/userController.js';

const router = express.Router();

// Get user profile
router.get('/profile', auth, getUserProfile);

// Update user profile
router.put('/profile', auth, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
], updateUserProfile);

// Change password
router.put('/password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
], changePassword);

// Delete user account
router.delete('/account', auth, [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account'),
], deleteAccount);

// Get user's dashboard data
router.get('/dashboard', auth, getDashboard);

export default router;