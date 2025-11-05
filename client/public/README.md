# 🎯 YAML Data Visualizer

**Transform YAML hierarchies into stunning interactive tree diagrams with professional-grade tools and intelligent analysis.**

A comprehensive full-stack application that seamlessly converts complex YAML structures into beautiful, interactive visualizations. Built with React, Node.js, and D3.js, featuring advanced editing capabilities, AI-powered assistance, and enterprise-ready collaboration tools.

![React](https://img.shields.io/badge/React-19.1.1-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-brightgreen) ![D3.js](https://img.shields.io/badge/D3.js-7.9.0-orange) ![Express](https://img.shields.io/badge/Express-4.18+-red) ![OpenAI](https://img.shields.io/badge/OpenAI-6.7.0-purple) ![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF)

---

## ✨ **Core Capabilities**

### 🔍 **YAML Diff Comparison**
Compare two YAML files with precision and clarity using our advanced diff engine:
- **Side-by-Side Comparison**: Visual diff with synchronized scrolling and line-by-line highlighting
- **Unified Diff View**: Traditional diff format with clear addition, deletion, and modification markers
- **Smart Analysis**: Comprehensive statistics showing changes, additions, deletions, and unchanged content
- **One-Click Paste**: Instant clipboard integration for rapid file comparison
- **Export Results**: Copy unified diff output for documentation and sharing
- **Professional Styling**: Clean, readable interface with color-coded change indicators

### 📝 **Professional YAML Editor**
Experience the ultimate YAML editing environment:
- **Smart Auto-Indentation**: Maintains proper YAML indentation with automatic nesting
- **Search & Replace**: Full-featured find/replace with case sensitivity and match navigation  
- **Line Numbers & Guides**: Professional editor with line numbers and indentation guides
- **Clean Interface**: Optimized light theme with professional syntax highlighting

### 🌳 **Interactive Tree Visualization**
Bring your YAML structures to life:
- **D3.js Powered Graphics**: Smooth, high-performance tree rendering with fluid animations
- **Click to Expand/Collapse**: Individual node controls with intuitive +/- buttons
- **Path Tracing**: Visual breadcrumb highlighting from root to selected nodes
- **Smart Zoom Controls**: Precise zoom with fit-to-screen and focus capabilities
- **Full-Screen Mode**: Immersive viewing experience for complex structures

### 🔄 **Split-Panel Workspace**
Maximize productivity with our adaptive interface:
- **Real-Time Synchronization**: Instant diagram updates as you type
- **Adjustable Layout**: Drag-to-resize panels (20%-80% flexibility)
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Context Switching**: Effortless transitions between editor-only and combined views

### 📊 **GitHub Repository Integration**
Import entire repository structures with a single click:
- **Universal Compatibility**: Works with any public GitHub repository
- **Smart Tree Building**: Intelligent conversion of directory structures to YAML
- **Performance Optimization**: Auto-limited to 500 nodes for optimal rendering
- **Rate Limit Management**: Intelligent API handling to prevent service interruption
- **Error Resilience**: Comprehensive handling of private repositories and edge cases

### 🤖 **AI-Powered Intelligence**
Leverage artificial intelligence for enhanced productivity:
- **Natural Language Generation**: Create YAML from plain English descriptions
- **Structure Analysis**: AI-driven optimization suggestions and best practices
- **Context Awareness**: Maintains conversation history for intelligent assistance
- **Performance Insights**: Automated analysis of complexity and optimization opportunities
- **Fallback Support**: Helpful guidance even without API access

### 🔐 **Enterprise Authentication**
Secure, scalable user management:
- **JWT-Based Security**: Industry-standard authentication with refresh tokens
- **Profile Management**: Comprehensive user profiles with customizable settings
- **Session Control**: Automatic cleanup and secure logout procedures
- **Cross-Device Sync**: Seamless experience across multiple devices
- **Data Ownership**: Complete control over your personal files and account

### 💾 **Advanced File Management**
Organize and share your work efficiently:
- **Personal Library**: Save, categorize, and manage unlimited YAML diagrams
- **Version History**: Complete audit trail with rollback capabilities
- **Share Links**: Generate secure, read-only public URLs for collaboration
- **Export Options**: High-quality PNG export with professional styling
- **Individual File Management**: Update, delete, and organize files with comprehensive controls

### 📈 **Analytics & Insights**
Understand your data structures deeply:
- **Complexity Metrics**: Node counts, depth analysis, and structural complexity scoring
- **Performance Monitoring**: Real-time validation and optimization recommendations
- **Usage Statistics**: Personal dashboard with activity tracking and trends
- **Quality Scoring**: Automated assessment of YAML structure and best practices

---

## 🚀 **Getting Started**

### Prerequisites
- **Node.js 18+** with npm package manager
- **MongoDB 8.0+** (local installation or MongoDB Atlas)
- **OpenAI API Key** (optional, for AI features)

### Quick Installation

```bash
# Clone the repository
git clone https://github.com/srbmaury-team/Data-Visualizer.git
cd Data-Visualizer

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### Environment Configuration

1. **Server Configuration**:
   ```bash
   cd server
   cp .env.example .env
   # Configure your MongoDB URI and JWT secret
   ```

2. **Database Setup**:
   - Start MongoDB locally or configure Atlas connection
   - Database collections are created automatically

3. **Launch Application**:
   ```bash
   # Terminal 1: Backend server
   cd server && npm start

   # Terminal 2: Frontend development server
   cd client && npm run dev -- --host
   ```

4. **Access Points**:
   - **Web Interface**: `http://localhost:5173`
   - **API Endpoint**: `http://localhost:5000`
   - **Network Access**: Available on your local IP for mobile testing

### AI Assistant Setup

Unlock the full potential with OpenAI integration:

1. Obtain an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Navigate to "🤖 AI Assistant" in the application
3. Click the "🔑" icon and enter your API key
4. Key is stored securely in local storage for immediate access

---

## 📱 **User Experience**

### Intuitive Workflow

**Create**: Start with the professional YAML editor or import existing files
**Visualize**: Watch your structure come to life in real-time interactive diagrams  
**Analyze**: Leverage AI insights and built-in analytics for optimization
**Share**: Export high-quality images or generate shareable links
**Collaborate**: Use diff comparison tools for team workflows

### Cross-Platform Excellence

- **Desktop First**: Optimized for professional development environments
- **Mobile Ready**: Full functionality on tablets and smartphones
- **Network Accessible**: Server supports local network connections for multi-device workflows
- **Local Storage**: YAML content persistence in browser for session continuity

---

## 🏗️ **Architecture**

### Frontend Stack
- **React 19.1.1**: Modern functional components with hooks
- **React Router 7.9**: Client-side routing and navigation
- **D3.js 7.9**: Advanced data visualization and animations
- **Vite 7.1**: Lightning-fast development and optimized builds

### Backend Infrastructure
- **Node.js 18+**: High-performance JavaScript runtime
- **Express 4.18**: Robust web application framework
- **MongoDB 8.0**: Flexible document database with indexing
- **JWT Authentication**: Secure token-based user sessions

### Development Tools
- **ESLint**: Code quality and consistency enforcement
- **Vite DevServer**: Hot module replacement and instant updates
- **GitHub Pages**: Automated deployment and hosting

---

## 🔧 **API Integration**

### OpenAI Assistant
```javascript
// AI-powered YAML generation
const response = await aiService.generateYAML(prompt);
```

### GitHub Repository Import
```javascript
// One-click repository structure import
const yamlStructure = await githubService.importRepository(repoUrl);
```

### File Management
```javascript
// Save and retrieve user diagrams
const savedFile = await yamlService.saveGraph(yamlContent, metadata);
```

---

## 📚 **Documentation**

### File Structure
```
Data-Visualizer/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Main application views
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API and business logic
│   │   ├── utils/            # Helper functions and utilities
│   │   └── contexts/         # React context providers
│   └── public/               # Static assets and index.html
├── server/                   # Node.js backend application
│   ├── src/
│   │   ├── controllers/      # Request handling logic
│   │   ├── models/           # Database schemas and models
│   │   ├── routes/           # API endpoint definitions
│   │   ├── middleware/       # Authentication and error handling
│   │   └── services/         # Business logic and external APIs
│   └── package.json          # Server dependencies
└── README.md                 # Project documentation
```

### Key Components

**YAML Editor**: Advanced code editor with syntax highlighting and validation
**Diagram Viewer**: Interactive D3.js tree visualization with zoom and pan
**Diff Comparator**: Side-by-side and unified diff views for YAML comparison
**AI Assistant**: OpenAI-powered natural language processing for YAML generation
**File Manager**: Complete CRUD operations for user diagrams and versions

---

## 🚀 **Deployment**

### Production Build
```bash
# Build optimized production bundle
cd client && npm run build

# Serve static files
cd server && npm start
```

### GitHub Pages Deployment
```bash
# Deploy to GitHub Pages
cd client && npm run deploy
```

### Environment Variables
```env
# Server Configuration
MONGODB_URI=mongodb://localhost:27017/yaml-visualizer
JWT_SECRET=your-secure-jwt-secret
PORT=5000

# Optional Features
OPENAI_API_KEY=your-openai-api-key
```

---

## 🤝 **Contributing**

We welcome contributions that enhance the YAML visualization experience:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow React functional component patterns
- Maintain comprehensive test coverage
- Ensure mobile responsiveness
- Document new features thoroughly

---

## � **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 **Roadmap**

**Performance Optimization**: Enhanced rendering for massive YAML structures
**Collaborative Editing**: Real-time multi-user editing capabilities  
**Advanced Exports**: PDF, SVG, and interactive HTML export options
**Plugin System**: Extensible architecture for custom visualizations
**Enterprise Features**: SSO integration and advanced security controls

---

**Built with ❤️ by the Data Visualization Team**
4. **Save & Share** your diagrams with custom names
5. **Manage Profile** by clicking your username in the header
6. **Use AI Assistant** for generation and analysis
7. **Access Dashboard** for personal analytics and file management

### YAML Format

```yaml
name: My-React-App
language: JavaScript
children:
  - name: public
    type: directory
    children:
      - name: index.html
        type: file
      - name: favicon.ico
        type: file
  - name: src
    type: directory
    children:
      - name: components
        type: directory
        children:
          - name: Header.jsx
            type: file
          - name: App.jsx
            type: file
      - name: styles
        type: directory
        children:
          - name: App.css
            type: file
      - name: index.js
        type: file
  - name: package.json
    type: file
  - name: README.md
    type: file
```

### GitHub Repository Import

**Import any public GitHub repository structure:**

1. Click **"📁 Import from GitHub"** button (available in Header, Editor, and Combined Editor)
2. Enter the GitHub repository URL (e.g., `https://github.com/facebook/react`)
3. Click **"Import Repository"** to fetch and convert the structure
4. The repository structure will be automatically converted to YAML format and loaded into the editor

**Supported URL formats:**
- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/branch`
- `github.com/owner/repo`

**Safety Features:**
- **Node Limit Protection**: Automatically limited to 500 nodes to prevent memory issues
- **API Rate Limiting**: Intelligent delay system to avoid GitHub API limits
- **Timeout Protection**: 30-second timeout to prevent hanging requests
- **Smart Filtering**: Automatically skips common directories like `node_modules`, `.git`, `build`, `dist`
- **Progress Tracking**: Real-time feedback showing nodes processed and API calls made
- **Graceful Degradation**: Shows partial results if limits are reached

### Manual YAML Format
- `name`: Required node identifier
- `children` or `nodes`: Array of child nodes
- Custom properties: Displayed in node boxes
- Nested hierarchy: Unlimited depth supported

---

## 🏗️ Architecture

[Visualize the whole project structure here](https://yaml-visualizer.netlify.app/shared/ZjrtD8_Jv_)

---

## 🔗 API Reference

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### YAML Files
- `POST /api/yaml` - Save new YAML file
- `GET /api/yaml/my` - Get user's files (paginated)
- `GET /api/yaml/:id` - Get specific file
- `GET /api/yaml/shared/:shareId` - Get shared file (public)
- `PUT /api/yaml/:id` - Update file
- `DELETE /api/yaml/:id` - Delete file
- `GET /api/yaml/public/browse` - Browse public files

### User Management & Profile
- `GET /api/user/profile` - Get detailed user profile with statistics
- `PUT /api/user/profile` - Update username and email
- `PUT /api/user/password` - Change user password (requires current password)
- `DELETE /api/user/account` - Delete user account (requires password confirmation)
- `GET /api/user/dashboard` - Get comprehensive dashboard data with analytics

---

## 🎮 Controls & Shortcuts

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Tab` | Indent (2 spaces) |
| `Enter` | New line with auto-indent |
| `Ctrl/Cmd + F` | Search in editor |
| `Ctrl/Cmd + E` | Export diagram as PNG |

### 🖱️ Mouse Controls
| Action | Result |
|--------|--------|
| Mouse Wheel | Zoom diagram |
| Click & Drag | Pan diagram |
| Click Node | Highlight path to root |
| Click `+`/`−` | Expand/collapse node |
| Click `📋` | Copy property value |
| Drag Divider | Adjust panel widths |
| **Click Username** | Navigate to profile page |

### 🎛️ Interface Buttons
| Button | Function |
|--------|----------|
| `💾 Save Graph` | Save with custom name (auth required) |
| `📚 My Graphs` | Manage saved files (auth required) |
| `📜 Version History` | View, load, and revert file versions with optimized scroll preservation |
| `🤖 AI Assistant` | Open AI helper |
| `🔍 Analysis` | Toggle analysis panel |
| `📖 Docs` | View documentation |
| `📁 Import GitHub` | Import any public GitHub repository structure as YAML |
| `🔍 Search` | Find nodes in diagram |
| `⛶ Fullscreen` | Toggle fullscreen mode |
| `⟲ Reset View` | Center and reset zoom |
| `📷 Export PNG` | Download high-quality diagram as PNG image |
| `🔄 Combined View` | Switch to split-panel editor |
| `👤 Profile` | Access user profile and settings |

---

## 🌟 Use Cases

- **🏢 System Architecture**: Visualize microservices and dependencies
- **📋 Configuration Docs**: Map complex config file structures
- **🗂️ Data Hierarchies**: Explore nested data relationships
- **📁 Code Repository Structure**: Import and visualize GitHub repository hierarchies
- **🔌 API Documentation**: Show endpoint relationships and structure
- **🧩 Component Trees**: Display UI component hierarchies
- **🚀 CI/CD Pipelines**: Map deployment and build processes
- **🗄️ Database Schemas**: Visualize table relationships
- **👥 Org Charts**: Display team and role hierarchies
- **📚 Documentation**: Create interactive technical documentation

---

## 🚧 Roadmap

> **Current Status**: The application is stable and production-ready with all core features implemented. The application includes enhanced version history modal with optimized layout and scroll preservation, along with GitHub repository import with large repository protection and safety mechanisms. The roadmap below outlines planned enhancements and capabilities.

### 🎯 **Next Phase Features**
- [ ] **SVG Export**: Vector format export for scalability and editing
- [ ] **PDF Export**: Professional documentation-ready exports
- [ ] **Node Customization**: User-customizable colors, shapes, and sizes
- [ ] **Template Library**: Pre-built YAML templates for common use cases
- [ ] **Real-time Collaborative Editing**: WebSocket-based multi-user editing
- [ ] **Mobile Responsiveness**: Enhanced touch controls and mobile layout

### 🔮 **Future Vision**
- [ ] **Performance Optimizations**: Advanced rendering for 500+ node diagrams
- [ ] **Interactive Diagram Builder**: Drag-and-drop visual editor
- [ ] **Version Control**: Git-like history with visual diffs
- [ ] **Advanced Exports**: PowerPoint, Figma, Draw.io integration
- [ ] **Enhanced AI Features**: Advanced natural language to YAML conversion
- [ ] **Smart Data Import**: HR systems, Jira, database schema sync
- [ ] **Advanced Visualization**: 3D diagrams, animations, custom themes
- [ ] **Diagram Themes**: Multiple color themes (dark mode, minimal, corporate)
- [ ] **Team Workspaces**: Role-based permissions and workflows
- [ ] **Plugin System**: Extensible architecture for custom features
- [ ] **Mobile Apps**: Native iOS/Android applications

---

## 🛠️ Development

> **Note**: This project is actively maintained with regular updates. Enhancements include optimized version history modal with scroll preservation and improved user experience. See the [Key Features](#-key-features) section for the latest enhancements.

### Available Scripts

**Frontend:**
```bash
cd client
npm run dev          # Development server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Lint code
```

**Backend:**
```bash
cd server
npm start            # Production server
npm run dev          # Development with nodemon
npm test             # Run tests
```

### Environment Variables

**Backend (`.env`):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yaml-visualizer
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 🔒 Security Features

- **🔐 JWT Authentication**: Secure token-based auth
- **🛡️ Password Hashing**: bcryptjs with salt rounds
- **🚦 Rate Limiting**: API abuse prevention
- **✅ Input Validation**: Comprehensive data validation
- **🌐 CORS Protection**: Configurable cross-origin requests
- **🔒 Security Headers**: Helmet.js security middleware

---

## 📱 Mobile Support

- **📱 Responsive Design**: Works on all screen sizes
- **🌐 Network Access**: Mobile devices supported via network IP
- **👆 Touch Interactions**: Mobile-optimized controls
- **📂 File Sharing**: Share links work across devices
- **🔐 Authentication**: Full login/register on mobile

---

## 🧪 Testing

**Frontend:**
```bash
cd client && npm test
```

**Backend:**
```bash
cd server && npm test
```

**End-to-End:**
- Create YAML file
- Save with custom name
- Copy share link
- Test in incognito/mobile browser

---

## 📊 Performance

### Optimization Features
- **⚡ Lazy Loading**: Components loaded on demand
- **🗜️ Code Splitting**: Optimized bundle sizes
- **💾 Caching**: Smart caching strategies
- **📈 Monitoring**: Performance tracking
- **🚀 CDN Ready**: Static asset optimization

### Recommended Limits
- **YAML Files**: < 1MB for optimal performance
- **Node Count**: < 500 nodes for optimal interaction (GitHub imports auto-limited to 500 nodes)
- **Browser Storage**: ~5-10MB localStorage limit

---

## 🐛 Known Issues & Limitations

- **Large YAML files** (>500 nodes): May experience performance degradation during rendering
- **Search functionality**: Only searches visible (expanded) nodes in the diagram
- **OpenAI API**: Requires active internet connection and valid API key for AI features
- **Browser storage**: localStorage size limits vary by browser (~5-10MB typical limit)
- **Mobile interactions**: Some advanced features work better on desktop/tablet devices
- **GitHub imports**: Auto-limited to 500 nodes to ensure smooth performance and prevent memory issues

> 💡 **Tip**: For large hierarchies, consider using the collapse/expand features to improve performance and navigation.

> 🛠️ **Updates**: Enhanced version history modal with optimized layout and scroll preservation, plus GitHub repository import with large repository protection and 500-node safety limits.

---

## 🤝 Support

- **📁 GitHub Issues**: [Report bugs or request features](https://github.com/srbmaury-team/Data-Visualizer/issues)
- **📖 Documentation**: Check this README for guidance
- **💬 Discussions**: Community support via GitHub Discussions

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Inspiration**: [todiagram.com](https://todiagram.com)
- **Frontend**: Built with [React](https://react.dev/) and [D3.js](https://d3js.org/)
- **Backend**: Powered by [Node.js](https://nodejs.org/) and [MongoDB](https://mongodb.com/)
- **AI**: Enhanced with [OpenAI API](https://openai.com/)
- **YAML**: Parsing by [js-yaml](https://github.com/nodeca/js-yaml)

---

## 👨‍💻 Author

**Saurabh Maurya**
- GitHub: [@srbmaury-team](https://github.com/srbmaury-team)
- Project: [Data-Visualizer](https://github.com/srbmaury-team/Data-Visualizer)

---

**⭐ If you find this project useful, please consider giving it a star!**

---

*Made with ❤️ using React, Node.js, MongoDB, D3.js, and AI*