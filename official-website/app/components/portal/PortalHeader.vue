<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { locales, locale } = useI18n()
const { siteName, settings } = useSiteSettings()
const { count } = useInquiryList()
const { count: favCount } = useFavorites()
const { isLoggedIn } = useAuth()

const open = ref(false)

const links = computed(() => [
  { to: localePath('/portal'), label: t('nav.home') },
  { to: localePath('/portal/products'), label: t('nav.products') },
  { to: localePath('/portal/contact'), label: t('nav.contact') },
  { to: localePath('/portal/about'), label: t('nav.about') },
])

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>).filter(
    (l) => l.code !== locale.value,
  ),
)

watch(
  () => useRoute().fullPath,
  () => {
    open.value = false
  },
)
</script>

<template>
  <header class="p-header">
    <NuxtLink class="p-brand" :to="localePath('/portal')">
      <span v-if="settings?.logoUrl" class="p-brand-mark" style="padding: 0; overflow: hidden">
        <img :src="settings.logoUrl" :alt="siteName" width="38" height="38" />
      </span>
      <span v-else class="p-brand-mark">S</span>
      <span>
        <strong>{{ siteName || t('brand.name') }}</strong>
        <small>{{ t('template.portalTag') }}</small>
      </span>
    </NuxtLink>

    <nav class="p-nav" :class="{ 'is-open': open }" :aria-label="t('nav.home')">
      <NuxtLink v-for="link in links" :key="link.to" :to="link.to">
        {{ link.label }}
      </NuxtLink>
    </nav>

    <div class="p-header-actions">
      <NuxtLink class="p-chip" :to="localePath('/portal/favorites')" :title="t('nav.favorites')">
        <span>{{ t('nav.favorites') }}</span>
        <b v-if="favCount">{{ favCount }}</b>
      </NuxtLink>
      <NuxtLink class="p-chip" :to="localePath('/portal/inquiry')" :title="t('nav.inquiry')">
        <span>{{ t('nav.inquiry') }}</span>
        <b v-if="count">{{ count }}</b>
      </NuxtLink>
      <NuxtLink
        class="p-chip"
        :to="localePath(isLoggedIn ? '/account' : '/login')"
        :title="t('nav.account')"
      >
        <span>{{ t('nav.account') }}</span>
      </NuxtLink>
      <NuxtLink
        v-for="l in availableLocales"
        :key="l.code"
        class="p-chip"
        :to="switchLocalePath(l.code as 'zh' | 'en')"
      >
        {{ l.code === 'zh' ? '中文' : 'EN' }}
      </NuxtLink>
      <button
        class="p-chip p-mobile-toggle"
        type="button"
        :aria-label="t('common.menu')"
        @click="open = !open"
      >
        {{ open ? t('common.close') : t('common.menu') }}
      </button>
    </div>
  </header>
</template>
