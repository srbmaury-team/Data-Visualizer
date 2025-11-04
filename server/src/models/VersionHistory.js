import mongoose from 'mongoose';

const versionHistorySchema = new mongoose.Schema({
  // Reference to the YAML file this version belongs to
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YamlFile',
    required: true,
    index: true
  },
  
  // Version number (incremental)
  version: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Delta operations (using operational transformation)
  delta: {
    type: [{
      // Operation type: 'insert', 'delete', 'retain'
      op: {
        type: String,
        enum: ['insert', 'delete', 'retain'],
        required: true
      },
      // Number of characters to retain/delete, or string to insert
      data: mongoose.Schema.Types.Mixed,
      // Position in the document
      position: {
        type: Number,
        default: 0
      }
    }],
    default: []
  },
  
  // Snapshot every Nth version for performance (optional)
  isSnapshot: {
    type: Boolean,
    default: false
  },
  
  // Full content if this is a snapshot
  snapshotContent: {
    type: String,
    default: null
  },
  
  // Metadata about the change
  changeMetadata: {
    // Brief description of what changed
    summary: {
      type: String,
      maxlength: 500
    },
    // Lines affected
    linesChanged: {
      added: { type: Number, default: 0 },
      removed: { type: Number, default: 0 },
      modified: { type: Number, default: 0 }
    },
    // Character count changes
    characterDelta: {
      type: Number,
      default: 0
    },
    // Auto-generated or manual save
    saveType: {
      type: String,
      enum: ['auto', 'manual', 'initial'],
      default: 'manual'
    }
  },
  
  // User who made this change
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Optional commit message
  message: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  
  // Size of the delta for optimization queries
  deltaSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false // We're using custom createdAt
});

// Compound index for efficient queries
versionHistorySchema.index({ fileId: 1, version: 1 }, { unique: true });
versionHistorySchema.index({ fileId: 1, createdAt: -1 });
versionHistorySchema.index({ author: 1, createdAt: -1 });

// Virtual for getting the previous version
versionHistorySchema.virtual('previousVersion').get(function() {
  return this.version - 1;
});

// Method to get change statistics
versionHistorySchema.methods.getChangeStats = function() {
  const stats = {
    insertions: 0,
    deletions: 0,
    totalOps: this.delta.length
  };
  
  this.delta.forEach(op => {
    if (op.op === 'insert') {
      stats.insertions += typeof op.data === 'string' ? op.data.length : 1;
    } else if (op.op === 'delete') {
      stats.deletions += op.data || 1;
    }
  });
  
  return stats;
};

// Static method to get version history for a file
versionHistorySchema.statics.getFileHistory = function(fileId, limit = 20, offset = 0) {
  return this.find({ fileId })
    .sort({ version: -1 })
    .limit(limit)
    .skip(offset)
    .populate('author', 'username email')
    .lean();
};

// Static method to get latest version number for a file
versionHistorySchema.statics.getLatestVersion = async function(fileId) {
  const latest = await this.findOne({ fileId })
    .sort({ version: -1 })
    .select('version')
    .lean();
  
  return latest ? latest.version : 0;
};

// Static method to create snapshot
versionHistorySchema.statics.createSnapshot = function(fileId, content, author, version) {
  return this.create({
    fileId,
    version,
    delta: [],
    isSnapshot: true,
    snapshotContent: content,
    author,
    changeMetadata: {
      summary: 'Snapshot created',
      saveType: 'auto'
    },
    deltaSize: 0
  });
};

const VersionHistory = mongoose.model('VersionHistory', versionHistorySchema);

export default VersionHistory;