import React, { useState, useRef, useEffect } from "react";
import OpenAIYamlService from "../services/openaiService";
import YamlAnalysisService from "../services/yamlAnalysisService";
import VisualAnalysisService from "../services/visualAnalysisService";
import { buildTreeFromYAML, convertToD3Hierarchy } from "../utils/treeBuilder";
import { validateYAML } from "../utils/yamlValidator";
import yaml from "js-yaml";
import "./styles/AiAssistant.css";

export default function AiAssistant({ isOpen, onClose, onYamlGenerated, currentYaml }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hi! I\'m your AI YAML Assistant with Visual Intelligence. I can help you generate, modify, optimize YAML structures, analyze your tree visualization, and provide intelligent insights about structure and organization.',
      timestamp: new Date(),
      suggestions: [
        'Generate an e-commerce platform structure',
        'Analyze my tree visualization structure',
        'Check tree balance and organization',
        'Suggest visual improvements for my tree',
        'Optimize this YAML for better visualization',
        'Identify structural issues in my tree',
        'Create a microservices architecture'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    // Priority: Environment variable -> localStorage -> empty string
    return import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '';
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const openaiServiceRef = useRef(new OpenAIYamlService(apiKey));

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    openaiServiceRef.current = new OpenAIYamlService(apiKey);
  }, [apiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleAnalysisRequest = async (userInput, yamlText) => {
    try {
      // Parse YAML and run analysis
      const parsedYaml = yaml.load(yamlText);
      const analysis = YamlAnalysisService.analyzeYaml(parsedYaml, yamlText);
      
      // Generate intelligent response based on analysis
      let message = "## 📊 YAML Analysis Results\n\n";
      
      // Overall summary
      message += `**Overall Assessment:** ${analysis.summary.message}\n`;
      message += `**Score:** ${analysis.summary.overallScore}/100\n\n`;
      
      // Key metrics
      message += "### 🔧 Complexity Analysis\n";
      message += `- **Complexity Level:** ${analysis.complexity.level}\n`;
      message += `- **Score:** ${analysis.complexity.score}/100\n`;
      if (analysis.complexity.details) {
        message += `- **Details:** ${analysis.complexity.details.slice(0, 3).join(', ')}\n`;
      }
      message += "\n";
      
      // Performance insights
      if (analysis.performance.recommendations.length > 0) {
        message += "### ⚡ Performance Insights\n";
        analysis.performance.recommendations.slice(0, 2).forEach(rec => {
          message += `- **${rec.category}:** ${rec.message}\n`;
        });
        message += "\n";
      }
      
      // Top issues
      if (analysis.issues.critical.length > 0 || analysis.issues.warnings.length > 0) {
        message += "### 🚨 Key Issues\n";
        analysis.issues.critical.slice(0, 2).forEach(issue => {
          message += `- **${issue.type}:** ${issue.message}\n`;
        });
        analysis.issues.warnings.slice(0, 2).forEach(issue => {
          message += `- **${issue.type}:** ${issue.message}\n`;
        });
        message += "\n";
      }
      
      // Recommendations
      if (analysis.summary.recommendations.length > 0) {
        message += "### 💡 Top Recommendations\n";
        analysis.summary.recommendations.forEach(rec => {
          message += `- **${rec.priority.toUpperCase()}:** ${rec.message} - ${rec.action}\n`;
        });
        message += "\n";
      }
      
      // Best practices
      if (analysis.bestPractices.suggestions.length > 0) {
        message += "### ✨ Best Practice Suggestions\n";
        analysis.bestPractices.suggestions.slice(0, 2).forEach(suggestion => {
          message += `- **${suggestion.category}:** ${suggestion.message}\n`;
        });
      }
      
      return {
        message: message.trim(),
        analysisData: analysis,
        yaml: null // No YAML output for analysis
      };
      
    } catch (error) {
      return {
        message: `I encountered an error analyzing your YAML: ${error.message}. Please ensure your YAML is valid and try again.`,
        yaml: null
      };
    }
  };

  const handleVisualAnalysisRequest = async (userInput) => {
    try {
      // Generate tree data from current YAML
      let treeData = null;
      
      if (currentYaml && currentYaml.trim()) {
        try {
          // Validate and parse the YAML
          const validationResult = validateYAML(currentYaml);
          if (validationResult.valid) {
            const data = yaml.load(currentYaml);
            const tree = buildTreeFromYAML(data);
            treeData = convertToD3Hierarchy(tree);
          }
        } catch (error) {
          console.log("Could not generate tree data for visual analysis:", error.message);
        }
      }
      
      if (!treeData) {
        return {
          message: "## 🌳 Visual Analysis\n\nI don't see any valid tree data to analyze. Please load some valid YAML data first, then I can provide insights about your tree structure, balance, and organization.\n\n💡 **Tip:** Make sure your YAML is properly formatted and contains hierarchical data with nodes and children.",
          visualAnalysis: null
        };
      }

      // Run visual analysis
      const analysis = VisualAnalysisService.analyzeTreeVisualization(treeData);
      
      // Generate intelligent response based on visual analysis
      let message = "## 🌳 Tree Visualization Analysis\n\n";
      
      // Health summary
      message += `**Tree Health Score:** ${analysis.summary.healthScore}/100 (${analysis.summary.healthLevel})\n`;
      message += `**Primary Recommendation:** ${analysis.summary.primaryRecommendation}\n\n`;
      
      // Key metrics
      message += "### 📊 Tree Metrics\n";
      message += `- **Total Nodes:** ${analysis.metrics.totalNodes}\n`;
      message += `- **Max Depth:** ${analysis.metrics.maxDepth} levels\n`;
      message += `- **Average Depth:** ${analysis.metrics.averageDepth.toFixed(1)} levels\n`;
      message += `- **Balance Ratio:** ${analysis.metrics.balanceRatio.toFixed(2)} (1.0 = perfect)\n`;
      message += `- **Leaf Nodes:** ${analysis.metrics.leafNodes} (${(analysis.metrics.leafNodes/analysis.metrics.totalNodes*100).toFixed(1)}%)\n\n`;
      
      // Insights
      if (analysis.insights.length > 0) {
        message += "### 💡 Visual Insights\n";
        analysis.insights.forEach(insight => {
          const emoji = insight.severity === 'positive' ? '✅' : 
                       insight.severity === 'high' ? '🔴' : 
                       insight.severity === 'medium' ? '🟡' : '🔵';
          message += `${emoji} **${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}:** ${insight.message}\n`;
        });
        message += "\n";
      }
      
      // Issues
      if (analysis.issues.length > 0) {
        message += "### ⚠️ Structural Issues\n";
        analysis.issues.forEach(issue => {
          const emoji = issue.type === 'critical' ? '🚨' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
          message += `${emoji} **${issue.category}:** ${issue.message}\n`;
        });
        message += "\n";
      }
      
      // Recommendations
      if (analysis.recommendations.length > 0) {
        message += "### 🎯 Improvement Recommendations\n";
        analysis.recommendations.forEach((rec, index) => {
          const priority = rec.priority === 'high' ? '🔴 HIGH' : 
                          rec.priority === 'medium' ? '🟡 MED' : '🟢 LOW';
          message += `${index + 1}. **${rec.title}** (${priority})\n`;
          message += `   ${rec.description}\n`;
        });
        message += "\n";
      }
      
      // Balance and asymmetry details
      if (analysis.metrics.asymmetryScore > 0.2) {
        message += "### ⚖️ Balance Analysis\n";
        const side = analysis.metrics.leftHeavy ? 'left' : analysis.metrics.rightHeavy ? 'right' : 'center';
        message += `Your tree is **${side}-weighted** with an asymmetry score of ${analysis.metrics.asymmetryScore.toFixed(2)}.\n`;
        if (side !== 'center') {
          message += "Consider redistributing nodes for better visual balance.\n";
        }
        message += "\n";
      }
      
      // Tips for improvement
      message += "### 💡 Pro Tips\n";
      if (analysis.metrics.maxDepth > 6) {
        message += "- Consider grouping related items to reduce tree depth\n";
      }
      if (analysis.metrics.wideNodes > 2) {
        message += "- Create intermediate categories for nodes with many children\n";
      }
      if (analysis.metrics.balanceRatio < 0.5) {
        message += "- Move some items from large branches to smaller ones\n";
      }
      message += "- Use descriptive names to make the tree more self-explanatory\n";
      message += "- Consider the logical flow when organizing your structure\n";
      
      return {
        message: message.trim(),
        visualAnalysis: analysis,
        yaml: null
      };
      
    } catch (error) {
      return {
        message: `I encountered an error analyzing your tree visualization: ${error.message}. Please try again.`,
        visualAnalysis: null,
        yaml: null
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const openaiService = openaiServiceRef.current;
      let response;

      // Check if this is an analysis request
      const isAnalysisRequest = /analyze|analysis|check|review|inspect|evaluate|optimize|improve|performance|best.practices|issues|problems|recommendations/i.test(inputMessage);
      const isVisualAnalysisRequest = /(visual.*analysis|analyze.*visual|tree.*analysis|analyze.*tree|visualization.*analysis|analyze.*visualization|structure.*analysis|analyze.*structure|balance.*analysis|analyze.*balance|visual.*insights|tree.*insights|visualization.*insights|structure.*insights|health.*score|tree.*health|visual.*health)/i.test(inputMessage);
      
      if (isVisualAnalysisRequest) {
        // Provide visual analysis-based response
        response = await handleVisualAnalysisRequest(inputMessage);
      } else if (isAnalysisRequest && currentYaml && currentYaml.trim()) {
        // Provide YAML analysis-based response
        response = await handleAnalysisRequest(inputMessage, currentYaml);
      } else if (openaiService.isConfigured()) {
        // Use real OpenAI API for generation
        response = await openaiService.generateYamlResponse(inputMessage, currentYaml);
      } else {
        // Fall back to mock responses
        response = openaiService.getMockResponse(inputMessage, currentYaml);
      }
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.message,
        timestamp: new Date(),
        yamlOutput: response.yaml,
        hasYaml: !!response.yaml,
        analysisData: response.analysisData || null,
        visualAnalysis: response.visualAnalysis || null,
        isAnalysis: !!response.analysisData,
        isVisualAnalysis: !!response.visualAnalysis
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Response Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `I encountered an error: ${error.message}. ${!apiKey ? 'Consider adding your OpenAI API key for better responses.' : 'Please try again or rephrase your request.'}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseYaml = (yaml) => {
    onYamlGenerated(yaml);
    // Show success message
    const successMessage = {
      id: Date.now(),
      type: 'assistant',
      content: '✅ YAML has been applied to your editor! You can now visualize or modify it further.',
      timestamp: new Date(),
      isSuccess: true
    };
    setMessages(prev => [...prev, successMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-container">
        <div className="ai-assistant-header">
          <div className="header-content">
            <h3>🤖 AI YAML Assistant</h3>
            <p>Generate, modify, and optimize YAML structures with AI</p>
            <div className="api-status">
              {apiKey ? (
                <span className="api-connected">
                  ✅ OpenAI Connected 
                  {import.meta.env.VITE_OPENAI_API_KEY ? ' (Environment)' : ' (Local)'}
                </span>
              ) : (
                <span className="api-disconnected">⚠️ Using Mock Responses</span>
              )}
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="clear-chat-btn" 
              onClick={() => {
                if (window.confirm('Clear all chat messages? This cannot be undone.')) {
                  setMessages([
                    {
                      id: 1,
                      type: 'assistant',
                      content: 'Hi! I\'m your AI YAML Assistant with Visual Intelligence. I can help you generate, modify, optimize YAML structures, analyze your tree visualization, and provide intelligent insights about structure and organization.',
                      timestamp: new Date(),
                      suggestions: [
                        'Generate an e-commerce platform structure',
                        'Analyze my tree visualization structure',
                        'Check tree balance and organization',
                        'Suggest visual improvements for my tree',
                        'Optimize this YAML for better visualization',
                        'Identify structural issues in my tree',
                        'Create a microservices architecture'
                      ]
                    }
                  ]);
                }
              }}
              title="Clear all chat messages"
            >
              🗑️ Clear Chat
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                
                {message.suggestions && (
                  <div className="suggestions-grid">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-pill"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {message.hasYaml && (
                  <div className="yaml-output">
                    <div className="yaml-header">
                      <span>📄 Generated YAML</span>
                      <button 
                        className="use-yaml-btn"
                        onClick={() => handleUseYaml(message.yamlOutput)}
                      >
                        Use This YAML
                      </button>
                    </div>
                    <pre className="yaml-code">{message.yamlOutput}</pre>
                  </div>
                )}

                {message.isAnalysis && message.analysisData && (
                  <div className="analysis-summary">
                    <div className="analysis-header">
                      <span>📊 Quick Analysis Summary</span>
                    </div>
                    <div className="analysis-metrics">
                      <div className="metric">
                        <span className="metric-label">Complexity:</span>
                        <span className={`metric-value ${message.analysisData.complexity.score >= 80 ? 'good' : message.analysisData.complexity.score >= 60 ? 'warning' : 'critical'}`}>
                          {message.analysisData.complexity.level} ({message.analysisData.complexity.score}/100)
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Performance:</span>
                        <span className={`metric-value ${message.analysisData.performance.score >= 80 ? 'good' : message.analysisData.performance.score >= 60 ? 'warning' : 'critical'}`}>
                          {message.analysisData.performance.score}/100
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Best Practices:</span>
                        <span className={`metric-value ${message.analysisData.bestPractices.score >= 80 ? 'good' : message.analysisData.bestPractices.score >= 60 ? 'warning' : 'critical'}`}>
                          {message.analysisData.bestPractices.score}/100
                        </span>
                      </div>
                    </div>
                    {(message.analysisData.issues.critical.length > 0 || message.analysisData.issues.warnings.length > 0) && (
                      <div className="analysis-issues">
                        {message.analysisData.issues.critical.length > 0 && (
                          <div className="issue-count critical">
                            🚨 {message.analysisData.issues.critical.length} Critical Issues
                          </div>
                        )}
                        {message.analysisData.issues.warnings.length > 0 && (
                          <div className="issue-count warning">
                            ⚠️ {message.analysisData.issues.warnings.length} Warnings
                          </div>
                        )}
                      </div>
                    )}
                    <div className="analysis-note">
                      💡 Check the Analysis panel for detailed insights and recommendations
                    </div>
                  </div>
                )}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to generate YAML structures, add services, or optimize your configuration..."
              rows="2"
              disabled={isLoading}
            />
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? '⏳' : '🚀'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}