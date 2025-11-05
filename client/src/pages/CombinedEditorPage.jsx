import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";
import DiagramViewer from "../components/DiagramViewer";
import SearchPanel from "../components/SearchPanel";
import { useYamlFile } from "../hooks/useYamlFile";
import { useDebounce } from "../hooks/useDebounce";
import yaml from "js-yaml";
import { buildTreeFromYAML, convertToD3Hierarchy } from "../utils/treeBuilder";
import { validateYAML } from "../utils/yamlValidator";
import "./CombinedEditor.css";

export default function CombinedEditorPage({
  yamlText,
  setYamlText,
  error,
  validation,
  handleSaveGraph,
  savedGraphs,
  setShowSavedGraphs,
  handleNewFile,
  isAuthenticated,
  user,
  onShowAuth,
  onShowRepositoryImporter,
  onShowVersionHistory,
  onLogout,
}) {
  const navigate = useNavigate();
  const { id: currentFileId } = useParams(); // Get current file ID from URL
  const [parsedData, setParsedData] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [localError, setLocalError] = useState("");
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const previousAuthState = useRef(isAuthenticated);
  
  // Debounce yamlText for expensive operations like validation and graph rendering
  const debouncedYamlText = useDebounce(yamlText, 300); // 300ms delay for more responsive combined view
  
  // Use the custom hook to load YAML file by ID if present in URL
  const { loading: fileLoading, error: fileError, fileData } = useYamlFile(setYamlText, isAuthenticated);

  // Redirect to home if invalid ID error
  useEffect(() => {
    if (fileError && fileError.includes('Invalid file ID format')) {
      navigate('/', { replace: true });
    }
  }, [fileError, navigate]);

  // Redirect to remove file ID from URL when user logs out
  useEffect(() => {
    // Only redirect if user was previously authenticated and now is not
    if (previousAuthState.current && !isAuthenticated && currentFileId) {
      navigate('/combined', { replace: true });
    }
    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated, currentFileId, navigate]);
  
  // Listen for search results from DiagramViewer via custom events
  useEffect(() => {
    const handleSearchComplete = (event) => {
      const { results, currentIndex } = event.detail;
      setSearchResults(results);
      setCurrentSearchIndex(currentIndex);
    };

    const handleNavigationComplete = (event) => {
      const { currentIndex } = event.detail;
      setCurrentSearchIndex(currentIndex);
    };

    window.addEventListener('diagramSearchComplete', handleSearchComplete);
    window.addEventListener('diagramNavigationComplete', handleNavigationComplete);

    return () => {
      window.removeEventListener('diagramSearchComplete', handleSearchComplete);
      window.removeEventListener('diagramNavigationComplete', handleNavigationComplete);
    };
  }, []);

  // Note: Mobile users can now access combined view
  // Removed automatic redirect to allow mobile access
  
  // Search handler - calls DiagramViewer's global search function
  const handleSearch = useCallback((term) => {
    if (!term || !term.trim()) {
      // Clear results immediately for empty search
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
    
    // Call DiagramViewer's search function (will dispatch event with results)
    if (window.combinedEditorDiagramSearch) {
      window.combinedEditorDiagramSearch(term);
    }
  }, []);

  // Navigation handler - calls DiagramViewer's global navigate function
  const handleSearchNavigation = useCallback((direction) => {
    // Call DiagramViewer's navigate function (will dispatch event with new index)
    if (window.combinedEditorDiagramNavigate) {
      window.combinedEditorDiagramNavigate(direction);
    }
  }, []);

  // Auto-visualize when YAML changes (debounced)
  useEffect(() => {
    if (debouncedYamlText) {
      try {
        const result = validateYAML(debouncedYamlText);
        if (result.valid) {
          const parsedData = yaml.load(debouncedYamlText);
          const treeData = buildTreeFromYAML(parsedData);
          const d3Data = convertToD3Hierarchy(treeData);
          setParsedData(d3Data);
          setTreeInfo(treeData.treeInfo);
          setLocalError("");
        } else {
          const errorMessages = result.issues ? result.issues.map(issue => issue.message) : ["YAML validation failed"];
          setLocalError(errorMessages.join(", "));
          setParsedData(null);
          setTreeInfo(null);
        }
      } catch (error) {
        setLocalError(error.message);
        setParsedData(null);
        setTreeInfo(null);
      }
    }
  }, [debouncedYamlText]);

  // Handle resizer drag
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    document.body.classList.add('dragging');
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const containerWidth = window.innerWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;
    
    // Constrain between 20% and 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.classList.remove('dragging');
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="simple-combined-editor">
      {/* Minimal Header */}
      <div className="simple-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => {
            if (currentFileId) {
              navigate(`/editor/${currentFileId}`);
            } else {
              navigate("/");
            }
          }}>
            ← Back
          </button>
          <h1>YAML Editor & Visualizer</h1>
          {fileLoading && (
            <span className="file-loading" style={{ color: '#666', fontSize: '14px', marginLeft: '10px' }}>
              📄 Loading file...
            </span>
          )}
          {fileError && (
            <span className="file-error" style={{ color: '#d32f2f', fontSize: '14px', marginLeft: '10px' }}>
              ❌ Error: {fileError}
            </span>
          )}
          {fileData && (
            <span className="file-info" style={{ color: '#2e7d32', fontSize: '14px', marginLeft: '10px' }}>
              📁 {fileData.title}
            </span>
          )}
          {treeInfo && (
            <span className="tree-info">
              {treeInfo.totalNodes} nodes • {treeInfo.maxDepth + 1} levels
            </span>
          )}
        </div>
        
        <div className="header-actions">
          <div className="right-controls">
            <button 
              className="repo-import-btn" 
              onClick={onShowRepositoryImporter}
              title="Import GitHub Repository"
            >
              📂 Import Repo
            </button>
            {currentFileId && (
              <button 
                className="new-file-btn" 
                onClick={() => handleNewFile("/combined")}
                title="Start new file (clear current)"
              >
                📄 New File
              </button>
            )}
            <button className="save-btn" onClick={handleSaveGraph} disabled={!parsedData}>
              💾 Save
            </button>
            <button 
              className="version-history-btn" 
              onClick={onShowVersionHistory}
              title="View Version History"
              disabled={!isAuthenticated}
            >
              📜 History
            </button>
            <button className="saved-btn" onClick={() => setShowSavedGraphs(true)}>
              📚 Saved ({savedGraphs.length})
            </button>
            <div className="auth-section">
              {isAuthenticated ? (
                <div className="auth-container">
                  <div className="first-line">
                    <button 
                      className="user-name-btn"
                      onClick={() => navigate('/profile')}
                      title="View Profile"
                    >
                      Welcome, {user?.username || 'User'}!
                    </button>
                    <button className="auth-btn logout-btn" onClick={onLogout}>
                      🚪 Logout
                    </button>
                  </div>
                  <div className="second-line">
                    <button className="auth-btn save-graph-mobile" onClick={handleSaveGraph} title="Save current graph">
                      💾 Save
                    </button>
                    <button className="auth-btn saved-graphs-mobile" onClick={() => setShowSavedGraphs(true)} title="View saved graphs">
                      📚 Saved ({savedGraphs.length})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="auth-container">
                  <div className="first-line">
                    <button className="auth-btn login-btn" onClick={onShowAuth}>
                      🔐 Login / Sign Up
                    </button>
                  </div>
                  <div className="second-line">
                    <button className="auth-btn save-graph-mobile" onClick={handleSaveGraph} title="Save current graph">
                      💾 Save
                    </button>
                    <button className="auth-btn saved-graphs-mobile disabled" onClick={() => setShowSavedGraphs(true)} title="Login to view saved graphs" disabled>
                      📚 Saved (0)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {(error || localError) && (
        <div className="error-banner">
          ⚠️ {error || localError}
        </div>
      )}

      {/* Main Split View */}
      <div className="split-container">
        {/* Left Panel - Editor */}
        <div 
          className="left-panel" 
          style={{ width: `${leftWidth}%` }}
        >
          <YamlEditor
            value={yamlText}
            onChange={setYamlText}
            error={error || localError}
            validation={validation}
          />
        </div>

        {/* Resizer */}
        <div 
          className="resizer"
          onMouseDown={handleMouseDown}
        />

        {/* Right Panel - Visualization */}
        <div 
          className="right-panel"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="right-panel-container">
            {/* Diagram Area */}
            <div className="diagram-area">
              {/* Search Panel positioned within diagram area */}
              <div className="search-panel-container">
                <SearchPanel
                  onSearch={handleSearch}
                  searchResults={searchResults}
                  currentIndex={currentSearchIndex}
                  onNavigate={handleSearchNavigation}
                />
              </div>
              <div className="diagram-content">
                {parsedData ? (
                  <DiagramViewer 
                    data={parsedData} 
                    treeInfo={treeInfo}
                    hideSearch={true}
                  />
                ) : (
                  <div className="diagram-placeholder">
                    <div className="placeholder-content">
                      <div className="placeholder-icon">📊</div>
                      <h3>No Visualization Yet</h3>
                      <p>
                        {yamlText ? 
                          "Fix YAML errors to see visualization" : 
                          "Enter YAML content to see the tree diagram"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}