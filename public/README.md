# 🧩 YAML Diagram Visualizer

A powerful, browser-based visualizer that converts YAML hierarchies into beautiful interactive tree diagrams. Built with React and D3.js, featuring a professional code editor with line numbers and indentation guides.

![React](https://img.shields.io/badge/React-19.1.1-blue) ![D3.js](https://img.shields.io/badge/D3.js-7.9.0-orange) ![Vite](https://img.shields.io/badge/Vite-7.1.7-purple) ![js-yaml](https://img.shields.io/badge/js--yaml-4.1.0-green)

---

## ✨ Features

### 📝 **Professional YAML Editor**
- **Line Numbers**: Synchronized line numbers on the left side
- **Indentation Guides**: Subtle vertical lines showing indentation levels
- **Smart Indentation**:
  - `Tab` → Add 2 spaces
  - `Enter` → Auto-indent based on current line
  - Extra indent after lines ending with `:`
- **Creamish Theme**: Eye-friendly color scheme
- **Monospace Font**: Professional code editor appearance
- **Auto-scroll Sync**: Line numbers and guides follow your scrolling

### 🎨 **Interactive Diagram Viewer**
- **D3.js Powered**: Smooth, performant tree visualization
- **Smart Node Display**:
  - Node name at the top (bold, dark text)
  - Properties below with color coding
  - Auto-sizing based on content
  - Rounded corners with drop shadows
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

### 🔢 **Node Count Badge**
- **Live Statistics**: Shows "Showing X of Y nodes" in real-time
- **Visibility Tracking**: Understand how much of the tree is visible vs collapsed
- **Green Badge**: Color-coded for quick recognition
- **Always Visible**: Bottom-left corner placement for constant awareness

### 💾 **Data Persistence**
- **Auto-save**: Automatic localStorage persistence
- **Save Graphs**: Save multiple YAML diagrams with custom names
- **My Graphs Library**: 
  - View all saved diagrams
  - Quick load/delete actions
  - Preview first 2 lines of YAML
  - Creation timestamp for each graph
- **Session Recovery**: Restore your work after browser refresh

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

Visit `http://localhost:5173` in your browser.

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

4. **Save your work**:
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
| **React** | UI framework with hooks |
| **D3.js** | Tree layout and SVG manipulation |
| **js-yaml** | YAML parsing |
| **Vite** | Build tool and dev server |
| **CSS3** | Styling with animations |

---

## 📁 Project Structure

```
yaml-diagram-react/
├── src/
│   ├── components/
│   │   ├── YamlEditor.jsx          # YAML input editor with line numbers
│   │   ├── YamlEditor.css          # Editor styling
│   │   ├── DiagramViewer.jsx       # D3.js tree visualization
│   │   ├── DiagramViewer.css       # Diagram styling
│   │   ├── SearchPanel.jsx         # Search functionality
│   │   ├── SearchPanel.css         # Search panel styling
│   │   ├── TreeInfoPanel.jsx       # Tree statistics display
│   │   └── TreeInfoPanel.css       # Info panel styling
│   ├── utils/
│   │   ├── treeBuilder.js          # YAML → Tree conversion
│   │   └── yamlValidator.js        # YAML validation logic
│   ├── App.jsx                     # Main application component
│   ├── App.css                     # Global application styles
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Base CSS reset
├── public/                         # Static assets
├── index.html                      # HTML template
├── package.json                    # Dependencies
├── vite.config.js                  # Vite configuration
└── README.md                       # This file
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

### LocalStorage Schema
```javascript
{
  "yaml-diagram-data": {
    yamlText: string,
    showDiagram: boolean,
    timestamp: ISO string
  },
  "yaml-diagram-saved-graphs": [
    {
      id: timestamp,
      name: string,
      yamlText: string,
      createdAt: ISO string
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

### 🎛️ Control Buttons
| Button | Action |
|--------|--------|
| `🔽/🔼 Collapse/Expand All` | Toggle entire tree (top-right) |
| `+` Zoom In | Zoom in 1.3x (bottom-right) |
| `−` Zoom Out | Zoom out 0.7x (bottom-right) |
| `⟲` Reset View | Recenter and reset zoom (bottom-right) |
| `⛶` Fullscreen | Toggle fullscreen mode (bottom-right) |

---

## 🎯 Use Cases

- **System Architecture Visualization**: Map microservices and dependencies
- **Configuration Documentation**: Visualize complex config files
- **Data Structure Exploration**: Understand nested data hierarchies
- **API Structure Mapping**: Show endpoint relationships
- **Component Trees**: Display UI component hierarchies

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
- Horizontal scroll on very wide trees
- No YAML export from diagram (one-way conversion)

---

## 🚀 Future Enhancements

- [ ] Export diagram as PNG/SVG/PDF
- [ ] Dark mode toggle
- [ ] Minimap for large diagrams
- [ ] Syntax highlighting in editor
- [ ] YAML schema validation
- [ ] Collaborative editing (real-time)
- [ ] Custom node styling
- [ ] Vertical tree layout option
- [ ] Drag-and-drop file upload
- [ ] Compare two YAML files

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
