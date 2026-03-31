<script lang="ts">
  import { onMount } from 'svelte';
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
    parseCSSValue,
    mapValueToSizeSlider,
    mapSizeSliderToValue,
    CSS_UNITS,
    PERCENTAGE_PROPERTIES,
  } from '../../property-inputs';
  import { _ } from '../../i18n/setup';
  import { icons } from '../../icons';
  import Icon from '../Icon.svelte';
  import MediaQueryIcon from '../ui/MediaQueryIcon.svelte';
  import VariableIcon from '../ui/VariableIcon.svelte';

  export let property: string;
  export let value: string = '';
  export let label: string;
  export let removable: boolean = false;
  export let spacingSide: boolean = false;

  const units = CSS_UNITS;
  const explicitDimensionProperties = new Set([
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
  ]);
  let numberValue = '0';
  let unitValue = 'px';
  let sliderValue = 0;
  let sliderOpen = false;
  let container: HTMLElement | null = null;

  $: isPercentage = PERCENTAGE_PROPERTIES.includes(property);
  $: modified = isPropertyModifiedInContext(property, $viewportMode, $editorState);
  $: variableName = getPropertyVariableNameForContext(property, $viewportMode, $editorState);
  $: computedValue = variableName ? $editorState.cssVariables.get(variableName) || 'unknown' : '';
  $: inputId = `css-prop-${property.replace(/[^a-z0-9_-]/gi, '-')}`;
  $: shouldShowEmptyValue = explicitDimensionProperties.has(property) && !modified && !variableName;

  $: {
    if (shouldShowEmptyValue) {
      numberValue = '';
      unitValue = 'px';
      sliderValue = 0;
    } else if (isPercentage) {
      const num = parseFloat(value) || 0;
      numberValue = num.toString();
      sliderValue = num;
    } else {
      const parsed = parseCSSValue(value);
      numberValue = String(parsed.number);
      unitValue = parsed.unit || 'px';
      sliderValue = mapValueToSizeSlider(parsed.number);
    }
  }

  function hasValueInput(): boolean {
    return numberValue.trim() !== '';
  }

  function updateNumericValue() {
    if (isPercentage) {
      if (!hasValueInput()) {
        removeStyle(property);
        removeAdvancedProperty(property);
        return;
      }
      updateStyle(property, numberValue);
      return;
    }

    if (unitValue !== 'auto' && !hasValueInput()) {
      removeStyle(property);
      removeAdvancedProperty(property);
      return;
    }

    const nextValue = unitValue === 'auto'
      ? 'auto'
      : `${numberValue}${unitValue}`;
    updateStyle(property, nextValue);
  }

  function handleNumberChange(event: Event) {
    const target = event.target as HTMLInputElement;
    numberValue = target.value;
    updateNumericValue();
  }

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    unitValue = target.value;
    updateNumericValue();
  }

  function handleSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (isPercentage) {
      numberValue = target.value;
    } else {
      const numeric = mapSizeSliderToValue(parseFloat(target.value));
      numberValue = Math.round(numeric).toString();
    }
    updateNumericValue();
  }

  function handleRemove() {
    removeStyle(property);
    removeAdvancedProperty(property);
  }

  function handleRemoveVariable() {
    removePropertyVariable(property);
  }

  function openSlider(event: Event) {
    event.stopPropagation();
    sliderOpen = true;
  }

  onMount(() => {
    const handle = (event: MouseEvent) => {
      if (!sliderOpen || !container) return;
      if (!container.contains(event.target as Node)) {
        sliderOpen = false;
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  });
</script>

<div
  class="css-property"
  class:active={modified}
  class:disabled={!modified}
  class:spacing-side={spacingSide}
  data-property={property}
  bind:this={container}
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
      {#if isPercentage}
        <div class="property-input-group percentage-input-group">
          <input
            id={inputId}
            class="percentage-number-input"
            type="number"
            data-property={property}
            value={numberValue}
            on:input={handleNumberChange}
            on:click={openSlider}
            step={property === 'opacity' ? '0.01' : '0.1'}
            min="0"
            max={property === 'opacity' ? '1' : '10'}
            title={$_('ui.inputs.clickForSlider')}
          />
          <span class="percentage-unit">{property === 'opacity' ? '%' : ''}</span>
          {#if sliderOpen}
            <div class="slider-popover" data-property={property}>
              <input
                type="range"
                class="percentage-slider"
                min="0"
                max={property === 'opacity' ? '1' : '10'}
                step={property === 'opacity' ? '0.01' : '0.1'}
                value={numberValue}
                on:input={handleSliderChange}
              />
            </div>
          {/if}
        </div>
      {:else}
        <div class="property-input-group size-input-group">
          <input
            id={inputId}
            class="size-number-input"
            type="number"
            data-property={property}
            value={numberValue}
            on:input={handleNumberChange}
            on:click={openSlider}
            step="0.1"
            min="0"
            title={$_('ui.inputs.clickForSlider')}
          />
          <select
            class="size-unit-selector"
            data-property={property}
            value={unitValue}
            on:change={handleUnitChange}
          >
            {#each units as unit}
              <option value={unit}>{unit}</option>
            {/each}
          </select>
          {#if sliderOpen}
            <div class="slider-popover" data-property={property}>
              <input
                type="range"
                class="size-slider"
                min="0"
                max="100"
                step="0.1"
                value={sliderValue}
                on:input={handleSliderChange}
              />
            </div>
          {/if}
        </div>
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
