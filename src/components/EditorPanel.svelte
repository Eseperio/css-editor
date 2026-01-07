<script lang="ts">
  import { onMount } from 'svelte';
  import { _, setLocale as setSvelteI18nLocale } from '../i18n/setup';
  import { editorState, clearEditorState } from '../stores/editorState';
  import {
    uiState,
    panelVisible,
    hidePanel,
    setTheme,
    initializeCollapsedGroups,
  } from '../stores/ui';
  import { stylesStore, generateCSS, applyCSS } from '../stores/styles';
  import { PROPERTY_GROUPS } from '../css-properties';
  import PanelHeader from './PanelHeader.svelte';
  import SelectorEditor from './SelectorEditor.svelte';
  import PropertyGroups from './PropertyGroups.svelte';

  export let options: {
    onSave?: (css: string) => void;
    onLoad?: () => Promise<string>;
    onChange?: (css: string) => void;
    saveEndpoint?: string;
    loadEndpoint?: string;
    locale?: string;
    fontFamilies?: string[];
    buttons?: {
      save?: { label?: string; visible?: boolean };
      load?: { label?: string; visible?: boolean };
      export?: { label?: string; visible?: boolean };
      clear?: { label?: string; visible?: boolean };
    };
    showGeneratedCSS?: boolean;
    iframeMode?: {
      url: string;
      viewportSizes?: {
        desktop?: number;
        tablet?: number;
        phone?: number;
      };
    };
  } = {};

  let panelEl: HTMLElement | null = null;
  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartWidth = 0;
  let resizeStartHeight = 0;
  let boundResizeMove: ((event: MouseEvent) => void) | null = null;
  let boundResizeEnd: (() => void) | null = null;

  onMount(() => {
    if (options.locale) {
      setSvelteI18nLocale(options.locale);
    }

    const savedTheme = typeof window !== 'undefined'
      ? (localStorage.getItem('css-editor-theme') as 'light' | 'dark' | null)
      : null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    stylesStore.initStyleElement();

    initializeCollapsedGroups([...PROPERTY_GROUPS.map((group) => group.name), 'css-variables']);
  });

  $: {
    const css = generateCSS(
      $editorState.allElementChanges,
      $editorState.propertyMediaQueries,
      options.iframeMode?.viewportSizes,
    );
    applyCSS(css);
    if (options.onChange) {
      options.onChange(css);
    }
  }

  async function handleSave() {
    const css = generateCSS(
      $editorState.allElementChanges,
      $editorState.propertyMediaQueries,
      options.iframeMode?.viewportSizes,
    );

    if (options.saveEndpoint) {
      try {
        const response = await fetch(options.saveEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ css }),
        });
        if (response.ok) {
          alert($_('ui.messages.cssSaved'));
        } else {
          alert($_('ui.messages.failedSave'));
        }
      } catch {
        alert($_('ui.messages.errorSave'));
      }
    }

    if (options.onSave) {
      options.onSave(css);
    }
  }

  async function handleLoad() {
    let css = '';

    if (options.loadEndpoint) {
      try {
        const response = await fetch(options.loadEndpoint);
        if (response.ok) {
          css = await response.text();
        }
      } catch {
        // ignore load errors
      }
    }

    if (options.onLoad) {
      try {
        css = await options.onLoad();
      } catch {
        // ignore custom load errors
      }
    }

    if (css) {
      applyCSS(css);
      alert($_('ui.messages.cssLoaded'));
    }
  }

  function handleExport() {
    const css = generateCSS(
      $editorState.allElementChanges,
      $editorState.propertyMediaQueries,
      options.iframeMode?.viewportSizes,
    );

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(css)
        .then(() => {
          alert($_('ui.messages.cssCopied'));
        })
        .catch(() => showCSSModal(css));
    } else {
      showCSSModal(css);
    }
  }

  function showCSSModal(css: string) {
    alert($_('ui.messages.copyManually') + '\n\n' + css);
  }

  function handleClear() {
    if (confirm($_('ui.messages.confirmClear'))) {
      clearEditorState();
      applyCSS('');
    }
  }

  function handleClose() {
    hidePanel();
  }

  function handleResizeStart(event: MouseEvent) {
    if (!panelEl) return;
    event.preventDefault();
    isResizing = true;
    resizeStartX = event.clientX;
    resizeStartY = event.clientY;

    const rect = panelEl.getBoundingClientRect();
    resizeStartWidth = rect.width;
    resizeStartHeight = rect.height;

    boundResizeMove = handleResizeMove;
    boundResizeEnd = handleResizeEnd;

    document.addEventListener('mousemove', boundResizeMove);
    document.addEventListener('mouseup', boundResizeEnd);

    panelEl.classList.add('resizing');
  }

  function handleResizeMove(event: MouseEvent) {
    if (!isResizing || !panelEl) return;

    const maxWidth = window.innerWidth * 0.5;
    const minWidth = 350;
    const maxHeight = window.innerHeight * 0.5;
    const minHeight = 300;

    if ($uiState.anchorPosition === 'right') {
      const deltaX = resizeStartX - event.clientX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartWidth + deltaX));
      panelEl.style.width = `${newWidth}px`;
    } else if ($uiState.anchorPosition === 'left') {
      const deltaX = event.clientX - resizeStartX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStartWidth + deltaX));
      panelEl.style.width = `${newWidth}px`;
    } else if ($uiState.anchorPosition === 'bottom') {
      const deltaY = resizeStartY - event.clientY;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStartHeight + deltaY));
      panelEl.style.height = `${newHeight}px`;
    } else if ($uiState.anchorPosition === 'top') {
      const deltaY = event.clientY - resizeStartY;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStartHeight + deltaY));
      panelEl.style.height = `${newHeight}px`;
    }
  }

  function handleResizeEnd() {
    isResizing = false;
    if (boundResizeMove) {
      document.removeEventListener('mousemove', boundResizeMove);
      boundResizeMove = null;
    }
    if (boundResizeEnd) {
      document.removeEventListener('mouseup', boundResizeEnd);
      boundResizeEnd = null;
    }
    panelEl?.classList.remove('resizing');
  }
</script>

{#if $panelVisible}
  <div
    id="css-editor-panel"
    bind:this={panelEl}
    class:theme-dark={$uiState.theme === 'dark'}
    class:anchor-right={$uiState.anchorPosition === 'right'}
    class:anchor-left={$uiState.anchorPosition === 'left'}
    class:anchor-top={$uiState.anchorPosition === 'top'}
    class:anchor-bottom={$uiState.anchorPosition === 'bottom'}
  >
    <button
      class="resize-handle"
      type="button"
      aria-label="Resize panel"
      on:mousedown={handleResizeStart}
    ></button>

    <PanelHeader
      showViewportControls={Boolean(options.iframeMode)}
      onClose={handleClose}
    />

    <div class="css-editor-content">
      <div class="properties-grid">
        <SelectorEditor />
        <PropertyGroups fontFamilies={options.fontFamilies} />
      </div>
    </div>

    <div class="css-editor-footer">
      {#if options.buttons?.save?.visible !== false}
        <button class="css-editor-save" on:click={handleSave} type="button">
          {options.buttons?.save?.label || $_('ui.panel.saveCSS')}
        </button>
      {/if}

      {#if options.buttons?.load?.visible !== false && (options.onLoad || options.loadEndpoint)}
        <button class="css-editor-load" on:click={handleLoad} type="button">
          {options.buttons?.load?.label || $_('ui.panel.loadCSS')}
        </button>
      {/if}

      {#if options.buttons?.export?.visible !== false}
        <button class="css-editor-export" on:click={handleExport} type="button">
          {options.buttons?.export?.label || $_('ui.panel.exportCSS')}
        </button>
      {/if}

      {#if options.buttons?.clear?.visible !== false}
        <button class="css-editor-clear" on:click={handleClear} type="button">
          {options.buttons?.clear?.label || $_('ui.panel.clearChanges')}
        </button>
      {/if}
    </div>

    {#if options.showGeneratedCSS !== false}
      <div class="css-editor-preview">
        <h4>{$_('ui.panel.generatedCSS')}</h4>
        <pre class="css-output">{$stylesStore.generatedCSS || $_('ui.panel.noStyles')}</pre>
      </div>
    {/if}
  </div>
{/if}
