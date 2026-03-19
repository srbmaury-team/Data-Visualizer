import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";
import AiAssistant from "../components/AiAssistant";
import AnalysisPanel from "../components/AnalysisPanel";
import PresenceBar from "../components/PresenceBar";
import YamlAnalysisService from "../services/yamlAnalysisService";
import { useYamlFile } from "../hooks/useYamlFile";
import { useDebounce } from "../hooks/useDebounce";
import { useCollaboration } from "../hooks/useCollaboration";
import yaml from "js-yaml";

export default function EditorPage({
  yamlText,
  setYamlText,
  handleVisualize,
  error,
  validation,
  handleSaveGraph,
  savedGraphs,
  sharedGraphs,
  setShowSavedGraphs,
  handleNewFile,
  isAuthenticated,
  authLoading,
  user,
  onShowAuth,
  onShowRepositoryImporter,
  onShowVersionHistory,
  onLogout,
}) {
  const navigate = useNavigate();
  const { id: currentFileId } = useParams(); // Get current file ID from URL
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const previousAuthState = useRef(isAuthenticated);
  const yamlFileInputRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleImportYamlFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setYamlText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setYamlText]);

  // Debounce yamlText for analysis to prevent excessive computation
  const debouncedYamlText = useDebounce(yamlText, 500); // 500ms delay for analysis

  // Use the custom hook to load YAML file by ID if present in URL
  const { loading: fileLoading, error: fileError, fileData } = useYamlFile(setYamlText, isAuthenticated, authLoading);

  const handleExportYaml = useCallback(() => {
    const blob = new Blob([yamlText], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileData?.title || 'export') + '.yaml';
    a.click();
    URL.revokeObjectURL(url);
  }, [yamlText, fileData]);

  const [copyLabel, setCopyLabel] = useState('📋 Copy');
  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(yamlText).then(() => {
      setCopyLabel('✅ Copied!');
      setTimeout(() => setCopyLabel('📋 Copy'), 2000);
    });
  }, [yamlText]);

  // Real-time collaboration
  const collabFileId = currentFileId && isAuthenticated ? currentFileId : null;
  const {
    remoteUsers,
    remoteCursors,
    isConnected: collabConnected,
    accessDenied: collabAccessDenied,
    typingUsers,
    handleLocalChange,
    handleCursorChange,
  } = useCollaboration(collabFileId, yamlText, setYamlText, !!collabFileId);

  const handleYamlChange = useCallback((newValue) => {
    setYamlText(newValue);
    if (collabFileId) {
      handleLocalChange(newValue);
    }
  }, [setYamlText, collabFileId, handleLocalChange]);

  const candidateUserIds = [`${user?.id || ''}`, `${user?._id || ''}`].filter(Boolean);
  const editorReadOnly = (() => {
    if (!currentFileId || !fileData) return false;
    const ownerId = `${fileData.owner?._id || fileData.owner || ''}`;
    const isOwner = candidateUserIds.includes(ownerId);
    if (isOwner) return false;

    const permission = candidateUserIds
      .map((id) => fileData.permissions?.[id] || fileData.permissions?.get?.(id))
      .find(Boolean) || 'no-access';

    return permission !== 'edit';
  })();
  const canSaveGraph = !editorReadOnly;

  // Determine if user has no access to this file
  const hasNoAccess = !!(fileError && fileError.includes('Access denied')) || collabAccessDenied;

  // Redirect to home if invalid ID error
  useEffect(() => {
    if (fileError && fileError.includes('Invalid file ID format')) {
      navigate('/', { replace: true });
    }
  }, [fileError, navigate]);

  // Redirect to remove file ID from URL when user logs out
  useEffect(() => {
    // Only redirect if user was previously authenticated and now is not
    if (previousAuthState.current && !isAuthenticated && currentFileId) {
      navigate('/', { replace: true });
    }
    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated, currentFileId, navigate]);  // Memoized analysis that updates when debounced YAML changes

  const analysis = useMemo(() => {
    if (!debouncedYamlText || debouncedYamlText.trim() === '') {
      return null;
    }

    try {
      const parsedYaml = yaml.load(debouncedYamlText);
      return YamlAnalysisService.analyzeYaml(parsedYaml, debouncedYamlText);
    } catch (error) {
      // Return error analysis for invalid YAML
      return {
        complexity: { score: 0, level: 'Invalid', details: [] },
        performance: { score: 0, recommendations: [] },
        bestPractices: { score: 0, suggestions: [] },
        issues: {
          critical: [{
            type: 'YAML Syntax Error',
            message: `Parse error: ${error.message}`,
            severity: 'critical'
          }],
          warnings: [],
          info: []
        },
        summary: {
          overall: 'error',
          message: 'Invalid YAML syntax prevents analysis',
          overallScore: 0,
          recommendations: []
        }
      };
    }
  }, [debouncedYamlText]);

  // Simulate loading for analysis updates (debounced)
  useEffect(() => {
    if (debouncedYamlText && debouncedYamlText.trim() !== '') {
      setAnalysisLoading(true);
      const timer = setTimeout(() => setAnalysisLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [debouncedYamlText]);

  return (
    <div className="editor-container">
      <div className="header compact-header">
        <div className="header-top-bar">
          <div className="header-left">
            <button className="compact-icon-btn" onClick={() => navigate('/')} title="Home">🏠</button>
            <span className="header-title">YAML Visualizer</span>
            {fileData && <span className="header-file-tag hide-mobile">📁 {fileData.title}</span>}
            <button className="compact-icon-btn hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} title="Menu">☰</button>
          </div>

          <div className={`header-center${mobileMenuOpen ? ' mobile-open' : ''}`}>
            <div className="menu-group">
              <div className="dropdown-wrapper">
                <button className="menu-btn" onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}>
                  File ▾
                </button>
                {openMenu === 'file' && (
                  <div className="dropdown-menu" onMouseLeave={() => setOpenMenu(null)}>
                    {currentFileId && (
                      <button onClick={() => { handleNewFile("/"); setOpenMenu(null); }}>📄 New File</button>
                    )}
                    <button onClick={() => { yamlFileInputRef.current?.click(); setOpenMenu(null); }}>📥 Import YAML</button>
                    <button onClick={() => { onShowRepositoryImporter(); setOpenMenu(null); }}>📂 Import Repo</button>
                    <button onClick={() => { handleExportYaml(); setOpenMenu(null); }} disabled={!yamlText}>📤 Export YAML</button>
                    {isAuthenticated && (
                      <>
                        <div className="dropdown-divider" />
                        <button onClick={() => { handleSaveGraph(); setOpenMenu(null); }} disabled={!canSaveGraph}>💾 Save Graph</button>
                        <button onClick={() => { setShowSavedGraphs(true); setOpenMenu(null); }}>📚 My Graphs ({savedGraphs.length + (sharedGraphs?.length || 0)})</button>
                        <button onClick={() => { onShowVersionHistory(); setOpenMenu(null); }}>📜 Version History</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="dropdown-wrapper">
                <button className="menu-btn" onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}>
                  View ▾
                </button>
                {openMenu === 'view' && (
                  <div className="dropdown-menu" onMouseLeave={() => setOpenMenu(null)}>
                    <button onClick={() => {
                      if (currentFileId) navigate(`/combined/${currentFileId}`);
                      else navigate("/combined");
                      setOpenMenu(null);
                    }}>🔗 Combined View</button>
                    <button onClick={() => { setShowAnalysis(!showAnalysis); setOpenMenu(null); }} className={showAnalysis ? 'active' : ''}>🔍 Analysis</button>
                    <button onClick={() => {
                      navigate('/diff', { state: { yamlContent: yamlText, fileName: fileData?.title || 'Current Editor' } });
                      setOpenMenu(null);
                    }}>🔍 Diff Compare</button>
                    <button onClick={() => { navigate("/docs"); setOpenMenu(null); }}>📖 Docs</button>
                  </div>
                )}
              </div>

              <button className="menu-btn primary-btn" onClick={() => handleVisualize(currentFileId)} title="Visualize">
                🎨 Visualize
              </button>
              <button className="menu-btn" onClick={() => setShowAiAssistant(true)} title="AI Assistant">
                🤖 AI
              </button>
            </div>
          </div>

          <div className={`header-right${mobileMenuOpen ? ' mobile-open' : ''}`}>
            {isAuthenticated ? (
              <>
                <span className="user-name clickable-username" onClick={() => navigate('/profile')} title="Go to profile">
                  {user?.username || 'User'}
                </span>
                <button className="compact-icon-btn logout-icon" onClick={onLogout} title="Logout">🚪</button>
              </>
            ) : (
              <button className="menu-btn login-menu-btn" onClick={onShowAuth}>🔐 Login</button>
            )}
          </div>
        </div>

        <input ref={yamlFileInputRef} type="file" accept=".yaml,.yml" style={{ display: 'none' }} onChange={handleImportYamlFile} />

        {fileLoading && <div className="header-status">📄 Loading file...</div>}
        {fileError && <div className="header-status header-status-error">❌ {fileError}</div>}
      </div>

      <div className="editor-layout">
        <div className="editor-main">
          {hasNoAccess ? (
            <div className="access-denied" style={{ padding: '40px', textAlign: 'center', color: '#d32f2f', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', margin: '20px' }}>
              <h2 style={{ margin: '0 0 10px' }}>🚫 Access Denied</h2>
              <p>You do not have permission to view this file.</p>
              <button onClick={() => navigate('/')} style={{ marginTop: '15px', padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
                ← Go Home
              </button>
            </div>
          ) : (
            <>
              {collabFileId && !collabAccessDenied && (
                <PresenceBar
                  users={remoteUsers}
                  typingUsers={typingUsers}
                  isConnected={collabConnected}
                />
              )}
              <YamlEditor
                value={yamlText}
                onChange={handleYamlChange}
                readOnly={editorReadOnly}
                remoteCursors={collabFileId ? remoteCursors : {}}
                onCursorChange={collabFileId ? handleCursorChange : undefined}
                onCopy={handleCopyText}
                copyLabel={copyLabel}
              />
            </>
          )}
          <div className="controls">
            {error && <div className="error">{error}</div>}
            {validation && (
              <div className="validation-panel">
                {validation.issues.length > 0 && (
                  <div className="validation-section errors">
                    <h4>❌ Errors ({validation.issues.length})</h4>
                    {validation.issues.map((issue, idx) => (
                      <div key={idx} className="validation-item error-item">
                        <div className="issue-header">
                          <span className="line-number">Line {issue.line}</span>
                          <span className="issue-type">{issue.type}</span>
                        </div>
                        <div className="issue-message">{issue.message}</div>
                        {issue.suggestion && (
                          <div className="issue-suggestion">
                            💡 Suggestion: <code>{issue.suggestion}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="validation-section warnings">
                    <h4>⚠️ Warnings ({validation.warnings.length})</h4>
                    {validation.warnings.map((warning, idx) => (
                      <div key={idx} className="validation-item warning-item">
                        <div className="issue-header">
                          <span className="line-number">Line {warning.line}</span>
                          <span className="issue-type">{warning.type}</span>
                        </div>
                        <div className="issue-message">{warning.message}</div>
                        {warning.suggestion && (
                          <div className="issue-suggestion">
                            💡 {warning.suggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {validation.valid && validation.warnings.length === 0 && (
                  <div className="validation-success">
                    ✅ YAML is valid! ({validation.stats.nonEmptyLines} lines)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {showAnalysis && (
          <div className="analysis-sidebar">
            <AnalysisPanel
              analysis={analysis}
              isLoading={analysisLoading}
            />
          </div>
        )}
      </div>

      <AiAssistant
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        onYamlGenerated={setYamlText}
        currentYaml={yamlText}
      />
    </div>
  );
}