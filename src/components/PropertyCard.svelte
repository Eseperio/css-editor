<script lang="ts">
  import { _ } from '../i18n/setup';
  import { uiState, toggleGroupCollapse, isGroupCollapsed, viewportMode } from '../stores/ui';
  import { editorState, isPropertyModified, getPropertyValueForContext } from '../stores/editorState';
  import { COMPOUND_PROPERTIES, SPACING_PROPERTIES, type PropertyGroup as PropertyGroupType } from '../css-properties';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';

  export let group: PropertyGroupType;
  export let groupNames: string[] = [];

  $: collapsed = isGroupCollapsed(group.name, $uiState);
  $: groupLabel = (() => {
    const key = `propertyGroups.${group.name}`;
    const label = $_(key);
    return label === key ? group.name : label;
  })();

  $: hasModifiedProperty = group.properties.some((prop) => {
    if (isPropertyModified(prop, $editorState)) return true;

    const spacingProp = SPACING_PROPERTIES.find((sp) => sp.general === prop);
    if (spacingProp && spacingProp.sides.some((side) => isPropertyModified(side, $editorState))) {
      return true;
    }

    const compoundProp = COMPOUND_PROPERTIES.find((cp) => cp.general === prop);
    if (!compoundProp) return false;

    if (compoundProp.subProperties.some((subProp) => isPropertyModified(subProp, $editorState))) {
      return true;
    }

    return compoundProp.sides.some((side) =>
      isPropertyModified(side.property, $editorState) ||
      side.subProperties.some((subProp) => isPropertyModified(subProp, $editorState)),
    );
  });

  $: dependencyMet = (() => {
    if (!group.dependsOn) return true;
    const currentValue = getPropertyValueForContext(group.dependsOn.property, $viewportMode, $editorState);
    return currentValue ? group.dependsOn.values.includes(currentValue) : false;
  })();

  $: dependencyWarning = group.dependsOn && !dependencyMet ? group.dependsOn.warning : '';

  function handleToggle() {
    toggleGroupCollapse(group.name, groupNames);
  }
</script>

<div
  class="property-group"
  class:dependency-unmet={!dependencyMet}
  data-group={group.name}
>
  <button
    class="property-group-header"
    type="button"
    data-group={group.name}
    aria-expanded={!collapsed}
    on:click={handleToggle}
  >
    <div class="property-group-indicator" class:active={hasModifiedProperty}></div>
    <div class="property-group-title">{groupLabel}</div>
    {#if dependencyWarning}
      <span class="dependency-warning" title={dependencyWarning}>
        <Icon icon={icons.alertTriangle} />
      </span>
    {/if}
    <div class="property-group-toggle" class:collapsed={collapsed}>
      {#if collapsed}
        <Icon icon={icons.chevronRight} />
      {:else}
        <Icon icon={icons.chevronDown} />
      {/if}
    </div>
  </button>
  <div class="property-group-content" class:collapsed={collapsed}>
    <slot />
  </div>
</div>
