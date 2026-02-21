import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as d3 from 'd3';
import { apiClient, ApiError } from '../../services/apiClient';
import {
  calculateNodeDepths,
  getNodeVisualProperties,
  getLinkVisualProperties,
} from '../../utils/nodeHierarchy';
import { createHierarchicalLayout } from '../../utils/hierarchicalLayout';
import type { Node, Link as MapLink } from '../../types/mindMap';
import styles from './SharedMap.module.css';

interface PublicMapData {
  id: string;
  title: string;
  data: {
    nodes: Node[];
    links: MapLink[];
    lastModified?: string;
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

    // Set up zoom
    const mainGroup = svg.append('g').attr('class', 'main-group');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

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
        .attr('class', styles.link)
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

      const g = nodeGroup.append('g').attr('transform', `translate(${pos.x}, ${pos.y})`);

      // Node circle
      g.append('circle')
        .attr('r', visual.radius)
        .attr('fill', node.color || visual.fillColor)
        .attr('stroke', visual.strokeColor)
        .attr('stroke-width', visual.strokeWidth);

      // Drop shadow for root/depth-1
      if (depth <= 1) {
        g.select('circle')
          .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
      }

      // Node text — truncate long text
      const displayText = node.text.length > 25 ? node.text.substring(0, 22) + '...' : node.text;

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', node.textColor || visual.strokeColor)
        .attr('font-size', `${visual.fontSize}px`)
        .attr('font-weight', visual.fontWeight)
        .attr('pointer-events', 'none')
        .text(displayText);

      // Note indicator
      if (node.hasNote) {
        g.append('circle')
          .attr('cx', visual.radius * Math.cos(-Math.PI / 4))
          .attr('cy', -visual.radius * Math.sin(Math.PI / 4))
          .attr('r', 4)
          .attr('fill', '#9c27b0');
      }
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
  }, [mapData]);

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
        </div>
      </header>

      <div className={styles.canvas}>
        <svg ref={svgRef} />
      </div>

      <footer className={styles.footer}>
        <span className={styles.footerText}>Created with ThoughtNet</span>
        <Link to="/" className={styles.ctaButton}>
          Create your own mind map
        </Link>
      </footer>
    </div>
  );
};
