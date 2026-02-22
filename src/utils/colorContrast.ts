/**
 * Color contrast utilities based on WCAG 2.0 guidelines.
 * Used to ensure text remains readable against any background color.
 */

/**
 * Parse a hex color string to RGB components.
 * Supports #RGB, #RRGGBB, and #RRGGBBAA formats.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # prefix
  const cleaned = hex.replace(/^#/, '');

  let r: number, g: number, b: number;

  if (cleaned.length === 3 || cleaned.length === 4) {
    // Short form: #RGB or #RGBA
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6 || cleaned.length === 8) {
    // Full form: #RRGGBB or #RRGGBBAA
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Parse any CSS color string to RGB.
 * Handles hex (#RRGGBB, #RGB), rgb(), rgba(), and named colors.
 */
export function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  if (!color) return null;

  const trimmed = color.trim();

  // Handle hex
  if (trimmed.startsWith('#')) {
    return hexToRgb(trimmed);
  }

  // Handle rgb() and rgba()
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // For named colors, use a temporary element to resolve
  // This won't work in non-browser environments, but this app is browser-only
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.style.color = trimmed;
    document.body.appendChild(temp);
    const computed = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);

    const match = computed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
      };
    }
  }

  return null;
}

/**
 * Calculate the relative luminance of a color per WCAG 2.0.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 *
 * @returns Luminance value between 0 (black) and 1 (white)
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  // Convert 0-255 to 0-1 and apply sRGB linearization
  const [rs, gs, bs] = [r, g, b].map(c => {
    const srgb = c / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate the WCAG contrast ratio between two colors.
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 *
 * @returns Contrast ratio between 1:1 (identical) and 21:1 (black/white)
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine the best text color (black or white) for a given background color.
 * Uses the WCAG relative luminance formula.
 *
 * @param bgColor - Background color as a CSS color string (hex, rgb, named)
 * @returns '#000000' for dark text on light backgrounds,
 *          '#ffffff' for light text on dark backgrounds
 */
export function getAutoTextColor(bgColor: string): string {
  const rgb = parseColorToRgb(bgColor);
  if (!rgb) {
    // Fallback: if we can't parse, return dark text (safe default)
    return '#000000';
  }

  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

  // Threshold of 0.179 comes from the WCAG contrast ratio formula:
  // At this luminance, white text and black text have roughly equal contrast ratios.
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

/**
 * Check whether two colors have sufficient contrast for readability.
 * WCAG AA requires a contrast ratio of at least 4.5:1 for normal text,
 * and 3:1 for large text (18pt+ or 14pt+ bold).
 *
 * @returns true if contrast is sufficient, false otherwise
 */
export function hassufficientContrast(
  textColor: string,
  bgColor: string,
  threshold: number = 3.0 // Use 3:1 as minimum (large text standard, suitable for node labels)
): boolean {
  const textRgb = parseColorToRgb(textColor);
  const bgRgb = parseColorToRgb(bgColor);

  if (!textRgb || !bgRgb) {
    // If we can't parse either color, assume it's fine
    return true;
  }

  const ratio = getContrastRatio(textRgb, bgRgb);
  return ratio >= threshold;
}

/**
 * Get a contrast-safe text color. If the user's chosen text color has
 * sufficient contrast against the background, use it. Otherwise,
 * auto-pick black or white.
 *
 * @param textColor - User-selected text color (may be empty/undefined)
 * @param bgColor - Node background color
 * @returns The best text color to use
 */
export function getContrastSafeTextColor(
  textColor: string | undefined,
  bgColor: string
): string {
  // If no explicit text color set, auto-pick based on background
  if (!textColor) {
    return getAutoTextColor(bgColor);
  }

  // If the user set a text color, check if it has sufficient contrast
  if (hassufficientContrast(textColor, bgColor)) {
    return textColor;
  }

  // User's text color doesn't have enough contrast - auto-correct
  return getAutoTextColor(bgColor);
}
