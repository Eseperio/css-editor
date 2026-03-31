<script lang="ts">
  import { _ } from '../../i18n/setup';
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
  import {
    parseFilterValue,
    formatFilterValue,
    getFilterOptions,
    getFilterOption,
    type FilterType,
  } from '../../property-inputs';
  import { icons } from '../../icons';
  import Icon from '../Icon.svelte';
  import MediaQueryIcon from '../ui/MediaQueryIcon.svelte';
  import VariableIcon from '../ui/VariableIcon.svelte';

  export let property: string;
  export let value: string = '';
  export let label: string;
  export let removable: boolean = false;
  export let spacingSide: boolean = false;

  let options = getFilterOptions();
  let selectedType: FilterType = 'none';
  let sliderValue = 0;
  let unit = '';
  let customValue = '';

  $: modified = isPropertyModifiedInContext(property, $viewportMode, $editorState);
  $: options = getFilterOptions();
  $: variableName = getPropertyVariableNameForContext(property, $viewportMode, $editorState);
  $: computedValue = variableName ? $editorState.cssVariables.get(variableName) || 'unknown' : '';
  $: inputId = `css-prop-${property.replace(/[^a-z0-9_-]/gi, '-')}`;

  $: {
    const parsed = parseFilterValue(value);
    selectedType = parsed.type;
    sliderValue = parsed.value;
    unit = parsed.unit;
    customValue = parsed.raw;
  }

  function handleTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const nextType = target.value as FilterType;
    selectedType = nextType;

    if (nextType === 'none') {
      updateStyle(property, 'none');
      return;
    }

    if (nextType === 'custom') {
      updateStyle(property, customValue || '');
      return;
    }

    const option = getFilterOption(nextType);
    const nextValue = option?.defaultValue ?? 0;
    sliderValue = nextValue;
    unit = option?.unit ?? '';
    updateStyle(property, formatFilterValue(nextType, nextValue, unit));
  }

  function handleSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const nextValue = parseFloat(target.value);
    sliderValue = nextValue;
    const option = getFilterOption(selectedType);
    const nextUnit = option?.unit ?? unit;
    updateStyle(property, formatFilterValue(selectedType, nextValue, nextUnit));
  }

  function handleNumberChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const nextValue = parseFloat(target.value);
    sliderValue = Number.isNaN(nextValue) ? 0 : nextValue;
    const option = getFilterOption(selectedType);
    const nextUnit = option?.unit ?? unit;
    updateStyle(property, formatFilterValue(selectedType, sliderValue, nextUnit));
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
      <div class="property-input-group filter-input-group">
        <select
          id={inputId}
          class="filter-select"
          data-property={property}
          value={selectedType}
          on:change={handleTypeChange}
        >
          {#each options as option}
            <option value={option.type}>{option.label}</option>
          {/each}
        </select>
        <div class="filter-controls" data-property={property} style:display={selectedType === 'none' || selectedType === 'custom' ? 'none' : ''}>
          <input
            type="range"
            class="filter-slider"
            data-property={property}
            min={getFilterOption(selectedType)?.min ?? 0}
            max={getFilterOption(selectedType)?.max ?? 100}
            step={getFilterOption(selectedType)?.step ?? 1}
            value={sliderValue}
            on:input={handleSliderChange}
          />
          <div class="filter-numeric">
            <input
              type="number"
              class="filter-number-input"
              data-property={property}
              min={getFilterOption(selectedType)?.min ?? 0}
              max={getFilterOption(selectedType)?.max ?? 100}
              step={getFilterOption(selectedType)?.step ?? 1}
              value={sliderValue}
              on:input={handleNumberChange}
            />
            <span class="filter-unit" data-property={property}>
              {getFilterOption(selectedType)?.unit ?? unit}
            </span>
          </div>
        </div>
        <input
          type="text"
          class="filter-custom-input"
          data-property={property}
          value={customValue}
          placeholder="e.g., blur(4px) drop-shadow(2px 4px 6px #000)"
          style:display={selectedType === 'custom' ? '' : 'none'}
          on:input={handleCustomChange}
        />
      </div>
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
