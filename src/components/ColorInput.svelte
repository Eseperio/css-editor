<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { rgbToHex } from '../property-inputs';

  export let property: string;
  export let label: string;
  export let value: string = '#000000';
  export let modified: boolean = false;
  export let removable: boolean = false;

  const dispatch = createEventDispatcher();

  function handleColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('change', { property, value: target.value });
  }

  function handleTextChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('change', { property, value: target.value });
  }

  function handleRemove() {
    dispatch('remove', { property });
  }
</script>

<div class="css-property" class:active={modified} class:disabled={!modified} data-property={property}>
  <label>{label}</label>
  <div class="property-input-with-mq">
    <div class="property-input-group color-input-group">
      <input
        class="color-picker"
        type="color"
        data-property={property}
        value={rgbToHex(value || '#000000')}
        on:input={handleColorChange}
      />
      <input
        class="color-text-input"
        type="text"
        data-property={property}
        value={value}
        on:input={handleTextChange}
        placeholder="e.g., #000000 or rgb(0,0,0)"
      />
    </div>

    {#if removable}
      <button class="property-remove-btn" on:click={handleRemove} type="button">
        x
      </button>
    {/if}

    <slot name="icons" />
  </div>
</div>
