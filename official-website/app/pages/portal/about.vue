<script setup lang="ts">
import { isRichHtml, prepareRichHtml } from '~/utils/richHtml'

definePageMeta({
  layout: 'portal',
})

const { t } = useI18n()
const { apiBase } = useApi()
const { aboutTitle, aboutBody, seoDescription } = useSiteSettings()

const { title, description } = usePageSeoMeta('about', {
  title: () => aboutTitle.value || t('about.title'),
  description: () => seoDescription.value || t('about.desc'),
})
const body = computed(() => aboutBody.value || t('about.body'))
const bodyIsHtml = computed(() => isRichHtml(body.value))
const bodyHtml = computed(() =>
  bodyIsHtml.value ? prepareRichHtml(body.value, apiBase) : '',
)
</script>

<template>
  <div class="p-section">
    <div class="p-section-head">
      <div class="p-eyebrow">About</div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
    <div
      v-if="bodyIsHtml"
      class="p-card"
      style="padding: 24px; line-height: 1.75"
      v-html="bodyHtml"
    />
    <div v-else class="p-card" style="padding: 24px; line-height: 1.75; white-space: pre-wrap">
      {{ body }}
    </div>
  </div>
</template>
