<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { parseCSSValue, CSS_UNITS } from '../property-inputs';

  export let property: string;
  export let label: string;
  export let value: string = '0px';
  export let modified: boolean = false;
  export let removable: boolean = false;

  const dispatch = createEventDispatcher();

  const units = CSS_UNITS;

  let numberValue = '0';
  let unitValue = 'px';

  function updateValue() {
    dispatch('change', { property, value: `${numberValue}${unitValue}` });
  }

  function handleNumberChange(event: Event) {
    const target = event.target as HTMLInputElement;
    numberValue = target.value;
    updateValue();
  }

  function handleUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    unitValue = target.value;
    updateValue();
  }

  function handleRemove() {
    dispatch('remove', { property });
  }

  $: {
    const parsed = parseCSSValue(value);
    numberValue = String(parsed.number);
    unitValue = parsed.unit;
  }
</script>

<div class="css-property" class:active={modified} class:disabled={!modified} data-property={property}>
  <label>{label}</label>
  <div class="property-input-with-mq">
    <div class="property-input-group size-input-group">
      <input
        class="size-number-input"
        type="number"
        data-property={property}
        value={numberValue}
        on:input={handleNumberChange}
        step="0.1"
        placeholder="0"
      />
      <select
        class="size-unit-selector"
        value={unitValue}
        on:change={handleUnitChange}
        data-property={property}
      >
        {#each units as unit}
          <option value={unit}>{unit}</option>
        {/each}
      </select>
    </div>

    {#if removable}
      <button class="property-remove-btn" on:click={handleRemove} type="button">
        x
      </button>
    {/if}
  </div>
</div>
