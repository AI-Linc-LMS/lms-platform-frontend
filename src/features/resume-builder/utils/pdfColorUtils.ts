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
 * Resolves CSS variable references (e.g., var(--primary-500)) to their computed hex values
 * @param cssVar The CSS variable reference string (e.g., "var(--primary-500)")
 * @param element Optional element to use for computing the variable value
 * @returns The computed hex color value or null if not resolvable
 */
export const resolveCSSVariableToHex = (cssVar: string, element?: HTMLElement): string | null => {
  if (!cssVar || !cssVar.includes('var(')) return null;
  
  try {
    // Create a temporary element if none provided
    const tempEl = element || document.createElement('div');
    tempEl.style.position = 'absolute';
    tempEl.style.visibility = 'hidden';
    if (!element) {
      document.body.appendChild(tempEl);
    }
    
    // Set the CSS variable value and get computed style
    tempEl.style.color = cssVar;
    const computed = window.getComputedStyle(tempEl).color;
    
    // Clean up temporary element if we created it
    if (!element && tempEl.parentNode) {
      document.body.removeChild(tempEl);
    }
    
    // Convert computed RGB value to hex
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
    console.warn('Error resolving CSS variable:', cssVar, e);
  }
  
  return null;
};

/**
 * Processes ALL stylesheets in the document and converts all color values to hex
 * This must run before html2canvas processes the document
 */
export const convertAllStylesheetColorsToHex = (): void => {
  try {
    const styleSheets = document.styleSheets;
    
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (!sheet.cssRules) continue;
        
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j];
          
          if (rule instanceof CSSStyleRule) {
            const ruleStyle = rule.style;
            
            // Process all color properties
            const colorProps = [
              'color', 'backgroundColor', 'borderColor', 
              'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
              'outlineColor', 'columnRuleColor', 'textDecorationColor', 'textEmphasisColor'
            ];
            
            colorProps.forEach(prop => {
              try {
                const value = ruleStyle.getPropertyValue(prop);
                if (value && typeof value === 'string' && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') {
                  let valueToConvert = value;
                  
                  // Resolve CSS variables first
                  if (value.includes('var(')) {
                    const resolved = resolveCSSVariableToHex(value);
                    if (resolved) {
                      valueToConvert = resolved;
                    } else {
                      // If we can't resolve, skip this property
                      return;
                    }
                  }
                  
                  // Convert any color format to hex
                  if (valueToConvert.includes('oklch') || valueToConvert.includes('lab(') || valueToConvert.includes('lch(') ||
                      (valueToConvert.includes('rgb') && !valueToConvert.startsWith('#')) || valueToConvert.includes('hsl')) {
                    const hexColor = convertColorToHex(valueToConvert);
                    if (hexColor && hexColor !== '#000000') {
                      ruleStyle.setProperty(prop, hexColor, 'important');
                    }
                  }
                }
              } catch (e) {
                // Ignore errors for individual properties
              }
            });
            
            // Process border shorthand
            ['border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft'].forEach(borderProp => {
              try {
                const borderValue = ruleStyle.getPropertyValue(borderProp);
                if (borderValue && (borderValue.includes('oklch') || borderValue.includes('lab(') || 
                    borderValue.includes('lch(') || borderValue.includes('rgb') || borderValue.includes('hsl') ||
                    borderValue.includes('var('))) {
                  let updatedBorder = borderValue;
                  
                  // Resolve CSS variables in border
                  if (updatedBorder.includes('var(')) {
                    const varMatch = updatedBorder.match(/var\([^)]+\)/g);
                    if (varMatch) {
                      varMatch.forEach(varRef => {
                        const resolved = resolveCSSVariableToHex(varRef);
                        if (resolved) {
                          updatedBorder = updatedBorder.replace(varRef, resolved);
                        }
                      });
                    }
                  }
                  
                  // Convert any color formats in border
                  updatedBorder = updatedBorder.replace(/(oklch|lab|lch|rgb|rgba|hsl|hsla)\([^)]+\)/gi, (match) => {
                    const hex = convertColorToHex(match);
                    return hex && hex !== '#000000' ? hex : match;
                  });
                  
                  if (updatedBorder !== borderValue) {
                    ruleStyle.setProperty(borderProp, updatedBorder, 'important');
                  }
                }
              } catch (e) {
                // Ignore border errors
              }
            });
          }
        }
      } catch (e) {
        // Some stylesheets may not be accessible (CORS)
        // This is expected for external stylesheets
      }
    }
  } catch (e) {
    console.warn('Error processing stylesheets:', e);
  }
};

/**
 * Processes inline styles on an element and converts all color values to hex format
 * Also handles computed styles that might contain oklch or other unsupported formats
 * This is more aggressive - converts ALL color properties to hex, not just oklch ones
 */
export const processElementStylesForPDF = (element: HTMLElement): void => {
  if (!element || !element.style) return;
  
  const style = element.style;
  
  // Get computed styles to catch colors from CSS classes
  let computedStyle: CSSStyleDeclaration | null = null;
  try {
    computedStyle = window.getComputedStyle(element);
  } catch (e) {
    // Ignore if we can't get computed styles
  }
  
  // Helper to convert ANY color value to hex
  const convertAnyColorToHex = (value: string | null | undefined): string | null => {
    if (!value || typeof value !== 'string') return null;
    if (value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return null;
    
    // Convert any color format to hex
    try {
      const hexColor = convertColorToHex(value);
      if (hexColor && hexColor !== '#000000') {
        return hexColor;
      }
    } catch (e) {
      // Ignore conversion errors
    }
    return null;
  };
  
  // List of all color properties to convert
  const colorProperties = [
    'color', 'backgroundColor', 'borderColor', 
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'columnRuleColor', 'textDecorationColor', 'textEmphasisColor'
  ];
  
  // Convert all color properties
  colorProperties.forEach(prop => {
    try {
      // Check inline style first
      const inlineValue = (style as any)[prop];
      if (inlineValue) {
        const hexColor = convertAnyColorToHex(inlineValue);
        if (hexColor) {
          (style as any)[prop] = hexColor;
          return;
        }
      }
      
      // If no inline style or conversion failed, check computed style
      if (computedStyle) {
        let computedValue = (computedStyle as any)[prop];
        
        // Resolve CSS variables in computed style
        if (computedValue && typeof computedValue === 'string' && computedValue.includes('var(')) {
          const resolved = resolveCSSVariableToHex(computedValue, element);
          if (resolved) {
            computedValue = resolved;
          }
        }
        
        if (computedValue) {
          const hexColor = convertAnyColorToHex(computedValue);
          if (hexColor) {
            (style as any)[prop] = hexColor;
          }
        }
      }
    } catch (e) {
      // Silently ignore errors for individual properties
    }
  });
  
  // Convert border shorthand properties
  const borderProps = ['border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft'];
  borderProps.forEach(prop => {
    try {
      const borderValue = (style as any)[prop];
      if (borderValue && typeof borderValue === 'string') {
        // Check if border contains a color (oklch, lab, lch, rgb, hsl, hex, or named color)
        if (borderValue.includes('oklch') || borderValue.includes('lab(') || borderValue.includes('lch(') ||
            borderValue.match(/\b(rgb|rgba|hsl|hsla|#[0-9a-fA-F]{3,6}|[a-z]+)\b/i)) {
          // Extract color from border value
          const colorMatch = borderValue.match(/\b(oklch|lab|lch|rgb|rgba|hsl|hsla|#[0-9a-fA-F]{3,6}|[a-z]+)\(?[^)\s]*\)?/gi);
          if (colorMatch && colorMatch.length > 0) {
            let updatedBorder = borderValue;
            colorMatch.forEach(colorValue => {
              const hexColor = convertAnyColorToHex(colorValue);
              if (hexColor) {
                updatedBorder = updatedBorder.replace(colorValue, hexColor);
              }
            });
            (style as any)[prop] = updatedBorder;
          }
        }
      }
    } catch (e) {
      // Ignore border conversion errors
    }
  });
  
  // Also check style attribute directly for any oklch/lab/lch
  const styleAttr = element.getAttribute('style');
  if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('lab(') || styleAttr.includes('lch('))) {
    try {
      const updatedStyle = styleAttr.replace(/(oklch|lab|lch)\([^)]+\)/gi, (match) => {
        const hexColor = convertAnyColorToHex(match);
        return hexColor || match;
      });
      element.setAttribute('style', updatedStyle);
    } catch (e) {
      // Ignore style attribute conversion errors
    }
  }
};

