import {
  hexToRgb,
  parseColorToRgb,
  getRelativeLuminance,
  getContrastRatio,
  getAutoTextColor,
  hassufficientContrast,
  getContrastSafeTextColor,
} from '../colorContrast';

describe('hexToRgb', () => {
  it('parses a standard #RRGGBB hex color', () => {
    expect(hexToRgb('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parses #000000 as black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses #ffffff as white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('parses shorthand #RGB format', () => {
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parses #RGB with identical digits', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('parses #RRGGBBAA format (ignores alpha)', () => {
    expect(hexToRgb('#ff880080')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('parses #RGBA shorthand format (ignores alpha)', () => {
    expect(hexToRgb('#f80a')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('handles input without # prefix', () => {
    expect(hexToRgb('ff8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('returns null for invalid hex strings', () => {
    expect(hexToRgb('#xyz')).toBeNull();
    expect(hexToRgb('#gggggg')).toBeNull();
  });

  it('returns null for wrong-length strings', () => {
    expect(hexToRgb('#f')).toBeNull();
    expect(hexToRgb('#ff')).toBeNull();
    expect(hexToRgb('#fffff')).toBeNull();
    expect(hexToRgb('#fffffff')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(hexToRgb('')).toBeNull();
    expect(hexToRgb('#')).toBeNull();
  });

  it('parses case-insensitively', () => {
    expect(hexToRgb('#FF8800')).toEqual({ r: 255, g: 136, b: 0 });
    expect(hexToRgb('#aAbBcC')).toEqual({ r: 170, g: 187, b: 204 });
  });
});

describe('parseColorToRgb', () => {
  it('parses hex colors by delegating to hexToRgb', () => {
    expect(parseColorToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses rgb() syntax', () => {
    expect(parseColorToRgb('rgb(100, 200, 50)')).toEqual({ r: 100, g: 200, b: 50 });
  });

  it('parses rgba() syntax', () => {
    expect(parseColorToRgb('rgba(100, 200, 50, 0.5)')).toEqual({ r: 100, g: 200, b: 50 });
  });

  it('returns null for empty or falsy input', () => {
    expect(parseColorToRgb('')).toBeNull();
  });

  it('trims whitespace from input', () => {
    expect(parseColorToRgb('  #ff0000  ')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColorToRgb('  rgb(10, 20, 30)  ')).toEqual({ r: 10, g: 20, b: 30 });
  });
});

describe('getRelativeLuminance', () => {
  it('returns 0 for black (0, 0, 0)', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBe(0);
  });

  it('returns approximately 1 for white (255, 255, 255)', () => {
    expect(getRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 4);
  });

  it('returns correct luminance for pure red', () => {
    // Red channel coefficient is 0.2126
    const lum = getRelativeLuminance(255, 0, 0);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(0.3);
  });

  it('returns correct luminance for pure green', () => {
    // Green channel coefficient is 0.7152 (highest)
    const lum = getRelativeLuminance(0, 255, 0);
    expect(lum).toBeGreaterThan(0.7);
    expect(lum).toBeLessThan(0.8);
  });

  it('returns correct luminance for pure blue', () => {
    // Blue channel coefficient is 0.0722 (lowest)
    const lum = getRelativeLuminance(0, 0, 255);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(0.1);
  });

  it('returns higher luminance for lighter grays', () => {
    const dark = getRelativeLuminance(50, 50, 50);
    const light = getRelativeLuminance(200, 200, 200);
    expect(light).toBeGreaterThan(dark);
  });

  it('handles the sRGB linearization threshold (0.03928)', () => {
    // Value below threshold: uses linear formula (srgb / 12.92)
    const lowLum = getRelativeLuminance(10, 10, 10);
    // Value above threshold: uses gamma formula
    const highLum = getRelativeLuminance(11, 11, 11);
    expect(highLum).toBeGreaterThan(lowLum);
  });
});

describe('getContrastRatio', () => {
  it('returns ~21 for black vs white', () => {
    const ratio = getContrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for identical colors', () => {
    const color = { r: 128, g: 128, b: 128 };
    expect(getContrastRatio(color, color)).toBe(1);
  });

  it('is symmetric (order does not matter)', () => {
    const dark = { r: 0, g: 0, b: 0 };
    const light = { r: 255, g: 255, b: 255 };
    expect(getContrastRatio(dark, light)).toBe(getContrastRatio(light, dark));
  });

  it('returns a value between 1 and 21 for arbitrary colors', () => {
    const ratio = getContrastRatio({ r: 100, g: 50, b: 200 }, { r: 200, g: 220, b: 180 });
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(ratio).toBeLessThanOrEqual(21);
  });
});

describe('getAutoTextColor', () => {
  it('returns white (#ffffff) for a dark background (#000000)', () => {
    expect(getAutoTextColor('#000000')).toBe('#ffffff');
  });

  it('returns white (#ffffff) for a dark background (#1a1a2e)', () => {
    expect(getAutoTextColor('#1a1a2e')).toBe('#ffffff');
  });

  it('returns black (#000000) for a light background (#ffffff)', () => {
    expect(getAutoTextColor('#ffffff')).toBe('#000000');
  });

  it('returns black (#000000) for a light background (#f0f0f0)', () => {
    expect(getAutoTextColor('#f0f0f0')).toBe('#000000');
  });

  it('returns black (#000000) as fallback for unparseable color', () => {
    expect(getAutoTextColor('notacolor')).toBe('#000000');
  });

  it('handles rgb() format', () => {
    expect(getAutoTextColor('rgb(0, 0, 0)')).toBe('#ffffff');
    expect(getAutoTextColor('rgb(255, 255, 255)')).toBe('#000000');
  });

  it('returns white for dark blue', () => {
    expect(getAutoTextColor('#000080')).toBe('#ffffff');
  });

  it('returns black for yellow', () => {
    expect(getAutoTextColor('#ffff00')).toBe('#000000');
  });
});

describe('hassufficientContrast', () => {
  it('returns true for black text on white background (ratio ~21)', () => {
    expect(hassufficientContrast('#000000', '#ffffff')).toBe(true);
  });

  it('returns true for white text on black background (ratio ~21)', () => {
    expect(hassufficientContrast('#ffffff', '#000000')).toBe(true);
  });

  it('returns false for similar colors with insufficient contrast', () => {
    // Light gray on white has very low contrast
    expect(hassufficientContrast('#eeeeee', '#ffffff')).toBe(false);
  });

  it('uses default threshold of 3.0', () => {
    // Medium gray (#767676) on white gives ~4.5:1 contrast, above 3.0
    expect(hassufficientContrast('#767676', '#ffffff')).toBe(true);
  });

  it('respects a custom threshold', () => {
    // Medium gray on white is ~4.5:1, so passes 4.5 threshold
    expect(hassufficientContrast('#767676', '#ffffff', 4.5)).toBe(true);
    // But should fail at a very high threshold like 10
    expect(hassufficientContrast('#767676', '#ffffff', 10)).toBe(false);
  });

  it('returns true when either color is unparseable', () => {
    expect(hassufficientContrast('invalid', '#ffffff')).toBe(true);
    expect(hassufficientContrast('#000000', 'invalid')).toBe(true);
  });
});

describe('getContrastSafeTextColor', () => {
  it('auto-picks white text when no textColor is provided on dark bg', () => {
    expect(getContrastSafeTextColor(undefined, '#000000')).toBe('#ffffff');
  });

  it('auto-picks black text when no textColor is provided on light bg', () => {
    expect(getContrastSafeTextColor(undefined, '#ffffff')).toBe('#000000');
  });

  it('returns user textColor if it has sufficient contrast', () => {
    // Red on white should have enough contrast
    expect(getContrastSafeTextColor('#cc0000', '#ffffff')).toBe('#cc0000');
  });

  it('overrides user textColor when contrast is insufficient', () => {
    // White text on white background -- insufficient contrast
    const result = getContrastSafeTextColor('#ffffff', '#ffffff');
    // Should auto-correct to black since bg is light
    expect(result).toBe('#000000');
  });

  it('uses auto-pick for empty string textColor', () => {
    // Empty string is falsy, should behave like undefined
    expect(getContrastSafeTextColor('', '#000000')).toBe('#ffffff');
  });
});
