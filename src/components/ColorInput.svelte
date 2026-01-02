<script lang="ts">
  import { _ } from '../i18n/setup';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let property: string;
  export let value: string = '#000000';
  
  // Parse value to get color in hex format
  function normalizeColor(val: string): string {
    if (!val) return '#000000';
    
    // If already hex, return it
    if (val.startsWith('#')) return val;
    
    // For other formats, we'll just use the value as-is in text input
    return val;
  }
  
  let colorValue = normalizeColor(value);
  let textValue = value;
  
  function handleColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    colorValue = target.value;
    textValue = target.value;
    dispatch('change', { property, value: target.value });
  }
  
  function handleTextChange(event: Event) {
    const target = event.target as HTMLInputElement;
    textValue = target.value;
    dispatch('change', { property, value: target.value });
    
    // Update color picker if valid hex
    if (target.value.startsWith('#')) {
      colorValue = target.value;
    }
  }
  
  function handleRemove() {
    dispatch('remove', { property });
  }
</script>

<div class="color-input">
  <label for="{property}-color">
    <span class="property-label">{property}</span>
  </label>
  
  <div class="input-wrapper">
    <input
      id="{property}-color"
      type="color"
      value={colorValue}
      on:input={handleColorChange}
      title={$_('ui.inputs.pickColor')}
      class="color-picker"
    />
    
    <input
      id="{property}-text"
      type="text"
      value={textValue}
      on:input={handleTextChange}
      placeholder="e.g. #ff0000, rgb(255,0,0)"
      class="color-text"
    />
    
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
  .color-input {
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
  
  .color-picker {
    width: 50px;
    height: 40px;
    padding: 2px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    cursor: pointer;
    background: var(--input-bg, #fff);
  }
  
  .color-text {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    font-size: 0.875rem;
    background: var(--input-bg, #fff);
    color: var(--text-color, #333);
    font-family: 'Courier New', monospace;
    
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
