import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { ArrowLeft, GitFork, BookOpen } from 'lucide-react';
import { apiClient, ApiError } from '../../services/apiClient';
import { pullMapFromCloud } from '../../services/syncService';
import { useAuth } from '../../context/AuthContext';
import { RatingWidget } from '../../components/RatingWidget';
import { AdBanner } from '../../components/AdBanner';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';
import {
  calculateNodeDepths,
  getNodeVisualProperties,
  getLinkVisualProperties,
} from '../../utils/nodeHierarchy';
import { createHierarchicalLayout } from '../../utils/hierarchicalLayout';
import { getAllConnectedNodes } from '../../utils/getNodeDescendants';
import { getBackgroundStyle, getBackgroundColor } from '../../components/BackgroundSelector';
import type { CanvasBackground } from '../../components/BackgroundSelector';
import type { LibraryMapFull } from '../../types/library';
import type { Node } from '../../types/mindMap';
import type { SerializedNote } from '../../types/sync';
import styles from './LibraryMapView.module.css';

export const LibraryMapView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<LibraryMapFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [forking, setForking] = useState(false);
  const [noteModal, setNoteModal] = useState<{ nodeId: string; nodeText: string } | null>(null);
  const [isPro, setIsPro] = useState(false);
  const notesMap = useRef<Map<string, SerializedNote>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getPlanStatus().then((status) => {
      setIsPro(status.plan === 'pro');
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchMap = async () => {
      try {
        const data = await apiClient.getLibraryMap(id);
        if (!cancelled) {
          setMapData(data);
          // Build notes lookup
          if (data.data?.notes) {
            const map = new Map<string, SerializedNote>();
            data.data.notes.forEach((note: SerializedNote) => map.set(note.nodeId, note));
            notesMap.current = map;
          }
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError('This mind map was not found in the library.');
        } else if (err instanceof ApiError && err.status === 429) {
          setError('Too many requests. Please wait a moment and refresh.');
        } else {
          setError('Failed to load mind map.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMap();
    return () => { cancelled = true; };
  }, [id]);

  const canvasBackground: CanvasBackground = (mapData?.data?.canvasBackground as CanvasBackground) || 'white';

  const getNodeMap = useCallback((): Map<string, Node> => {
    const nodeMap = new Map<string, Node>();
    if (mapData?.data?.nodes) {
      mapData.data.nodes.forEach((n) => nodeMap.set(n.id, n));
    }
    return nodeMap;
  }, [mapData]);

  // D3 rendering
  useEffect(() => {
    if (!mapData || !svgRef.current) return;
    const svgEl = svgRef.current;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const { nodes: rawNodes, links } = mapData.data;
    if (!rawNodes || rawNodes.length === 0) return;

    const nodeMap = new Map<string, Node>();
    rawNodes.forEach((n) => nodeMap.set(n.id, n));
    const depths = calculateNodeDepths(nodeMap);

    const container = svgEl.parentElement!;
    const width = container.clientWidth;
    const height = container.clientHeight;

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

    const mainGroup = svg.append('g').attr('class', 'main-group');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => { mainGroup.attr('transform', event.transform); });
    svg.call(zoom);

    const bgColor = getBackgroundColor(canvasBackground);
    const linkGroup = mainGroup.append('g').attr('class', 'links');

    links.forEach((link) => {
      const sourcePos = positions.get(link.source);
      const targetPos = positions.get(link.target);
      if (!sourcePos || !targetPos) return;
      const sourceDepth = depths.get(link.source) ?? 0;
      const targetDepth = depths.get(link.target) ?? 0;
      const linkStyle = getLinkVisualProperties(sourceDepth, targetDepth);
      linkGroup.append('line')
        .attr('class', 'link')
        .attr('data-source', link.source)
        .attr('data-target', link.target)
        .attr('x1', sourcePos.x).attr('y1', sourcePos.y)
        .attr('x2', targetPos.x).attr('y2', targetPos.y)
        .attr('stroke', '#999')
        .attr('stroke-width', linkStyle.strokeWidth)
        .attr('stroke-opacity', linkStyle.opacity);
    });

    const nodeGroup = mainGroup.append('g').attr('class', 'nodes');

    rawNodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;
      const depth = depths.get(node.id) ?? 0;
      const visual = getNodeVisualProperties(depth, false, node.size);

      const g = nodeGroup.append('g')
        .attr('class', 'node')
        .attr('data-node-id', node.id)
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .style('cursor', 'pointer');

      const buffer = depth === 0 ? 6 : 4;
      const bgW = visual.width + buffer * 2;
      const bgH = visual.height + buffer * 2;
      g.append('rect').attr('class', 'node-background')
        .attr('x', -bgW / 2).attr('y', -bgH / 2)
        .attr('width', bgW).attr('height', bgH)
        .attr('rx', visual.borderRadius + 2).attr('ry', visual.borderRadius + 2)
        .attr('fill', bgColor).attr('stroke', bgColor)
        .attr('stroke-width', 4).style('pointer-events', 'none');

      g.append('rect').attr('class', 'node-main')
        .attr('x', -visual.width / 2).attr('y', -visual.height / 2)
        .attr('width', visual.width).attr('height', visual.height)
        .attr('rx', visual.borderRadius).attr('ry', visual.borderRadius)
        .attr('fill', node.color || visual.fillColor)
        .attr('stroke', visual.strokeColor).attr('stroke-width', visual.strokeWidth + 1)
        .style('filter', depth <= 1 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none');

      const displayText = node.text.length > 25 ? node.text.substring(0, 22) + '...' : node.text;
      g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', node.textColor || visual.strokeColor)
        .attr('font-size', `${visual.fontSize}px`).attr('font-weight', visual.fontWeight)
        .attr('pointer-events', 'none').text(displayText);

      // Note indicator (small purple dot at top-right corner)
      if (node.hasNote) {
        g.append('circle').attr('class', 'note-indicator')
          .attr('cx', visual.width / 2 - 4)
          .attr('cy', -visual.height / 2 + 4)
          .attr('r', 5).attr('fill', '#9c27b0')
          .attr('stroke', '#fff').attr('stroke-width', 1.5)
          .style('cursor', 'pointer');
      }

      g.on('click', (event: MouseEvent) => {
        event.stopPropagation();
        setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
      });

      // Double-click to view note (read-only)
      g.on('dblclick', (event: MouseEvent) => {
        event.stopPropagation();
        if (node.hasNote && notesMap.current.has(node.id)) {
          setNoteModal({ nodeId: node.id, nodeText: node.text });
        }
      });

      g.on('mouseover', () => {
        setHoveredNodeId(node.id);
        g.select('.node-main').transition().duration(150).attr('stroke-width', visual.strokeWidth + 3);
      });

      g.on('mouseout', () => {
        setHoveredNodeId(null);
        g.select('.node-main').transition().duration(150).attr('stroke-width', visual.strokeWidth + 1);
      });
    });

    svg.on('click', () => { setSelectedNodeId(null); });

    // Auto-fit
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

    // Cleanup: remove all D3 elements and detach zoom/event listeners
    return () => {
      svg.selectAll('*').remove();
      svg.on('.zoom', null);
      svg.on('click', null);
    };
  }, [mapData, canvasBackground]);

  // Highlight effect
  useEffect(() => {
    if (!svgRef.current || !mapData) return;
    const svg = d3.select(svgRef.current);
    const nodeMap = getNodeMap();
    const depths = calculateNodeDepths(nodeMap);
    const highlightId = selectedNodeId || hoveredNodeId;

    if (!highlightId) {
      svg.selectAll('.node').style('opacity', 1);
      svg.selectAll<SVGLineElement, unknown>('.link').each(function () {
        const el = d3.select(this);
        const srcD = depths.get(el.attr('data-source')) ?? 0;
        const tgtD = depths.get(el.attr('data-target')) ?? 0;
        const ls = getLinkVisualProperties(srcD, tgtD);
        el.attr('stroke', '#999').attr('stroke-width', ls.strokeWidth).attr('stroke-opacity', ls.opacity).style('opacity', 1);
      });
      svg.selectAll<SVGGElement, unknown>('.node').each(function () {
        const el = d3.select(this);
        const nId = el.attr('data-node-id');
        const depth = depths.get(nId) ?? 0;
        el.select('.node-main').attr('stroke', getNodeVisualProperties(depth, false).strokeColor);
      });
      return;
    }

    const connectedIds = getAllConnectedNodes(highlightId, nodeMap);
    const highlightedLinks = new Set<string>();
    mapData.data.links.forEach((link) => {
      if (connectedIds.has(link.source) && connectedIds.has(link.target)) {
        highlightedLinks.add(`${link.source}-${link.target}`);
      }
    });

    svg.selectAll<SVGGElement, unknown>('.node').each(function () {
      d3.select(this).style('opacity', connectedIds.has(d3.select(this).attr('data-node-id')) ? 1 : 0.3);
    });
    svg.selectAll<SVGLineElement, unknown>('.link').each(function () {
      const el = d3.select(this);
      const key = `${el.attr('data-source')}-${el.attr('data-target')}`;
      const isH = highlightedLinks.has(key);
      const srcD = depths.get(el.attr('data-source')) ?? 0;
      const tgtD = depths.get(el.attr('data-target')) ?? 0;
      const bw = getLinkVisualProperties(srcD, tgtD).strokeWidth;
      el.style('opacity', isH ? 1 : 0.2).attr('stroke', isH ? '#0066cc' : '#999').attr('stroke-width', isH ? bw + 2 : bw);
    });

    if (selectedNodeId) {
      svg.selectAll<SVGGElement, unknown>('.node')
        .filter(function () { return d3.select(this).attr('data-node-id') === selectedNodeId; })
        .select('.node-main').attr('stroke', '#0066cc');
    }
  }, [selectedNodeId, hoveredNodeId, mapData, getNodeMap]);

  const handleFork = async () => {
    if (!id || !isAuthenticated) {
      navigate('/login');
      return;
    }
    setForking(true);
    try {
      const forkedMap = await apiClient.forkMap(id);
      // Pull the new cloud map into IndexedDB so the editor can load it
      await pullMapFromCloud(forkedMap.id);
      navigate(`/map/${forkedMap.id}`);
    } catch {
      alert('Failed to fork map. Please try again.');
    } finally {
      setForking(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!id || !isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const result = await apiClient.rateMap(id, rating);
      setUserRating(rating);
      setMapData((prev) => prev ? { ...prev, rating_avg: result.rating_avg, rating_count: result.rating_count } : prev);
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <span>Loading mind map...</span>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className={styles.centered}>
        <h2 className={styles.errorTitle}>Map Not Found</h2>
        <p className={styles.errorMessage}>{error || 'Unknown error'}</p>
        <Link to="/library" className={styles.backLink}>Back to Library</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/library" className={styles.backButton}>
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.titleSection}>
            <h1 className={styles.mapTitle}>{mapData.title}</h1>
            <span className={styles.author}>by {mapData.author_name || 'Anonymous'}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <RatingWidget
            currentRating={Number(mapData.rating_avg) || 0}
            ratingCount={mapData.rating_count}
            userRating={userRating}
            onRate={handleRate}
            disabled={!isAuthenticated}
          />
          <button className={styles.forkButton} onClick={handleFork} disabled={forking}>
            <GitFork size={16} />
            {forking ? 'Forking...' : 'Fork'}
          </button>
        </div>
      </header>

      {mapData.description && (
        <div className={styles.descriptionBar}>
          <p className={styles.description}>{mapData.description}</p>
          <div className={styles.metaTags}>
            <span className={styles.categoryBadge}>{mapData.category}</span>
            {mapData.tags.map((tag) => (
              <span key={tag} className={styles.tagBadge}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.canvas} style={getBackgroundStyle(canvasBackground)}>
        <svg ref={svgRef} />
        <div className={styles.hint}>
          <span>Scroll to zoom. Drag to pan. Click nodes to highlight. Double-click to view notes.</span>
        </div>
      </div>

      {/* Read-only note viewer modal */}
      {noteModal && notesMap.current.has(noteModal.nodeId) && ReactDOM.createPortal(
        <>
          <div className={styles.noteOverlay} onClick={() => setNoteModal(null)} />
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
                content={notesMap.current.get(noteModal.nodeId)!.contentJson || notesMap.current.get(noteModal.nodeId)!.content}
                contentType={notesMap.current.get(noteModal.nodeId)!.contentJson ? 'tiptap' : 'html'}
                onChange={() => {}}
                readOnly={true}
                className={styles.noteEditor}
              />
            </div>
          </div>
        </>,
        document.body
      )}

      <AdBanner isPro={isPro} />

      <footer className={styles.viewFooter}>
        <div className={styles.stats}>
          <span>{mapData.node_count} nodes</span>
          {(mapData.data.notes?.length ?? 0) > 0 && (
            <span>{mapData.data.notes!.length} note{mapData.data.notes!.length !== 1 ? 's' : ''}</span>
          )}
          <span>{mapData.fork_count} fork{mapData.fork_count !== 1 ? 's' : ''}</span>
        </div>
        <Link to="/library" className={styles.footerLink}>
          <BookOpen size={14} />
          Browse Library
        </Link>
      </footer>
    </div>
  );
};
