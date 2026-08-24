<script setup lang="ts">
const { siteName, settings } = useSiteSettings()
</script>

<template>
  <div class="auth-shell">
    <aside class="auth-visual" aria-hidden="true">
      <HeroBgImage
        v-if="settings?.heroImageUrl"
        class="auth-visual-img"
        :src="settings.heroImageUrl"
        :alt="siteName"
        eager
      />
      <div class="auth-visual-scrim" />
      <p class="auth-visual-name">{{ siteName }}</p>
    </aside>
    <div class="auth-main">
      <div class="auth-panel">
        <slot />
      </div>
    </div>
  </div>
</template>
