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
    
    if (input.includes('e-commerce') || input.includes('ecommerce')) {
      return {
        message: "I've generated a comprehensive e-commerce platform structure for you! This includes frontend, backend services, database, and payment processing components.",
        yaml: `name: E-Commerce-Platform
version: 3.0.0
environment: production
type: web-application

children:
  - name: Frontend
    type: web-app
    framework: React
    port: 3000
    nodes:
      - name: Product-Catalog
        description: Browse and search products
      - name: Shopping-Cart
        description: Add/remove items
      - name: User-Authentication
        description: Login and registration
      - name: Checkout-Process
        description: Order completion

  - name: Backend-API
    type: api-service
    framework: Node.js
    port: 8080
    database: PostgreSQL
    children:
      - name: Product-Service
        nodes:
          - name: Get-Products
            method: GET
            path: /api/products
          - name: Product-Details
            method: GET
            path: /api/products/:id
        
      - name: User-Service
        nodes:
          - name: Register
            method: POST
            path: /api/users/register
          - name: Login
            method: POST
            path: /api/users/login
            
      - name: Order-Service
        nodes:
          - name: Create-Order
            method: POST
            path: /api/orders
          - name: Order-History
            method: GET
            path: /api/orders/user/:id

  - name: Database
    type: database
    engine: PostgreSQL
    port: 5432
    children:
      - name: Users-Table
        fields: "id, email, password, created_at"
      - name: Products-Table
        fields: "id, name, price, description, stock"
      - name: Orders-Table
        fields: "id, user_id, total, status, created_at"

  - name: Payment-Gateway
    type: external-service
    provider: Stripe
    nodes:
      - name: Process-Payment
        method: POST
        path: /api/payments/charge
      - name: Refund
        method: POST
        path: /api/payments/refund

  - name: Cache-Layer
    type: cache
    technology: Redis
    port: 6379
    nodes:
      - name: Session-Storage
        description: User session data
      - name: Product-Cache
        description: Product information cache`
      };
    }

    if (input.includes('auth') || input.includes('authentication')) {
      const authService = `
  - name: Authentication-Service
    type: microservice
    framework: Node.js
    port: 8081
    database: PostgreSQL
    children:
      - name: JWT-Token-Management
        description: Issue and validate tokens
      - name: Password-Hashing
        algorithm: bcrypt
      - name: OAuth-Integration
        providers: "Google, GitHub, Facebook"
    
    nodes:
      - name: Register
        method: POST
        path: /auth/register
        validation: "email, password-strength"
        
      - name: Login
        method: POST
        path: /auth/login
        response: jwt-token
        
      - name: Logout
        method: POST
        path: /auth/logout
        
      - name: Verify-Token
        method: GET
        path: /auth/verify
        
      - name: Reset-Password
        method: POST
        path: /auth/reset-password

    children:
      - name: Security-Features
        nodes:
          - name: Rate-Limiting
            limit: "100-requests-per-minute"
          - name: CORS-Configuration
            origins: "localhost:3000, app.domain.com"
          - name: Input-Validation
            library: joi`;

      if (currentYaml && currentYaml.trim()) {
        return {
          message: "I've created an authentication service that you can add to your existing structure. This includes JWT token management, OAuth integration, and comprehensive security features.",
          yaml: currentYaml + authService
        };
      } else {
        return {
          message: "I've created a complete authentication service structure for you! This includes user registration, login, JWT tokens, OAuth integration, and security features.",
          yaml: `name: Authentication-System
version: 1.0.0
type: authentication-service
children:${authService}`
        };
      }
    }

    if (input.includes('microservice') || input.includes('micro-service')) {
      return {
        message: "I've created a modern microservices architecture following best practices with service discovery, API gateway, and containerization ready!",
        yaml: `name: Microservices-Architecture
version: 2.0.0
type: distributed-system

children:
  - name: API-Gateway
    type: gateway
    framework: Kong
    port: 8000
    nodes:
      - name: Load-Balancing
      - name: Rate-Limiting
      - name: Authentication-Proxy
      - name: Request-Routing

  - name: Service-Discovery
    type: discovery
    technology: Consul
    port: 8500
    nodes:
      - name: Health-Checks
      - name: Load-Balancing

  - name: User-Service
    type: microservice
    framework: Node.js
    port: 8081
    database: PostgreSQL
    nodes:
      - name: User-CRUD
        paths: "/users, /users/:id"

  - name: Product-Service
    type: microservice
    framework: Python-Flask
    port: 8082
    database: MongoDB
    nodes:
      - name: Product-Management
        paths: "/products, /products/:id"

  - name: Order-Service
    type: microservice
    framework: Java-Spring
    port: 8083
    database: MySQL
    message-queue: RabbitMQ

  - name: Notification-Service
    type: microservice
    framework: Node.js
    port: 8084
    nodes:
      - name: Email-Notifications
      - name: SMS-Notifications
      - name: Push-Notifications

  - name: Message-Queue
    type: queue
    technology: RabbitMQ
    port: 5672
    nodes:
      - name: User-Events
      - name: Order-Events

  - name: Monitoring
    type: observability
    children:
      - name: Metrics
        technology: Prometheus
        port: 9090
      - name: Logging
        technology: ELK-Stack
      - name: Tracing
        technology: Jaeger`
      };
    }

    // Default response for unrecognized input
    return {
      message: `I understand you're looking for help with: "${userInput}". Here are some things I can help you with:

🏗️ **Generate Structures:**
- E-commerce platforms
- Microservices architectures  
- Authentication systems
- Database configurations

🔧 **Modify Existing:**
- Add new services
- Integrate authentication
- Add database layers
- Include monitoring

🚀 **Optimize:**
- Improve organization
- Add best practices
- Include security features
- Performance enhancements

Try asking me something like "Generate a microservices architecture" or "Add a database to my current structure"!`
    };
  }
}

export default OpenAIYamlService;