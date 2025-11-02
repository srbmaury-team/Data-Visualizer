import React, { useState } from "react";
import "./styles/SaveGraphModal.css";

const SaveGraphModal = ({ isOpen, onClose, onSave, existingGraphs }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [conflictingGraph, setConflictingGraph] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    // Check for existing graph with same title
    const existingGraph = existingGraphs.find(graph => 
      graph.title.toLowerCase() === title.trim().toLowerCase()
    );

    if (existingGraph) {
      setConflictingGraph(existingGraph);
      setShowOverwriteConfirm(true);
      return;
    }

    // No conflict, proceed with save
    handleSave();
  };

  const handleSave = () => {
    const graphData = {
      title: title.trim(),
      description: description.trim(),
      isPublic,
      isUpdate: conflictingGraph !== null
    };

    if (conflictingGraph) {
      graphData.existingId = conflictingGraph.id;
    }

    onSave(graphData);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setIsPublic(false);
    setShowOverwriteConfirm(false);
    setConflictingGraph(null);
    onClose();
  };

  const handleOverwriteConfirm = () => {
    setShowOverwriteConfirm(false);
    handleSave();
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
    setConflictingGraph(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="save-graph-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💾 Save Graph</h2>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {showOverwriteConfirm ? (
          <div className="overwrite-confirm">
            <div className="confirm-icon">⚠️</div>
            <h3>Graph Already Exists</h3>
            <p>
              A graph titled "<strong>{title}</strong>" already exists. 
              Do you want to overwrite it?
            </p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={handleOverwriteCancel}>
                Cancel
              </button>
              <button className="overwrite-btn" onClick={handleOverwriteConfirm}>
                Overwrite
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="save-form">
            <div className="form-group">
              <label htmlFor="graph-title">
                <span className="label-text">Title *</span>
                <span className="label-desc">Give your graph a descriptive name</span>
              </label>
              <input
                id="graph-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., My Project Structure"
                required
                autoFocus
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="graph-description">
                <span className="label-text">Description</span>
                <span className="label-desc">Optional details about this graph</span>
              </label>
              <textarea
                id="graph-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this diagram represents..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="graph-public" className="checkbox-label">
                <input
                  id="graph-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="checkbox-text">
                  <span className="label-text">Make this graph public</span>
                  <span className="label-desc">Others will be able to view and use this graph</span>
                </span>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={!title.trim()}>
                💾 Save Graph
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SaveGraphModal;