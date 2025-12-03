/**
 * Specialized input controls for CSS properties
 * Provides user-friendly inputs like color pickers, sliders, and unit selectors
 */

/**
 * Property types that determine which input control to use
 */
export type PropertyInputType = 'color' | 'size' | 'number' | 'text' | 'select';

/**
 * Common CSS units for size properties
 */
export const CSS_UNITS = ['px', '%', 'em', 'rem', 'vw', 'vh', 'pt', 'auto'];

/**
 * Properties that should use color picker
 */
export const COLOR_PROPERTIES = [
  'color',
  'background-color',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color'
];

/**
 * Properties that should use slider with unit selector
 */
export const SIZE_PROPERTIES = [
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'font-size', 'line-height', 'letter-spacing', 'word-spacing',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'top', 'right', 'bottom', 'left',
  'gap', 'grid-gap', 'grid-column-gap', 'grid-row-gap'
];

/**
 * Properties that should use percentage/decimal slider (0-1 or 0-100)
 */
export const PERCENTAGE_PROPERTIES = [
  'opacity',
  'flex-grow',
  'flex-shrink'
];

/**
 * Determine the input type for a given CSS property
 */
export function getPropertyInputType(property: string): PropertyInputType {
  if (COLOR_PROPERTIES.includes(property)) {
    return 'color';
  }
  if (SIZE_PROPERTIES.includes(property)) {
    return 'size';
  }
  if (PERCENTAGE_PROPERTIES.includes(property)) {
    return 'number';
  }
  return 'text';
}

/**
 * Parse a CSS value into numeric value and unit
 */
export function parseCSSValue(value: string): { number: number; unit: string } {
  if (!value) {
    return { number: 0, unit: 'px' };
  }
  
  // Handle 'auto' and 'none' as special cases
  if (value === 'auto') {
    return { number: 0, unit: 'auto' };
  }
  
  if (value === 'none') {
    return { number: 0, unit: 'px' };
  }
  
  const match = value.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (match) {
    return {
      number: parseFloat(match[1]) || 0,
      unit: match[2] || 'px'
    };
  }
  
  return { number: 0, unit: 'px' };
}

/**
 * Convert RGB/RGBA color to hex format for color input
 */
export function rgbToHex(rgb: string): string {
  // Handle rgb(r, g, b) or rgba(r, g, b, a)
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  
  // If already hex or named color, return as is
  if (rgb.startsWith('#')) {
    return rgb;
  }
  
  return '#000000';
}

/**
 * Create a color picker input control
 */
export function createColorInput(property: string, value: string): string {
  const hexValue = rgbToHex(value || '#000000');
  
  return `
    <div class="property-input-group color-input-group">
      <input type="color" 
             class="color-picker" 
             data-property="${property}" 
             value="${hexValue}" 
             title="Pick a color" />
      <input type="text" 
             class="color-text-input" 
             data-property="${property}" 
             value="${value}" 
             placeholder="e.g., #000000 or rgb(0,0,0)" />
    </div>
  `;
}

/**
 * Create a size input control with slider and unit selector
 */
export function createSizeInput(property: string, value: string): string {
  const parsed = parseCSSValue(value);
  const maxValue = property.includes('radius') ? 100 : 500;
  
  return `
    <div class="property-input-group size-input-group">
      <input type="range" 
             class="size-slider" 
             data-property="${property}"
             min="0" 
             max="${maxValue}" 
             step="1"
             value="${Math.round(parsed.number)}" 
             title="Adjust value" />
      <input type="number" 
             class="size-number-input" 
             data-property="${property}"
             value="${parsed.number}" 
             step="1"
             min="0" />
      <select class="size-unit-selector" data-property="${property}">
        ${CSS_UNITS.map(unit => 
          `<option value="${unit}" ${parsed.unit === unit ? 'selected' : ''}>${unit}</option>`
        ).join('')}
      </select>
    </div>
  `;
}

/**
 * Create a percentage/decimal input control with slider
 */
export function createPercentageInput(property: string, value: string): string {
  const numValue = parseFloat(value) || 0;
  const isOpacity = property === 'opacity';
  const max = isOpacity ? 1 : 10;
  const step = isOpacity ? 0.01 : 0.1;
  const displayValue = isOpacity ? (numValue * 100).toFixed(0) : numValue.toFixed(1);
  
  return `
    <div class="property-input-group percentage-input-group">
      <input type="range" 
             class="percentage-slider" 
             data-property="${property}"
             min="0" 
             max="${max}" 
             step="${step}"
             value="${numValue}" 
             title="Adjust ${property}" />
      <input type="number" 
             class="percentage-number-input" 
             data-property="${property}"
             value="${numValue}" 
             step="${step}"
             min="0"
             max="${max}" />
      <span class="percentage-label">${isOpacity ? `(${displayValue}%)` : ''}</span>
    </div>
  `;
}

/**
 * Get the styles for property input controls
 */
export function getPropertyInputStyles(): string {
  return `
    .property-input-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .color-input-group {
      display: grid;
      grid-template-columns: 50px 1fr;
      gap: 10px;
    }
    
    .color-picker {
      width: 50px;
      height: 38px;
      border: 1px solid #7f8c8d;
      border-radius: 4px;
      cursor: pointer;
      background: #34495e;
      padding: 2px;
    }
    
    .color-picker::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    
    .color-picker::-webkit-color-swatch {
      border: none;
      border-radius: 2px;
    }
    
    .color-text-input {
      flex: 1;
      padding: 8px;
      background: #34495e;
      border: 1px solid #7f8c8d;
      color: #ecf0f1;
      border-radius: 4px;
      font-size: 13px;
    }
    
    .size-input-group {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 8px;
      align-items: center;
    }
    
    .size-slider {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #34495e;
      outline: none;
      -webkit-appearance: none;
    }
    
    .size-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      border: 2px solid #2c3e50;
    }
    
    .size-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      border: 2px solid #2c3e50;
    }
    
    .size-slider:hover::-webkit-slider-thumb {
      background: #5dade2;
    }
    
    .size-slider:hover::-moz-range-thumb {
      background: #5dade2;
    }
    
    .size-number-input {
      width: 70px;
      padding: 6px 8px;
      background: #34495e;
      border: 1px solid #7f8c8d;
      color: #ecf0f1;
      border-radius: 4px;
      font-size: 13px;
      text-align: center;
    }
    
    .size-unit-selector {
      width: 65px;
      padding: 6px 4px;
      background: #34495e;
      border: 1px solid #7f8c8d;
      color: #ecf0f1;
      border-radius: 4px;
      font-size: 13px;
    }
    
    .percentage-input-group {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 8px;
      align-items: center;
    }
    
    .percentage-slider {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #34495e;
      outline: none;
      -webkit-appearance: none;
    }
    
    .percentage-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #27ae60;
      cursor: pointer;
      border: 2px solid #2c3e50;
    }
    
    .percentage-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #27ae60;
      cursor: pointer;
      border: 2px solid #2c3e50;
    }
    
    .percentage-slider:hover::-webkit-slider-thumb {
      background: #2ecc71;
    }
    
    .percentage-slider:hover::-moz-range-thumb {
      background: #2ecc71;
    }
    
    .percentage-number-input {
      width: 70px;
      padding: 6px 8px;
      background: #34495e;
      border: 1px solid #7f8c8d;
      color: #ecf0f1;
      border-radius: 4px;
      font-size: 13px;
      text-align: center;
    }
    
    .percentage-label {
      color: #95a5a6;
      font-size: 12px;
      min-width: 50px;
    }
    
    .color-text-input:focus,
    .size-number-input:focus,
    .size-unit-selector:focus,
    .percentage-number-input:focus {
      outline: none;
      border-color: #3498db;
    }
    
    /* Remove spinner from number inputs */
    .size-number-input::-webkit-inner-spin-button,
    .size-number-input::-webkit-outer-spin-button,
    .percentage-number-input::-webkit-inner-spin-button,
    .percentage-number-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `;
}
