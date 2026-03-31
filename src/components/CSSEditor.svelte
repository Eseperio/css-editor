<script lang="ts">
  import { onMount } from 'svelte';
  import { setupI18n } from '../i18n/setup';
  import EditorPanel from './EditorPanel.svelte';
  import { showPanel, hidePanel } from '../stores/ui';
  import { setActiveElement, clearEditorState } from '../stores/editorState';
  
  // Props - matches CSSEditorOptions interface
  export let loadEndpoint: string | undefined = undefined;
  export let saveEndpoint: string | undefined = undefined;
  export let onSave: ((css: string) => void) | undefined = undefined;
  export let onLoad: (() => Promise<string>) | undefined = undefined;
  export let onChange: ((css: string) => void) | undefined = undefined;
  export let stylesUrl: string | undefined = undefined;
  export let fontFamilies: string[] | undefined = undefined;
  export let locale: string | undefined = undefined;
  export let iframeMode: {
    url: string;
    viewportSizes?: {
      desktop?: number;
      tablet?: number;
      phone?: number;
    };
  } | undefined = undefined;
  export let buttons: {
    save?: { label?: string; visible?: boolean };
    load?: { label?: string; visible?: boolean };
    export?: { label?: string; visible?: boolean };
    clear?: { label?: string; visible?: boolean };
  } | undefined = undefined;
  export let showGeneratedCSS: boolean = true;
  
  // Prepare options object for child components
  $: options = {
    loadEndpoint,
    saveEndpoint,
    onSave,
    onLoad,
    onChange,
    stylesUrl,
    fontFamilies,
    locale,
    buttons,
    showGeneratedCSS,
    iframeMode
  };
  
  // Initialize i18n on mount
  onMount(() => {
    setupI18n();
  });
  
  /**
   * Public methods that can be called via component instance
   */
  export function show(selector: string, element: Element | null = null) {
    setActiveElement(selector, element);
    showPanel();
  }
  
  export function hide() {
    hidePanel();
  }
  
  export function clear() {
    clearEditorState();
  }
</script>

<EditorPanel {options} />

<style>
  /* No global styles needed here */
</style>
