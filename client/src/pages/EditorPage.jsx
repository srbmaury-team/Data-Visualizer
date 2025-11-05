import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";
import AiAssistant from "../components/AiAssistant";
import AnalysisPanel from "../components/AnalysisPanel";
import YamlAnalysisService from "../services/yamlAnalysisService";
import { useYamlFile } from "../hooks/useYamlFile";
import { useDebounce } from "../hooks/useDebounce";
import yaml from "js-yaml";

export default function EditorPage({
  yamlText,
  setYamlText,
  handleVisualize,
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
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const previousAuthState = useRef(isAuthenticated);

  // Debounce yamlText for analysis to prevent excessive computation
  const debouncedYamlText = useDebounce(yamlText, 500); // 500ms delay for analysis

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
      navigate('/', { replace: true });
    }
    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated, currentFileId, navigate]);  // Memoized analysis that updates when debounced YAML changes
  const analysis = useMemo(() => {
    if (!debouncedYamlText || debouncedYamlText.trim() === '') {
      return null;
    }

    try {
      const parsedYaml = yaml.load(debouncedYamlText);
      return YamlAnalysisService.analyzeYaml(parsedYaml, debouncedYamlText);
    } catch (error) {
      // Return error analysis for invalid YAML
      return {
        complexity: { score: 0, level: 'Invalid', details: [] },
        performance: { score: 0, recommendations: [] },
        bestPractices: { score: 0, suggestions: [] },
        issues: { 
          critical: [{ 
            type: 'YAML Syntax Error', 
            message: `Parse error: ${error.message}`, 
            severity: 'critical' 
          }], 
          warnings: [], 
          info: [] 
        },
        summary: { 
          overall: 'error', 
          message: 'Invalid YAML syntax prevents analysis',
          overallScore: 0,
          recommendations: []
        }
      };
    }
  }, [debouncedYamlText]);

  // Simulate loading for analysis updates (debounced)
  useEffect(() => {
    if (debouncedYamlText && debouncedYamlText.trim() !== '') {
      setAnalysisLoading(true);
      const timer = setTimeout(() => setAnalysisLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [debouncedYamlText]);

  return (
    <div className="editor-container">
      <div className="header">
        <div className="auth-section">
          {isAuthenticated ? (
            <>
              <span 
                className="user-name clickable-username" 
                onClick={() => navigate('/profile')}
                title="Go to profile"
              >
                Welcome, {user?.username || 'User'}!
              </span>
              <button className="auth-btn logout-btn" onClick={onLogout}>
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <span className="guest-name">Welcome, Guest!</span>
              <button className="auth-btn login-btn" onClick={onShowAuth}>
                🔐 Login / Sign Up
              </button>
            </>
          )}
        </div>
        <div className="header-main">
          <h1>🧩 YAML Diagram Visualizer</h1>
          <p>Convert YAML hierarchy into interactive tree diagrams</p>
          {fileLoading && (
            <div className="file-loading" style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
              📄 Loading file...
            </div>
          )}
          {fileError && (
            <div className="file-error" style={{ padding: '10px', textAlign: 'center', color: '#d32f2f', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '4px', margin: '10px 0' }}>
              ❌ Error loading file: {fileError}
            </div>
          )}
          {fileData && (
            <div className="file-info" style={{ padding: '10px', textAlign: 'center', color: '#2e7d32', backgroundColor: '#e8f5e8', border: '1px solid #c8e6c9', borderRadius: '4px', margin: '10px 0' }}>
              📁 Loaded: {fileData.title}
            </div>
          )}
          <div className="header-actions">
            <button 
              className="repo-import-btn" 
              onClick={onShowRepositoryImporter}
              title="Import GitHub Repository"
            >
              📂 Import Repo
            </button>
            <button className="combined-editor-btn" onClick={() => {
              if (currentFileId) {
                navigate(`/combined/${currentFileId}`);
              } else {
                navigate("/combined");
              }
            }} title="Combined Editor & Visualizer">
              🔗 Combined View
            </button>
            {currentFileId && (
              <button className="new-file-btn" onClick={() => handleNewFile("/")} title="Start new file (clear current)">
                📄 New File
              </button>
            )}
            {isAuthenticated && (
              <>
                <button className="save-graph-btn" onClick={handleSaveGraph} title="Save current graph">
                  💾 Save Graph
                </button>
                <button className="version-history-btn" onClick={onShowVersionHistory} title="View version history">
                  📜 History
                </button>
                <button className="my-graphs-btn" onClick={() => setShowSavedGraphs(true)} title="View saved graphs">
                  📚 My Graphs ({savedGraphs.length})
                </button>
              </>
            )}
            <button className="docs-btn" onClick={() => navigate("/docs")} title="Open project README">
              📖 Docs
            </button>
            <button className="ai-btn" onClick={() => setShowAiAssistant(true)} title="AI YAML Assistant">
              🤖 AI Assistant
            </button>
            <button className="visualize-btn" onClick={() => handleVisualize(currentFileId)} title="Create Interactive Diagram">
              🎨 Visualize
            </button>
            <button 
              className={`analysis-btn ${showAnalysis ? 'active' : ''}`} 
              onClick={() => setShowAnalysis(!showAnalysis)} 
              title="Toggle Analysis Panel"
            >
              🔍 Analysis
            </button>
          </div>
        </div>
      </div>
      
      <div className="editor-layout">
        <div className="editor-main">
          <YamlEditor value={yamlText} onChange={setYamlText} />
          <div className="controls">
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
        
        {showAnalysis && (
          <div className="analysis-sidebar">
            <AnalysisPanel 
              analysis={analysis} 
              isLoading={analysisLoading}
            />
          </div>
        )}
      </div>
      
      <AiAssistant
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        onYamlGenerated={setYamlText}
        currentYaml={yamlText}
      />
    </div>
  );
}