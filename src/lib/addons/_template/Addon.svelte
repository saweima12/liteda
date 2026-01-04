<script lang="ts">
  import type { AddonProps } from '../types';

  interface Props extends AddonProps {
    // Add your config type here
  }

  let { config }: Props = $props();
</script>

<div>
  <!-- Your addon content here -->
</div>
