import React, { useRef, useEffect } from 'react';
import './styles/YamlDiffEditor.css';

const YamlDiffEditor = ({ 
  value, 
  onChange, 
  diffData, 
  side, 
  showLineNumbers = true 
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Auto-resize textarea
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(400, textarea.scrollHeight) + 'px';
    };

    adjustHeight();
    textarea.addEventListener('input', adjustHeight);

    return () => {
      textarea.removeEventListener('input', adjustHeight);
    };
  }, [value]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const getLineClassName = (lineNumber) => {
    if (!diffData) return '';

    const diffLine = diffData.find(d => {
      if (side === 'left') {
        return d.leftLineNumber === lineNumber;
      } else {
        return d.rightLineNumber === lineNumber;
      }
    });

    if (!diffLine) return '';

    switch (diffLine.type) {
      case 'insert':
        return 'yaml-diff-editor-line-added';
      case 'delete':
        return 'yaml-diff-editor-line-deleted';
      case 'modify':
        return 'yaml-diff-editor-line-modified';
      default:
        return '';
    }
  };

  const renderLineNumbers = () => {
    if (!showLineNumbers) return null;

    const lines = value.split('\n');
    return (
      <div className="yaml-diff-editor-line-numbers">
        {lines.map((_, index) => (
          <div 
            key={index + 1} 
            className={`yaml-diff-editor-line-number ${getLineClassName(index + 1)}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    );
  };

  const renderHighlightedContent = () => {
    if (!diffData) return null;

    const lines = value.split('\n');
    return (
      <div className="yaml-diff-editor-highlighted-content">
        {lines.map((line, index) => (
          <div 
            key={index + 1} 
            className={`yaml-diff-editor-highlighted-line ${getLineClassName(index + 1)}`}
          >
            {line || '\u00A0'} {/* Non-breaking space for empty lines */}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="yaml-diff-editor-container">
      <div className="yaml-diff-editor-wrapper">
        {showLineNumbers && renderLineNumbers()}
        
        <div className="yaml-diff-editor-content">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            className="yaml-diff-editor-textarea"
            placeholder={`Paste your ${side === 'left' ? 'original' : 'modified'} YAML here...`}
            spellCheck={false}
          />
          
          {diffData && renderHighlightedContent()}
        </div>
      </div>
      
      {value && (
        <div className="yaml-diff-editor-stats">
          <span>{value.split('\n').length} lines</span>
          <span>{value.length} characters</span>
        </div>
      )}
    </div>
  );
};

export default YamlDiffEditor;