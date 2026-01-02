<script lang="ts">
  import { _ } from '../i18n/setup';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let property: string;
  export let value: string = '0px';
  
  // CSS units
  const units = ['px', 'em', 'rem', '%', 'vw', 'vh', 'pt', 'cm', 'mm', 'in'];
  
  // Parse value into number and unit
  function parseValue(val: string): { number: string; unit: string } {
    if (!val) return { number: '0', unit: 'px' };
    
    const match = val.match(/^(-?[\d.]+)([a-z%]+)?$/i);
    if (match) {
      return {
        number: match[1] || '0',
        unit: match[2] || 'px'
      };
    }
    return { number: '0', unit: 'px' };
  }
  
  let parsed = parseValue(value);
  let numberValue = parsed.number;
  let unitValue = parsed.unit;
  
  function updateValue() {
    const newValue = `${numberValue}${unitValue}`;
    dispatch('change', { property, value: newValue });
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
  
  // Update internal state when value prop changes
  $: {
    const newParsed = parseValue(value);
    numberValue = newParsed.number;
    unitValue = newParsed.unit;
  }
</script>

<div class="size-input">
  <label for="{property}-size">
    <span class="property-label">{property}</span>
  </label>
  
  <div class="input-wrapper">
    <input
      id="{property}-size"
      type="number"
      value={numberValue}
      on:input={handleNumberChange}
      step="0.1"
      class="size-number"
      placeholder="0"
    />
    
    <select
      value={unitValue}
      on:change={handleUnitChange}
      class="size-unit"
    >
      {#each units as unit}
        <option value={unit}>{unit}</option>
      {/each}
    </select>
    
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
  .size-input {
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
  
  .size-number {
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
  
  .size-unit {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
    background: var(--input-bg, #fff);
    color: var(--text-color, #333);
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color, #667eea);
    }
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
