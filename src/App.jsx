import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import DiagramPage from "./pages/DiagramPage";
import CombinedEditorPage from "./pages/CombinedEditorPage";
import DocsPage from "./pages/DocsPage";
import SavedGraphsModal from "./components/SavedGraphsModal";
import yaml from "js-yaml";
import { buildTreeFromYAML, convertToD3Hierarchy } from "./utils/treeBuilder";
import { validateYAML } from "./utils/yamlValidator";
import defaultYamlContent from "./assets/default.yaml?raw";
import "./App.css";

const STORAGE_KEY = "yaml-diagram-data";
const SAVED_GRAPHS_KEY = "yaml-diagram-saved-graphs";
const DEFAULT_YAML = defaultYamlContent;

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

    // Check if a graph with this name already exists
    const existingGraphIndex = savedGraphs.findIndex(graph => 
      graph.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingGraphIndex !== -1) {
      const shouldOverwrite = window.confirm(
        `A graph named "${name}" already exists. Do you want to overwrite it?`
      );
      
      if (!shouldOverwrite) return;

      // Update existing graph
      const updatedGraphs = [...savedGraphs];
      updatedGraphs[existingGraphIndex] = {
        ...updatedGraphs[existingGraphIndex],
        yamlText,
        updatedAt: new Date().toISOString(),
        name: name.trim()
      };
      
      setSavedGraphs(updatedGraphs);
      localStorage.setItem(SAVED_GRAPHS_KEY, JSON.stringify(updatedGraphs));
      alert(`Graph "${name}" updated successfully!`);
    } else {
      // Create new graph
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
    }
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

  const handleUpdateGraph = (graph) => {
    if (!window.confirm(`Update "${graph.name}" with the current YAML content?`)) return;
    
    const updatedGraphs = savedGraphs.map(g => 
      g.id === graph.id 
        ? { ...g, yamlText, updatedAt: new Date().toISOString() }
        : g
    );
    
    setSavedGraphs(updatedGraphs);
    localStorage.setItem(SAVED_GRAPHS_KEY, JSON.stringify(updatedGraphs));
    alert(`Graph "${graph.name}" updated successfully!`);
    setShowSavedGraphs(false);
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
        <Route 
          path="/combined" 
          element={
            <CombinedEditorPage
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
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
      
      <SavedGraphsModal
        showSavedGraphs={showSavedGraphs}
        setShowSavedGraphs={setShowSavedGraphs}
        savedGraphs={savedGraphs}
        handleLoadGraph={handleLoadGraph}
        handleDeleteGraph={handleDeleteGraph}
        handleUpdateGraph={handleUpdateGraph}
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