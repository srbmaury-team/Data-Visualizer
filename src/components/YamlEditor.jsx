import React, { useRef, useState, useEffect } from "react";
import "./YamlEditor.css";

export default function YamlEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const guidesRef = useRef(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    setLineCount(value.split('\n').length);
  }, [value]);

  const handleScroll = (e) => {
    if (lineNumbersRef.current) {
      const scrollTop = e.target.scrollTop;
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    if (guidesRef.current) {
      guidesRef.current.style.transform = `translate(-${e.target.scrollLeft}px, -${e.target.scrollTop}px)`;
    }
  };

  const renderIndentGuides = () => {
    const lines = value.split('\n');
    const guides = [];
    const charWidth = 8.4;
    const lineHeight = 22.4;
    
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
            stroke="#d4af37"
            strokeWidth="1"
            opacity="0.3"
          />
        );
      }
    });
    
    return { guides, svgWidth, svgHeight };
  };

  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const textBefore = value.substring(0, selectionStart);
    const textAfter = value.substring(selectionEnd);

    // Handle Tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const newValue = textBefore + "  " + textAfter;
      onChange(newValue);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      }, 0);
    }
    
    // Handle Enter key for auto-indentation
    else if (e.key === "Enter") {
      e.preventDefault();
      
      // Get the current line
      const currentLineStart = textBefore.lastIndexOf("\n") + 1;
      const currentLine = textBefore.substring(currentLineStart);
      
      // Count leading spaces
      const leadingSpaces = currentLine.match(/^\s*/)[0];
      
      // Check if current line ends with ':'
      const extraIndent = currentLine.trim().endsWith(":") ? "  " : "";
      
      const newValue = textBefore + "\n" + leadingSpaces + extraIndent + textAfter;
      onChange(newValue);
      
      // Set cursor position after the indentation
      setTimeout(() => {
        const newPos = selectionStart + 1 + leadingSpaces.length + extraIndent.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      }, 0);
    }
  };

  return (
    <div className="yaml-editor-wrapper">
      <div className="editor-toolbar">
        <span className="toolbar-label">📝 YAML Editor</span>
        <span className="toolbar-hint">Use Tab for indentation • Auto-indent on Enter</span>
      </div>
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
          <textarea
            ref={textareaRef}
            className="yaml-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            placeholder="# Enter your YAML here..."
          />
        </div>
      </div>
    </div>
  );
}
