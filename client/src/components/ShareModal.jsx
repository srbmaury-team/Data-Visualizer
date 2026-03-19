import React, { useState, useEffect } from "react";
import UserPermissionManager from "./UserPermissionManager";

const getUserId = (u) => `${u?.id || u?._id || ""}`;

export default function ShareModal({
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
            setShareError(err.message || "Failed to update sharing");
            setIsPublic(previous);
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
