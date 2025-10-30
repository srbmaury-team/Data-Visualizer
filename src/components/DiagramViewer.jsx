import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import TreeInfoPanel from "./TreeInfoPanel";
import SearchPanel from "./SearchPanel";
import "./DiagramViewer.css";

export default function DiagramViewer({ data, treeInfo }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [allExpanded, setAllExpanded] = useState(true);
  const [selectedPath, setSelectedPath] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nodeCount, setNodeCount] = useState({ visible: 0, total: 0 });
  const rootRef = useRef(null);
  const updateFunctionRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || !dimensions.width || !dimensions.height) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    
    // Clear previous content
    g.selectAll("*").remove();

    // Counter for unique IDs
    let i = 0;

    // Create hierarchy
    const root = d3.hierarchy(data);
    
    // Assign unique IDs and store original children structure
    root.each(d => {
      if (!d.id) {
        d.id = `node-${++i}`;
      }
      // IMPORTANT: Store a reference to children in _children for collapse/expand to work
      // BUT keep children visible (don't null them out) for initial expanded state
      if (d.children) {
        d._children = d.children;
      }
    });
    
    rootRef.current = root;

    // Calculate intelligent vertical spacing based on all nodes
    function calculateOptimalSpacing(root) {
      const levelStats = new Map();
      
      // Analyze all nodes by level
      root.each(node => {
        const level = node.depth;
        if (!levelStats.has(level)) {
          levelStats.set(level, {
            nodeCount: 0,
            totalProperties: 0,
            maxProperties: 0
          });
        }
        
        const stats = levelStats.get(level);
        stats.nodeCount++;
        
        const propCount = node.data.properties ? Object.keys(node.data.properties).length : 0;
        stats.totalProperties += propCount;
        stats.maxProperties = Math.max(stats.maxProperties, propCount);
      });
      
      // Find the level with most content
      let maxContentLevel = 0;
      let maxContent = 0;
      
      levelStats.forEach((stats, level) => {
        // Weight: number of nodes * average properties per node
        const content = stats.nodeCount * (stats.totalProperties / stats.nodeCount);
        if (content > maxContent) {
          maxContent = content;
          maxContentLevel = level;
        }
      });
      
      // Calculate base vertical spacing
      const maxStats = levelStats.get(maxContentLevel);
      const avgPropsPerNode = maxStats.totalProperties / maxStats.nodeCount;
      const nodeHeight = avgPropsPerNode * 24 + 70; // Increased for bottom padding
      
      // Base vertical spacing should fit the busiest level
      const baseVerticalSpacing = nodeHeight * 1.3; // 30% extra padding
      
      return {
        baseVerticalSpacing,
        levelStats
      };
    }
    
    const { baseVerticalSpacing } = calculateOptimalSpacing(root);

    // Create tree layout (horizontal) with intelligent sizing
    const treeLayout = d3.tree()
      .nodeSize([baseVerticalSpacing, 500]) // Increased horizontal spacing to 500
      .separation((a, b) => {
        // Different parents = more space
        if (a.parent !== b.parent) return 2;
        
        // Calculate based on actual node heights
        const aProps = (a.data.properties ? Object.keys(a.data.properties).length : 0);
        const bProps = (b.data.properties ? Object.keys(b.data.properties).length : 0);
        const aHeight = aProps * 24 + 70; // Match box height calculation
        const bHeight = bProps * 24 + 70;
        const maxHeight = Math.max(aHeight, bHeight);
        
        // Scale separation based on node size
        return Math.max(1, maxHeight / baseVerticalSpacing);
      });

    // Toggle function for expand/collapse
    function toggle(event, d) {
      event.stopPropagation(); // Prevent triggering node click
      if (d.children) {
        // Collapse: hide children but keep backup
        d._children = d.children;
        d.children = null;
      } else {
        // Expand: restore children but KEEP _children as permanent backup
        d.children = d._children;
        // DON'T null out _children - we need it for "Collapse All" to work!
      }
      update(d);
    }

    // Get path from root to node
    function getPathToNode(node) {
      const path = [];
      let current = node;
      while (current) {
        path.unshift(current);
        current = current.parent;
      }
      return path;
    }

    // Highlight path to clicked node
    function highlightPath(event, d) {
      const path = getPathToNode(d);
      const pathIds = path.map(n => n.id);
      setSelectedPath(pathIds);
    }

    // Store update function for external use (collapse/expand all)
    updateFunctionRef.current = update;

    // Initial render
    update(root);

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    
    // Store zoom behavior and svg for external control
    zoomBehaviorRef.current = { zoom, svg };

    // Center the view on initial load - adjusted for fully expanded tree
    const initialTransform = d3.zoomIdentity
      .translate(100, dimensions.height / 2)
      .scale(0.5); // Smaller zoom to see full expanded tree
    svg.call(zoom.transform, initialTransform);

    // Helper function to count all nodes (including hidden)
    function getAllNodesCount(node) {
      let count = 1; // Count this node
      if (node.children) {
        node.children.forEach(child => {
          count += getAllNodesCount(child);
        });
      } else if (node._children) {
        node._children.forEach(child => {
          count += getAllNodesCount(child);
        });
      }
      return count;
    }

    function update(source) {
      const duration = 300;
      
      // Compute the new tree layout
      let nodes = root.descendants();
      const links = root.links();
      
      // Update node count (visible vs total)
      const totalNodes = getAllNodesCount(root);
      setNodeCount({ visible: nodes.length, total: totalNodes });
      
      treeLayout(root);

      // Update nodes - ensure unique IDs
      const node = g.selectAll("g.node")
        .data(nodes, d => {
          if (!d.id) {
            d.id = `node-${++i}`;
          }
          return d.id;
        });

      // Enter new nodes
      const nodeEnter = node.enter()
        .append("g")
        .attr("class", "node")
        .attr("id", d => d.id) // Set ID on the group element for search
        .attr("transform", () => `translate(${source.y0 || 0},${source.x0 || 0})`)
        .style("opacity", 0);

      // Draw node boxes
      nodeEnter.each(function(d) {
        const nodeGroup = d3.select(this);
        const properties = d.data.properties || {};
        const propEntries = Object.entries(properties);
        
        // Calculate box dimensions
        const nodeName = d.data.name || "node";
        
        // Format and calculate max length
        const maxPropLength = Math.max(
          nodeName.length * 1.2, // Node name is bold, so slightly longer
          ...propEntries.map(([k, v]) => {
            let displayValue;
            if (typeof v === "object" && v !== null) {
              displayValue = JSON.stringify(v);
            } else if (v === null || v === undefined) {
              displayValue = "null";
            } else {
              displayValue = String(v);
            }
            return `${k}: ${displayValue}`.length;
          })
        );
        
        const boxWidth = Math.max(220, Math.min(maxPropLength * 8 + 40, 500));
        const boxHeight = Math.max(70, 50 + propEntries.length * 24); // Increased with bottom padding
        
        // Store dimensions for link calculations
        d.boxWidth = boxWidth;
        d.boxHeight = boxHeight;

        // Draw rectangle
        nodeGroup.append("rect")
          .attr("class", "node-box")
          .attr("width", boxWidth)
          .attr("height", boxHeight)
          .attr("x", -boxWidth / 2)
          .attr("y", -20)
          .attr("rx", 10)
          .style("cursor", "pointer")
          .on("click", (event) => highlightPath(event, d));

        // Draw node name (header)
        nodeGroup.append("text")
          .attr("class", "node-name")
          .attr("dy", 8)
          .attr("text-anchor", "middle")
          .text(nodeName);

        // Draw separator line
        if (propEntries.length > 0) {
          nodeGroup.append("line")
            .attr("class", "node-separator")
            .attr("x1", -boxWidth / 2 + 5)
            .attr("x2", boxWidth / 2 - 5)
            .attr("y1", 18)
            .attr("y2", 18);
        }

        // Draw properties
        propEntries.forEach(([key, value], i) => {
          // Format value properly
          let displayValue;
          if (typeof value === "object" && value !== null) {
            displayValue = JSON.stringify(value);
          } else if (value === null || value === undefined) {
            displayValue = "null";
          } else {
            displayValue = String(value);
          }
          
          const propGroup = nodeGroup.append("text")
            .attr("class", "node-property")
            .attr("dy", 42 + i * 24) // Increased spacing
            .attr("x", -boxWidth / 2 + 10);

          // Property key
          propGroup.append("tspan")
            .attr("class", "prop-key")
            .text(`${key}: `);

          // Property value with tooltip for truncated content
          const valueTspan = propGroup.append("tspan")
            .attr("class", "prop-value")
            .text(displayValue);
          
          // Add tooltip if value was truncated
          if (displayValue.endsWith("...")) {
            const fullValue = typeof value === "object" ? JSON.stringify(value) : String(value);
            valueTspan.append("title").text(fullValue);
          }
        });

        // Draw expand/collapse icon
        if (d._children || d.children) {
          const iconGroup = nodeGroup.append("g")
            .attr("class", "expand-icon")
            .attr("transform", `translate(${boxWidth / 2 - 20}, 5)`)
            .style("cursor", "pointer")
            .on("click", (event) => toggle(event, d));

          iconGroup.append("circle")
            .attr("r", 13)
            .attr("class", "icon-circle");

          iconGroup.append("text")
            .attr("class", "icon-text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("dy", 1)
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text(d.children ? "−" : "+");  // − when expanded, + when collapsed
        }
      });

      // Transition nodes to their new position
      const nodeUpdate = nodeEnter.merge(node);
      
      nodeUpdate.transition()
        .duration(duration)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .style("opacity", 1);
      
      // Update expand/collapse icons - update both text and position
      nodeUpdate.each(function(d) {
        const node = d3.select(this);
        const iconGroup = node.select(".expand-icon");
        
        if (!iconGroup.empty()) {
          // Update icon position based on current box width
          const boxWidth = d.boxWidth || 220;
          iconGroup.attr("transform", `translate(${boxWidth / 2 - 20}, 5)`);
          
          // Update icon text
          iconGroup.select(".icon-text")
            .text(d.children ? "−" : "+");
        }
      });

      // Transition exiting nodes
      node.exit()
        .transition()
        .duration(duration)
        .attr("transform", () => `translate(${source.y},${source.x})`)
        .style("opacity", 0)
        .remove();

      // Draw vertical indentation guide lines
      g.selectAll("line.guide-line").remove();
      
      // Calculate unique levels and their x positions
      const levels = new Set();
      nodes.forEach(n => levels.add(n.depth));
      
      const sortedLevels = Array.from(levels).sort((a, b) => a - b);
      const levelPositions = new Map();
      
      // Get x positions for each level from actual nodes
      nodes.forEach(n => {
        if (!levelPositions.has(n.depth)) {
          levelPositions.set(n.depth, n.y);
        }
      });
      
      // Draw vertical guide lines for each level (except root)
      sortedLevels.forEach(level => {
        if (level > 0) {
          const xPos = levelPositions.get(level);
          const nodesAtLevel = nodes.filter(n => n.depth === level);
          
          if (nodesAtLevel.length > 0) {
            const minY = Math.min(...nodesAtLevel.map(n => n.x));
            const maxY = Math.max(...nodesAtLevel.map(n => n.x));
            
            g.append("line")
              .attr("class", "guide-line")
              .attr("x1", xPos)
              .attr("y1", minY - 100)
              .attr("x2", xPos)
              .attr("y2", maxY + 100)
              .attr("stroke", "#e2e8f0")
              .attr("stroke-width", 1)
              .attr("stroke-dasharray", "4,4")
              .attr("opacity", 0.5);
          }
        }
      });

      // Update links - group by parent for single vertical line
      const linkGroups = new Map();
      links.forEach(link => {
        const parentId = link.source.id || `${link.source.data.name}-${link.source.depth}`;
        if (!linkGroups.has(parentId)) {
          linkGroups.set(parentId, {
            parent: link.source,
            children: []
          });
        }
        linkGroups.get(parentId).children.push(link.target);
      });

      // Remove old links
      g.selectAll("path.link").remove();
      g.selectAll("g.link-group").remove();

      // Draw new link groups
      linkGroups.forEach((group) => {
        const parent = group.parent;
        const children = group.children;
        
        if (children.length === 0) return;

        const linkGroup = g.append("g")
          .attr("class", "link-group")
          .style("opacity", 0);

        // Calculate parent connection point (right edge of parent box)
        const parentX = parent.x;
        const parentY = parent.y + (parent.boxWidth || 220) / 2;

        // Calculate children y positions
        const childrenY = children.map(c => c.y - (c.boxWidth || 220) / 2);
        const minChildY = Math.min(...childrenY);

        // Single vertical line from parent to span all children
        const verticalLineX = (parentY + minChildY) / 2;
        
        // Draw horizontal line from parent to vertical line
        linkGroup.append("path")
          .attr("class", "link")
          .attr("d", `M ${parentY} ${parentX} H ${verticalLineX}`);

        // Draw single vertical line spanning all children
        if (children.length > 1) {
          linkGroup.append("path")
            .attr("class", "link")
            .attr("d", `M ${verticalLineX} ${children[0].x} V ${children[children.length - 1].x}`);
        }

        // Draw horizontal lines to each child
        children.forEach(child => {
          const childX = child.x;
          const childY = child.y - (child.boxWidth || 220) / 2;
          
          linkGroup.append("path")
            .attr("class", "link")
            .attr("d", `M ${verticalLineX} ${childX} H ${childY}`);
        });

        // Fade in
        linkGroup.transition()
          .duration(duration)
          .style("opacity", 1);
      });

      // Store the old positions for transition
      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

  }, [data, dimensions]);

  // Separate effect for path highlighting
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Reset all nodes and links
    svg.selectAll(".node-box")
      .classed("path-highlight", false);
    
    svg.selectAll(".node-name")
      .classed("path-highlight", false);
    
    svg.selectAll(".link")
      .classed("path-highlight", false);

    // Apply path highlighting
    if (selectedPath.length > 0) {
      // Highlight nodes in path
      selectedPath.forEach(nodeId => {
        const nodeElement = svg.select(`#${nodeId}`);
        nodeElement.select(".node-box")
          .classed("path-highlight", true);
        nodeElement.select(".node-name")
          .classed("path-highlight", true);
      });

      // Highlight links in path
      for (let i = 0; i < selectedPath.length - 1; i++) {
        const sourceId = selectedPath[i];
        const targetId = selectedPath[i + 1];
        svg.selectAll("path.link")
          .filter(function() {
            const d = d3.select(this).datum();
            return d && d.source && d.target && 
                   d.source.id === sourceId && d.target.id === targetId;
          })
          .classed("path-highlight", true);
      }
    }
  }, [selectedPath]);

  // Separate effect for search highlighting (doesn't re-render entire tree)
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const allNodes = svg.selectAll(".node");

    // Reset all nodes
    allNodes.selectAll(".node-box")
      .classed("search-highlight", false)
      .classed("current-match", false);
    
    allNodes.selectAll(".node-name")
      .classed("search-match", false);

    // Apply search highlighting
    if (searchResults.length > 0 && searchTerm) {
      searchResults.forEach((result, index) => {
        const nodeElement = svg.select(`#${result.id}`);
        
        if (!nodeElement.empty()) {
          nodeElement.select(".node-box")
            .classed("search-highlight", true)
            .classed("current-match", index === currentSearchIndex);
          
          nodeElement.select(".node-name")
            .classed("search-match", true);
        }
      });
    }
  }, [searchResults, currentSearchIndex, searchTerm]);

  // Zoom to node function
  const zoomToNode = useCallback((node) => {
    if (!svgRef.current || !node) return;

    const svg = d3.select(svgRef.current);
    const transform = d3.zoomIdentity
      .translate(dimensions.width / 3, dimensions.height / 2)
      .scale(0.8)
      .translate(-node.y, -node.x);

    svg.transition()
      .duration(750)
      .call(
        d3.zoom().transform,
        transform
      );
  }, [dimensions.width, dimensions.height]);

  // Search functionality
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentSearchIndex(0);

    if (!term || !rootRef.current) {
      setSearchResults([]);
      return;
    }

    const results = [];
    const searchLower = term.toLowerCase();

    rootRef.current.each(node => {
      // Search in node name
      const nodeName = node.data.name || "";
      if (nodeName.toLowerCase().includes(searchLower)) {
        results.push({
          id: node.id,
          node: node,
          matchType: "name",
          matchText: nodeName
        });
        return;
      }

      // Search in properties
      if (node.data.properties) {
        for (const [key, value] of Object.entries(node.data.properties)) {
          const keyMatch = key.toLowerCase().includes(searchLower);
          const valueMatch = String(value).toLowerCase().includes(searchLower);
          
          if (keyMatch || valueMatch) {
            results.push({
              id: node.id,
              node: node,
              matchType: "property",
              matchText: `${key}: ${value}`
            });
            break;
          }
        }
      }
    });

    setSearchResults(results);

    // Zoom to first result
    if (results.length > 0) {
      zoomToNode(results[0].node);
    }
  }, [zoomToNode]);

  const handleNavigate = useCallback((direction) => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentSearchIndex(newIndex);
    zoomToNode(searchResults[newIndex].node);
  }, [searchResults, currentSearchIndex, zoomToNode]);

  // Collapse or expand all nodes
  // IMPORTANT: We maintain _children as a permanent backup reference to support
  // proper collapse/expand functionality. When a node is expanded, we restore
  // children from _children but keep _children intact for future collapses.
  const handleToggleAll = useCallback(() => {
    if (!rootRef.current || !updateFunctionRef.current) return;

    if (allExpanded) {
      // Collapse all nodes except root
      // Use recursive function to collapse from root's children downward
      const collapseNode = (node) => {
        // If this node has children, collapse them first, then collapse this node
        if (node.children) {
          // Save children array before recursing (important!)
          const childrenArray = node.children;
          
          // First recursively collapse all children
          childrenArray.forEach(child => collapseNode(child));
          
          // Then collapse this node (but not if it's root)
          if (node.depth > 0) {
            node._children = childrenArray;
            node.children = null;
          }
        } else if (node._children) {
          // Node is already collapsed, but might have hidden children that need collapsing
          node.children = node._children;
          collapseNode(node); // Try again now that it's expanded
        }
      };
      
      // Start from root's children (don't collapse root itself in the tree, but hide its children)
      if (rootRef.current.children) {
        // Save children array reference before any modifications
        const rootChildren = [...rootRef.current.children];
        
        // First, recursively collapse all descendants
        rootChildren.forEach(child => collapseNode(child));
        
        // Then collapse root's direct children (hide them from view)
        rootRef.current._children = rootChildren;
        rootRef.current.children = null;
      }
    } else {
      // Expand all nodes
      // Recursively expand from root downward
      const expandNode = (node) => {
        // Restore children from _children
        if (node._children) {
          node.children = node._children;
          // Don't null out _children - keep it as backup
        }
        // Recursively expand all children
        if (node.children) {
          node.children.forEach(child => expandNode(child));
        }
      };
      
      expandNode(rootRef.current);
    }

    setAllExpanded(!allExpanded);
    updateFunctionRef.current(rootRef.current);
  }, [allExpanded]);

  // Zoom control handlers
  const handleZoomIn = useCallback(() => {
    if (zoomBehaviorRef.current) {
      const { zoom, svg } = zoomBehaviorRef.current;
      svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (zoomBehaviorRef.current) {
      const { zoom, svg } = zoomBehaviorRef.current;
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    }
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (!zoomBehaviorRef.current || !gRef.current || !dimensions.width || !dimensions.height) return;
    
    const { zoom, svg } = zoomBehaviorRef.current;
    const bounds = gRef.current.getBBox();
    
    if (bounds.width === 0 || bounds.height === 0) return;
    
    const padding = 40;
    const dx = bounds.width;
    const dy = bounds.height;
    const x = bounds.x;
    const y = bounds.y;
    
    const scale = Math.min(
      (dimensions.width - padding * 2) / dx,
      (dimensions.height - padding * 2) / dy
    );
    
    const transform = d3.zoomIdentity
      .translate(dimensions.width / 2, dimensions.height / 2)
      .scale(scale)
      .translate(-x - dx / 2, -y - dy / 2);
    
    svg.transition().duration(750).call(zoom.transform, transform);
  }, [dimensions]);

  const handleZoomActualSize = useCallback(() => {
    if (zoomBehaviorRef.current && dimensions.width && dimensions.height) {
      const { zoom, svg } = zoomBehaviorRef.current;
      const transform = d3.zoomIdentity
        .translate(dimensions.width / 2, dimensions.height / 2)
        .scale(1);
      svg.transition().duration(500).call(zoom.transform, transform);
    }
  }, [dimensions]);

  const handleResetView = useCallback(() => {
    if (zoomBehaviorRef.current && dimensions.width && dimensions.height) {
      const { zoom, svg } = zoomBehaviorRef.current;
      const resetTransform = d3.zoomIdentity
        .translate(100, dimensions.height / 2)
        .scale(0.5);
      svg.transition().duration(750).call(zoom.transform, resetTransform);
    }
  }, [dimensions]);

  // Fullscreen handler
  const handleToggleFullscreen = useCallback(() => {
    const viewerElement = svgRef.current?.parentElement;
    if (!viewerElement) return;

    if (!document.fullscreenElement) {
      viewerElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);



  return (
    <div className="diagram-viewer">
      <svg ref={svgRef} className="diagram-svg">
        {/* Subtle grid pattern background */}
        <defs>
          <pattern
            id="grid-pattern"
            x="0"
            y="0"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="#cbd5e1" opacity="0.3" />
          </pattern>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f8f9fa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#e2e8f0', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        <g ref={gRef}></g>
      </svg>
      
      {/* Control buttons */}
      <div className="diagram-controls">
        <button 
          className="toggle-all-btn"
          onClick={handleToggleAll}
          title={allExpanded ? "Collapse all nodes" : "Expand all nodes"}
        >
          {allExpanded ? "🔽 Collapse All" : "🔼 Expand All"}
        </button>
      </div>

      {/* Enhanced zoom controls */}
      <div className="zoom-controls">
        <div className="zoom-controls-group">
          <button 
            className="zoom-btn zoom-in-btn"
            onClick={handleZoomIn}
            title="Zoom in (Ctrl + +)"
          >
            🔍+
          </button>
          <button 
            className="zoom-btn zoom-out-btn"
            onClick={handleZoomOut}
            title="Zoom out (Ctrl + -)"
          >
            🔍−
          </button>
        </div>
        
        <div className="zoom-controls-group">
          <button 
            className="zoom-btn fit-btn"
            onClick={handleZoomToFit}
            title="Fit to screen (F)"
          >
            📐
          </button>
          <button 
            className="zoom-btn actual-size-btn"
            onClick={handleZoomActualSize}
            title="Actual size (1:1)"
          >
            📏
          </button>
        </div>
        
        <div className="zoom-controls-group">
          <button 
            className="zoom-btn reset-btn"
            onClick={handleResetView}
            title="Reset view (R)"
          >
            🏠
          </button>
          <button 
            className="zoom-btn fullscreen-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen (F11)"}
          >
            {isFullscreen ? "⛶" : "⛶"}
          </button>
        </div>
      </div>

      {/* Node count badge */}
      <div className="node-count-badge">
        <span className="node-count-label">Showing</span>
        <span className="node-count-numbers">
          {nodeCount.visible} of {nodeCount.total}
        </span>
        <span className="node-count-label">nodes</span>
      </div>

      <SearchPanel
        onSearch={handleSearch}
        searchResults={searchResults}
        currentIndex={currentSearchIndex}
        onNavigate={handleNavigate}
      />
      
      <TreeInfoPanel treeInfo={treeInfo} />
    </div>
  );
}

