import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { CSS_PROPERTIES } from '../css-properties';

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
  editorState.update(state => ({ ...state, currentSelector: selector }));
};

export const setCurrentElement = (element: Element | null) => {
  editorState.update(state => ({ ...state, currentElement: element }));
};

export const setActiveElement = (selector: string, element: Element | null) => {
  editorState.update(state => {
    const allElementChanges = new Map(state.allElementChanges);
    saveElementChanges(state, allElementChanges);

    const currentStyles = element ? loadComputedStyles(element) : new Map();
    let modifiedProperties = new Set<string>();

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

    return {
      ...state,
      currentSelector: selector,
      currentElement: element,
      currentStyles,
      modifiedProperties,
      advancedProperties: new Set(),
      allElementChanges,
    };
  });
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
    cssVariables: new Map(),
    propertyVariables: new Map(),
  }));
};
