<script lang="ts">
  import { _ } from '../i18n/setup';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';
  import {
    editorState,
    createCSSVariable,
    updateCSSVariable,
    deleteCSSVariable,
  } from '../stores/editorState';
  import { uiState, toggleGroupCollapse, isGroupCollapsed } from '../stores/ui';

  let panelEl: HTMLElement | null = null;
  let newName = '';
  let newValue = '';
  export let groupNames: string[] = [];

  $: variablesList = Array.from($editorState.cssVariables.entries());
  $: collapsed = isGroupCollapsed('css-variables', $uiState);
  $: hasVariables = variablesList.length > 0;

  function focusVariable(name: string) {
    if (!panelEl) return;
    const input = panelEl.querySelector(`.variable-value-input[data-var="${name}"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }

  function handleValueChange(event: Event, name: string) {
    const target = event.target as HTMLInputElement;
    updateCSSVariable(name, target.value);
  }

  function handleCreate() {
    const trimmedName = newName.trim();
    const trimmedValue = newValue.trim();
    if (!trimmedName || !trimmedValue) return;
    createCSSVariable(trimmedName, trimmedValue);
    newName = '';
    newValue = '';
  }
</script>

<div class="property-group css-variables-group" data-group="css-variables" bind:this={panelEl}>
  <button
    class="property-group-header"
    type="button"
    data-group="css-variables"
    aria-expanded={!collapsed}
    on:click={() => toggleGroupCollapse('css-variables', groupNames)}
  >
    <div class="property-group-indicator" class:active={hasVariables}></div>
    <div class="property-group-title">CSS Variables</div>
    <div class="property-group-toggle" class:collapsed={collapsed}>
      <Icon icon={icons.chevronDown} />
    </div>
  </button>
  <div class="property-group-content" class:collapsed={collapsed}>
    <div class="variables-list">
      {#if variablesList.length > 0}
        {#each variablesList as [name, value]}
          <div class="variable-item" data-var={name}>
            <div class="variable-item-header">
              <span class="variable-item-name">{name}</span>
              <div class="variable-item-actions">
                <button class="variable-edit-btn" data-var={name} title="Edit variable" type="button" on:click={() => focusVariable(name)}>
                  <Icon icon={icons.edit} />
                </button>
                <button class="variable-delete-btn" data-var={name} title="Delete variable" type="button" on:click={() => deleteCSSVariable(name)}>
                  <Icon icon={icons.close} />
                </button>
              </div>
            </div>
            <div class="variable-item-value">
              <input
                type="text"
                class="variable-value-input"
                data-var={name}
                value={value}
                on:change={(event) => handleValueChange(event, name)}
              />
            </div>
          </div>
        {/each}
      {:else}
        <div class="no-variables">No CSS variables defined. Create one below.</div>
      {/if}
    </div>
    <div class="variable-create-section">
      <h4>Create New Variable</h4>
      <div class="variable-create-form">
        <input
          type="text"
          class="variable-new-name"
          placeholder="--variable-name"
          value={newName}
          on:input={(event) => (newName = (event.target as HTMLInputElement).value)}
        />
        <input
          type="text"
          class="variable-new-value"
          placeholder="Value (e.g., #ff0000)"
          value={newValue}
          on:input={(event) => (newValue = (event.target as HTMLInputElement).value)}
        />
        <button class="variable-create-btn" type="button" on:click={handleCreate}>
          <Icon icon={icons.plus} /> Create
        </button>
      </div>
    </div>
  </div>
</div>
