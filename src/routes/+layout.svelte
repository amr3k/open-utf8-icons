<script lang="ts">
  import "./layout.css";
  import favicon from "#lib/assets/favicon.svg";
  import { theme } from "#lib/theme.svelte.js";
  import { library } from "#lib/library.svelte.js";
  import { pwa } from "#lib/pwa.svelte.js";
  import Header from "#lib/components/Header.svelte";
  import InstallBanner from "#lib/components/InstallBanner.svelte";
  import OfflineIndicator from "#lib/components/OfflineIndicator.svelte";
  import Footer from "#lib/components/Footer.svelte";
  import Toaster from "#lib/components/Toaster.svelte";
  import { onMount } from "svelte";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  onMount(() => {
    theme.init();
    library.init();
    pwa.init();
    return () => {
      theme.destroy();
      pwa.destroy();
    };
  });
</script>

<svelte:head>
  <link rel="icon" type="image/svg+xml" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
  <Header />
  <InstallBanner />
  {@render children()}
  <Footer />
</div>

<OfflineIndicator />
<Toaster />
