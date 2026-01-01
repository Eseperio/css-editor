/**
 * Property groups for the common properties panel
 */
export interface PropertyGroup {
  name: string;
  properties: string[];
  dependsOn?: PropertyDependency;  // Task 12: Optional dependency
}

/**
 * Task 12: Property dependency configuration
 */
export interface PropertyDependency {
  property: string;        // The property to check (e.g., 'display')
  values: string[];        // Values that activate this group (e.g., ['flex'])
  warning: string;         // Warning message when dependency not met
}

/**
 * Spacing properties that should have expandable controls
 */
export interface SpacingProperty {
  general: string;
  sides: string[];
}

/**
 * Compound property definition - properties that have multiple sub-properties
 * e.g., border has width, style, and color
 */
export interface CompoundProperty {
  general: string;           // The general property name (e.g., 'border')
  subProperties: string[];   // Sub-properties for the general case (e.g., ['border-width', 'border-style', 'border-color'])
  sides: {                   // Side-specific configurations
    name: string;            // Side name (e.g., 'top', 'right', 'bottom', 'left')
    property: string;        // The compound property for this side (e.g., 'border-top')
    subProperties: string[]; // Sub-properties for this side (e.g., ['border-top-width', 'border-top-style', 'border-top-color'])
  }[];
}

/**
 * Multi-value property definition - properties that can have multiple values
 * e.g., box-shadow can have multiple shadows
 */
export interface MultiValueProperty {
  property: string;          // The property name (e.g., 'box-shadow')
  components: {              // Components that make up each value
    name: string;            // Component name (e.g., 'x', 'y', 'blur', 'spread')
    type: 'size' | 'color' | 'select';  // Input type
    options?: string[];      // Options for select type
    defaultValue?: string;   // Default value
  }[];
}

export const SPACING_PROPERTIES: SpacingProperty[] = [
  {
    general: 'margin',
    sides: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']
  },
  {
    general: 'padding',
    sides: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']
  },
  {
    general: 'border-radius',
    sides: ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']
  }
];

/**
 * Compound properties that need special handling for side-specific configurations
 */
export const COMPOUND_PROPERTIES: CompoundProperty[] = [
  {
    general: 'border',
    subProperties: ['border-width', 'border-style', 'border-color'],
    sides: [
      {
        name: 'top',
        property: 'border-top',
        subProperties: ['border-top-width', 'border-top-style', 'border-top-color']
      },
      {
        name: 'right',
        property: 'border-right',
        subProperties: ['border-right-width', 'border-right-style', 'border-right-color']
      },
      {
        name: 'bottom',
        property: 'border-bottom',
        subProperties: ['border-bottom-width', 'border-bottom-style', 'border-bottom-color']
      },
      {
        name: 'left',
        property: 'border-left',
        subProperties: ['border-left-width', 'border-left-style', 'border-left-color']
      }
    ]
  }
];

/**
 * Multi-value properties that can have multiple instances
 */
export const MULTI_VALUE_PROPERTIES: MultiValueProperty[] = [
  {
    property: 'box-shadow',
    components: [
      { name: 'x', type: 'size', defaultValue: '0px' },
      { name: 'y', type: 'size', defaultValue: '0px' },
      { name: 'blur', type: 'size', defaultValue: '0px' },
      { name: 'spread', type: 'size', defaultValue: '0px' },
      { name: 'color', type: 'color', defaultValue: 'rgba(0, 0, 0, 0.5)' },
      { name: 'inset', type: 'select', options: ['', 'inset'], defaultValue: '' }
    ]
  }
];

export const PROPERTY_GROUPS: PropertyGroup[] = [
  {
    name: 'Spacing',
    properties: [
      'margin',
      'padding'
    ]
  },
  {
    name: 'Border',
    properties: [
      'border',
      'border-radius'
    ]
  },
  {
    name: 'Shadow',
    properties: [
      'box-shadow'
    ]
  },
  {
    name: 'Size',
    properties: [
      'width',
      'height',
      'min-width',   // Task 11: Added min/max width/height
      'max-width',
      'min-height',
      'max-height'
    ]
  },
  {
    name: 'Typography',
    properties: [
      'color',
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'text-align',
      'line-height',       // Task 11: Added useful text properties
      'text-decoration',
      'text-transform',
      'letter-spacing',
      'word-spacing'
    ]
  },
  {
    name: 'Layout',
    properties: [
      'display',
      'position',
      'top',              // Task 11: Added position properties
      'right',
      'bottom',
      'left',
      'z-index',
      'overflow',
      'float',
      'clear'
    ]
  },
  {
    name: 'Flexbox',      // Task 11 & 12: New group for flex properties
    properties: [
      'flex-direction',
      'flex-wrap',
      'justify-content',
      'align-items',
      'align-content',
      'gap',
      'flex',
      'flex-grow',
      'flex-shrink',
      'flex-basis',
      'align-self',
      'order'
    ],
    dependsOn: {         // Task 12: Flexbox properties depend on display: flex
      property: 'display',
      values: ['flex', 'inline-flex'],
      warning: 'This property only applies when display is flex or inline-flex'
    }
  },
  {
    name: 'Grid',         // Task 11 & 12: New group for grid properties
    properties: [
      'grid-template-columns',
      'grid-template-rows',
      'grid-template-areas',
      'grid-column',
      'grid-row',
      'grid-area',
      'grid-gap',
      'justify-items'
    ],
    dependsOn: {         // Task 12: Grid properties depend on display: grid
      property: 'display',
      values: ['grid', 'inline-grid'],
      warning: 'This property only applies when display is grid or inline-grid'
    }
  },
  {
    name: 'Background',
    properties: [
      'background',
      'background-color',
      'background-image',
      'background-repeat',
      'background-position',
      'background-size',
      'background-attachment',
      'background-clip'
    ]
  },
  {
    name: 'Effects',
    properties: [
      'opacity',
      'filter',
      'transform',        // Task 11: Added transform, transition, cursor
      'transition',
      'cursor',
      'visibility'
    ]
  }
];

/**
 * Common CSS properties that should be shown by default
 * Derived from PROPERTY_GROUPS to maintain a single source of truth
 */
export const COMMON_PROPERTIES = (() => {
  const allProperties: string[] = [];
  PROPERTY_GROUPS.forEach(group => {
    allProperties.push(...group.properties);
  });
  return allProperties;
})();

/**
 * CSS Properties grouped by category (for advanced settings)
 */
export const CSS_PROPERTIES = {
  layout: [
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'float', 'clear', 'z-index', 'overflow', 'overflow-x', 'overflow-y'
  ],
  box: [
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'box-sizing'
  ],
  border: [
    'border', 'border-width', 'border-style', 'border-color', 'border-radius',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-left-radius', 'border-top-right-radius', 
    'border-bottom-right-radius', 'border-bottom-left-radius'
  ],
  background: [
    'background', 'background-color', 'background-image', 'background-repeat',
    'background-position', 'background-size', 'background-attachment', 'background-clip'
  ],
  text: [
    'color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'word-spacing', 'text-align',
    'text-decoration', 'text-transform', 'text-indent', 'text-shadow',
    'white-space', 'word-wrap', 'word-break'
  ],
  flex: [
    'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
    'justify-content', 'align-items', 'align-content', 'align-self', 'order', 'gap'
  ],
  grid: [
    'grid', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
    'grid-column', 'grid-row', 'grid-area', 'grid-gap', 'grid-column-gap', 'grid-row-gap'
  ],
  effects: [
    'opacity', 'box-shadow', 'filter', 'transform', 'transition', 'animation',
    'cursor', 'pointer-events', 'visibility'
  ]
};

/**
 * Cached list of advanced properties (computed once)
 */
const ADVANCED_PROPERTIES_CACHE = (() => {
  const allProperties: string[] = [];
  Object.values(CSS_PROPERTIES).forEach(props => {
    allProperties.push(...props);
  });
  
  // Remove duplicates and filter out common properties
  return [...new Set(allProperties)].filter(prop => !COMMON_PROPERTIES.includes(prop));
})();

/**
 * Get all available properties (excluding common ones)
 */
export function getAdvancedProperties(): string[] {
  return ADVANCED_PROPERTIES_CACHE;
}

/**
 * Get common values for a CSS property
 */
export function getPropertyValues(property: string): string[] {
  const commonValues: { [key: string]: string[] } = {
    'display': ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'],
    'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    'text-align': ['left', 'center', 'right', 'justify'],
    'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    'font-style': ['normal', 'italic', 'oblique'],
    'font-family': ['Arial, sans-serif', 'Helvetica, sans-serif', 'Times New Roman, serif', 'Georgia, serif', 'Courier New, monospace', 'Monaco, monospace', 'system-ui, sans-serif'],
    'text-decoration': ['none', 'underline', 'overline', 'line-through'],
    'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
    'overflow': ['visible', 'hidden', 'scroll', 'auto'],
    'cursor': ['auto', 'pointer', 'default', 'move', 'text', 'wait', 'help', 'not-allowed'],
    'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
    'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
    'align-items': ['flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
    'float': ['none', 'left', 'right'],
    'clear': ['none', 'left', 'right', 'both'],
    'border-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
    'border-top-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
    'border-right-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
    'border-bottom-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
    'border-left-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
    'background-repeat': ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'],
    'background-size': ['auto', 'cover', 'contain'],
    'background-attachment': ['scroll', 'fixed', 'local'],
    'background-position': ['left top', 'left center', 'left bottom', 'right top', 'right center', 'right bottom', 'center top', 'center center', 'center bottom'],
    'background-clip': ['border-box', 'padding-box', 'content-box', 'text']
  };

  return commonValues[property] || [];
}
