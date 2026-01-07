<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let property: string;
  export let label: string;
  export let value: string;
  export let type: 'text' | 'color' | 'select' | 'number' | 'size' = 'text';
  export let options: string[] = [];
  export let placeholder: string = '';
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let modified: boolean = false;
  export let removable: boolean = false;

  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    dispatch('change', { property, value: target.value });
  }

  function handleRemove() {
    dispatch('remove', { property });
  }
</script>

<div class="css-property" class:active={modified} class:disabled={!modified} data-property={property}>
  <label>{label}</label>
  <div class="property-input-with-mq">
    {#if type === 'select'}
      <select data-property={property} value={value} on:change={handleChange}>
        <option value="">{placeholder}</option>
        {#each options as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    {:else if type === 'number'}
      <input
        data-property={property}
        type="number"
        value={value}
        {placeholder}
        {min}
        {max}
        on:input={handleChange}
      />
    {:else}
      <input
        data-property={property}
        type="text"
        value={value}
        {placeholder}
        on:input={handleChange}
      />
    {/if}

    {#if removable}
      <button class="property-remove-btn" on:click={handleRemove} type="button">
        x
      </button>
    {/if}

    <slot name="icons" />
  </div>
</div>
