import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useMindMap } from '../../context/MindMapContext';
import { useMindMapPersistence } from '../../hooks/useMindMapPersistence';
import { useMindMapOperations } from '../../hooks/useMindMapOperations';
import type { Node, Link } from '../../types/mindMap';
import { exportToJSON, exportToPNG, importFromJSON } from '../../utils/exportUtils';
import { createHierarchicalLayout } from '../../utils/hierarchicalLayout';
import { demoNodes, demoLinks } from '../../data/demoMindMap';
import styles from './MindMapCanvas.module.css';

type LayoutMode = 'force' | 'tree';

export const MindMapCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const simulationRef = useRef<d3.Simulation<Node, Link>>();
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();

  const {
    state,
    dispatch,
    selectNode,
    startEditing,
  } = useMindMap();

  const { loading } = useMindMapPersistence();
  const operations = useMindMapOperations();

  // Convert state to arrays
  const nodes = Array.from(state.nodes.values());
  const links = state.links;

  // Fit all nodes in viewport
  const fitToViewport = () => {
    if (!svgRef.current || !gRef.current || !zoomRef.current || nodes.length === 0) return;

    const g = gRef.current;
    const bounds = g.node()?.getBBox();
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const fullWidth = bounds.width + 100; // Add padding
    const fullHeight = bounds.height + 100;
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    const scale = Math.min(1, 0.9 / Math.max(fullWidth / width, fullHeight / height));
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  };

  // Initialize and render with D3
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    console.log('Rendering', nodes.length, 'nodes');

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zoom/pan
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create links
    const link = g.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Create nodes
    const node = g.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
      .attr('r', 30)
      .attr('fill', '#fff')
      .attr('stroke', d => state.selectedNodeId === d.id ? '#0066cc' : '#333')
      .attr('stroke-width', d => state.selectedNodeId === d.id ? 3 : 2);

    // Add text to nodes
    node.append('text')
      .text(d => d.text)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // Add click handlers
    node.on('click', (event, d) => {
      event.stopPropagation();
      selectNode(d.id);
    });

    node.on('dblclick', (event, d) => {
      event.stopPropagation();
      startEditing(d.id);
    });

    // Store refs
    gRef.current = g;
    zoomRef.current = zoom;

    // Create or update simulation
    if (layoutMode === 'force') {
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink<Node, Link>(links).id((d: any) => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-500).distanceMax(300))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
        .force('collision', d3.forceCollide().radius(60))
        .alphaDecay(0.02)
        .velocityDecay(0.4);
      
      simulationRef.current = simulation;
      
      if (!isSimulationRunning) {
        simulation.stop();
      }
    } else {
      // Tree layout
      const positions = createHierarchicalLayout(state.nodes, width, height);
      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (pos) {
          node.x = pos.x;
          node.y = pos.y;
          node.fx = pos.x;
          node.fy = pos.y;
        }
      });
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    }

    const simulation = simulationRef.current;

    // Update positions on tick
    if (simulation && layoutMode === 'force') {
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });
    } else {
      // For tree layout, position immediately
      link
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

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    }

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active && simulation && isSimulationRunning) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active && simulation) simulation.alphaTarget(0);
      if (!event.sourceEvent.shiftKey && layoutMode === 'force') {
        d.fx = null;
        d.fy = null;
      }
    }

    // Handle canvas click
    svg.on('dblclick', (event) => {
      if (event.target === svgRef.current) {
        const [x, y] = d3.pointer(event, g.node());
        if (state.selectedNodeId) {
          operations.createNode(state.selectedNodeId, { x, y }, 'New Node');
        } else {
          operations.createNode(null, { x, y }, 'New Node');
        }
      }
    });

    svg.on('click', (event) => {
      if (event.target === svgRef.current) {
        selectNode(null);
      }
    });

    // Cleanup
    return () => {
      if (simulation) simulation.stop();
    };
  }, [nodes, links, state.selectedNodeId, operations, selectNode, startEditing, layoutMode, isSimulationRunning, state.nodes]);

  // Keyboard shortcuts
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

  return (
    <div className={styles.canvasContainer}>
      <div className={styles.toolbar}>
        <button 
          onClick={() => {
            dispatch({ type: 'LOAD_MINDMAP', payload: { nodes: demoNodes, links: demoLinks } });
          }}
          style={{ background: '#4CAF50', color: 'white' }}
        >
          Load Demo Map
        </button>
        <button 
          onClick={() => fitToViewport()}
          title="Fit all nodes in viewport"
          style={{ background: '#2196F3', color: 'white' }}
        >
          Fit to View
        </button>
        <button 
          onClick={() => {
            if (layoutMode === 'force') {
              setLayoutMode('tree');
            } else {
              setLayoutMode('force');
            }
          }}
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
        <button onClick={() => exportToJSON(state)}>Export JSON</button>
        <button onClick={() => svgRef.current && exportToPNG(svgRef.current)}>Export PNG</button>
        <label className={styles.importLabel}>
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
                    setTimeout(() => fitToViewport(), 500);
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
          <p><strong>Double-click</strong> to create your first node</p>
        </div>
      )}

      <svg
        ref={svgRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ cursor: 'grab' }}
      />
    </div>
  );
};