<script lang="ts">
  import { onMount } from 'svelte';
  import { _, setLocale as setSvelteI18nLocale, localeStore, getAvailableLocales, getLocaleName } from '../i18n/setup';
  import { uiState, toggleTheme, setAnchorPosition } from '../stores/ui';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';
  import ViewportModeButtons from './ViewportModeButtons.svelte';

  export let showViewportControls: boolean = false;
  export let onClose: () => void;
  export let onSave: (() => void) | undefined = undefined;
  export let onCopy: (() => void) | undefined = undefined;

  const locales = getAvailableLocales();
  let openDropdown: 'locale' | 'anchor' | null = null;

  $: anchorIcon = (() => {
    switch ($uiState.anchorPosition) {
      case 'left':
        return icons.panelLeft;
      case 'right':
        return icons.panelRight;
      case 'top':
        return icons.panelTop;
      case 'bottom':
        return icons.panelBottom;
      default:
        return icons.panelRight;
    }
  })();

  $: themeIcon = $uiState.theme === 'dark' ? icons.sun : icons.moon;

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

  onMount(() => {
    const handle = () => {
      openDropdown = null;
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  });
</script>

<div class="css-editor-header">
  <div class="header-actions">
    <button class="theme-toggle" on:click={toggleTheme} title="Toggle theme" type="button">
      <span class="theme-icon">
        <Icon icon={themeIcon} />
      </span>
    </button>

    {#if showViewportControls}
      <ViewportModeButtons />
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
        {#each locales as locale}
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

    {#if onSave}
      <button class="css-editor-save" on:click={onSave} title={$_('ui.panel.saveCSS')} type="button">
        <Icon icon={icons.save} />
      </button>
    {/if}

    {#if onCopy}
      <button class="css-editor-export" on:click={onCopy} title={$_('ui.panel.exportCSS')} type="button">
        <Icon icon={icons.copy} />
      </button>
    {/if}

    <button class="css-editor-close" on:click={onClose} title={$_('ui.panel.close')} type="button">
      <Icon icon={icons.close} />
    </button>
  </div>
</div>
