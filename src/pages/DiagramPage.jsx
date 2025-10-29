import React from "react";
import { useNavigate } from "react-router-dom";
import DiagramViewer from "../components/DiagramViewer";

export default function DiagramPage({ parsedData, treeInfo }) {
  const navigate = useNavigate();

  return (
    <div className="diagram-container">
      <div className="diagram-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Editor
        </button>
        <h2>Interactive Diagram View</h2>
        <div className="hint">
          💡 Scroll to zoom • Drag to pan • Click nodes to expand/collapse
        </div>
        {treeInfo && (
          <div className="tree-info">
            📊 Nodes: {treeInfo.totalNodes} | Levels: {treeInfo.maxDepth + 1} | Edges: {treeInfo.totalEdges}
          </div>
        )}
      </div>
      <DiagramViewer data={parsedData} treeInfo={treeInfo} />
    </div>
  );
}