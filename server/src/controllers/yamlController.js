import { validationResult } from 'express-validator';
import YamlFile from '../models/YamlFile.js';
import VersionHistory from '../models/VersionHistory.js';
import User from '../models/User.js';
import { calculateChangeStats, generateChangeSummary, calculateDelta, shouldCreateSnapshot } from '../services/deltaService.js';

export const createYamlFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, description, isPublic = false, tags = [], metadata = {} } = req.body;

    const yamlFile = new YamlFile({
      title,
      content,
      description,
      owner: req.user._id,
      isPublic,
      tags: tags.slice(0, 10), // Limit to 10 tags
      metadata,
      currentVersion: 1
    });

    await yamlFile.save();

    // Create initial version history entry as a snapshot
    await VersionHistory.create({
      fileId: yamlFile._id,
      version: 1,
      delta: [],
      isSnapshot: true,
      snapshotContent: content,
      author: req.user._id,
      message: 'Initial version',
      changeMetadata: {
        summary: 'Initial file creation',
        linesChanged: {
          added: (content.match(/\n/g) || []).length + 1,
          removed: 0,
          modified: 0
        },
        characterDelta: content.length,
        saveType: 'initial'
      },
      deltaSize: 0
    });

    // Add to user's yamlFiles array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { yamlFiles: yamlFile._id } }
    );

    res.status(201).json({
      message: 'YAML file saved successfully',
      yamlFile: {
        id: yamlFile._id,
        title: yamlFile.title,
        shareId: yamlFile.shareId,
        isPublic: yamlFile.isPublic,
        createdAt: yamlFile.createdAt,
        currentVersion: yamlFile.currentVersion
      }
    });
  } catch (error) {
    console.error('Save YAML error:', error);
    res.status(500).json({ error: 'Server error while saving YAML file' });
  }
};

export const getUserYamlFiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { owner: req.user._id };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const yamlFiles = await YamlFile.find(query)
      .select('-versions') // Exclude versions but include content for preview
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add content preview to each file (first 200 characters)
    const filesWithPreview = yamlFiles.map(file => {
      const fileObj = file.toObject();
      if (fileObj.content) {
        fileObj.contentPreview = fileObj.content.substring(0, 200);
        // Keep full content for now, frontend can handle truncation
        // delete fileObj.content; // Remove full content to reduce payload
      }
      return fileObj;
    });

    const total = await YamlFile.countDocuments(query);

    res.json({
      yamlFiles: filesWithPreview,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get YAML files error:', error);
    res.status(500).json({ error: 'Server error while fetching YAML files' });
  }
};

export const getYamlFileById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: errors.array()
      });
    }

    // Additional check for valid ObjectId format
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid file ID format. Must be a valid MongoDB ObjectId.'
      });
    }

    const yamlFile = await YamlFile.findOne({
      _id: id,
      owner: req.user._id
    });

    if (!yamlFile) {
      return res.status(404).json({ 
        error: 'YAML file not found or you do not have permission to access it.'
      });
    }

    res.json({ yamlFile });
  } catch (error) {
    console.error('Get YAML file error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ 
        error: 'Invalid file ID format. Must be a valid MongoDB ObjectId.'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error while fetching YAML file',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getSharedYamlFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: errors.array()
      });
    }

    const { shareId } = req.params;
    
    // Validate shareId format (should be 10 characters)
    if (!shareId || shareId.length !== 10) {
      return res.status(400).json({ 
        error: 'Invalid share ID format. Must be a 10-character string.'
      });
    }

    const yamlFile = await YamlFile.findOne({ shareId })
      .populate('owner', 'username')
      .select('-versions'); // Exclude versions for public access

    if (!yamlFile) {
      return res.status(404).json({ 
        error: 'Shared file not found or has been removed.'
      });
    }

    // Check if file is public or user is owner
    if (!yamlFile.isPublic && (!req.user || yamlFile.owner._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ 
        error: 'Access denied. This file is private and you do not have permission to access it.'
      });
    }

    // Increment view count (don't await to not slow down response)
    yamlFile.incrementViews().catch(console.error);

    res.json({ yamlFile });
  } catch (error) {
    console.error('Get shared YAML file error:', error);
    res.status(500).json({ 
      error: 'Server error while fetching shared file',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const updateYamlFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, description, isPublic, tags, metadata, versionDescription } = req.body;

    const yamlFile = await YamlFile.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!yamlFile) {
      return res.status(404).json({ error: 'YAML file not found' });
    }

    // If content is being updated, create a new version using the new version history system
    if (content && content !== yamlFile.content) {
      // Get the latest version number
      const latestVersion = await VersionHistory.getLatestVersion(yamlFile._id);
      const newVersionNumber = latestVersion + 1;

      // Get the previous content for delta calculation
      let previousContent = yamlFile.content || '';

      // Calculate delta
      const delta = calculateDelta(previousContent, content);
      const changeStats = calculateChangeStats(delta);
      const summary = generateChangeSummary(delta, previousContent, content);

      // Check if we should create a snapshot
      const shouldSnapshot = shouldCreateSnapshot(newVersionNumber, delta.length);
      
      // Create version record
      const versionData = {
        fileId: yamlFile._id,
        version: newVersionNumber,
        delta: shouldSnapshot ? [] : delta,
        isSnapshot: shouldSnapshot,
        snapshotContent: shouldSnapshot ? content : null,
        author: req.user._id,
        message: versionDescription || '',
        changeMetadata: {
          summary,
          linesChanged: {
            added: changeStats.linesAdded,
            removed: changeStats.linesRemoved,
            modified: Math.max(changeStats.linesAdded, changeStats.linesRemoved)
          },
          characterDelta: changeStats.characterDelta,
          saveType: 'manual'
        },
        deltaSize: delta.length
      };

      await VersionHistory.create(versionData);

      // Update the main file's content and version
      yamlFile.content = content;
      yamlFile.currentVersion = newVersionNumber;
      yamlFile.updatedAt = new Date();
    }

    // Update other fields
    if (title) yamlFile.title = title;
    if (description !== undefined) yamlFile.description = description;
    if (isPublic !== undefined) yamlFile.isPublic = isPublic;
    if (tags) yamlFile.tags = tags.slice(0, 10);
    if (metadata) yamlFile.metadata = { ...yamlFile.metadata, ...metadata };
    
    await yamlFile.save();

    res.json({
      message: 'YAML file updated successfully',
      yamlFile: {
        id: yamlFile._id,
        title: yamlFile.title,
        shareId: yamlFile.shareId,
        isPublic: yamlFile.isPublic,
        createdAt: yamlFile.createdAt,
        updatedAt: yamlFile.updatedAt,
        currentVersion: yamlFile.currentVersion
      }
    });
  } catch (error) {
    console.error('Update YAML file error:', error);
    res.status(500).json({ error: 'Server error while updating YAML file' });
  }
};

export const deleteYamlFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const yamlFile = await YamlFile.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!yamlFile) {
      return res.status(404).json({ error: 'YAML file not found' });
    }

    // Remove from user's yamlFiles array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { yamlFiles: req.params.id } }
    );

    res.json({ message: 'YAML file deleted successfully' });
  } catch (error) {
    console.error('Delete YAML file error:', error);
    res.status(500).json({ error: 'Server error while deleting YAML file' });
  }
};

export const getPublicYamlFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {
      createdAt: { createdAt: -1 },
      views: { views: -1 },
      title: { title: 1 }
    };

    const yamlFiles = await YamlFile.find(query)
      .populate('owner', 'username')
      .select('-content -versions') // Exclude heavy fields
      .sort(sortOptions[sortBy] || { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await YamlFile.countDocuments(query);

    res.json({
      yamlFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Browse public YAML files error:', error);
    res.status(500).json({ error: 'Server error while browsing public files' });
  }
};