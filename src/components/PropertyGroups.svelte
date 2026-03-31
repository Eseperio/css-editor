<script lang="ts">
  import { _ } from '../i18n/setup';
  import { editorState, addAdvancedProperty } from '../stores/editorState';
  import { PROPERTY_GROUPS, getAdvancedProperties } from '../css-properties';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';
  import PropertyCard from './PropertyCard.svelte';
  import CSSPropertyEditor from './CSSPropertyEditor.svelte';
  import CSSVariablesPanel from './CSSVariablesPanel.svelte';

  export let fontFamilies: string[] | undefined = undefined;

  let advancedPickerOpen = false;
  let advancedSearch = '';
  const groupNames = [...PROPERTY_GROUPS.map(group => group.name), 'css-variables'];

  function toggleAdvancedPicker() {
    advancedPickerOpen = !advancedPickerOpen;
    if (!advancedPickerOpen) {
      advancedSearch = '';
    }
  }

  function handleAddAdvancedProperty(property: string) {
    addAdvancedProperty(property);
    advancedPickerOpen = false;
    advancedSearch = '';
  }

  $: advancedOptions = getAdvancedProperties().filter((prop) => {
    if ($editorState.advancedProperties.has(prop)) return false;
    if (!advancedSearch) return true;
    return prop.toLowerCase().includes(advancedSearch.toLowerCase()) ||
      $_(`properties.${prop}`).toLowerCase().includes(advancedSearch.toLowerCase());
  });
</script>

<div class="common-properties-section">
  <div class="common-properties">
    {#each PROPERTY_GROUPS as group}
      <PropertyCard {group} {groupNames}>
        {#each group.properties as property}
          <CSSPropertyEditor {property} {fontFamilies} />
        {/each}
      </PropertyCard>
    {/each}
    <CSSVariablesPanel {groupNames} />
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
            {$_(`properties.${property}`) === `properties.${property}` ? property : $_(`properties.${property}`)}
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
      <CSSPropertyEditor {property} {fontFamilies} removable={true} />
    {/each}
  </div>
</div>
