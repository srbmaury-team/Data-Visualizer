import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DiagramViewer from "../components/DiagramViewer";
import { buildTreeFromYAML, convertToD3Hierarchy } from "../utils/treeBuilder";
import yaml from "js-yaml";

export default function DiagramPage({ parsedData: propParsedData, treeInfo: propTreeInfo }) {
  const navigate = useNavigate();
  const [parsedData, setParsedData] = useState(propParsedData);
  const [treeInfo, setTreeInfo] = useState(propTreeInfo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If data is not provided via props, try to load from localStorage
    if (!parsedData || !treeInfo) {
      setLoading(true);
      try {
        const saved = localStorage.getItem('yaml-diagram-data');
        if (saved) {
          const data = JSON.parse(saved);
          const savedYaml = data.yamlText;
          if (savedYaml && savedYaml.trim()) {
            // Parse YAML and generate diagram data
            const yamlData = yaml.load(savedYaml);
            const tree = buildTreeFromYAML(yamlData);
            const hierarchical = convertToD3Hierarchy(tree);

            const info = {
              totalNodes: tree.nodes.length,
              totalEdges: tree.edges.length,
              maxDepth: Math.max(...tree.nodes.map(n => n.level)),
              nodesPerLevel: Array.from(tree.levels.entries()).map(([level, nodes]) => ({
                level,
                count: nodes.length,
                nodes: nodes.map(n => n.name),
              })),
            };

            setParsedData(hierarchical);
            setTreeInfo(info);
          }
        }
        // Don't redirect if no data - just show "No Data Available" state
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
        // Don't redirect on error - just show "No Data Available" state
      } finally {
        setLoading(false);
      }
    }
  }, [parsedData, treeInfo]); // Removed navigate dependency

  if (loading) {
    return (
      <div className="diagram-container">
        <div className="diagram-header">
          <h2>Loading Diagram...</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div>⏳ Loading diagram from saved data...</div>
        </div>
      </div>
    );
  }

  if (!parsedData || !treeInfo) {
    return (
      <div className="diagram-container">
        <div className="diagram-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back to Editor
          </button>
          <h2>No Data Available</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column', gap: '10px' }}>
          <div>No diagram data found. Please create a diagram first.</div>
          <button className="visualize-btn" onClick={() => navigate("/")}>
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="diagram-container">
      <div className="diagram-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Editor
        </button>
        <button className="combined-btn" onClick={() => navigate("/combined")}>
          🔗 Combined View
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