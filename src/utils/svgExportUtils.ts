import { getBackgroundColor } from '../components/BackgroundSelector';
import type { CanvasBackground } from '../components/BackgroundSelector';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PADDING = 40;

interface ExportResult {
  svgString: string;
  width: number;
  height: number;
}

/**
 * Clones the live SVG, strips UI-only elements, resets zoom transform,
 * computes a tight viewBox, inlines styles, adds background, and serializes.
 * Shared by SVG, PNG, and PDF export paths.
 */
export function prepareSVGForExport(
  svgEl: SVGSVGElement,
  bbox: { x: number; y: number; width: number; height: number },
  canvasBackground: CanvasBackground
): ExportResult {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // Remove UI-only elements
  clone.querySelectorAll('.node-actions').forEach((el) => el.remove());
  clone.querySelectorAll('.marquee-group').forEach((el) => el.remove());
  clone.querySelectorAll('.multi-select-indicator').forEach((el) => el.remove());

  // Reset zoom transform on main group
  const mainGroup = clone.querySelector('.main-group') as SVGGElement | null;
  if (mainGroup) {
    mainGroup.setAttribute('transform', '');
  }

  // Compute padded viewBox
  const vx = bbox.x - PADDING;
  const vy = bbox.y - PADDING;
  const vw = bbox.width + PADDING * 2;
  const vh = bbox.height + PADDING * 2;

  clone.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
  clone.setAttribute('width', String(Math.ceil(vw)));
  clone.setAttribute('height', String(Math.ceil(vh)));
  clone.setAttribute('xmlns', SVG_NS);
  clone.removeAttribute('style');

  // Inline link styles (safety net — D3 sets most inline, but CSS class may fill gaps)
  clone.querySelectorAll('line').forEach((line) => {
    if (!line.getAttribute('stroke')) line.setAttribute('stroke', '#999999');
    if (!line.getAttribute('stroke-opacity')) line.setAttribute('stroke-opacity', '0.6');
    if (!line.getAttribute('stroke-width')) line.setAttribute('stroke-width', '2');
    line.setAttribute('fill', 'none');
  });

  // Add background rect
  const bgColor = getBackgroundColor(canvasBackground);
  const bgRect = document.createElementNS(SVG_NS, 'rect');
  bgRect.setAttribute('x', String(vx));
  bgRect.setAttribute('y', String(vy));
  bgRect.setAttribute('width', String(vw));
  bgRect.setAttribute('height', String(vh));
  bgRect.setAttribute('fill', bgColor);
  clone.insertBefore(bgRect, clone.firstChild);

  // Add SVG patterns for grid backgrounds
  addBackgroundPattern(clone, canvasBackground, bgRect);

  // Embed font style
  const defs = clone.querySelector('defs') || document.createElementNS(SVG_NS, 'defs');
  if (!defs.parentNode) clone.insertBefore(defs, clone.firstChild);
  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = `text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }`;
  defs.appendChild(style);

  // Serialize
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);

  return { svgString, width: Math.ceil(vw), height: Math.ceil(vh) };
}

function addBackgroundPattern(
  clone: SVGSVGElement,
  bg: CanvasBackground,
  bgRect: SVGRectElement
): void {
  if (bg !== 'dot-grid' && bg !== 'dot-grid-dark' && bg !== 'line-grid') return;

  let defs = clone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    clone.insertBefore(defs, clone.firstChild);
  }

  const pattern = document.createElementNS(SVG_NS, 'pattern');
  pattern.setAttribute('id', 'export-bg-pattern');
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('width', '20');
  pattern.setAttribute('height', '20');

  if (bg === 'dot-grid' || bg === 'dot-grid-dark') {
    const dotColor = bg === 'dot-grid' ? '#cccccc' : '#555555';
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '10');
    circle.setAttribute('cy', '10');
    circle.setAttribute('r', '1');
    circle.setAttribute('fill', dotColor);
    pattern.appendChild(circle);
  } else if (bg === 'line-grid') {
    const hLine = document.createElementNS(SVG_NS, 'line');
    hLine.setAttribute('x1', '0');
    hLine.setAttribute('y1', '0');
    hLine.setAttribute('x2', '20');
    hLine.setAttribute('y2', '0');
    hLine.setAttribute('stroke', '#e0e0e0');
    hLine.setAttribute('stroke-width', '0.5');
    pattern.appendChild(hLine);

    const vLine = document.createElementNS(SVG_NS, 'line');
    vLine.setAttribute('x1', '0');
    vLine.setAttribute('y1', '0');
    vLine.setAttribute('x2', '0');
    vLine.setAttribute('y2', '20');
    vLine.setAttribute('stroke', '#e0e0e0');
    vLine.setAttribute('stroke-width', '0.5');
    pattern.appendChild(vLine);
  }

  defs.appendChild(pattern);

  // Overlay the pattern on top of the solid background
  const patternRect = document.createElementNS(SVG_NS, 'rect');
  patternRect.setAttribute('x', bgRect.getAttribute('x')!);
  patternRect.setAttribute('y', bgRect.getAttribute('y')!);
  patternRect.setAttribute('width', bgRect.getAttribute('width')!);
  patternRect.setAttribute('height', bgRect.getAttribute('height')!);
  patternRect.setAttribute('fill', 'url(#export-bg-pattern)');
  // Insert right after bgRect
  bgRect.parentNode!.insertBefore(patternRect, bgRect.nextSibling);
}
