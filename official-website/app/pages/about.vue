<script setup lang="ts">
const { t } = useI18n()
const { aboutTitle, aboutBody, seoDescription } = useSiteSettings()

const { title, description } = usePageSeoMeta('about', {
  title: () => aboutTitle.value || t('about.title'),
  description: () => seoDescription.value || t('about.desc'),
})
const body = computed(() => aboutBody.value || t('about.body'))
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </header>
      <div style="max-width: 68ch; white-space: pre-wrap">{{ body }}</div>
    </div>
  </div>
</template>
