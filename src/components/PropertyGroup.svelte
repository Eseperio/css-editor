<script lang="ts">
  import { _ } from '../i18n/setup';
  import { uiState, toggleGroupCollapse, isGroupCollapsed } from '../stores/ui';
  import { currentStyles, modifiedProperties } from '../stores/editorState';
  import { SPACING_PROPERTIES, type PropertyGroup as PropertyGroupType } from '../css-properties';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';

  export let group: PropertyGroupType;

  $: collapsed = isGroupCollapsed(group.name, $uiState);
  $: groupLabel = (() => {
    const key = `propertyGroups.${group.name}`;
    const label = $_(key);
    return label === key ? group.name : label;
  })();

  $: hasModifiedProperty = group.properties.some((prop) => {
    if ($modifiedProperties.has(prop)) return true;
    const spacingProp = SPACING_PROPERTIES.find((sp) => sp.general === prop);
    if (!spacingProp) return false;
    return spacingProp.sides.some((side) => $modifiedProperties.has(side));
  });

  $: dependencyMet = (() => {
    if (!group.dependsOn) return true;
    const currentValue = $currentStyles.get(group.dependsOn.property);
    return currentValue ? group.dependsOn.values.includes(currentValue) : false;
  })();

  $: dependencyWarning = group.dependsOn && !dependencyMet ? group.dependsOn.warning : '';

  function handleToggle() {
    toggleGroupCollapse(group.name);
  }
</script>

<div
  class="property-group"
  class:dependency-unmet={!dependencyMet}
  data-group={group.name}
>
  <div class="property-group-header" on:click={handleToggle}>
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
  </div>
  <div class="property-group-content" class:collapsed={collapsed}>
    <slot />
  </div>
</div>
