import React from "react";

export default function UserPermissionManager({ users, permissions, onChangePermission, currentUserId, ownerId }) {
    const canManage = `${currentUserId}` === `${ownerId}`;

    const getPermissionLabel = (value) => {
        if (value === "edit") return "Can Edit";
        if (value === "view") return "Can View";
        return "No Access";
    };

    const getPermissionClassName = (value) => {
        if (value === "edit") return "is-edit";
        if (value === "view") return "is-view";
        return "is-no-access";
    };

    return (
        <div className="user-permission-manager">
            <h3 className="user-permission-title">Collaborators</h3>
            {!users.length ? (
                <p className="user-permission-empty">No collaborators yet. Search for users to add them.</p>
            ) : (
                <div className="user-permission-list">
                    {users.map((user) => {
                        const userId = user.id || user._id;
                        const permission = permissions[userId] || "no-access";
                        return (
                            <div className="user-permission-item" key={userId}>
                                <div className="user-permission-user">
                                    <strong>{user.username || user.email || userId}</strong>
                                    <span className={`user-permission-badge ${getPermissionClassName(permission)}`}>
                                        {getPermissionLabel(permission)}
                                    </span>
                                </div>
                                <div className="user-permission-control">
                                    {canManage && `${userId}` !== `${ownerId}` ? (
                                        <select
                                            className="user-permission-select"
                                            value={permission}
                                            onChange={(e) => onChangePermission(userId, e.target.value)}
                                        >
                                            <option value="no-access">No Access</option>
                                            <option value="view">View</option>
                                            <option value="edit">Edit</option>
                                        </select>
                                    ) : (
                                        <span className="user-permission-readonly">Owner</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
