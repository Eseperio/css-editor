<script lang="ts">
  import { uiState, setViewportMode } from '../stores/ui';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';

  function setMode(mode: 'desktop' | 'tablet' | 'phone') {
    setViewportMode(mode);
  }
</script>

<div class="viewport-mode-controls">
  <button
    class="viewport-mode-btn"
    class:active={$uiState.viewportMode === 'desktop'}
    on:click={() => setMode('desktop')}
    title="Desktop view"
    type="button"
  >
    <Icon icon={icons.monitor} />
  </button>
  <button
    class="viewport-mode-btn"
    class:active={$uiState.viewportMode === 'tablet'}
    on:click={() => setMode('tablet')}
    title="Tablet view"
    type="button"
  >
    <Icon icon={icons.tablet} />
  </button>
  <button
    class="viewport-mode-btn"
    class:active={$uiState.viewportMode === 'phone'}
    on:click={() => setMode('phone')}
    title="Phone view"
    type="button"
  >
    <Icon icon={icons.smartphone} />
  </button>
</div>
