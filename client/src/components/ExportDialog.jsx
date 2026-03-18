import React from "react";

export default function ExportDialog({ open, onClose, onExport }) {
    if (!open) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 36,
                minWidth: 340,
                boxShadow: '0 12px 48px 0 rgba(0,0,0,0.28), 0 1.5px 8px 0 rgba(0,0,0,0.10)',
                border: '2px solid #e2e8f0',
                zIndex: 10000,
                animation: 'fadeInModal 0.25s',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 22, color: '#1e293b' }}>Export Diagram</h3>
                <p style={{ color: '#444', marginBottom: 28, fontSize: 16 }}>Choose the format to export your diagram:</p>
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 12 }}>
                    <button onClick={() => onExport('png')} style={{ padding: '12px 36px', borderRadius: 8, border: '1.5px solid #2563eb', background: '#f1f5fb', fontWeight: 600, fontSize: 17, color: '#2563eb', cursor: 'pointer', boxShadow: '0 1px 4px #2563eb22' }}>PNG</button>
                    <button onClick={() => onExport('svg')} style={{ padding: '12px 36px', borderRadius: 8, border: '1.5px solid #64748b', background: '#f8fafc', fontWeight: 600, fontSize: 17, color: '#334155', cursor: 'pointer', boxShadow: '0 1px 4px #64748b22' }}>SVG</button>
                </div>
                <button onClick={onClose} style={{ marginTop: 18, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}>Cancel</button>
            </div>
            {/* Modal fade-in animation */}
            <style>{`
                @keyframes fadeInModal {
                    from { opacity: 0; transform: translateY(30px) scale(0.98); }
                    to { opacity: 1; transform: none; }
                }
            `}</style>
        </div>
    );
}
