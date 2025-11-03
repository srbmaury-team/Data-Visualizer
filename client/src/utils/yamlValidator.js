/**
 * YAML Validator Utility
 * Checks for common issues in YAML structure
 */
import yaml from 'js-yaml';

export function validateYAML(yamlText) {
  const issues = [];
  const warnings = [];
  
  // First, try to parse the YAML to catch syntax errors
  try {
    yaml.load(yamlText);
  } catch (parseError) {
    // YAML parsing failed - this is a critical error
    const lineMatch = parseError.message.match(/at line (\d+)/);
    const lineNumber = lineMatch ? parseInt(lineMatch[1]) : 1;
    
    issues.push({
      line: lineNumber,
      type: 'YAML Syntax Error',
      message: parseError.message,
      suggestion: 'Fix the YAML syntax error'
    });
    
    // Return early if YAML can't be parsed
    return {
      valid: false,
      issues,
      warnings,
      stats: {
        totalLines: yamlText.split('\n').length,
        nonEmptyLines: yamlText.split('\n').filter(l => l.trim().length > 0).length,
        commentLines: yamlText.split('\n').filter(l => l.trim().startsWith('#')).length
      }
    };
  }
  
  const lines = yamlText.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Check for common typos in 'children' keyword
    const childrenTypos = ['childern', 'childre', 'chlidren', 'childrem', 'chilren'];
    childrenTypos.forEach(typo => {
      const regex = new RegExp(`^${typo}\\s*:`, 'i');
      if (trimmed.match(regex)) {
        issues.push({
          line: lineNum,
          type: 'error',
          message: `Typo: "${typo}" should be "children"`,
          suggestion: line.replace(new RegExp(typo, 'gi'), 'children')
        });
      }
    });
    
    // Check for inconsistent indentation
    if (line.length > 0 && line[0] === ' ') {
      const spaces = line.match(/^ */)[0].length;
      if (spaces % 2 !== 0) {
        warnings.push({
          line: lineNum,
          type: 'warning',
          message: 'Inconsistent indentation (should be multiples of 2 spaces)',
          suggestion: `Expected even number of spaces, found ${spaces}`
        });
      }
    }
    
    // Check for tabs (YAML doesn't support tabs)
    if (line.includes('\t')) {
      issues.push({
        line: lineNum,
        type: 'error',
        message: 'YAML does not support tabs for indentation',
        suggestion: 'Replace tabs with spaces'
      });
    }
    
    // Check for missing colons after keys
    if (trimmed.match(/^-?\s*\w+\s*$/) && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      if (index + 1 < lines.length && lines[index + 1].trim().startsWith('-')) {
        warnings.push({
          line: lineNum,
          type: 'warning',
          message: 'Possible missing colon after key',
          suggestion: `Did you mean "${trimmed}:"?`
        });
      }
    }
    
    // Check for duplicate 'name' keys at the same level
    if (trimmed.startsWith('name:')) {
      const indent = line.match(/^ */)[0].length;
      // Check next few lines for duplicate
      for (let i = index + 1; i < Math.min(index + 10, lines.length); i++) {
        const nextLine = lines[i];
        const nextIndent = nextLine.match(/^ */)[0].length;
        if (nextIndent < indent) break;
        if (nextIndent === indent && nextLine.trim().startsWith('name:')) {
          warnings.push({
            line: lineNum,
            type: 'warning',
            message: 'Possible duplicate "name" key at the same level',
            suggestion: 'Each item in a list should have unique keys or be properly nested'
          });
          break;
        }
      }
    }
    
    // Check for common property name typos
    const commonTypos = {
      'chilren': 'children',
      'childre': 'children',
      'chlidren': 'children',
      'propertys': 'properties',
      'porperties': 'properties'
    };
    
    Object.entries(commonTypos).forEach(([typo, correct]) => {
      const regex = new RegExp(`\\b${typo}\\s*:`, 'i');
      if (trimmed.match(regex)) {
        issues.push({
          line: lineNum,
          type: 'error',
          message: `Typo: "${typo}" should be "${correct}"`,
          suggestion: line.replace(new RegExp(typo, 'gi'), correct)
        });
      }
    });
  });
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    stats: {
      totalLines: lines.length,
      nonEmptyLines: lines.filter(l => l.trim().length > 0).length,
      commentLines: lines.filter(l => l.trim().startsWith('#')).length
    }
  };
}

export function analyzeYAMLStructure(parsedData) {
  const analysis = {
    maxDepth: 0,
    totalNodes: 0,
    nodesByDepth: {},
    longestName: '',
    mostProperties: 0,
    hasCircularRef: false
  };
  
  function traverse(node, depth = 0, visited = new Set()) {
    if (!node) return;
    
    analysis.totalNodes++;
    analysis.maxDepth = Math.max(analysis.maxDepth, depth);
    
    if (!analysis.nodesByDepth[depth]) {
      analysis.nodesByDepth[depth] = 0;
    }
    analysis.nodesByDepth[depth]++;
    
    const nodeName = node.name || '';
    if (nodeName.length > analysis.longestName.length) {
      analysis.longestName = nodeName;
    }
    
    const propCount = Object.keys(node.properties || {}).length;
    analysis.mostProperties = Math.max(analysis.mostProperties, propCount);
    
    // Check for circular references
    const nodeId = JSON.stringify(node);
    if (visited.has(nodeId)) {
      analysis.hasCircularRef = true;
      return;
    }
    visited.add(nodeId);
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => traverse(child, depth + 1, new Set(visited)));
    }
  }
  
  traverse(parsedData);
  
  return analysis;
}

