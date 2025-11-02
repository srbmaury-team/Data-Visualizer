import express from 'express';
import { body, param } from 'express-validator';
import { auth, optionalAuth } from '../middleware/auth.js';
import {
  createYamlFile,
  getUserYamlFiles,
  getYamlFileById,
  getSharedYamlFile,
  updateYamlFile,
  deleteYamlFile,
  getPublicYamlFiles
} from '../controllers/yamlController.js';

const router = express.Router();

// Create/Save YAML file
router.post('/', auth, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be 1-100 characters'),
  body('content')
    .isLength({ min: 1, max: 1000000 })
    .withMessage('YAML content is required and must be less than 1MB'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
], createYamlFile);

// Get user's YAML files
router.get('/my', auth, getUserYamlFiles);

// Get YAML file by ID (owner only)
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid file ID')
], getYamlFileById);

// Get shared YAML file by shareId (public access)
router.get('/shared/:shareId', optionalAuth, [
  param('shareId').isLength({ min: 10, max: 10 }).withMessage('Invalid share ID')
], getSharedYamlFile);

// Update YAML file
router.put('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid file ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be 1-100 characters'),
  body('content')
    .optional()
    .isLength({ min: 1, max: 1000000 })
    .withMessage('YAML content must be less than 1MB'),
], updateYamlFile);

// Delete YAML file
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid file ID')
], deleteYamlFile);

// Get public YAML files (browse/discover)
router.get('/public/browse', getPublicYamlFiles);

export default router;