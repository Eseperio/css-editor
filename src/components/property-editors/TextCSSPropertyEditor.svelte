<script lang="ts">
  import { _ } from '../../i18n/setup';
  import {
    editorState,
    updateStyle,
    removeStyle,
    removeAdvancedProperty,
    removePropertyVariable,
    isPropertyModifiedInContext,
    getPropertyVariableNameForContext,
  } from '../../stores/editorState';
  import { viewportMode } from '../../stores/ui';
  import { icons } from '../../icons';
  import Icon from '../Icon.svelte';
  import MediaQueryIcon from '../ui/MediaQueryIcon.svelte';
  import VariableIcon from '../ui/VariableIcon.svelte';

  export let property: string;
  export let value: string = '';
  export let label: string;
  export let removable: boolean = false;
  export let spacingSide: boolean = false;

  $: modified = isPropertyModifiedInContext(property, $viewportMode, $editorState);
  $: variableName = getPropertyVariableNameForContext(property, $viewportMode, $editorState);
  $: computedValue = variableName ? $editorState.cssVariables.get(variableName) || 'unknown' : '';
  $: inputId = `css-prop-${property.replace(/[^a-z0-9_-]/gi, '-')}`;

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    updateStyle(property, target.value);
  }

  function handleRemove() {
    removeStyle(property);
    removeAdvancedProperty(property);
  }

  function handleRemoveVariable() {
    removePropertyVariable(property);
  }
</script>

<div
  class="css-property"
  class:active={modified}
  class:disabled={!modified}
  class:spacing-side={spacingSide}
  data-property={property}
>
  <label for={inputId}>{label}</label>
  <div class="property-input-with-mq">
    {#if variableName}
      <div class="variable-display" data-property={property}>
        <div class="variable-name">{variableName}</div>
        <div class="variable-computed-value">{computedValue}</div>
        <button
          class="variable-remove-btn"
          data-property={property}
          title={$_('ui.inputs.remove')}
          type="button"
          on:click={handleRemoveVariable}
        >
          <Icon icon={icons.close} />
        </button>
      </div>
    {:else}
      <input
        id={inputId}
        type="text"
        data-property={property}
        value={value}
        placeholder={$_('ui.inputs.enterValue')}
        on:input={handleChange}
      />
    {/if}

    {#if removable}
      <button class="property-remove-btn" on:click={handleRemove} type="button">
        {$_('ui.inputs.remove')}
      </button>
    {/if}

    <MediaQueryIcon {property} />
    <VariableIcon {property} />
  </div>
</div>
