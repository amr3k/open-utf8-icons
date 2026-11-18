<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { theme } from '#lib/theme.svelte.js';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		theme.init();
		return () => {
			theme.destroy();
		};
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={favicon} />
</svelte:head>

{@render children()}
