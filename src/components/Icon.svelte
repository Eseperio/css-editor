<script lang="ts">
  import { getIconHTML, type IconNode } from '../icons';

  export let icon: IconNode;
  export let className: string | undefined = undefined;
</script>

<span class={className} aria-hidden="true">
  {@html getIconHTML(icon, className)}
</span>
