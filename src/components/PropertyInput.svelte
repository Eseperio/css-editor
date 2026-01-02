<script lang="ts">
  import { _ } from '../i18n/setup';
  
  // Props
  export let property: string;
  export let value: string;
  export let type: 'text' | 'color' | 'select' | 'number' | 'size' = 'text';
  export let options: string[] = [];
  export let placeholder: string = '';
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  
  // Events
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    dispatch('change', { property, value: target.value });
  }
  
  function handleRemove() {
    dispatch('remove', { property });
  }
</script>

<div class="property-input">
  <label for={property}>
    <span class="property-label">{property}</span>
  </label>
  
  <div class="input-wrapper">
    {#if type === 'select'}
      <select 
        id={property}
        {value}
        on:change={handleChange}
      >
        <option value="">{$_('ui.inputs.selectOption')}</option>
        {#each options as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    {:else if type === 'color'}
      <input
        id={property}
        type="color"
        {value}
        on:input={handleChange}
        title={$_('ui.inputs.pickColor')}
      />
    {:else if type === 'number'}
      <input
        id={property}
        type="number"
        {value}
        {placeholder}
        {min}
        {max}
        on:input={handleChange}
      />
    {:else}
      <input
        id={property}
        type="text"
        {value}
        {placeholder}
        on:input={handleChange}
      />
    {/if}
    
    <button 
      class="remove-btn"
      on:click={handleRemove}
      title={$_('ui.inputs.remove')}
      type="button"
    >
      ×
    </button>
  </div>
</div>

<style lang="scss">
  .property-input {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .property-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color, #333);
  }
  
  .input-wrapper {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  input, select {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
    background: var(--input-bg, #fff);
    color: var(--text-color, #333);
    
    &:focus {
      outline: none;
      border-color: var(--primary-color, #667eea);
    }
  }
  
  input[type="color"] {
    width: 50px;
    height: 40px;
    padding: 2px;
    cursor: pointer;
  }
  
  .remove-btn {
    padding: 0.25rem 0.5rem;
    background: var(--danger-color, #ef4444);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    transition: background 0.2s;
    
    &:hover {
      background: var(--danger-hover, #dc2626);
    }
  }
</style>
