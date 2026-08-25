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
const scrolled = ref(false)

const isHome = computed(() => String(route.name || '').startsWith('index'))
const onHero = computed(() => isHome.value && !scrolled.value)

const links = computed(() => [
  { to: localePath('/'), label: t('nav.home') },
  { to: localePath('/products'), label: t('nav.products') },
  { to: localePath('/about'), label: t('nav.about') },
  { to: localePath('/contact'), label: t('nav.contact') },
])

const toolLinks = computed(() => [
  { to: localePath('/inquiry'), label: t('nav.inquiry') },
  {
    to: localePath(isLoggedIn.value ? '/account' : '/login'),
    label: t('nav.account'),
  },
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
    nextTick(onScroll)
  },
)

watch(open, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) window.addEventListener('keydown', onMenuKeydown)
  else window.removeEventListener('keydown', onMenuKeydown)
})

function closeMenu() {
  open.value = false
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

function onScroll() {
  const hero = document.getElementById('home-hero')
  if (!isHome.value || !hero) {
    scrolled.value = window.scrollY > 24
    return
  }
  const span = hero.offsetHeight - window.innerHeight
  scrolled.value = window.scrollY >= Math.max(1, span)
}

function onViewportChange() {
  if (window.innerWidth >= 768) open.value = false
  onScroll()
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('orientationchange', onViewportChange)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onMenuKeydown)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('orientationchange', onViewportChange)
})
</script>

<template>
  <header class="site-header" :class="{ 'is-hero': onHero, 'is-menu-open': open }">
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
          :aria-expanded="open"
          @click="open = !open"
        >
          <PhX v-if="open" :size="20" />
          <PhList v-else :size="20" />
        </button>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="menu-veil">
      <nav
        v-if="open"
        class="menu-overlay"
        :aria-label="t('common.menu')"
      >
        <div class="menu-overlay-chrome">
          <div class="container header-bar">
            <NuxtLink class="brand" :to="localePath('/')" prefetch @click="closeMenu">
              <img
                v-if="settings?.logoUrl"
                :src="settings.logoUrl"
                :alt="siteName"
                width="32"
                height="32"
              />
              <span>{{ siteName || t('brand.name') }}</span>
            </NuxtLink>
            <button
              class="icon-btn menu-overlay-close"
              type="button"
              :aria-label="t('common.close')"
              @click="closeMenu"
            >
              <PhX :size="20" />
            </button>
          </div>
        </div>
        <div class="container menu-overlay-inner">
          <div class="menu-overlay-primary">
            <NuxtLink
              v-for="(link, i) in links"
              :key="link.to"
              class="menu-overlay-link"
              :to="link.to"
              :style="{ '--i': i }"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
          <div class="menu-overlay-tools">
            <NuxtLink
              v-for="(link, i) in toolLinks"
              :key="link.to"
              class="menu-overlay-tool"
              :to="link.to"
              :style="{ '--i': links.length + i }"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </nav>
    </Transition>
  </Teleport>
</template>
