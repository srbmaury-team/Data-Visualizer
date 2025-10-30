import React, { useState, useEffect, useCallback } from 'react';
import './NodeFilterPanel.css';

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
    depth: { enabled: false, min: 0, max: 50 }, // Higher default to accommodate any tree
    nodeType: { enabled: false, types: [] },
    properties: { enabled: false, hasProperties: true },
    search: { enabled: false, term: '' }
  });

  const [availableTypes, setAvailableTypes] = useState(new Set());
  const [maxDepth, setMaxDepth] = useState(50); // Higher default
  
  // Search functionality state
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchSection, setShowSearchSection] = useState(true);

  // Search functionality with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Update search filter when search term changes
      setFilters(prevFilters => {
        const newSearchEnabled = searchTerm.trim().length > 0;
        const currentSearchEnabled = prevFilters.search.enabled;
        const currentSearchTerm = prevFilters.search.term;
        
        // Only update if something actually changed
        if (currentSearchEnabled !== newSearchEnabled || currentSearchTerm !== searchTerm) {
          const newFilters = {
            ...prevFilters,
            search: {
              enabled: newSearchEnabled,
              term: searchTerm
            }
          };
          // Call onFilterChange with new filters
          if (onFilterChange) {
            onFilterChange(newFilters);
          }
          return newFilters;
        }
        return prevFilters;
      });
      
      // Also call the search handler for highlighting
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, onFilterChange]);

  // Analyze the data to get available node types and max depth
  useEffect(() => {
    if (!data) return;

    const types = new Set();
    let depth = 0;

    const traverse = (node, currentDepth = 0) => {
      depth = Math.max(depth, currentDepth);
      
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
    setAvailableTypes(types);
    setMaxDepth(depth);
    
    // Update filter max depth when data changes
    setFilters(prevFilters => ({
      ...prevFilters,
      depth: {
        ...prevFilters.depth,
        max: Math.max(depth, prevFilters.depth.max) // Use the larger value
      }
    }));
  }, [data]);

  const handleFilterChange = useCallback((filterType, key, value) => {
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        [filterType]: {
          ...prevFilters[filterType],
          [key]: value
        }
      };
      // Call onFilterChange with the new filters
      console.log('🎛️ Filter changed:', filterType, key, value, '→', newFilters);
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
      properties: { enabled: false, hasProperties: true },
      search: { enabled: false, term: '' }
    };
    setFilters(resetFilters);
    setSearchTerm(''); // Also reset the search term state
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  }, [maxDepth, onFilterChange]);

  const getActiveFilterCount = () => {
    let count = Object.values(filters).filter(filter => filter.enabled).length;
    if (searchTerm.trim()) count++; // Add search as active filter
    return count;
  };

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    // Clear the search filter
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        search: { enabled: false, term: '' }
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

  // Always initialize filters, regardless of visibility
  useEffect(() => {
    if (onFilterChange) {
      console.log('🔧 Initializing filters:', filters);
      onFilterChange(filters);
    }
  }, []); // Empty dependency array - only run once on mount

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
        {/* Search Section */}
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
              
              {/* Keyboard Shortcuts */}
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

        {/* Depth Filter */}
        <div className="filter-section">
          <div className="filter-section-header">
            <label>
              <input
                type="checkbox"
                checked={filters.depth.enabled}
                onChange={(e) => handleFilterChange('depth', 'enabled', e.target.checked)}
              />
              Filter by Depth
            </label>
          </div>
          {filters.depth.enabled && (
            <div className="filter-controls">
              <div className="range-control">
                <label>Min: {filters.depth.min}</label>
                <input
                  type="range"
                  min="0"
                  max={maxDepth}
                  value={filters.depth.min}
                  onChange={(e) => handleFilterChange('depth', 'min', parseInt(e.target.value))}
                />
              </div>
              <div className="range-control">
                <label>Max: {filters.depth.max}</label>
                <input
                  type="range"
                  min="0"
                  max={maxDepth}
                  value={filters.depth.max}
                  onChange={(e) => handleFilterChange('depth', 'max', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Node Type Filter */}
        <div className="filter-section">
          <div className="filter-section-header">
            <label>
              <input
                type="checkbox"
                checked={filters.nodeType.enabled}
                onChange={(e) => handleFilterChange('nodeType', 'enabled', e.target.checked)}
              />
              Filter by Type
            </label>
          </div>
          {filters.nodeType.enabled && (
            <div className="filter-controls">
              <div className="checkbox-group">
                {['parent', 'leaf', 'with-properties', 'simple'].map(type => (
                  availableTypes.has(type) && (
                    <label key={type} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.nodeType.types.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...filters.nodeType.types, type]
                            : filters.nodeType.types.filter(t => t !== type);
                          handleFilterChange('nodeType', 'types', newTypes);
                        }}
                      />
                      {type.replace('-', ' ')}
                    </label>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Properties Filter */}
        <div className="filter-section">
          <div className="filter-section-header">
            <label>
              <input
                type="checkbox"
                checked={filters.properties.enabled}
                onChange={(e) => handleFilterChange('properties', 'enabled', e.target.checked)}
              />
              Filter by Properties
            </label>
          </div>
          {filters.properties.enabled && (
            <div className="filter-controls">
              <label className="radio-label">
                <input
                  type="radio"
                  name="properties"
                  checked={filters.properties.hasProperties}
                  onChange={() => handleFilterChange('properties', 'hasProperties', true)}
                />
                Has properties
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="properties"
                  checked={!filters.properties.hasProperties}
                  onChange={() => handleFilterChange('properties', 'hasProperties', false)}
                />
                No properties
              </label>
            </div>
          )}
        </div>

        {/* Search Filter */}
        <div className="filter-section">
          <div className="filter-section-header">
            <label>
              <input
                type="checkbox"
                checked={filters.search.enabled}
                onChange={(e) => handleFilterChange('search', 'enabled', e.target.checked)}
              />
              Search in Names
            </label>
          </div>
          {filters.search.enabled && (
            <div className="filter-controls">
              <input
                type="text"
                placeholder="Search node names..."
                value={filters.search.term}
                onChange={(e) => handleFilterChange('search', 'term', e.target.value)}
                className="search-input"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}