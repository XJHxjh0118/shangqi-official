<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { siteName } = useSiteSettings()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="p-footer">
    <div class="p-footer-inner">
      <div>
        <strong style="color: #fff">{{ siteName || t('brand.name') }}</strong>
        <p style="margin: 8px 0 0">{{ t('footer.portal') }}</p>
      </div>
      <div>
        <NuxtLink :to="localePath('/portal/products')">{{ t('nav.products') }}</NuxtLink>
        <NuxtLink :to="localePath('/portal/contact')">{{ t('nav.contact') }}</NuxtLink>
        <NuxtLink :to="localePath('/portal/inquiry')">{{ t('nav.inquiry') }}</NuxtLink>
        <p style="margin: 10px 0 0">
          © {{ year }} {{ siteName || t('brand.name') }}. {{ t('footer.rights') }}
        </p>
      </div>
    </div>
  </footer>
</template>
