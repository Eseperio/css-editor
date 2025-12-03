/**
 * Property groups for the common properties panel
 */
export interface PropertyGroup {
  name: string;
  properties: string[];
}

export const PROPERTY_GROUPS: PropertyGroup[] = [
  {
    name: 'Spacing',
    properties: [
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left'
    ]
  },
  {
    name: 'Border',
    properties: [
      'border',
      'border-width',
      'border-style',
      'border-color',
      'border-radius'
    ]
  },
  {
    name: 'Size',
    properties: [
      'width',
      'height'
    ]
  },
  {
    name: 'Typography',
    properties: [
      'color',
      'font-size',
      'font-weight',
      'text-align'
    ]
  },
  {
    name: 'Layout',
    properties: [
      'display',
      'position'
    ]
  },
  {
    name: 'Effects',
    properties: [
      'background-color',
      'opacity'
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
    'text-decoration': ['none', 'underline', 'overline', 'line-through'],
    'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
    'overflow': ['visible', 'hidden', 'scroll', 'auto'],
    'cursor': ['auto', 'pointer', 'default', 'move', 'text', 'wait', 'help', 'not-allowed'],
    'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
    'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
    'align-items': ['flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
    'float': ['none', 'left', 'right'],
    'clear': ['none', 'left', 'right', 'both'],
    'border-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']
  };

  return commonValues[property] || [];
}
