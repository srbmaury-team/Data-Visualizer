import React, { useState } from "react";
import githubService from "../services/githubService";
import "./styles/RepositoryImporter.css";

export default function RepositoryImporter({ onImport, onClose }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setLoading(true);
    setError("");
    setProgress("Fetching repository information...");

    try {
      // Parse URL first to validate
      const { owner, repo } = githubService.parseGitHubURL(url.trim());
      setProgress(`Analyzing ${owner}/${repo}...`);

      // Process the repository
      const result = await githubService.processRepository(url.trim());

      if (result.success) {
        setProgress("Converting to YAML format...");
        
        // Convert to YAML string
        const yamlString = convertToYamlString(result.yaml);
        
        // Pass results to parent
        onImport({
          yamlText: yamlString,
          analysis: result.analysis,
          repoInfo: result.repoInfo
        });

        // Close modal
        onClose();
      } else {
        setError(result.error || "Failed to process repository");
      }
    } catch (err) {
      setError(err.message || "Failed to import repository");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const convertToYamlString = (yamlObject) => {
    const sanitizeName = (name, isFile = false) => {
      if (isFile) {
        // For files, keep the full name with extension, just replace spaces
        return name.replace(/\s+/g, '-');
      } else {
        // For directories, get the last part and replace spaces
        const lastPart = name.split('/').pop() || name;
        return lastPart.replace(/\s+/g, '-');
      }
    };

    const convertNode = (node, indent = 0) => {
      const spaces = "  ".repeat(indent);
      const safeName = sanitizeName(node.name, node.type === 'file');
      let yaml = `${spaces}- name: ${safeName}\n`;
      
      // Add metadata in the desired order
      if (node.description && indent === 1) {
        yaml += `${spaces}  description: "${node.description}"\n`;
      }
      if (node.language && node.language !== 'Multiple') {
        yaml += `${spaces}  language: ${node.language}\n`;
      }
      if (node.type) {
        yaml += `${spaces}  type: ${node.type}\n`;
      }
      if (node.category) {
        yaml += `${spaces}  category: ${node.category}\n`;
      }
      if (node.framework) {
        yaml += `${spaces}  framework: ${node.framework}\n`;
      }
      if (node.size && (node.type === 'file' ? node.size !== '0B' : true)) {
        yaml += `${spaces}  size: ${node.size}\n`;
      }
      if (node.extension && node.type === 'file') {
        yaml += `${spaces}  extension: ${node.extension}\n`;
      }
      if (node.stars !== undefined && indent === 1) {
        yaml += `${spaces}  stars: ${node.stars}\n`;
      }
      if (node.forks !== undefined && indent === 1) {
        yaml += `${spaces}  forks: ${node.forks}\n`;
      }
      if (node.updated && indent === 1) {
        yaml += `${spaces}  updated: ${node.updated}\n`;
      }
      if (node.url && indent === 1) {
        yaml += `${spaces}  url: ${node.url}\n`;
      }
      
      // Add children/nodes
      if (node.children && node.children.length > 0) {
        // Use 'children' for directories and 'nodes' for mixed content
        const childrenKey = node.type === 'directory' || indent === 1 ? 'children' : 'nodes';
        yaml += `${spaces}  ${childrenKey}:\n`;
        
        node.children.forEach(child => {
          yaml += convertNode(child, indent + 2);
        });
      }
      
      return yaml;
    };

    // Start with root project info
    const rootName = sanitizeName(yamlObject.name, false);
    let yaml = `# Repository Structure: ${yamlObject.name}\n`;
    yaml += `# Generated from GitHub repository analysis\n\n`;
    yaml += `name: ${rootName}\n`;
    
    if (yamlObject.description) {
      yaml += `description: "${yamlObject.description}"\n`;
    }
    if (yamlObject.language && yamlObject.language !== 'Multiple') {
      yaml += `language: ${yamlObject.language}\n`;
    }
    yaml += `type: repository\n`;
    if (yamlObject.stars !== undefined) {
      yaml += `stars: ${yamlObject.stars}\n`;
    }
    if (yamlObject.forks !== undefined) {
      yaml += `forks: ${yamlObject.forks}\n`;
    }
    if (yamlObject.updated) {
      yaml += `updated: ${yamlObject.updated}\n`;
    }
    if (yamlObject.url) {
      yaml += `url: ${yamlObject.url}\n`;
    }
    
    // Add children
    if (yamlObject.children && yamlObject.children.length > 0) {
      yaml += `children:\n`;
      yamlObject.children.forEach(child => {
        yaml += convertNode(child, 1);
      });
    }
    
    return yaml;
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setError(""); // Clear error when user types
  };

  const getUrlPlaceholder = () => {
    return "https://github.com/owner/repository or owner/repository";
  };

  const handleExampleClick = (exampleUrl) => {
    setUrl(exampleUrl);
    setError("");
  };

  return (
    <div className="repository-importer-overlay">
      <div className="repository-importer-modal">
        <div className="modal-header">
          <h3>📂 Import GitHub Repository</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="url-input-section">
            <label htmlFor="repo-url">Repository URL:</label>
            <input
              id="repo-url"
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder={getUrlPlaceholder()}
              disabled={loading}
              className={error ? "error" : ""}
            />
            
            <div className="examples">
              <p>Examples:</p>
              <div className="example-buttons">
                <button 
                  type="button"
                  onClick={() => handleExampleClick("facebook/react")}
                  disabled={loading}
                  className="example-btn"
                >
                  facebook/react
                </button>
                <button 
                  type="button"
                  onClick={() => handleExampleClick("vercel/next.js")}
                  disabled={loading}
                  className="example-btn"
                >
                  vercel/next.js
                </button>
                <button 
                  type="button"
                  onClick={() => handleExampleClick("microsoft/vscode")}
                  disabled={loading}
                  className="example-btn"
                >
                  microsoft/vscode
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <p className="progress-text">{progress}</p>
              <div className="loading-tips">
                <p><strong>💡 What we're analyzing:</strong></p>
                <ul>
                  <li>📁 Directory structure and file organization</li>
                  <li>💻 Programming languages and frameworks</li>
                  <li>📊 File types and sizes</li>
                  <li>🎯 Project type and recommendations</li>
                </ul>
              </div>
            </div>
          )}

          <div className="info-section">
            <h4>🔍 Repository Analysis Features:</h4>
            <ul>
              <li><strong>Smart Classification:</strong> Automatically categorizes files by type</li>
              <li><strong>Language Detection:</strong> Identifies programming languages</li>
              <li><strong>Structure Analysis:</strong> Provides insights and recommendations</li>
              <li><strong>Interactive Visualization:</strong> Navigate through your repo structure</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="cancel-btn" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="import-btn" 
            onClick={handleImport} 
            disabled={loading || !url.trim()}
          >
            {loading ? "Analyzing..." : "Import Repository"}
          </button>
        </div>
      </div>
    </div>
  );
}