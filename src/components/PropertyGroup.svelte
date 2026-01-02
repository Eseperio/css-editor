<script lang="ts">
  import { _ } from '../i18n/setup';
  import { uiState, toggleGroupCollapse, isGroupCollapsed } from '../stores/ui';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let groupName: string;
  export let groupLabel: string;
  export let properties: string[] = [];
  
  $: collapsed = isGroupCollapsed(groupName, $uiState);
  
  function handleToggle() {
    toggleGroupCollapse(groupName);
  }
</script>

<div class="property-group" class:collapsed>
  <button 
    class="group-header" 
    on:click={handleToggle}
    type="button"
  >
    <span class="group-icon">{collapsed ? '▶' : '▼'}</span>
    <span class="group-label">{groupLabel}</span>
    <span class="group-count">{properties.length}</span>
  </button>
  
  {#if !collapsed}
    <div class="group-content">
      <slot />
    </div>
  {/if}
</div>

<style lang="scss">
  .property-group {
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 8px;
    margin-bottom: 1rem;
    background: var(--group-bg, #fff);
    overflow: hidden;
  }
  
  .group-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--group-header-bg, #f9fafb);
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color, #374151);
    transition: background 0.2s;
    
    &:hover {
      background: var(--group-header-hover, #f3f4f6);
    }
  }
  
  .group-icon {
    font-size: 0.75rem;
    color: var(--icon-color, #9ca3af);
    transition: transform 0.2s;
  }
  
  .group-label {
    flex: 1;
    text-align: left;
  }
  
  .group-count {
    font-size: 0.75rem;
    color: var(--muted-color, #9ca3af);
    background: var(--badge-bg, #e5e7eb);
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
  }
  
  .group-content {
    padding: 1rem;
  }
  
  .collapsed .group-icon {
    transform: rotate(0deg);
  }
</style>
