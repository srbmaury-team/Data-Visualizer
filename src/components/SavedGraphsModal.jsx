import React from "react";

export default function SavedGraphsModal({ 
  showSavedGraphs, 
  setShowSavedGraphs, 
  savedGraphs, 
  handleLoadGraph, 
  handleDeleteGraph 
}) {
  if (!showSavedGraphs) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowSavedGraphs(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 My Saved Graphs</h2>
          <button className="close-modal-btn" onClick={() => setShowSavedGraphs(false)}>✕</button>
        </div>
        <div className="modal-body">
          {savedGraphs.length === 0 ? (
            <div className="empty-state">
              <p>📭 No saved graphs yet</p>
              <p className="empty-hint">Save your current graph using the "💾 Save Graph" button</p>
            </div>
          ) : (
            <div className="graphs-list">
              {savedGraphs.map(graph => (
                <div key={graph.id} className="graph-item">
                  <div className="graph-info">
                    <h3>{graph.name}</h3>
                    <p className="graph-date">
                      {new Date(graph.createdAt).toLocaleDateString()} at {new Date(graph.createdAt).toLocaleTimeString()}
                    </p>
                    <p className="graph-preview">
                      {graph.yamlText.split('\n').slice(0, 2).join('\n')}...
                    </p>
                  </div>
                  <div className="graph-actions">
                    <button className="load-btn" onClick={() => handleLoadGraph(graph)}>📂 Load</button>
                    <button className="delete-btn" onClick={() => handleDeleteGraph(graph.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}