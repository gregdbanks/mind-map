import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useMindMap } from '../../context/MindMapContext';
import { useMapPersistence } from '../../hooks/useMapPersistence';
import { useMindMapOperations } from '../../hooks/useMindMapOperations';
import type { Node, Link } from '../../types';
import { exportToJSON, importFromJSONText } from '../../utils/exportUtils';
import { calculateNodeDepths, getNodeVisualProperties, getLinkVisualProperties } from '../../utils/nodeHierarchy';
import { isAWSService } from '../../utils/awsServices';
import { NodeTooltip } from '../NodeTooltip';
import { NodeEditModal } from '../NodeEditModal';
import { ImportModal } from '../ImportModal';
import { SearchBar } from '../SearchBar';
import { LayoutSelector, type LayoutType } from '../LayoutSelector';
import { layoutManager, savePreferredLayout, loadPreferredLayout } from '../../utils/layoutManager';
import type { ForceNode, ForceLink } from '../../utils/forceDirectedLayout';
import { getAllConnectedNodes } from '../../utils/getNodeDescendants';
import { NotesModal } from '../NotesModal';
import { HelpGuideModal } from '../HelpGuideModal';
import type { NodeNote } from '../../types';
import { useMapNotes } from '../../hooks/useMapNotes';
import { v4 as uuidv4 } from 'uuid';
import styles from './MindMapCanvas.module.css';

interface MindMapCanvasProps {
  mapId: string;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({ mapId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<ForceNode, ForceLink> | null>(null);
  const customPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  // Layout state management
  const [currentLayout, setCurrentLayout] = useState<LayoutType>(() => loadPreferredLayout());
  const [isInitialized, setIsInitialized] = useState(false);
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchHighlightNodeId, setSearchHighlightNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [lockedHighlightNodeId, setLockedHighlightNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [notesModalNodeId, setNotesModalNodeId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Multi-select state
  const [multiSelectedNodeIds, setMultiSelectedNodeIds] = useState<Set<string>>(new Set());
  const multiSelectedNodeIdsRef = useRef<Set<string>>(new Set());
  const prevMultiSelectedRef = useRef<Set<string>>(new Set());
  const marqueeRef = useRef<{ startX: number; startY: number; active: boolean; justFinished: boolean }>({ startX: 0, startY: 0, active: false, justFinished: false });

  // Drag start positions ref - survives useEffect re-runs during drag
  const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const dragStartCoordsRef = useRef({ x: 0, y: 0 });
  const marqueeGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const currentLayoutRef = useRef(currentLayout);

  // Keep refs in sync with state so D3 event handler closures always see latest values
  useEffect(() => {
    multiSelectedNodeIdsRef.current = multiSelectedNodeIds;
  }, [multiSelectedNodeIds]);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);
  useEffect(() => {
    currentLayoutRef.current = currentLayout;
  }, [currentLayout]);

  // Use IndexedDB for notes storage
  const { notes, saveNote, deleteNote, getNote } = useMapNotes(mapId);

  const {
    state,
    dispatch,
    selectNode,
    startEditing,
    stopEditing,
    markClean,
  } = useMindMap();

  const { loading: persistenceLoading } = useMapPersistence(mapId);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const loading = persistenceLoading && !loadingTimeout;
  
  // Add timeout for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000); // 3 second timeout
    
    return () => clearTimeout(timeout);
  }, []);

  // Store positions when nodes are loaded from persistence
  useEffect(() => {
    if (state.nodes.size > 0 && !loading && customPositionsRef.current.size === 0) {
      // Check if nodes have positions (from persistence)
      const hasPositions = Array.from(state.nodes.values()).some(node => 
        node.x !== undefined && node.y !== undefined
      );
      
      if (hasPositions) {
        // Store these positions as custom positions
        state.nodes.forEach((node, id) => {
          if (node.x !== undefined && node.y !== undefined) {
            customPositionsRef.current.set(id, { x: node.x, y: node.y });
          }
        });
        
        // Set layout to custom to preserve loaded positions
        setCurrentLayout('custom');
      }
    }
  }, [state.nodes, loading]);
  const operations = useMindMapOperations();

  const handleImport = async (jsonText: string) => {
    const importResult = importFromJSONText(jsonText);
    if (importResult) {
      const nodes = Array.from(importResult.state.nodes.values());
      
      // Store the imported positions as custom positions
      customPositionsRef.current.clear();
      nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          customPositionsRef.current.set(node.id, { x: node.x, y: node.y });
        }
      });
      
      dispatch({ type: 'LOAD_MINDMAP', payload: { nodes, links: importResult.state.links } });
      
      // Import notes
      if (importResult.notes && importResult.notes.length > 0) {
        for (const note of importResult.notes) {
          await saveNote(note);
        }
      }
      
      // Set layout to custom to preserve imported positions
      setCurrentLayout('custom');
      
      // Force persistence by updating lastModified after a brief delay
      setTimeout(() => {
        dispatch({ type: 'UPDATE_LAST_MODIFIED' });
        fitToViewport();
      }, 100);
      setIsImportModalOpen(false);
    }
  };

  // Note handlers
  const handleNoteSave = (nodeId: string) => async (content: string, contentJson: any, plainText?: string) => {
    const existingNote = getNote(nodeId);
    
    const note: NodeNote = {
      id: existingNote?.id || uuidv4(),
      nodeId,
      content,
      contentJson,
      contentType: contentJson ? 'tiptap' : 'html',
      plainText,
      tags: existingNote?.tags || [],
      isPinned: existingNote?.isPinned || false,
      createdAt: existingNote?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      await saveNote(note);
      // Update the node to indicate it has a note
      operations.updateNode(nodeId, { hasNote: true, noteId: note.id });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleNoteDelete = (nodeId: string) => async () => {
    try {
      await deleteNote(nodeId);
      // Update the node to indicate it no longer has a note
      operations.updateNode(nodeId, { hasNote: false, noteId: undefined });
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  // Handle layout changes
  const handleLayoutChange = (newLayout: LayoutType) => {
    // Stop any running simulation
    if (simulationRef.current) {
      layoutManager.stopSimulation(simulationRef.current);
      simulationRef.current = null;
    }
    
    // Before changing layout, save current positions if they exist
    if (currentLayout !== 'custom' && newLayout === 'custom') {
      // Switching TO custom layout - use stored custom positions if available
      const nodeUpdates = new Map<string, Partial<Node>>();
      state.nodes.forEach((_node, id) => {
        const customPos = customPositionsRef.current.get(id);
        if (customPos) {
          nodeUpdates.set(id, { x: customPos.x, y: customPos.y });
        }
      });
      
      if (nodeUpdates.size > 0) {
        nodeUpdates.forEach((updates, nodeId) => {
          operations.updateNode(nodeId, updates);
        });
      }
    } else if (currentLayout === 'custom' && newLayout !== 'custom') {
      // Switching FROM custom layout - save current positions first
      customPositionsRef.current.clear();
      state.nodes.forEach((node, id) => {
        if (node.x !== undefined && node.y !== undefined) {
          customPositionsRef.current.set(id, { x: node.x, y: node.y });
        }
      });
      
      // Clear positions to force re-layout with new algorithm
      const nodeUpdates = new Map<string, Partial<Node>>();
      state.nodes.forEach((_node, id) => {
        nodeUpdates.set(id, { x: undefined, y: undefined, fx: undefined, fy: undefined });
      });
      nodeUpdates.forEach((updates, nodeId) => {
        operations.updateNode(nodeId, updates);
      });
    } else if (newLayout !== 'custom') {
      // Switching between non-custom layouts - clear positions
      const nodeUpdates = new Map<string, Partial<Node>>();
      state.nodes.forEach((_node, id) => {
        nodeUpdates.set(id, { x: undefined, y: undefined, fx: undefined, fy: undefined });
      });
      nodeUpdates.forEach((updates, nodeId) => {
        operations.updateNode(nodeId, updates);
      });
    }
    
    setCurrentLayout(newLayout);
    savePreferredLayout(newLayout);
  };

  // Convert state to arrays
  const nodes = Array.from(state.nodes.values());
  const links = state.links;

  // Fit nodes in viewport - focuses on selected/highlighted nodes if any, otherwise all nodes
  const fitToViewport = () => {
    if (!svgRef.current || !gRef.current || !zoomBehaviorRef.current || nodes.length === 0) return;

    let bounds;
    
    // If a node is selected, fit to the selected node and its children only
    if (state.selectedNodeId) {
      // Get all connected nodes (selected + descendants)
      const connectedNodeIds = getAllConnectedNodes(state.selectedNodeId, state.nodes);
      
      // Calculate bounds manually from the positions of connected nodes
      const connectedNodes = Array.from(connectedNodeIds)
        .map(id => state.nodes.get(id))
        .filter((node): node is Node => node !== undefined && node.x !== undefined && node.y !== undefined);
      
      if (connectedNodes.length === 0) {
        // Fall back to all nodes if no connected nodes have positions
        bounds = gRef.current.node()?.getBBox();
      } else {
        // Calculate bounding box from node positions
        const nodeRadius = 15; // Approximate node radius for padding
        const xs = connectedNodes.map(node => node.x!);
        const ys = connectedNodes.map(node => node.y!);
        
        const minX = Math.min(...xs) - nodeRadius;
        const maxX = Math.max(...xs) + nodeRadius;
        const minY = Math.min(...ys) - nodeRadius;
        const maxY = Math.max(...ys) + nodeRadius;
        
        bounds = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      }
    } else {
      // No selection - fit all nodes as before
      bounds = gRef.current.node()?.getBBox();
    }

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

  // Pan to specific node
  const panToNode = (nodeId: string) => {
    if (!svgRef.current || !gRef.current || !zoomBehaviorRef.current) return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.x === undefined || node.y === undefined) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = 1.2; // Slight zoom for better focus
    const translateX = width / 2 - scale * node.x;
    const translateY = height / 2 - scale * node.y;

    // Highlight the node briefly
    setSearchHighlightNodeId(nodeId);
    setTimeout(() => setSearchHighlightNodeId(null), 2000);

    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
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

      // Create marquee selection group (screen-space, not transformed by zoom)
      const marqueeGroup = svg.append('g').attr('class', 'marquee-group');
      marqueeGroupRef.current = marqueeGroup;

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

    // Add note indicator
    nodeEnter.append('circle')
      .attr('class', 'note-indicator')
      .attr('r', 4)
      .attr('fill', '#9C27B0')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('display', 'none')
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

    // Notes action button
    const notesButton = actionsGroup.append('g')
      .attr('transform', 'translate(-35, 0)')
      .style('cursor', 'pointer')
      .style('pointer-events', 'all'); // Ensure the group captures all events
    
    notesButton.append('circle')
      .attr('r', 12)
      .attr('fill', '#9C27B0')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('pointer-events', 'all'); // Make circle clickable
    
    notesButton.append('text')
      .text('📝')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .style('font-size', '10px')
      .style('pointer-events', 'none');

    // Update all nodes
    const nodeUpdate = nodeEnter.merge(node);

    // Apply background stroke for visual separation from lines
    // Apply to both new and existing nodes to ensure consistency
    nodeUpdate.selectAll('.node-background')
      .attr('r', (d: any) => {
        const node = d as Node;
        const depth = nodeDepths.get(node.id) || 0;
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
      .attr('r', (d: any) => {
        const node = d as Node;
        const depth = nodeDepths.get(node.id) || 0;
        return getNodeVisualProperties(depth).radius;
      })
      .attr('fill', (d: any) => {
        const node = d as Node;
        // Use custom color if specified
        if (node.color) {
          return node.color;
        }
        
        if (isAWSService(node.text)) {
          return '#FF9900'; // AWS orange for services
        }
        const depth = nodeDepths.get(node.id) || 0;
        return getNodeVisualProperties(depth).fillColor;
      })
      .attr('stroke', (d: any) => {
        const node = d as Node;
        if (state.selectedNodeId === node.id) {
          return '#0066cc'; // Selected color overrides hierarchy
        }
        if (isAWSService(node.text)) {
          return '#232F3E'; // AWS dark blue for service borders
        }
        const depth = nodeDepths.get(node.id) || 0;
        return getNodeVisualProperties(depth).strokeColor;
      })
      .attr('stroke-width', (d: any) => {
        const node = d as Node;
        const depth = nodeDepths.get(node.id) || 0;
        const baseWidth = getNodeVisualProperties(depth).strokeWidth;
        
        // Thicker border for search highlight
        if (node.id === searchHighlightNodeId) {
          return baseWidth * 2.5;
        }
        
        if (isAWSService(node.text)) {
          return baseWidth * 1.5; // Thicker borders for AWS services
        }
        
        if (state.selectedNodeId === node.id) {
          return baseWidth + 2; // Even thicker when selected
        }
        
        return baseWidth + 1; // Slightly thicker overall
      })
      .style('filter', (d: any) => {
        const node = d as Node;
        const depth = nodeDepths.get(node.id) || 0;
        // Add subtle shadow for higher level nodes
        if (depth === 0) return 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))';
        if (depth === 1) return 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))';
        return 'none';
      });

    // Apply visual hierarchy to text
    nodeUpdate.select('text')
      .text((d: any) => (d as Node).text)
      .style('font-size', (d: any) => {
        const node = d as Node;
        const depth = nodeDepths.get(node.id) || 0;
        return `${getNodeVisualProperties(depth).fontSize}px`;
      })
      .style('font-weight', (d: any) => {
        const node = d as Node;
        const depth = nodeDepths.get(node.id) || 0;
        return getNodeVisualProperties(depth).fontWeight;
      })
      .attr('fill', (d: any) => {
        const node = d as Node;
        if (node.textColor) {
          return node.textColor;
        }
        if (isAWSService(node.text)) {
          return '#FFFFFF'; // White text for AWS services (good contrast with orange)
        }
        const depth = nodeDepths.get(node.id) || 0;
        // Text color matches the stroke color for consistency
        return getNodeVisualProperties(depth).strokeColor;
      });

    // Update note indicator
    nodeUpdate.select('.note-indicator')
      .style('display', (d: any) => {
        const node = d as Node;
        return node.hasNote ? 'block' : 'none';
      })
      .attr('transform', (d: any) => {
        const node = d as Node;
        const depth = nodeDepths.get(node.id) || 0;
        const radius = getNodeVisualProperties(depth).radius;
        // Position at top-right of the node
        const angle = -Math.PI / 4; // 45 degrees
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        return `translate(${x}, ${y})`;
      });

    // Apply selected layout - only to nodes without positions (preserves IndexedDB and user drags)
    const nodesWithoutPositions = nodes.filter(n => n.x === undefined || n.y === undefined);
    
    if (nodesWithoutPositions.length > 0) {
      // Stop any running simulation before applying new layout
      if (simulationRef.current) {
        layoutManager.stopSimulation(simulationRef.current);
        simulationRef.current = null;
      }
      
      // Handle position updates from layout manager
      const handlePositionUpdate = (positions: Map<string, { x: number; y: number }>) => {
        nodesWithoutPositions.forEach(node => {
          const pos = positions.get(node.id);
          if (pos) {
            node.x = pos.x;
            node.y = pos.y;
            // For animated layouts, don't fix positions to allow movement
            if (!layoutManager.isAnimatedLayout(currentLayout)) {
              node.fx = pos.x;
              node.fy = pos.y;
            }
          }
        });
        
        // Node positions are updated directly; SVG updates occur in this useEffect after handlePositionUpdate is called.
        // No React render cycle is triggered by these updates.
      };
      
      // Apply the layout
      const simulation = layoutManager.applyLayout(
        currentLayout,
        state.nodes,
        links,
        window.innerWidth,
        window.innerHeight,
        handlePositionUpdate
      );
      
      // Store simulation reference for animated layouts
      if (simulation) {
        simulationRef.current = simulation;
      } else {
        // For static layouts, positions are already updated by applyLayout via the onUpdate callback
        // No additional position update needed here
      }
    }
    
    // Apply positions to all nodes
    nodeUpdate
      .attr('transform', (d: any) => {
        const node = d as Node;
        return `translate(${node.x || 0},${node.y || 0})`;
      });

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

    // Setup drag behavior (supports single and group drag)
    // Uses refs for all mutable state to survive useEffect re-runs and avoid stale closures.
    {
      const drag = d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          isDraggingRef.current = true;
          setIsDragging(true);
          setHoveredNodeId(null);
          g.selectAll<SVGGElement, Node>('.node')
            .filter((nodeData: Node) => nodeData.id === d.id)
            .select('.node-actions')
            .style('opacity', 0);

          dragStartCoordsRef.current = { x: event.x, y: event.y };
          d.fx = d.x;
          d.fy = d.y;

          // Read latest selection from ref (not closure state)
          const currentSelection = multiSelectedNodeIdsRef.current;
          if (currentSelection.has(d.id) && currentSelection.size > 1) {
            const positions = new Map<string, { x: number; y: number }>();
            currentSelection.forEach(id => {
              // Read positions directly from D3 bound data for accuracy
              g.selectAll<SVGGElement, Node>('.node')
                .filter((nd: Node) => nd.id === id)
                .each((nd: Node) => {
                  if (nd.x !== undefined && nd.y !== undefined) {
                    positions.set(id, { x: nd.x, y: nd.y });
                  }
                });
            });
            dragStartPositionsRef.current = positions;
          } else {
            dragStartPositionsRef.current = new Map();
          }
        })
        .on('drag', (event, d) => {
          const { x: startX, y: startY } = dragStartCoordsRef.current;
          const dx = event.x - startX;
          const dy = event.y - startY;
          const positions = dragStartPositionsRef.current;
          const currentSelection = multiSelectedNodeIdsRef.current;

          if (positions.size > 1) {
            // Group drag: move all selected nodes by the delta
            g.selectAll<SVGGElement, Node>('.node')
              .filter((nodeData: Node) => currentSelection.has(nodeData.id))
              .each(function(nodeData: Node) {
                const startPos = positions.get(nodeData.id);
                if (startPos) {
                  d3.select(this).attr('transform', `translate(${startPos.x + dx},${startPos.y + dy})`);
                }
              });

            // Update connected links for all dragged nodes
            g.selectAll<SVGLineElement, Link>('.link')
              .each(function(link: any) {
                const linkSelection = d3.select(this);
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                const sourceStart = positions.get(sourceId);
                const targetStart = positions.get(targetId);
                if (sourceStart) {
                  linkSelection.attr('x1', sourceStart.x + dx).attr('y1', sourceStart.y + dy);
                }
                if (targetStart) {
                  linkSelection.attr('x2', targetStart.x + dx).attr('y2', targetStart.y + dy);
                }
              });
          } else {
            // Single node drag
            const tempX = event.x;
            const tempY = event.y;
            g.selectAll<SVGGElement, Node>('.node')
              .filter((nodeData: Node) => nodeData.id === d.id)
              .attr('transform', `translate(${tempX},${tempY})`);

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
          }
        })
        .on('end', (event, d) => {
          const { x: startX, y: startY } = dragStartCoordsRef.current;
          const dx = event.x - startX;
          const dy = event.y - startY;
          const positions = dragStartPositionsRef.current;

          if (positions.size > 1) {
            // Group drag end: persist all positions
            positions.forEach((startPos, id) => {
              const finalX = startPos.x + dx;
              const finalY = startPos.y + dy;
              // Update D3 bound data directly
              g.selectAll<SVGGElement, Node>('.node')
                .filter((nd: Node) => nd.id === id)
                .each((nd: Node) => {
                  nd.x = finalX;
                  nd.y = finalY;
                  nd.fx = finalX;
                  nd.fy = finalY;
                });
              operations.updateNodePosition(id, { x: finalX, y: finalY });
            });
          } else {
            const finalX = event.x;
            const finalY = event.y;
            d.x = finalX;
            d.y = finalY;
            d.fx = finalX;
            d.fy = finalY;
            operations.updateNodePosition(d.id, { x: finalX, y: finalY });
          }

          // Switch to custom layout if needed
          if (currentLayout !== 'custom') {
            customPositionsRef.current.clear();
            state.nodes.forEach((node, id) => {
              if (node.x !== undefined && node.y !== undefined) {
                customPositionsRef.current.set(id, { x: node.x, y: node.y });
              }
            });
            if (positions.size > 1) {
              positions.forEach((startPos, id) => {
                customPositionsRef.current.set(id, { x: startPos.x + dx, y: startPos.y + dy });
              });
            } else {
              customPositionsRef.current.set(d.id, { x: event.x, y: event.y });
            }
            setCurrentLayout('custom');
          }

          dragStartPositionsRef.current = new Map();
          isDraggingRef.current = false;
          setIsDragging(false);
        });

      nodeUpdate.call(drag);
    }

    // Event handlers
    nodeUpdate.on('click', (event: MouseEvent, d: Node) => {
      event.stopPropagation();

      // Ctrl+click: toggle node in multi-selection
      if (event.ctrlKey || event.metaKey) {
        setMultiSelectedNodeIds(prev => {
          const next = new Set(prev);
          if (next.has(d.id)) {
            next.delete(d.id);
          } else {
            next.add(d.id);
          }
          return next;
        });
        setLockedHighlightNodeId(d.id);
        return;
      }

      // Normal click: clear multi-selection, toggle locked highlight
      setMultiSelectedNodeIds(new Set());
      if (lockedHighlightNodeId === d.id) {
        setLockedHighlightNodeId(null);
      } else {
        setLockedHighlightNodeId(d.id);
      }
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
        // Always set hover if not dragging or editing (read from ref to avoid stale closure)
        if (!isDraggingRef.current && !state.editingNodeId) {
          setHoveredNodeId(d.id);
          // Always show action buttons on hover
          d3.select(this).select('.node-actions')
            .transition()
            .duration(200)
            .style('opacity', 1);
        }
      })
      .on('mouseout.hover', function(_event: MouseEvent, _d: Node) {
        if (!isDraggingRef.current) {
          setHoveredNodeId(null);
          // Always hide action buttons on mouse out
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
          } else if (i === 3) { // Notes button
            button.on('click', function(event: MouseEvent) {
              event.stopPropagation();
              setNotesModalNodeId(d.id);
            });
          }
        });
      });
    };
    
    // Attach handlers to both new and existing nodes
    attachActionHandlers(nodeEnter);
    attachActionHandlers(nodeUpdate);

  }, [nodes.length, links.length, state.selectedNodeId, state.editingNodeId, isInitialized, selectNode, startEditing, state.nodes, operations, currentLayout]);

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

  // Apply hover/locked/multi-select highlight effects
  useEffect(() => {
    if (!gRef.current) return;

    const g = gRef.current;
    const nodeDepths = calculateNodeDepths(state.nodes);

    // Use locked node if set, otherwise use hovered node
    const highlightNodeId = lockedHighlightNodeId || hoveredNodeId;
    const hasMultiSelect = multiSelectedNodeIds.size > 0;

    if (!highlightNodeId && !hasMultiSelect) {
      // Reset styles when not highlighting
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

    // Build the set of highlighted node IDs from either source
    let activeNodeIds: Set<string>;
    if (hasMultiSelect && !highlightNodeId) {
      // Multi-select mode: highlight exactly the selected nodes
      activeNodeIds = multiSelectedNodeIds;
    } else if (highlightNodeId) {
      // Single node highlight: get all connected descendants
      activeNodeIds = getAllConnectedNodes(highlightNodeId, state.nodes);
    } else {
      activeNodeIds = new Set();
    }

    // Create a set of all links that should be highlighted
    const highlightedLinks = new Set<string>();
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;

      if (activeNodeIds.has(sourceId) && activeNodeIds.has(targetId)) {
        highlightedLinks.add(`${sourceId}-${targetId}`);
      }
    });

    // Apply highlight styles
    g.selectAll<SVGGElement, Node>('.node')
      .style('opacity', (d: Node) => activeNodeIds.has(d.id) ? 1 : 0.3);

    g.selectAll<SVGLineElement, Link>('.link')
      .style('opacity', (d: Link) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        const linkKey = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkKey) ? 1 : 0.2;
      })
      .attr('stroke', (d: Link) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        const linkKey = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkKey) ? '#0066cc' : '#999';
      })
      .attr('stroke-width', (d: Link) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        const sourceDepth = nodeDepths.get(sourceId) || 0;
        const targetDepth = nodeDepths.get(targetId) || 0;
        const baseWidth = getLinkVisualProperties(sourceDepth, targetDepth).strokeWidth;
        const linkKey = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkKey) ? baseWidth + 2 : baseWidth;
      });
  }, [hoveredNodeId, lockedHighlightNodeId, multiSelectedNodeIds, links, state.nodes]);

  // Apply multi-selection visual indicators (optimized: only touch changed nodes)
  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;
    const nodeDepths = calculateNodeDepths(state.nodes);
    const prev = prevMultiSelectedRef.current;
    const current = multiSelectedNodeIds;

    // Find nodes removed from selection
    prev.forEach(id => {
      if (!current.has(id)) {
        g.selectAll<SVGGElement, Node>('.node')
          .filter((d: Node) => d.id === id)
          .select('.multi-select-indicator')
          .remove();
      }
    });

    // Find nodes added to selection
    current.forEach(id => {
      if (!prev.has(id)) {
        g.selectAll<SVGGElement, Node>('.node')
          .filter((d: Node) => d.id === id)
          .each(function(d: Node) {
            const nodeEl = d3.select(this);
            nodeEl.select('.multi-select-indicator').remove(); // Safety cleanup
            const depth = nodeDepths.get(d.id) || 0;
            const radius = getNodeVisualProperties(depth).radius;
            nodeEl.insert('circle', '.node-background')
              .attr('class', 'multi-select-indicator')
              .attr('r', radius + 8)
              .attr('fill', 'none')
              .attr('stroke', '#0066cc')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '5,3')
              .attr('opacity', 0.8);
          });
      }
    });

    prevMultiSelectedRef.current = new Set(current);
  }, [multiSelectedNodeIds, state.nodes]);

  // Handle canvas interactions + marquee selection
  useEffect(() => {
    if (!svgRef.current || !gRef.current || !isInitialized) return;

    const svg = d3.select(svgRef.current);
    const svgEl = svgRef.current;

    const handleClick = function(event: MouseEvent) {
      // After a marquee drag, browser fires click - skip it to preserve selection
      if (marqueeRef.current.justFinished) {
        marqueeRef.current.justFinished = false;
        return;
      }
      if (event.target === svgRef.current) {
        selectNode(null);
        setLockedHighlightNodeId(null);
        setMultiSelectedNodeIds(new Set());
      }
    };

    const handleMouseDown = function(event: MouseEvent) {
      // Only start marquee on direct canvas click (not on nodes), not in pan mode
      if (event.target !== svgEl || isPanMode || event.button !== 0) return;

      marqueeRef.current = { startX: event.clientX, startY: event.clientY, active: true, justFinished: false };

      // Create the selection rectangle in screen space
      if (marqueeGroupRef.current) {
        marqueeGroupRef.current.selectAll('.marquee-rect').remove();
        marqueeGroupRef.current.append('rect')
          .attr('class', 'marquee-rect')
          .attr('x', event.clientX)
          .attr('y', event.clientY)
          .attr('width', 0)
          .attr('height', 0)
          .attr('fill', 'rgba(0, 102, 204, 0.1)')
          .attr('stroke', '#0066cc')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,3')
          .attr('pointer-events', 'none');
      }
    };

    const handleMouseMove = function(event: MouseEvent) {
      if (!marqueeRef.current.active) return;

      const { startX, startY } = marqueeRef.current;
      const currentX = event.clientX;
      const currentY = event.clientY;

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (marqueeGroupRef.current) {
        marqueeGroupRef.current.select('.marquee-rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', width)
          .attr('height', height);
      }
    };

    const handleMouseUp = function(event: MouseEvent) {
      if (!marqueeRef.current.active) return;

      const { startX, startY } = marqueeRef.current;
      marqueeRef.current.active = false;
      marqueeRef.current.justFinished = true; // Prevent subsequent click from clearing selection

      // Remove the marquee rect
      if (marqueeGroupRef.current) {
        marqueeGroupRef.current.selectAll('.marquee-rect').remove();
      }

      const endX = event.clientX;
      const endY = event.clientY;

      // Only process if dragged more than 5px (avoid accidental tiny marquees)
      if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) return;

      // Convert screen coordinates to world coordinates using zoom transform
      const transform = d3.zoomTransform(svgEl);
      const worldStart = transform.invert([Math.min(startX, endX), Math.min(startY, endY)]);
      const worldEnd = transform.invert([Math.max(startX, endX), Math.max(startY, endY)]);

      const minX = worldStart[0];
      const minY = worldStart[1];
      const maxX = worldEnd[0];
      const maxY = worldEnd[1];

      // Find all nodes within the marquee bounds
      const selected = new Set<string>();
      nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
            selected.add(node.id);
          }
        }
      });

      if (event.ctrlKey || event.metaKey) {
        if (selected.size > 0) {
          setMultiSelectedNodeIds(prev => {
            const next = new Set(prev);
            selected.forEach(id => next.add(id));
            return next;
          });
        }
      } else {
        // Without modifiers, marquee defines the full selection (may be empty to clear)
        setMultiSelectedNodeIds(selected);
      }
    };

    svg.on('click', handleClick);
    svg.on('mousedown.marquee', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      svg.on('click', null);
      svg.on('mousedown.marquee', null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state.selectedNodeId, operations, selectNode, isInitialized, isPanMode, nodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.editingNodeId) return;

      // Check if any input element or contenteditable is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || 
                             activeElement instanceof HTMLTextAreaElement ||
                             activeElement?.hasAttribute('contenteditable') ||
                             activeElement?.closest('[contenteditable="true"]') !== null;

      // Handle spacebar for pan mode only if no input is focused
      if (e.code === 'Space' && !isPanMode && !isInputFocused) {
        e.preventDefault();
        setIsPanMode(true);
        return;
      }

      // Skip all keyboard shortcuts if input or contenteditable is focused
      if (isInputFocused) {
        return;
      }

      // Toggle help guide with '?' key
      if (e.key === '?') {
        e.preventDefault();
        setIsHelpOpen(prev => !prev);
        return;
      }

      // Spread / compress selected nodes with ] and [
      // Read from ref to always get latest selection (avoids stale closure)
      const currentMultiSelection = multiSelectedNodeIdsRef.current;
      if ((e.key === ']' || e.key === '[') && currentMultiSelection.size > 1) {
        e.preventDefault();
        if (!gRef.current) return;
        const g = gRef.current;
        const STEP = 5;
        const direction = e.key === ']' ? 1 : -1;
        const selectedNodes: { id: string; x: number; y: number }[] = [];

        // Read positions from D3 bound data (source of truth for visual positions)
        currentMultiSelection.forEach(id => {
          g.selectAll<SVGGElement, Node>('.node')
            .filter((nd: Node) => nd.id === id)
            .each((nd: Node) => {
              if (nd.x !== undefined && nd.y !== undefined) {
                selectedNodes.push({ id, x: nd.x, y: nd.y });
              }
            });
        });

        if (selectedNodes.length < 2) return;

        // Calculate centroid
        const cx = selectedNodes.reduce((sum, n) => sum + n.x, 0) / selectedNodes.length;
        const cy = selectedNodes.reduce((sum, n) => sum + n.y, 0) / selectedNodes.length;

        // Move each node STEP px further from (or closer to) centroid
        selectedNodes.forEach(({ id, x, y }) => {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.1) return; // Skip nodes at centroid

          const unitX = dx / dist;
          const unitY = dy / dist;
          const newX = x + unitX * STEP * direction;
          const newY = y + unitY * STEP * direction;

          // Update D3 bound data AND visual transform directly
          g.selectAll<SVGGElement, Node>('.node')
            .filter((nd: Node) => nd.id === id)
            .each(function(nd: Node) {
              nd.x = newX;
              nd.y = newY;
              nd.fx = newX;
              nd.fy = newY;
              d3.select(this).attr('transform', `translate(${newX},${newY})`);
            });

          // Update connected links
          g.selectAll<SVGLineElement, Link>('.link')
            .each(function(link: any) {
              const linkSelection = d3.select(this);
              const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
              const targetId = typeof link.target === 'string' ? link.target : link.target.id;
              if (sourceId === id) {
                linkSelection.attr('x1', newX).attr('y1', newY);
              }
              if (targetId === id) {
                linkSelection.attr('x2', newX).attr('y2', newY);
              }
            });

          operations.updateNodePosition(id, { x: newX, y: newY });
        });

        // Switch to custom layout
        if (currentLayoutRef.current !== 'custom') {
          customPositionsRef.current.clear();
          state.nodes.forEach((node, id) => {
            if (node.x !== undefined && node.y !== undefined) {
              customPositionsRef.current.set(id, { x: node.x, y: node.y });
            }
          });
          setCurrentLayout('custom');
        }
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
          exportToJSON(state, notes, markClean);
        } else if (e.key === 'p') {
          e.preventDefault();
          if (svgRef.current) {
            // PNG export removed due to quality issues
          }
        } else if (e.key === 'z') {
          e.preventDefault(); // Prevent browser undo
        } else if (e.key === 'y') {
          e.preventDefault(); // Prevent browser redo
        }
      }

      // Prevent Tab from shifting browser focus only when a node is selected
      if (e.key === 'Tab' && state.selectedNodeId) {
        e.preventDefault();
      }

      // Add 'c' for cluster layout, 't' for tree
      if (!modifiers.ctrlKey && !modifiers.shiftKey && !modifiers.altKey) {
        if (e.key === 'F2' && state.selectedNodeId) {
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
  }, [state, operations, stopEditing, isPanMode, markClean, startEditing]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        layoutManager.stopSimulation(simulationRef.current);
        simulationRef.current = null;
      }
    };
  }, []);

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
        <LayoutSelector
          currentLayout={currentLayout}
          onLayoutChange={handleLayoutChange}
          disabled={loading}
          hasCustomPositions={Array.from(state.nodes.values()).some(node => 
            node.x !== undefined && node.y !== undefined
          )}
        />
        
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
          onClick={() => exportToJSON(state, notes, markClean)}
          title="Export as JSON"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </button>
        
        
        <button
          className={styles.iconButton}
          onClick={() => setIsImportModalOpen(true)}
          title="Import JSON data"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
          </svg>
        </button>

        <button
          className={styles.iconButton}
          onClick={() => setIsHelpOpen(true)}
          title="Help & keyboard shortcuts (?)"
          data-testid="help-button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10-4.48 10-10S17.52,2 12,2zm1,17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45,12.9 13,13.5 13,15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2,.9-2,2H8c0-2.21 1.79-4 4-4s4,1.79 4,4c0,.88-.36,1.68-.93,2.25z"/>
          </svg>
        </button>
      </div>

      <SearchBar
        nodes={nodes}
        onNodeSelect={panToNode}
        isVisible={!state.editingNodeId}
      />

      {hoveredNode && !state.editingNodeId && (
        <NodeTooltip
          node={hoveredNode}
          depth={hoveredNodeDepth}
          childCount={hoveredNodeChildCount}
        />
      )}

      <div className={styles.canvasContainer}>

        {editingNode && (
          <NodeEditModal
            nodeId={editingNode.id}
            initialText={editingNode.text}
            initialColor={editingNode.color}
            initialTextColor={editingNode.textColor}
            isOpen={!!state.editingNodeId}
            onSave={(nodeId, text, color, textColor) => {
              operations.updateNodeText(nodeId, text);
              if (color !== undefined) {
                operations.updateNode(nodeId, { color });
              }
              if (textColor !== undefined) {
                operations.updateNode(nodeId, { textColor });
              }
              stopEditing();
            }}
            onCancel={stopEditing}
          />
        )}

        {nodes.length === 0 && (
        <div className={styles.instructions}>
          <h2>Welcome to ThoughtNet!</h2>
          <p>Loading demo mind map...</p>
        </div>
      )}

      <svg
        ref={(el) => {
          svgRef.current = el;
          setSvgElement(el);
        }}
        width="100%"
        height="100%"
        role="img"
        aria-label="Mind map canvas"
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

      <ImportModal
        isOpen={isImportModalOpen}
        onImport={handleImport}
        onCancel={() => setIsImportModalOpen(false)}
      />

      {notesModalNodeId && (
        <NotesModal
          isOpen={!!notesModalNodeId}
          nodeId={notesModalNodeId}
          nodeText={state.nodes.get(notesModalNodeId)?.text || ''}
          existingNote={getNote(notesModalNodeId) || null}
          onSave={handleNoteSave(notesModalNodeId)}
          onDelete={getNote(notesModalNodeId) ? handleNoteDelete(notesModalNodeId) : undefined}
          onClose={() => setNotesModalNodeId(null)}
        />
      )}

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  );
};