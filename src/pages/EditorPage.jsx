import React from "react";
import { useNavigate } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";

export default function EditorPage({
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

  return (
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
          <button className="docs-btn" onClick={() => navigate("/docs")} title="Open project README">
            📖 Docs
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
  );
}