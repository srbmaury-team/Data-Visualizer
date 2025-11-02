import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DepthFilter, NodeTypeFilter, PropertyFilter, SearchFilter } from './filters';
import './styles/NodeFilterPanel.css';

export default function NodeFilterPanel({ 
  data, 
  onFilterChange, 
  isVisible, 
  onToggle,
  // Search functionality from old SearchPanel
  onSearch,
  searchResults = [],
  currentSearchIndex = 0,
  onNavigateSearch
}) {
  const [filters, setFilters] = useState({
    depth: { enabled: false, min: 0, max: 50 },
    nodeType: { enabled: false, types: [] },
    properties: { enabled: false, properties: [] },
    search: { 
      enabled: false, 
      query: '', 
      caseSensitive: false, 
      useRegex: false, 
      searchIn: 'all' 
    }
  });

  // Legacy search state for backward compatibility
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchSection, setShowSearchSection] = useState(true);

  // Extract available node types and calculate max depth from data
  const { availableTypes, maxDepth, nodes } = useMemo(() => {
    if (!data) return { availableTypes: new Set(), maxDepth: 50, nodes: [] };

    const types = new Set();
    const nodesList = [];
    let depth = 0;

    const traverse = (node, currentDepth = 0) => {
      depth = Math.max(depth, currentDepth);
      nodesList.push(node);
      
      // Determine node type
      if (node.children && node.children.length > 0) {
        types.add('parent');
      } else {
        types.add('leaf');
      }

      if (node.properties && Object.keys(node.properties).length > 1) {
        types.add('with-properties');
      } else {
        types.add('simple');
      }

      if (node.children) {
        node.children.forEach(child => traverse(child, currentDepth + 1));
      }
    };

    traverse(data);
    return { 
      availableTypes: types, 
      maxDepth: Math.max(depth, 1), 
      nodes: nodesList 
    };
  }, [data]);

  // Update filter max depth when data changes
  useEffect(() => {
    setFilters(prevFilters => ({
      ...prevFilters,
      depth: {
        ...prevFilters.depth,
        max: Math.max(maxDepth, prevFilters.depth.max)
      }
    }));
  }, [maxDepth]);

  // Handle legacy search functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      const newSearchEnabled = searchTerm.trim().length > 0;
      
      setFilters(prevFilters => {
        if (prevFilters.search.enabled !== newSearchEnabled || 
            prevFilters.search.query !== searchTerm) {
          const newFilters = {
            ...prevFilters,
            search: {
              ...prevFilters.search,
              enabled: newSearchEnabled,
              query: searchTerm
            }
          };
          
          if (onFilterChange) {
            onFilterChange(newFilters);
          }
          return newFilters;
        }
        return prevFilters;
      });
      
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, onFilterChange]);

  const handleFilterChange = useCallback((filterType, newFilter) => {
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        [filterType]: newFilter
      };
      
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
      return newFilters;
    });
  }, [onFilterChange]);

  const resetFilters = useCallback(() => {
    const resetFilters = {
      depth: { enabled: false, min: 0, max: maxDepth },
      nodeType: { enabled: false, types: [] },
      properties: { enabled: false, properties: [] },
      search: { 
        enabled: false, 
        query: '', 
        caseSensitive: false, 
        useRegex: false, 
        searchIn: 'all' 
      }
    };
    setFilters(resetFilters);
    setSearchTerm('');
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  }, [maxDepth, onFilterChange]);

  const getActiveFilterCount = () => {
    let count = Object.values(filters).filter(filter => filter.enabled).length;
    if (searchTerm.trim()) count++;
    return count;
  };

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        search: { ...prevFilters.search, enabled: false, query: '' }
      };
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
      return newFilters;
    });
    if (onSearch) onSearch('');
  }, [onFilterChange, onSearch]);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && onNavigateSearch) {
      if (e.shiftKey) {
        onNavigateSearch("prev");
      } else {
        onNavigateSearch("next");
      }
    } else if (e.key === "Escape") {
      handleSearchClear();
    }
  };

  if (!isVisible) {
    return (
      <button 
        className="filter-toggle-btn"
        onClick={onToggle}
        title="Open node filters"
      >
        🔍 Filters {getActiveFilterCount() > 0 && <span className="filter-count">{getActiveFilterCount()}</span>}
      </button>
    );
  }

  return (
    <div className="node-filter-panel">
      <div className="filter-header">
        <h3>🔍 Node Filters</h3>
        <div className="filter-header-actions">
          <button 
            className={`search-toggle-btn ${showSearchSection ? 'active' : ''}`}
            onClick={() => setShowSearchSection(!showSearchSection)}
            title={showSearchSection ? 'Hide Search' : 'Show Search'}
          >
            🔎
          </button>
          <button className="reset-filters-btn" onClick={resetFilters}>
            Reset
          </button>
          <button className="close-filter-btn" onClick={onToggle}>
            ✕
          </button>
        </div>
      </div>

      <div className="filter-content">
        {/* Legacy Search Section */}
        {showSearchSection && (
          <div className="filter-section search-section">
            <div className="filter-section-header">
              <label>
                <input
                  type="checkbox"
                  checked={showSearchSection}
                  onChange={() => setShowSearchSection(!showSearchSection)}
                />
                🔎 Search Nodes
              </label>
            </div>
            <div className="search-content">
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchTerm && (
                  <button className="search-clear" onClick={handleSearchClear}>
                    ✕
                  </button>
                )}
              </div>
              
              <div className="keyboard-shortcuts">
                <div className="shortcuts-title">⌨️ Keyboard Shortcuts:</div>
                <div className="shortcuts-list">
                  <span className="shortcut"><kbd>Enter</kbd> Next result</span>
                  <span className="shortcut"><kbd>Shift+Enter</kbd> Previous result</span>
                  <span className="shortcut"><kbd>Esc</kbd> Clear search</span>
                </div>
              </div>
              
              {searchResults && searchResults.length > 0 && (
                <div className="search-results">
                  <div className="search-navigation">
                    <span className="search-count">
                      {currentSearchIndex + 1} of {searchResults.length}
                    </span>
                    <div className="search-nav-buttons">
                      <button 
                        onClick={() => onNavigateSearch('prev')}
                        disabled={searchResults.length === 0}
                        title="Previous (Shift+Enter)"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => onNavigateSearch('next')}
                        disabled={searchResults.length === 0}
                        title="Next (Enter)"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modular Filter Components */}
        <DepthFilter
          filter={filters.depth}
          maxDepth={maxDepth}
          onFilterChange={(newFilter) => handleFilterChange('depth', newFilter)}
        />

        <NodeTypeFilter
          filter={filters.nodeType}
          availableTypes={availableTypes}
          onFilterChange={(newFilter) => handleFilterChange('nodeType', newFilter)}
        />

        <PropertyFilter
          filter={filters.properties}
          nodes={nodes}
          onFilterChange={(newFilter) => handleFilterChange('properties', newFilter)}
        />

        <SearchFilter
          filter={filters.search}
          onFilterChange={(newFilter) => handleFilterChange('search', newFilter)}
        />
      </div>
    </div>
  );
}