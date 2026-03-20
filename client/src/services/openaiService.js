// OpenAI Service — proxies requests through the backend so the API key stays server-side.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class OpenAIYamlService {
  // isConfigured() always returns true: availability is determined by the server.
  isConfigured() {
    return true;
  }

  async generateYamlResponse(userInput, currentYaml = '') {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        credentials: 'include',
      body: JSON.stringify({ userInput, currentYaml }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.error || (data.errors && data.errors.map(e => e.msg).join(', ')) || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return { message: data.message, yaml: data.yaml };
  }

  // Fallback to mock responses when OpenAI is not available
  getMockResponse(userInput) {
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