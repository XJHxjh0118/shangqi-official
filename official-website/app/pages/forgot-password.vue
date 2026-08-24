<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { settings } = useSiteSettings()

useSeoGeo({
  title: t('auth.forgotTitle'),
  description: t('auth.forgotDesc'),
})
</script>

<template>
  <div class="page">
    <div class="auth-panel">
      <h1>{{ t('auth.forgotTitle') }}</h1>
      <p>{{ t('auth.forgotDesc') }}</p>
      <p v-if="settings?.contactEmail">
        <a :href="'mailto:' + settings.contactEmail">{{ settings.contactEmail }}</a>
      </p>
      <div class="auth-links">
        <NuxtLink :to="localePath('/login')">{{ t('auth.goLogin') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>
