<script lang="ts">
  import { onMount } from 'svelte';
  import { viewportMode } from '../../stores/ui';
  import {
    editorState,
    setPropertyVariable,
    getPropertyVariableNameForContext,
  } from '../../stores/editorState';
  import { icons } from '../../icons';
  import Icon from '../Icon.svelte';

  export let property: string;

  let open = false;

  $: currentVariable = getPropertyVariableNameForContext(property, $viewportMode, $editorState);
  $: variablesList = Array.from($editorState.cssVariables.entries());

  function toggle() {
    open = !open;
  }

  function select(varName: string) {
    setPropertyVariable(property, varName);
    open = false;
  }

  onMount(() => {
    const handle = () => {
      open = false;
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  });
</script>

<div class="variable-selector">
  <button
    class="var-trigger"
    class:var-icon-active={currentVariable !== null}
    on:click|stopPropagation={toggle}
    type="button"
    title="CSS Variable"
  >
    <Icon icon={icons.variable} />
  </button>
  {#if open}
    <div class="var-dropdown" data-property={property}>
      <div class="var-dropdown-header">CSS Variables</div>
      {#if variablesList.length > 0}
        {#each variablesList as [name, value]}
          <button
            class="var-option"
            class:selected={currentVariable === name}
            data-var={name}
            on:click={() => select(name)}
            type="button"
          >
            {name}
            <span class="var-value">{value}</span>
          </button>
        {/each}
      {:else}
        <div class="var-no-variables">No variables defined in :root</div>
      {/if}
    </div>
  {/if}
</div>
