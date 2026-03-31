<script lang="ts">
  import { _ } from '../../i18n/setup';
  import {
    editorState,
    updateStyle,
    removeStyle,
    isPropertyModifiedInContext,
  } from '../../stores/editorState';
  import { viewportMode } from '../../stores/ui';
  import type { MultiValueProperty } from '../../css-properties';
  import { MULTI_VALUE_PROPERTIES } from '../../css-properties';
  import ShadowItemEditor, { type ShadowConfig } from './ShadowItemEditor.svelte';

  export let property: string;
  export let value: string = '';

  const multiValue = MULTI_VALUE_PROPERTIES.find((item) => item.property === property) as MultiValueProperty | undefined;
  let shadows: ShadowConfig[] = [];
  let lastValue = '';

  $: modified = isPropertyModifiedInContext(property, $viewportMode, $editorState);
  $: {
    if (value !== lastValue) {
      shadows = parseBoxShadow(value);
      lastValue = value;
    }
  }

  function parseBoxShadow(input: string): ShadowConfig[] {
    if (!input || input === 'none') return [];
    const parts = input.split(/,(?![^(]*\))/);
    return parts.map((part) => {
      let segment = part.trim();
      const shadow: ShadowConfig = {
        x: '0px',
        y: '0px',
        blur: '0px',
        spread: '0px',
        color: 'rgba(0, 0, 0, 0.5)',
        inset: '',
      };

      if (segment.includes('inset')) {
        shadow.inset = 'inset';
        segment = segment.replace('inset', '').trim();
      }

      const tokens = segment.match(/([+-]?[\d.]+[a-z%]*|rgba?\([^)]+\)|#[0-9a-f]+)/gi) || [];
      if (tokens[0]) shadow.x = tokens[0];
      if (tokens[1]) shadow.y = tokens[1];
      if (tokens[2]) shadow.blur = tokens[2];
      if (tokens[3]) shadow.spread = tokens[3];
      if (tokens[4]) shadow.color = tokens[4];

      return shadow;
    });
  }

  function buildShadowValue(next: ShadowConfig[]): string {
    return next
      .map((shadow) => {
        const parts: string[] = [];
        if (shadow.inset) parts.push(shadow.inset);
        parts.push(shadow.x || '0px');
        parts.push(shadow.y || '0px');
        parts.push(shadow.blur || '0px');
        parts.push(shadow.spread || '0px');
        parts.push(shadow.color || 'rgba(0, 0, 0, 0.5)');
        return parts.join(' ');
      })
      .join(', ');
  }

  function updateShadow(index: number, nextShadow: ShadowConfig) {
    const next = shadows.map((shadow, idx) => (idx === index ? nextShadow : shadow));
    shadows = next;
    const newValue = buildShadowValue(next);
    updateStyle(property, newValue);
  }

  function addShadow() {
    if (!multiValue) return;
    const defaults: ShadowConfig = {
      x: '0px',
      y: '0px',
      blur: '0px',
      spread: '0px',
      color: 'rgba(0, 0, 0, 0.5)',
      inset: '',
    };
    multiValue.components.forEach((component) => {
      if (component.defaultValue) {
        defaults[component.name as keyof ShadowConfig] = component.defaultValue as string;
      }
    });
    const next = [...shadows, defaults];
    shadows = next;
    updateStyle(property, buildShadowValue(next));
  }

  function removeShadow(index: number) {
    const next = shadows.filter((_, idx) => idx !== index);
    shadows = next;
    if (next.length === 0) {
      removeStyle(property);
    } else {
      updateStyle(property, buildShadowValue(next));
    }
  }
</script>

<div class="multi-value-property-container" data-property={property}>
  {#each shadows as shadow, index}
    <ShadowItemEditor
      {shadow}
      {index}
      {modified}
      onUpdate={(next) => updateShadow(index, next)}
      onRemove={() => removeShadow(index)}
    />
  {/each}
  <div class="multi-value-add-container">
    <button class="multi-value-add-btn" type="button" title={$_('ui.shadow.addShadow')} on:click={addShadow}>
      + {$_('ui.shadow.addShadow')}
    </button>
  </div>
</div>
