// Shared color palettes for node theming.
// Light palette: soft pastels, always dark text (readable on light canvas).
// Dark palette: saturated colors, always light text (readable on dark canvas).
// Both palettes have 1:1 positional correspondence for remapping when theme changes.

export interface PaletteSwatch {
  bg: string;
  text: string;
  label: string;
}

export const LIGHT_PALETTE: PaletteSwatch[] = [
  { bg: '#BBDEFB', text: '#333333', label: 'Blue' },
  { bg: '#90CAF9', text: '#333333', label: 'Sky Blue' },
  { bg: '#E1BEE7', text: '#333333', label: 'Lavender' },
  { bg: '#CE93D8', text: '#333333', label: 'Purple' },
  { bg: '#C8E6C9', text: '#333333', label: 'Green' },
  { bg: '#80CBC4', text: '#333333', label: 'Teal' },
  { bg: '#A5D6A7', text: '#333333', label: 'Mint' },
  { bg: '#DCEDC8', text: '#333333', label: 'Lime' },
  { bg: '#FFF9C4', text: '#333333', label: 'Yellow' },
  { bg: '#FFE0B2', text: '#333333', label: 'Orange' },
  { bg: '#FFCDD2', text: '#333333', label: 'Red' },
  { bg: '#F8BBD0', text: '#333333', label: 'Pink' },
  { bg: '#CFD8DC', text: '#333333', label: 'Blue Grey' },
  { bg: '#B0BEC5', text: '#333333', label: 'Silver' },
  { bg: '#D7CCC8', text: '#333333', label: 'Warm Grey' },
  { bg: '#E0E0E0', text: '#333333', label: 'Grey' },
];

export const DARK_PALETTE: PaletteSwatch[] = [
  { bg: '#1E88E5', text: '#FFFFFF', label: 'Blue' },
  { bg: '#1565C0', text: '#FFFFFF', label: 'Dark Blue' },
  { bg: '#7B1FA2', text: '#FFFFFF', label: 'Purple' },
  { bg: '#6A1B9A', text: '#FFFFFF', label: 'Deep Purple' },
  { bg: '#2E7D32', text: '#FFFFFF', label: 'Green' },
  { bg: '#00897B', text: '#FFFFFF', label: 'Teal' },
  { bg: '#388E3C', text: '#FFFFFF', label: 'Forest' },
  { bg: '#558B2F', text: '#FFFFFF', label: 'Olive' },
  { bg: '#F9A825', text: '#FFFFFF', label: 'Yellow' },
  { bg: '#EF6C00', text: '#FFFFFF', label: 'Orange' },
  { bg: '#C62828', text: '#FFFFFF', label: 'Red' },
  { bg: '#AD1457', text: '#FFFFFF', label: 'Pink' },
  { bg: '#37474F', text: '#FFFFFF', label: 'Blue Grey' },
  { bg: '#455A64', text: '#FFFFFF', label: 'Slate' },
  { bg: '#4E342E', text: '#FFFFFF', label: 'Brown' },
  { bg: '#546E7A', text: '#FFFFFF', label: 'Steel' },
];

export const LIGHT_DEFAULT = '#BBDEFB';
export const DARK_DEFAULT = '#1E88E5';

// Build lookup maps for O(1) remapping between palettes
const lightToIndex = new Map<string, number>();
const darkToIndex = new Map<string, number>();
LIGHT_PALETTE.forEach((s, i) => lightToIndex.set(s.bg.toLowerCase(), i));
DARK_PALETTE.forEach((s, i) => darkToIndex.set(s.bg.toLowerCase(), i));

/**
 * Remap a node's custom color to the current theme's palette.
 * If the color matches a swatch in the opposite palette, return the
 * same-position swatch from the target palette. Otherwise return as-is.
 */
export function remapColorForTheme(color: string, isDark: boolean): { bg: string; text: string } | null {
  const lower = color.toLowerCase();
  if (isDark) {
    // Color might be from light palette — remap to dark
    const idx = lightToIndex.get(lower);
    if (idx !== undefined) return DARK_PALETTE[idx];
    // Already a dark palette color — return its swatch for text color
    const dIdx = darkToIndex.get(lower);
    if (dIdx !== undefined) return DARK_PALETTE[dIdx];
  } else {
    // Color might be from dark palette — remap to light
    const idx = darkToIndex.get(lower);
    if (idx !== undefined) return LIGHT_PALETTE[idx];
    // Already a light palette color — return its swatch for text color
    const lIdx = lightToIndex.get(lower);
    if (lIdx !== undefined) return LIGHT_PALETTE[lIdx];
  }
  return null; // Not a palette color
}
