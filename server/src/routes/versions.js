import express from 'express';
import { body, param, query } from 'express-validator';
import { auth } from '../middleware/auth.js';
import {
  createVersion,
  getVersionHistory,
  getVersion,
  revertToVersion,
  compareVersions,
  cleanupVersionHistory,
  debugVersionHistory,
  repairVersionHistory
} from '../controllers/versionController.js';

const router = express.Router();

// Create a new version
router.post('/:fileId/versions', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID'),
  body('content')
    .isString()
    .isLength({ max: 1000000 })
    .withMessage('Content must be a string and less than 1MB'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  body('saveType')
    .optional()
    .isIn(['auto', 'manual'])
    .withMessage('Save type must be auto or manual')
], createVersion);

// Get version history for a file
router.get('/:fileId/versions', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  query('includeDeltas')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('includeDeltas must be true or false')
], getVersionHistory);

// Repair corrupted version history
router.post('/:fileId/versions/repair', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID')
], repairVersionHistory);

// Debug version history data
router.get('/:fileId/versions/debug', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID')
], debugVersionHistory);

// Compare two versions (must be before /:versionNumber route)
router.get('/:fileId/versions/compare', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID'),
  query('fromVersion').isInt({ min: 1 }).withMessage('Invalid from version'),
  query('toVersion').isInt({ min: 1 }).withMessage('Invalid to version')
], compareVersions);

// Get a specific version
router.get('/:fileId/versions/:versionNumber', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID'),
  param('versionNumber').isInt({ min: 1 }).withMessage('Invalid version number')
], getVersion);

// Revert to a specific version
router.post('/:fileId/versions/:versionNumber/revert', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID'),
  param('versionNumber').isInt({ min: 1 }).withMessage('Invalid version number'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
], revertToVersion);

// Cleanup old versions (keep recent ones and snapshots)
router.delete('/:fileId/versions/cleanup', auth, [
  param('fileId').isMongoId().withMessage('Invalid file ID'),
  body('keepVersions')
    .optional()
    .isInt({ min: 10, max: 200 })
    .withMessage('Keep versions must be between 10 and 200')
], cleanupVersionHistory);

export default router;