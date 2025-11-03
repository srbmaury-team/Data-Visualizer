import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";
import AiAssistant from "../components/AiAssistant";
import AnalysisPanel from "../components/AnalysisPanel";
import YamlAnalysisService from "../services/yamlAnalysisService";
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
  isAuthenticated,
  user,
  onShowAuth,
  onLogout,
}) {
  const navigate = useNavigate();
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Memoized analysis that updates when YAML changes
  const analysis = useMemo(() => {
    if (!yamlText || yamlText.trim() === '') {
      return null;
    }

    try {
      const parsedYaml = yaml.load(yamlText);
      return YamlAnalysisService.analyzeYaml(parsedYaml, yamlText);
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
  }, [yamlText]);

  // Simulate loading for analysis updates
  useEffect(() => {
    if (yamlText && yamlText.trim() !== '') {
      setAnalysisLoading(true);
      const timer = setTimeout(() => setAnalysisLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [yamlText]);

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
          <div className="header-actions">
            <button className="combined-editor-btn" onClick={() => navigate("/combined")} title="Combined Editor & Visualizer">
              🔗 Combined View
            </button>
            {isAuthenticated && (
              <>
                <button className="save-graph-btn" onClick={handleSaveGraph} title="Save current graph">
                  💾 Save Graph
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
            <button className="visualize-btn" onClick={handleVisualize} title="Create Interactive Diagram">
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