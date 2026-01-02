<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { _, setLocale as setSvelteI18nLocale } from '../i18n/setup';
  import { editorState, currentSelector, currentStyles, setCurrentSelector, updateStyle, removeStyle } from '../stores/editorState';
  import { uiState, showPanel, hidePanel, setTheme, toggleTheme, setAnchorPosition, panelVisible } from '../stores/ui';
  import { stylesStore, generateCSS, applyCSS } from '../stores/styles';
  import PropertyGroup from './PropertyGroup.svelte';
  import PropertyInput from './PropertyInput.svelte';
  import ColorInput from './ColorInput.svelte';
  import SizeInput from './SizeInput.svelte';
  import { PROPERTY_GROUPS, COMMON_PROPERTIES, type PropertyGroup as PropertyGroupType } from '../css-properties';
  
  // Props matching CSSEditorOptions
  export let options: {
    onSave?: (css: string) => void;
    onLoad?: () => Promise<string>;
    onChange?: (css: string) => void;
    locale?: string;
    buttons?: {
      save?: { label?: string; visible?: boolean };
      load?: { label?: string; visible?: boolean };
      export?: { label?: string; visible?: boolean };
      clear?: { label?: string; visible?: boolean };
    };
    showGeneratedCSS?: boolean;
  } = {};
  
  // Initialize i18n locale
  onMount(() => {
    if (options.locale) {
      setSvelteI18nLocale(options.locale);
    }
    
    // Initialize style element
    stylesStore.initStyleElement();
  });
  
  // Current selector value for input
  let selectorInput = '';
  
  $: selectorInput = $currentSelector;
  
  // Handle selector change
  function handleSelectorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setCurrentSelector(target.value);
  }
  
  // Handle property change
  function handlePropertyChange(event: CustomEvent) {
    const { property, value } = event.detail;
    updateStyle(property, value);
    regenerateCSS();
  }
  
  // Handle property remove
  function handlePropertyRemove(event: CustomEvent) {
    const { property } = event.detail;
    removeStyle(property);
    regenerateCSS();
  }
  
  // Regenerate CSS
  function regenerateCSS() {
    const css = generateCSS($editorState.allElementChanges, $editorState.propertyMediaQueries);
    applyCSS(css);
    
    if (options.onChange) {
      options.onChange(css);
    }
  }
  
  // Handle save
  function handleSave() {
    const css = generateCSS($editorState.allElementChanges, $editorState.propertyMediaQueries);
    if (options.onSave) {
      options.onSave(css);
    }
  }
  
  // Handle export
  function handleExport() {
    const css = generateCSS($editorState.allElementChanges, $editorState.propertyMediaQueries);
    
    // Try to copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(css)
        .then(() => {
          // TODO: Replace with toast notification for better UX
          alert($_('ui.messages.cssCopied'));
        })
        .catch(() => showCSSModal(css));
    } else {
      showCSSModal(css);
    }
  }
  
  function showCSSModal(css: string) {
    // TODO: Replace with custom modal component for better UX and accessibility
    alert($_('ui.messages.copyManually') + '\n\n' + css);
  }
  
  // Handle clear
  function handleClear() {
    // TODO: Replace with custom confirmation modal for better UX and accessibility
    if (confirm($_('ui.messages.confirmClear'))) {
      $editorState.allElementChanges.clear();
      $editorState.currentStyles.clear();
      $editorState.modifiedProperties.clear();
      applyCSS('');
    }
  }
  
  // Handle close
  function handleClose() {
    hidePanel();
  }
  
  // Get property input type
  function getInputType(property: string): 'text' | 'color' | 'size' {
    if (property.includes('color') || property.includes('Color')) {
      return 'color';
    }
    if (property.includes('width') || property.includes('height') || property.includes('size') || 
        property.includes('margin') || property.includes('padding') || property.includes('radius')) {
      return 'size';
    }
    return 'text';
  }
</script>

{#if $panelVisible}
  <div 
    class="css-editor-panel" 
    class:dark={$uiState.theme === 'dark'}
    class:anchor-right={$uiState.anchorPosition === 'right'}
    class:anchor-left={$uiState.anchorPosition === 'left'}
    class:anchor-top={$uiState.anchorPosition === 'top'}
    class:anchor-bottom={$uiState.anchorPosition === 'bottom'}
  >
    <div class="panel-header">
      <h2>{$_('ui.panel.title')}</h2>
      <div class="header-actions">
        <button on:click={toggleTheme} title="Toggle theme">
          {$uiState.theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button on:click={handleClose} title={$_('ui.panel.close')}>
          ✕
        </button>
      </div>
    </div>
    
    <div class="panel-content">
      <!-- Selector input -->
      <div class="selector-section">
        <label for="selector-input">{$_('ui.panel.selector')}</label>
        <input 
          id="selector-input"
          type="text" 
          value={selectorInput}
          on:input={handleSelectorChange}
          placeholder="e.g., .my-class"
        />
      </div>
      
      <!-- Property groups -->
      <div class="properties-section">
        {#each PROPERTY_GROUPS as group}
          <PropertyGroup 
            groupName={group.name}
            groupLabel={group.name}
            properties={group.properties}
          >
            {#each group.properties as property}
              {#if $currentStyles.has(property)}
                {@const value = $currentStyles.get(property) || ''}
                {@const inputType = getInputType(property)}
                
                {#if inputType === 'color'}
                  <ColorInput
                    {property}
                    {value}
                    on:change={handlePropertyChange}
                    on:remove={handlePropertyRemove}
                  />
                {:else if inputType === 'size'}
                  <SizeInput
                    {property}
                    {value}
                    on:change={handlePropertyChange}
                    on:remove={handlePropertyRemove}
                  />
                {:else}
                  <PropertyInput
                    {property}
                    {value}
                    type="text"
                    on:change={handlePropertyChange}
                    on:remove={handlePropertyRemove}
                  />
                {/if}
              {/if}
            {/each}
          </PropertyGroup>
        {/each}
      </div>
      
      <!-- Action buttons -->
      <div class="actions-section">
        {#if options.buttons?.save?.visible !== false}
          <button class="btn btn-primary" on:click={handleSave}>
            {options.buttons?.save?.label || $_('ui.panel.saveCSS')}
          </button>
        {/if}
        
        {#if options.buttons?.export?.visible !== false}
          <button class="btn btn-secondary" on:click={handleExport}>
            {options.buttons?.export?.label || $_('ui.panel.exportCSS')}
          </button>
        {/if}
        
        {#if options.buttons?.clear?.visible !== false}
          <button class="btn btn-danger" on:click={handleClear}>
            {options.buttons?.clear?.label || $_('ui.panel.clearChanges')}
          </button>
        {/if}
      </div>
      
      <!-- Generated CSS -->
      {#if options.showGeneratedCSS !== false}
        <div class="generated-css-section">
          <h3>{$_('ui.panel.generatedCSS')}</h3>
          <pre><code>{$stylesStore.generatedCSS || $_('ui.panel.noStyles')}</code></pre>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .css-editor-panel {
    position: fixed;
    background: var(--panel-bg, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    width: 400px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    
    &.anchor-right {
      top: 20px;
      right: 20px;
    }
    
    &.anchor-left {
      top: 20px;
      left: 20px;
    }
    
    &.anchor-top {
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    &.anchor-bottom {
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    &.dark {
      --panel-bg: #1f2937;
      --text-color: #f9fafb;
      --border-color: #374151;
      --input-bg: #111827;
      --group-bg: #111827;
      --group-header-bg: #374151;
      --group-header-hover: #4b5563;
    }
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--group-header-bg, #f9fafb);
    
    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-color, #111827);
    }
  }
  
  .header-actions {
    display: flex;
    gap: 0.5rem;
    
    button {
      padding: 0.5rem;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      color: var(--text-color, #374151);
      
      &:hover {
        background: var(--group-header-hover, #e5e7eb);
        border-radius: 4px;
      }
    }
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  
  .selector-section {
    margin-bottom: 1.5rem;
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--text-color, #374151);
    }
    
    input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 0.875rem;
      background: var(--input-bg, #ffffff);
      color: var(--text-color, #111827);
      
      &:focus {
        outline: none;
        border-color: var(--primary-color, #667eea);
      }
    }
  }
  
  .properties-section {
    margin-bottom: 1.5rem;
  }
  
  .actions-section {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    
    &.btn-primary {
      background: var(--primary-color, #667eea);
      color: white;
      
      &:hover {
        background: var(--primary-hover, #5568d3);
      }
    }
    
    &.btn-secondary {
      background: var(--secondary-color, #6b7280);
      color: white;
      
      &:hover {
        background: var(--secondary-hover, #4b5563);
      }
    }
    
    &.btn-danger {
      background: var(--danger-color, #ef4444);
      color: white;
      
      &:hover {
        background: var(--danger-hover, #dc2626);
      }
    }
  }
  
  .generated-css-section {
    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text-color, #374151);
    }
    
    pre {
      background: var(--input-bg, #f9fafb);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      padding: 1rem;
      overflow-x: auto;
      font-size: 0.75rem;
      
      code {
        color: var(--text-color, #374151);
        font-family: 'Courier New', monospace;
      }
    }
  }
</style>
