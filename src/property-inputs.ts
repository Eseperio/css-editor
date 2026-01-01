/**
 * Specialized input controls for CSS properties
 * Provides user-friendly inputs like color pickers, sliders, and unit selectors
 */

import { t } from './i18n';

/**
 * Property types that determine which input control to use
 */
export type PropertyInputType = 'color' | 'size' | 'number' | 'text' | 'select' | 'filter';

/**
 * Common CSS units for size properties
 */
export const CSS_UNITS = ['px', '%', 'em', 'rem', 'vw', 'vh', 'pt', 'auto'];

/**
 * Filter options for user-friendly filter input
 */
export interface FilterOption {
  type: FilterType;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export type FilterType = 'none' | 'blur' | 'grayscale' | 'sepia' | 'brightness' | 'contrast' | 'saturate' | 'invert' | 'hue-rotate' | 'custom';

/**
 * Get filter options with translated labels
 * Note: Creates new array on each call with current translations.
 * This is acceptable as it's only called when rendering filter inputs.
 */
export function getFilterOptions(): FilterOption[] {
  return [
    { type: 'none', label: t('ui.filters.none'), unit: '', min: 0, max: 0, step: 0, defaultValue: 0 },
    { type: 'blur', label: t('ui.filters.blur'), unit: 'px', min: 0, max: 20, step: 0.5, defaultValue: 5 },
    { type: 'grayscale', label: t('ui.filters.grayscale'), unit: '%', min: 0, max: 100, step: 1, defaultValue: 50 },
    { type: 'sepia', label: t('ui.filters.sepia'), unit: '%', min: 0, max: 100, step: 1, defaultValue: 40 },
    { type: 'brightness', label: t('ui.filters.brightness'), unit: '%', min: 0, max: 200, step: 1, defaultValue: 100 },
    { type: 'contrast', label: t('ui.filters.contrast'), unit: '%', min: 0, max: 200, step: 1, defaultValue: 100 },
    { type: 'saturate', label: t('ui.filters.saturate'), unit: '%', min: 0, max: 200, step: 1, defaultValue: 100 },
    { type: 'invert', label: t('ui.filters.invert'), unit: '%', min: 0, max: 100, step: 1, defaultValue: 0 },
    { type: 'hue-rotate', label: t('ui.filters.hueRotate'), unit: 'deg', min: 0, max: 360, step: 1, defaultValue: 0 },
    { type: 'custom', label: t('ui.filters.custom'), unit: '', min: 0, max: 0, step: 0, defaultValue: 0 }
  ];
}

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
  if (property === 'filter') {
    return 'filter';
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
             title="${t('ui.inputs.pickColor')}" />
      <input type="text" 
             class="color-text-input" 
             data-property="${property}" 
             value="${value}" 
             placeholder="e.g., #000000 or rgb(0,0,0)" />
    </div>
  `;
}

/**
 * Create a size input control with slider in popover (Task 4)
 * Slider now appears in a popover when clicking the numeric input
 */
export function createSizeInput(property: string, value: string): string {
  const parsed = parseCSSValue(value);
  const maxValue = property.includes('radius') ? 100 : 500;
  const sliderValue = mapValueToSizeSlider(parsed.number);
  
  // Determine if logarithmic scaling is needed based on range
  const minVal = 0;
  const maxVal = maxValue;
  const steps = (maxVal - minVal) / 1;
  const useLogarithmic = steps > 100;
  
  return `
    <div class="property-input-group size-input-group">
      <input type="number" 
             class="size-number-input" 
             data-property="${property}"
             data-slider-min="${minVal}"
             data-slider-max="${maxVal}"
             data-slider-step="1"
             data-use-logarithmic="${useLogarithmic}"
             value="${parsed.number}" 
             step="1"
             min="${minVal < 0 ? minVal : 0}"
             title="${t('ui.inputs.clickForSlider')}" />
      <select class="size-unit-selector" data-property="${property}">
        ${CSS_UNITS.map(unit => 
          `<option value="${unit}" ${parsed.unit === unit ? 'selected' : ''}>${unit}</option>`
        ).join('')}
      </select>
      <div class="slider-popover" data-property="${property}" style="display: none;">
        <input type="range" 
               class="size-slider" 
               data-property="${property}"
               min="0" 
               max="100" 
               step="0.1"
               value="${sliderValue}" />
        <span class="slider-value-display">${parsed.number}</span>
      </div>
    </div>
  `;
}

/**
 * Create a filter input control with dropdown and slider
 */
export function createFilterInput(property: string, value: string): string {
  const parsed = parseFilterValue(value);
  const filterOptions = getFilterOptions();
  const active = getFilterOption(parsed.type) || filterOptions[0];
  const isCustom = parsed.type === 'custom';
  const showControls = parsed.type !== 'none' && parsed.type !== 'custom';
  const sliderValue = showControls ? parsed.value : active.defaultValue;

  return `
    <div class="property-input-group filter-input-group">
      <select class="filter-select" data-property="${property}">
        ${filterOptions.map(opt => `
          <option 
            value="${opt.type}" 
            data-unit="${opt.unit}" 
            data-min="${opt.min}" 
            data-max="${opt.max}" 
            data-step="${opt.step}" 
            data-default="${opt.defaultValue}"
            ${opt.type === parsed.type ? 'selected' : ''}>
            ${opt.label}
          </option>`).join('')}
      </select>
      <div class="filter-controls" data-property="${property}" style="${showControls ? '' : 'display:none;'}">
        <input type="range"
               class="filter-slider"
               data-property="${property}"
               min="${active.min}"
               max="${active.max}"
               step="${active.step}"
               value="${sliderValue}" />
        <div class="filter-numeric">
          <input type="number"
                 class="filter-number-input"
                 data-property="${property}"
                 min="${active.min}"
                 max="${active.max}"
                 step="${active.step}"
                 value="${sliderValue}" />
          <span class="filter-unit" data-property="${property}">${active.unit}</span>
        </div>
      </div>
      <input type="text"
             class="filter-custom-input"
             data-property="${property}"
             value="${isCustom ? parsed.raw : ''}"
             placeholder="e.g., blur(4px) drop-shadow(2px 4px 6px #000)"
             style="${isCustom ? '' : 'display:none;'}" />
    </div>
  `;
}

export function parseFilterValue(value: string): { type: FilterType; value: number; unit: string; raw: string } {
  const raw = (value || '').trim();
  const filterOptions = getFilterOptions();
  if (!raw) {
    const defaultOption = filterOptions.find(o => o.type === 'blur')!;
    return { type: 'blur', value: defaultOption.defaultValue, unit: defaultOption.unit, raw: formatFilterValue('blur', defaultOption.defaultValue, defaultOption.unit) };
  }
  if (raw === 'none') {
    return { type: 'none', value: 0, unit: '', raw: 'none' };
  }

  const match = raw.match(/^([a-z-]+)\(([^)]+)\)$/i);
  if (match) {
    const type = match[1] as FilterType;
    const option = getFilterOption(type);
    if (option) {
      const numMatch = match[2].match(/(-?\d*\.?\d+)/);
      const num = numMatch ? parseFloat(numMatch[1]) : option.defaultValue;
      return { type, value: num, unit: option.unit, raw };
    }
  }

  return { type: 'custom', value: 0, unit: '', raw };
}

export function formatFilterValue(type: FilterType, value: number, unit: string): string {
  if (type === 'none') return 'none';
  if (type === 'custom') return `${value}`;
  return `${type}(${value}${unit})`;
}

export function getFilterOption(type: FilterType): FilterOption | undefined {
  return getFilterOptions().find(opt => opt.type === type);
}

/** 
 * Map slider position (0-100) to a non-linear size value.
 * 0-35% => 1-30, 35-70% => 31-100, 70-100% => 101-500
 */
export function mapSizeSliderToValue(position: number): number {
  const pos = Math.max(0, Math.min(100, position));
  if (pos <= 35) {
    const ratio = pos / 35;
    return Math.round(1 + ratio * (30 - 1));
  }
  if (pos <= 70) {
    const ratio = (pos - 35) / 35;
    return Math.round(31 + ratio * (100 - 31));
  }
  const ratio = (pos - 70) / 30;
  return Math.round(101 + ratio * (500 - 101));
}

/**
 * Map a size value back to slider position (0-100) using same non-linear scale.
 */
export function mapValueToSizeSlider(value: number): number {
  if (!isFinite(value)) return 0;
  if (value <= 1) return 0;
  if (value <= 30) {
    const ratio = (value - 1) / (30 - 1);
    return ratio * 35;
  }
  if (value <= 100) {
    const ratio = (value - 31) / (100 - 31);
    return 35 + ratio * 35;
  }
  if (value >= 500) return 100;
  const ratio = (value - 101) / (500 - 101);
  return 70 + ratio * 30;
}

/**
 * Create a percentage/decimal input control with slider in popover (Task 4)
 */
export function createPercentageInput(property: string, value: string): string {
  const numValue = parseFloat(value) || 0;
  const isOpacity = property === 'opacity';
  const max = isOpacity ? 1 : 10;
  const step = isOpacity ? 0.01 : 0.1;
  const displayValue = isOpacity ? (numValue * 100).toFixed(0) : numValue.toFixed(1);
  
  return `
    <div class="property-input-group percentage-input-group">
      <input type="number" 
             class="percentage-number-input" 
             data-property="${property}"
             data-slider-min="0"
             data-slider-max="${max}"
             data-slider-step="${step}"
             value="${numValue}" 
             step="${step}"
             min="0"
             max="${max}"
             title="${t('ui.inputs.clickForSlider')}" />
      <span class="percentage-unit">${isOpacity ? '%' : ''}</span>
      <div class="slider-popover" data-property="${property}" style="display: none;">
        <input type="range" 
               class="percentage-slider" 
               data-property="${property}"
               min="0" 
               max="${max}" 
               step="${step}"
               value="${numValue}" />
        <span class="slider-value-display">${displayValue}${isOpacity ? '%' : ''}</span>
      </div>
    </div>
  `;
}

/**
 * Task 4: Logarithmic scaling for sliders with large ranges
 * Handles negative values by treating 0 as the center point
 */
export function logarithmicScale(value: number, min: number, max: number, steps: number): number {
  // If range allows negative values, split scaling around 0
  if (min < 0 && max > 0) {
    if (value < 0) {
      // Negative side: scale from min to 0
      const absMin = Math.abs(min);
      const absValue = Math.abs(value);
      const ratio = Math.log(absValue + 1) / Math.log(absMin + 1);
      return ratio * 50; // 0-50 for negative range
    } else {
      // Positive side: scale from 0 to max
      const ratio = Math.log(value + 1) / Math.log(max + 1);
      return 50 + ratio * 50; // 50-100 for positive range
    }
  }
  
  // Standard logarithmic scaling for positive-only ranges
  const ratio = Math.log(value - min + 1) / Math.log(max - min + 1);
  return ratio * 100;
}

/**
 * Task 4: Inverse logarithmic scaling
 */
export function inverseLogarithmicScale(position: number, min: number, max: number, steps: number): number {
  if (min < 0 && max > 0) {
    if (position < 50) {
      // Negative side
      const absMin = Math.abs(min);
      const ratio = position / 50;
      const absValue = Math.pow(absMin + 1, ratio) - 1;
      return -absValue;
    } else {
      // Positive side
      const ratio = (position - 50) / 50;
      return Math.pow(max + 1, ratio) - 1;
    }
  }
  
  // Standard inverse
  const ratio = position / 100;
  return Math.pow(max - min + 1, ratio) - 1 + min;
}
