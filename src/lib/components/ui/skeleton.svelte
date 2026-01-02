<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements';

  export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }
</script>

<script lang="ts">
  import { cn } from './utils';

  let { class: className, ...restProps }: SkeletonProps = $props();
</script>

<div class={cn('animate-pulse rounded-md bg-muted', className)} {...restProps}></div>
