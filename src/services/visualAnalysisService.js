/**
 * Visual Analysis Service
 * Analyzes tree visualization structure and provides AI-powered insights
 */

export class VisualAnalysisService {
  /**
   * Analyzes the visual structure of a tree for AI insights
   * @param {Object} treeData - The tree data structure
   * @returns {Object} Visual analysis results with metrics and insights
   */
  static analyzeTreeVisualization(treeData) {
    if (!treeData || typeof treeData !== 'object') {
      return {
        metrics: {},
        insights: [],
        issues: [],
        recommendations: []
      };
    }

    const metrics = this.calculateTreeMetrics(treeData);
    const insights = this.generateVisualInsights(metrics, treeData);
    const issues = this.identifyStructuralIssues(metrics, treeData);
    const recommendations = this.generateRestructuringRecommendations(metrics, issues, treeData);
    const highlights = this.identifyHighlightNodes(treeData, metrics, issues);

    return {
      metrics,
      insights,
      issues,
      recommendations,
      highlights,
      summary: this.generateVisualSummary(metrics, insights, issues)
    };
  }

  /**
   * Calculate comprehensive tree visualization metrics
   */
  static calculateTreeMetrics(treeData) {
    const metrics = {
      totalNodes: 0,
      maxDepth: 0,
      averageDepth: 0,
      branchingFactor: 0,
      balanceRatio: 0,
      leafNodes: 0,
      intermediateNodes: 0,
      wideNodes: 0, // Nodes with many children
      deepBranches: 0, // Branches deeper than average
      leftHeavy: false,
      rightHeavy: false,
      depthDistribution: new Map(),
      nodeWidthDistribution: new Map(),
      asymmetryScore: 0
    };

    // Calculate basic metrics
    this.traverseForMetrics(treeData, 0, metrics);
    
    // Calculate derived metrics
    metrics.averageDepth = metrics.totalNodes > 0 ? 
      Array.from(metrics.depthDistribution.entries())
        .reduce((sum, [depth, count]) => sum + (depth * count), 0) / metrics.totalNodes : 0;
    
    metrics.branchingFactor = metrics.intermediateNodes > 0 ? 
      (metrics.totalNodes - 1) / metrics.intermediateNodes : 0;
    
    // Calculate balance and asymmetry
    this.calculateBalanceMetrics(treeData, metrics);
    
    return metrics;
  }

  /**
   * Traverse tree to collect basic metrics
   */
  static traverseForMetrics(node, depth, metrics, path = []) {
    if (!node) return;

    metrics.totalNodes++;
    metrics.maxDepth = Math.max(metrics.maxDepth, depth);
    
    // Track depth distribution
    if (!metrics.depthDistribution.has(depth)) {
      metrics.depthDistribution.set(depth, 0);
    }
    metrics.depthDistribution.set(depth, metrics.depthDistribution.get(depth) + 1);

    // Get children - handle both 'children' and 'nodes' properties
    const children = this.getNodeChildren(node);
    const childCount = children.length;

    // Track node width distribution
    if (!metrics.nodeWidthDistribution.has(childCount)) {
      metrics.nodeWidthDistribution.set(childCount, 0);
    }
    metrics.nodeWidthDistribution.set(childCount, metrics.nodeWidthDistribution.get(childCount) + 1);

    if (childCount === 0) {
      metrics.leafNodes++;
    } else {
      metrics.intermediateNodes++;
      if (childCount > 4) {
        metrics.wideNodes++;
      }
    }

    if (depth > metrics.averageDepth + 2) {
      metrics.deepBranches++;
    }

    // Recursively analyze children
    children.forEach((child, index) => {
      this.traverseForMetrics(child, depth + 1, metrics, [...path, index]);
    });
  }

  /**
   * Calculate tree balance and asymmetry metrics
   */
  static calculateBalanceMetrics(treeData, metrics) {
    const children = this.getNodeChildren(treeData);
    if (children.length < 2) {
      metrics.balanceRatio = 1.0;
      return;
    }

    // Calculate subtree sizes
    const subtreeSizes = children.map(child => this.getSubtreeSize(child));
    const maxSubtree = Math.max(...subtreeSizes);
    const minSubtree = Math.min(...subtreeSizes);
    
    metrics.balanceRatio = minSubtree / maxSubtree;
    
    // Calculate left vs right heaviness
    const leftSize = subtreeSizes.slice(0, Math.ceil(subtreeSizes.length / 2))
      .reduce((sum, size) => sum + size, 0);
    const rightSize = subtreeSizes.slice(Math.ceil(subtreeSizes.length / 2))
      .reduce((sum, size) => sum + size, 0);
    
    const totalSize = leftSize + rightSize;
    if (totalSize > 0) {
      const leftRatio = leftSize / totalSize;
      const rightRatio = rightSize / totalSize;
      
      metrics.leftHeavy = leftRatio > 0.7;
      metrics.rightHeavy = rightRatio > 0.7;
      metrics.asymmetryScore = Math.abs(leftRatio - rightRatio);
    }
  }

  /**
   * Get subtree size (total nodes in subtree)
   */
  static getSubtreeSize(node) {
    if (!node) return 0;
    
    const children = this.getNodeChildren(node);
    return 1 + children.reduce((sum, child) => sum + this.getSubtreeSize(child), 0);
  }

  /**
   * Get children from node (handles both 'children' and 'nodes' properties)
   */
  static getNodeChildren(node) {
    if (!node || typeof node !== 'object') return [];
    
    // Handle different ways children might be stored
    if (Array.isArray(node.children)) return node.children;
    if (Array.isArray(node.nodes)) return node.nodes;
    if (Array.isArray(node.childNodes)) return node.childNodes;
    
    // If no array children, look for nested objects
    const children = [];
    Object.entries(node).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
          !['name', 'id', 'properties', 'type', 'value'].includes(key)) {
        children.push(value);
      }
    });
    
    return children;
  }

  /**
   * Generate visual insights from metrics
   */
  static generateVisualInsights(metrics, treeData) {
    const insights = [];

    // Tree size insights
    if (metrics.totalNodes > 100) {
      insights.push({
        type: 'size',
        message: `Large tree with ${metrics.totalNodes} nodes - consider grouping related nodes`,
        severity: 'medium'
      });
    } else if (metrics.totalNodes < 5) {
      insights.push({
        type: 'size',
        message: `Small tree with ${metrics.totalNodes} nodes - plenty of room for expansion`,
        severity: 'low'
      });
    }

    // Depth insights
    if (metrics.maxDepth > 8) {
      insights.push({
        type: 'depth',
        message: `Very deep tree (${metrics.maxDepth} levels) - may be hard to navigate`,
        severity: 'high'
      });
    } else if (metrics.maxDepth < 3) {
      insights.push({
        type: 'depth',
        message: `Shallow tree (${metrics.maxDepth} levels) - good for overview`,
        severity: 'low'
      });
    }

    // Balance insights
    if (metrics.balanceRatio < 0.3) {
      insights.push({
        type: 'balance',
        message: `Unbalanced tree (ratio: ${metrics.balanceRatio.toFixed(2)}) - some branches much larger`,
        severity: 'medium'
      });
    } else if (metrics.balanceRatio > 0.8) {
      insights.push({
        type: 'balance',
        message: `Well-balanced tree (ratio: ${metrics.balanceRatio.toFixed(2)}) - good visual distribution`,
        severity: 'positive'
      });
    }

    // Asymmetry insights
    if (metrics.asymmetryScore > 0.4) {
      const side = metrics.leftHeavy ? 'left' : 'right';
      insights.push({
        type: 'asymmetry',
        message: `Tree is ${side}-heavy - consider redistributing nodes`,
        severity: 'medium'
      });
    }

    // Width insights
    if (metrics.wideNodes > metrics.totalNodes * 0.2) {
      insights.push({
        type: 'width',
        message: `Many nodes have 4+ children - tree may appear cluttered`,
        severity: 'medium'
      });
    }

    return insights;
  }

  /**
   * Identify structural issues in the tree
   */
  static identifyStructuralIssues(metrics, treeData) {
    const issues = [];

    // Critical depth issues
    if (metrics.maxDepth > 10) {
      issues.push({
        type: 'critical',
        category: 'Depth',
        message: 'Excessive tree depth may cause scrolling and navigation issues',
        impact: 'high'
      });
    }

    // Balance issues
    if (metrics.balanceRatio < 0.2) {
      issues.push({
        type: 'warning',
        category: 'Balance',
        message: 'Severely unbalanced tree structure',
        impact: 'medium'
      });
    }

    // Overcrowding issues
    if (metrics.wideNodes > 5) {
      issues.push({
        type: 'warning',
        category: 'Width',
        message: 'Multiple nodes with many children may cause visual clutter',
        impact: 'medium'
      });
    }

    // Efficiency issues
    if (metrics.leafNodes / metrics.totalNodes < 0.3) {
      issues.push({
        type: 'info',
        category: 'Structure',
        message: 'Low leaf-to-total ratio suggests possible over-nesting',
        impact: 'low'
      });
    }

    return issues;
  }

  /**
   * Generate restructuring recommendations
   */
  static generateRestructuringRecommendations(metrics, issues, treeData) {
    const recommendations = [];

    // Depth-based recommendations
    if (metrics.maxDepth > 8) {
      recommendations.push({
        type: 'restructure',
        title: 'Reduce Tree Depth',
        description: 'Consider flattening deep branches by grouping related nodes',
        priority: 'high',
        actionable: true
      });
    }

    // Balance recommendations
    if (metrics.balanceRatio < 0.3) {
      recommendations.push({
        type: 'balance',
        title: 'Rebalance Tree Structure',
        description: 'Move nodes from large branches to smaller ones for better visual balance',
        priority: 'medium',
        actionable: true
      });
    }

    // Width recommendations
    if (metrics.wideNodes > 3) {
      recommendations.push({
        type: 'grouping',
        title: 'Group Related Children',
        description: 'Create intermediate grouping nodes for better organization',
        priority: 'medium',
        actionable: true
      });
    }

    // Performance recommendations
    if (metrics.totalNodes > 200) {
      recommendations.push({
        type: 'performance',
        title: 'Consider Lazy Loading',
        description: 'Large trees may benefit from collapsible sections or pagination',
        priority: 'low',
        actionable: false
      });
    }

    return recommendations;
  }

  /**
   * Generate a visual summary
   */
  static generateVisualSummary(metrics, insights, issues) {
    const criticalIssues = issues.filter(i => i.type === 'critical').length;
    const warnings = issues.filter(i => i.type === 'warning').length;
    
    let healthScore = 100;
    healthScore -= criticalIssues * 30;
    healthScore -= warnings * 15;
    healthScore = Math.max(0, healthScore);

    let healthLevel = 'excellent';
    if (healthScore < 60) healthLevel = 'poor';
    else if (healthScore < 80) healthLevel = 'fair';
    else if (healthScore < 95) healthLevel = 'good';

    return {
      healthScore,
      healthLevel,
      totalInsights: insights.length,
      criticalIssues,
      warnings,
      primaryRecommendation: this.getPrimaryRecommendation(metrics, issues)
    };
  }

  /**
   * Get the most important recommendation
   */
  static getPrimaryRecommendation(metrics, issues) {
    // Prioritize by impact
    const criticalIssue = issues.find(i => i.type === 'critical');
    if (criticalIssue) {
      return `Address ${criticalIssue.category.toLowerCase()}: ${criticalIssue.message}`;
    }

    const highImpactIssue = issues.find(i => i.impact === 'high');
    if (highImpactIssue) {
      return `Improve ${highImpactIssue.category.toLowerCase()}: ${highImpactIssue.message}`;
    }

    // Default positive message
    if (issues.length === 0) {
      return "Tree structure looks good! Consider adding more detailed properties.";
    }

    return "Focus on improving tree balance and organization.";
  }

  /**
   * Identify specific nodes that should be highlighted with issues/insights
   * @param {Object} treeData - The tree data structure
   * @param {Object} metrics - Tree metrics
   * @param {Array} issues - Identified issues
   * @returns {Object} Highlighting data for specific nodes
   */
  static identifyHighlightNodes(treeData, metrics, issues) {
    const highlights = {
      critical: [], // Red highlights - critical issues
      warning: [],  // Yellow highlights - warnings/improvements
      positive: [], // Green highlights - well-structured areas
      info: []      // Blue highlights - informational
    };

    // Helper function to traverse tree and collect node paths
    const traverseAndAnalyze = (node, path = [], depth = 0) => {
      const currentPath = [...path, node.data.name];
      const nodeId = currentPath.join('.');
      
      // Analyze current node
      const childCount = node.children ? node.children.length : 0;
      const isLeaf = childCount === 0;
      const isWide = childCount > 4;
      const isDeep = depth > 4;
      const hasGoodStructure = childCount >= 2 && childCount <= 4 && depth <= 3;
      
      // Critical issues (Red highlights)
      if (isDeep && depth > 5) {
        highlights.critical.push({
          nodeId,
          path: currentPath,
          reason: 'Too deep - consider flattening structure',
          severity: 'critical',
          suggestion: 'Move some children to intermediate levels'
        });
      }
      
      if (isWide && childCount > 6) {
        highlights.critical.push({
          nodeId,
          path: currentPath,
          reason: 'Too many children - overcrowded',
          severity: 'critical',
          suggestion: 'Create intermediate categories'
        });
      }
      
      // Warnings (Yellow highlights)
      if (isWide && childCount > 4 && childCount <= 6) {
        highlights.warning.push({
          nodeId,
          path: currentPath,
          reason: 'Many children - consider grouping',
          severity: 'warning',
          suggestion: 'Group related items together'
        });
      }
      
      if (isDeep && depth > 3 && depth <= 5) {
        highlights.warning.push({
          nodeId,
          path: currentPath,
          reason: 'Deep nesting - impacts readability',
          severity: 'warning',
          suggestion: 'Consider flattening some levels'
        });
      }
      
      // Positive highlights (Green highlights)
      if (hasGoodStructure) {
        highlights.positive.push({
          nodeId,
          path: currentPath,
          reason: 'Well-structured node',
          severity: 'positive',
          suggestion: 'Good balance of children and depth'
        });
      }
      
      // Info highlights (Blue highlights)
      if (isLeaf && depth <= 2) {
        highlights.info.push({
          nodeId,
          path: currentPath,
          reason: 'Potential for expansion',
          severity: 'info',
          suggestion: 'Could add more detailed properties'
        });
      }
      
      // Recursively analyze children
      if (node.children) {
        node.children.forEach(child => {
          traverseAndAnalyze(child, currentPath, depth + 1);
        });
      }
    };

    // Start analysis from root
    if (treeData) {
      traverseAndAnalyze(treeData);
    }

    // Add balance-related highlights
    if (metrics.asymmetryScore > 0.4) {
      // Identify which side is heavier for highlighting
      const rootChildren = treeData.children || [];
      if (rootChildren.length >= 2) {
        const leftSide = rootChildren.slice(0, Math.ceil(rootChildren.length / 2));
        const rightSide = rootChildren.slice(Math.ceil(rootChildren.length / 2));
        
        if (metrics.leftHeavy) {
          leftSide.forEach(child => {
            highlights.warning.push({
              nodeId: `${treeData.data.name}.${child.data.name}`,
              path: [treeData.data.name, child.data.name],
              reason: 'Part of left-heavy imbalance',
              severity: 'warning',
              suggestion: 'Consider moving some items to right side'
            });
          });
        }
      }
    }

    return highlights;
  }
}

export default VisualAnalysisService;