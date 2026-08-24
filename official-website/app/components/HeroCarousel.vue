<script setup lang="ts">
import type { HeroSlide } from '~/composables/useHomePageData'

const props = withDefaults(
  defineProps<{
    slides: HeroSlide[]
    interval?: number
  }>(),
  { interval: 6000 },
)

const { t } = useI18n()
const localePath = useLocalePath()
const index = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function go(i: number) {
  if (!props.slides.length) return
  index.value = (i + props.slides.length) % props.slides.length
}

function start() {
  stop()
  if (props.slides.length < 2) return
  timer = setInterval(() => go(index.value + 1), props.interval)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.slides.length,
  () => {
    index.value = 0
    start()
  },
)

onMounted(start)
onBeforeUnmount(stop)

const active = computed(() => props.slides[index.value] || props.slides[0])
</script>

<template>
  <section
    class="hero"
    @mouseenter="stop"
    @mouseleave="start"
    @focusin="stop"
    @focusout="start"
  >
    <div
      v-for="(slide, i) in slides"
      :key="`${slide.image}-${i}`"
      class="hero-slide"
      :class="{ 'is-active': i === index }"
    >
      <HeroBgImage
        :src="slide.image"
        :alt="slide.title"
        :eager="i === 0"
      />
      <div class="hero-scrim" />
    </div>

    <div v-if="active" class="hero-copy">
      <div class="container">
        <h1>{{ active.title || t('home.heroTitle') }}</h1>
        <p>{{ t('home.heroDesc') }}</p>
        <div class="hero-actions">
          <NuxtLink
            class="btn btn-primary btn-on-hero"
            :to="active.linkUrl || localePath('/products')"
            prefetch
          >
            {{ t('home.ctaExplore') }}
          </NuxtLink>
          <NuxtLink
            class="btn btn-ghost btn-on-hero"
            :to="localePath('/inquiry')"
            prefetch
          >
            {{ t('home.ctaInquiry') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div v-if="slides.length > 1" class="hero-dots">
      <button
        v-for="(_, i) in slides"
        :key="i"
        type="button"
        class="hero-dot"
        :class="{ 'is-active': i === index }"
        :aria-label="String(i + 1)"
        @click="go(i)"
      />
    </div>
  </section>
</template>
