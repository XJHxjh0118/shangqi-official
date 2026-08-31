<script setup lang="ts">
import { PhArrowDown, PhArrowRight, PhCaretUp } from '@phosphor-icons/vue'
import type { HeroSlide } from '~/composables/useHomePageData'

const props = defineProps<{
  slides: HeroSlide[]
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const track = ref<HTMLElement | null>(null)
const { progress, visual } = useStickyHeroProgress(track)

const slideCount = computed(() => props.slides.length)

/** 每个 banner 约一屏滚动距离，数量变化时轨道高度跟着变 */
const trackHeightVh = computed(() => {
  const n = Math.max(1, slideCount.value)
  return (n + 1) * 100
})

function slideOpacity(index: number) {
  const n = slideCount.value
  if (n <= 1) return 1
  const t = visual.value * (n - 1)
  return Math.max(0, 1 - Math.abs(t - index))
}

function isSceneIn(index: number) {
  return slideOpacity(index) > 0.3
}

const activeIndex = computed(() => {
  const n = slideCount.value
  if (n <= 1) return 0
  return Math.round(visual.value * (n - 1))
})

const activeSlide = computed(() => props.slides[activeIndex.value] || props.slides[0])
const activeLink = computed(() => activeSlide.value?.linkUrl?.trim() || '')
const isHttpBannerLink = computed(() => isHttpUrl(activeLink.value))
const httpBannerHref = computed(() => toHttpHref(activeLink.value))

const stepSize = computed(() => {
  const n = slideCount.value
  if (n <= 1) return 1
  return 1 / (n - 1)
})

function isControlTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('a, button'))
}

function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith('//')
}

function toHttpHref(url: string) {
  return url.startsWith('//') ? `https:${url}` : url
}

function openInNewWindow(href: string) {
  const a = document.createElement('a')
  a.href = href
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.click()
}

async function openBannerLink(url: string) {
  if (isHttpUrl(url) || /^(mailto:|tel:)/i.test(url)) {
    openInNewWindow(isHttpUrl(url) ? toHttpHref(url) : url)
    return
  }

  if (!url.startsWith('/')) {
    await navigateTo(url)
    return
  }

  const parsed = new URL(url, window.location.origin)
  let pathname = parsed.pathname || '/'
  for (const prefix of ['/en', '/zh']) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      pathname = pathname.slice(prefix.length) || '/'
      break
    }
  }

  await navigateTo({
    path: localePath(pathname),
    query: Object.fromEntries(parsed.searchParams),
    hash: parsed.hash || undefined,
  })
}

async function onHeroClick(e: MouseEvent | KeyboardEvent) {
  if (!activeLink.value || isControlTarget(e.target)) return
  await openBannerLink(activeLink.value)
}

function span() {
  const el = track.value
  if (!el) return 0
  return Math.max(0, el.offsetHeight - window.innerHeight)
}

function scrollToProgress(p: number) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: Math.max(0, Math.min(span(), p * span())),
    behavior: reduced ? 'auto' : 'smooth',
  })
}

function scrollAlong(delta: number) {
  scrollToProgress(Math.min(1, progress.value + delta))
}

function goNext() {
  scrollAlong(stepSize.value * 0.92)
}
</script>

<template>
  <section
    id="home-hero"
    ref="track"
    class="scroll-hero-track"
    :style="{ height: `${trackHeightVh}vh` }"
    :aria-label="activeSlide?.title || t('home.heroTitle')"
  >
    <div
      class="scroll-hero-sticky"
      :class="{ 'is-linked': Boolean(activeLink) }"
      :role="activeLink && !isHttpBannerLink ? 'link' : undefined"
      :tabindex="activeLink && !isHttpBannerLink ? 0 : undefined"
      :aria-label="activeLink && !isHttpBannerLink ? activeSlide?.title : undefined"
      @click="onHeroClick"
      @keydown.enter="onHeroClick"
      @keydown.space.prevent="onHeroClick"
    >
      <a
        v-if="isHttpBannerLink"
        class="scroll-hero-ext-link"
        :href="httpBannerHref"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="activeSlide?.title || t('home.ctaExplore')"
      />
      <div v-if="slides.length" class="scroll-hero-slides">
        <div
          v-for="(slide, i) in slides"
          :key="`${slide.image}-${i}`"
          class="scroll-hero-slide"
          :style="{ opacity: slideOpacity(i) }"
        >
          <HeroBgImage
            :src="slide.image"
            :alt="slide.title"
            :eager="i === 0"
          />
        </div>
      </div>

      <div class="scroll-hero-overlay">
        <div
          v-for="(slide, i) in slides"
          :key="`scene-${slide.image}-${i}`"
          class="scroll-scene scroll-scene-banner"
          :class="{ 'is-interactive': isSceneIn(i) }"
          :style="{ opacity: slideOpacity(i) }"
        >
          <div class="scroll-scene-banner-copy">
            <h1
              class="scroll-stagger"
              :class="{ 'is-in': isSceneIn(i) }"
            >
              {{ slide.title }}
            </h1>
            <div
              v-if="i === slides.length - 1"
              class="scroll-cta scroll-stagger"
              :class="{ 'is-in': isSceneIn(i) }"
              style="transition-delay: 180ms"
            >
              <NuxtLink class="scroll-cta-label" :to="localePath('/inquiry')">
                {{ t('home.scrollHero.s3Cta') }}
              </NuxtLink>
              <NuxtLink
                class="scroll-orb scroll-orb-fill"
                :to="localePath('/inquiry')"
                :aria-label="t('home.scrollHero.s3Cta')"
              >
                <PhArrowRight :size="16" weight="regular" />
              </NuxtLink>
            </div>
          </div>

          <div class="scroll-scene-2-tools">
            <button
              v-if="i < slides.length - 1"
              class="scroll-orb scroll-stagger"
              :class="{ 'is-in': isSceneIn(i) }"
              style="transition-delay: 120ms"
              type="button"
              :aria-label="t('home.scrollHero.next')"
              @click="goNext"
            >
              <PhArrowDown :size="18" weight="regular" />
            </button>
            <div
              v-if="slides.length > 1"
              class="scroll-dots scroll-stagger"
              :class="{ 'is-in': isSceneIn(i) }"
              style="transition-delay: 220ms"
              aria-hidden="true"
            >
              <span
                v-for="(_, di) in slides"
                :key="`dot-${i}-${di}`"
                :class="{ 'is-active': di === activeIndex }"
              />
            </div>
            <button
              v-if="i > 0"
              class="scroll-orb scroll-orb-sm scroll-stagger"
              :class="{ 'is-in': isSceneIn(i) }"
              style="transition-delay: 320ms"
              type="button"
              :aria-label="t('home.scrollHero.top')"
              @click="scrollToProgress(0)"
            >
              <PhCaretUp :size="16" weight="regular" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
