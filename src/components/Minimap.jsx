import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './styles/Minimap.css';

export default function Minimap({ data, mainTransform, onViewportChange, width = 200, height = 150 }) {
  const minimapRef = useRef(null);
  const [viewportRect, setViewportRect] = useState({ x: 0, y: 0, width: 100, height: 75 });

  useEffect(() => {
    if (!data || !minimapRef.current) return;

    const svg = d3.select(minimapRef.current);
    svg.selectAll("*").remove();

    // Create scaled-down version of the tree
    const minimapScale = 0.1; // 10% of original size
    const nodeSize = 3; // Small nodes for minimap
    const linkWidth = 1; // Thin links

    // Create tree layout
    const treeLayout = d3.tree().size([width / minimapScale, height / minimapScale]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    // Create group for minimap content
    const g = svg.append('g')
      .attr('transform', `scale(${minimapScale})`);

    // Draw links
    g.selectAll('.minimap-link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'minimap-link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .attr('stroke', '#999')
      .attr('stroke-width', linkWidth)
      .attr('fill', 'none');

    // Draw nodes
    g.selectAll('.minimap-node')
      .data(root.descendants())
      .enter()
      .append('circle')
      .attr('class', 'minimap-node')
      .attr('cx', d => d.y)
      .attr('cy', d => d.x)
      .attr('r', nodeSize)
      .attr('fill', d => d.children ? '#4a90e2' : '#82ca9d')
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);

    // Update viewport indicator
    updateViewportIndicator();
  }, [data, width, height]);

  useEffect(() => {
    updateViewportIndicator();
  }, [mainTransform]);

  const updateViewportIndicator = () => {
    if (!minimapRef.current || !mainTransform) return;

    const svg = d3.select(minimapRef.current);
    
    // Remove existing viewport indicator
    svg.select('.viewport-indicator').remove();

    // Calculate viewport position and size
    const scale = mainTransform.k;
    const viewportWidth = width / scale;
    const viewportHeight = height / scale;
    const viewportX = -mainTransform.x / scale;
    const viewportY = -mainTransform.y / scale;

    // Add viewport indicator
    svg.append('rect')
      .attr('class', 'viewport-indicator')
      .attr('x', Math.max(0, viewportX * 0.1))
      .attr('y', Math.max(0, viewportY * 0.1))
      .attr('width', Math.min(width, viewportWidth * 0.1))
      .attr('height', Math.min(height, viewportHeight * 0.1))
      .attr('fill', 'rgba(255, 0, 0, 0.2)')
      .attr('stroke', '#ff0000')
      .attr('stroke-width', 1)
      .style('cursor', 'move');

    setViewportRect({
      x: Math.max(0, viewportX * 0.1),
      y: Math.max(0, viewportY * 0.1),
      width: Math.min(width, viewportWidth * 0.1),
      height: Math.min(height, viewportHeight * 0.1)
    });
  };

  const handleMinimapClick = (event) => {
    const rect = minimapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert minimap coordinates to main diagram coordinates
    const mainX = -(x / 0.1) + (width / 2);
    const mainY = -(y / 0.1) + (height / 2);
    
    if (onViewportChange) {
      onViewportChange({ x: mainX, y: mainY, k: mainTransform?.k || 1 });
    }
  };

  return (
    <div className="minimap-container">
      <div className="minimap-header">
        <span className="minimap-title">🗺️ Overview</span>
      </div>
      <svg
        ref={minimapRef}
        width={width}
        height={height}
        className="minimap-svg"
        onClick={handleMinimapClick}
      />
    </div>
  );
}