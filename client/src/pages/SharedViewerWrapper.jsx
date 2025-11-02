import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SharedViewerPage from "./SharedViewerPage";
import apiService from "../services/apiService";

export default function SharedViewerWrapper() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [yamlText, setYamlText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedYaml = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await apiService.getSharedYamlFile(shareId);
        
        if (response.yamlFile) {
          setYamlText(response.yamlFile.content || "");
        } else {
          setError("Shared file not found");
        }
      } catch (err) {
        console.error("Error fetching shared YAML:", err);
        if (err.response?.status === 404) {
          setError("Shared file not found");
        } else if (err.response?.status === 403) {
          setError("Access denied - this file is private");
        } else {
          setError("Failed to load shared file");
        }
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedYaml();
    } else {
      setError("Invalid share ID");
      setLoading(false);
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error && !yamlText) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">❌</div>
          <h2>Unable to Load Shared Content</h2>
          <p>{error}</p>
          <button 
            className="back-btn"
            onClick={() => navigate("/")}
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <SharedViewerPage 
      yamlText={yamlText}
      error={error}
    />
  );
}