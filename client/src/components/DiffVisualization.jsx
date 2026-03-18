import React, { useEffect, useRef } from 'react';
import DiffComputer from '../utils/diffComputer';
import './styles/DiffVisualization.css';

const DiffVisualization = ({
  diffResult,
  viewMode = 'unified',
  showLineNumbers = true
}) => {
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const syncSourceRef = useRef(null);
  const syncRafRef = useRef(null);

  useEffect(() => {
    const leftEl = leftPanelRef.current;
    const rightEl = rightPanelRef.current;

    if (viewMode !== 'side-by-side' || !leftEl || !rightEl) {
      return () => { };
    }

    const syncScroll = (sourceEl, targetEl, sourceKey) => {
      if (syncSourceRef.current && syncSourceRef.current !== sourceKey) return;

      syncSourceRef.current = sourceKey;

      if (syncRafRef.current) {
        cancelAnimationFrame(syncRafRef.current);
      }

      const nextTop = sourceEl.scrollTop;
      const nextLeft = sourceEl.scrollLeft;

      syncRafRef.current = requestAnimationFrame(() => {
        targetEl.scrollTop = nextTop;
        targetEl.scrollLeft = nextLeft;
        syncSourceRef.current = null;
        syncRafRef.current = null;
      });
    };

    const onLeftScroll = () => syncScroll(leftEl, rightEl, 'left');
    const onRightScroll = () => syncScroll(rightEl, leftEl, 'right');

    leftEl.addEventListener('scroll', onLeftScroll, { passive: true });
    rightEl.addEventListener('scroll', onRightScroll, { passive: true });

    return () => {
      leftEl.removeEventListener('scroll', onLeftScroll);
      rightEl.removeEventListener('scroll', onRightScroll);
      if (syncRafRef.current) {
        cancelAnimationFrame(syncRafRef.current);
        syncRafRef.current = null;
      }
      syncSourceRef.current = null;
    };
  }, [viewMode, diffResult]);

  const getPaneMeta = (diff, pane) => {
    if (diff.type === 'equal') {
      return { marker: ' ', markerClass: 'equal', missing: false, title: 'Unchanged' };
    }

    if (diff.type === 'modify') {
      return { marker: '~', markerClass: 'modify', missing: false, title: 'Modified on both sides' };
    }

    if (pane === 'left') {
      if (diff.type === 'delete') {
        return { marker: '-', markerClass: 'delete', missing: false, title: 'Removed from Original' };
      }
      return { marker: '∅', markerClass: 'missing', missing: true, title: 'Only exists in Modified' };
    }

    if (diff.type === 'insert') {
      return { marker: '+', markerClass: 'insert', missing: false, title: 'Added in Modified' };
    }

    return { marker: '∅', markerClass: 'missing', missing: true, title: 'Only exists in Original' };
  };

  if (!diffResult || diffResult.length === 0) {
    return (
      <div className="yaml-diff-visualization yaml-diff-visualization-empty">
        <div className="yaml-diff-empty-state">
          <p>🔍 Compare two YAML files to see differences</p>
          <p>Enter content in both editors and click "Compare" to get started</p>
        </div>
      </div>
    );
  }

  const stats = DiffComputer.getDiffStats(diffResult);

  const renderUnifiedView = () => {
    return (
      <div className="yaml-diff-unified-view">
        <div className="yaml-diff-view-header">
          <h3 className="yaml-diff-view-title">Unified Diff View</h3>
          <div className="yaml-diff-legend">
            <span className="yaml-diff-legend-item yaml-diff-legend-added">+ Added</span>
            <span className="yaml-diff-legend-item yaml-diff-legend-deleted">- Deleted</span>
            <span className="yaml-diff-legend-item yaml-diff-legend-modified">~ Modified</span>
          </div>
        </div>

        <div className="yaml-diff-view-content">
          {diffResult.map((diff, index) => {
            return (
              <div key={index} className={`yaml-diff-line yaml-diff-line-${diff.type}`}>
                {showLineNumbers && (
                  <div className="yaml-diff-line-numbers">
                    <span className="yaml-diff-left-line-num">
                      {diff.leftLineNumber || ''}
                    </span>
                    <span className="yaml-diff-right-line-num">
                      {diff.rightLineNumber || ''}
                    </span>
                  </div>
                )}

                <div className="yaml-diff-line-content">
                  {diff.type === 'equal' && (
                    <div className="yaml-diff-unchanged-line">
                      <span className="yaml-diff-marker"> </span>
                      <span className="yaml-diff-source-tag yaml-diff-source-tag-both">Both</span>
                      <span className="yaml-diff-line-text">{diff.leftLine || '\u00A0'}</span>
                    </div>
                  )}

                  {diff.type === 'delete' && (
                    <div className="yaml-diff-deleted-line">
                      <span className="yaml-diff-marker">-</span>
                      <span className="yaml-diff-source-tag yaml-diff-source-tag-original">Original</span>
                      <span className="yaml-diff-line-text">{diff.leftLine}</span>
                    </div>
                  )}

                  {diff.type === 'insert' && (
                    <div className="yaml-diff-added-line">
                      <span className="yaml-diff-marker">+</span>
                      <span className="yaml-diff-source-tag yaml-diff-source-tag-modified">Modified</span>
                      <span className="yaml-diff-line-text">{diff.rightLine}</span>
                    </div>
                  )}

                  {diff.type === 'modify' && (
                    <>
                      <div className="yaml-diff-deleted-line">
                        <span className="yaml-diff-marker">-</span>
                        <span className="yaml-diff-source-tag yaml-diff-source-tag-original">Original</span>
                        <span className="yaml-diff-line-text">{diff.leftLine}</span>
                      </div>
                      <div className="yaml-diff-added-line">
                        <span className="yaml-diff-marker">+</span>
                        <span className="yaml-diff-source-tag yaml-diff-source-tag-modified">Modified</span>
                        <span className="yaml-diff-line-text">{diff.rightLine}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSideBySideView = () => {
    return (
      <div className="yaml-diff-side-by-side-view">
        <div className="yaml-diff-view-header">
          <h3 className="yaml-diff-view-title">Side-by-Side Comparison</h3>
        </div>

        <div className="yaml-diff-panels">
          <div className="yaml-diff-panel yaml-diff-left-panel">
            <div className="yaml-diff-panel-header">Original</div>
            <div className="yaml-diff-panel-content" ref={leftPanelRef}>
              {diffResult.map((diff, index) => {
                const paneMeta = getPaneMeta(diff, 'left');
                return (
                  <div key={index} className={`yaml-diff-line yaml-diff-line-${diff.type} yaml-diff-pane-left`}>
                    {showLineNumbers && (
                      <span className="yaml-diff-line-number">
                        {diff.leftLineNumber || ''}
                      </span>
                    )}
                    <span className={`yaml-diff-side-marker yaml-diff-side-marker-${paneMeta.markerClass}`} title={paneMeta.title}>
                      {paneMeta.marker}
                    </span>
                    <span className={`yaml-diff-line-content ${paneMeta.missing ? 'yaml-diff-line-missing' : ''}`}>
                      {paneMeta.missing ? '∅' : (diff.leftLine || '\u00A0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="yaml-diff-panel yaml-diff-right-panel">
            <div className="yaml-diff-panel-header">Modified</div>
            <div className="yaml-diff-panel-content" ref={rightPanelRef}>
              {diffResult.map((diff, index) => {
                const paneMeta = getPaneMeta(diff, 'right');
                return (
                  <div key={index} className={`yaml-diff-line yaml-diff-line-${diff.type} yaml-diff-pane-right`}>
                    {showLineNumbers && (
                      <span className="yaml-diff-line-number">
                        {diff.rightLineNumber || ''}
                      </span>
                    )}
                    <span className={`yaml-diff-side-marker yaml-diff-side-marker-${paneMeta.markerClass}`} title={paneMeta.title}>
                      {paneMeta.marker}
                    </span>
                    <span className={`yaml-diff-line-content ${paneMeta.missing ? 'yaml-diff-line-missing' : ''}`}>
                      {paneMeta.missing ? '∅' : (diff.rightLine || '\u00A0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="yaml-diff-visualization">
      <div className="yaml-diff-stats">
        <div className="yaml-diff-stats-grid">
          <div className="yaml-diff-stat-item yaml-diff-stat-added">
            <span className="yaml-diff-stat-number">{stats.additions}</span>
            <span className="yaml-diff-stat-label">Added</span>
          </div>
          <div className="yaml-diff-stat-item yaml-diff-stat-deleted">
            <span className="yaml-diff-stat-number">{stats.deletions}</span>
            <span className="yaml-diff-stat-label">Deleted</span>
          </div>
          <div className="yaml-diff-stat-item yaml-diff-stat-modified">
            <span className="yaml-diff-stat-number">{stats.modifications}</span>
            <span className="yaml-diff-stat-label">Modified</span>
          </div>
          <div className="yaml-diff-stat-item yaml-diff-stat-unchanged">
            <span className="yaml-diff-stat-number">{stats.unchanged}</span>
            <span className="yaml-diff-stat-label">Unchanged</span>
          </div>
        </div>
      </div>

      {viewMode === 'unified' ? renderUnifiedView() : renderSideBySideView()}
    </div>
  );
};

export default DiffVisualization;