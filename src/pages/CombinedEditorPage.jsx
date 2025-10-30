import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";
import DiagramViewer from "../components/DiagramViewer";
import SearchPanel from "../components/SearchPanel";
import yaml from "js-yaml";
import { buildTreeFromYAML, convertToD3Hierarchy } from "../utils/treeBuilder";
import { validateYAML } from "../utils/yamlValidator";
import "./CombinedEditor.css";

export default function CombinedEditorPage({
  yamlText,
  setYamlText,
  handleVisualize,
  error,
  validation,
  handleSaveGraph,
  savedGraphs,
  setShowSavedGraphs,
  handleClearData,
}) {
  const navigate = useNavigate();
  const diagramViewerRef = useRef();
  const [parsedData, setParsedData] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [localError, setLocalError] = useState("");
  const [leftWidth, setLeftWidth] = useState(50); // Percentage width for left panel
  const [isDragging, setIsDragging] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState({ term: "", timestamp: 0 });
  
  // Debug: Log when searchTerm changes
  useEffect(() => {
  }, [searchTerm]);
  
  // Search handlers for the diagram
  const handleSearch = (term) => {
    console.log('CombinedEditorPage: handleSearch called with term:', term);
    if (window.combinedEditorDiagramSearch) {
      console.log('CombinedEditorPage: Calling global search function');
      window.combinedEditorDiagramSearch(term);
      // Only update local state if we have a search term
      if (term && term.trim()) {
        setTimeout(() => {
          const results = window.getCombinedEditorSearchResults ? window.getCombinedEditorSearchResults() : [];
          const currentIndex = window.getCombinedEditorCurrentIndex ? window.getCombinedEditorCurrentIndex() : 0;
          console.log('CombinedEditorPage: Retrieved results:', results.length, 'currentIndex:', currentIndex);
          setSearchResults(results);
          setCurrentSearchIndex(currentIndex);
        }, 100);
      } else {
        // Clear results for empty search
        setSearchResults([]);
        setCurrentSearchIndex(0);
      }
    } else {
      console.log('CombinedEditorPage: Global search function not available');
    }
  };

  const handleSearchNavigation = (direction) => {
    console.log('CombinedEditorPage: handleSearchNavigation called with direction:', direction);
    if (window.combinedEditorDiagramNavigate) {
      console.log('CombinedEditorPage: Calling global navigate function');
      window.combinedEditorDiagramNavigate(direction);
      // Update local state to sync with SearchPanel
      setTimeout(() => {
        const currentIndex = window.getCombinedEditorCurrentIndex ? window.getCombinedEditorCurrentIndex() : 0;
        console.log('CombinedEditorPage: Retrieved new index after navigation:', currentIndex);
        setCurrentSearchIndex(currentIndex);
      }, 50);
    } else {
      console.log('CombinedEditorPage: Global navigate function not available');
    }
  };

    // Auto-visualize when YAML changes
  useEffect(() => {
    if (yamlText) {
      try {
        const result = validateYAML(yamlText);
        if (result.valid) {
          const parsedData = yaml.load(yamlText);
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
  }, [yamlText]);

  // Handle resizer drag
  const handleMouseDown = (e) => {
    setIsDragging(true);
    document.body.classList.add('dragging');
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const containerWidth = window.innerWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;
    
    // Constrain between 20% and 80%
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('dragging');
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="simple-combined-editor">
      {/* Minimal Header */}
      <div className="simple-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Back
          </button>
          <h1>YAML Editor & Visualizer</h1>
          {treeInfo && (
            <span className="tree-info">
              {treeInfo.totalNodes} nodes • {treeInfo.maxDepth + 1} levels
            </span>
          )}
        </div>
        
        <div className="header-actions">
          <button className="save-btn" onClick={handleSaveGraph} disabled={!parsedData}>
            💾 Save
          </button>
          <button className="saved-btn" onClick={() => setShowSavedGraphs(true)}>
            📚 Saved ({savedGraphs.length})
          </button>
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
                  onExpandedChange={setIsSearchExpanded}
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