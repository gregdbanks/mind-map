import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useMindMap } from '../../context/MindMapContext';
import { useMindMapPersistence } from '../../hooks/useMindMapPersistence';
import { useMindMapOperations } from '../../hooks/useMindMapOperations';
import type { Node, Link } from '../../types/mindMap';
import { exportToJSON, exportToPNG, importFromJSON } from '../../utils/exportUtils';
import { createHierarchicalLayout } from '../../utils/hierarchicalLayout';
import { createImprovedClusterLayout } from '../../utils/improvedClusterLayout';
import { calculateNodeDepths, getNodeVisualProperties, getLinkVisualProperties } from '../../utils/nodeHierarchy';
import { isAWSService } from '../../utils/awsServices';
import { demoNodes, demoLinks } from '../../data/demoMindMap';
import { NodeTooltip } from '../NodeTooltip';
import { NodeEditModal } from '../NodeEditModal';
import styles from './MindMapCanvas.module.css';

// Simplified to single layout mode for MVP consistency

export const MindMapCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  // Removed layout mode state - using single cluster layout for consistency
  const [isInitialized, setIsInitialized] = useState(false);
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
  const [lastNodeCount, setLastNodeCount] = useState(0);
  const [hasPositions, setHasPositions] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);

  const {
    state,
    dispatch,
    selectNode,
    startEditing,
    stopEditing,
  } = useMindMap();

  const { loading } = useMindMapPersistence();
  const operations = useMindMapOperations();

  // Convert state to arrays
  const nodes = Array.from(state.nodes.values());
  const links = state.links;

  // Fit all nodes in viewport
  const fitToViewport = () => {
    if (!svgRef.current || !gRef.current || !zoomBehaviorRef.current || nodes.length === 0) return;

    const bounds = gRef.current.node()?.getBBox();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const fullWidth = bounds.width + 100;
    const fullHeight = bounds.height + 100;
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    const scale = Math.min(1, 0.9 / Math.max(fullWidth / width, fullHeight / height));
    const translateX = width / 2 - scale * midX;
    const translateY = height / 2 - scale * midY;

    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(
        zoomBehaviorRef.current.transform as any,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  };

  // Initialize D3 structure when SVG is ready
  useEffect(() => {
    if (!svgElement) return;

    const svg = d3.select(svgElement);
    
    // Only create the main group once
    if (!isInitialized) {
      // Create main group that will hold everything
      const g = svg.append('g').attr('class', 'main-group');
      gRef.current = g;
      setIsInitialized(true);
    }

    // Setup/update zoom behavior every time isPanMode changes
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .filter((event) => {
        // Always allow wheel/touch zoom
        if (event.type === 'wheel' || event.type === 'touchstart' || event.type === 'touchmove') {
          return true;
        }
        // Only allow mouse drag when in pan mode (spacebar held)
        if (event.type === 'mousedown' || event.type === 'mousemove') {
          return isPanMode;
        }
        return true;
      })
      .on('zoom', (event) => {
        if (gRef.current) {
          gRef.current.attr('transform', event.transform);
        }
      });

    // Always rebind the zoom behavior
    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

  }, [svgElement, isPanMode, isInitialized]); // Run when svgElement is set or pan mode changes

  // Update visualization when data changes
  useEffect(() => {
    if (!isInitialized || !gRef.current) return;

    const g = gRef.current;

    // Calculate node depths for visual hierarchy
    const nodeDepths = calculateNodeDepths(state.nodes);

    // Update links
    const link = g.selectAll<SVGLineElement, Link>('.link')
      .data(links, (d: Link) => `${d.source}-${d.target}`);

    link.exit().remove();

    const linkEnter = link.enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999');

    const linkUpdate = linkEnter.merge(link);

    // Apply link visual properties based on hierarchy
    linkUpdate
      .attr('stroke-width', (d: Link) => {
        const sourceDepth = nodeDepths.get(typeof d.source === 'string' ? d.source : (d.source as any).id) || 0;
        const targetDepth = nodeDepths.get(typeof d.target === 'string' ? d.target : (d.target as any).id) || 0;
        return getLinkVisualProperties(sourceDepth, targetDepth).strokeWidth;
      })
      .attr('stroke-opacity', (d: Link) => {
        const sourceDepth = nodeDepths.get(typeof d.source === 'string' ? d.source : (d.source as any).id) || 0;
        const targetDepth = nodeDepths.get(typeof d.target === 'string' ? d.target : (d.target as any).id) || 0;
        return getLinkVisualProperties(sourceDepth, targetDepth).opacity;
      });

    // Update nodes  
    const node = g.selectAll<SVGGElement, Node>('.node')
      .data(nodes, (d: Node) => d.id);

    // Remove old nodes
    node.exit().remove();

    // Add new nodes
    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .attr('data-testid', 'mind-map-node');

    // Add background stroke for visual separation from lines
    nodeEnter.append('circle')
      .attr('class', 'node-background')
      .style('cursor', 'pointer');
    
    // Add main node circle
    nodeEnter.append('circle')
      .attr('class', 'node-main')
      .style('cursor', 'pointer');
    
    nodeEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('pointer-events', 'none');

    // Add action buttons group for each NEW node only
    const actionsGroup = nodeEnter.append('g')
      .attr('class', 'node-actions')
      .style('opacity', 0)
      .style('pointer-events', 'all');

    // Add action button
    const addButton = actionsGroup.append('g')
      .attr('transform', 'translate(0, -35)')
      .style('cursor', 'pointer')
      .style('pointer-events', 'all'); // Ensure the group captures all events
    
    addButton.append('circle')
      .attr('r', 12)
      .attr('fill', '#4CAF50')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('pointer-events', 'all'); // Make circle clickable
    
    addButton.append('text')
      .text('+')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Edit action button
    const editButton = actionsGroup.append('g')
      .attr('transform', 'translate(35, 0)')
      .style('cursor', 'pointer')
      .style('pointer-events', 'all'); // Ensure the group captures all events
    
    editButton.append('circle')
      .attr('r', 12)
      .attr('fill', '#2196F3')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('pointer-events', 'all'); // Make circle clickable
    
    editButton.append('text')
      .text('✎')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .style('font-size', '14px')
      .style('pointer-events', 'none');

    // Delete action button
    const deleteButton = actionsGroup.append('g')
      .attr('transform', 'translate(0, 35)')
      .style('cursor', 'pointer')
      .style('pointer-events', 'all'); // Ensure the group captures all events
    
    deleteButton.append('circle')
      .attr('r', 12)
      .attr('fill', '#f44336')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('pointer-events', 'all'); // Make circle clickable
    
    deleteButton.append('text')
      .text('×')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .style('font-size', '20px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Update all nodes
    const nodeUpdate = nodeEnter.merge(node);

    // Apply background stroke for visual separation from lines
    // Apply to both new and existing nodes to ensure consistency
    nodeUpdate.selectAll('.node-background')
      .attr('r', (d: Node) => {
        const depth = nodeDepths.get(d.id) || 0;
        const radius = getNodeVisualProperties(depth).radius;
        // Use proportional buffer: 6px for root nodes, 4px for others
        const buffer = depth === 0 ? 6 : 4;
        return radius + buffer;
      })
      .attr('fill', '#f9f9f9') // Match canvas background color
      .attr('stroke', '#f9f9f9')
      .attr('stroke-width', 4)
      .style('pointer-events', 'none'); // Ensure background doesn't interfere with interactions

    // Apply visual hierarchy to main circles
    nodeUpdate.select('.node-main')
      .attr('r', (d: Node) => {
        const depth = nodeDepths.get(d.id) || 0;
        return getNodeVisualProperties(depth).radius;
      })
      .attr('fill', (d: Node) => {
        if (isAWSService(d.text)) {
          return '#FF9900'; // AWS orange for services
        }
        const depth = nodeDepths.get(d.id) || 0;
        return getNodeVisualProperties(depth).fillColor;
      })
      .attr('stroke', (d: Node) => {
        if (state.selectedNodeId === d.id) {
          return '#0066cc'; // Selected color overrides hierarchy
        }
        if (isAWSService(d.text)) {
          return '#232F3E'; // AWS dark blue for service borders
        }
        const depth = nodeDepths.get(d.id) || 0;
        return getNodeVisualProperties(depth).strokeColor;
      })
      .attr('stroke-width', (d: Node) => {
        const depth = nodeDepths.get(d.id) || 0;
        const baseWidth = getNodeVisualProperties(depth).strokeWidth;
        
        if (isAWSService(d.text)) {
          return baseWidth * 1.5; // Thicker borders for AWS services
        }
        
        if (state.selectedNodeId === d.id) {
          return baseWidth + 2; // Even thicker when selected
        }
        
        return baseWidth + 1; // Slightly thicker overall
      })
      .style('filter', (d: Node) => {
        const depth = nodeDepths.get(d.id) || 0;
        // Add subtle shadow for higher level nodes
        if (depth === 0) return 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))';
        if (depth === 1) return 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))';
        return 'none';
      });

    // Apply visual hierarchy to text
    nodeUpdate.select('text')
      .text((d: Node) => d.text)
      .style('font-size', (d: Node) => {
        const depth = nodeDepths.get(d.id) || 0;
        return `${getNodeVisualProperties(depth).fontSize}px`;
      })
      .style('font-weight', (d: Node) => {
        const depth = nodeDepths.get(d.id) || 0;
        return getNodeVisualProperties(depth).fontWeight;
      })
      .attr('fill', (d: Node) => {
        if (isAWSService(d.text)) {
          return '#FFFFFF'; // White text for AWS services (good contrast with orange)
        }
        const depth = nodeDepths.get(d.id) || 0;
        // Text color matches the stroke color for consistency
        return getNodeVisualProperties(depth).strokeColor;
      });

    // Apply cluster layout - only to nodes without positions (preserves IndexedDB and user drags)
    const nodesWithoutPositions = nodes.filter(n => n.x === undefined || n.y === undefined);
    
    if (nodesWithoutPositions.length > 0) {
      const positions = createImprovedClusterLayout(state.nodes, window.innerWidth, window.innerHeight);
      
      // Only update positions for nodes that don't have them
      nodesWithoutPositions.forEach(node => {
        const pos = positions.get(node.id);
        if (pos) {
          node.x = pos.x;
          node.y = pos.y;
          node.fx = pos.x;  // Fix position
          node.fy = pos.y;
        }
      });
      
      setLastNodeCount(nodes.length);
      setHasPositions(true);
    }
    
    // Apply positions to all nodes
    nodeUpdate
      .attr('transform', (d: Node) => `translate(${d.x || 0},${d.y || 0})`);

    // Update link positions
    linkUpdate
        .attr('x1', (d: any) => {
          const source = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
          return source?.x || 0;
        })
        .attr('y1', (d: any) => {
          const source = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source.id));
          return source?.y || 0;
        })
        .attr('x2', (d: any) => {
          const target = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
          return target?.x || 0;
        })
        .attr('y2', (d: any) => {
          const target = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target.id));
          return target?.y || 0;
        });

    // Setup drag behavior
    {
      // Simple drag
      const drag = d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          setIsDragging(true);
          setHoveredNodeId(null); // Clear hover during drag
          // Hide action buttons immediately when drag starts - find correct node by data
          g.selectAll<SVGGElement, Node>('.node')
            .filter((nodeData: Node) => nodeData.id === d.id)
            .select('.node-actions')
            .style('opacity', 0);
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          // Store temporary position for visual updates only
          const tempX = event.x;
          const tempY = event.y;
          
          // Update visual position immediately - find the correct node group by data
          // This ensures action buttons stay with their parent node during fast drags
          g.selectAll<SVGGElement, Node>('.node')
            .filter((nodeData: Node) => nodeData.id === d.id)
            .attr('transform', `translate(${tempX},${tempY})`);
          
          // Update connected links with temporary position
          g.selectAll<SVGLineElement, Link>('.link')
            .each(function(link: any) {
              const linkSelection = d3.select(this);
              const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
              const targetId = typeof link.target === 'string' ? link.target : link.target.id;
              
              if (sourceId === d.id) {
                linkSelection.attr('x1', tempX).attr('y1', tempY);
              }
              if (targetId === d.id) {
                linkSelection.attr('x2', tempX).attr('y2', tempY);
              }
            });
        })
        .on('end', (event, d) => {
          // Update actual node data and persist the final position
          const finalX = event.x;
          const finalY = event.y;
          
          // Update the node data
          d.x = finalX;
          d.y = finalY;
          d.fx = finalX;
          d.fy = finalY;
          
          // Persist the position to global state (debounced via persistence hook)
          operations.updateNodePosition(d.id, { x: finalX, y: finalY });
          
          setIsDragging(false);
        });

      nodeUpdate.call(drag);
    }

    // Event handlers
    nodeUpdate.on('click', (event: MouseEvent, d: Node) => {
      event.stopPropagation();
      selectNode(d.id);
    });

    nodeUpdate.on('dblclick', (event: MouseEvent, d: Node) => {
      event.stopPropagation();
      startEditing(d.id);
    });

    // Apply hover using mouseover/mouseout instead of mouseenter/mouseleave
    // These work better with drag interactions
    nodeUpdate
      .on('mouseover.hover', function(_event: MouseEvent, d: Node) {
        // Only set hover if not currently dragging or editing
        if (!isDragging && !state.editingNodeId) {
          setHoveredNodeId(d.id);
          // Show action buttons for this node
          d3.select(this).select('.node-actions')
            .transition()
            .duration(200)
            .style('opacity', 1);
        }
      })
      .on('mouseout.hover', function(_event: MouseEvent, _d: Node) {
        if (!isDragging) {
          setHoveredNodeId(null);
          // Hide action buttons
          d3.select(this).select('.node-actions')
            .transition()
            .duration(200)
            .style('opacity', 0);
        }
      });

    // Add click handlers for action buttons - attach to both enter and update selections
    const attachActionHandlers = function(selection: d3.Selection<SVGGElement, Node, any, any>) {
      selection.each(function(d: Node) {
        const nodeElement = d3.select(this);
        const actionButtons = nodeElement.select('.node-actions').selectAll('g');
        
        // Remove any existing handlers to prevent duplicates
        actionButtons.on('click', null);
        
        actionButtons.each(function(this: any, _buttonData: any, i: number) {
          const button = d3.select(this);
          
          if (i === 0) { // Add button
            button.on('click', function(event: MouseEvent) {
              event.stopPropagation();
              const newNode = operations.createNode(d.id, { 
                x: (d.x || 0) + 50, 
                y: (d.y || 0) + 50 
              });
              selectNode(newNode);
            });
          } else if (i === 1) { // Edit button
            button.on('click', function(event: MouseEvent) {
              event.stopPropagation();
              startEditing(d.id);
            });
          } else if (i === 2) { // Delete button
            button.on('click', function(event: MouseEvent) {
              event.stopPropagation();
              if (confirm('Delete this node and all its children?')) {
                operations.deleteNode(d.id);
              }
            });
          }
        });
      });
    };
    
    // Attach handlers to both new and existing nodes
    attachActionHandlers(nodeEnter);
    attachActionHandlers(nodeUpdate);

  }, [nodes.length, links.length, state.selectedNodeId, state.editingNodeId, isInitialized, selectNode, startEditing, state.nodes, isDragging, operations]);

  // Hide all action buttons when editing starts
  useEffect(() => {
    if (!gRef.current) return;
    
    const g = gRef.current;
    
    if (state.editingNodeId) {
      // Hide all action buttons when editing
      g.selectAll('.node-actions')
        .transition()
        .duration(200)
        .style('opacity', 0);
      
      // Clear hover state
      setHoveredNodeId(null);
    }
  }, [state.editingNodeId]);

  // Apply hover effects based on hoveredNodeId
  useEffect(() => {
    if (!gRef.current) return;
    
    const g = gRef.current;
    const nodeDepths = calculateNodeDepths(state.nodes);
    
    if (!hoveredNodeId) {
      // Reset styles when not hovering
      g.selectAll('.node').style('opacity', 1);
      g.selectAll('.link')
        .style('opacity', 1)
        .attr('stroke', '#999')
        .attr('stroke-width', (d: any) => {
          const sourceDepth = nodeDepths.get(d.source) || 0;
          const targetDepth = nodeDepths.get(d.target) || 0;
          return getLinkVisualProperties(sourceDepth, targetDepth).strokeWidth;
        });
      return;
    }
    
    // Find connected nodes
    const connectedNodeIds = new Set<string>();
    connectedNodeIds.add(hoveredNodeId);
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      if (sourceId === hoveredNodeId) {
        connectedNodeIds.add(targetId);
      } else if (targetId === hoveredNodeId) {
        connectedNodeIds.add(sourceId);
      }
    });

    // Apply hover styles
    g.selectAll<SVGGElement, Node>('.node')
      .style('opacity', (d: Node) => connectedNodeIds.has(d.id) ? 1 : 0.3);
    
    g.selectAll<SVGLineElement, Link>('.link')
      .style('opacity', (d: Link) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        return (sourceId === hoveredNodeId || targetId === hoveredNodeId) ? 1 : 0.2;
      })
      .attr('stroke', (d: Link) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        return (sourceId === hoveredNodeId || targetId === hoveredNodeId) ? '#0066cc' : '#999';
      })
      .attr('stroke-width', (d: Link) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        const sourceDepth = nodeDepths.get(sourceId) || 0;
        const targetDepth = nodeDepths.get(targetId) || 0;
        const baseWidth = getLinkVisualProperties(sourceDepth, targetDepth).strokeWidth;
        return (sourceId === hoveredNodeId || targetId === hoveredNodeId) ? baseWidth + 2 : baseWidth;
      });
  }, [hoveredNodeId, links, state.nodes]);

  // Handle canvas interactions
  useEffect(() => {
    if (!svgRef.current || !gRef.current || !isInitialized) return;

    const svg = d3.select(svgRef.current);

    const handleClick = function(event: MouseEvent) {
      if (event.target === svgRef.current) {
        selectNode(null);
      }
    };

    svg.on('click', handleClick);

    return () => {
      svg.on('click', null);
    };
  }, [state.selectedNodeId, operations, selectNode, isInitialized]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.editingNodeId) return;

      // Handle spacebar for pan mode
      if (e.code === 'Space' && !isPanMode) {
        e.preventDefault();
        setIsPanMode(true);
        return;
      }

      const modifiers = {
        ctrlKey: e.ctrlKey || e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      };

      if (modifiers.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          exportToJSON(state);
        } else if (e.key === 'p') {
          e.preventDefault();
          if (svgRef.current) {
            exportToPNG(svgRef.current);
          }
        }
      }

      // Add 'c' for cluster layout, 't' for tree
      if (!modifiers.ctrlKey && !modifiers.shiftKey && !modifiers.altKey) {
        if (e.key === 'c') {
          e.preventDefault();
          setLayoutMode('cluster');
        } else if (e.key === 't') {
          e.preventDefault();
          setLayoutMode('tree');
        } else if (e.key === 'F2' && state.selectedNodeId) {
          e.preventDefault();
          startEditing(state.selectedNodeId);
        }
      }

      operations.handleKeyPress(e.key, modifiers);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release pan mode when spacebar is released
      if (e.code === 'Space') {
        setIsPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state, operations, stopEditing, isPanMode]);

  if (loading) {
    return <div className={styles.loading}>Loading mind map...</div>;
  }

  // Get hovered node details for tooltip
  const hoveredNode = hoveredNodeId ? state.nodes.get(hoveredNodeId) : null;
  const nodeDepths = calculateNodeDepths(state.nodes);
  const hoveredNodeDepth = hoveredNode ? nodeDepths.get(hoveredNode.id) || 0 : 0;
  
  // Count children of hovered node
  const hoveredNodeChildCount = hoveredNode ? 
    nodes.filter(n => n.parent === hoveredNode.id).length : 0;

  // Get editing node details
  const editingNode = state.editingNodeId ? state.nodes.get(state.editingNodeId) : null;

  return (
    <>
      {/* Toolbar outside canvas container to avoid transform context issues */}
      <div className={styles.toolbar} data-testid="toolbar">
        <button 
          className={styles.iconButton}
          onClick={() => {
            dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: demoNodes, links: demoLinks } });
          }}
          title="Load Demo Map"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </button>
        
        <button 
          className={styles.iconButton}
          onClick={fitToViewport}
          title="Fit all nodes in viewport"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            <path d="M15,3H6A3,3,0,0,0,3,6V15a1,1,0,0,0,2,0V6A1,1,0,0,1,6,5h9a1,1,0,0,0,0-2Z"/>
            <path d="M21,9a1,1,0,0,0-1,1v8a1,1,0,0,1-1,1H11a1,1,0,0,0,0,2h8a3,3,0,0,0,3-3V10A1,1,0,0,0,21,9Z"/>
          </svg>
        </button>
        
        <button 
          className={styles.iconButton}
          onClick={() => exportToJSON(state)}
          title="Export as JSON"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </button>
        
        <button 
          className={styles.iconButton}
          onClick={() => svgRef.current && exportToPNG(svgRef.current)}
          title="Export as PNG"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
          </svg>
        </button>
        
        <label className={styles.iconButton} title="Import JSON file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
          </svg>
          <input 
            type="file" 
            accept=".json" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                importFromJSON(file).then(importedState => {
                  if (importedState) {
                    const nodes = Array.from(importedState.nodes.values());
                    dispatch({ type: 'LOAD_MINDMAP', payload: { nodes, links: importedState.links } });
                    // Force persistence by updating lastModified after a brief delay
                    setTimeout(() => {
                      dispatch({ type: 'UPDATE_LAST_MODIFIED' });
                      fitToViewport();
                    }, 100);
                  }
                });
              }
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className={styles.canvasContainer}>
        {hoveredNode && !state.editingNodeId && (
          <NodeTooltip
            node={hoveredNode}
            depth={hoveredNodeDepth}
            childCount={hoveredNodeChildCount}
          />
        )}

        {editingNode && (
          <NodeEditModal
            nodeId={editingNode.id}
            initialText={editingNode.text}
            isOpen={!!state.editingNodeId}
            onSave={(nodeId, text) => {
              operations.updateNodeText(nodeId, text);
              stopEditing();
            }}
            onCancel={stopEditing}
          />
        )}

        {nodes.length === 0 && (
        <div className={styles.instructions}>
          <h2>Welcome to Mind Map!</h2>
          <p><strong>Load Demo Map</strong> to get started, or create nodes using the <strong>+ button</strong> on existing nodes</p>
        </div>
      )}

      <svg
        ref={(el) => {
          svgRef.current = el;
          setSvgElement(el);
        }}
        width="100%"
        height="100%"
        style={{ 
          cursor: isPanMode ? (isDragging ? 'grabbing' : 'grab') : 'default', 
          display: 'block', 
          position: 'relative', 
          zIndex: 1,
          opacity: isPanMode ? 0.9 : 1,
          transition: 'opacity 0.1s ease'
        }}
      />
      </div>
    </>
  );
};