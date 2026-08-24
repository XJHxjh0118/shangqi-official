<script setup lang="ts">
import { PhList, PhX, PhHeart, PhShoppingCart, PhUser } from '@phosphor-icons/vue'

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()
const { count } = useInquiryList()
const { count: favCount } = useFavorites()
const { siteName, settings } = useSiteSettings()
const { isLoggedIn } = useAuth()
const open = ref(false)

const links = computed(() => [
  { to: localePath('/'), label: t('nav.home') },
  { to: localePath('/products'), label: t('nav.products') },
  { to: localePath('/about'), label: t('nav.about') },
  { to: localePath('/join'), label: t('nav.join') },
])

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>).filter(
    (l) => l.code !== locale.value,
  ),
)

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
</script>

<template>
  <header class="site-header">
    <div class="container header-bar">
      <NuxtLink class="brand" :to="localePath('/')" prefetch>
        <img
          v-if="settings?.logoUrl"
          :src="settings.logoUrl"
          :alt="siteName"
          width="32"
          height="32"
        />
        <span>{{ siteName || t('brand.name') }}</span>
      </NuxtLink>

      <nav class="desktop-nav" :aria-label="t('nav.home')">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          class="nav-link"
          :to="link.to"
          prefetch
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="header-tools">
        <NuxtLink
          class="icon-btn"
          :to="localePath('/favorites')"
          :title="t('nav.favorites')"
        >
          <PhHeart :size="18" weight="regular" />
          <span v-if="favCount" class="badge-count">{{ favCount }}</span>
        </NuxtLink>
        <NuxtLink
          class="icon-btn"
          :to="localePath('/inquiry')"
          :title="t('nav.inquiry')"
        >
          <PhShoppingCart :size="18" weight="regular" />
          <span v-if="count" class="badge-count">{{ count }}</span>
        </NuxtLink>
        <NuxtLink
          class="icon-btn"
          :to="localePath(isLoggedIn ? '/account' : '/login')"
          :title="t('nav.account')"
        >
          <PhUser :size="18" weight="regular" />
        </NuxtLink>
        <NuxtLink
          v-for="l in availableLocales"
          :key="l.code"
          class="lang-link"
          :to="switchLocalePath(l.code as 'zh' | 'en')"
        >
          {{ l.code === 'zh' ? '中文' : 'EN' }}
        </NuxtLink>
        <button
          class="icon-btn mobile-toggle"
          type="button"
          :aria-label="t('common.menu')"
          @click="open = !open"
        >
          <PhX v-if="open" :size="20" />
          <PhList v-else :size="20" />
        </button>
      </div>
    </div>

    <div v-if="open" class="menu-overlay">
      <NuxtLink v-for="link in links" :key="link.to" :to="link.to">
        {{ link.label }}
      </NuxtLink>
      <NuxtLink :to="localePath('/inquiry')">{{ t('nav.inquiry') }}</NuxtLink>
      <NuxtLink :to="localePath(isLoggedIn ? '/account' : '/login')">
        {{ t('nav.account') }}
      </NuxtLink>
    </div>
  </header>
</template>
