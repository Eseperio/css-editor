<script lang="ts">
  import { _ } from '../../i18n/setup';
  import { parseCSSValue, mapValueToSizeSlider, mapSizeSliderToValue, CSS_UNITS, rgbToHex } from '../../property-inputs';

  export interface ShadowConfig {
    x: string;
    y: string;
    blur: string;
    spread: string;
    color: string;
    inset: string;
  }

  export let shadow: ShadowConfig;
  export let index: number;
  export let modified: boolean = false;
  export let onUpdate: (shadow: ShadowConfig) => void;
  export let onRemove: () => void;

  const units = CSS_UNITS;

  $: xParsed = parseCSSValue(shadow.x || '0px');
  $: yParsed = parseCSSValue(shadow.y || '0px');
  $: blurParsed = parseCSSValue(shadow.blur || '0px');
  $: spreadParsed = parseCSSValue(shadow.spread || '0px');
  $: colorValue = rgbToHex(shadow.color || '#000000');
  $: xId = `shadow-${index}-x`;
  $: yId = `shadow-${index}-y`;
  $: blurId = `shadow-${index}-blur`;
  $: spreadId = `shadow-${index}-spread`;
  $: colorId = `shadow-${index}-color`;
  $: insetId = `shadow-${index}-inset`;

  function updateSize(key: keyof ShadowConfig, value: number, unit: string) {
    onUpdate({ ...shadow, [key]: `${Math.round(value)}${unit}` });
  }

  function handleSlider(key: keyof ShadowConfig, unit: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const numeric = mapSizeSliderToValue(parseFloat(target.value));
    updateSize(key, numeric, unit);
  }

  function handleNumber(key: keyof ShadowConfig, unit: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const numeric = parseFloat(target.value);
    if (!Number.isNaN(numeric)) {
      updateSize(key, numeric, unit);
    }
  }

  function handleUnit(key: keyof ShadowConfig, number: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    updateSize(key, number, target.value);
  }

  function handleColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onUpdate({ ...shadow, color: target.value });
  }

  function handleColorText(event: Event) {
    const target = event.target as HTMLInputElement;
    onUpdate({ ...shadow, color: target.value });
  }

  function handleInsetChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onUpdate({ ...shadow, inset: target.value });
  }
</script>

<div class="multi-value-item" data-index={index}>
  <div class="multi-value-header">
    <span class="compound-label" class:disabled={!modified}>
      {$_('ui.shadow.shadow')} {index + 1}
    </span>
    <button class="multi-value-remove-btn" type="button" title={$_('ui.shadow.removeShadow')} on:click={onRemove}>
      ×
    </button>
  </div>
  <div class="multi-value-components">
    <div class="shadow-component">
      <label for={xId}>{$_('ui.shadow.x')}</label>
      <div class="property-input-group size-input-group">
        <input
          type="range"
          class="size-slider"
          min="0"
          max="100"
          step="0.1"
          value={mapValueToSizeSlider(xParsed.number)}
          on:input={(event) => handleSlider('x', xParsed.unit || 'px', event)}
        />
        <input
          type="number"
          class="size-number-input"
          id={xId}
          value={xParsed.number}
          on:input={(event) => handleNumber('x', xParsed.unit || 'px', event)}
        />
        <select
          class="size-unit-selector"
          value={xParsed.unit || 'px'}
          on:change={(event) => handleUnit('x', xParsed.number, event)}
        >
          {#each units as unit}
            <option value={unit}>{unit}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="shadow-component">
      <label for={yId}>{$_('ui.shadow.y')}</label>
      <div class="property-input-group size-input-group">
        <input
          type="range"
          class="size-slider"
          min="0"
          max="100"
          step="0.1"
          value={mapValueToSizeSlider(yParsed.number)}
          on:input={(event) => handleSlider('y', yParsed.unit || 'px', event)}
        />
        <input
          type="number"
          class="size-number-input"
          id={yId}
          value={yParsed.number}
          on:input={(event) => handleNumber('y', yParsed.unit || 'px', event)}
        />
        <select
          class="size-unit-selector"
          value={yParsed.unit || 'px'}
          on:change={(event) => handleUnit('y', yParsed.number, event)}
        >
          {#each units as unit}
            <option value={unit}>{unit}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="shadow-component">
      <label for={blurId}>{$_('ui.shadow.blur')}</label>
      <div class="property-input-group size-input-group">
        <input
          type="range"
          class="size-slider"
          min="0"
          max="100"
          step="0.1"
          value={mapValueToSizeSlider(blurParsed.number)}
          on:input={(event) => handleSlider('blur', blurParsed.unit || 'px', event)}
        />
        <input
          type="number"
          class="size-number-input"
          id={blurId}
          value={blurParsed.number}
          on:input={(event) => handleNumber('blur', blurParsed.unit || 'px', event)}
        />
        <select
          class="size-unit-selector"
          value={blurParsed.unit || 'px'}
          on:change={(event) => handleUnit('blur', blurParsed.number, event)}
        >
          {#each units as unit}
            <option value={unit}>{unit}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="shadow-component">
      <label for={spreadId}>{$_('ui.shadow.spread')}</label>
      <div class="property-input-group size-input-group">
        <input
          type="range"
          class="size-slider"
          min="0"
          max="100"
          step="0.1"
          value={mapValueToSizeSlider(spreadParsed.number)}
          on:input={(event) => handleSlider('spread', spreadParsed.unit || 'px', event)}
        />
        <input
          type="number"
          class="size-number-input"
          id={spreadId}
          value={spreadParsed.number}
          on:input={(event) => handleNumber('spread', spreadParsed.unit || 'px', event)}
        />
        <select
          class="size-unit-selector"
          value={spreadParsed.unit || 'px'}
          on:change={(event) => handleUnit('spread', spreadParsed.number, event)}
        >
          {#each units as unit}
            <option value={unit}>{unit}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="shadow-component">
      <label for={colorId}>{$_('ui.shadow.color')}</label>
      <div class="property-input-group color-input-group">
        <input
          type="color"
          class="color-picker"
          value={colorValue}
          on:input={handleColorChange}
        />
        <input
          type="text"
          class="color-text-input"
          id={colorId}
          value={shadow.color}
          on:input={handleColorText}
        />
      </div>
    </div>

    <div class="shadow-component">
      <label for={insetId}>{$_('ui.shadow.inset')}</label>
      <select id={insetId} value={shadow.inset} on:change={handleInsetChange}>
        <option value="">{$_('ui.inputs.selectOption')}</option>
        <option value="inset">inset</option>
      </select>
    </div>
  </div>
</div>
