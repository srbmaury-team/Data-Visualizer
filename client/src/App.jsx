import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { useAuth } from "./hooks/useAuth";
import { useYamlFiles } from "./hooks/useYamlFiles";
import { useToast } from "./hooks/useToast";
import { useDebounce } from "./hooks/useDebounce";
import EditorPage from "./pages/EditorPage";
import DiagramPage from "./pages/DiagramPage";
import CombinedEditorPage from "./pages/CombinedEditorPage";
import DiffComparePage from "./pages/DiffComparePage";
import SharedViewerPage from "./pages/SharedViewerPage";
import SharedViewerWrapper from "./pages/SharedViewerWrapper";
import DocsPage from "./pages/DocsPage";
import ProfilePage from "./pages/ProfilePage";
import SavedGraphsModal from "./components/SavedGraphsModal";
import SaveGraphModal from "./components/SaveGraphModal";
import AuthModal from "./components/AuthModal";
import RepositoryImporter from "./components/RepositoryImporter";
import VersionHistoryModal from "./components/VersionHistoryModal";
import yaml from "js-yaml";
import { buildTreeFromYAML, convertToD3Hierarchy } from "./utils/treeBuilder";
import { validateYAML } from "./utils/yamlValidator";
import defaultYamlContent from "./assets/default.yaml?raw";
import "./App.css";

const STORAGE_KEY = "yaml-diagram-data";
const DEFAULT_YAML = defaultYamlContent;

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentFileId, setCurrentFileId] = useState(null);

  // Debounce yamlText for validation and expensive operations
  const debouncedYamlText = useDebounce(yamlText, 500); // 500ms delay

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

  // Handle file loading from profile page navigation
  useEffect(() => {
    if (location.state?.loadFile && location.state?.yamlContent) {
      setYamlText(location.state.yamlContent);
      
      // Set the file ID if provided
      if (location.state.fileId) {
        setCurrentFileId(location.state.fileId);
      }
      
      // Clear the navigation state to prevent re-loading on refresh
      navigate(location.pathname, { replace: true, state: {} });
      
      if (location.state.fileName) {
        showSuccess(`Loaded "${location.state.fileName}" into editor`);
      }
    }
  }, [location.state, location.pathname, navigate, showSuccess]);

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

  // Real-time YAML validation with debouncing
  useEffect(() => {
    if (debouncedYamlText && debouncedYamlText.trim() !== '') {
      try {
        const validationResult = validateYAML(debouncedYamlText);
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
  }, [debouncedYamlText]);

  const handleVisualize = (fileId = null) => {
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
      
      // Navigate to diagram route with file ID if available
      if (fileId) {
        navigate(`/diagram/${fileId}`);
      } else {
        navigate("/diagram");
      }
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

  const handleNewFile = (navigateTo = "/") => {
    setYamlText(DEFAULT_YAML);
    setParsedData(null);
    setTreeInfo(null);
    setTreeData(null);
    setError("");
    setValidation(null);
    setCurrentFileId(null);
    navigate(navigateTo);
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
        const result = await updateGraph(graphData.existingId, {
          title: graphData.title,
          yamlContent: yamlText,
          description: graphData.description,
          isPublic: graphData.isPublic
        });
        
        // Set the current file ID for version history
        if (result && result.id) {
          setCurrentFileId(result.id);
        }
        
        showSuccess(`Graph "${graphData.title}" updated successfully!`);
      } else {
        // Create new graph
        const result = await saveGraph({
          title: graphData.title,
          yamlContent: yamlText,
          description: graphData.description,
          isPublic: graphData.isPublic
        });
        
        // Set the current file ID for version history
        if (result && result.id) {
          setCurrentFileId(result.id);
        }
        
        showSuccess(`Graph "${graphData.title}" saved successfully!`);
      }
    } catch (err) {
      showError(`Failed to save graph: ${err.message}`);
    }
  };

  const handleShowVersionHistory = () => {
    if (!isAuthenticated) {
      showError('Please login to view version history');
      return;
    }
    if (!currentFileId) {
      // For new unsaved files, prompt user to save first
      if (window.confirm('This file needs to be saved before viewing version history. Would you like to save it now?')) {
        handleSaveGraph();
        return;
      } else {
        return;
      }
    }
    setShowVersionHistory(true);
  };

  const handleLoadGraph = (graph, viewType = 'editor') => {
    const fileId = graph.id || graph._id;
    if (!fileId) {
      showError("No file ID found for this graph");
      return;
    }
    
    // Check if user is trying to load the same file on the same page
    const currentPath = location.pathname;
    const targetPath = `/${viewType}/${fileId}`;
    const isCurrentFile = currentPath === targetPath;
    
    if (isCurrentFile) {
      // Show confirmation dialog for reloading same file
      const confirmReload = window.confirm(
        `You are already viewing this file.\n\n` +
        `"${graph.title || 'Untitled Graph'}"\n\n` +
        `Do you want to reload the content from the server? This will replace any unsaved changes in the editor.`
      );
      
      if (!confirmReload) {
        setShowSavedGraphs(false);
        return;
      }
      
      // Dispatch a custom event to trigger reload in the current page
      const reloadEvent = new CustomEvent('forceReloadYamlFile', {
        detail: { fileId, graph }
      });
      window.dispatchEvent(reloadEvent);
      
      setShowSavedGraphs(false);
      showSuccess(`Reloading "${graph.title || 'Untitled Graph'}" from server...`);
      return;
    }
    
    setShowSavedGraphs(false);
    setCurrentFileId(fileId);
    
    // Navigate to the new ID-based routes
    switch (viewType) {
      case 'editor':
        navigate(`/editor/${fileId}`);
        break;
      case 'combined':
        navigate(`/combined/${fileId}`);
        break;
      case 'diagram':
        navigate(`/diagram/${fileId}`);
        break;
      default:
        navigate(`/editor/${fileId}`);
    }
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
    
    // Enhanced success message with processing stats
    let successMessage = `Repository imported successfully! Analysis: ${importData.analysis.totalFiles} files, ${importData.analysis.totalDirectories} directories`;
    
    if (importData.processingStats) {
      const stats = importData.processingStats;
      if (stats.truncated) {
        successMessage += ` (Large repository - showing ${stats.totalNodes} representative nodes)`;
      } else {
        successMessage += ` (${stats.totalNodes} nodes processed)`;
      }
    }
    
    showSuccess(successMessage);
    
    // Process the YAML for visualization
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
        
        // Context-aware navigation after successful import
        const currentPath = location.pathname;
        if (currentPath.includes('/combined')) {
          // If we're on a combined page, stay on combined page
          if (currentFileId) {
            navigate(`/combined/${currentFileId}`);
          } else {
            navigate('/combined');
          }
        } else {
          // If we're on editor page or any other page, go to editor
          if (currentFileId) {
            navigate(`/editor/${currentFileId}`);
          } else {
            navigate('/');
          }
        }
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
              handleNewFile={handleNewFile}
              isAuthenticated={isAuthenticated}
              user={user}
              onShowAuth={() => setShowAuthModal(true)}
              onShowRepositoryImporter={() => setShowRepositoryImporter(true)}
              onShowVersionHistory={handleShowVersionHistory}
              onLogout={logout}
            />
          } 
        />
        <Route 
          path="/editor/:id" 
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
              handleNewFile={handleNewFile}
              isAuthenticated={isAuthenticated}
              user={user}
              onShowAuth={() => setShowAuthModal(true)}
              onShowRepositoryImporter={() => setShowRepositoryImporter(true)}
              onShowVersionHistory={handleShowVersionHistory}
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
              isAuthenticated={isAuthenticated}
            />
          } 
        />
        <Route 
          path="/diagram/:id" 
          element={
            <DiagramPage 
              parsedData={parsedData} 
              treeInfo={treeInfo}
              treeData={treeData}
              isAuthenticated={isAuthenticated}
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
              handleNewFile={handleNewFile}
              isAuthenticated={isAuthenticated}
              user={user}
              onShowAuth={() => setShowAuthModal(true)}
              onShowRepositoryImporter={() => setShowRepositoryImporter(true)}
              onShowVersionHistory={handleShowVersionHistory}
              onLogout={logout}
            />
          } 
        />
        <Route 
          path="/combined/:id" 
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
              handleNewFile={handleNewFile}
              isAuthenticated={isAuthenticated}
              user={user}
              onShowAuth={() => setShowAuthModal(true)}
              onShowRepositoryImporter={() => setShowRepositoryImporter(true)}
              onShowVersionHistory={handleShowVersionHistory}
              onLogout={logout}
            />
          } 
        />
        <Route 
          path="/diff" 
          element={
            <DiffComparePage 
              isAuthenticated={isAuthenticated}
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

      <VersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        fileId={currentFileId}
        fileName="Current YAML File"
        onLoadVersion={(content, message) => {
          setYamlText(content);
          showSuccess(message);
        }}
      />
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