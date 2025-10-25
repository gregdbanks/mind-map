import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useMindMap } from '../../context/MindMapContext';
import { useMindMapPersistence } from '../../hooks/useMindMapPersistence';
import { useMindMapOperations } from '../../hooks/useMindMapOperations';
import type { Node, Link } from '../../types/mindMap';
import { exportToJSON, exportToPNG, importFromJSON } from '../../utils/exportUtils';
import { createHierarchicalLayout } from '../../utils/hierarchicalLayout';
import { createClusteredLayout } from '../../utils/clusterLayout';
import { createImprovedClusterLayout } from '../../utils/improvedClusterLayout';
import { calculateNodeDepths, getNodeVisualProperties, getLinkVisualProperties } from '../../utils/nodeHierarchy';
import { forceCluster } from '../../physics/clusterForce';
import { isAWSService } from '../../utils/awsServices';
import { demoNodes, demoLinks } from '../../data/demoMindMap';
import styles from './MindMapCanvas.module.css';

type LayoutMode = 'tree' | 'cluster';

export const MindMapCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();
  const simulationRef = useRef<d3.Simulation<Node, Link>>();
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('cluster');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null);
  const [lastLayoutMode, setLastLayoutMode] = useState<LayoutMode | null>(null);

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
    if (!svgElement || isInitialized) return;

    console.log('Initializing D3 structure');

    const svg = d3.select(svgElement);
    
    // Create main group that will hold everything
    const g = svg.append('g').attr('class', 'main-group');
    gRef.current = g;

    // Setup zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    setIsInitialized(true);
    console.log('D3 structure initialized');
  }, [svgElement]); // Run when svgElement is set

  // Update visualization when data changes
  useEffect(() => {
    if (!isInitialized || !gRef.current) return;

    // Skip update if we're in cluster mode and it was already applied
    if (layoutMode === 'cluster' && lastLayoutMode === 'cluster' && nodes.length > 0) {
      // Check if nodes already have fixed positions
      const firstNode = nodes[0];
      if (firstNode.fx !== undefined && firstNode.fy !== undefined) {
        console.log('Skipping cluster re-layout, nodes already positioned');
        return;
      }
    }

    console.log('Updating visualization with', nodes.length, 'nodes');
    const g = gRef.current;
    setLastLayoutMode(layoutMode);

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
        const sourceDepth = nodeDepths.get(typeof d.source === 'string' ? d.source : d.source.id) || 0;
        const targetDepth = nodeDepths.get(typeof d.target === 'string' ? d.target : d.target.id) || 0;
        return getLinkVisualProperties(sourceDepth, targetDepth).strokeWidth;
      })
      .attr('stroke-opacity', (d: Link) => {
        const sourceDepth = nodeDepths.get(typeof d.source === 'string' ? d.source : d.source.id) || 0;
        const targetDepth = nodeDepths.get(typeof d.target === 'string' ? d.target : d.target.id) || 0;
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
      .attr('cursor', 'pointer');

    nodeEnter.append('circle');
    nodeEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .style('pointer-events', 'none');

    // Update all nodes
    const nodeUpdate = nodeEnter.merge(node);

    // Apply visual hierarchy to circles
    nodeUpdate.select('circle')
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

    // Setup or update layout
    if (layoutMode === 'tree') {
      // Tree layout
      const positions = createHierarchicalLayout(state.nodes, window.innerWidth, window.innerHeight);
      const branchMap = new Map<string, string>(); // node id to branch id
      
      // Assign each node to a branch
      nodes.forEach(node => {
        if (!node.parent) {
          branchMap.set(node.id, node.id);
        } else if (branches.some(b => b.id === node.parent)) {
          // Direct child of a branch
          branchMap.set(node.id, node.parent);
        } else {
          // Find which branch this node belongs to by traversing up
          let currentNode = node;
          while (currentNode.parent && currentNode.parent !== rootNode.id) {
            const parentNode = nodes.find(n => n.id === currentNode.parent);
            if (!parentNode) break;
            currentNode = parentNode;
          }
          if (currentNode.parent === rootNode.id) {
            branchMap.set(node.id, currentNode.id);
          }
        }
      });

      // Assign angles to branches for radial layout
      const angleStep = (2 * Math.PI) / branches.length;
      const branchAngles = new Map<string, number>();
      branches.forEach((branch, i) => {
        branchAngles.set(branch.id, i * angleStep);
      });

      // Configure link force - balanced to maintain structure
      const linkForce = d3.forceLink<Node, Link>(links)
        .id((d: any) => d.id)
        .distance(120) // Consistent link distance
        .strength(0.3); // Moderate strength

      // Initialize positions to avoid vibration
      nodes.forEach(node => {
        if (node.x == null || node.y == null) {
          const depth = nodeDepths.get(node.id) || 0;
          if (depth === 0) {
            node.x = window.innerWidth / 2;
            node.y = window.innerHeight / 2;
          } else {
            const branchId = branchMap.get(node.id);
            if (branchId) {
              const angle = branchAngles.get(branchId) || 0;
              // Start at target radial positions
              let radius = 0;
              if (depth === 1) radius = 300;
              else if (depth === 2) radius = 500;
              else if (depth === 3) radius = 700;
              else if (depth === 4) radius = 900;
              else radius = 300 + (200 * depth);
              
              node.x = window.innerWidth / 2 + radius * Math.cos(angle);
              node.y = window.innerHeight / 2 + radius * Math.sin(angle);
            }
          }
        }
      });

      // Add radial force - simple and stable
      const radialForce = d3.forceRadial<Node>((d: any) => {
        const depth = nodeDepths.get(d.id) || 0;
        if (depth === 0) return 0;
        return 200 + (depth * 150); // Simple progressive spacing
      }, window.innerWidth / 2, window.innerHeight / 2)
        .strength(0.6); // Moderate uniform strength
      
      // Add custom cluster force with reduced strength to prevent overcrowding
      const clusterForce = forceCluster()
        .nodes(nodes)
        .strength(0.1); // Reduced clustering to allow more spread
      
      simulation
        .nodes(nodes)
        .force('link', linkForce)
        .force('charge', d3.forceManyBody()
          .strength(-1000) // Uniform moderate repulsion
          .distanceMax(300) // Limited influence radius
        )
        .force('radial', radialForce) // Add radial force
        .force('cluster', clusterForce as any) // Add clustering force
        .force('collision', d3.forceCollide()
          .radius((d: any) => {
            const depth = nodeDepths.get(d.id) || 0;
            const baseRadius = getNodeVisualProperties(depth).radius;
            return baseRadius + 50; // Consistent spacing
          })
          .strength(0.8)
          .iterations(2)
        )
        .alphaDecay(0.02) // Even slower decay for complex layouts
        .velocityDecay(0.8) // Very high dampening to reduce bouncing
        .alphaMin(0.001); // Stop at very low energy
        
      // Run simulation normally
      simulation.alpha(1).restart();

      // Update positions on simulation tick - simplified for performance
      simulation.on('tick', () => {
        // Update links with simple positioning (no complex calculations during animation)
        linkUpdate
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        // Update nodes
        nodeUpdate
          .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });
      
      // Calculate proper link endpoints only after simulation stops
      simulation.on('end', () => {
        linkUpdate.each(function(d: any) {
          const sourceRadius = radiusCache.get(d.source.id) || 20;
          const targetRadius = radiusCache.get(d.target.id) || 20;
          
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const unitX = dx / distance;
            const unitY = dy / distance;
            
            d3.select(this)
              .attr('x1', d.source.x + unitX * (sourceRadius + 2))
              .attr('y1', d.source.y + unitY * (sourceRadius + 2))
              .attr('x2', d.target.x - unitX * (targetRadius + 2))
              .attr('y2', d.target.y - unitY * (targetRadius + 2));
          }
        });
      });

      // Drag behavior
      const drag = d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          if (!event.active && isSimulationRunning) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
          d.x = event.x;
          d.y = event.y;
          
          // Always update positions manually for immediate feedback
          // Update node position
          d3.select(event.sourceEvent.target.parentNode)
            .attr('transform', `translate(${d.x},${d.y})`);
          
          // Update all links connected to this node
          g.selectAll<SVGLineElement, Link>('.link')
            .each(function(link: any) {
              const linkSelection = d3.select(this);
              const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
              const targetId = typeof link.target === 'string' ? link.target : link.target.id;
              
              if (sourceId === d.id) {
                linkSelection.attr('x1', d.x).attr('y1', d.y);
              }
              if (targetId === d.id) {
                linkSelection.attr('x2', d.x).attr('y2', d.y);
              }
            });
        })
        .on('end', (event, d) => {
          if (!event.active && !simulationStopped) simulation.alphaTarget(0);
          // Keep nodes fixed after dragging to maintain positions
          d.fx = d.x;
          d.fy = d.y;
        });

      nodeUpdate.call(drag);

      // Cache radius values for performance
      const radiusCache = new Map<string, number>();
      nodes.forEach(node => {
        const depth = nodeDepths.get(node.id) || 0;
        radiusCache.set(node.id, getNodeVisualProperties(depth).radius);
      });

      // Don't restart simulation unless explicitly requested by user
      if (!isSimulationRunning || layoutMode !== 'force') {
        simulation.stop();
        simulation.on('tick', null); // Remove tick handler
        // Fix all positions when not running
        nodes.forEach(node => {
          node.fx = node.x;
          node.fy = node.y;
          node.vx = 0;
          node.vy = 0;
        });
      }
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current.on('tick', null); // Remove tick handler
        simulationRef.current.nodes([]); // Remove all nodes from simulation
        simulationRef.current.force('link', null);
        simulationRef.current.force('charge', null);
        simulationRef.current.force('collision', null);
        simulationRef.current = null;
      }

      const positions = createHierarchicalLayout(state.nodes, window.innerWidth, window.innerHeight);
      
      nodeUpdate
        .attr('transform', (d: Node) => {
          const pos = positions.get(d.id);
          if (pos) {
            d.x = pos.x;
            d.y = pos.y;
            return `translate(${pos.x},${pos.y})`;
          }
          return `translate(${d.x || 0},${d.y || 0})`;
        });

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
    } else if (layoutMode === 'cluster') {
      // Cluster layout - fixed positions, no simulation
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current.on('tick', null); // Remove tick handler to prevent rubber band effect
      }

      const positions = createImprovedClusterLayout(state.nodes, window.innerWidth, window.innerHeight);
      
      // Kill any existing simulation completely
      if (simulationRef.current) {
        simulationRef.current.nodes([]); // Remove all nodes from simulation
        simulationRef.current.force('link', null);
        simulationRef.current.force('charge', null);
        simulationRef.current.force('collision', null);
        simulationRef.current = null; // Clear the reference
      }
      
      // First update node positions in data
      nodes.forEach(node => {
        const pos = positions.get(node.id);
        if (pos) {
          node.x = pos.x;
          node.y = pos.y;
          node.fx = pos.x;  // Fix position
          node.fy = pos.y;
          node.vx = 0;  // Zero out velocity
          node.vy = 0;
        }
      });
      
      // Apply fixed positions immediately without transition to prevent rubber band
      nodeUpdate
        .attr('transform', (d: Node) => `translate(${d.x || 0},${d.y || 0})`);

      // Update links immediately
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

      // Simple drag without force simulation
      const drag = d3.drag<SVGGElement, Node>()
        .on('start', (event, d) => {
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
          d.x = event.x;
          d.y = event.y;
          // Update position immediately
          d3.select(event.sourceEvent.target.parentNode)
            .attr('transform', `translate(${d.x},${d.y})`);
          
          // Update connected links
          linkUpdate.each(function(link: any) {
            const linkSelection = d3.select(this);
            if ((typeof link.source === 'string' ? link.source : link.source.id) === d.id) {
              linkSelection.attr('x1', d.x).attr('y1', d.y);
            }
            if ((typeof link.target === 'string' ? link.target : link.target.id) === d.id) {
              linkSelection.attr('x2', d.x).attr('y2', d.y);
            }
          });
        })
        .on('end', (event, d) => {
          // Keep the position fixed
          d.fx = d.x;
          d.fy = d.y;
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

  }, [nodes, links, state.selectedNodeId, layoutMode, isSimulationRunning, isInitialized, selectNode, startEditing]);

  // Handle canvas interactions
  useEffect(() => {
    if (!svgRef.current || !gRef.current || !isInitialized) return;

    const svg = d3.select(svgRef.current);

    const handleDblClick = function(event: MouseEvent) {
      if (event.target === svgRef.current) {
        const [x, y] = d3.pointer(event, gRef.current!.node());
        if (state.selectedNodeId) {
          operations.createNode(state.selectedNodeId, { x, y }, 'New Node');
        } else {
          operations.createNode(null, { x, y }, 'New Node');
        }
      }
    };

    const handleClick = function(event: MouseEvent) {
      if (event.target === svgRef.current) {
        selectNode(null);
      }
    };

    svg.on('dblclick', handleDblClick);
    svg.on('click', handleClick);

    return () => {
      svg.on('dblclick', null);
      svg.on('click', null);
    };
  }, [state.selectedNodeId, operations, selectNode, isInitialized]);

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
        } else if (e.key === 'p') {
          e.preventDefault();
          if (svgRef.current) {
            exportToPNG(svgRef.current);
          }
        }
      }

      // Add 'c' for cluster layout
      if (e.key === 'c' && !modifiers.ctrlKey && !modifiers.shiftKey && !modifiers.altKey) {
        e.preventDefault();
        setLayoutMode('cluster');
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
          onClick={fitToViewport}
          title="Fit all nodes in viewport"
          style={{ background: '#2196F3', color: 'white' }}
        >
          Fit to View
        </button>
        <button 
          onClick={() => {
            // Toggle between tree and cluster
            setLayoutMode(layoutMode === 'tree' ? 'cluster' : 'tree');
          }}
          title={`Current: ${layoutMode} layout. Click to switch.`}
          style={{ background: '#9C27B0', color: 'white' }}
        >
          {layoutMode === 'tree' ? 'Cluster Layout' : 'Tree Layout'}
        </button>
        <button 
          onClick={() => setIsSimulationRunning(!isSimulationRunning)}
          style={{ 
            background: isSimulationRunning ? '#f44336' : '#4CAF50', 
            color: 'white',
            opacity: layoutMode !== 'force' ? 0.5 : 1 
          }}
          title={isSimulationRunning ? 'Stop animation' : 'Resume animation'}
          disabled={layoutMode !== 'force'}
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
          <p><strong>Double-click</strong> to create your first node</p>
        </div>
      )}

      <svg
        ref={(el) => {
          svgRef.current = el;
          setSvgElement(el);
        }}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{ cursor: 'grab' }}
      />
    </div>
  );
};