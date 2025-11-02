import React, { useRef, useState, useEffect, useCallback } from "react";
import "./styles/YamlEditor.css";

export default function YamlEditor({ value, onChange, readOnly = false }) {
  const textareaRef = useRef(null);
  const highlighterRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const guidesRef = useRef(null);
  const [lineCount, setLineCount] = useState(1);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const safeValue = value || '';
    setLineCount(safeValue.split('\n').length);
    updateSyntaxHighlighting();
  }, [value]);

  // Find matches for search
  useEffect(() => {
    const safeValue = value || '';
    if (searchTerm) {
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const foundMatches = [];
      let match;
      while ((match = regex.exec(safeValue)) !== null) {
        foundMatches.push({
          index: match.index,
          length: match[0].length,
          text: match[0]
        });
      }
      setMatches(foundMatches);
      setCurrentMatchIndex(0);
    } else {
      setMatches([]);
      setCurrentMatchIndex(0);
    }
  }, [searchTerm, value, matchCase]);

  const updateSyntaxHighlighting = useCallback(() => {
    if (!highlighterRef.current) return;

    const safeValue = value || '';
    const lines = safeValue.split('\n');
    const highlightedLines = lines.map((line, index) => {
      // YAML syntax highlighting patterns
      let highlightedLine = line;

      // Highlight YAML keys (text before colon)
      highlightedLine = highlightedLine.replace(
        /^(\s*)([^:\s#][^:#]*?)(\s*:)(\s*)(.*)$/,
        (match, indent, key, colon, space, val) => {
          const highlightedKey = `<span class="yaml-key">${key}</span>`;
          const highlightedColon = `<span class="yaml-colon">${colon}</span>`;
          
          // Highlight different value types
          let highlightedValue = val;
          if (val.trim()) {
            // String values in quotes
            if (val.match(/^['"].*['"]$/)) {
              highlightedValue = `<span class="yaml-string">${val}</span>`;
            }
            // Numbers
            else if (val.match(/^\s*-?\d+(\.\d+)?\s*$/)) {
              highlightedValue = `<span class="yaml-number">${val}</span>`;
            }
            // Booleans
            else if (val.match(/^\s*(true|false|yes|no|on|off)\s*$/i)) {
              highlightedValue = `<span class="yaml-boolean">${val}</span>`;
            }
            // Arrays/Lists
            else if (val.trim().startsWith('[') && val.trim().endsWith(']')) {
              highlightedValue = `<span class="yaml-array">${val}</span>`;
            }
            // Regular values
            else {
              highlightedValue = `<span class="yaml-value">${val}</span>`;
            }
          }
          
          return `${indent}${highlightedKey}${highlightedColon}${space}${highlightedValue}`;
        }
      );

      // Highlight comments
      highlightedLine = highlightedLine.replace(
        /(#.*)$/,
        '<span class="yaml-comment">$1</span>'
      );

      // Highlight list items
      highlightedLine = highlightedLine.replace(
        /^(\s*)(- )(.*)$/,
        (match, indent, dash, content) => {
          return `${indent}<span class="yaml-list-dash">${dash}</span>${content}`;
        }
      );

      return highlightedLine;
    });

    // Add search highlighting
    let finalContent = highlightedLines.join('\n');
    if (searchTerm && matches.length > 0) {
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      let matchIndex = 0;
      finalContent = finalContent.replace(regex, (match) => {
        const isCurrentMatch = matchIndex === currentMatchIndex;
        matchIndex++;
        return `<span class="search-highlight ${isCurrentMatch ? 'current-match' : ''}">${match}</span>`;
      });
    }

    highlighterRef.current.innerHTML = finalContent;
  }, [value, searchTerm, matches, currentMatchIndex, matchCase]);

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.target.scrollTop;
    }
    if (highlighterRef.current) {
      highlighterRef.current.scrollTop = e.target.scrollTop;
      highlighterRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (guidesRef.current) {
      guidesRef.current.style.transform = `translate(-${e.target.scrollLeft}px, -${e.target.scrollTop}px)`;
    }
  };

  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Ctrl+F for search
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      setShowSearchReplace(true);
      return;
    }

    // Ctrl+H for search and replace
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault();
      setShowSearchReplace(true);
      return;
    }

    // Escape to close search
    if (e.key === 'Escape' && showSearchReplace) {
      setShowSearchReplace(false);
      return;
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const { selectionStart } = textarea;
      const safeValue = value || '';
      const lines = safeValue.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      const leadingSpaces = currentLine.match(/^\s*/)?.[0] || '';
      
      let extraIndent = '';
      if (currentLine.trim().endsWith(':')) {
        extraIndent = '  ';
      }
      
      const newValue = safeValue.substring(0, selectionStart) + '\n' + leadingSpaces + extraIndent + safeValue.substring(selectionStart);
      onChange(newValue);
      
      setTimeout(() => {
        const newPos = selectionStart + 1 + leadingSpaces.length + extraIndent.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      }, 0);
    }

    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = textarea;
      const safeValue = value || '';
      
      if (selectionStart === selectionEnd) {
        // Insert 2 spaces
        const newValue = safeValue.substring(0, selectionStart) + '  ' + safeValue.substring(selectionStart);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        }, 0);
      }
    }
  };

  const findNext = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
    }
  };

  const findPrevious = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  const replaceOne = () => {
    if (matches.length > 0 && currentMatchIndex < matches.length) {
      const match = matches[currentMatchIndex];
      const safeValue = value || '';
      const newValue = safeValue.substring(0, match.index) + replaceTerm + safeValue.substring(match.index + match.length);
      onChange(newValue);
    }
  };

  const replaceAll = () => {
    if (searchTerm) {
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      const safeValue = value || '';
      const newValue = safeValue.replace(regex, replaceTerm);
      onChange(newValue);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    updateSyntaxHighlighting();
  }, [updateSyntaxHighlighting]);

  // Generate indent guides
  const renderIndentGuides = () => {
    const safeValue = value || '';
    const lines = safeValue.split('\n');
    const guides = [];
    const charWidth = 8.4;
    const lineHeight = 21;
    
    // Calculate dimensions
    const svgHeight = lines.length * lineHeight;
    const maxIndent = Math.max(0, ...lines.map(line => {
      const spaces = line.match(/^\s*/)?.[0].length || 0;
      return Math.floor(spaces / 2);
    }));
    const svgWidth = maxIndent * 2 * charWidth + 500;
    
    lines.forEach((line, index) => {
      const spaces = line.match(/^\s*/)?.[0].length || 0;
      const indentLevel = Math.floor(spaces / 2);
      
      for (let level = 1; level <= indentLevel; level++) {
        const x = level * 2 * charWidth;
        const y = index * lineHeight;
        
        guides.push(
          <line
            key={`${index}-${level}`}
            x1={x}
            y1={y}
            x2={x}
            y2={y + lineHeight}
            stroke="#e1e5e9"
            strokeWidth="1"
            opacity="0.6"
          />
        );
      }
    });
    
    return { guides, svgWidth, svgHeight };
  };

  return (
    <div className="yaml-editor-wrapper">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">📝 YAML Editor</span>
          {readOnly ? <span>Read-only</span> : <span className="toolbar-hint">Auto saved to Local Storage</span>}
        </div>
        <div className="toolbar-right">
          <button 
            className="search-toggle-btn"
            onClick={() => setShowSearchReplace(!showSearchReplace)}
            title="Search & Replace (Ctrl+F)"
          >
            🔍 Search
          </button>
        </div>
      </div>

      {showSearchReplace && (
        <div className="search-replace-panel">
          <div className="search-row">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={findPrevious} disabled={matches.length === 0} title="Previous">↑</button>
            <button onClick={findNext} disabled={matches.length === 0} title="Next">↓</button>
            <span className="match-count">
              {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0/0'}
            </span>
            <label className="match-case-label">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
              />
              Match case
            </label>
          </div>
          <div className="replace-row">
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="replace-input"
            />
            <button onClick={replaceOne} disabled={matches.length === 0}>Replace</button>
            <button onClick={replaceAll} disabled={matches.length === 0}>Replace All</button>
            <button onClick={() => setShowSearchReplace(false)} className="close-search">✕</button>
          </div>
        </div>
      )}

      <div className="editor-with-lines">
        <div ref={lineNumbersRef} className="line-numbers">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <div className="editor-text-container">
          {(() => {
            const { guides, svgWidth, svgHeight } = renderIndentGuides();
            return (
              <svg 
                ref={guidesRef}
                className="indent-guides-svg"
                width={svgWidth}
                height={svgHeight}
              >
                {guides}
              </svg>
            );
          })()}
          <div 
            ref={highlighterRef}
            className="syntax-highlighter"
          />
          <textarea
            ref={textareaRef}
            className="yaml-textarea"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            placeholder="# Enter your YAML here..."
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}