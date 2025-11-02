import { validationResult } from 'express-validator';
import YamlFile from '../models/YamlFile.js';
import User from '../models/User.js';

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
      metadata
    });

    await yamlFile.save();

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
        createdAt: yamlFile.createdAt
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
      return res.status(400).json({ errors: errors.array() });
    }

    const yamlFile = await YamlFile.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!yamlFile) {
      return res.status(404).json({ error: 'YAML file not found' });
    }

    res.json({ yamlFile });
  } catch (error) {
    console.error('Get YAML file error:', error);
    res.status(500).json({ error: 'Server error while fetching YAML file' });
  }
};

export const getSharedYamlFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const yamlFile = await YamlFile.findOne({ shareId: req.params.shareId })
      .populate('owner', 'username')
      .select('-versions'); // Exclude versions for public access

    if (!yamlFile) {
      return res.status(404).json({ error: 'Shared file not found' });
    }

    // Check if file is public or user is owner
    if (!yamlFile.isPublic && (!req.user || yamlFile.owner._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied to private file' });
    }

    // Increment view count (don't await to not slow down response)
    yamlFile.incrementViews().catch(console.error);

    res.json({ yamlFile });
  } catch (error) {
    console.error('Get shared YAML file error:', error);
    res.status(500).json({ error: 'Server error while fetching shared file' });
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

    // If content is being updated, save as version
    if (content && content !== yamlFile.content) {
      await yamlFile.addVersion(content, versionDescription);
    } else {
      // Update other fields
      if (title) yamlFile.title = title;
      if (description !== undefined) yamlFile.description = description;
      if (isPublic !== undefined) yamlFile.isPublic = isPublic;
      if (tags) yamlFile.tags = tags.slice(0, 10);
      if (metadata) yamlFile.metadata = { ...yamlFile.metadata, ...metadata };
      
      await yamlFile.save();
    }

    res.json({
      message: 'YAML file updated successfully',
      yamlFile: {
        id: yamlFile._id,
        title: yamlFile.title,
        shareId: yamlFile.shareId,
        isPublic: yamlFile.isPublic,
        createdAt: yamlFile.createdAt,
        updatedAt: yamlFile.updatedAt
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