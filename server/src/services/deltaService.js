/**
 * Delta calculation service for version history
 * Implements a simplified operational transformation for text differences
 */

/**
 * Calculate the difference between two strings as delta operations
 * @param {string} oldText - Original text
 * @param {string} newText - New text
 * @returns {Array} Array of delta operations
 */
export function calculateDelta(oldText, newText) {
  if (oldText === newText) {
    return [];
  }
  
  // Use Myers' diff algorithm (simplified version)
  const operations = diffText(oldText || '', newText || '');
  return optimizeDelta(operations);
}

/**
 * Apply delta operations to reconstruct text
 * @param {string} baseText - Base text to apply delta to
 * @param {Array} delta - Array of delta operations
 * @returns {string} Resulting text after applying delta
 */
export function applyDelta(baseText, delta) {
  let result = baseText || '';
  let offset = 0;
  
  for (const op of delta) {
    switch (op.op) {
      case 'retain':
        offset += op.data;
        break;
        
      case 'insert':
        result = result.slice(0, offset) + op.data + result.slice(offset);
        offset += op.data.length;
        break;
        
      case 'delete':
        result = result.slice(0, offset) + result.slice(offset + op.data);
        break;
    }
  }
  
  return result;
}

/**
 * Reconstruct content from a series of deltas
 * @param {string} baseContent - Starting content (snapshot)
 * @param {Array} deltas - Array of delta operations in chronological order
 * @returns {string} Final reconstructed content
 */
export function reconstructFromDeltas(baseContent, deltas) {
  let content = baseContent || '';
  
  for (const delta of deltas) {
    content = applyDelta(content, delta);
  }
  
  return content;
}

/**
 * Calculate change statistics from delta
 * @param {Array} delta - Delta operations
 * @returns {Object} Statistics about the change
 */
export function calculateChangeStats(delta) {
  const stats = {
    insertions: 0,
    deletions: 0,
    retentions: 0,
    linesAdded: 0,
    linesRemoved: 0,
    characterDelta: 0
  };
  
  for (const op of delta) {
    switch (op.op) {
      case 'insert':
        stats.insertions += op.data.length;
        stats.linesAdded += (op.data.match(/\n/g) || []).length;
        stats.characterDelta += op.data.length;
        break;
        
      case 'delete':
        stats.deletions += op.data;
        stats.characterDelta -= op.data;
        break;
        
      case 'retain':
        stats.retentions += op.data;
        break;
    }
  }
  
  return stats;
}

/**
 * Generate a human-readable summary of changes
 * @param {Array} delta - Delta operations
 * @param {string} oldText - Original text for context
 * @param {string} newText - New text for context
 * @returns {string} Human-readable change summary
 */
export function generateChangeSummary(delta, oldText = '', newText = '') {
  const stats = calculateChangeStats(delta);
  
  if (stats.insertions === 0 && stats.deletions === 0) {
    return 'No changes';
  }
  
  const parts = [];
  
  if (stats.linesAdded > 0) {
    parts.push(`+${stats.linesAdded} line${stats.linesAdded === 1 ? '' : 's'}`);
  }
  
  if (stats.linesRemoved > 0) {
    parts.push(`-${stats.linesRemoved} line${stats.linesRemoved === 1 ? '' : 's'}`);
  }
  
  if (stats.insertions > 0 && stats.linesAdded === 0) {
    parts.push(`+${stats.insertions} char${stats.insertions === 1 ? '' : 's'}`);
  }
  
  if (stats.deletions > 0 && stats.linesRemoved === 0) {
    parts.push(`-${stats.deletions} char${stats.deletions === 1 ? '' : 's'}`);
  }
  
  return parts.join(', ') || 'Content modified';
}

/**
 * Simplified Myers' diff algorithm
 * @param {string} oldText 
 * @param {string} newText 
 * @returns {Array} Array of operations
 */
function diffText(oldText, newText) {
  const operations = [];
  
  // For simplicity, we'll use a character-by-character diff
  // In production, you might want to use a more sophisticated algorithm
  // or a library like 'fast-diff' or 'diff'
  
  let i = 0, j = 0;
  
  while (i < oldText.length || j < newText.length) {
    if (i >= oldText.length) {
      // Insert remaining characters from new text
      operations.push({
        op: 'insert',
        data: newText.slice(j),
        position: i
      });
      break;
    }
    
    if (j >= newText.length) {
      // Delete remaining characters from old text
      operations.push({
        op: 'delete',
        data: oldText.length - i,
        position: i
      });
      break;
    }
    
    if (oldText[i] === newText[j]) {
      // Characters match, find how many consecutive characters match
      let matchLength = 0;
      while (i + matchLength < oldText.length && 
             j + matchLength < newText.length && 
             oldText[i + matchLength] === newText[j + matchLength]) {
        matchLength++;
      }
      
      if (matchLength > 0) {
        operations.push({
          op: 'retain',
          data: matchLength,
          position: i
        });
        i += matchLength;
        j += matchLength;
      }
    } else {
      // Characters don't match, find the best strategy
      // Look ahead to find next match
      const nextMatch = findNextMatch(oldText, newText, i, j);
      
      if (nextMatch.oldIndex > i && nextMatch.newIndex > j) {
        // Both deletion and insertion needed
        if (nextMatch.oldIndex - i <= nextMatch.newIndex - j) {
          // More insertions than deletions
          operations.push({
            op: 'delete',
            data: nextMatch.oldIndex - i,
            position: i
          });
          i = nextMatch.oldIndex;
        } else {
          // More deletions than insertions
          operations.push({
            op: 'insert',
            data: newText.slice(j, nextMatch.newIndex),
            position: i
          });
          j = nextMatch.newIndex;
        }
      } else if (nextMatch.oldIndex > i) {
        // Only deletion needed
        operations.push({
          op: 'delete',
          data: nextMatch.oldIndex - i,
          position: i
        });
        i = nextMatch.oldIndex;
      } else if (nextMatch.newIndex > j) {
        // Only insertion needed
        operations.push({
          op: 'insert',
          data: newText.slice(j, nextMatch.newIndex),
          position: i
        });
        j = nextMatch.newIndex;
      } else {
        // No match found, insert one character and continue
        operations.push({
          op: 'insert',
          data: newText[j],
          position: i
        });
        j++;
      }
    }
  }
  
  return operations;
}

/**
 * Find the next matching character sequence
 * @param {string} oldText 
 * @param {string} newText 
 * @param {number} oldStart 
 * @param {number} newStart 
 * @returns {Object} Next match indices
 */
function findNextMatch(oldText, newText, oldStart, newStart) {
  const searchLength = Math.min(50, Math.min(oldText.length - oldStart, newText.length - newStart));
  
  for (let len = 3; len <= searchLength; len++) {
    for (let i = oldStart; i <= oldText.length - len; i++) {
      const substring = oldText.slice(i, i + len);
      const newIndex = newText.indexOf(substring, newStart);
      
      if (newIndex !== -1) {
        return { oldIndex: i, newIndex };
      }
    }
  }
  
  // No significant match found
  return { oldIndex: oldText.length, newIndex: newText.length };
}

/**
 * Optimize delta by merging consecutive operations of the same type
 * @param {Array} operations 
 * @returns {Array} Optimized operations
 */
function optimizeDelta(operations) {
  if (operations.length === 0) return [];
  
  const optimized = [];
  let current = operations[0];
  
  for (let i = 1; i < operations.length; i++) {
    const next = operations[i];
    
    // Merge consecutive operations of the same type
    if (current.op === next.op) {
      if (current.op === 'retain' || current.op === 'delete') {
        current.data += next.data;
      } else if (current.op === 'insert') {
        current.data += next.data;
      }
    } else {
      optimized.push(current);
      current = next;
    }
  }
  
  optimized.push(current);
  
  // Remove empty operations
  return optimized.filter(op => {
    if (op.op === 'retain' || op.op === 'delete') {
      return op.data > 0;
    }
    if (op.op === 'insert') {
      return op.data.length > 0;
    }
    return true;
  });
}

/**
 * Check if we should create a snapshot based on delta history
 * @param {number} versionCount - Current version count
 * @param {number} totalDeltaSize - Total size of all deltas
 * @returns {boolean} Whether to create a snapshot
 */
export function shouldCreateSnapshot(versionCount, totalDeltaSize) {
  // Create snapshot every 10 versions or when deltas get too large
  return versionCount % 10 === 0 || totalDeltaSize > 50000;
}