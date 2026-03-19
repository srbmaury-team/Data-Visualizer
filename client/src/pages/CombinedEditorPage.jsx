import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import YamlEditor from "../components/YamlEditor";
import UserPermissionManager from "../components/UserPermissionManager";
import PresenceBar from "../components/PresenceBar";
import { fetchUsersByPrefix } from "../services/userService";
import DiagramViewer from "../components/DiagramViewer";
import SearchPanel from "../components/SearchPanel";
import { useYamlFile } from "../hooks/useYamlFile";
import { useDebounce } from "../hooks/useDebounce";
import { useCollaboration } from "../hooks/useCollaboration";
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
  existingCollaborators,
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
            {(() => {
              // Merge existing collaborators with search results, deduplicating
              const existingIds = new Set(existingCollaborators.map((c) => `${c._id || c.id}`));
              const searchUsers = allUsers.filter((u) => {
                const uid = `${u.id || u._id}`;
                return uid !== fileData.owner && !existingIds.has(uid);
              });
              const combinedUsers = [
                ...existingCollaborators.filter((c) => `${c._id || c.id}` !== fileData.owner),
                ...searchUsers,
              ];
              return (
                <UserPermissionManager
                  users={combinedUsers}
                  permissions={permissions}
                  onChangePermission={handleChangePermission}
                  currentUserId={getUserId(user)}
                  ownerId={fileData.owner}
                />
              );
            })()}
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
  const [existingCollaborators, setExistingCollaborators] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [permissions, setPermissions] = useState({});

  const debouncedYamlText = useDebounce(yamlText, 300);
  const debouncedUserSearch = useDebounce(userSearch, 350);
  const { loading: fileLoading, error: fileError, fileData } = useYamlFile(setYamlText, isAuthenticated, authLoading);

  // Real-time collaboration — only active when viewing a saved file and authenticated
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

  // Wrap setYamlText to also notify the collaboration hook
  const handleYamlChange = useCallback((newValue) => {
    setYamlText(newValue);
    if (collabFileId) {
      handleLocalChange(newValue);
    }
  }, [setYamlText, collabFileId, handleLocalChange]);

  // Load existing collaborators when the share modal opens
  useEffect(() => {
    if (showShareModal && fileData && getUserId(user) === `${fileData.owner}`) {
      import("../services/apiService").then(({ default: apiService }) => {
        apiService.getFileCollaborators(fileData._id)
          .then((data) => {
            const collabs = data.collaborators || [];
            setExistingCollaborators(collabs);
            // Build initial permissions from collaborators
            const permMap = { ...(fileData.permissions || {}) };
            collabs.forEach((c) => {
              const uid = c._id || c.id;
              if (!permMap[uid]) permMap[uid] = c.permission;
            });
            setPermissions(permMap);
          })
          .catch(() => setExistingCollaborators([]));
      });
    }
  }, [showShareModal, fileData, user]);

  useEffect(() => {
    if (showShareModal && fileData && getUserId(user) === `${fileData.owner}`) {
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
  const canEditCurrentFile = !!(fileData ? (isOwner || currentPermission === "edit") : !currentFileId);
  const canSaveGraph = !currentFileId || canEditCurrentFile;

  // Determine if user has no access to this file
  const hasNoAccess = !!(fileError && fileError.includes('Access denied')) || collabAccessDenied;

  return (
    <div className="simple-combined-editor">
      <div className="simple-header">
        <div className="combined-auth-section">
          {isAuthenticated ? (
            <>
              <button className="user-name-btn clickable-username" onClick={() => navigate("/profile")} title="View Profile">
                Welcome, {user?.username || "User"}!
              </button>
              <button className="auth-btn logout-btn" onClick={onLogout}>🚪 Logout</button>
            </>
          ) : (
            <>
              <span className="guest-name">Welcome, Guest!</span>
              <button className="auth-btn login-btn" onClick={onShowAuth}>🔐 Login / Sign Up</button>
            </>
          )}
        </div>
        <div className="combined-header-main">
          <div className="combined-header-top">
            <button className="back-btn" onClick={() => navigate(currentFileId ? `/editor/${currentFileId}` : "/")}>
              ← Back
            </button>
            <h1>YAML Editor & Visualizer</h1>
          </div>
          {fileLoading && (
            <div className="combined-file-status">📄 Loading file...</div>
          )}
          {fileError && (
            <div className="combined-file-status combined-file-error">
              ❌ Error: {fileError}
            </div>
          )}
          {fileData && !fileError && (
            <div className="combined-file-status combined-file-info">
              📁 {fileData.title}
            </div>
          )}
          {treeInfo && <span className="tree-info">{treeInfo.totalNodes} nodes • {treeInfo.maxDepth + 1} levels</span>}
          <div className="combined-header-actions">
            <button className="repo-import-btn" onClick={onShowRepositoryImporter} title="Import GitHub Repository">
              📂 Import Repo
            </button>
            {currentFileId && (
              <button className="new-file-btn" onClick={() => handleNewFile("/combined")} title="Start new file (clear current)">
                📄 New File
              </button>
            )}
            <button className="save-graph-btn" onClick={handleSaveGraph} disabled={!parsedData || !canSaveGraph} title={canSaveGraph ? "Save current graph" : "View-only access: save disabled"}>💾 Save</button>
            <button className="version-history-btn" onClick={onShowVersionHistory} title="View Version History" disabled={!isAuthenticated}>📜 History</button>
            <button className="my-graphs-btn" onClick={() => setShowSavedGraphs(true)}>📚 Saved ({savedGraphs.length + (sharedGraphs?.length || 0)})</button>
          </div>
        </div>
      </div>

      {(error || localError) && !hasNoAccess && <div className="error-banner">⚠️ {error || localError}</div>}

      {collabFileId && !collabAccessDenied && !hasNoAccess && (
        <PresenceBar
          users={remoteUsers}
          typingUsers={typingUsers}
          isConnected={collabConnected}
        />
      )}

      {hasNoAccess ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', margin: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ margin: '0 0 10px' }}>🚫 Access Denied</h2>
          <p>You do not have permission to view this file.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '15px', padding: '8px 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
            ← Go Home
          </button>
        </div>
      ) : (
        <>
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
              existingCollaborators={existingCollaborators}
              permissions={permissions}
              handleChangePermission={handleChangePermission}
            />
          )}

          <div className="split-container">
            <div className="left-panel" style={{ width: `${leftWidth}%` }}>
              <YamlEditor
                value={yamlText}
                onChange={handleYamlChange}
                readOnly={!canEditCurrentFile}
                error={error || localError}
                validation={validation}
                remoteCursors={collabFileId ? remoteCursors : {}}
                onCursorChange={collabFileId ? handleCursorChange : undefined}
              />
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
        </>
      )}
    </div>
  );
}