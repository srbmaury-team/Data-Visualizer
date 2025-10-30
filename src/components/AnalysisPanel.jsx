import React from 'react';
import './AnalysisPanel.css';

const AnalysisPanel = ({ analysis, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="analysis-panel">
        <div className="analysis-header">
          <h3>🔍 YAML Analysis</h3>
          <div className="loading-spinner"></div>
        </div>
        <div className="analysis-loading">Analyzing your YAML structure...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="analysis-panel">
        <div className="analysis-header">
          <h3>🔍 YAML Analysis</h3>
        </div>
        <div className="analysis-empty">
          Enter YAML content to see intelligent insights and recommendations.
        </div>
      </div>
    );
  }

  const { complexity, performance, bestPractices, issues, summary } = analysis;

  const getScoreColor = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'warning';
    return 'critical';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <h3>🔍 YAML Analysis</h3>
        <div className={`overall-status ${summary.overall}`}>
          {summary.overall === 'excellent' && '✅'}
          {summary.overall === 'good' && '👍'}
          {summary.overall === 'needs-improvement' && '📝'}
          {summary.overall === 'needs-attention' && '⚠️'}
          {summary.overall === 'error' && '❌'}
        </div>
      </div>

      {/* Summary Section */}
      <div className="analysis-section summary-section">
        <div className="summary-content">
          <div className="summary-message">{summary.message}</div>
          <div className="overall-score">
            Overall Score: <span className={getScoreColor(summary.overallScore)}>
              {summary.overallScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Top Recommendations */}
      {summary.recommendations && summary.recommendations.length > 0 && (
        <div className="analysis-section recommendations-section">
          <h4>🎯 Top Recommendations</h4>
          <div className="recommendations-list">
            {summary.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation ${rec.priority}`}>
                <div className="rec-priority">{rec.priority}</div>
                <div className="rec-content">
                  <div className="rec-message">{rec.message}</div>
                  <div className="rec-action">{rec.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Cards */}
      <div className="analysis-section scores-section">
        <h4>📊 Analysis Scores</h4>
        <div className="score-cards">
          <div className="score-card">
            <div className="score-header">
              <span className="score-icon">🔧</span>
              <span className="score-title">Complexity</span>
            </div>
            <div className={`score-value ${getScoreColor(complexity.score)}`}>
              {complexity.score}/100
            </div>
            <div className="score-level">{complexity.level}</div>
          </div>

          <div className="score-card">
            <div className="score-header">
              <span className="score-icon">⚡</span>
              <span className="score-title">Performance</span>
            </div>
            <div className={`score-value ${getScoreColor(performance.score)}`}>
              {performance.score}/100
            </div>
            <div className="score-level">
              {performance.recommendations?.length || 0} issues
            </div>
          </div>

          <div className="score-card">
            <div className="score-header">
              <span className="score-icon">✨</span>
              <span className="score-title">Best Practices</span>
            </div>
            <div className={`score-value ${getScoreColor(bestPractices.score)}`}>
              {bestPractices.score}/100
            </div>
            <div className="score-level">
              {bestPractices.suggestions?.length || 0} suggestions
            </div>
          </div>
        </div>
      </div>

      {/* Complexity Details */}
      {complexity.details && complexity.details.length > 0 && (
        <div className="analysis-section complexity-section">
          <h4>🏗️ Structure Metrics</h4>
          <div className="complexity-details">
            {complexity.details.map((detail, index) => (
              <div key={index} className="complexity-item">
                {detail}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues Section */}
      {(issues.critical.length > 0 || issues.warnings.length > 0 || issues.info.length > 0) && (
        <div className="analysis-section issues-section">
          <h4>🚨 Issues & Warnings</h4>
          
          {issues.critical.map((issue, index) => (
            <div key={`critical-${index}`} className="issue critical">
              <div className="issue-header">
                <span className="issue-icon">{getSeverityIcon('critical')}</span>
                <span className="issue-type">{issue.type}</span>
                <span className="issue-severity">Critical</span>
              </div>
              <div className="issue-message">{issue.message}</div>
              {issue.details && Array.isArray(issue.details) && (
                <div className="issue-details">
                  {issue.details.slice(0, 3).map((detail, idx) => (
                    <div key={idx} className="issue-detail">
                      {typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail}
                    </div>
                  ))}
                  {issue.details.length > 3 && (
                    <div className="issue-detail-more">
                      ... and {issue.details.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {issues.warnings.map((issue, index) => (
            <div key={`warning-${index}`} className="issue warning">
              <div className="issue-header">
                <span className="issue-icon">{getSeverityIcon('warning')}</span>
                <span className="issue-type">{issue.type}</span>
                <span className="issue-severity">Warning</span>
              </div>
              <div className="issue-message">{issue.message}</div>
              
              {/* Special handling for Spelling Errors in warnings */}
              {(issue.type === 'Potential Typos' || issue.type === 'Spelling Errors') && issue.details && Array.isArray(issue.details) && (
                <div className="issue-details typo-details">
                  <div className="detail-header">📝 Spelling Errors Found:</div>
                  {issue.details.map((typo, idx) => (
                    <div key={idx} className="typo-item-simple">
                      <div className="typo-correction-line">
                        <span className="typo-wrong">"{typo.typo}"</span>
                        <span className="typo-arrow">→</span>
                        <span className="typo-right">"{typo.correction}"</span>
                      </div>
                      <div className="typo-meta">
                        {typo.lineNumber ? `Line ${typo.lineNumber} | ` : ''}Confidence: <span className={`confidence-${typo.confidence}`}>{typo.confidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Generic details for other warning types */}
              {issue.type !== 'Potential Typos' && issue.type !== 'Spelling Errors' && 
               issue.details && Array.isArray(issue.details) && issue.details.length > 0 && (
                <div className="issue-details">
                  {issue.details.slice(0, 2).map((detail, idx) => (
                    <div key={idx} className="issue-detail">
                      {typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail}
                    </div>
                  ))}
                  {issue.details.length > 2 && (
                    <div className="issue-detail-more">
                      ... and {issue.details.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {issues.info.map((issue, index) => (
            <div key={`info-${index}`} className="issue info">
              <div className="issue-header">
                <span className="issue-icon">{getSeverityIcon('info')}</span>
                <span className="issue-type">{issue.type}</span>
                <span className="issue-severity">Info</span>
              </div>
              <div className="issue-message">{issue.message}</div>
              
              {/* Special handling for different issue types */}
              {(issue.type === 'Potential Typos' || issue.type === 'Spelling Errors') && issue.details && Array.isArray(issue.details) && (
                <div className="issue-details typo-details">
                  <div className="detail-header">📝 Spelling Errors Found:</div>
                  {issue.details.map((typo, idx) => (
                    <div key={idx} className="typo-item-simple">
                      <div className="typo-correction-line">
                        <span className="typo-wrong">"{typo.typo}"</span>
                        <span className="typo-arrow">→</span>
                        <span className="typo-right">"{typo.correction}"</span>
                      </div>
                      <div className="typo-meta">
                        {typo.lineNumber ? `Line ${typo.lineNumber} | ` : ''}Confidence: <span className={`confidence-${typo.confidence}`}>{typo.confidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {issue.type === 'Formatting' && issue.details && Array.isArray(issue.details) && (
                <div className="issue-details formatting-details">
                  <div className="detail-header">📄 Formatting Issues:</div>
                  {issue.details.map((detail, idx) => (
                    <div key={idx} className="formatting-item">
                      <span className="formatting-icon">
                        {detail.includes('indentation') ? '↹' : 
                         detail.includes('whitespace') ? '␣' : '📝'}
                      </span>
                      {detail}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Generic details for other issue types */}
              {issue.type !== 'Potential Typos' && issue.type !== 'Spelling Errors' && issue.type !== 'Formatting' && 
               issue.details && Array.isArray(issue.details) && issue.details.length > 0 && (
                <div className="issue-details">
                  {issue.details.slice(0, 3).map((detail, idx) => (
                    <div key={idx} className="issue-detail">
                      {typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail}
                    </div>
                  ))}
                  {issue.details.length > 3 && (
                    <div className="issue-detail-more">
                      ... and {issue.details.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Performance Recommendations */}
      {performance.recommendations && performance.recommendations.length > 0 && (
        <div className="analysis-section performance-section">
          <h4>⚡ Performance Insights</h4>
          <div className="performance-recommendations">
            {performance.recommendations.map((rec, index) => (
              <div key={index} className={`performance-rec ${rec.type}`}>
                <div className="perf-rec-header">
                  <span className="perf-rec-category">{rec.category}</span>
                  <span className={`perf-rec-impact ${rec.impact}`}>{rec.impact} impact</span>
                </div>
                <div className="perf-rec-message">{rec.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Practices Suggestions */}
      {bestPractices.suggestions && bestPractices.suggestions.length > 0 && (
        <div className="analysis-section best-practices-section">
          <h4>✨ Best Practices</h4>
          <div className="best-practices-suggestions">
            {bestPractices.suggestions.map((suggestion, index) => (
              <div key={index} className={`bp-suggestion ${suggestion.type}`}>
                <div className="bp-suggestion-header">
                  <span className="bp-suggestion-category">{suggestion.category}</span>
                  <span className={`bp-suggestion-impact ${suggestion.impact}`}>{suggestion.impact}</span>
                </div>
                <div className="bp-suggestion-message">{suggestion.message}</div>
                {suggestion.details && Array.isArray(suggestion.details) && suggestion.details.length > 0 && (
                  <div className="bp-suggestion-details">
                    <div className="detail-header">Details:</div>
                    {suggestion.details.slice(0, 5).map((detail, idx) => (
                      <div key={idx} className="bp-suggestion-detail">
                        {typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail}
                      </div>
                    ))}
                    {suggestion.details.length > 5 && (
                      <div className="bp-suggestion-detail-more">
                        ... and {suggestion.details.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;