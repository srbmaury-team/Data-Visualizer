// OpenAI Service for real AI-powered YAML generation
import OpenAI from 'openai';

class OpenAIYamlService {
  constructor(apiKey) {
    this.openai = apiKey ? new OpenAI({ 
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    }) : null;
  }

  isConfigured() {
    return !!this.openai;
  }

  async generateYamlResponse(userInput, currentYaml = '') {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert YAML configuration assistant. Your role is to help users create, modify, and optimize YAML structures for various applications and architectures.

CRITICAL REQUIREMENTS:
1. Always respond with valid YAML syntax
2. For representing child/nested elements, ONLY use "children:" or "nodes:" properties
3. NEVER use other property names like "endpoints:", "tables:", "features:", "integrations:" for nested structures
4. Convert any nested lists into children: or nodes: format
5. Include comprehensive, production-ready configurations
6. Follow best practices for naming, structure, and organization
7. Include relevant properties like ports, hosts, versions, etc.
8. For modifications, preserve existing structure when possible
9. Include helpful comments in YAML when appropriate
10. Structure should be hierarchical and well-organized

NESTED STRUCTURE RULES:
- Use "children:" for main sub-components or services
- Use "nodes:" for items, elements, or data entries
- Example CORRECT format:
  children:
    - name: Auth-Service
      type: service
      nodes:
        - name: Login-Endpoint
        - name: Register-Endpoint

RESPONSE FORMAT:
- Provide a brief explanation of what you're generating/modifying
- Include the complete YAML structure using only children:/nodes: for nesting
- Mention key features or components included

USER'S CURRENT YAML:
${currentYaml ? currentYaml : 'No existing YAML provided'}

USER REQUEST: ${userInput}

Generate appropriate YAML based on the request. If modifying existing YAML, preserve the current structure and add/modify as requested. Remember: ONLY use children: or nodes: for nested elements.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Extract YAML from response
      let yaml = '';
      let explanation = '';
      
      // Try to find YAML code block first
      const yamlMatch = response.match(/```(?:yaml|yml)?\n([\s\S]*?)\n```/);
      
      if (yamlMatch) {
        yaml = yamlMatch[1];
        explanation = response.replace(yamlMatch[0], '').trim();
      } else {
        // If no code block, try to extract YAML by looking for indented content
        const lines = response.split('\n');
        const yamlStartIndex = lines.findIndex(line => 
          line.match(/^[a-zA-Z0-9_-]+:\s*/) || line.startsWith('name:') || line.startsWith('version:')
        );
        
        if (yamlStartIndex !== -1) {
          yaml = lines.slice(yamlStartIndex).join('\n');
          explanation = lines.slice(0, yamlStartIndex).join('\n').trim();
        }
      }

      return {
        message: explanation || "I've generated the YAML structure based on your request:",
        yaml: yaml.trim()
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
  }

  // Fallback to mock responses when OpenAI is not available
  getMockResponse(userInput, currentYaml) {
    const input = userInput.toLowerCase();
    
    // Provide helpful guidance instead of pre-made YAML structures
    if (input.includes('e-commerce') || input.includes('ecommerce')) {
      return {
        message: `I'd help you create an e-commerce platform structure! Since OpenAI API is not configured, here's what I would typically generate:

🏪 **E-commerce Platform Components:**
- Frontend (React/Vue with product catalog, cart, checkout)
- Backend APIs (user service, product service, order service)
- Database layer (users, products, orders tables)
- Payment integration
- Authentication & authorization

To get AI-generated YAML structures, please configure your OpenAI API key in the settings.`,
        yaml: null
      };
    }

    if (input.includes('auth') || input.includes('authentication')) {
      return {
        message: `I'd help you create an authentication system! Since OpenAI API is not configured, here's what I would typically generate:

🔐 **Authentication System Components:**
- JWT token management
- User registration & login endpoints
- Password hashing & security
- OAuth integration (Google, GitHub, etc.)
- Rate limiting & CORS configuration

To get AI-generated YAML structures, please configure your OpenAI API key in the settings.`,
        yaml: null
      };
    }

    if (input.includes('microservice') || input.includes('micro-service')) {
      return {
        message: `I'd help you create a microservices architecture! Since OpenAI API is not configured, here's what I would typically generate:

🏗️ **Microservices Architecture Components:**
- API Gateway with load balancing & routing
- Service discovery (Consul/Eureka)
- Individual services (user, product, order, notification)
- Message queues (RabbitMQ/Kafka)
- Monitoring & observability stack

To get AI-generated YAML structures, please configure your OpenAI API key in the settings.`,
        yaml: null
      };
    }

    // Default response for any other input
    return {
      message: `I understand you're looking for help with: "${userInput}".

🤖 **AI-Powered YAML Generation:**
I can help you create sophisticated YAML structures for various use cases, but I need an OpenAI API key to generate custom content.

🏗️ **What I Can Generate:**
- E-commerce platforms & marketplaces
- Microservices architectures
- Authentication & authorization systems
- Database schemas & configurations
- API documentation structures
- DevOps & deployment configs
- Component hierarchies
- System architecture diagrams

� **Setup Required:**
Please configure your OpenAI API key in the AI Assistant settings (🔑 button) to unlock AI-powered YAML generation.

📝 **Alternative:**
You can also write your own YAML structure using the editor - I'll help analyze and visualize whatever you create!`,
      yaml: null
    };
  }
}

export default OpenAIYamlService;