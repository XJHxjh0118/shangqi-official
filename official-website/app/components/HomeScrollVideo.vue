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

const s1Opacity = computed(() => {
  const p = progress.value
  return p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.08)
})

const s2Opacity = computed(() => {
  const p = progress.value
  if (p < 0.32) return 0
  if (p < 0.4) return (p - 0.32) / 0.08
  if (p < 0.55) return 1
  return Math.max(0, 1 - (p - 0.55) / 0.08)
})

const s3Opacity = computed(() => {
  const p = progress.value
  if (p < 0.67) return 0
  if (p < 0.75) return (p - 0.67) / 0.08
  return 1
})

const s1In = computed(() => s1Opacity.value > 0.3)
const s2In = computed(() => s2Opacity.value > 0.3)
const s3In = computed(() => s3Opacity.value > 0.3)

function slideOpacity(index: number) {
  const n = props.slides.length
  if (n <= 1) return 1
  const t = visual.value * (n - 1)
  return Math.max(0, 1 - Math.abs(t - index))
}

const activeIndex = computed(() => {
  const n = props.slides.length
  if (n <= 1) return 0
  return Math.round(visual.value * (n - 1))
})

const activeSlide = computed(() => props.slides[activeIndex.value] || props.slides[0])
const activeLink = computed(() => activeSlide.value?.linkUrl?.trim() || '')
const isHttpBannerLink = computed(() => isHttpUrl(activeLink.value))
const httpBannerHref = computed(() => toHttpHref(activeLink.value))

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
</script>

<template>
  <section
    id="home-hero"
    ref="track"
    class="scroll-hero-track"
    :aria-label="t('home.scrollHero.s1Title')"
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
          class="scroll-scene scroll-scene-1"
          :class="{ 'is-interactive': s1In }"
          :style="{ opacity: s1Opacity }"
        >
          <div class="scroll-scene-1-copy">
            <h1
              class="scroll-stagger"
              :class="{ 'is-in': s1In }"
            >
              {{ t('home.scrollHero.s1Title') }}
            </h1>
            <p
              class="scroll-stagger"
              :class="{ 'is-in': s1In }"
              style="transition-delay: 150ms"
            >
              {{ t('home.scrollHero.s1Sub') }}
            </p>
          </div>
          <button
            class="scroll-orb scroll-orb-tr scroll-stagger"
            :class="{ 'is-in': s1In }"
            style="transition-delay: 300ms"
            type="button"
            :aria-label="t('home.scrollHero.next')"
            @click="scrollAlong(0.22)"
          >
            <PhArrowRight :size="18" weight="regular" />
          </button>
        </div>

        <div
          class="scroll-scene scroll-scene-2"
          :class="{ 'is-interactive': s2In }"
          :style="{ opacity: s2Opacity }"
        >
          <h2
            class="scroll-stagger"
            :class="{ 'is-in': s2In }"
          >
            {{ t('home.scrollHero.s2Lead') }}
            <span class="scroll-em-80">{{ t('home.scrollHero.s2Mid') }}</span>
            {{ ' ' }}
            <span class="scroll-em-50">{{ t('home.scrollHero.s2Tail') }}</span>
          </h2>
          <div class="scroll-scene-2-tools">
            <button
              class="scroll-orb scroll-stagger"
              :class="{ 'is-in': s2In }"
              style="transition-delay: 200ms"
              type="button"
              :aria-label="t('home.scrollHero.next')"
              @click="scrollAlong(0.22)"
            >
              <PhArrowDown :size="18" weight="regular" />
            </button>
            <div
              class="scroll-dots scroll-stagger"
              :class="{ 'is-in': s2In }"
              style="transition-delay: 350ms"
              aria-hidden="true"
            >
              <span
                v-for="(_, i) in slides"
                :key="`dot-${i}`"
                :class="{ 'is-active': i === activeIndex }"
              />
              <template v-if="!slides.length">
                <span :class="{ 'is-active': s1In || (!s2In && !s3In) }" />
                <span :class="{ 'is-active': s2In }" />
                <span :class="{ 'is-active': s3In }" />
              </template>
            </div>
            <button
              class="scroll-orb scroll-orb-sm scroll-stagger"
              :class="{ 'is-in': s2In }"
              style="transition-delay: 500ms"
              type="button"
              :aria-label="t('home.scrollHero.top')"
              @click="scrollToProgress(0)"
            >
              <PhCaretUp :size="16" weight="regular" />
            </button>
          </div>
        </div>

        <div
          class="scroll-scene scroll-scene-3"
          :class="{ 'is-interactive': s3In }"
          :style="{ opacity: s3Opacity }"
        >
          <div class="scroll-scene-3-copy">
            <p
              class="scroll-eyebrow scroll-stagger"
              :class="{ 'is-in': s3In }"
            >
              {{ t('home.scrollHero.s3Eyebrow') }}
            </p>
            <h2
              class="scroll-stagger"
              :class="{ 'is-in': s3In }"
              style="transition-delay: 150ms"
            >
              {{ t('home.scrollHero.s3TitleA') }}<br />
              {{ t('home.scrollHero.s3TitleB') }}
            </h2>
            <div
              class="scroll-cta scroll-stagger"
              :class="{ 'is-in': s3In }"
              style="transition-delay: 300ms"
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
        </div>
      </div>
    </div>
  </section>
</template>
