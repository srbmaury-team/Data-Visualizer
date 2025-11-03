import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./styles/ReadmeViewer.css";

export default function ReadmeViewer() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    
    const loadReadme = async () => {
      try {
        // First try to fetch from public directory
        const response = await fetch("/README.md");
        if (response.ok) {
          const text = await response.text();
          // Check if we got HTML instead of markdown (Netlify redirect issue)
          if (text.includes("<!doctype html>") || text.includes("<html")) {
            throw new Error("Received HTML instead of README content");
          }
          if (!cancelled) setContent(text);
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to load README`);
      } catch (err) {
        console.warn("Failed to fetch README:", err);
        if (!cancelled) setError(`Unable to load documentation: ${err.message}`);
      }
    };

    loadReadme();
    
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return (
    <div className="readme-error">
      <h3>📚 Documentation Loading Error</h3>
      <p>{error}</p>
      <p>Please ensure the README.md file is properly deployed and accessible.</p>
    </div>
  );
  
  if (content === null) return (
    <div className="readme-loading">
      <div className="loading-spinner"></div>
      <p>Loading documentation...</p>
    </div>
  );

  return (
    <div className="readme-container">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}