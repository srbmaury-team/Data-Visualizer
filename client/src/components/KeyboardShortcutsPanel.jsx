import React, { useEffect } from "react";
import "./styles/KeyboardShortcutsPanel.css";

const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const mod = isMac ? "⌘" : "Ctrl";

const EDITOR_SHORTCUTS = [
    { keys: `${mod} + S`, action: "Save graph" },
    { keys: `${mod} + O`, action: "Import YAML file" },
    { keys: `${mod} + Shift + K`, action: "Import JSON file" },
    { keys: `${mod} + Shift + E`, action: "Export as YAML" },
    { keys: `${mod} + Shift + X`, action: "Export as JSON" },
    { keys: `${mod} + Shift + Y`, action: "Toggle analysis panel" },
    { keys: `${mod} + Shift + L`, action: "Toggle combined/editor view" },
    { keys: `${mod} + Shift + P`, action: "Toggle AI assistant" },
    { keys: `${mod} + /`, action: "Show keyboard shortcuts" },
];

const COMBINED_SHORTCUTS = [
    { keys: `${mod} + S`, action: "Save graph" },
    { keys: `${mod} + O`, action: "Import YAML file" },
    { keys: `${mod} + Shift + K`, action: "Import JSON file" },
    { keys: `${mod} + Shift + E`, action: "Export as YAML" },
    { keys: `${mod} + Shift + X`, action: "Export as JSON" },
    { keys: `${mod} + Shift + L`, action: "Switch to editor view" },
    { keys: `${mod} + /`, action: "Show keyboard shortcuts" },
];

const EDITOR_SHORTCUTS_LIST = [
    { keys: "Tab", action: "Indent (2 spaces)" },
    { keys: "Enter", action: "New line with auto-indent" },
    { keys: `${mod} + F`, action: "Search in editor" },
];

const DIAGRAM_SHORTCUTS = [
    { keys: `${mod} + E`, action: "Export diagram as PNG" },
    { keys: "Scroll", action: "Zoom in/out" },
    { keys: "Drag", action: "Pan diagram" },
];

export default function KeyboardShortcutsPanel({ onClose, mode = "editor" }) {
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const globalShortcuts = mode === "combined" ? COMBINED_SHORTCUTS : EDITOR_SHORTCUTS;

    return (
        <div className="shortcuts-overlay" onClick={onClose}>
            <div className="shortcuts-panel" onClick={(e) => e.stopPropagation()}>
                <div className="shortcuts-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button className="shortcuts-close" onClick={onClose}>✕</button>
                </div>

                <div className="shortcuts-body">
                    <div className="shortcuts-section">
                        <h3>Global</h3>
                        <div className="shortcuts-grid">
                            {globalShortcuts.map((s, i) => (
                                <div className="shortcut-row" key={i}>
                                    <kbd>{s.keys}</kbd>
                                    <span>{s.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="shortcuts-section">
                        <h3>Editor</h3>
                        <div className="shortcuts-grid">
                            {EDITOR_SHORTCUTS_LIST.map((s, i) => (
                                <div className="shortcut-row" key={i}>
                                    <kbd>{s.keys}</kbd>
                                    <span>{s.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {mode === "combined" && (
                        <div className="shortcuts-section">
                            <h3>Diagram</h3>
                            <div className="shortcuts-grid">
                                {DIAGRAM_SHORTCUTS.map((s, i) => (
                                    <div className="shortcut-row" key={i}>
                                        <kbd>{s.keys}</kbd>
                                        <span>{s.action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
