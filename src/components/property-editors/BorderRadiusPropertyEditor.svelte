<script lang="ts">
  import SpacingPropertyEditor from './SpacingPropertyEditor.svelte';

  export let property: string;
  export let value: string = '';
  export let label: string;
</script>

<SpacingPropertyEditor {property} {value} {label} />
