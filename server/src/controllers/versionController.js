import VersionHistory from '../models/VersionHistory.js';
import YamlFile from '../models/YamlFile.js';
import { 
  calculateDelta, 
  applyDelta, 
  reconstructFromDeltas, 
  calculateChangeStats, 
  generateChangeSummary,
  shouldCreateSnapshot 
} from '../services/deltaService.js';

/**
 * Create a new version of a YAML file
 */
export const createVersion = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content, message, saveType = 'manual' } = req.body;
    const userId = req.user._id;

    // Verify file ownership
    const yamlFile = await YamlFile.findOne({ _id: fileId, owner: userId });
    if (!yamlFile) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Get the latest version
    const latestVersion = await VersionHistory.getLatestVersion(fileId);
    const newVersionNumber = latestVersion + 1;

    // Get the previous content
    let previousContent = '';
    if (latestVersion > 0) {
      previousContent = await reconstructContentAtVersion(fileId, latestVersion);
    }

    // Calculate delta
    const delta = calculateDelta(previousContent, content);
    const changeStats = calculateChangeStats(delta);
    const summary = generateChangeSummary(delta, previousContent, content);

    // Check if we should create a snapshot
    const shouldSnapshot = shouldCreateSnapshot(newVersionNumber, delta.length);
    
    // Create version record
    const versionData = {
      fileId,
      version: newVersionNumber,
      delta: shouldSnapshot ? [] : delta,
      isSnapshot: shouldSnapshot,
      snapshotContent: shouldSnapshot ? content : null,
      author: userId,
      message: message || '',
      changeMetadata: {
        summary,
        linesChanged: {
          added: changeStats.linesAdded,
          removed: changeStats.linesRemoved,
          modified: Math.max(changeStats.linesAdded, changeStats.linesRemoved)
        },
        characterDelta: changeStats.characterDelta,
        saveType
      },
      deltaSize: delta.length
    };

    const version = await VersionHistory.create(versionData);

    // Update the main file's content and version
    yamlFile.content = content;
    yamlFile.currentVersion = newVersionNumber;
    yamlFile.updatedAt = new Date();
    await yamlFile.save();

    // Populate author info
    await version.populate('author', 'username email');

    res.status(201).json({
      version: version.toObject(),
      changeStats: changeStats,
      isSnapshot: shouldSnapshot
    });

  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({ error: 'Failed to create version' });
  }
};

/**
 * Get version history for a file
 */
export const getVersionHistory = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { limit = 20, offset = 0, includeDeltas = false } = req.query;
    const userId = req.user._id;

    // Verify file ownership
    const yamlFile = await YamlFile.findOne({ _id: fileId, owner: userId });
    if (!yamlFile) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Build query
    const selectFields = includeDeltas === 'true' 
      ? '' // Include all fields
      : '-delta -snapshotContent'; // Exclude large fields for list view

    const versions = await VersionHistory.find({ fileId })
      .sort({ version: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select(selectFields)
      .populate('author', 'username email')
      .lean();

    // Add change statistics for each version
    const versionsWithStats = versions.map(version => ({
      ...version,
      changeStats: version.delta ? calculateChangeStats(version.delta) : null
    }));

    // Get total count
    const totalVersions = await VersionHistory.countDocuments({ fileId });

    res.json({
      versions: versionsWithStats,
      totalVersions,
      currentVersion: yamlFile.currentVersion,
      hasMore: offset + versions.length < totalVersions
    });

  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({ error: 'Failed to retrieve version history' });
  }
};

/**
 * Get a specific version of a file
 */
export const getVersion = async (req, res) => {
  try {
    const { fileId, versionNumber } = req.params;
    const userId = req.user._id;

    // Validate version number
    const parsedVersionNumber = parseInt(versionNumber);
    if (isNaN(parsedVersionNumber) || parsedVersionNumber < 1) {
      return res.status(400).json({ error: 'Invalid version number' });
    }

    // Verify file ownership
    const yamlFile = await YamlFile.findOne({ _id: fileId, owner: userId });
    if (!yamlFile) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Get the specific version
    const version = await VersionHistory.findOne({ 
      fileId, 
      version: parsedVersionNumber
    }).populate('author', 'username email');

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Reconstruct content at this version
    const content = await reconstructContentAtVersion(fileId, parsedVersionNumber);

    res.json({
      version: version.toObject(),
      content,
      changeStats: calculateChangeStats(version.delta)
    });

  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({ error: 'Failed to retrieve version' });
  }
};

/**
 * Revert to a specific version
 */
export const revertToVersion = async (req, res) => {
  try {
    const { fileId, versionNumber } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    // Validate parameters
    if (!fileId || !versionNumber) {
      return res.status(400).json({ error: 'Missing fileId or versionNumber' });
    }

    // Verify file ownership
    const yamlFile = await YamlFile.findOne({ _id: fileId, owner: userId });
    if (!yamlFile) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Check if the target version exists
    const targetVersion = await VersionHistory.findOne({ 
      fileId, 
      version: parseInt(versionNumber) 
    });
    
    if (!targetVersion) {
      return res.status(404).json({ error: `Version ${versionNumber} not found` });
    }

    // Get content at the target version
    const targetContent = await reconstructContentAtVersion(fileId, parseInt(versionNumber));
    
    if (targetContent === null || targetContent === undefined) {
      return res.status(500).json({ error: 'Failed to reconstruct content for target version' });
    }
    
    // Create a new version with the reverted content
    const revertMessage = message || `Reverted to version ${versionNumber}`;
    
    // Create new version
    const result = await createVersionInternal(
      fileId, 
      targetContent, 
      userId, 
      revertMessage, 
      'manual'
    );

    // Update the main file content and version
    yamlFile.content = targetContent;
    yamlFile.currentVersion = result.version.version; // Use the version number, not the version object
    yamlFile.updatedAt = new Date();
    await yamlFile.save();
    console.log('File updated successfully');

    res.json({
      success: true,
      newVersion: result.version,
      revertedToVersion: parseInt(versionNumber),
      content: targetContent
    });

  } catch (error) {
    console.error('Revert version error:', error);
    res.status(500).json({ 
      error: 'Failed to revert to version'
    });
  }
};

/**
 * Compare two versions
 */
export const compareVersions = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { fromVersion, toVersion } = req.query;
    const userId = req.user._id;

    console.log('compareVersions called with:', { fileId, fromVersion, toVersion, userId });

    // Validate version numbers
    const parsedFromVersion = parseInt(fromVersion);
    const parsedToVersion = parseInt(toVersion);
    
    console.log('Parsed versions:', { parsedFromVersion, parsedToVersion });
    
    if (isNaN(parsedFromVersion) || parsedFromVersion < 1) {
      console.log('Invalid fromVersion:', fromVersion, 'parsed to:', parsedFromVersion);
      return res.status(400).json({ error: 'Invalid fromVersion number' });
    }
    
    if (isNaN(parsedToVersion) || parsedToVersion < 1) {
      console.log('Invalid toVersion:', toVersion, 'parsed to:', parsedToVersion);
      return res.status(400).json({ error: 'Invalid toVersion number' });
    }

    // Verify file ownership
    const yamlFile = await YamlFile.findOne({ _id: fileId, owner: userId });
    if (!yamlFile) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Get content for both versions
    const fromContent = await reconstructContentAtVersion(fileId, parsedFromVersion);
    const toContent = await reconstructContentAtVersion(fileId, parsedToVersion);

    // Calculate delta between versions
    const delta = calculateDelta(fromContent, toContent);
    const changeStats = calculateChangeStats(delta);
    const summary = generateChangeSummary(delta, fromContent, toContent);

    // Get version metadata
    const fromVersionData = await VersionHistory.findOne({ 
      fileId, 
      version: parsedFromVersion 
    }).populate('author', 'username email');

    const toVersionData = await VersionHistory.findOne({ 
      fileId, 
      version: parsedToVersion 
    }).populate('author', 'username email');

    // Check if both versions exist
    if (!fromVersionData) {
      return res.status(404).json({ error: `Version ${parsedFromVersion} not found` });
    }

    if (!toVersionData) {
      return res.status(404).json({ error: `Version ${parsedToVersion} not found` });
    }

    res.json({
      comparison: {
        fromVersion: fromVersionData,
        toVersion: toVersionData,
        delta,
        changeStats,
        summary,
        fromContent,
        toContent
      }
    });

  } catch (error) {
    console.error('Compare versions error:', error);
    res.status(500).json({ error: 'Failed to compare versions' });
  }
};

/**
 * Delete version history (admin only or for cleanup)
 */
export const cleanupVersionHistory = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { keepVersions = 50 } = req.body;
    const userId = req.user._id;

    // Verify file ownership
    const yamlFile = await YamlFile.findOne({ _id: fileId, owner: userId });
    if (!yamlFile) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    // Keep the latest N versions and all snapshots
    const versionsToDelete = await VersionHistory.find({ fileId })
      .sort({ version: -1 })
      .skip(parseInt(keepVersions))
      .select('_id version isSnapshot')
      .lean();

    // Filter out snapshots (we want to keep them)
    const deletableVersions = versionsToDelete
      .filter(v => !v.isSnapshot)
      .map(v => v._id);

    if (deletableVersions.length > 0) {
      await VersionHistory.deleteMany({ _id: { $in: deletableVersions } });
    }

    res.json({
      success: true,
      deletedVersions: deletableVersions.length,
      keptVersions: parseInt(keepVersions)
    });

  } catch (error) {
    console.error('Cleanup version history error:', error);
    res.status(500).json({ error: 'Failed to cleanup version history' });
  }
};

/**
 * Helper function to reconstruct content at a specific version
 */
async function reconstructContentAtVersion(fileId, targetVersion) {
  try {
    // Find the most recent snapshot at or before the target version
    const snapshot = await VersionHistory.findOne({
      fileId,
      version: { $lte: targetVersion },
      isSnapshot: true
    }).sort({ version: -1 });

    let baseContent = '';
    let startVersion = 1;

    if (snapshot) {
      baseContent = snapshot.snapshotContent;
      startVersion = snapshot.version + 1;
    }

    // Get all deltas from the snapshot (or beginning) to the target version
    const deltas = await VersionHistory.find({
      fileId,
      version: { $gte: startVersion, $lte: targetVersion },
      isSnapshot: false
    }).sort({ version: 1 }).select('delta version');

    // Apply deltas in sequence
    let content = baseContent;
    for (const versionData of deltas) {
      if (versionData.delta && versionData.delta.length > 0) {
        content = applyDelta(content, versionData.delta);
      }
    }

    return content;
  } catch (error) {
    console.error('Error in reconstructContentAtVersion:', error);
    throw error;
  }
}

/**
 * Internal helper for creating versions
 */
async function createVersionInternal(fileId, content, userId, message, saveType) {
  try {
    const latestVersion = await VersionHistory.getLatestVersion(fileId);
    const newVersionNumber = latestVersion + 1;

    let previousContent = '';
    if (latestVersion > 0) {
      previousContent = await reconstructContentAtVersion(fileId, latestVersion);
    }

    const delta = calculateDelta(previousContent, content);
    const changeStats = calculateChangeStats(delta);
    const summary = generateChangeSummary(delta, previousContent, content);

    const shouldSnapshot = shouldCreateSnapshot(newVersionNumber, delta.length);
    
    const versionData = {
      fileId,
      version: newVersionNumber,
      delta: shouldSnapshot ? [] : delta,
      isSnapshot: shouldSnapshot,
      snapshotContent: shouldSnapshot ? content : null,
      author: userId,
      message: message || '',
      changeMetadata: {
        summary,
        linesChanged: {
          added: changeStats.linesAdded,
          removed: changeStats.linesRemoved,
          modified: Math.max(changeStats.linesAdded, changeStats.linesRemoved)
        },
        characterDelta: changeStats.characterDelta,
        saveType
      },
      deltaSize: delta.length
    };

    const version = await VersionHistory.create(versionData);
    await version.populate('author', 'username email');
    
    return { version, changeStats, isSnapshot: shouldSnapshot };
  } catch (error) {
    console.error('createVersionInternal error:', error);
    throw error;
  }
}