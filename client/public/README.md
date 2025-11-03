# 🧩 YAML Data Visualizer

A powerful, production-ready full-stack application that converts YAML hierarchies into beautiful interactive tree diagrams. Features comprehensive user authentication, file sharing, AI-powered assistance, and a professional editing experience with high-quality export capabilities.

![React](https://img.shields.io/badge/React-19.1.1-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![MongoDB](https://img.shields.io/badge/MongoDB-8.0+-brightgreen) ![D3.js](https://img.shields.io/badge/D3.js-7.9.0-orange) ![Express](https://img.shields.io/badge/Express-4.18+-red) ![OpenAI](https://img.shields.io/badge/OpenAI-6.7.0-purple) ![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF)

---

## 🌟 **Recently Added Features**

### ✅ **User Profile Management System** (NEW!)
### ✅ **Advanced Export System** (NEW!)
- **High-Quality PNG Export**: Professional diagram exports with intelligent sizing
- **White Node Backgrounds**: Clean, readable node styling with dark text
- **Dotted Background Pattern**: Professional appearance with subtle texture
- **Smart Tree-Based Sizing**: Automatically calculates optimal dimensions using tree structure
- **Keyboard Shortcuts**: Quick export with Ctrl+E (Cmd+E on Mac)
- **Clean Output**: Removes grid patterns and UI elements for professional results
- **Tree Data Integration**: Uses level analysis for perfect fit-to-screen sizing

### ✅ **Enhanced YAML Validation & User Experience**
- **Real-Time Validation**: Live YAML syntax checking with immediate feedback
- **Toast Notifications**: Instant error alerts when attempting to visualize invalid YAML
- **Smart Error Handling**: Context-aware error messages with line-specific guidance
- **Graceful Degradation**: Editor remains functional even with invalid content

### ✅ **Complete User Profile Management System**
- **Comprehensive Profile Page**: Three-tab interface (Profile, Dashboard, Security)
- **Profile Editing**: Update username and email with real-time header updates
- **Password Management**: Secure password change functionality
- **Account Deletion**: Full account deletion with confirmation
- **Dashboard Analytics**: Personal statistics and recent activity
- **Clickable Username**: Navigate to profile by clicking username in header

### ✅ **Enhanced Authentication & Dark UI**
- **Dark Theme Auth Modals**: Professional dark-themed login/signup forms
- **Smart Error Handling**: Context-aware error messages and session management
- **Graceful Logout Flow**: Proper success messaging and home page redirect
- **Real-time Updates**: Profile changes instantly reflect across the app
- **Session Management**: Automatic cleanup and token refresh
- **CORS Optimization**: Multi-device development support (localhost + network IP)

### ✅ **User Authentication & File Management**
- **JWT-based Authentication**: Secure user registration and login
- **Personal File Library**: Save, organize, and manage YAML diagrams
- **Share Functionality**: Generate shareable links for public viewing
- **Cross-Device Access**: Mobile-optimized with network IP support

### ✅ **Enhanced Sharing System**
- **One-Click Share**: Copy shareable links directly from saved graphs
- **Read-Only Viewer**: Clean, distraction-free view for shared content
- **Public Gallery**: Browse community-shared diagrams *(planned)*
- **Mobile Compatible**: Full functionality across all devices

### ✅ **Improved Architecture**
- **MVC Backend**: Separated controllers from routes for better organization
- **Network Accessibility**: Server configured for mobile device access
- **CORS Optimization**: Seamless cross-device development and sharing
- **Error Handling**: Comprehensive error boundaries and user feedback

### ✅ **Enhanced AI & Analysis Features**
- **AI Visual Intelligence**: AI-powered tree structure analysis and insights
- **Multi-Service Analysis**: YAML, visual, and performance analysis services
- **Smart Recommendations**: AI suggestions for optimization and improvements
- **Interactive Analysis Panel**: Real-time YAML structure evaluation with scoring
- **Context-Aware Responses**: AI maintains conversation context for better assistance

---

## ✨ Core Features

### 📝 **Professional YAML Editor**
- **Syntax Highlighting**: Color-coded YAML with real-time validation
- **Smart Indentation**: Auto-indent with proper YAML formatting
- **Search & Replace**: Full-featured find/replace functionality
- **Line Numbers**: Professional code editor experience
- **White Background Theme**: Clean, readable interface

### 🔀 **Split-Panel Interface**
- **Combined Editor**: Edit YAML and view diagram simultaneously
- **Adjustable Divider**: Drag to customize panel widths (20%-80%)
- **Real-time Updates**: Diagram updates as you type
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🎨 **Interactive Diagram Viewer**
- **D3.js Powered**: Smooth, performant tree visualization
- **Smart Node Display**: Auto-sizing with properties and copy functionality
- **Horizontal Layout**: Logical left-to-right hierarchy
- **Path Highlighting**: Click nodes to trace from root
- **Expand/Collapse**: Per-node and global tree controls

### 🔍 **Advanced Search & Navigation**
- **Real-time Search**: Find nodes by name or property
- **Smart Highlighting**: Visual feedback with match counters
- **Zoom Controls**: Precise zoom in/out/reset functionality
- **Fullscreen Mode**: Immersive viewing for large diagrams
- **Minimap**: Overview navigation for large diagrams

### 💾 **Data Management**
- **User Accounts**: Secure registration and login
- **Save & Organize**: Personal library of YAML diagrams
- **Share Links**: Generate public URLs for sharing
- **Export Options**: High-quality PNG export with professional styling
- **Real-time Validation**: Live YAML syntax checking with error notifications

### 🤖 **AI-Powered Assistant**
- **OpenAI Integration**: Generate YAML from natural language
- **Smart Analysis**: Structure analysis and optimization tips
- **Context Awareness**: Maintains conversation context
- **Fallback Mode**: Helpful guidance without API key

### 📊 **Analysis & Insights**
- **Tree Statistics**: Node counts, depth, complexity metrics
- **Performance Insights**: Optimization recommendations
- **Validation**: Real-time YAML syntax checking
- **Best Practices**: Structure improvement suggestions

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas)
- **OpenAI API Key** (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/srbmaury-team/Data-Visualizer.git
cd Data-Visualizer

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Configuration

1. **Backend Setup**:
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

2. **Start MongoDB** (if running locally)

3. **Run the Application**:
   ```bash
   # Terminal 1: Start backend server
   cd server && npm start

   # Terminal 2: Start frontend development server
   cd client && npm run dev -- --host
   ```

4. **Access the Application**:
   - Frontend: `http://localhost:5173` (or network IP for mobile)
   - Backend API: `http://localhost:5000`

### 🤖 AI Assistant Setup (Optional)

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. In the app, click "🤖 AI Assistant" → "🔑" to enter your key
3. Key is stored locally for enhanced features

---

## 📖 Usage Guide

### Basic Workflow

1. **Register/Login** to save your work and access profile features
2. **Write YAML** in the left editor panel
3. **View Diagram** updates in real-time on the right
4. **Save & Share** your diagrams with custom names
5. **Manage Profile** by clicking your username in the header
6. **Use AI Assistant** for generation and analysis
7. **Access Dashboard** for personal analytics and file management

### YAML Format

```yaml
name: RootNode
version: 1.0.0
environment: production
children:
  - name: Frontend
    framework: React
    children:
      - name: Components
        count: 25
      - name: Pages
        count: 8
  - name: Backend
    framework: Node.js
    database: MongoDB
    children:
      - name: API Routes
        count: 12
      - name: Controllers
        count: 8
```

**Key Structure:**
- `name`: Required node identifier
- `children` or `nodes`: Array of child nodes
- Custom properties: Displayed in node boxes
- Nested hierarchy: Unlimited depth supported

---

## 🏗️ Architecture

### Frontend (`/client`)
```
React 19 + Vite 7
├── components/          # Reusable UI components
│   ├── YamlEditor.jsx      # Professional code editor
│   ├── DiagramViewer.jsx   # D3.js tree visualization
│   ├── AiAssistant.jsx     # AI-powered helper
│   ├── AuthModal.jsx       # Login/register forms
│   ├── SavedGraphsModal.jsx # File management
│   ├── SaveGraphModal.jsx  # Save dialog
│   ├── Minimap.jsx         # Diagram overview navigation
│   ├── AnalysisPanel.jsx   # YAML analysis panel
│   ├── SearchPanel.jsx     # Search functionality
│   ├── TreeInfoPanel.jsx   # Tree statistics
│   ├── NodeFilterPanel.jsx # Node filtering
│   ├── ReadmeViewer.jsx    # Documentation viewer
│   ├── Header.jsx          # Application header
│   └── Toast.jsx           # Notification system
├── pages/               # Route components
│   ├── EditorPage.jsx      # Basic editor interface
│   ├── CombinedEditorPage.jsx # Split-panel editor (main)
│   ├── DiagramPage.jsx     # Diagram-only view
│   ├── ProfilePage.jsx     # User profile management (NEW!)
│   ├── SharedViewerPage.jsx   # Public sharing view
│   ├── SharedViewerWrapper.jsx # Shared content wrapper
│   └── DocsPage.jsx        # Documentation page
├── contexts/            # React contexts
│   ├── AuthContext.jsx     # Authentication context
│   └── ToastContext.jsx    # Toast notification context
├── hooks/               # Custom React hooks
│   ├── useAuth.js          # Authentication hook
│   ├── useToast.js         # Toast notification hook
│   └── useYamlFiles.js     # YAML file management hook
├── services/            # API communication
│   ├── apiService.js       # Backend API calls
│   ├── openaiService.js    # AI integration
│   ├── yamlAnalysisService.js # Analysis logic
│   └── visualAnalysisService.js # Tree analysis
├── utils/               # Helper functions
│   ├── treeBuilder.js      # YAML → Tree conversion
│   ├── yamlValidator.js    # Validation logic
│   └── pngExport.js        # PNG export functionality (NEW!)
└── assets/              # Static assets
    └── default.yaml        # Default YAML content
```

### Backend (`/server`)
```
Node.js + Express 4.18 + MongoDB 8.0
├── src/
│   ├── controllers/     # Business logic (MVC pattern)
│   │   ├── authController.js   # Authentication
│   │   ├── userController.js   # User management
│   │   └── yamlController.js   # File operations
│   ├── routes/          # API route definitions
│   │   ├── auth.js         # /api/auth/*
│   │   ├── user.js         # /api/user/*
│   │   └── yaml.js         # /api/yaml/*
│   ├── models/          # Database schemas
│   │   ├── User.js         # User accounts
│   │   └── YamlFile.js     # YAML documents
│   └── middleware/      # Custom middleware
│       ├── auth.js         # JWT verification
│       └── errorHandler.js # Error handling
└── server.js            # Main server entry point
```

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
| `Ctrl/Cmd + E` | **Export diagram as PNG** |

### 🖱️ Mouse Controls
| Action | Result |
|--------|--------|
| Mouse Wheel | Zoom diagram |
| Click & Drag | Pan diagram |
| Click Node | Highlight path to root |
| Click `+`/`−` | Expand/collapse node |
| Click `📋` | Copy property value |
| Drag Divider | Adjust panel widths |
| **Click Username** | **Navigate to profile page** |

### 🎛️ Interface Buttons
| Button | Function |
|--------|----------|
| `💾 Save Graph` | Save with custom name (auth required) |
| `📚 My Graphs` | Manage saved files (auth required) |
| `🤖 AI Assistant` | Open AI helper |
| `🔍 Analysis` | Toggle analysis panel |
| `📖 Docs` | View documentation |
| `🔍 Search` | Find nodes in diagram |
| `⛶ Fullscreen` | Toggle fullscreen mode |
| `⟲ Reset View` | Center and reset zoom |
| `📷 Export PNG` | **Download high-quality diagram as PNG image** |
| `🔄 Combined View` | Switch to split-panel editor |
| **`👤 Profile`** | **Access user profile and settings** |

---

## 🌟 Use Cases

- **🏢 System Architecture**: Visualize microservices and dependencies
- **📋 Configuration Docs**: Map complex config file structures
- **🗂️ Data Hierarchies**: Explore nested data relationships
- **🔌 API Documentation**: Show endpoint relationships and structure
- **🧩 Component Trees**: Display UI component hierarchies
- **🚀 CI/CD Pipelines**: Map deployment and build processes
- **🗄️ Database Schemas**: Visualize table relationships
- **👥 Org Charts**: Display team and role hierarchies
- **📚 Documentation**: Create interactive technical documentation

---

## 🚧 Roadmap

> **Current Status**: The application is **stable and production-ready** with all core features implemented. Recent updates have improved auth modal styling and export functionality. The roadmap below outlines planned enhancements and new capabilities.

### 🎯 **Next Phase Features**
- [ ] **SVG Export**: Vector format export for scalability and editing
- [ ] **PDF Export**: Professional documentation-ready exports
- [ ] **Diagram Themes**: Multiple color themes (dark mode, minimal, corporate)
- [ ] **Node Customization**: User-customizable colors, shapes, and sizes
- [ ] **Template Library**: Pre-built YAML templates for common use cases
- [ ] **Real-time Collaborative Editing**: WebSocket-based multi-user editing
- [ ] **Mobile Responsiveness**: Enhanced touch controls and mobile layout

### 🔮 **Future Vision**
- [ ] **Performance Optimizations**: Advanced rendering for 1000+ node diagrams
- [ ] **Interactive Diagram Builder**: Drag-and-drop visual editor
- [ ] **Version Control**: Git-like history with visual diffs
- [ ] **Advanced Exports**: PowerPoint, Figma, Draw.io integration
- [ ] **Enhanced AI Features**: Advanced natural language to YAML conversion
- [ ] **Smart Data Import**: HR systems, Jira, database schema sync
- [ ] **Advanced Visualization**: 3D diagrams, animations, custom themes
- [ ] **Team Workspaces**: Role-based permissions and workflows
- [ ] **Plugin System**: Extensible architecture for custom features
- [ ] **Mobile Apps**: Native iOS/Android applications

---

## 🛠️ Development

> **Note**: This project is actively maintained with regular updates. See the [Recently Added Features](#-recently-added-features) section for the latest enhancements.

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
- **Node Count**: < 1000 nodes for smooth interaction
- **Browser Storage**: ~5-10MB localStorage limit

---

## 🐛 Known Issues & Limitations

- **Large YAML files** (>1000 nodes): May experience performance degradation during rendering
- **Search functionality**: Only searches visible (expanded) nodes in the diagram
- **OpenAI API**: Requires active internet connection and valid API key for AI features
- **Browser storage**: localStorage size limits vary by browser (~5-10MB typical limit)
- **Mobile interactions**: Some advanced features work better on desktop/tablet devices

> 💡 **Tip**: For large hierarchies, consider using the collapse/expand features to improve performance and navigation.

> 🛠️ **Recent Fixes**: Auth modal styling issues have been resolved in the latest version.

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