import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { CSS_PROPERTIES } from '../css-properties';
import { stylesStore } from './styles';

/**
 * Store for editor state (selector, styles, element)
 */

export interface ElementStyles {
  styles: Map<string, string>;
  modifiedProperties: Set<string>;
}

export interface EditorState {
  currentSelector: string;
  currentElement: Element | null;
  currentStyles: Map<string, string>;
  modifiedProperties: Set<string>;
  advancedProperties: Set<string>;
  allElementChanges: Map<string, ElementStyles>;
  selectorParts: SelectorPart[];
  propertyMediaQueries: Map<string, Map<string, string>>;
  cssVariables: Map<string, string>;
  propertyVariables: Map<string, Map<string, string>>;
  targetDocument: Document;
}

export type MediaQueryContext = 'all' | 'desktop' | 'tablet' | 'phone';

export interface SelectorPart {
  selector: string;
  combinator: '>' | ' ';
  positionType: 'all' | 'even' | 'odd' | 'position';
  positionValue?: number;
  siblingCount?: number;
}

// Initialize editor state
const createEditorState = (): Writable<EditorState> => {
  const initialState: EditorState = {
    currentSelector: '',
    currentElement: null,
    currentStyles: new Map(),
    modifiedProperties: new Set(),
    advancedProperties: new Set(),
    allElementChanges: new Map(),
    selectorParts: [],
    propertyMediaQueries: new Map(),
    cssVariables: new Map(),
    propertyVariables: new Map(),
    targetDocument: typeof document !== 'undefined' ? document : null as any
  };

  return writable(initialState);
};

export const editorState = createEditorState();

const ALL_PROPERTIES: string[] = (() => {
  const props: string[] = [];
  Object.values(CSS_PROPERTIES).forEach(group => {
    props.push(...group);
  });
  return [...new Set(props)];
})();

const loadComputedStyles = (element: Element): Map<string, string> => {
  const styles = new Map<string, string>();
  const view = element.ownerDocument?.defaultView || window;
  const computed = view.getComputedStyle(element);

  ALL_PROPERTIES.forEach((prop) => {
    const value = computed.getPropertyValue(prop);
    if (value) {
      styles.set(prop, value);
    }
  });

  return styles;
};

const normalizeVariableName = (name: string): string => {
  return name.startsWith('--') ? name : `--${name}`;
};

const updateVariableStylesheet = (doc: Document, name: string, value: string) => {
  const styleId = `css-var-${name.replace(/[^a-z0-9]/gi, '-')}`;
  let style = doc.getElementById(styleId) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = styleId;
    doc.head.appendChild(style);
  }
  style.textContent = `:root { ${name}: ${value}; }`;
};

const removeVariableStylesheet = (doc: Document, name: string) => {
  const styleId = `css-var-${name.replace(/[^a-z0-9]/gi, '-')}`;
  const style = doc.getElementById(styleId);
  if (style) {
    style.remove();
  }
};

export const detectCSSVariables = (doc: Document = document) => {
  const detected = new Map<string, string>();
  const sheets = Array.from(doc.styleSheets);

  sheets.forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach((rule) => {
        if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
          const style = rule.style;
          for (let i = 0; i < style.length; i += 1) {
            const prop = style[i];
            if (prop.startsWith('--')) {
              const value = style.getPropertyValue(prop).trim();
              detected.set(prop, value);
            }
          }
        }
      });
    } catch {
      // Ignore inaccessible stylesheets.
    }
  });

  editorState.update((state) => ({
    ...state,
    cssVariables: detected,
  }));
};

const saveElementChanges = (
  state: EditorState,
  allElementChanges: Map<string, ElementStyles>,
): void => {
  if (state.currentSelector && state.modifiedProperties.size > 0) {
    allElementChanges.set(state.currentSelector, {
      styles: new Map(state.currentStyles),
      modifiedProperties: new Set(state.modifiedProperties),
    });
  }
};

// Derived stores for specific parts of state
export const currentSelector: Readable<string> = derived(
  editorState,
  $state => $state.currentSelector
);

export const currentElement: Readable<Element | null> = derived(
  editorState,
  $state => $state.currentElement
);

export const currentStyles: Readable<Map<string, string>> = derived(
  editorState,
  $state => $state.currentStyles
);

export const modifiedProperties: Readable<Set<string>> = derived(
  editorState,
  $state => $state.modifiedProperties
);

// Helper functions to update state
export const setCurrentSelector = (selector: string) => {
  editorState.update(state => {
    if (state.currentSelector === selector) {
      return state;
    }
    const allElementChanges = new Map(state.allElementChanges);
    if (state.currentSelector && allElementChanges.has(state.currentSelector)) {
      const previous = allElementChanges.get(state.currentSelector);
      allElementChanges.delete(state.currentSelector);
      if (previous) {
        allElementChanges.set(selector, previous);
      }
    }
    return { ...state, currentSelector: selector, allElementChanges };
  });
};

export const setCurrentElement = (element: Element | null) => {
  editorState.update(state => ({ ...state, currentElement: element }));
};

export const setSelectorParts = (parts: SelectorPart[]) => {
  editorState.update(state => ({ ...state, selectorParts: parts }));
};

export const setActiveElement = (selector: string, element: Element | null) => {
  editorState.update(state => {
    const allElementChanges = new Map(state.allElementChanges);
    saveElementChanges(state, allElementChanges);

    const currentStyles = element ? loadComputedStyles(element) : new Map();
    let modifiedProperties = new Set<string>();
    const targetDocument = element?.ownerDocument || state.targetDocument || document;

    if (selector) {
      const previousChanges = allElementChanges.get(selector);
      if (previousChanges) {
        modifiedProperties = new Set(previousChanges.modifiedProperties);
        previousChanges.modifiedProperties.forEach((prop) => {
          const value = previousChanges.styles.get(prop);
          if (value) {
            currentStyles.set(prop, value);
          }
        });
      }
    }

    stylesStore.setTargetDocument(targetDocument);
    detectCSSVariables(targetDocument);

    return {
      ...state,
      currentSelector: selector,
      currentElement: element,
      currentStyles,
      modifiedProperties,
      advancedProperties: new Set(),
      allElementChanges,
      targetDocument,
    };
  });
};

export const setTargetDocument = (doc: Document) => {
  editorState.update(state => ({ ...state, targetDocument: doc }));
  stylesStore.setTargetDocument(doc);
  detectCSSVariables(doc);
};

export const updateStyle = (property: string, value: string) => {
  editorState.update(state => {
    const newStyles = new Map(state.currentStyles);
    newStyles.set(property, value);
    const newModified = new Set(state.modifiedProperties);
    newModified.add(property);
    const allElementChanges = new Map(state.allElementChanges);
    if (state.currentSelector) {
      allElementChanges.set(state.currentSelector, {
        styles: new Map(newStyles),
        modifiedProperties: new Set(newModified),
      });
    }
    return { 
      ...state, 
      currentStyles: newStyles,
      modifiedProperties: newModified,
      allElementChanges,
    };
  });
};

export const removeStyle = (property: string) => {
  editorState.update(state => {
    const newStyles = new Map(state.currentStyles);
    newStyles.delete(property);
    const newModified = new Set(state.modifiedProperties);
    newModified.delete(property);
    const allElementChanges = new Map(state.allElementChanges);
    if (state.currentSelector) {
      if (newModified.size > 0) {
        allElementChanges.set(state.currentSelector, {
          styles: new Map(newStyles),
          modifiedProperties: new Set(newModified),
        });
      } else {
        allElementChanges.delete(state.currentSelector);
      }
    }
    return { 
      ...state, 
      currentStyles: newStyles,
      modifiedProperties: newModified,
      allElementChanges,
    };
  });
};

export const addAdvancedProperty = (property: string) => {
  editorState.update(state => {
    const newAdvanced = new Set(state.advancedProperties);
    newAdvanced.add(property);
    return { ...state, advancedProperties: newAdvanced };
  });
};

export const removeAdvancedProperty = (property: string) => {
  editorState.update(state => {
    const newAdvanced = new Set(state.advancedProperties);
    newAdvanced.delete(property);
    return { ...state, advancedProperties: newAdvanced };
  });
};

export const setPropertyMediaQueryContext = (property: string, context: MediaQueryContext) => {
  editorState.update(state => {
    const selector = state.currentSelector;
    if (!selector) return state;
    const map = new Map(state.propertyMediaQueries);
    const selectorMQs = new Map(map.get(selector) || []);
    selectorMQs.set(property, context);
    map.set(selector, selectorMQs);
    return { ...state, propertyMediaQueries: map };
  });
};

export const getPropertyMediaQueryContext = (property: string, state: EditorState): MediaQueryContext => {
  const selectorMQs = state.propertyMediaQueries.get(state.currentSelector);
  if (!selectorMQs) return 'all';
  return (selectorMQs.get(property) as MediaQueryContext) || 'all';
};

export const setPropertyVariable = (property: string, variableName: string) => {
  editorState.update(state => {
    const selector = state.currentSelector;
    if (!selector) return state;
    const selectorVars = new Map(state.propertyVariables.get(selector) || []);
    const name = normalizeVariableName(variableName);
    selectorVars.set(property, name);
    const propertyVariables = new Map(state.propertyVariables);
    propertyVariables.set(selector, selectorVars);

    const varValue = state.cssVariables.get(name);
    const currentStyles = new Map(state.currentStyles);
    const modifiedProperties = new Set(state.modifiedProperties);
    if (varValue) {
      currentStyles.set(property, `var(${name})`);
      modifiedProperties.add(property);
    }

    const allElementChanges = new Map(state.allElementChanges);
    if (selector) {
      allElementChanges.set(selector, {
        styles: new Map(currentStyles),
        modifiedProperties: new Set(modifiedProperties),
      });
    }

    return {
      ...state,
      propertyVariables,
      currentStyles,
      modifiedProperties,
      allElementChanges,
    };
  });
};

export const removePropertyVariable = (property: string) => {
  editorState.update(state => {
    const selector = state.currentSelector;
    if (!selector) return state;
    const selectorVars = new Map(state.propertyVariables.get(selector) || []);
    const varName = selectorVars.get(property);
    selectorVars.delete(property);
    const propertyVariables = new Map(state.propertyVariables);
    propertyVariables.set(selector, selectorVars);

    const currentStyles = new Map(state.currentStyles);
    if (varName) {
      const computedValue = state.cssVariables.get(varName);
      if (computedValue) {
        currentStyles.set(property, computedValue);
      }
    }

    const allElementChanges = new Map(state.allElementChanges);
    if (selector) {
      allElementChanges.set(selector, {
        styles: new Map(currentStyles),
        modifiedProperties: new Set(state.modifiedProperties),
      });
    }

    return {
      ...state,
      propertyVariables,
      currentStyles,
      allElementChanges,
    };
  });
};

export const createCSSVariable = (name: string, value: string) => {
  editorState.update(state => {
    const doc = state.targetDocument || document;
    const varName = normalizeVariableName(name);
    const cssVariables = new Map(state.cssVariables);
    cssVariables.set(varName, value);
    updateVariableStylesheet(doc, varName, value);
    return { ...state, cssVariables };
  });
};

export const updateCSSVariable = (name: string, value: string) => {
  editorState.update(state => {
    const doc = state.targetDocument || document;
    const varName = normalizeVariableName(name);
    const cssVariables = new Map(state.cssVariables);
    cssVariables.set(varName, value);
    updateVariableStylesheet(doc, varName, value);
    return { ...state, cssVariables };
  });
};

export const deleteCSSVariable = (name: string) => {
  editorState.update(state => {
    const doc = state.targetDocument || document;
    const varName = normalizeVariableName(name);
    const cssVariables = new Map(state.cssVariables);
    cssVariables.delete(varName);
    removeVariableStylesheet(doc, varName);
    return { ...state, cssVariables };
  });
};

export const clearEditorState = () => {
  editorState.update(state => ({
    ...state,
    currentSelector: '',
    currentElement: null,
    currentStyles: new Map(),
    modifiedProperties: new Set(),
    advancedProperties: new Set(),
    allElementChanges: new Map(),
    propertyMediaQueries: new Map(),
    cssVariables: new Map(state.cssVariables),
    propertyVariables: new Map(),
  }));
};
