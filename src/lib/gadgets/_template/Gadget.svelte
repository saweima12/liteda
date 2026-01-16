<script lang="ts">
  import type { GadgetProps } from '../types';

  interface Props extends GadgetProps {
    // Add your config type here
  }

  let { config }: Props = $props();
</script>

<div>
  <!-- Your addon content here -->
</div>
