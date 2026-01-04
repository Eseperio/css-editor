<script lang="ts">
  import { onMount } from 'svelte';
  import {
    _,
    setLocale as setSvelteI18nLocale,
    localeStore,
    getAvailableLocales,
    getLocaleName
  } from '../i18n/setup';
  import {
    editorState,
    currentSelector,
    currentStyles,
    setCurrentSelector,
    updateStyle,
    removeStyle,
    clearEditorState,
    addAdvancedProperty,
    removeAdvancedProperty
  } from '../stores/editorState';
  import {
    uiState,
    hidePanel,
    toggleTheme,
    setAnchorPosition,
    setViewportMode,
    toggleSelectorConfig,
    panelVisible
  } from '../stores/ui';
  import { stylesStore, generateCSS, applyCSS } from '../stores/styles';
  import {
    PROPERTY_GROUPS,
    getAdvancedProperties,
    getPropertyValues
  } from '../css-properties';
  import { getPropertyInputType } from '../property-inputs';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';
  import PropertyGroup from './PropertyGroup.svelte';
  import PropertyInput from './PropertyInput.svelte';
  import ColorInput from './ColorInput.svelte';
  import SizeInput from './SizeInput.svelte';

  // Props matching CSSEditorOptions
  export let options: {
    onSave?: (css: string) => void;
    onLoad?: () => Promise<string>;
    onChange?: (css: string) => void;
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

  const availableLocales = getAvailableLocales();

  let selectorInput = '';
  let selectorCountText = '';
  let selectorCountVisible = false;
  let openDropdown: 'locale' | 'anchor' | null = null;
  let advancedPickerOpen = false;
  let advancedSearch = '';

  $: selectorInput = $currentSelector;

  $: {
    if (!$currentSelector) {
      selectorCountText = '';
      selectorCountVisible = false;
    } else {
      try {
        const doc = $editorState.currentElement?.ownerDocument || document;
        const count = doc.querySelectorAll($currentSelector).length;
        if (count > 1) {
          selectorCountText = $_('ui.panel.selectorMatchCount', { count: count.toString() });
          selectorCountVisible = true;
        } else if (count === 1) {
          selectorCountText = '';
          selectorCountVisible = false;
        } else {
          selectorCountText = $_('ui.panel.selectorInvalid');
          selectorCountVisible = true;
        }
      } catch {
        selectorCountText = $_('ui.panel.selectorInvalid');
        selectorCountVisible = true;
      }
    }
  }

  $: anchorIcon = (() => {
    switch ($uiState.anchorPosition) {
      case 'left':
        return icons.arrowLeft;
      case 'right':
        return icons.arrowRight;
      case 'top':
        return icons.arrowUp;
      case 'bottom':
        return icons.arrowDown;
      default:
        return icons.arrowRight;
    }
  })();

  $: themeIcon = $uiState.theme === 'dark' ? icons.sun : icons.moon;

  // Initialize i18n locale
  onMount(() => {
    if (options.locale) {
      setSvelteI18nLocale(options.locale);
    }

    stylesStore.initStyleElement();

    const handleDocumentClick = () => {
      openDropdown = null;
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });

  // Handle selector change (manual edits)
  function handleSelectorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setCurrentSelector(target.value);
  }

  function toggleDropdown(name: 'locale' | 'anchor') {
    openDropdown = openDropdown === name ? null : name;
  }

  function handleLocaleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setSvelteI18nLocale(target.value);
    openDropdown = null;
  }

  function handleAnchorChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setAnchorPosition(target.value as 'left' | 'right' | 'top' | 'bottom');
    openDropdown = null;
  }

  function handleViewportChange(mode: 'desktop' | 'tablet' | 'phone') {
    setViewportMode(mode);
  }

  function toggleAdvancedPicker() {
    advancedPickerOpen = !advancedPickerOpen;
    advancedSearch = '';
  }

  function handleAddAdvancedProperty(property: string) {
    addAdvancedProperty(property);
    advancedPickerOpen = false;
    advancedSearch = '';
  }

  function getPropertySuggestions(property: string): string[] {
    const base = getPropertyValues(property);
    if (property === 'font-family' && options.fontFamilies && options.fontFamilies.length > 0) {
      return Array.from(new Set([...base, ...options.fontFamilies]));
    }
    return base;
  }

  function getPropertyLabel(property: string): string {
    const key = `properties.${property}`;
    const label = $_(key);
    return label === key ? property : label;
  }

  function isPropertyModified(property: string): boolean {
    return $editorState.modifiedProperties.has(property);
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
    if ($editorState.advancedProperties.has(property)) {
      removeAdvancedProperty(property);
    }
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

  async function handleLoad() {
    if (!options.onLoad) return;
    try {
      const css = await options.onLoad();
      applyCSS(css);
    } catch {
      // swallow load errors for now
    }
  }

  function showCSSModal(css: string) {
    alert($_('ui.messages.copyManually') + '\n\n' + css);
  }

  // Handle clear
  function handleClear() {
    if (confirm($_('ui.messages.confirmClear'))) {
      clearEditorState();
      applyCSS('');
    }
  }

  // Handle close
  function handleClose() {
    hidePanel();
  }

  function getInputType(property: string) {
    return getPropertyInputType(property);
  }

  $: advancedOptions = getAdvancedProperties().filter((prop) => {
    if ($editorState.advancedProperties.has(prop)) return false;
    if (!advancedSearch) return true;
    const label = getPropertyLabel(prop).toLowerCase();
    return prop.toLowerCase().includes(advancedSearch.toLowerCase()) ||
      label.includes(advancedSearch.toLowerCase());
  });
</script>

{#if $panelVisible}
  <div
    id="css-editor-panel"
    class:theme-dark={$uiState.theme === 'dark'}
    class:anchor-right={$uiState.anchorPosition === 'right'}
    class:anchor-left={$uiState.anchorPosition === 'left'}
    class:anchor-top={$uiState.anchorPosition === 'top'}
    class:anchor-bottom={$uiState.anchorPosition === 'bottom'}
  >
    <div class="resize-handle"></div>
    <div class="css-editor-header">
      <div class="header-actions">
        <button class="theme-toggle" on:click={toggleTheme} title="Toggle theme">
          <span class="theme-icon">
            <Icon icon={themeIcon} />
          </span>
        </button>

        {#if options.iframeMode}
          <div class="viewport-mode-controls">
            <button
              class="viewport-mode-btn"
              class:active={$uiState.viewportMode === 'desktop'}
              on:click={() => handleViewportChange('desktop')}
              title="Desktop view"
              type="button"
            >
              <Icon icon={icons.monitor} />
            </button>
            <button
              class="viewport-mode-btn"
              class:active={$uiState.viewportMode === 'tablet'}
              on:click={() => handleViewportChange('tablet')}
              title="Tablet view"
              type="button"
            >
              <Icon icon={icons.tablet} />
            </button>
            <button
              class="viewport-mode-btn"
              class:active={$uiState.viewportMode === 'phone'}
              on:click={() => handleViewportChange('phone')}
              title="Phone view"
              type="button"
            >
              <Icon icon={icons.smartphone} />
            </button>
          </div>
        {/if}

        <div class="config-dropdown locale-dropdown" class:open={openDropdown === 'locale'}>
          <button
            class="config-dropdown-trigger"
            title={$_('ui.panel.language')}
            type="button"
            on:click|stopPropagation={() => toggleDropdown('locale')}
          >
            <Icon icon={icons.languages} />
          </button>
          <select
            class="locale-select config-dropdown-content"
            value={$localeStore}
            on:change={handleLocaleChange}
            on:click|stopPropagation
          >
            {#each availableLocales as locale}
              <option value={locale}>{getLocaleName(locale)}</option>
            {/each}
          </select>
        </div>

        <div class="config-dropdown anchor-dropdown" class:open={openDropdown === 'anchor'}>
          <button
            class="config-dropdown-trigger anchor-trigger"
            title={$_('ui.panel.anchorPosition')}
            type="button"
            on:click|stopPropagation={() => toggleDropdown('anchor')}
          >
            <Icon icon={anchorIcon} />
          </button>
          <select
            class="anchor-select config-dropdown-content"
            value={$uiState.anchorPosition}
            on:change={handleAnchorChange}
            on:click|stopPropagation
          >
            <option value="right">{$_('ui.panel.anchorRight')}</option>
            <option value="bottom">{$_('ui.panel.anchorBottom')}</option>
            <option value="left">{$_('ui.panel.anchorLeft')}</option>
            <option value="top">{$_('ui.panel.anchorTop')}</option>
          </select>
        </div>

        <button class="css-editor-close" on:click={handleClose} title={$_('ui.panel.close')} type="button">
          <Icon icon={icons.close} />
        </button>
      </div>
    </div>

    <div class="css-editor-content">
      <div class="properties-grid">
        <div class="css-editor-selector">
          <div class="selector-header">
            <label>{$_('ui.panel.selector')}:</label>
            <button
              class="selector-config-toggle"
              on:click={toggleSelectorConfig}
              title="Configure selector"
              type="button"
            >
              <Icon icon={icons.settings} />
            </button>
          </div>
          <input
            class="selector-input"
            type="text"
            value={selectorInput}
            on:input={handleSelectorChange}
            placeholder="e.g., .my-class"
          />
          <div class="selector-count" style:display={selectorCountVisible ? 'block' : 'none'}>
            {selectorCountText}
          </div>
          <div class="selector-config-panel" style:display={$uiState.selectorConfigExpanded ? 'block' : 'none'}>
            <div class="selector-config-content">
              <!-- Selector configuration UI to be ported from legacy panel -->
            </div>
          </div>
        </div>

        <div class="common-properties-section">
          <div class="common-properties">
            {#each PROPERTY_GROUPS as group}
              <PropertyGroup group={group}>
                {#each group.properties as property}
                  {#if $currentStyles.has(property)}
                    {@const value = $currentStyles.get(property) || ''}
                    {@const inputType = getInputType(property)}
                    {@const suggestions = getPropertySuggestions(property)}
                    {@const label = getPropertyLabel(property)}
                    {@const modified = isPropertyModified(property)}

                    {#if suggestions.length > 0}
                      <PropertyInput
                        {property}
                        {label}
                        {value}
                        type="select"
                        options={suggestions}
                        placeholder={$_('ui.inputs.selectOption')}
                        {modified}
                        on:change={handlePropertyChange}
                      />
                    {:else if inputType === 'color'}
                      <ColorInput
                        {property}
                        {label}
                        {value}
                        {modified}
                        on:change={handlePropertyChange}
                      />
                    {:else if inputType === 'size'}
                      <SizeInput
                        {property}
                        {label}
                        {value}
                        {modified}
                        on:change={handlePropertyChange}
                      />
                    {:else if inputType === 'number'}
                      <PropertyInput
                        {property}
                        {label}
                        {value}
                        type="number"
                        {modified}
                        on:change={handlePropertyChange}
                      />
                    {:else}
                      <PropertyInput
                        {property}
                        {label}
                        {value}
                        type="text"
                        {modified}
                        on:change={handlePropertyChange}
                      />
                    {/if}
                  {/if}
                {/each}
              </PropertyGroup>
            {/each}
          </div>
        </div>

        <div class="advanced-properties-section">
          <button class="add-property-btn" on:click={toggleAdvancedPicker} type="button">
            <Icon icon={icons.plus} className="plus-icon" />
            {$_('ui.panel.addProperty')}
          </button>
          {#if advancedPickerOpen}
            <div class="advanced-property-subpanel">
              <input
                type="text"
                placeholder={$_('ui.panel.propertySelector.search')}
                value={advancedSearch}
                on:input={(event) => (advancedSearch = (event.target as HTMLInputElement).value)}
              />
              <div class="advanced-properties">
                {#each advancedOptions as property}
                  <button class="property-option" on:click={() => handleAddAdvancedProperty(property)} type="button">
                    {getPropertyLabel(property)}
                  </button>
                {/each}
                {#if advancedOptions.length === 0}
                  <div class="property-option empty">{$_('ui.panel.propertySelector.allAdded')}</div>
                {/if}
              </div>
            </div>
          {/if}
          <div class="advanced-properties">
            {#each Array.from($editorState.advancedProperties) as property}
              {@const value = $currentStyles.get(property) || ''}
              {@const inputType = getInputType(property)}
              {@const suggestions = getPropertySuggestions(property)}
              {@const label = getPropertyLabel(property)}
              {@const modified = isPropertyModified(property)}

              {#if suggestions.length > 0}
                <PropertyInput
                  {property}
                  {label}
                  {value}
                  type="select"
                  options={suggestions}
                  placeholder={$_('ui.inputs.selectOption')}
                  {modified}
                  removable={true}
                  on:change={handlePropertyChange}
                  on:remove={handlePropertyRemove}
                />
              {:else if inputType === 'color'}
                <ColorInput
                  {property}
                  {label}
                  {value}
                  {modified}
                  removable={true}
                  on:change={handlePropertyChange}
                  on:remove={handlePropertyRemove}
                />
              {:else if inputType === 'size'}
                <SizeInput
                  {property}
                  {label}
                  {value}
                  {modified}
                  removable={true}
                  on:change={handlePropertyChange}
                  on:remove={handlePropertyRemove}
                />
              {:else if inputType === 'number'}
                <PropertyInput
                  {property}
                  {label}
                  {value}
                  type="number"
                  {modified}
                  removable={true}
                  on:change={handlePropertyChange}
                  on:remove={handlePropertyRemove}
                />
              {:else}
                <PropertyInput
                  {property}
                  {label}
                  {value}
                  type="text"
                  {modified}
                  removable={true}
                  on:change={handlePropertyChange}
                  on:remove={handlePropertyRemove}
                />
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="css-editor-footer">
      {#if options.buttons?.save?.visible !== false}
        <button class="css-editor-save" on:click={handleSave} type="button">
          {options.buttons?.save?.label || $_('ui.panel.saveCSS')}
        </button>
      {/if}

      {#if options.buttons?.load?.visible !== false && options.onLoad}
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
