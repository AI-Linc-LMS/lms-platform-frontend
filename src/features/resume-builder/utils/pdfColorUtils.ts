// Utility functions to convert CSS colors to hex format for PDF compatibility

/**
 * Converts any CSS color format (rgb, rgba, hex, named) to hex format
 * This ensures html2canvas/jsPDF can properly process colors
 */
export const convertColorToHex = (color: string): string => {
  if (!color || color.trim() === '') return '#000000';
  
  // Already hex color
  if (color.startsWith('#')) {
    // Validate and return hex color
    const hexMatch = color.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
    if (hexMatch) return color.toUpperCase();
    return '#000000';
  }
  
  // RGB/RGBA format
  if (color.includes('rgb')) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10);
      const g = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      return `#${[r, g, b].map(x => {
        const hex = x.toString(16).padStart(2, '0');
        return hex;
      }).join('').toUpperCase()}`;
    }
  }
  
  // HSL/HSLA format - convert to RGB then hex
  if (color.includes('hsl')) {
    const match = color.match(/[\d.]+/g);
    if (match && match.length >= 3) {
      const h = parseFloat(match[0]) / 360;
      const s = parseFloat(match[1]) / 100;
      const l = parseFloat(match[2]) / 100;
      
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h * 6) % 2 - 1));
      const m = l - c / 2;
      
      let r = 0, g = 0, b = 0;
      
      if (h < 1/6) { r = c; g = x; b = 0; }
      else if (h < 2/6) { r = x; g = c; b = 0; }
      else if (h < 3/6) { r = 0; g = c; b = x; }
      else if (h < 4/6) { r = 0; g = x; b = c; }
      else if (h < 5/6) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);
      
      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    }
  }
  
  // OKLCH format - convert to RGB then hex
  // OKLCH: oklch(L C H) where L is lightness (0-1), C is chroma, H is hue (0-360)
  if (color.includes('oklch')) {
    const match = color.match(/oklch\(([^)]+)\)/i);
    if (match && match[1]) {
      const values = match[1].split(/[\s,]+/).filter(v => v.trim());
      if (values.length >= 3) {
        try {
          const L = parseFloat(values[0]); // Lightness (0-1)
          const C = parseFloat(values[1]); // Chroma
          const H = parseFloat(values[2]); // Hue (0-360 degrees, convert to radians)
          
          // Convert OKLCH to OKLab first, then to linear RGB, then to sRGB
          // This is a simplified conversion - for production, use a proper color library
          const hRad = (H * Math.PI) / 180;
          const a = C * Math.cos(hRad);
          const b = C * Math.sin(hRad);
          
          // OKLab to linear RGB (simplified transformation)
          const l = L + 0.3963377774 * a + 0.2158037573 * b;
          const m = L - 0.1055613458 * a - 0.0638541728 * b;
          const s = L - 0.0894841775 * a - 1.2914855480 * b;
          
          const l3 = l * l * l;
          const m3 = m * m * m;
          const s3 = s * s * s;
          
          // Linear RGB to sRGB (gamma correction)
          const linearToSRGB = (c: number) => {
            if (c <= 0.0031308) {
              return 12.92 * c;
            }
            return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
          };
          
          let r = linearToSRGB(+4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3);
          let g = linearToSRGB(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3);
          let bl = linearToSRGB(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3);
          
          // Clamp values
          r = Math.max(0, Math.min(1, r));
          g = Math.max(0, Math.min(1, g));
          bl = Math.max(0, Math.min(1, bl));
          
          // Convert to 0-255 range
          const rInt = Math.round(r * 255);
          const gInt = Math.round(g * 255);
          const bInt = Math.round(bl * 255);
          
          return `#${[rInt, gInt, bInt].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
        } catch (e) {
          console.warn('Error converting oklch color:', color, e);
          // Fallback: Use a canvas-based conversion if available
          try {
            // Try to use browser's native color parsing by creating a temporary element
            const tempEl = document.createElement('div');
            tempEl.style.color = color;
            tempEl.style.position = 'absolute';
            tempEl.style.visibility = 'hidden';
            document.body.appendChild(tempEl);
            const computed = window.getComputedStyle(tempEl).color;
            document.body.removeChild(tempEl);
            
            // Parse rgb/rgba from computed style
            if (computed && computed.startsWith('rgb')) {
              const rgbMatch = computed.match(/\d+/g);
              if (rgbMatch && rgbMatch.length >= 3) {
                const r = parseInt(rgbMatch[0], 10);
                const g = parseInt(rgbMatch[1], 10);
                const b = parseInt(rgbMatch[2], 10);
                return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
              }
            }
          } catch (fallbackError) {
            console.warn('Fallback conversion also failed:', fallbackError);
          }
          return '#000000';
        }
      }
    }
  }
  
  // Handle lab() and lch() color formats as well
  if (color.includes('lab(') || color.includes('lch(')) {
    // Similar approach - try browser parsing first
    try {
      const tempEl = document.createElement('div');
      tempEl.style.color = color;
      tempEl.style.position = 'absolute';
      tempEl.style.visibility = 'hidden';
      document.body.appendChild(tempEl);
      const computed = window.getComputedStyle(tempEl).color;
      document.body.removeChild(tempEl);
      
      if (computed && computed.startsWith('rgb')) {
        const rgbMatch = computed.match(/\d+/g);
        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0], 10);
          const g = parseInt(rgbMatch[1], 10);
          const b = parseInt(rgbMatch[2], 10);
          return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
        }
      }
    } catch (e) {
      console.warn('Error converting lab/lch color:', color, e);
    }
    return '#000000';
  }
  
  // Named colors - basic set
  const namedColors: Record<string, string> = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#008000',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'gray': '#808080',
    'grey': '#808080',
    'transparent': 'transparent',
  };
  
  const lowerColor = color.toLowerCase().trim();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor];
  }
  
  // Fallback to black if we can't parse
  console.warn(`Could not convert color: ${color}, using black as fallback`);
  return '#000000';
};

/**
 * Processes inline styles on an element and converts all color values to hex format
 * Also handles computed styles that might contain oklch or other unsupported formats
 */
export const processElementStylesForPDF = (element: HTMLElement): void => {
  if (!element || !element.style) return;
  
  const style = element.style;
  
  // Also get computed styles to catch oklch from CSS classes
  let computedStyle: CSSStyleDeclaration | null = null;
  try {
    computedStyle = window.getComputedStyle(element);
  } catch (e) {
    // Ignore if we can't get computed styles
  }
  
  // Helper to convert color from either inline or computed style
  const convertColorProperty = (property: keyof CSSStyleDeclaration, computedProperty?: string) => {
    try {
      const inlineValue = style[property as any];
      const computedValue = computedStyle?.[property as any] || computedProperty;
      
      // Prefer inline style, but check computed if inline doesn't exist or contains oklch
      let valueToConvert = inlineValue || computedValue;
      
      if (!valueToConvert || typeof valueToConvert !== 'string') return;
      
      // If value contains oklch or other unsupported formats, convert it
      if (valueToConvert.includes('oklch') || valueToConvert.includes('lab') || valueToConvert.includes('lch')) {
        const hexColor = convertColorToHex(valueToConvert);
        if (hexColor && hexColor !== '#000000') {
          (style as any)[property] = hexColor;
        }
      } else if (inlineValue && inlineValue !== 'transparent' && inlineValue !== 'rgba(0, 0, 0, 0)') {
        // Convert inline style even if it doesn't contain oklch
        const hexColor = convertColorToHex(inlineValue as string);
        if (hexColor && hexColor !== '#000000') {
          (style as any)[property] = hexColor;
        }
      }
    } catch (e) {
      // Silently ignore errors for individual properties
    }
  };
  
  // Convert color
  convertColorProperty('color');
  
  // Convert backgroundColor
  if (style.backgroundColor && style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    convertColorProperty('backgroundColor');
  } else if (computedStyle?.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
    // If computed style has oklch but inline doesn't, set it
    const hexColor = convertColorToHex(computedStyle.backgroundColor);
    if (hexColor && hexColor !== '#000000') {
      style.backgroundColor = hexColor;
    }
  }
  
  // Convert borderColor
  convertColorProperty('borderColor');
  
  // Convert borderTopColor, borderRightColor, borderBottomColor, borderLeftColor
  ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'].forEach(prop => {
    if (style[prop as keyof CSSStyleDeclaration]) {
      try {
        (style as any)[prop] = convertColorToHex(style[prop as keyof CSSStyleDeclaration] as string);
      } catch (e) {
        // Ignore errors
      }
    }
  });
  
  // Convert borderBottom (template literal like "2px solid #color" or "4px solid #color")
  if (style.borderBottom && style.borderBottom.includes('solid')) {
    try {
      // Match patterns like "2px solid #color" or "4px solid #color"
      const match = style.borderBottom.match(/(\d+px)\s+solid\s+(.+?)(?:\s|;|$)/);
      if (match) {
        const width = match[1];
        const colorValue = match[2].trim().replace(/['"]/g, ''); // Remove quotes
        const hexColor = convertColorToHex(colorValue);
        if (hexColor !== 'transparent') {
          style.borderBottom = `${width} solid ${hexColor}`;
        }
      }
    } catch (e) {
      console.warn('Error converting borderBottom:', e);
    }
  }
  
  // Convert border (if it includes a color)
  if (style.border && (style.border.includes('rgb') || style.border.includes('#') || style.border.match(/\b(solid|dashed|dotted)\s+[a-z]|#[0-9a-f]/i))) {
    try {
      // Try to extract and convert color from border
      const parts = style.border.split(/\s+/);
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].match(/^(rgb|rgba|hsl|hsla|#[0-9a-f]|[a-z]+)/i)) {
          const hex = convertColorToHex(parts[i]);
          if (hex !== 'transparent') {
            parts[i] = hex;
          }
        }
      }
      style.border = parts.join(' ');
    } catch (e) {
      // Ignore errors for border
    }
  }
};

