<template>
  <div class="portal-shell">
    <SeoGeo />
    <PortalHeader />
    <main class="portal-main">
      <slot />
    </main>
    <PortalFooter />
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/portal.css'

useSiteHead()
</script>
