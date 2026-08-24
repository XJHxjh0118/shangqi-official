<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const statusCode = computed(() => props.error?.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)
const pageTitle = computed(() =>
  isNotFound.value ? t('common.notFoundTitle') : t('common.errorTitle'),
)
const pageDesc = computed(() =>
  isNotFound.value ? t('common.notFoundDesc') : t('common.errorDesc'),
)

useSeoGeo({
  title: pageTitle,
  description: pageDesc,
})
</script>

<template>
  <div class="page">
    <div class="container">
      <p class="product-meta">{{ statusCode }}</p>
      <h1 class="page-head" style="padding-top: 8px">{{ pageTitle }}</h1>
      <p>{{ pageDesc }}</p>
      <p style="margin-top: 24px">
        <NuxtLink class="btn btn-primary" :to="localePath('/')">
          {{ t('common.backHome') }}
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
