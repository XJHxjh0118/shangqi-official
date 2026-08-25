<script setup lang="ts">
import { GEO_AREA_LABELS } from '~/utils/geo'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const year = new Date().getFullYear()
const { siteName, footerText, settings } = useSiteSettings()
const geoAreas = computed(() =>
  locale.value === 'en' ? GEO_AREA_LABELS.en : GEO_AREA_LABELS.zh,
)
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <p>{{ siteName || t('brand.full') }}</p>
          <p>{{ footerText || t('footer.portal') }}</p>
        </div>
        <nav>
          <NuxtLink :to="localePath('/products')">{{ t('nav.products') }}</NuxtLink>
          <NuxtLink :to="localePath('/about')">{{ t('nav.about') }}</NuxtLink>
          <NuxtLink :to="localePath('/contact')">{{ t('nav.contact') }}</NuxtLink>
        </nav>
        <nav>
          <NuxtLink :to="localePath('/inquiry')">{{ t('nav.inquiry') }}</NuxtLink>
          <NuxtLink :to="localePath('/login')">{{ t('nav.account') }}</NuxtLink>
          <a v-if="settings?.contactEmail" :href="'mailto:' + settings.contactEmail">
            {{ settings.contactEmail }}
          </a>
        </nav>
      </div>
      <p class="footer-geo">
        {{ t('footer.regions') }}：{{ geoAreas.join(' · ') }}
      </p>
      <p class="copyright">
        © {{ year }} {{ siteName || t('brand.name') }}. {{ t('footer.rights') }}.
      </p>
    </div>
  </footer>
</template>
