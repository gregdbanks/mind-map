import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { Node, Link } from '../types/mindMap';

interface UseD3RendererProps {
  nodes: Node[];
  links: Link[];
  svgRef: React.RefObject<SVGSVGElement>;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onBackgroundClick: (position: { x: number; y: number }) => void;
}

export const useD3Renderer = ({
  nodes,
  links,
  svgRef,
  selectedNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onBackgroundClick
}: UseD3RendererProps) => {
  const linksRef = useRef<d3.Selection<SVGLineElement, Link, SVGGElement, unknown>>();
  const nodesRef = useRef<d3.Selection<SVGGElement, Node, SVGGElement, unknown>>();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g[data-testid="zoom-group"]');

    // Update links
    const linksGroup = g.select('g[data-testid="links-group"]');
    linksRef.current = linksGroup
      .selectAll<SVGLineElement, Link>('line')
      .data(links, (d) => `${d.source}-${d.target}`);

    // Enter new links
    linksRef.current
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Update link positions
    linksRef.current
      .attr('x1', (d) => {
        const source = nodes.find(n => n.id === d.source);
        return source?.x || 0;
      })
      .attr('y1', (d) => {
        const source = nodes.find(n => n.id === d.source);
        return source?.y || 0;
      })
      .attr('x2', (d) => {
        const target = nodes.find(n => n.id === d.target);
        return target?.x || 0;
      })
      .attr('y2', (d) => {
        const target = nodes.find(n => n.id === d.target);
        return target?.y || 0;
      });

    // Remove old links
    linksRef.current.exit().remove();

  }, [nodes, links, svgRef]);

  // Handle background clicks
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    svg.on('click', (event: MouseEvent) => {
      const target = event.target as Element;
      if (target === svgRef.current || target.getAttribute('data-testid')?.includes('group')) {
        const rect = svgRef.current!.getBoundingClientRect();
        const transform = d3.zoomTransform(svgRef.current!);
        const x = (event.clientX - rect.left - transform.x) / transform.k;
        const y = (event.clientY - rect.top - transform.y) / transform.k;
        onBackgroundClick({ x, y });
      }
    });
  }, [onBackgroundClick, svgRef]);
};