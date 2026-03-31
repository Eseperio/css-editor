<script lang="ts">
  import { onMount } from 'svelte';
  import { viewportMode } from '../../stores/ui';
  import {
    editorState,
    setPropertyMediaQueryContext,
    getPropertyMediaQueryContext,
    hasPropertyValueForContext,
    hasPropertyContextValues,
    type MediaQueryContext,
  } from '../../stores/editorState';
  import { icons } from '../../icons';
  import Icon from '../Icon.svelte';

  export let property: string;

  let open = false;

  $: currentContext = getPropertyMediaQueryContext(property, $editorState);
  $: activeViewport = $viewportMode;
  $: hasCurrentContextValue = hasPropertyValueForContext(property, activeViewport, $editorState);
  $: hasAnyContextValue = hasPropertyContextValues(property, $editorState);
  $: viewportLabel = (() => {
    switch (activeViewport) {
      case 'phone':
        return 'Phone';
      case 'tablet':
        return 'Tablet';
      default:
        return 'Desktop';
    }
  })();
  $: viewportIcon = (() => {
    switch (activeViewport) {
      case 'phone':
        return icons.smartphone;
      case 'tablet':
        return icons.tablet;
      default:
        return icons.monitor;
    }
  })();

  function toggle() {
    open = !open;
  }

  function select(context: MediaQueryContext) {
    setPropertyMediaQueryContext(property, context);
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

<div class="media-query-selector">
  <button
    class="mq-trigger"
    class:mq-icon-current={hasCurrentContextValue}
    class:mq-icon-active={!hasCurrentContextValue && (currentContext !== 'all' || hasAnyContextValue)}
    on:click|stopPropagation={toggle}
    type="button"
    title="Context"
  >
    <Icon icon={icons.layers} />
  </button>
  {#if open}
    <div class="mq-dropdown" data-property={property}>
      <div class="mq-dropdown-title">Context</div>
      <button
        class="mq-option"
        class:selected={currentContext === 'all'}
        on:click={() => select('all')}
        type="button"
      >
        All (default)
      </button>
      <button
        class="mq-option"
        class:selected={currentContext === activeViewport}
        on:click={() => select(activeViewport)}
        type="button"
      >
        <Icon icon={viewportIcon} /> {viewportLabel} (current)
      </button>
    </div>
  {/if}
</div>
