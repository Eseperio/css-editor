import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

/**
 * Store for UI state (theme, viewport, collapsed groups, etc.)
 */

export type ViewportMode = 'desktop' | 'tablet' | 'phone';
export type AnchorPosition = 'right' | 'left' | 'top' | 'bottom';
export type Theme = 'light' | 'dark';

export interface UIState {
  theme: Theme;
  viewportMode: ViewportMode;
  anchorPosition: AnchorPosition;
  collapsedGroups: Set<string>;
  expandedSpacing: Map<string, boolean>;
  expandedCompound: Map<string, Set<string>>;
  selectorConfigExpanded: boolean;
  variablesPanelVisible: boolean;
  highlightOverlays: HTMLElement[];
  isResizing: boolean;
  panelVisible: boolean;
}

// Initialize UI state
const createUIState = (): Writable<UIState> => {
  // Import PROPERTY_GROUPS to set initial collapsed state
  // We'll initialize with empty set and let component set it
  const initialState: UIState = {
    theme: 'light',
    viewportMode: 'desktop',
    anchorPosition: 'right',
    collapsedGroups: new Set(),
    expandedSpacing: new Map(),
    expandedCompound: new Map(),
    selectorConfigExpanded: false,
    variablesPanelVisible: false,
    highlightOverlays: [],
    isResizing: false,
    panelVisible: false
  };

  return writable(initialState);
};

export const uiState = createUIState();

// Derived stores
export const theme: Readable<Theme> = derived(
  uiState,
  $state => $state.theme
);

export const viewportMode: Readable<ViewportMode> = derived(
  uiState,
  $state => $state.viewportMode
);

export const anchorPosition: Readable<AnchorPosition> = derived(
  uiState,
  $state => $state.anchorPosition
);

export const panelVisible: Readable<boolean> = derived(
  uiState,
  $state => $state.panelVisible
);

// Helper functions to update UI state
export const setTheme = (newTheme: Theme) => {
  uiState.update(state => ({ ...state, theme: newTheme }));
};

export const toggleTheme = () => {
  uiState.update(state => ({ 
    ...state, 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  }));
};

export const setViewportMode = (mode: ViewportMode) => {
  uiState.update(state => ({ ...state, viewportMode: mode }));
  // Dispatch custom event for viewport mode change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('viewportModeChange', { detail: { mode } }));
  }
};

export const setAnchorPosition = (position: AnchorPosition) => {
  uiState.update(state => ({ ...state, anchorPosition: position }));
};

export const toggleGroupCollapse = (groupName: string) => {
  uiState.update(state => {
    const newCollapsed = new Set(state.collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    return { ...state, collapsedGroups: newCollapsed };
  });
};

export const isGroupCollapsed = (groupName: string, state: UIState): boolean => {
  return state.collapsedGroups.has(groupName);
};

export const toggleSpacingExpanded = (property: string) => {
  uiState.update(state => {
    const newExpanded = new Map(state.expandedSpacing);
    newExpanded.set(property, !newExpanded.get(property));
    return { ...state, expandedSpacing: newExpanded };
  });
};

export const toggleSelectorConfig = () => {
  uiState.update(state => ({ 
    ...state, 
    selectorConfigExpanded: !state.selectorConfigExpanded 
  }));
};

export const toggleVariablesPanel = () => {
  uiState.update(state => ({ 
    ...state, 
    variablesPanelVisible: !state.variablesPanelVisible 
  }));
};

export const showPanel = () => {
  uiState.update(state => ({ ...state, panelVisible: true }));
};

export const hidePanel = () => {
  uiState.update(state => ({ ...state, panelVisible: false }));
};

export const setResizing = (isResizing: boolean) => {
  uiState.update(state => ({ ...state, isResizing }));
};

export const addHighlightOverlay = (overlay: HTMLElement) => {
  uiState.update(state => ({
    ...state,
    highlightOverlays: [...state.highlightOverlays, overlay]
  }));
};

export const clearHighlightOverlays = () => {
  uiState.update(state => {
    // Remove all overlays from DOM
    state.highlightOverlays.forEach(overlay => overlay.remove());
    return { ...state, highlightOverlays: [] };
  });
};
