<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from '../../i18n/setup';
  import { icons } from '../../icons';
  import Icon from '../Icon.svelte';
  import { SPACING_PROPERTIES } from '../../css-properties';
  import {
    parseCSSValue,
    mapValueToSizeSlider,
    mapSizeSliderToValue,
    CSS_UNITS,
  } from '../../property-inputs';
  import {
    editorState,
    updateStyle,
    removeStyle,
    removePropertyVariable,
    isPropertyModifiedInContext,
    getPropertyVariableNameForContext,
  } from '../../stores/editorState';
  import { uiState, setSpacingExpanded, viewportMode } from '../../stores/ui';
  import CSSPropertyEditor from '../CSSPropertyEditor.svelte';
  import MediaQueryIcon from '../ui/MediaQueryIcon.svelte';
  import VariableIcon from '../ui/VariableIcon.svelte';

  export let property: string;
  export let value: string = '';
  export let label: string;

  const spacingConfig = SPACING_PROPERTIES.find((item) => item.general === property);
  const units = CSS_UNITS;

  let numberValue = '0';
  let unitValue = 'px';
  let sliderValue = 0;
  let sliderOpen = false;
  let container: HTMLElement | null = null;

  $: modified = isPropertyModifiedInContext(property, $viewportMode, $editorState) ||
    (spacingConfig ? spacingConfig.sides.some((side) => isPropertyModifiedInContext(side, $viewportMode, $editorState)) : false);
  $: isExpanded = spacingConfig ? $uiState.expandedSpacing.get(property) || false : false;
  $: variableName = getPropertyVariableNameForContext(property, $viewportMode, $editorState);
  $: computedValue = variableName ? $editorState.cssVariables.get(variableName) || 'unknown' : '';

  $: {
    const parsed = parseCSSValue(value);
    numberValue = String(parsed.number);
    unitValue = parsed.unit || 'px';
    sliderValue = mapValueToSizeSlider(parsed.number);
  }

  function updateGeneralValue() {
    const nextValue = unitValue === 'auto' ? 'auto' : `${numberValue}${unitValue}`;
    updateStyle(property, nextValue);
  }

  function handleNumberChange(event: Event) {
    const target = event.target as HTMLInputElement;
    numberValue = target.value;
    updateGeneralValue();
  }

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    unitValue = target.value;
    updateGeneralValue();
  }

  function handleSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const numeric = mapSizeSliderToValue(parseFloat(target.value));
    numberValue = Math.round(numeric).toString();
    updateGeneralValue();
  }

  function openSlider(event: Event) {
    event.stopPropagation();
    sliderOpen = true;
  }

  function expandSpacing() {
    if (!spacingConfig) return;
    const currentValue = value || '';
    if (currentValue.trim()) {
      spacingConfig.sides.forEach((side) => {
        updateStyle(side, currentValue);
      });
    }
    removeStyle(property);
    setSpacingExpanded(property, true);
  }

  function collapseSpacing() {
    if (!spacingConfig) return;
    spacingConfig.sides.forEach((side) => {
      removeStyle(side);
    });
    setSpacingExpanded(property, false);
  }

  function handleRemoveVariable() {
    removePropertyVariable(property);
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

{#if spacingConfig}
  {#if isExpanded}
    {#each spacingConfig.sides as side}
      <CSSPropertyEditor property={side} spacingSide={true} />
    {/each}
    <div class="spacing-collapse-container">
      <button
        class="spacing-collapse-btn"
        data-spacing={property}
        title={$_('ui.spacing.collapseToGeneral', { property: label })}
        type="button"
        on:click={collapseSpacing}
      >
        <Icon icon={icons.settings} />
        {$_('ui.spacing.collapseToGeneral', { property: label })}
      </button>
    </div>
  {:else}
    <div
      class="css-property"
      class:active={modified}
      class:disabled={!modified}
      data-property={property}
      bind:this={container}
    >
      <label>
        {label}
        <button
          class="spacing-expand-btn"
          data-spacing={property}
          title={$_('ui.spacing.expandToSides')}
          type="button"
          on:click={expandSpacing}
        >
          <Icon icon={icons.settings} />
        </button>
      </label>
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
          <div class="property-input-group size-input-group">
            <input
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

        <MediaQueryIcon {property} />
        <VariableIcon {property} />
      </div>
    </div>
  {/if}
{/if}
