<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    class?: string;
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { cn } from './utils';

  let { class: className, children, ...restProps }: CardProps = $props();
</script>

<div
  class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</div>
