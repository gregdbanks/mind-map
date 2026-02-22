import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';
import { apiClient, ApiError } from '../../services/apiClient';
import {
  calculateNodeDepths,
  getNodeVisualProperties,
  getLinkVisualProperties,
} from '../../utils/nodeHierarchy';
import { createHierarchicalLayout } from '../../utils/hierarchicalLayout';
import { getAllConnectedNodes } from '../../utils/getNodeDescendants';
import { getBackgroundStyle, getBackgroundColor } from '../../components/BackgroundSelector';
import type { CanvasBackground } from '../../components/BackgroundSelector';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';
import type { Node, Link as MapLink } from '../../types/mindMap';
import type { SerializedNote } from '../../types/sync';
import styles from './SharedMap.module.css';

interface PublicMapData {
  id: string;
  title: string;
  data: {
    nodes: Node[];
    links: MapLink[];
    notes?: SerializedNote[];
    lastModified?: string;
    canvasBackground?: string;
  };
  node_count: number;
  created_at: string;
}

export const SharedMap: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<PublicMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ nodeId: string; nodeText: string } | null>(null);

  // Build a notes lookup map
  const notesMap = useRef<Map<string, SerializedNote>>(new Map());

  // Fetch public map
  useEffect(() => {
    if (!shareToken) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    const fetchMap = async () => {
      try {
        const data = await apiClient.getPublicMap(shareToken);
        setMapData(data);

        // Build notes lookup
        if (data.data?.notes) {
          const map = new Map<string, SerializedNote>();
          data.data.notes.forEach((note: SerializedNote) => {
            map.set(note.nodeId, note);
          });
          notesMap.current = map;
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError('This mind map is no longer shared or does not exist.');
        } else {
          setError('Failed to load mind map. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [shareToken]);

  // Derive the canvas background from the map data
  const canvasBackground: CanvasBackground = (mapData?.data?.canvasBackground as CanvasBackground) || 'white';

  // Build a node map (for highlight calculations)
  const getNodeMap = useCallback((): Map<string, Node> => {
    const nodeMap = new Map<string, Node>();
    if (mapData?.data?.nodes) {
      mapData.data.nodes.forEach((n) => nodeMap.set(n.id, n));
    }
    return nodeMap;
  }, [mapData]);

  // Render D3 SVG when data loads
  useEffect(() => {
    if (!mapData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes: rawNodes, links } = mapData.data;
    if (!rawNodes || rawNodes.length === 0) return;

    // Build node map for layout
    const nodeMap = new Map<string, Node>();
    rawNodes.forEach((n) => nodeMap.set(n.id, n));

    // Calculate depths
    const depths = calculateNodeDepths(nodeMap);

    // Use hierarchical layout for static positioning
    const container = svgRef.current.parentElement!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Check if nodes already have positions
    const hasPositions = rawNodes.some((n) => n.x !== undefined && n.y !== undefined);

    let positions: Map<string, { x: number; y: number }>;
    if (hasPositions) {
      positions = new Map();
      rawNodes.forEach((n) => {
        if (n.x !== undefined && n.y !== undefined) {
          positions.set(n.id, { x: n.x, y: n.y });
        }
      });
    } else {
      positions = createHierarchicalLayout(nodeMap, width, height);
    }

    // Set up zoom (pan + zoom enabled for read-only viewing)
    const mainGroup = svg.append('g').attr('class', 'main-group');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    const bgColor = getBackgroundColor(canvasBackground);

    // Render links
    const linkGroup = mainGroup.append('g').attr('class', 'links');

    links.forEach((link) => {
      const sourcePos = positions.get(link.source);
      const targetPos = positions.get(link.target);
      if (!sourcePos || !targetPos) return;

      const sourceDepth = depths.get(link.source) ?? 0;
      const targetDepth = depths.get(link.target) ?? 0;
      const linkStyle = getLinkVisualProperties(sourceDepth, targetDepth);

      linkGroup
        .append('line')
        .attr('class', 'link')
        .attr('data-source', link.source)
        .attr('data-target', link.target)
        .attr('x1', sourcePos.x)
        .attr('y1', sourcePos.y)
        .attr('x2', targetPos.x)
        .attr('y2', targetPos.y)
        .attr('stroke', '#999')
        .attr('stroke-width', linkStyle.strokeWidth)
        .attr('stroke-opacity', linkStyle.opacity);
    });

    // Render nodes
    const nodeGroup = mainGroup.append('g').attr('class', 'nodes');

    rawNodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const depth = depths.get(node.id) ?? 0;
      const visual = getNodeVisualProperties(depth);

      const g = nodeGroup
        .append('g')
        .attr('class', 'node')
        .attr('data-node-id', node.id)
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .style('cursor', 'pointer');

      // Background halo for visual separation from lines
      const buffer = depth === 0 ? 6 : 4;
      g.append('circle')
        .attr('class', 'node-background')
        .attr('r', visual.radius + buffer)
        .attr('fill', bgColor)
        .attr('stroke', bgColor)
        .attr('stroke-width', 4)
        .style('pointer-events', 'none');

      // Node circle
      g.append('circle')
        .attr('class', 'node-main')
        .attr('r', visual.radius)
        .attr('fill', node.color || visual.fillColor)
        .attr('stroke', visual.strokeColor)
        .attr('stroke-width', visual.strokeWidth + 1)
        .style('filter', depth <= 1 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none');

      // Node text -- truncate long text
      const displayText = node.text.length > 25 ? node.text.substring(0, 22) + '...' : node.text;

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', node.textColor || visual.strokeColor)
        .attr('font-size', `${visual.fontSize}px`)
        .attr('font-weight', visual.fontWeight)
        .attr('pointer-events', 'none')
        .text(displayText);

      // Note indicator (small purple dot)
      if (node.hasNote) {
        const angle = -Math.PI / 4;
        const indicatorX = visual.radius * Math.cos(angle);
        const indicatorY = visual.radius * Math.sin(angle);

        g.append('circle')
          .attr('class', 'note-indicator')
          .attr('cx', indicatorX)
          .attr('cy', indicatorY)
          .attr('r', 5)
          .attr('fill', '#9c27b0')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer');
      }

      // Click handler: select node to highlight subtree
      g.on('click', (event: MouseEvent) => {
        event.stopPropagation();
        setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
      });

      // Double-click to view note (if has note)
      g.on('dblclick', (event: MouseEvent) => {
        event.stopPropagation();
        if (node.hasNote && notesMap.current.has(node.id)) {
          setNoteModal({ nodeId: node.id, nodeText: node.text });
        }
      });

      // Hover effects
      g.on('mouseover', () => {
        setHoveredNodeId(node.id);
        g.select('.node-main')
          .transition()
          .duration(150)
          .attr('stroke-width', visual.strokeWidth + 3);
      });

      g.on('mouseout', () => {
        setHoveredNodeId(null);
        g.select('.node-main')
          .transition()
          .duration(150)
          .attr('stroke-width', visual.strokeWidth + 1);
      });
    });

    // Click on empty canvas deselects
    svg.on('click', () => {
      setSelectedNodeId(null);
    });

    // Auto-fit: calculate bounds and zoom to fit
    const allX = Array.from(positions.values()).map((p) => p.x);
    const allY = Array.from(positions.values()).map((p) => p.y);
    if (allX.length > 0) {
      const padding = 80;
      const minX = Math.min(...allX) - padding;
      const maxX = Math.max(...allX) + padding;
      const minY = Math.min(...allY) - padding;
      const maxY = Math.max(...allY) + padding;

      const boundsWidth = maxX - minX;
      const boundsHeight = maxY - minY;
      const scale = Math.min(width / boundsWidth, height / boundsHeight, 1.5);
      const tx = width / 2 - ((minX + maxX) / 2) * scale;
      const ty = height / 2 - ((minY + maxY) / 2) * scale;

      svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  }, [mapData, canvasBackground]);

  // Apply highlight effects when selected/hovered node changes
  useEffect(() => {
    if (!svgRef.current || !mapData) return;

    const svg = d3.select(svgRef.current);
    const nodeMap = getNodeMap();
    const depths = calculateNodeDepths(nodeMap);
    const highlightId = selectedNodeId || hoveredNodeId;

    if (!highlightId) {
      // Reset all styles
      svg.selectAll('.node').style('opacity', 1);
      svg.selectAll<SVGLineElement, unknown>('.link').each(function () {
        const el = d3.select(this);
        const sourceId = el.attr('data-source');
        const targetId = el.attr('data-target');
        const sourceDepth = depths.get(sourceId) ?? 0;
        const targetDepth = depths.get(targetId) ?? 0;
        const linkStyle = getLinkVisualProperties(sourceDepth, targetDepth);
        el.attr('stroke', '#999')
          .attr('stroke-width', linkStyle.strokeWidth)
          .attr('stroke-opacity', linkStyle.opacity)
          .style('opacity', 1);
      });

      // Reset node strokes
      svg.selectAll<SVGGElement, unknown>('.node').each(function () {
        const el = d3.select(this);
        const nodeId = el.attr('data-node-id');
        const node = nodeMap.get(nodeId);
        if (!node) return;
        const depth = depths.get(nodeId) ?? 0;
        const visual = getNodeVisualProperties(depth);
        el.select('.node-main').attr('stroke', visual.strokeColor);
      });
      return;
    }

    // Get all connected nodes (selected + descendants)
    const connectedIds = getAllConnectedNodes(highlightId, nodeMap);

    // Build set of highlighted links
    const highlightedLinks = new Set<string>();
    mapData.data.links.forEach((link) => {
      if (connectedIds.has(link.source) && connectedIds.has(link.target)) {
        highlightedLinks.add(`${link.source}-${link.target}`);
      }
    });

    // Dim non-connected nodes
    svg.selectAll<SVGGElement, unknown>('.node').each(function () {
      const el = d3.select(this);
      const nodeId = el.attr('data-node-id');
      el.style('opacity', connectedIds.has(nodeId) ? 1 : 0.3);
    });

    // Dim/highlight links
    svg.selectAll<SVGLineElement, unknown>('.link').each(function () {
      const el = d3.select(this);
      const sourceId = el.attr('data-source');
      const targetId = el.attr('data-target');
      const linkKey = `${sourceId}-${targetId}`;
      const isHighlighted = highlightedLinks.has(linkKey);

      const sourceDepth = depths.get(sourceId) ?? 0;
      const targetDepth = depths.get(targetId) ?? 0;
      const baseWidth = getLinkVisualProperties(sourceDepth, targetDepth).strokeWidth;

      el.style('opacity', isHighlighted ? 1 : 0.2)
        .attr('stroke', isHighlighted ? '#0066cc' : '#999')
        .attr('stroke-width', isHighlighted ? baseWidth + 2 : baseWidth);
    });

    // Highlight selected node border
    if (selectedNodeId) {
      svg.selectAll<SVGGElement, unknown>('.node')
        .filter(function () {
          return d3.select(this).attr('data-node-id') === selectedNodeId;
        })
        .select('.node-main')
        .attr('stroke', '#0066cc');
    }
  }, [selectedNodeId, hoveredNodeId, mapData, getNodeMap]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <span>Loading mind map...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <h2 className={styles.errorTitle}>Map Not Found</h2>
        <p className={styles.errorMessage}>{error}</p>
        <Link to="/" className={styles.ctaButton}>
          Create your own mind map
        </Link>
      </div>
    );
  }

  if (!mapData) return null;

  // Count nodes with notes for the badge
  const noteCount = mapData.data.notes?.length ?? 0;
  const currentNote = noteModal ? notesMap.current.get(noteModal.nodeId) : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <Link to="/" className={styles.logo}>ThoughtNet</Link>
          <span className={styles.divider}>/</span>
          <span className={styles.mapTitle}>{mapData.title}</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.sharedBadge}>Shared</span>
          <span>{mapData.node_count} nodes</span>
          {noteCount > 0 && (
            <span className={styles.notesBadge}>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </header>

      <div className={styles.canvas} style={getBackgroundStyle(canvasBackground)}>
        <svg ref={svgRef} />

        {/* Hint overlay */}
        <div className={styles.hint}>
          <span>Scroll to zoom. Drag to pan. Click nodes to highlight. Double-click to view notes.</span>
        </div>
      </div>

      {/* Read-only note viewer modal */}
      {noteModal && currentNote && ReactDOM.createPortal(
        <>
          <div
            className={styles.noteOverlay}
            onClick={() => setNoteModal(null)}
          />
          <div className={styles.noteModal}>
            <div className={styles.noteHeader}>
              <h3 className={styles.noteTitle}>Note: {noteModal.nodeText}</h3>
              <button
                className={styles.noteCloseButton}
                onClick={() => setNoteModal(null)}
                title="Close"
                type="button"
              >
                &times;
              </button>
            </div>
            <div className={styles.noteContent}>
              <RichTextEditor
                content={currentNote.contentJson || currentNote.content}
                contentType={currentNote.contentJson ? 'tiptap' : 'html'}
                onChange={() => {}}
                readOnly={true}
                className={styles.noteEditor}
              />
            </div>
          </div>
        </>,
        document.body
      )}

      <footer className={styles.footer}>
        <span className={styles.footerText}>Created with ThoughtNet</span>
        <Link to="/" className={styles.ctaButton}>
          Create your own mind map
        </Link>
      </footer>
    </div>
  );
};
