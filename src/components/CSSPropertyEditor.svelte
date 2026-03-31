<script lang="ts">
  import { _ } from '../i18n/setup';
  import { editorState, getPropertyValueForContext } from '../stores/editorState';
  import { viewportMode } from '../stores/ui';
  import {
    SPACING_PROPERTIES,
    COMPOUND_PROPERTIES,
    MULTI_VALUE_PROPERTIES,
    getPropertyValues,
  } from '../css-properties';
  import { getPropertyInputType } from '../property-inputs';
  import NumericCSSPropertyEditor from './property-editors/NumericCSSPropertyEditor.svelte';
  import SelectCSSPropertyEditor from './property-editors/SelectCSSPropertyEditor.svelte';
  import ColorCSSPropertyEditor from './property-editors/ColorCSSPropertyEditor.svelte';
  import FilterPropertyEditor from './property-editors/FilterPropertyEditor.svelte';
  import TextCSSPropertyEditor from './property-editors/TextCSSPropertyEditor.svelte';
  import SpacingPropertyEditor from './property-editors/SpacingPropertyEditor.svelte';
  import BorderPropertyEditor from './property-editors/BorderPropertyEditor.svelte';
  import BorderRadiusPropertyEditor from './property-editors/BorderRadiusPropertyEditor.svelte';
  import ShadowPropertyEditor from './property-editors/ShadowPropertyEditor.svelte';

  export let property: string;
  export let removable: boolean = false;
  export let fontFamilies: string[] | undefined = undefined;
  export let spacingSide: boolean = false;

  $: value = getPropertyValueForContext(property, $viewportMode, $editorState);
  $: label = (() => {
    const key = `properties.${property}`;
    const translated = $_(key);
    return translated === key ? property : translated;
  })();
  $: suggestions = (() => {
    const base = getPropertyValues(property);
    if (property === 'font-family' && fontFamilies && fontFamilies.length > 0) {
      return Array.from(new Set([...base, ...fontFamilies]));
    }
    return base;
  })();
  $: inputType = getPropertyInputType(property);

  $: isSpacing = SPACING_PROPERTIES.some((item) => item.general === property);
  $: isBorder = COMPOUND_PROPERTIES.some((item) => item.general === property);
  $: isBorderRadius = property === 'border-radius';
  $: isShadow = MULTI_VALUE_PROPERTIES.some((item) => item.property === property);
</script>

{#if isShadow}
  <ShadowPropertyEditor {property} {value} />
{:else if isBorder}
  <BorderPropertyEditor {property} />
{:else if isBorderRadius}
  <BorderRadiusPropertyEditor {property} {value} {label} />
{:else if isSpacing}
  <SpacingPropertyEditor {property} {value} {label} />
{:else if inputType === 'filter'}
  <FilterPropertyEditor {property} {value} {label} {removable} {spacingSide} />
{:else if suggestions.length > 0}
  <SelectCSSPropertyEditor
    {property}
    {value}
    {label}
    options={suggestions}
    {removable}
    {spacingSide}
  />
{:else if inputType === 'color'}
  <ColorCSSPropertyEditor {property} {value} {label} {removable} {spacingSide} />
{:else if inputType === 'size' || inputType === 'number'}
  <NumericCSSPropertyEditor {property} {value} {label} {removable} {spacingSide} />
{:else}
  <TextCSSPropertyEditor {property} {value} {label} {removable} {spacingSide} />
{/if}
