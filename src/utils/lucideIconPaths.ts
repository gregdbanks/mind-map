/**
 * Raw Lucide icon SVG path data for D3 (non-React) rendering.
 * Each icon uses a 24x24 viewBox with stroke-based rendering.
 */

export const ICON_PLUS = [
  { d: 'M5 12h14' },
  { d: 'M12 5v14' },
];

export const ICON_PENCIL = [
  { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' },
  { d: 'm15 5 4 4' },
];

export const ICON_X = [
  { d: 'M18 6 6 18' },
  { d: 'm6 6 12 12' },
];

export const ICON_FILE_TEXT = [
  { d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z' },
  { d: 'M14 2v5a1 1 0 0 0 1 1h5' },
  { d: 'M10 9H8' },
  { d: 'M16 13H8' },
  { d: 'M16 17H8' },
];

/**
 * Render a Lucide icon into a D3 SVG group.
 * The parent group should be positioned/scaled to fit a 24x24 viewBox.
 */
export function renderLucideIconD3(
  parentGroup: any,
  paths: Array<{ d: string }>,
  stroke = '#fff',
  strokeWidth = 2,
) {
  paths.forEach((p) => {
    parentGroup.append('path')
      .attr('d', p.d)
      .attr('fill', 'none')
      .attr('stroke', stroke)
      .attr('stroke-width', strokeWidth)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');
  });
}
