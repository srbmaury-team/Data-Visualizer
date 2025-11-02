# 🧩 YAML Diagram Visualizer

A powerful, AI-enhanced browser-based visualizer that converts YAML hierarchies into beautiful interactive tree diagrams. Built with React and D3.js, featuring a professional code editor, intelligent analysis, and AI-powered YAML generation.

![React](https://img.shields.io/badge/React-19.1.1-blue) ![D3.js](https://img.shields.io/badge/D3.js-7.9.0-orange) ![Vite](https://img.shields.io/badge/Vite-7.1.12-purple) ![js-yaml](https://img.shields.io/badge/js--yaml-4.1.0-green) ![OpenAI](https://img.shields.io/badge/OpenAI-6.7.0-brightgreen)

---

## ✨ Features

### 📝 **Professional YAML Editor**
- **Syntax Highlighting**: Color-coded YAML syntax with real-time highlighting
- **Line Numbers**: Synchronized line numbers on the left side
- **Indentation Guides**: Subtle vertical lines showing indentation levels
- **Search & Replace**: Full-featured find/replace with case-sensitivity options
- **Smart Indentation**:
  - `Tab` → Add 2 spaces
  - `Enter` → Auto-indent based on current line
  - Extra indent after lines ending with `:`
- **White Background Theme**: Clean, professional editor appearance
- **Monospace Font**: Professional code editor with proper spacing

### 🔀 **Combined Editor View**
- **Split-Panel Interface**: Edit YAML and view diagram simultaneously
- **Adjustable Divider**: Drag the resizer to customize panel widths (20%-80%)
- **Real-time Visualization**: Diagram updates automatically as you type
- **Integrated Search**: Search panel positioned for quick access
- **Unified Controls**: Save, load, and manage graphs without switching views
- **Professional Workflow**: Perfect for iterative YAML development

### 🎨 **Interactive Diagram Viewer**
- **D3.js Powered**: Smooth, performant tree visualization
- **Smart Node Display**:
  - Node name at the top (bold, dark text)
  - Properties below with color coding
  - Auto-sizing based on content
  - Rounded corners with drop shadows
  - **📋 Copy Icons**: One-click copy for every property value
    - Subtle icons appear on hover
    - Instant clipboard copy with visual feedback (checkmark)
    - Works for strings, numbers, and complex JSON values
- **Horizontal Tree Layout**: Logical left-to-right hierarchy
- **Straight Connectors**: Clean lines from parents to children
  - Single vertical line per parent
  - Horizontal lines to each child
- **Indentation Guide Lines**: Visual alignment helpers

### 🔍 **Search Functionality**
- **Real-time Search**: Find nodes by name or property
- **Smart Highlighting**:
  - Search matches highlighted in orange
  - Current result in yellow with pulse animation
  - Auto-zoom to results
- **Navigation Controls**: Next/Previous buttons
- **Match Counter**: Shows "X of Y results"
- **Debounced Input**: Smooth performance

### 🎯 **Expand/Collapse Controls**
- **Per-Node Toggle**: Click `+`/`−` icons to expand/collapse
- **Global Toggle**: Single button to collapse/expand entire tree
- **Initial State**: All nodes expanded by default
- **Smooth Animations**: Fluid transitions during state changes

### ✨ **Path Highlighting**
- **Click-to-Highlight**: Click any node box to highlight the path from root
- **Visual Path Tracing**: 
  - Highlighted nodes shown in green with shadow effect
  - Connecting links between path nodes thickened and colored
  - Node names emphasized with darker text
- **Smart Interaction**: 
  - Click node box → highlight path
  - Click `+`/`−` icon → expand/collapse
- **Clear Visual Distinction**: Easy to trace ancestry and relationships

### 🎚️ **Zoom & Navigation Controls**
- **Zoom In/Out**: `+` and `−` buttons for precise zoom control (no mouse wheel needed!)
- **Reset View**: `⟲` button instantly recenters and fits the diagram
- **Smooth Transitions**: 300ms animated zoom for polished UX
- **Accessibility**: Full keyboard and button control for users without mouse wheels

### 🖥️ **Fullscreen Mode**
- **Toggle Fullscreen**: `⛶` button for immersive viewing
- **Perfect for Presentations**: Focus on the diagram without distractions
- **Large Hierarchy Support**: Better exploration of complex trees
- **Auto-detect**: Automatically detects and updates fullscreen state

### 🔢 **Tree Information Panel**
- **Collapsible Sidebar**: Toggle visibility with "▶ Tree Structure" button
- **Live Statistics**: 
  - Total nodes count
  - Total edges count
  - Maximum depth (levels)
- **Nodes per Level**: Organized breakdown showing:
  - Level badge with node count
  - All node names at that level
  - **📋 Copy Icons**: Copy any node name or statistic value
- **Quick Tips**: Helpful interaction hints
- **Real-time Updates**: Reflects current tree state
- **Node Count Badge**: Additional "Showing X of Y nodes" badge for visibility tracking

### 💾 **Data Persistence**
- **Auto-save**: Automatic localStorage persistence
- **Save Graphs**: Save multiple YAML diagrams with custom names
- **Update Existing Graphs**: Overwrite saved graphs with new content
- **My Graphs Library**: 
  - View all saved diagrams
  - Load/Update/Delete actions with confirmation
  - Preview first 2 lines of YAML
  - Creation and update timestamps for each graph
- **Session Recovery**: Restore your work after browser refresh

### 🤖 **AI-Powered YAML Assistant**
- **OpenAI Integration**: Real AI-powered YAML generation and assistance
- **Smart Request Detection**: Automatically detects generation vs analysis requests
- **Visual Intelligence**: AI analysis of tree structure and organization
- **Context-Aware Responses**: Maintains conversation context and current YAML
- **Fallback Mode**: Helpful guidance when API key is not configured
- **Multiple Use Cases**:
  - Generate e-commerce platforms
  - Create microservices architectures
  - Build authentication systems
  - Design database schemas
  - And much more...

### 📊 **Intelligent Analysis Panel**
- **Real-time YAML Analysis**: Comprehensive structure analysis
- **Complexity Scoring**: Analyze depth, branching, and organization
- **Performance Insights**: Optimization recommendations
- **Best Practices**: YAML structure suggestions
- **Issue Detection**: Find problems, typos, and inconsistencies
- **Visual Metrics**: Tree statistics and health indicators

### ✅ **YAML Validation**
- **Real-time Validation**: Instant error detection
- **Common Typo Detection**: Catches `childern`, `childre`, etc.
- **Helpful Suggestions**: Auto-fix recommendations
- **Validation Panel**: 
  - Error details with line numbers
  - Warning messages
  - Success indicators
- **Tree Statistics**: Display nodes, levels, and edges count

### 🎨 **Beautiful UI**
- **Modern Gradient Backgrounds**: Creamish for editor, dotted for diagram
- **Responsive Design**: Works on different screen sizes
- **Smooth Animations**: Fade-ins, slide-ups, hover effects
- **Professional Colors**: Carefully chosen palette
- **Loading States**: Visual feedback for all actions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd yaml-diagram-react

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser (or the port shown in terminal if 5173 is in use).

### 🤖 AI Assistant Setup

The AI Assistant provides intelligent YAML generation and analysis. To unlock its full potential:

1. **Get an OpenAI API Key**:
   - Visit [OpenAI API](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure the Assistant**:
   - Click "🤖 AI Assistant" in the editor
   - Click the "🔑" button to enter your API key
   - Your key is stored locally and never sent elsewhere

3. **Without API Key**:
   - The assistant still provides helpful guidance
   - Shows what it would generate with real AI
   - Encourages proper setup for full functionality

---

## 📖 Usage

### Basic Workflow

1. **Write YAML** in the editor (left side)
   ```yaml
   name: My-App
   version: 1.0.0
   children:
     - name: Frontend
       framework: React
       children:
         - name: Components
           count: 25
     - name: Backend
       framework: Node.js
   ```

2. **Click "Visualize Diagram"** to render

3. **Interact with the diagram**:
   - Scroll to zoom (mouse wheel)
   - Drag to pan
   - Click nodes to expand/collapse
   - Use search to find specific nodes
   - Click "Collapse All" to minimize

4. **Use AI Assistant** (optional):
   - Click "🤖 AI Assistant" to open the AI helper
   - Configure OpenAI API key for enhanced features
   - Ask for YAML generation: "Create an e-commerce platform"
   - Request analysis: "Analyze my tree structure"
   - Get optimization suggestions and insights

5. **Save your work**:
   - Auto-saved to browser automatically
   - Click "💾 Save Graph" to save with custom name
   - Click "📚 My Graphs" to view saved diagrams

### YAML Format

The visualizer expects this structure:

```yaml
name: RootNode
property1: value1
property2: value2
children:
  - name: ChildNode1
    childProperty: value
    children:
      - name: GrandchildNode
        nestedProperty: value
  - name: ChildNode2
    anotherProperty: value
```

**Key Points:**
- `name`: Node display name (required)
- `children` or `nodes`: Array of child nodes (optional, both formats supported)
- Other properties: Displayed in the node box
- Default content loads from `src/assets/default.yaml`

**Alternative Format** (using `nodes`):
```yaml
name: root-system
version: 1.0
nodes:
  - name: Component1
    type: service
  - name: Component2
    type: api
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks and routing |
| **D3.js 7** | Tree layout and SVG manipulation |
| **OpenAI API** | AI-powered YAML generation and analysis |
| **js-yaml** | YAML parsing and validation |
| **Vite** | Build tool and dev server |
| **React Router** | Client-side routing |
| **CSS3** | Modern styling with animations and gradients |

---

## 📁 Project Structure

```
Data-Visualizer/
├── src/
│   ├── components/
│   │   ├── YamlEditor.jsx              # Professional YAML editor with syntax highlighting
│   │   ├── DiagramViewer.jsx           # D3.js tree visualization
│   │   ├── AiAssistant.jsx            # AI-powered YAML assistant
│   │   ├── AnalysisPanel.jsx          # YAML structure analysis
│   │   ├── SearchPanel.jsx            # Search functionality
│   │   ├── TreeInfoPanel.jsx          # Tree statistics display
│   │   ├── SavedGraphsModal.jsx       # Saved graphs management
│   │   ├── ReadmeViewer.jsx           # Documentation viewer
│   │   ├── Minimap.jsx                # Diagram overview (future)
│   │   ├── NodeFilterPanel.jsx        # Node filtering (future)
│   │   └── styles/                    # Component CSS files
│   │       ├── YamlEditor.css         # Editor styling with syntax highlighting
│   │       ├── DiagramViewer.css      # Diagram and controls styling
│   │       ├── AiAssistant.css        # AI assistant modal styling
│   │       ├── AnalysisPanel.css      # Analysis panel styling
│   │       ├── SearchPanel.css        # Search functionality styling
│   │       └── ... (other component styles)
│   ├── pages/
│   │   ├── EditorPage.jsx             # Main editor interface
│   │   ├── DiagramPage.jsx            # Diagram viewing page
│   │   ├── CombinedEditor.css         # Combined editor split-panel styling
│   │   ├── CombinedEditorPage.jsx     # Split-panel editor with live preview
│   │   └── DocsPage.jsx               # Documentation page
│   ├── services/
│   │   ├── openaiService.js           # OpenAI API integration
│   │   ├── yamlAnalysisService.js     # YAML analysis and insights
│   │   └── visualAnalysisService.js   # Tree visualization analysis
│   ├── utils/
│   │   ├── treeBuilder.js             # YAML → Tree conversion
│   │   └── yamlValidator.js           # YAML validation logic
│   ├── assets/
│   │   └── default.yaml               # Default YAML content
│   ├── App.jsx                        # Main application with routing
│   ├── App.css                        # Global application styles
│   ├── main.jsx                       # React entry point
│   └── index.css                      # Base CSS reset
├── public/                            # Static assets
├── index.html                         # HTML template
├── package.json                       # Dependencies and scripts
├── vite.config.js                     # Vite configuration
└── README.md                          # This file
```

---

## 🎨 Key Features Explained

### Intelligent Vertical Spacing
The diagram calculates optimal spacing by:
1. Analyzing content at each level
2. Counting properties per node
3. Computing vertical space needed
4. Applying 30% extra padding

### Dynamic Indentation Guides
- Calculated per-line based on leading spaces
- SVG lines positioned at 2-space intervals
- Synchronized with scroll position
- Golden color at 30% opacity

### Search Algorithm
- Searches both node names and properties
- Case-insensitive matching
- Returns node references with match types
- **Only searches visible nodes** (collapsed nodes are not searched)
- **Event-based communication**: Uses CustomEvents for Combined Editor
- **Stable function references**: Prevents unnecessary re-renders

### Copy to Clipboard Feature
- **SVG-embedded HTML**: Uses foreignObject for interactive buttons in diagram
- **Pointer events management**: Ensures copy buttons work without blocking node clicks
- **Visual feedback**: Icon changes to checkmark (✓) for 2 seconds after copying
- **Smart value handling**: 
  - Strings copied as-is
  - Objects converted to JSON
  - Numbers and booleans converted to strings
- **Hover effects**: Icons fade in on hover with scale animation
- **Works everywhere**: Both in diagram nodes and Tree Info Panel

### Path Highlighting Algorithm
- Traverses from clicked node to root
- Builds array of node IDs in the path
- Applies CSS classes to highlight:
  - Node boxes (green border + light green fill)
  - Node names (dark green + bold)
  - Connecting links (thicker green lines)
- Separate from expand/collapse interaction
- Click detection via event propagation control

### Zoom Controls Implementation
- **Zoom Behavior**: D3's `d3.zoom()` with scale extent `[0.1, 3]`
- **Stored in Ref**: `zoomBehaviorRef` holds zoom instance and SVG selection
- **Programmatic Control**: `svg.transition().call(zoom.scaleBy, factor)`
- **Reset Logic**: Centers at `translate(100, height/2)` with `scale(0.5)`
- **Smooth Transitions**: 300ms duration for zoom, 750ms for reset

### Fullscreen Implementation
- **Native API**: Uses browser's Fullscreen API
- **State Tracking**: `isFullscreen` state synced with `fullscreenchange` event
- **Element Target**: Applies to entire `.diagram-viewer` container
- **CSS Adjustments**: Dynamic styles for fullscreen viewport sizing
- **Graceful Fallback**: Error handling for unsupported browsers

### Node Count Tracking
- **Recursive Algorithm**: `getAllNodesCount()` traverses entire tree
- **Hidden Nodes**: Counts both `children` and `_children` arrays
- **Real-time Updates**: Recalculated on every `update()` call
- **State Management**: `{ visible, total }` object in React state
- **Performance**: O(n) complexity where n = total nodes

### Combined Editor Implementation
- **Split-panel Layout**: CSS Flexbox with adjustable divider
- **Drag Resizing**: Mouse event listeners for dynamic width adjustment
- **Real-time YAML Parsing**: Auto-visualizes on every keystroke (with validation)
- **Event-driven Search**: DiagramViewer dispatches CustomEvents for search results
- **Global Function Bridge**: Uses `window` object for component communication
- **Ref-based State Access**: Ensures fresh state values in closures
- **Stable Callbacks**: `useCallback` prevents SearchPanel re-renders
- **Constraints**: Divider constrained between 20% and 80% width

### LocalStorage Schema
```javascript
{
  "yaml-diagram-data": {
    yamlText: string,
    timestamp: ISO string
  },
  "yaml-diagram-saved-graphs": [
    {
      id: timestamp,
      name: string,
      yamlText: string,
      createdAt: ISO string,
      updatedAt: ISO string    // Added when graph is updated
    }
  ]
}
```

---

## 🎮 Controls & Interactions

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Tab` | Indent (add 2 spaces in editor) |
| `Enter` | New line with auto-indent in editor |

### 🖱️ Mouse Controls
| Action | Result |
|--------|--------|
| Mouse Wheel | Zoom in/out on diagram |
| Click & Drag | Pan the diagram |
| Click Node Box | Highlight path from root to node |
| Click `+`/`−` Icon (on node) | Expand/collapse that node |
| Click `📋` Icon (on property) | Copy property value to clipboard |
| Hover over Property | Reveal copy icon |
| Drag Divider (Combined Editor) | Adjust panel widths |

### 🎛️ Control Buttons
| Button | Action |
|--------|--------|
| `� Save Graph` | Save current YAML with custom name |
| `📚 My Graphs` | View and manage saved graphs |
| `🤖 AI Assistant` | Open AI-powered YAML helper |
| `🎨 Visualize` | Generate tree diagram from YAML |
| `🔍 Analysis` | Toggle analysis panel visibility |
| `�🔽/🔼 Collapse/Expand All` | Toggle entire tree (diagram) |
| `+` Zoom In | Zoom in 1.3x (diagram) |
| `−` Zoom Out | Zoom out 0.7x (diagram) |
| `⟲` Reset View | Recenter and reset zoom (diagram) |
| `⛶` Fullscreen | Toggle fullscreen mode (diagram) |

---

## 🎯 Use Cases

- **System Architecture Visualization**: Map microservices and dependencies
- **Configuration Documentation**: Visualize complex config files  
- **Data Structure Exploration**: Understand nested data hierarchies
- **API Structure Mapping**: Show endpoint relationships
- **Component Trees**: Display UI component hierarchies
- **CI/CD Pipeline Visualization**: Map deployment and build processes
- **Database Schema Documentation**: Visualize table relationships
- **Organizational Charts**: Display team and role hierarchies

---

## 🔧 Development

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Features

1. **New Component**: Add to `src/components/`
2. **New Utility**: Add to `src/utils/`
3. **Import and use** in `App.jsx` or relevant component
4. **Style** in corresponding CSS file

### Code Style
- Functional components with hooks
- Component-scoped CSS files (not CSS modules)
- Semantic HTML
- Accessible UI (ARIA labels, keyboard nav)

---

## 🐛 Known Issues & Limitations

- Very large YAML files (>1000 nodes) may experience performance degradation
- localStorage has ~5-10MB limit (varies by browser)
- OpenAI API requires internet connection and valid API key
- Search only works on visible (expanded) nodes
- Single scrollbar in YAML editor (fixed duplicate scrollbar issue)
- No real-time collaboration features yet

---

## 🚀 Future Enhancements

- [ ] Export diagram as PNG/SVG/PDF
- [ ] Dark mode toggle
- [ ] Import YAML files via drag-and-drop
- [ ] Multiple tree layout algorithms (vertical, radial)
- [ ] Custom node styling and themes
- [ ] Collaborative editing (real-time)
- [ ] GitHub integration for repository YAML files
- [ ] Compare two YAML files side-by-side
- [ ] Plugin system for extensibility
- [ ] Webhook support for auto-updates
- [ ] Performance optimization for massive files (>10k nodes)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Saurabh Maurya**

---

## 🙏 Acknowledgments

- Inspired by [todiagram.com](https://todiagram.com)
- Built with [React](https://react.dev/)
- Powered by [D3.js](https://d3js.org/)
- YAML parsing by [js-yaml](https://github.com/nodeca/js-yaml)

---

## 📮 Support

If you have questions or need help, please:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation above

---

**⭐ If you find this project useful, please consider giving it a star!**

---

Made with ❤️ and React
