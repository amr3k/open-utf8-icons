<script lang="ts">
  import "./layout.css";
  import { page } from "$app/state";
  import {
    canonicalUrl,
    OG_IMAGE,
    OG_IMAGE_URL,
    SITE_DESCRIPTION,
    SITE_NAME,
    SITE_TITLE,
  } from "#lib/seo.js";
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

  /** Per-route canonical + Open Graph URL, without query or fragment noise. */
  const canonical = $derived(canonicalUrl(page.url.pathname));

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
  <meta name="description" content={SITE_DESCRIPTION} />
  <link rel="canonical" href={canonical} />

  <!-- Social previews: Open Graph + Twitter summary_large_image -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:title" content={SITE_TITLE} />
  <meta property="og:description" content={SITE_DESCRIPTION} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={OG_IMAGE_URL} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content={String(OG_IMAGE.width)} />
  <meta property="og:image:height" content={String(OG_IMAGE.height)} />
  <meta property="og:image:alt" content={OG_IMAGE.alt} />
  <meta property="og:locale" content="en_US" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={SITE_TITLE} />
  <meta name="twitter:description" content={SITE_DESCRIPTION} />
  <meta name="twitter:image" content={OG_IMAGE_URL} />
  <meta name="twitter:image:alt" content={OG_IMAGE.alt} />
</svelte:head>

<div class="flex min-h-dvh flex-col">
  <Header />
  <InstallBanner />
  {@render children()}
  <Footer />
</div>

<OfflineIndicator />
<Toaster />
