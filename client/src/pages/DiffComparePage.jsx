import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import YamlDiffEditor from '../components/YamlDiffEditor';
import DiffVisualization from '../components/DiffVisualization';
import DiffComputer from '../utils/diffComputer';
import './DiffComparePage.css';

const DiffComparePage = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const [leftYaml, setLeftYaml] = useState('');
  const [rightYaml, setRightYaml] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'unified'
  const [showLineNumbers] = useState(true);

  // Handle logout redirect
  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleCompare = () => {
    if (!leftYaml.trim() && !rightYaml.trim()) {
      return;
    }
    
    setIsComparing(true);
    
    // Use improved diff computation
    const leftLines = leftYaml.split('\n');
    const rightLines = rightYaml.split('\n');
    
    const diff = DiffComputer.computeLineDiff(leftLines, rightLines);
    setDiffResult(diff);
    setIsComparing(false);
  };

  const handleClear = () => {
    setLeftYaml('');
    setRightYaml('');
    setDiffResult(null);
  };

  const handleSwap = () => {
    const temp = leftYaml;
    setLeftYaml(rightYaml);
    setRightYaml(temp);
    if (diffResult) {
      handleCompare();
    }
  };

  const handlePasteLeft = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLeftYaml(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handlePasteRight = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRightYaml(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleCopyDiff = async () => {
    if (!diffResult) return;
    
    try {
      const diffText = DiffComputer.generateUnifiedDiff(diffResult, 'Original YAML', 'Modified YAML');
      await navigator.clipboard.writeText(diffText);
    } catch (err) {
      console.error('Failed to copy diff:', err);
    }
  };

  return (
    <div className="yaml-diff-compare-page">
      <div className="yaml-diff-header-section">
        <div className="yaml-diff-title-container">
          <button 
            className="yaml-diff-back-btn" 
            onClick={() => navigate('/')}
            title="Back to Editor"
          >
            ← Back to Editor
          </button>
          <h1 className="yaml-diff-main-title">🔍 YAML Diff Compare</h1>
          <p className="yaml-diff-subtitle">Compare two YAML files side by side to see differences</p>
        </div>
        
        <div className="yaml-diff-controls-container">
          <div className="yaml-diff-view-controls">
            <button
              className={`yaml-diff-view-toggle ${viewMode === 'side-by-side' ? 'yaml-diff-active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </button>
            <button
              className={`yaml-diff-view-toggle ${viewMode === 'unified' ? 'yaml-diff-active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Unified
            </button>
          </div>

          <div className="yaml-diff-action-controls">
            <button 
              className="yaml-diff-btn yaml-diff-btn-secondary" 
              onClick={handleSwap}
              title="Swap left and right content"
            >
              ⇄ Swap
            </button>
            <button 
              className="yaml-diff-btn yaml-diff-btn-secondary" 
              onClick={handleClear}
              title="Clear all content"
            >
              🗑️ Clear
            </button>
            <button 
              className="yaml-diff-btn yaml-diff-btn-primary" 
              onClick={handleCompare}
              disabled={isComparing || (!leftYaml.trim() && !rightYaml.trim())}
            >
              {isComparing ? '⏳ Comparing...' : '🔍 Compare'}
            </button>
          </div>
        </div>
      </div>

      <div className="yaml-diff-content-area">
        {viewMode === 'side-by-side' ? (
          <div className="yaml-diff-editors-container">
            <div className="yaml-diff-editor-panel">
              <div className="yaml-diff-editor-header">
                <span className="yaml-diff-editor-label">Original YAML</span>
                <button 
                  className="yaml-diff-paste-btn" 
                  onClick={handlePasteLeft}
                  title="Paste from clipboard"
                >
                  📋 Paste
                </button>
              </div>
              <YamlDiffEditor
                value={leftYaml}
                onChange={setLeftYaml}
                diffData={diffResult}
                side="left"
                showLineNumbers={showLineNumbers}
              />
            </div>

            <div className="yaml-diff-editor-panel">
              <div className="yaml-diff-editor-header">
                <span className="yaml-diff-editor-label">Modified YAML</span>
                <button 
                  className="yaml-diff-paste-btn" 
                  onClick={handlePasteRight}
                  title="Paste from clipboard"
                >
                  📋 Paste
                </button>
              </div>
              <YamlDiffEditor
                value={rightYaml}
                onChange={setRightYaml}
                diffData={diffResult}
                side="right"
                showLineNumbers={showLineNumbers}
              />
            </div>
          </div>
        ) : (
          <div className="yaml-diff-unified-view">
            <DiffVisualization
              diffResult={diffResult}
              viewMode={viewMode}
              showLineNumbers={showLineNumbers}
            />
          </div>
        )}

        {diffResult && (
          <div className="yaml-diff-summary-section">
            <div className="yaml-diff-summary-stats">
              <span className="yaml-diff-stat yaml-diff-stat-added">
                +{diffResult.filter(line => line.type === 'insert').length} additions
              </span>
              <span className="yaml-diff-stat yaml-diff-stat-deleted">
                -{diffResult.filter(line => line.type === 'delete').length} deletions
              </span>
              <span className="yaml-diff-stat yaml-diff-stat-modified">
                ~{diffResult.filter(line => line.type === 'modify').length} modifications
              </span>
            </div>
            <button 
              className="yaml-diff-copy-btn" 
              onClick={handleCopyDiff}
              title="Copy diff to clipboard"
            >
              📋 Copy Diff
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffComparePage;