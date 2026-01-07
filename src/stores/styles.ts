import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';

/**
 * Store for dynamic CSS styles management
 */

export interface StylesState {
  generatedCSS: string;
  styleElement: HTMLStyleElement | null;
  targetDocument: Document | null;
}

const createStylesStore = (): Writable<StylesState> & {
  updateCSS: (css: string) => void;
  initStyleElement: () => void;
  setTargetDocument: (doc: Document) => void;
  getGeneratedCSS: () => string;
} => {
  const { subscribe, set, update } = writable<StylesState>({
    generatedCSS: '',
    styleElement: null,
    targetDocument: typeof document !== 'undefined' ? document : null
  });

  return {
    subscribe,
    set,
    update,
    
    // Initialize the style element in the DOM
    initStyleElement: () => {
      if (typeof document === 'undefined') return;
      
      update(state => {
        if (!state.styleElement) {
          const doc = state.targetDocument || document;
          const existing = doc.getElementById('css-editor-dynamic-styles') as HTMLStyleElement | null;
          const styleEl = existing || doc.createElement('style');
          styleEl.id = 'css-editor-dynamic-styles';
          if (!existing) {
            doc.head.appendChild(styleEl);
          }
          return { ...state, styleElement: styleEl, targetDocument: doc };
        }
        return state;
      });
    },

    setTargetDocument: (doc: Document) => {
      update(state => {
        const existing = doc.getElementById('css-editor-dynamic-styles') as HTMLStyleElement | null;
        const styleEl = existing || doc.createElement('style');
        styleEl.id = 'css-editor-dynamic-styles';
        if (!existing) {
          doc.head.appendChild(styleEl);
          if (state.styleElement?.textContent) {
            styleEl.textContent = state.styleElement.textContent;
          }
        }
        return { ...state, styleElement: styleEl, targetDocument: doc };
      });
    },
    
    // Update the CSS content
    updateCSS: (css: string) => {
      update(state => {
        if (state.styleElement) {
          state.styleElement.textContent = css;
        }
        return { ...state, generatedCSS: css };
      });
    },
    
    // Get current CSS using Svelte's get helper
    getGeneratedCSS: (): string => {
      return get({ subscribe }).generatedCSS;
    }
  };
};

export const stylesStore = createStylesStore();

/**
 * Generate CSS from element changes
 */
export interface ViewportSizes {
  desktop?: number;
  tablet?: number;
  phone?: number;
}

export const generateCSS = (
  allElementChanges: Map<string, { styles: Map<string, string>, modifiedProperties: Set<string> }>,
  propertyMediaQueries?: Map<string, Map<string, string>>,
  viewportSizes?: ViewportSizes
): string => {
  let css = '';
  
  // Group styles by media query context
  const mediaGroups: Map<string, Map<string, Map<string, string>>> = new Map();
  
  allElementChanges.forEach((data, selector) => {
    data.modifiedProperties.forEach(property => {
      const value = data.styles.get(property);
      if (value) {
        // Determine media query context
        let mediaContext = 'all';
        if (propertyMediaQueries) {
          const selectorMediaQueries = propertyMediaQueries.get(selector);
          if (selectorMediaQueries) {
            mediaContext = selectorMediaQueries.get(property) || 'all';
          }
        }
        
        // Initialize media group if needed
        if (!mediaGroups.has(mediaContext)) {
          mediaGroups.set(mediaContext, new Map());
        }
        
        const contextGroup = mediaGroups.get(mediaContext)!;
        if (!contextGroup.has(selector)) {
          contextGroup.set(selector, new Map());
        }
        
        contextGroup.get(selector)!.set(property, value);
      }
    });
  });
  
  // Generate CSS for each media context
  mediaGroups.forEach((selectors, mediaContext) => {
    const styles: string[] = [];
    
    selectors.forEach((properties, selector) => {
      const props = Array.from(properties.entries())
        .map(([prop, val]) => `  ${prop}: ${val};`)
        .join('\n');
      
      styles.push(`${selector} {\n${props}\n}`);
    });
    
    if (mediaContext === 'all') {
      css += styles.join('\n\n') + '\n\n';
    } else {
      // Add media query wrapper
      const mediaQuery = getMediaQuery(mediaContext, viewportSizes);
      css += `${mediaQuery} {\n${styles.map(s => '  ' + s.replace(/\n/g, '\n  ')).join('\n\n')}\n}\n\n`;
    }
  });
  
  return css.trim();
};

/**
 * Get media query string for viewport mode
 */
const getMediaQuery = (mode: string, viewportSizes?: ViewportSizes): string => {
  switch (mode) {
    case 'phone':
      return `@media (max-width: ${viewportSizes?.phone || 480}px)`;
    case 'tablet':
      return `@media (max-width: ${viewportSizes?.tablet || 768}px)`;
    case 'desktop':
    default:
      return `@media (min-width: ${viewportSizes?.desktop || 769}px)`;
  }
};

/**
 * Apply CSS to the page
 */
export const applyCSS = (css: string) => {
  stylesStore.updateCSS(css);
};

/**
 * Clear all CSS
 */
export const clearCSS = () => {
  stylesStore.updateCSS('');
};
