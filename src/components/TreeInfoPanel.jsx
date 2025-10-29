import React, { useState } from "react";
import "./TreeInfoPanel.css";

export default function TreeInfoPanel({ treeInfo }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!treeInfo) return null;

  return (
    <div className={`tree-info-panel ${isExpanded ? "expanded" : "collapsed"}`}>
      <button 
        className="panel-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? "Hide tree structure" : "Show tree structure"}
      >
        {isExpanded ? "◀" : "▶"} Tree Structure
      </button>
      
      {isExpanded && (
        <div className="panel-content">
          <div className="info-section">
            <h3>📊 Overview</h3>
            <div className="info-item">
              <span className="label">Total Nodes:</span>
              <span className="value">{treeInfo.totalNodes}</span>
            </div>
            <div className="info-item">
              <span className="label">Total Edges:</span>
              <span className="value">{treeInfo.totalEdges}</span>
            </div>
            <div className="info-item">
              <span className="label">Max Depth:</span>
              <span className="value">{treeInfo.maxDepth + 1} levels</span>
            </div>
          </div>

          <div className="info-section">
            <h3>🌳 Nodes per Level</h3>
            {treeInfo.nodesPerLevel.map(({ level, count, nodes }) => (
              <div key={level} className="level-info">
                <div className="level-header">
                  <span className="level-badge">Level {level}</span>
                  <span className="node-count">{count} node{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="node-list">
                  {nodes.map((nodeName, idx) => (
                    <span key={idx} className="node-tag">
                      {nodeName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="info-section">
            <h3>💡 Tips</h3>
            <ul className="tips-list">
              <li>Click nodes to expand/collapse children</li>
              <li>Scroll to zoom in/out (0.1x - 3x)</li>
              <li>Drag to pan around the canvas</li>
              <li>Nodes auto-size based on content</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

