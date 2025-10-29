// ...existing code...
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import DiagramPage from "./pages/DiagramPage";
import DocsPage from "./pages/DocsPage";
import SavedGraphsModal from "./components/SavedGraphsModal";
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

function AppContent() {
  const navigate = useNavigate();
  const [yamlText, setYamlText] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return data.yamlText || DEFAULT_YAML;
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }
    return DEFAULT_YAML;
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

  useEffect(() => {
    try {
      const dataToSave = {
        yamlText,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      if (e.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded");
      }
    }
  }, [yamlText]);

  const handleVisualize = () => {
    try {
      const validationResult = validateYAML(yamlText);
      setValidation(validationResult);

      if (!validationResult.valid) {
        setError(`Found ${validationResult.issues.length} issue(s) in YAML. Check validation panel below.`);
        return;
      }

      const data = yaml.load(yamlText);
      const tree = buildTreeFromYAML(data);
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
      setError("");
      navigate("/diagram");
    } catch (e) {
      console.error("Parsing error:", e);
      setError("Invalid YAML: " + e.message);
      setValidation(null);
    }
  };

  const handleClearData = () => {
    if (window.confirm("Clear saved data and reset to default? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      setYamlText(DEFAULT_YAML);
      setParsedData(null);
      setTreeInfo(null);
      setError("");
      setValidation(null);
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
    alert(`Graph "${name}" saved successfully!`);
  };

  const handleLoadGraph = (graph) => {
    if (yamlText !== graph.yamlText && yamlText !== DEFAULT_YAML) {
      if (!window.confirm("Loading this graph will replace your current YAML. Continue?")) {
        return;
      }
    }
    setYamlText(graph.yamlText);
    setShowSavedGraphs(false);
    navigate("/");
  };

  const handleDeleteGraph = (graphId) => {
    if (!window.confirm("Delete this saved graph? This cannot be undone.")) return;
    const updatedGraphs = savedGraphs.filter(g => g.id !== graphId);
    setSavedGraphs(updatedGraphs);
    localStorage.setItem(SAVED_GRAPHS_KEY, JSON.stringify(updatedGraphs));
  };

  return (
    <div className="app">
      <Routes>
        <Route 
          path="/" 
          element={
            <EditorPage
              yamlText={yamlText}
              setYamlText={setYamlText}
              handleVisualize={handleVisualize}
              error={error}
              validation={validation}
              handleSaveGraph={handleSaveGraph}
              savedGraphs={savedGraphs}
              setShowSavedGraphs={setShowSavedGraphs}
              handleClearData={handleClearData}
            />
          } 
        />
        <Route 
          path="/diagram" 
          element={
            <DiagramPage 
              parsedData={parsedData} 
              treeInfo={treeInfo} 
            />
          } 
        />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
      
      <SavedGraphsModal
        showSavedGraphs={showSavedGraphs}
        setShowSavedGraphs={setShowSavedGraphs}
        savedGraphs={savedGraphs}
        handleLoadGraph={handleLoadGraph}
        handleDeleteGraph={handleDeleteGraph}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
// ...existing code...