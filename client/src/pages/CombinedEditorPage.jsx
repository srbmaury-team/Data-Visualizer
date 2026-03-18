import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";
import UserPermissionManager from "../components/UserPermissionManager";
import { fetchUsersByPrefix } from "../services/userService";
import DiagramViewer from "../components/DiagramViewer";
import SearchPanel from "../components/SearchPanel";
import { useYamlFile } from "../hooks/useYamlFile";
import { useDebounce } from "../hooks/useDebounce";
import yaml from "js-yaml";
import { buildTreeFromYAML, convertToD3Hierarchy } from "../utils/treeBuilder";
import { validateYAML } from "../utils/yamlValidator";
import "./CombinedEditor.css";

const isValidMongoId = (value) => /^[0-9a-fA-F]{24}$/.test(value || "");
const getUserId = (u) => `${u?.id || u?._id || ""}`;

function ShareModal({
  fileData,
  setShowShareModal,
  shareLoading,
  setShareLoading,
  shareError,
  setShareError,
  shareSuccess,
  setShareSuccess,
  user,
  userSearch,
  setUserSearch,
  isUserLoading,
  allUsers,
  permissions,
  handleChangePermission,
}) {
  const [isPublic, setIsPublic] = useState(fileData.isPublic);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsPublic(fileData.isPublic);
  }, [fileData.isPublic]);

  useEffect(() => {
    if (!isPublic) {
      setIsCopied(false);
    }
  }, [isPublic]);

  const handleTogglePublic = async (e) => {
    const nextPublic = e.target.checked;
    const previous = isPublic;
    setIsPublic(nextPublic);
    setShareLoading(true);
    setShareError("");
    setShareSuccess("");
    try {
      const apiService = (await import("../services/apiService")).default;
      const updated = await apiService.shareYamlFile(fileData._id, nextPublic);
      const confirmed = updated?.yamlFile?.isPublic ?? nextPublic;
      setIsPublic(confirmed);
      setShareSuccess(updated.message || "Sharing updated!");
    } catch (err) {
      setIsPublic(previous);
      setShareError(err.message || "Failed to update sharing");
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="share-modal-close" onClick={() => setShowShareModal(false)} aria-label="Close share modal">✕</button>
        <h2 className="share-modal-title">Share this file</h2>
        <p className="share-modal-subtitle">Control public access and user-level permissions from one place.</p>

        <div className="share-toggle-card">
          <label className="share-toggle-label">
            <input
              type="checkbox"
              checked={isPublic}
              disabled={shareLoading}
              onChange={handleTogglePublic}
            />
            <span>
              Make this file public
              <small>Anyone with the link can view this file.</small>
            </span>
          </label>
        </div>

        {isPublic && fileData?.shareId && (
          <div className="share-link-card">
            <span className="share-link-label">Share Link</span>
            <div className="share-link-row">
              <input
                type="text"
                value={`${window.location.origin}/shared/${fileData.shareId}`}
                readOnly
                className="share-link-input"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="share-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/shared/${fileData.shareId}`);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 1200);
                }}
              >
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {getUserId(user) === `${fileData.owner}` && (
          <div className="share-permissions-section">
            <div className="share-user-search-wrap">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="share-user-search"
              />
              {isUserLoading && <div className="share-user-loading">Searching users...</div>}
            </div>
            <UserPermissionManager
              users={allUsers.filter((u) => (u.id || u._id) !== fileData.owner)}
              permissions={permissions}
              onChangePermission={handleChangePermission}
              currentUserId={getUserId(user)}
              ownerId={fileData.owner}
            />
          </div>
        )}
        {shareError && <div className="share-status share-status-error">{shareError}</div>}
        {shareSuccess && <div className="share-status share-status-success">{shareSuccess}</div>}
      </div>
    </div>
  );
}

export default function CombinedEditorPage({
  yamlText,
  setYamlText,
  error,
  validation,
  handleSaveGraph,
  savedGraphs,
  setShowSavedGraphs,
  handleNewFile,
  isAuthenticated,
  user,
  onShowAuth,
  onShowRepositoryImporter,
  onShowVersionHistory,
  onLogout,
}) {
  const navigate = useNavigate();
  const { id: currentFileId } = useParams();
  const previousAuthState = useRef(isAuthenticated);

  const [parsedData, setParsedData] = useState(null);
  const [treeInfo, setTreeInfo] = useState(null);
  const [localError, setLocalError] = useState("");
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [permissions, setPermissions] = useState({});

  const debouncedYamlText = useDebounce(yamlText, 300);
  const debouncedUserSearch = useDebounce(userSearch, 350);
  const { loading: fileLoading, error: fileError, fileData } = useYamlFile(setYamlText, isAuthenticated);

  useEffect(() => {
    if (showShareModal && fileData && getUserId(user) === `${fileData.owner}`) {
      setPermissions(fileData.permissions || {});
      if (!debouncedUserSearch) {
        setAllUsers([]);
        return;
      }
      setIsUserLoading(true);
      fetchUsersByPrefix(debouncedUserSearch)
        .then((users) => setAllUsers(users))
        .catch(() => setAllUsers([]))
        .finally(() => setIsUserLoading(false));
    }
  }, [showShareModal, fileData, user, debouncedUserSearch]);

  const handleChangePermission = async (targetUserId, newPermission) => {
    const updated = { ...permissions, [targetUserId]: newPermission };
    setPermissions(updated);
    setShareLoading(true);
    setShareError("");
    setShareSuccess("");
    try {
      const apiService = (await import("../services/apiService")).default;
      await apiService.setYamlFilePermissions(fileData._id, updated);
      setShareSuccess("Permissions updated!");
    } catch (err) {
      setShareError(err.message || "Failed to update permissions");
    } finally {
      setShareLoading(false);
    }
  };

  useEffect(() => {
    if (fileError && fileError.includes("Invalid file ID format")) {
      navigate("/", { replace: true });
    }
  }, [fileError, navigate]);

  useEffect(() => {
    if (previousAuthState.current && !isAuthenticated && currentFileId) {
      navigate("/combined", { replace: true });
    }
    previousAuthState.current = isAuthenticated;
  }, [isAuthenticated, currentFileId, navigate]);

  useEffect(() => {
    const handleSearchComplete = (event) => {
      const { results, currentIndex } = event.detail;
      setSearchResults(results);
      setCurrentSearchIndex(currentIndex);
    };
    const handleNavigationComplete = (event) => {
      const { currentIndex } = event.detail;
      setCurrentSearchIndex(currentIndex);
    };
    window.addEventListener("diagramSearchComplete", handleSearchComplete);
    window.addEventListener("diagramNavigationComplete", handleNavigationComplete);
    return () => {
      window.removeEventListener("diagramSearchComplete", handleSearchComplete);
      window.removeEventListener("diagramNavigationComplete", handleNavigationComplete);
    };
  }, []);

  const handleSearch = useCallback((term) => {
    if (!term || !term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
    if (window.combinedEditorDiagramSearch) {
      window.combinedEditorDiagramSearch(term);
    }
  }, []);

  const handleSearchNavigation = useCallback((direction) => {
    if (window.combinedEditorDiagramNavigate) {
      window.combinedEditorDiagramNavigate(direction);
    }
  }, []);

  useEffect(() => {
    if (!debouncedYamlText) {
      setParsedData(null);
      setTreeInfo(null);
      setLocalError("");
      return;
    }
    try {
      const result = validateYAML(debouncedYamlText);
      if (result.valid) {
        const parsed = yaml.load(debouncedYamlText);
        const treeData = buildTreeFromYAML(parsed);
        setParsedData(convertToD3Hierarchy(treeData));
        setTreeInfo(treeData.treeInfo);
        setLocalError("");
      } else {
        const errorMessages = result.issues ? result.issues.map((issue) => issue.message) : ["YAML validation failed"];
        setLocalError(errorMessages.join(", "));
        setParsedData(null);
        setTreeInfo(null);
      }
    } catch (err) {
      setLocalError(err.message);
      setParsedData(null);
      setTreeInfo(null);
    }
  }, [debouncedYamlText]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    document.body.classList.add("dragging");
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const newLeftWidth = (e.clientX / window.innerWidth) * 100;
    if (newLeftWidth >= 20 && newLeftWidth <= 80) {
      setLeftWidth(newLeftWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.classList.remove("dragging");
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const canShare = fileData && fileData.owner && getUserId(user) === `${fileData.owner}`;
  const hasValidFileId = isValidMongoId(fileData?._id);
  const candidateUserIds = [`${user?.id || ""}`, `${user?._id || ""}`].filter(Boolean);
  const ownerId = `${fileData?.owner?._id || fileData?.owner || ""}`;
  const isOwner = !!(fileData && candidateUserIds.includes(ownerId));
  const currentPermission = fileData
    ? (candidateUserIds
      .map((id) => fileData.permissions?.[id] || fileData.permissions?.get?.(id))
      .find(Boolean) || "no-access")
    : "no-access";
  const canEditCurrentFile = !!(fileData && (isOwner || currentPermission === "edit"));
  const canSaveGraph = !currentFileId || canEditCurrentFile;

  return (
    <div className="simple-combined-editor">
      <div className="simple-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(currentFileId ? `/editor/${currentFileId}` : "/")}>
            ← Back
          </button>
          <h1>YAML Editor & Visualizer</h1>
          {fileLoading && (
            <span className="file-loading" style={{ color: "#666", fontSize: "14px", marginLeft: "10px" }}>
              📄 Loading file...
            </span>
          )}
          {fileError && (
            <span className="file-error" style={{ color: "#d32f2f", fontSize: "14px", marginLeft: "10px" }}>
              ❌ Error: {fileError}
              <br />
              <span style={{ color: "#b71c1c", fontSize: "12px" }}>[Debug] File ID: {currentFileId}</span>
            </span>
          )}
          {fileData && !fileError && (
            <span className="file-info" style={{ color: "#2e7d32", fontSize: "14px", marginLeft: "10px" }}>
              📁 {fileData.title}
            </span>
          )}
          {treeInfo && <span className="tree-info">{treeInfo.totalNodes} nodes • {treeInfo.maxDepth + 1} levels</span>}
        </div>

        <div className="header-actions">
          <div className="right-controls">
            <button className="repo-import-btn" onClick={onShowRepositoryImporter} title="Import GitHub Repository">
              📂 Import Repo
            </button>
            {currentFileId && (
              <button className="new-file-btn" onClick={() => handleNewFile("/combined")} title="Start new file (clear current)">
                📄 New File
              </button>
            )}
            <button className="save-btn" onClick={handleSaveGraph} disabled={!parsedData || !canSaveGraph} title={canSaveGraph ? "Save current graph" : "View-only access: save disabled"}>💾 Save</button>
            <button className="version-history-btn" onClick={onShowVersionHistory} title="View Version History" disabled={!isAuthenticated}>📜 History</button>
            <button className="saved-btn" onClick={() => setShowSavedGraphs(true)}>📚 Saved ({savedGraphs.length})</button>
            <div className="auth-section">
              {isAuthenticated ? (
                <div className="auth-container">
                  <div className="first-line">
                    <button className="user-name-btn" onClick={() => navigate("/profile")} title="View Profile">
                      Welcome, {user?.username || "User"}!
                    </button>
                    <button className="auth-btn logout-btn" onClick={onLogout}>🚪 Logout</button>
                  </div>
                  <div className="second-line">
                    <button className="auth-btn save-graph-mobile" onClick={handleSaveGraph} title={canSaveGraph ? "Save current graph" : "View-only access: save disabled"} disabled={!canSaveGraph}>💾 Save</button>
                    <button className="auth-btn saved-graphs-mobile" onClick={() => setShowSavedGraphs(true)} title="View saved graphs">📚 Saved ({savedGraphs.length})</button>
                  </div>
                </div>
              ) : (
                <div className="auth-container">
                  <div className="first-line">
                    <button className="auth-btn login-btn" onClick={onShowAuth}>🔐 Login / Sign Up</button>
                  </div>
                  <div className="second-line">
                    <button className="auth-btn save-graph-mobile" onClick={handleSaveGraph} title="Save current graph">💾 Save</button>
                    <button className="auth-btn saved-graphs-mobile disabled" onClick={() => setShowSavedGraphs(true)} title="Login to view saved graphs" disabled>📚 Saved (0)</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(error || localError) && <div className="error-banner">⚠️ {error || localError}</div>}

      {canShare && hasValidFileId && (
        <div style={{ margin: "16px 0", textAlign: "right" }}>
          <button
            className="share-btn"
            style={{ padding: "8px 18px", fontWeight: 600, background: "#1976d2", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}
            onClick={() => setShowShareModal(true)}
          >
            🔗 Share
          </button>
        </div>
      )}

      {canShare && !hasValidFileId && (
        <div style={{ margin: "16px 0", color: "#d32f2f", fontWeight: 500 }}>
          ⚠️ Sharing is disabled: This file has an invalid ID and cannot be shared.
          <br />
          <span style={{ fontSize: 13, color: "#b71c1c" }}>(File IDs must be 24-character hexadecimal strings.)</span>
        </div>
      )}

      {showShareModal && hasValidFileId && (
        <ShareModal
          fileData={fileData}
          setShowShareModal={setShowShareModal}
          shareLoading={shareLoading}
          setShareLoading={setShareLoading}
          shareError={shareError}
          setShareError={setShareError}
          shareSuccess={shareSuccess}
          setShareSuccess={setShareSuccess}
          user={user}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          isUserLoading={isUserLoading}
          allUsers={allUsers}
          permissions={permissions}
          handleChangePermission={handleChangePermission}
        />
      )}

      <div className="split-container">
        <div className="left-panel" style={{ width: `${leftWidth}%` }}>
          {!fileError || !fileError.toLowerCase().includes("permission") ? (
            <YamlEditor
              value={yamlText}
              onChange={setYamlText}
              readOnly={!canEditCurrentFile}
              error={error || localError}
              validation={validation}
            />
          ) : null}
        </div>

        <div className="resizer" onMouseDown={handleMouseDown} />

        <div className="right-panel" style={{ width: `${100 - leftWidth}%` }}>
          <div className="right-panel-container">
            <div className="diagram-area">
              <div className="search-panel-container">
                <SearchPanel
                  onSearch={handleSearch}
                  searchResults={searchResults}
                  currentIndex={currentSearchIndex}
                  onNavigate={handleSearchNavigation}
                />
              </div>
              <div className="diagram-content">
                {parsedData ? (
                  <DiagramViewer data={parsedData} treeInfo={treeInfo} hideSearch />
                ) : (
                  <div className="diagram-placeholder">
                    <div className="placeholder-content">
                      <div className="placeholder-icon">📊</div>
                      <h3>No Visualization Yet</h3>
                      <p>{yamlText ? "Fix YAML errors to see visualization" : "Enter YAML content to see the tree diagram"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}