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
        'Generate a modern e-commerce platform architecture',
        'Create a microservices ecosystem with API gateway',
        'Analyze my tree visualization structure',
        'Check tree balance and organization', 
        'Suggest visual improvements for my tree',
        'Optimize this YAML for better visualization',
        'Generate a DevOps CI/CD pipeline structure',
        'Design a cloud-native application architecture'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    // Use environment variable or empty string (remove localStorage dependency)
    return import.meta.env.VITE_OPENAI_API_KEY || '';
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

      // Run basic analysis for metrics
      const analysis = VisualAnalysisService.analyzeTreeVisualization(treeData);
      
      // Determine query type and provide specific responses
      const openaiService = openaiServiceRef.current;
      
      if (/analyze.*tree.*structure|tree.*visualization.*structure|structure.*analysis/i.test(userInput)) {
        // Deep structural analysis
        const structurePrompt = `Analyze this tree structure with ${analysis.metrics.totalNodes} nodes, ${analysis.metrics.maxDepth} levels deep, balance ratio ${analysis.metrics.balanceRatio.toFixed(2)}. Provide insights about the hierarchical organization, node distribution patterns, and structural efficiency. Focus on the architecture and how well the tree represents logical relationships.`;
        
        if (openaiService.isConfigured()) {
          const aiResponse = await openaiService.generateYamlResponse(structurePrompt, currentYaml);
          return {
            message: `## �️ Tree Structure Analysis\n\n${aiResponse.message}`,
            visualAnalysis: analysis
          };
        } else {
          return {
            message: `## 🏗️ Tree Structure Analysis\n\n**Architectural Assessment:** Your tree has a solid ${analysis.metrics.maxDepth}-level architecture with ${analysis.metrics.totalNodes} nodes.\n\n**Structural Efficiency:** ${analysis.metrics.balanceRatio >= 0.8 ? 'Well-organized hierarchy' : 'Consider restructuring for better flow'}\n\n**Node Distribution:** ${Math.round(analysis.metrics.leafNodes/analysis.metrics.totalNodes*100)}% leaf nodes indicates ${analysis.metrics.leafNodes/analysis.metrics.totalNodes > 0.7 ? 'good detail granularity' : 'potential for more detailed breakdown'}\n\n**Logical Flow:** The current structure ${analysis.metrics.balanceRatio >= 0.7 ? 'follows logical patterns' : 'could benefit from reorganization'} for better comprehension.`,
            visualAnalysis: analysis
          };
        }
      }
      
      else if (/balance.*organization|organization.*balance|tree.*balance|balance.*tree/i.test(userInput)) {
        // Balance and organization focused
        return {
          message: `## ⚖️ Tree Balance & Organization\n\n**Balance Score:** ${analysis.metrics.balanceRatio.toFixed(2)}/1.0 ${analysis.metrics.balanceRatio >= 0.8 ? '✅ Excellent' : analysis.metrics.balanceRatio >= 0.6 ? '⚠️ Good' : '❌ Needs Work'}\n\n**Distribution Analysis:**\n- **Symmetry:** ${analysis.metrics.asymmetryScore < 0.2 ? 'Well-balanced tree' : `${analysis.metrics.leftHeavy ? 'Left' : 'Right'}-heavy distribution`}\n- **Depth Consistency:** ${analysis.metrics.maxDepth - Math.min(...Object.values(analysis.metrics.depthDistribution || {})) <= 2 ? 'Consistent levels' : 'Uneven depth distribution'}\n- **Node Spread:** ${analysis.metrics.wideNodes > 3 ? 'Some branches are overcrowded' : 'Good node distribution'}\n\n**Organization Quality:**\n${analysis.metrics.balanceRatio >= 0.8 ? '✅ Tree is well-organized with good visual flow' : '⚠️ Consider redistributing nodes for better balance'}\n\n**Recommendations:**\n- ${analysis.metrics.wideNodes > 3 ? 'Group related items under intermediate categories' : 'Current grouping looks good'}\n- ${analysis.metrics.balanceRatio < 0.7 ? 'Move some items from heavy branches to lighter ones' : 'Maintain current balanced structure'}`,
          visualAnalysis: analysis
        };
      }
      
      else if (/suggest.*visual|visual.*improvement|improve.*visual|visual.*enhance/i.test(userInput)) {
        // Visual improvement suggestions
        const improvementPrompt = `Suggest visual improvements for a tree with ${analysis.metrics.totalNodes} nodes, balance ratio ${analysis.metrics.balanceRatio.toFixed(2)}, and ${analysis.metrics.maxDepth} levels. Focus on layout, visual hierarchy, color coding, grouping strategies, and user experience enhancements.`;
        
        if (openaiService.isConfigured()) {
          const aiResponse = await openaiService.generateYamlResponse(improvementPrompt, currentYaml);
          return {
            message: `## 🎨 Visual Enhancement Suggestions\n\n${aiResponse.message}`,
            visualAnalysis: analysis
          };
        } else {
          return {
            message: `## 🎨 Visual Enhancement Suggestions\n\n**Color Strategy:**\n- Use consistent color themes for related node types\n- ${analysis.metrics.maxDepth > 3 ? 'Apply gradient colors by depth level' : 'Use category-based color coding'}\n- Highlight critical paths with accent colors\n\n**Layout Improvements:**\n- ${analysis.metrics.wideNodes > 3 ? 'Consider horizontal layouts for wide branches' : 'Current layout structure is optimal'}\n- ${analysis.metrics.balanceRatio < 0.7 ? 'Reposition nodes for better visual balance' : 'Maintain current balanced positioning'}\n- Add visual separators between major sections\n\n**Interactive Features:**\n- Implement hover effects for node details\n- Add expand/collapse for large branches\n- Include mini-map for navigation\n\n**Typography & Spacing:**\n- Use font weights to show hierarchy levels\n- Ensure adequate spacing between nodes\n- Consider abbreviated labels with detailed tooltips`,
            visualAnalysis: analysis
          };
        }
      }
      
      else if (/optimize.*yaml|yaml.*optimization|optimize.*visualization/i.test(userInput)) {
        // YAML optimization for visualization
        const optimizationPrompt = `Optimize this YAML structure for better visualization. Current metrics: ${analysis.metrics.totalNodes} nodes, ${analysis.metrics.maxDepth} depth, ${analysis.metrics.balanceRatio.toFixed(2)} balance ratio. Suggest YAML restructuring for clearer visual representation.`;
        
        if (openaiService.isConfigured()) {
          const aiResponse = await openaiService.generateYamlResponse(optimizationPrompt, currentYaml);
          return {
            message: `## ⚡ YAML Visualization Optimization\n\n${aiResponse.message}`,
            visualAnalysis: analysis
          };
        } else {
          return {
            message: `## ⚡ YAML Visualization Optimization\n\n**Structure Recommendations:**\n- ${analysis.metrics.maxDepth > 4 ? 'Reduce nesting depth by creating intermediate groupings' : 'Current depth is optimal for visualization'}\n- ${analysis.metrics.wideNodes > 4 ? 'Break down large sections into smaller, manageable chunks' : 'Node distribution is well-sized'}\n\n**Naming Optimization:**\n- Use consistent naming conventions across all levels\n- Keep node names concise but descriptive\n- Consider abbreviations for long technical terms\n\n**Grouping Strategy:**\n- ${analysis.metrics.leafNodes/analysis.metrics.totalNodes > 0.8 ? 'Consider adding more intermediate categories' : 'Good balance of categories and items'}\n- Group related functionality together\n- Separate core features from auxiliary ones\n\n**YAML Best Practices:**\n- Add meaningful comments for complex sections\n- Use consistent indentation (2 spaces recommended)\n- Order items logically (alphabetical or by importance)\n- Consider splitting very large files into modules`,
            visualAnalysis: analysis
          };
        }
      }
      
      else if (/identify.*issue|structural.*issue|issue.*tree|problem.*tree/i.test(userInput)) {
        // Issue identification
        return {
          message: `## 🔍 Structural Issue Analysis\n\n**Issues Detected:** ${analysis.issues.length} potential concerns\n\n${analysis.issues.length > 0 ? 
            analysis.issues.map((issue, idx) => 
              `**${idx + 1}. ${issue.category}** (${issue.type})\n${issue.message}\n`
            ).join('\n') : 
            '✅ No critical structural issues detected!'
          }\n\n**Health Indicators:**\n- **Depth:** ${analysis.metrics.maxDepth > 5 ? '❌ Too deep (consider flattening)' : '✅ Appropriate depth'}\n- **Balance:** ${analysis.metrics.balanceRatio < 0.5 ? '❌ Severely unbalanced' : analysis.metrics.balanceRatio < 0.7 ? '⚠️ Moderately unbalanced' : '✅ Well balanced'}\n- **Complexity:** ${analysis.metrics.totalNodes > 50 ? '⚠️ High complexity' : '✅ Manageable complexity'}\n\n**Immediate Actions:**\n${analysis.issues.length > 0 ? 
            analysis.issues.slice(0, 3).map(issue => `- Fix: ${issue.message}`).join('\n') : 
            '- Continue with current structure\n- Consider minor optimizations for performance'
          }`,
          visualAnalysis: analysis
        };
      }
      
      // Fallback - shouldn't reach here due to pattern matching
      return {
        message: `## 🌳 Tree Analysis\n\nYour tree has ${analysis.metrics.totalNodes} nodes with a balance ratio of ${analysis.metrics.balanceRatio.toFixed(2)}. For more specific insights, try asking about structure, balance, improvements, optimization, or issues.`,
        visualAnalysis: analysis
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

      // Check if this is an analysis request - be more specific to avoid overlaps
      const isStructureAnalysis = /analyze.*tree.*structure|tree.*visualization.*structure|structure.*analysis.*tree/i.test(inputMessage);
      const isBalanceAnalysis = /balance.*organization|organization.*balance|tree.*balance|balance.*tree|check.*balance/i.test(inputMessage);
      const isVisualImprovement = /suggest.*visual|visual.*improvement|improve.*visual|visual.*enhance|improvement.*tree/i.test(inputMessage);
      const isYamlOptimization = /optimize.*yaml|yaml.*optimization|optimize.*visualization|yaml.*better/i.test(inputMessage);
      const isIssueIdentification = /identify.*issue|structural.*issue|issue.*tree|problem.*tree|find.*problem/i.test(inputMessage);
      
      const isVisualAnalysisRequest = isStructureAnalysis || isBalanceAnalysis || isVisualImprovement || isYamlOptimization || isIssueIdentification;
      const isAnalysisRequest = !isVisualAnalysisRequest && /analyze|analysis|check|review|inspect|evaluate|performance|best.practices/i.test(inputMessage);
      
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
    // Show success message before closing
    const successMessage = {
      id: Date.now(),
      type: 'assistant',
      content: '✅ YAML has been applied to your editor! Closing in 2 seconds...',
      timestamp: new Date(),
      isSuccess: true
    };
    setMessages(prev => [...prev, successMessage]);
    // Close the assistant after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2000);
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
          <div className="clear-or-exit">
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
                        Use This YAML & Close
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