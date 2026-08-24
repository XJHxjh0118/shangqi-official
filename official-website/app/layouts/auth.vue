<template>
  <div class="site-shell">
    <SeoGeo />
    <AppHeader />
    <main class="site-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
useSiteHead()
</script>
