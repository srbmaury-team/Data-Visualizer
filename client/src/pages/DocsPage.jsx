import React from "react";
import { useNavigate } from "react-router-dom";
import ReadmeViewer from "../components/ReadmeViewer";
import { useTheme } from "../hooks/useTheme";

export default function DocsPage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="docs-container">
      <div className="diagram-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back
        </button>
        <button className="back-btn" onClick={toggleDarkMode} title="Toggle dark mode">
          {darkMode ? '☀️' : '🌙'}
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