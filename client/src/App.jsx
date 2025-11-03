import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { useAuth } from "./hooks/useAuth";
import { useYamlFiles } from "./hooks/useYamlFiles";
import { useToast } from "./hooks/useToast";
import EditorPage from "./pages/EditorPage";
import DiagramPage from "./pages/DiagramPage";
import CombinedEditorPage from "./pages/CombinedEditorPage";
import SharedViewerPage from "./pages/SharedViewerPage";
import SharedViewerWrapper from "./pages/SharedViewerWrapper";
import DocsPage from "./pages/DocsPage";
import ProfilePage from "./pages/ProfilePage";
import SavedGraphsModal from "./components/SavedGraphsModal";
import SaveGraphModal from "./components/SaveGraphModal";
import AuthModal from "./components/AuthModal";
import RepositoryImporter from "./components/RepositoryImporter";
import yaml from "js-yaml";
import { buildTreeFromYAML, convertToD3Hierarchy } from "./utils/treeBuilder";
import { validateYAML } from "./utils/yamlValidator";
import defaultYamlContent from "./assets/default.yaml?raw";
import "./App.css";

const STORAGE_KEY = "yaml-diagram-data";
const DEFAULT_YAML = defaultYamlContent;

function AppContent() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { 
    savedGraphs, 
    loadSavedGraphs, 
    saveGraph, 
    updateGraph, 
    deleteGraph,
    clearSavedGraphs
  } = useYamlFiles();
  
  const [yamlText, setYamlText] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        
        // Check if this came from a shared link on mobile
        if (data.fromSharedLink) {
          // Clean up the localStorage to prevent re-loading on subsequent visits
          const cleanData = {
            yamlText: data.yamlText,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
          
          // Show a toast message about the shared content being loaded
          setTimeout(() => {
            const event = new CustomEvent('showToast', {
              detail: {
                message: data.sharedTitle ? 
                  `Loaded shared graph: "${data.sharedTitle}"` : 
                  'Shared graph content loaded successfully',
                type: 'success'
              }
            });
            window.dispatchEvent(event);
          }, 1000);
        }
        
        return data.yamlText || DEFAULT_YAML;
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }
    return DEFAULT_YAML;
  });

  const [parsedData, setParsedData] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [treeData, setTreeData] = useState(null); // Store the raw tree data for export
  const [error, setError] = useState("");
  const [validation, setValidation] = useState(null);
  const [showSavedGraphs, setShowSavedGraphs] = useState(false);
  const [showSaveGraphModal, setShowSaveGraphModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRepositoryImporter, setShowRepositoryImporter] = useState(false);

  // Load saved graphs when user authenticates, clear when they logout
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedGraphs();
    } else {
      // Clear saved graphs when user logs out
      clearSavedGraphs();
    }
  }, [isAuthenticated, loadSavedGraphs, clearSavedGraphs]);

  // Listen for toast events from shared link redirects
  useEffect(() => {
    const handleToastEvent = (event) => {
      const { message, type } = event.detail;
      if (type === 'success') {
        showSuccess(message);
      } else if (type === 'error') {
        showError(message);
      }
    };

    window.addEventListener('showToast', handleToastEvent);
    return () => window.removeEventListener('showToast', handleToastEvent);
  }, [showSuccess, showError]);

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

  // Real-time YAML validation as user types
  useEffect(() => {
    if (yamlText && yamlText.trim() !== '') {
      try {
        const validationResult = validateYAML(yamlText);
        setValidation(validationResult);
        
        // Clear error if YAML becomes valid
        if (validationResult.valid) {
          setError(null);
        }
      } catch (err) {
        // Handle validation errors
        setValidation({
          valid: false,
          issues: [{
            line: 1,
            type: 'Validation Error',
            message: err.message
          }],
          warnings: [],
          stats: { nonEmptyLines: 0 }
        });
      }
    } else {
      // Clear validation when YAML is empty
      setValidation(null);
      setError(null);
    }
  }, [yamlText]);

  const handleVisualize = () => {
    try {
      const validationResult = validateYAML(yamlText);
      setValidation(validationResult);

      if (!validationResult.valid) {
        const issueCount = validationResult.issues.length;
        const errorMessage = `Cannot visualize: Found ${issueCount} error${issueCount !== 1 ? 's' : ''} in YAML`;
        setError(`${errorMessage}. Check validation panel below.`);
        showError(`${errorMessage}. Please fix the issues first.`);
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
      setTreeData(tree); // Store the raw tree data for export sizing
      setError("");
      navigate("/diagram");
    } catch (e) {
      console.error("Parsing error:", e);
      const errorMessage = "Invalid YAML: " + e.message;
      setError(errorMessage);
      showError(errorMessage);
      setValidation(null);
    }
  };

  const handleClearData = () => {
    if (window.confirm("Clear saved data and reset to default? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      setYamlText(DEFAULT_YAML);
      setParsedData(null);
      setTreeInfo(null);
      setTreeData(null);
      setError("");
      setValidation(null);
    }
  };

  const handleSaveGraph = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setShowSaveGraphModal(true);
  };

  const handleSaveGraphFromModal = async (graphData) => {
    try {
      if (graphData.isUpdate) {
        // Update existing graph
        await updateGraph(graphData.existingId, {
          title: graphData.title,
          yamlContent: yamlText,
          description: graphData.description,
          isPublic: graphData.isPublic
        });
        
        showSuccess(`Graph "${graphData.title}" updated successfully!`);
      } else {
        // Create new graph
        await saveGraph({
          title: graphData.title,
          yamlContent: yamlText,
          description: graphData.description,
          isPublic: graphData.isPublic
        });
        
        showSuccess(`Graph "${graphData.title}" saved successfully!`);
      }
    } catch (err) {
      showError(`Failed to save graph: ${err.message}`);
    }
  };

  const handleLoadGraph = (graph) => {
    if (yamlText !== graph.content && yamlText !== DEFAULT_YAML) {
      if (!window.confirm("Loading this graph will replace your current YAML. Continue?")) {
        return;
      }
    }
    setYamlText(graph.content);
    setShowSavedGraphs(false);
    navigate("/");
  };

  const handleDeleteGraph = async (graphId) => {
    if (!window.confirm("Delete this saved graph? This cannot be undone.")) return;
    
    try {
      await deleteGraph(graphId);
      showSuccess("Graph deleted successfully!");
    } catch (err) {
      showError(`Failed to delete graph: ${err.message}`);
    }
  };

  const handleUpdateGraph = async (graph) => {
    if (!window.confirm(`Update "${graph.title}" with the current YAML content?`)) return;
    
    try {
      await updateGraph(graph.id, {
        title: graph.title,
        yamlContent: yamlText,
        description: graph.description,
        isPublic: graph.isPublic
      });
      
      showSuccess(`Graph "${graph.title}" updated successfully!`);
      setShowSavedGraphs(false);
    } catch (err) {
      showError(`Failed to update graph: ${err.message}`);
    }
  };

  const handleRepositoryImport = (importData) => {
    if (yamlText !== DEFAULT_YAML && yamlText.trim() !== "") {
      if (!window.confirm("Importing a repository will replace your current YAML. Continue?")) {
        return;
      }
    }
    
    setYamlText(importData.yamlText);
    showSuccess(`Repository imported successfully! Analysis: ${importData.analysis.totalFiles} files, ${importData.analysis.totalDirectories} directories`);
    
    // Process the YAML for visualization without navigating
    try {
      const validationResult = validateYAML(importData.yamlText);
      setValidation(validationResult);

      if (validationResult.valid) {
        const data = yaml.load(importData.yamlText);
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
        setTreeData(tree);
        setError("");
      }
    } catch (e) {
      console.error("Parsing error after import:", e);
      setError("Imported YAML has parsing issues: " + e.message);
    }
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
              isAuthenticated={isAuthenticated}
              user={user}
              onShowAuth={() => setShowAuthModal(true)}
              onShowRepositoryImporter={() => setShowRepositoryImporter(true)}
              onLogout={logout}
            />
          } 
        />
        <Route 
          path="/diagram" 
          element={
            <DiagramPage 
              parsedData={parsedData} 
              treeInfo={treeInfo}
              treeData={treeData}
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
              isAuthenticated={isAuthenticated}
              user={user}
              onShowAuth={() => setShowAuthModal(true)}
              onShowRepositoryImporter={() => setShowRepositoryImporter(true)}
              onLogout={logout}
            />
          } 
        />
        <Route path="/shared/:shareId" element={<SharedViewerWrapper />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      
      <SavedGraphsModal
        showSavedGraphs={showSavedGraphs}
        setShowSavedGraphs={setShowSavedGraphs}
        savedGraphs={savedGraphs}
        handleLoadGraph={handleLoadGraph}
        handleDeleteGraph={handleDeleteGraph}
        handleUpdateGraph={handleUpdateGraph}
        isAuthenticated={isAuthenticated}
        onAuthRequired={() => setShowAuthModal(true)}
      />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <SaveGraphModal
        isOpen={showSaveGraphModal}
        onClose={() => setShowSaveGraphModal(false)}
        onSave={handleSaveGraphFromModal}
        existingGraphs={savedGraphs}
      />

      {showRepositoryImporter && (
        <RepositoryImporter
          onImport={handleRepositoryImport}
          onClose={() => setShowRepositoryImporter(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}