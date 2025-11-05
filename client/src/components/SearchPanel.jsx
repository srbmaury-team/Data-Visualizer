import React, { useState, useEffect } from "react";
import "./styles/SearchPanel.css";

export default function SearchPanel({ onSearch, searchResults, currentIndex, onNavigate, onExpandedChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        onSearch(searchTerm);
      } else {
        onSearch("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  useEffect(() => {
    // Notify parent of expanded state changes
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }
  }, [isExpanded, onExpandedChange]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        onNavigate("prev");
      } else {
        onNavigate("next");
      }
    } else if (e.key === "Escape") {
      handleClear();
    }
  };

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Clear search when closing the panel
    if (!newExpandedState) {
      handleClear();
    }
  };

  return (
    <div className={`search-panel ${isExpanded ? "expanded" : "collapsed"}`}>
      <button
        className="search-toggle"
        onClick={handleToggleExpanded}
        title={isExpanded ? "Hide search" : "Show search"}
      >
        🔍 {isExpanded ? "Hide" : "Search"}
      </button>

      {isExpanded && (
        <div className="search-content">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {searchTerm && (
              <button className="clear-btn" onClick={handleClear} title="Clear (Esc)">
                ✕
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <div className="result-count">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                {searchResults.length > 1 && ` (${currentIndex + 1}/${searchResults.length})`}
              </div>
              
              {searchResults.length > 1 && (
                <div className="navigation-buttons">
                  <button
                    className="nav-btn"
                    onClick={() => onNavigate("prev")}
                    title="Previous (Shift+Enter)"
                  >
                    ↑
                  </button>
                  <button
                    className="nav-btn"
                    onClick={() => onNavigate("next")}
                    title="Next (Enter)"
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
          )}

          {searchTerm && searchResults.length === 0 && (
            <div className="no-results">No matches found</div>
          )}

          <div className="search-hints">
            <div className="hint-item">
              <kbd>Enter</kbd> Next result
            </div>
            <div className="hint-item">
              <kbd>Shift+Enter</kbd> Previous
            </div>
            <div className="hint-item">
              <kbd>Esc</kbd> Clear search
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

