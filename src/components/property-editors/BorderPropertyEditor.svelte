<script lang="ts">
  import { _ } from '../../i18n/setup';
  import { COMPOUND_PROPERTIES } from '../../css-properties';
  import {
    editorState,
    removeStyle,
    isPropertyModifiedInContext,
  } from '../../stores/editorState';
  import { uiState, toggleCompoundSide, removeCompoundSide, viewportMode } from '../../stores/ui';
  import CSSPropertyEditor from '../CSSPropertyEditor.svelte';

  export let property: string;

  const compound = COMPOUND_PROPERTIES.find((item) => item.general === property);
  let sideSelectorOpen = false;

  $: activeSides = compound ? $uiState.expandedCompound.get(property) || new Set<string>() : new Set();
  $: availableSides = compound ? compound.sides.filter((side) => !activeSides.has(side.name)) : [];
  $: isGeneralModified = compound
    ? compound.subProperties.some((subProp) => isPropertyModifiedInContext(subProp, $viewportMode, $editorState))
    : false;
  $: hasSideModifications = compound
    ? compound.sides.some((side) => side.subProperties.some((subProp) => isPropertyModifiedInContext(subProp, $viewportMode, $editorState)))
    : false;
  $: isModified = isGeneralModified || hasSideModifications;

  function openSideSelector() {
    if (!compound) return;
    if (availableSides.length === 0) {
      alert($_('ui.compound.allSidesAdded'));
      return;
    }
    sideSelectorOpen = true;
  }

  function closeSideSelector() {
    sideSelectorOpen = false;
  }

  function addSide(sideName: string) {
    toggleCompoundSide(property, sideName);
    sideSelectorOpen = false;
  }

  function removeSide(sideName: string) {
    if (!compound) return;
    const side = compound.sides.find((item) => item.name === sideName);
    if (!side) return;
    side.subProperties.forEach((subProp) => {
      removeStyle(subProp);
    });
    removeCompoundSide(property, sideName);
  }
</script>

{#if compound}
  <div class="compound-property-container" data-compound={compound.general}>
    <div class="compound-property-general">
      <div class="compound-property-header">
        <span class="compound-label" class:disabled={!isModified}>{$_('ui.compound.all')}</span>
      </div>
      {#each compound.subProperties as subProp}
        <CSSPropertyEditor property={subProp} />
      {/each}
    </div>

    <div class="compound-add-side-container">
      <button
        class="compound-add-side-btn"
        data-compound={compound.general}
        title={$_('ui.compound.addSideConfig')}
        type="button"
        on:click={openSideSelector}
      >
        + {$_('ui.compound.addSideConfig')}
      </button>
    </div>

    {#if activeSides.size > 0}
      <div class="compound-sides-container">
        {#each compound.sides as side}
          {#if activeSides.has(side.name)}
            <div class="compound-side-config" data-compound={compound.general} data-side={side.name}>
              <div class="compound-side-header">
                <span
                  class="compound-label"
                  class:active={side.subProperties.some((subProp) => isPropertyModifiedInContext(subProp, $viewportMode, $editorState))}
                >
                  {$_(`properties.${side.property}`) === `properties.${side.property}` ? side.property : $_(`properties.${side.property}`)}
                </span>
                <button
                  class="compound-remove-side-btn"
                  data-compound={compound.general}
                  data-side={side.name}
                  title={$_('ui.compound.removeSide')}
                  type="button"
                  on:click={() => removeSide(side.name)}
                >
                  ×
                </button>
              </div>
              <div class="compound-side-properties">
                {#each side.subProperties as subProp}
                  <CSSPropertyEditor property={subProp} />
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}

{#if sideSelectorOpen && compound}
  <div
    class="side-selector-modal"
    role="button"
    tabindex="0"
    aria-label="Close side selector"
    on:click|self={closeSideSelector}
    on:keydown={(event) => event.key === 'Escape' && closeSideSelector()}
  >
    <div class="side-selector-content">
      <h3>{$_('ui.compound.selectSide')}</h3>
      <div class="side-list">
        {#each availableSides as side}
          <button class="side-option" type="button" on:click={() => addSide(side.name)}>
            {$_(`properties.${side.property}`) === `properties.${side.property}` ? side.property : $_(`properties.${side.property}`)}
          </button>
        {/each}
      </div>
      <button class="modal-close" type="button" on:click={closeSideSelector}>
        {$_('ui.propertySelector.cancel')}
      </button>
    </div>
  </div>
{/if}
