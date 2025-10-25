import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useMindMap } from '../../context/MindMapContext';
import { useMindMapPersistence } from '../../hooks/useMindMapPersistence';
import { useMindMapOperations } from '../../hooks/useMindMapOperations';
import type { Node, Link, Point } from '../../types/mindMap';
import { exportToJSON, exportToPNG, importFromJSON } from '../../utils/exportUtils';
import { createHierarchicalLayout } from '../../utils/hierarchicalLayout';
import { demoNodes, demoLinks } from '../../data/demoMindMap';
import styles from './MindMapCanvas.module.css';

type LayoutMode = 'force' | 'tree';

export const MindMapCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  
  // D3 references - prevent recreation on every render
  const svg = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined>>();
  const g = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const simulation = useRef<d3.Simulation<Node, Link>>();
  const zoom = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const nodesGroup = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const linksGroup = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();

  const {
    state,
    dispatch,
    selectNode,
    startEditing,
    stopEditing,
  } = useMindMap();

  const { loading, error } = useMindMapPersistence();
  const operations = useMindMapOperations();

  // Convert Map to array
  const nodes = Array.from(state.nodes.values());
  const links = state.links;

  // Update canvas size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize D3 once DOM is ready
  useEffect(() => {
    if (!svgRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Create selections
      svg.current = d3.select(svgRef.current);
      g.current = svg.current.select('.zoom-group');
      linksGroup.current = g.current.select('.links-group');
      nodesGroup.current = g.current.select('.nodes-group');

      // Setup zoom with better performance settings
      zoom.current = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 5])
        .on('zoom', (event) => {
          g.current?.attr('transform', event.transform);
        });

      svg.current.call(zoom.current);

      // Create simulation with optimized settings
      simulation.current = d3.forceSimulation<Node>()
        .force('link', d3.forceLink<Node, Link>().id((d: any) => d.id).distance(150).strength(0.2))
        .force('charge', d3.forceManyBody().strength(-500).distanceMax(300))
        .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.05))
        .force('collision', d3.forceCollide().radius(60).strength(0.7))
        .alphaDecay(0.02) // Slower decay for smoother animation
        .velocityDecay(0.4); // Less velocity decay for more fluid motion

      // Stop simulation initially
      simulation.current.stop();
    }, 0);

    return () => {
      clearTimeout(timer);
      simulation.current?.stop();
    };
  }, [dimensions.width, dimensions.height]);

  // Update simulation center when dimensions change
  useEffect(() => {
    if (simulation.current) {
      const centerForce = simulation.current.force('center') as d3.ForceCenter<Node>;
      if (centerForce) {
        centerForce.x(dimensions.width / 2).y(dimensions.height / 2);
      }
    }
  }, [dimensions]);

  // Update simulation when data changes
  useEffect(() => {
    if (!linksGroup.current || !nodesGroup.current || !simulation.current) return;

    // Update links
    const link = linksGroup.current.selectAll<SVGLineElement, Link>('line')
      .data(links, (d: Link) => `${d.source}-${d.target}`);

    link.exit().remove();

    link.enter()
      .append('line')
      .attr('class', styles.link)
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Update nodes
    const node = nodesGroup.current.selectAll<SVGGElement, Node>('g')
      .data(nodes, (d: Node) => d.id);

    node.exit().remove();

    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer');

    // Build node structure
    nodeEnter.append('circle')
      .attr('r', 35)
      .attr('fill', '#ffffff')
      .attr('stroke', '#333333')
      .attr('stroke-width', 2);

    nodeEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
      .attr('font-family', 'Arial, sans-serif');

    // Merge and update all nodes
    const allNodes = nodeEnter.merge(node);

    // Update appearance
    allNodes.select('circle')
      .attr('stroke', (d: Node) => state.selectedNodeId === d.id ? '#0066cc' : '#333333')
      .attr('stroke-width', (d: Node) => state.selectedNodeId === d.id ? 3 : 2);

    allNodes.select('text')
      .text((d: Node) => d.text);

    // Setup drag for force layout
    if (layoutMode === 'force') {
      const drag = d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active && simulation.current && isSimulationRunning) {
            simulation.current.alphaTarget(0.3).restart();
          }
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
          if (d.x != null && d.y != null) {
            d.x = event.x;
            d.y = event.y;
            updatePositions();
          }
        })
        .on('end', (event, d) => {
          if (!event.active && simulation.current) {
            simulation.current.alphaTarget(0);
          }
          if (!event.sourceEvent.shiftKey && layoutMode === 'force') {
            d.fx = null;
            d.fy = null;
          }
        });

      allNodes.call(drag);
    }

    // Event handlers
    allNodes.on('click', (event: MouseEvent, d: Node) => {
      event.stopPropagation();
      selectNode(d.id);
    });

    allNodes.on('dblclick', (event: MouseEvent, d: Node) => {
      event.stopPropagation();
      startEditing(d.id);
    });

    // Update simulation
    if (layoutMode === 'force') {
      simulation.current.nodes(nodes);
      const linkForce = simulation.current.force('link') as d3.ForceLink<Node, Link>;
      if (linkForce) {
        linkForce.links(links);
      }

      simulation.current.on('tick', updatePositions);

      if (isSimulationRunning) {
        simulation.current.alpha(0.5).restart();
      } else {
        simulation.current.stop();
      }
    } else {
      simulation.current.stop();
    }

    // Initial position update
    updatePositions();

    return () => {
      simulation.current?.on('tick', null);
    };
  }, [nodes, links, state.selectedNodeId, layoutMode, isSimulationRunning, selectNode, startEditing, dispatch]);

  // Update positions helper
  const updatePositions = () => {
    if (!nodesGroup.current || !linksGroup.current) return;

    nodesGroup.current.selectAll<SVGGElement, Node>('g')
      .attr('transform', (d: Node) => d.x != null && d.y != null ? `translate(${d.x},${d.y})` : null);

    linksGroup.current.selectAll<SVGLineElement, Link>('line')
      .attr('x1', (d: any) => d.source.x || 0)
      .attr('y1', (d: any) => d.source.y || 0)
      .attr('x2', (d: any) => d.target.x || 0)
      .attr('y2', (d: any) => d.target.y || 0);
  };

  // Auto-stop simulation after a timeout
  useEffect(() => {
    if (isSimulationRunning && layoutMode === 'force' && simulation.current) {
      const timer = setTimeout(() => {
        simulation.current?.stop();
        setIsSimulationRunning(false);
      }, 10000); // Stop after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isSimulationRunning, layoutMode, nodes.length]);

  // Fit to viewport
  const fitToViewport = useCallback(() => {
    if (!svg.current || !zoom.current || !g.current || nodes.length === 0) return;

    const bounds = g.current.node()?.getBBox();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;

    const fullWidth = dimensions.width;
    const fullHeight = dimensions.height;
    const width = bounds.width + 100; // Add padding
    const height = bounds.height + 100;
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    const scale = Math.min(1, 0.9 / Math.max(width / fullWidth, height / fullHeight));
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    svg.current.transition().duration(750)
      .call(
        zoom.current.transform as any,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  }, [nodes.length, dimensions]);

  // Apply tree layout
  const applyTreeLayout = useCallback(() => {
    if (state.nodes.size === 0) return;
    
    setLayoutMode('tree');
    setIsSimulationRunning(false);
    simulation.current?.stop();
    
    const positions = createHierarchicalLayout(state.nodes, dimensions.width, dimensions.height);
    
    // Update node positions
    const updatedNodes = nodes.map(node => ({
      ...node,
      x: positions.get(node.id)?.x || node.x || dimensions.width / 2,
      y: positions.get(node.id)?.y || node.y || dimensions.height / 2,
      fx: positions.get(node.id)?.x,
      fy: positions.get(node.id)?.y
    }));
    
    dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: updatedNodes, links: state.links } });
    
    setTimeout(() => {
      updatePositions();
      fitToViewport();
    }, 100);
  }, [state.nodes, state.links, nodes, dispatch, fitToViewport, dimensions]);

  // Switch back to force layout
  const applyForceLayout = useCallback(() => {
    setLayoutMode('force');
    
    // Remove fixed positions
    const updatedNodes = nodes.map(node => ({
      ...node,
      fx: null,
      fy: null
    }));
    
    dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: updatedNodes, links: state.links } });
    setIsSimulationRunning(true);
  }, [nodes, state.links, dispatch]);

  // Handle canvas interactions
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as Element;
    if (target !== svgRef.current && !target.classList.contains('zoom-group')) return;
    
    if (event.detail === 2 && g.current) { // Double click
      event.preventDefault();
      const [x, y] = d3.pointer(event, g.current.node());
      
      const position = { x, y };
      if (state.selectedNodeId) {
        operations.createNode(state.selectedNodeId, position, 'New Node');
      } else {
        operations.createNode(null, position, 'New Node');
      }
    } else { // Single click
      selectNode(null);
    }
  }, [state.selectedNodeId, operations, selectNode]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.editingNodeId) return;

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

      operations.handleKeyPress(e.key, modifiers);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, operations]);

  if (loading) {
    return <div className={styles.loading}>Loading mind map...</div>;
  }

  const shouldIgnoreError = error && (
    error.message.includes('object stores was not found') ||
    error.message.includes('Failed to open IndexedDB')
  );
  
  if (error && !shouldIgnoreError) {
    return <div className={styles.error}>Failed to load mind map: {error.message}</div>;
  }

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.toolbar}>
        <button 
          onClick={() => {
            dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: demoNodes, links: demoLinks } });
            setTimeout(fitToViewport, 500);
          }}
          title="Load a demo mind map"
          style={{ background: '#4CAF50', color: 'white' }}
        >
          Load Demo Map
        </button>
        <button 
          onClick={fitToViewport}
          title="Fit all nodes in viewport"
          style={{ background: '#2196F3', color: 'white' }}
        >
          Fit to View
        </button>
        <button 
          onClick={layoutMode === 'force' ? applyTreeLayout : applyForceLayout}
          title={layoutMode === 'force' ? 'Switch to tree layout' : 'Switch to force layout'}
          style={{ background: '#9C27B0', color: 'white' }}
        >
          {layoutMode === 'force' ? 'Tree Layout' : 'Force Layout'}
        </button>
        <button 
          onClick={() => setIsSimulationRunning(!isSimulationRunning)}
          style={{ 
            background: isSimulationRunning ? '#f44336' : '#4CAF50', 
            color: 'white',
            opacity: layoutMode === 'tree' ? 0.5 : 1 
          }}
          title={isSimulationRunning ? 'Stop animation' : 'Resume animation'}
          disabled={layoutMode === 'tree'}
        >
          {isSimulationRunning ? 'Freeze' : 'Unfreeze'}
        </button>
        <button onClick={() => exportToJSON(state)} title="Export as JSON (Ctrl+S)">
          Export JSON
        </button>
        <button onClick={() => svgRef.current && exportToPNG(svgRef.current)} title="Export as PNG (Ctrl+P)">
          Export PNG
        </button>
        <label className={styles.importLabel} title="Import a mind map from JSON file">
          Import JSON
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
                    setTimeout(fitToViewport, 500);
                  }
                });
              }
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      {nodes.length === 0 && (
        <div className={styles.instructions}>
          <h2>Welcome to Mind Map!</h2>
          <p><strong>Double-click</strong> anywhere on the canvas to create your first node</p>
          <p className={styles.shortcuts}>
            <strong>Controls:</strong><br />
            • Double-click canvas: Create new node<br />
            • Click node: Select node<br />
            • Double-click node: Edit text<br />
            • Drag node: Move position<br />
            • Click +/−: Expand/Collapse children<br />
            <br />
            <strong>Keyboard shortcuts:</strong><br />
            • Tab: Create sibling node<br />
            • Enter: Create child node<br />
            • Delete: Delete selected node<br />
            • Space: Collapse/Expand node<br />
            • Ctrl+S: Export to JSON<br />
            • Ctrl+P: Export to PNG
          </p>
        </div>
      )}
      
      <svg
        ref={svgRef}
        className={styles.canvas}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        style={{ cursor: 'grab' }}
      >
        <g className="zoom-group">
          <g className="links-group"></g>
          <g className="nodes-group"></g>
        </g>
      </svg>
    </div>
  );
};