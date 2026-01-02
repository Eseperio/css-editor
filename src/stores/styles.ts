import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';

/**
 * Store for dynamic CSS styles management
 */

export interface StylesState {
  generatedCSS: string;
  styleElement: HTMLStyleElement | null;
}

const createStylesStore = (): Writable<StylesState> & {
  updateCSS: (css: string) => void;
  initStyleElement: () => void;
  getGeneratedCSS: () => string;
} => {
  const { subscribe, set, update } = writable<StylesState>({
    generatedCSS: '',
    styleElement: null
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
          const styleEl = document.createElement('style');
          styleEl.id = 'css-editor-dynamic-styles';
          document.head.appendChild(styleEl);
          return { ...state, styleElement: styleEl };
        }
        return state;
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
export const generateCSS = (
  allElementChanges: Map<string, { styles: Map<string, string>, modifiedProperties: Set<string> }>,
  propertyMediaQueries?: Map<string, Map<string, string>>
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
      const mediaQuery = getMediaQuery(mediaContext);
      css += `${mediaQuery} {\n${styles.map(s => '  ' + s.replace(/\n/g, '\n  ')).join('\n\n')}\n}\n\n`;
    }
  });
  
  return css.trim();
};

/**
 * Get media query string for viewport mode
 */
const getMediaQuery = (mode: string): string => {
  switch (mode) {
    case 'phone':
      return '@media (max-width: 480px)';
    case 'tablet':
      return '@media (max-width: 768px)';
    case 'desktop':
    default:
      return '@media (min-width: 769px)';
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
