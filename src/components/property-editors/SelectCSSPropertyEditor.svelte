<script lang="ts">
  import {
    editorState,
    updateStyle,
    removeStyle,
    removeAdvancedProperty,
    removePropertyVariable,
    isPropertyModifiedInContext,
    getPropertyVariableNameForContext,
  } from '../../stores/editorState';
  import { viewportMode } from '../../stores/ui';
  import { _ } from '../../i18n/setup';
  import { icons } from '../../icons';
  import Icon from '../Icon.svelte';
  import MediaQueryIcon from '../ui/MediaQueryIcon.svelte';
  import VariableIcon from '../ui/VariableIcon.svelte';

  export let property: string;
  export let value: string = '';
  export let label: string;
  export let options: string[] = [];
  export let removable: boolean = false;
  export let spacingSide: boolean = false;

  let selectedValue = '';
  let customValue = '';

  $: modified = isPropertyModifiedInContext(property, $viewportMode, $editorState);
  $: variableName = getPropertyVariableNameForContext(property, $viewportMode, $editorState);
  $: computedValue = variableName ? $editorState.cssVariables.get(variableName) || 'unknown' : '';
  $: inputId = `css-prop-${property.replace(/[^a-z0-9_-]/gi, '-')}`;
  $: {
    const trimmed = (value || '').trim();
    const hasOption = options.includes(trimmed);
    selectedValue = hasOption ? trimmed : trimmed ? 'custom' : '';
    customValue = hasOption ? '' : trimmed;
  }

  function handleSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedValue = target.value;
    if (selectedValue !== 'custom') {
      updateStyle(property, selectedValue);
    }
  }

  function handleCustomChange(event: Event) {
    const target = event.target as HTMLInputElement;
    customValue = target.value;
    updateStyle(property, customValue);
  }

  function handleRemove() {
    removeStyle(property);
    removeAdvancedProperty(property);
  }

  function handleRemoveVariable() {
    removePropertyVariable(property);
  }
</script>

<div
  class="css-property"
  class:active={modified}
  class:disabled={!modified}
  class:spacing-side={spacingSide}
  data-property={property}
>
  <label for={inputId}>{label}</label>
  <div class="property-input-with-mq">
    {#if variableName}
      <div class="variable-display" data-property={property}>
        <div class="variable-name">{variableName}</div>
        <div class="variable-computed-value">{computedValue}</div>
        <button
          class="variable-remove-btn"
          data-property={property}
          title={$_('ui.inputs.remove')}
          type="button"
          on:click={handleRemoveVariable}
        >
          <Icon icon={icons.close} />
        </button>
      </div>
    {:else}
      <select
        id={inputId}
        data-property={property}
        value={selectedValue}
        on:change={handleSelectChange}
      >
        <option value="">{$_('ui.inputs.selectOption')}</option>
        {#each options as option}
          <option value={option}>{option}</option>
        {/each}
        <option value="custom">{$_('ui.inputs.customValue')}</option>
      </select>
      {#if selectedValue === 'custom'}
        <input
          class="custom-property-input"
          type="text"
          data-property={property}
          value={customValue}
          on:input={handleCustomChange}
          placeholder={$_('ui.inputs.enterCustomValue')}
        />
      {/if}
    {/if}

    {#if removable}
      <button class="property-remove-btn" on:click={handleRemove} type="button">
        {$_('ui.inputs.remove')}
      </button>
    {/if}

    <MediaQueryIcon {property} />
    <VariableIcon {property} />
  </div>
</div>
