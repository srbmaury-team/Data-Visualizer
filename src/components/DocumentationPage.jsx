import React from "react";
import { useNavigate } from "react-router-dom";
import ReadmeViewer from "./ReadmeViewer";

export default function DocumentationPage() {
  const navigate = useNavigate();

  return (
    <div className="docs-container">
      <div className="diagram-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back
        </button>
        <h2>Project Documentation</h2>
        <div className="subtitle">
          Viewing README.md rendered with Markdown
        </div>
      </div>
      <ReadmeViewer />
    </div>
  );
}