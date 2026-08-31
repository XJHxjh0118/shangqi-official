<script setup lang="ts">
import { isRichHtml, prepareRichHtml } from '~/utils/richHtml'

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

useScrollReveal(() => [body.value, bodyIsHtml.value])
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head" data-reveal>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </header>
      <div v-if="bodyIsHtml" class="about-body" data-reveal-blocks v-html="bodyHtml" />
      <div v-else class="about-body is-plain" data-reveal-blocks>
        <p>{{ body }}</p>
      </div>
    </div>
  </div>
</template>
