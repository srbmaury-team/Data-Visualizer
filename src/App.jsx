import React, { useState, useEffect } from "react";
import YamlEditor from "./components/YamlEditor";
import DiagramViewer from "./components/DiagramViewer";
import yaml from "js-yaml";
import { buildTreeFromYAML, convertToD3Hierarchy } from "./utils/treeBuilder";
import { validateYAML } from "./utils/yamlValidator";
import "./App.css";

const STORAGE_KEY = "yaml-diagram-data";
const SAVED_GRAPHS_KEY = "yaml-diagram-saved-graphs";
const DEFAULT_YAML = `# Sample YAML - Flat Root Structure
# Your format: properties and children at root level
# Click nodes to expand/collapse, scroll to zoom, drag to pan

name: E-Commerce-Platform
version: 2.5.1
environment: production
type: web-application
children:
  - name: Frontend
    framework: React
    port: 3000
    status: running
    nodes:
      - name: UI-Components
        type: module
        count: 47
      - name: State-Management
        library: Redux
      - name: Routing
        library: React-Router
  
  - name: Backend
    framework: Node.js
    port: 8080
    database: PostgreSQL
    children:
      - name: Auth-Service
        protocol: JWT
        timeout: 30s
        children:
          - name: User-Login
            method: POST
            endpoint: /api/auth/login
          - name: Token-Refresh
            method: POST
            endpoint: /api/auth/refresh
      
      - name: Product-Service
        cache: Redis
        rate-limit: 1000/min
        nodes:
          - name: Get-Products
            method: GET
            endpoint: /api/products
          - name: Add-Product
            method: POST
            endpoint: /api/products
  
  - name: Database
    type: PostgreSQL
    version: 14.2
    host: db.example.com
    children:
      - name: Users-Table
        rows: 150000
        indexes: 5
      - name: Products-Table
        rows: 25000
        indexes: 8`;

export default function App() {
  // Load from localStorage or use default
  const [yamlText, setYamlText] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        console.log("📂 Loaded YAML from localStorage");
        return data.yamlText || DEFAULT_YAML;
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }
    return DEFAULT_YAML;
  });

  const [showDiagram, setShowDiagram] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return data.showDiagram || false;
      }
    } catch (e) {
      console.error("Error loading state from localStorage:", e);
    }
    return false;
  });
  
  const [parsedData, setParsedData] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState(null);
  const [showSavedGraphs, setShowSavedGraphs] = useState(false);
  const [savedGraphs, setSavedGraphs] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_GRAPHS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error loading saved graphs:", e);
    }
    return [];
  });

  // Save to localStorage whenever yamlText or showDiagram changes
  useEffect(() => {
    try {
      const dataToSave = {
        yamlText,
        showDiagram,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log("💾 Saved to localStorage");
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      // Handle quota exceeded or other errors
      if (e.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded");
      }
    }
  }, [yamlText, showDiagram]);

  // Auto-restore diagram on mount if it was previously shown
  useEffect(() => {
    if (showDiagram && yamlText) {
      try {
        handleVisualize();
      } catch (e) {
        console.error("Error restoring diagram:", e);
        setShowDiagram(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleVisualize = () => {
    try {
      // First validate the YAML
      const validationResult = validateYAML(yamlText);
      setValidation(validationResult);
      
      console.log("Validation Result:", validationResult);
      
      // Show warnings but continue
      if (validationResult.warnings.length > 0) {
        console.warn("YAML Warnings:", validationResult.warnings);
      }
      
      // Stop if there are errors
      if (!validationResult.valid) {
        setError(`Found ${validationResult.issues.length} issue(s) in YAML. Check validation panel below.`);
        return;
      }
      
      const data = yaml.load(yamlText);
      
      // Build tree structure with level calculations
      const tree = buildTreeFromYAML(data);
      console.log("Tree Structure:", tree);
      console.log("Nodes per level:", Array.from(tree.levels.entries()));
      
      // Convert to D3 hierarchy format
      const hierarchical = convertToD3Hierarchy(tree);
      console.log("D3 Hierarchy:", hierarchical);
      
      // Store tree info for display
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
      setError("");
      setShowDiagram(true);
    } catch (e) {
      console.error("Parsing error:", e);
      setError("Invalid YAML: " + e.message);
      setValidation(null);
    }
  };

  const handleBack = () => {
    setShowDiagram(false);
  };

  const handleClearData = () => {
    if (window.confirm("Clear saved data and reset to default? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      setYamlText(DEFAULT_YAML);
      setShowDiagram(false);
      setParsedData(null);
      setTreeInfo(null);
      setError("");
      setValidation(null);
      console.log("🗑️ Cleared localStorage");
    }
  };

  const handleSaveGraph = () => {
    const name = prompt("Enter a name for this graph:");
    if (!name || name.trim() === "") return;

    const newGraph = {
      id: Date.now(),
      name: name.trim(),
      yamlText,
      createdAt: new Date().toISOString()
    };

    const updatedGraphs = [...savedGraphs, newGraph];
    setSavedGraphs(updatedGraphs);
    localStorage.setItem(SAVED_GRAPHS_KEY, JSON.stringify(updatedGraphs));
    console.log(`💾 Saved graph: "${name}"`);
    alert(`Graph "${name}" saved successfully!`);
  };

  const handleLoadGraph = (graph) => {
    if (yamlText !== graph.yamlText && yamlText !== DEFAULT_YAML) {
      if (!window.confirm("Loading this graph will replace your current YAML. Continue?")) {
        return;
      }
    }
    setYamlText(graph.yamlText);
    setShowDiagram(false);
    setShowSavedGraphs(false);
    console.log(`📂 Loaded graph: "${graph.name}"`);
  };

  const handleDeleteGraph = (graphId) => {
    if (!window.confirm("Delete this saved graph? This cannot be undone.")) return;
    
    const updatedGraphs = savedGraphs.filter(g => g.id !== graphId);
    setSavedGraphs(updatedGraphs);
    localStorage.setItem(SAVED_GRAPHS_KEY, JSON.stringify(updatedGraphs));
    console.log("🗑️ Deleted graph");
  };

  return (
    <div className="app">
      {!showDiagram ? (
        <div className="editor-container">
          <div className="header">
            <h1>🧩 YAML Diagram Visualizer</h1>
            <p>Convert YAML hierarchy into interactive tree diagrams</p>
            <div className="header-actions">
              <button className="save-graph-btn" onClick={handleSaveGraph} title="Save current graph">
                💾 Save Graph
              </button>
              <button className="my-graphs-btn" onClick={() => setShowSavedGraphs(true)} title="View saved graphs">
                📚 My Graphs ({savedGraphs.length})
              </button>
              <button className="clear-data-btn" onClick={handleClearData} title="Clear saved data">
                🗑️ Clear Data
              </button>
              <span className="autosave-indicator">💾 Auto-saves</span>
            </div>
          </div>
          <YamlEditor value={yamlText} onChange={setYamlText} />
          <div className="controls">
            <button className="visualize-btn" onClick={handleVisualize}>
              🎨 Visualize Diagram
            </button>
            {error && <div className="error">{error}</div>}
            
            {validation && (
              <div className="validation-panel">
                {validation.issues.length > 0 && (
                  <div className="validation-section errors">
                    <h4>❌ Errors ({validation.issues.length})</h4>
                    {validation.issues.map((issue, idx) => (
                      <div key={idx} className="validation-item error-item">
                        <div className="issue-header">
                          <span className="line-number">Line {issue.line}</span>
                          <span className="issue-type">{issue.type}</span>
                        </div>
                        <div className="issue-message">{issue.message}</div>
                        {issue.suggestion && (
                          <div className="issue-suggestion">
                            💡 Suggestion: <code>{issue.suggestion}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {validation.warnings.length > 0 && (
                  <div className="validation-section warnings">
                    <h4>⚠️ Warnings ({validation.warnings.length})</h4>
                    {validation.warnings.map((warning, idx) => (
                      <div key={idx} className="validation-item warning-item">
                        <div className="issue-header">
                          <span className="line-number">Line {warning.line}</span>
                          <span className="issue-type">{warning.type}</span>
                        </div>
                        <div className="issue-message">{warning.message}</div>
                        {warning.suggestion && (
                          <div className="issue-suggestion">
                            💡 {warning.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {validation.valid && validation.warnings.length === 0 && (
                  <div className="validation-success">
                    ✅ YAML is valid! ({validation.stats.nonEmptyLines} lines)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="diagram-container">
          <div className="diagram-header">
            <button className="back-btn" onClick={handleBack}>
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
      )}

      {/* Saved Graphs Modal */}
      {showSavedGraphs && (
        <div className="modal-overlay" onClick={() => setShowSavedGraphs(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📚 My Saved Graphs</h2>
              <button className="close-modal-btn" onClick={() => setShowSavedGraphs(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {savedGraphs.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No saved graphs yet</p>
                  <p className="empty-hint">Save your current graph using the "💾 Save Graph" button</p>
                </div>
              ) : (
                <div className="graphs-list">
                  {savedGraphs.map(graph => (
                    <div key={graph.id} className="graph-item">
                      <div className="graph-info">
                        <h3>{graph.name}</h3>
                        <p className="graph-date">
                          {new Date(graph.createdAt).toLocaleDateString()} at{' '}
                          {new Date(graph.createdAt).toLocaleTimeString()}
                        </p>
                        <p className="graph-preview">
                          {graph.yamlText.split('\n').slice(0, 2).join('\n')}...
                        </p>
                      </div>
                      <div className="graph-actions">
                        <button className="load-btn" onClick={() => handleLoadGraph(graph)}>
                          📂 Load
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteGraph(graph.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
