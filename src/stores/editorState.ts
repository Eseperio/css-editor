import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

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

export const updateStyle = (property: string, value: string) => {
  editorState.update(state => {
    const newStyles = new Map(state.currentStyles);
    newStyles.set(property, value);
    const newModified = new Set(state.modifiedProperties);
    newModified.add(property);
    return { 
      ...state, 
      currentStyles: newStyles,
      modifiedProperties: newModified
    };
  });
};

export const removeStyle = (property: string) => {
  editorState.update(state => {
    const newStyles = new Map(state.currentStyles);
    newStyles.delete(property);
    const newModified = new Set(state.modifiedProperties);
    newModified.delete(property);
    return { 
      ...state, 
      currentStyles: newStyles,
      modifiedProperties: newModified
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

export const clearEditorState = () => {
  editorState.update(state => ({
    ...state,
    currentSelector: '',
    currentElement: null,
    currentStyles: new Map(),
    modifiedProperties: new Set(),
    advancedProperties: new Set()
  }));
};
