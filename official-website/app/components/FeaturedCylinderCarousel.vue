<script setup lang="ts">
import type { Product } from '~/data/products'
import { getLocalized, vehicleSummary } from '~/data/products'

const props = defineProps<{
  products: Product[]
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const CARD_RATIO = 4 / 3
const PERSPECTIVE = 1350
const THICKNESS = [-1.25, 0, 1.25] as const
const MAX_CARDS = 7
const LAST_LAYER = THICKNESS.length - 1
const AUTO_SPEED = 0.11
const SEEK_RATE = 9
const MOUSE_RATE = 10

const sceneRef = ref<HTMLElement | null>(null)
const cardW = ref(320)
const cardH = ref(240)
const frameId = { current: 0 }
const progress = { current: 0 }
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }
const reducedMotion = { current: false }
const canHover = { current: false }
const inView = { current: true }
const pageVisible = { current: true }
const seekTarget = { current: null as number | null }
const resumeAt = { current: 0 }
const pausedOnCenter = { current: false }
let lastTime = 0
let paintedActive = -1
let cardNodes: HTMLElement[] = []
let io: IntersectionObserver | null = null
let hoverMq: MediaQueryList | null = null

const cards = computed(() => props.products.slice(0, MAX_CARDS))

function productName(product: Product) {
  return getLocalized(product.name, locale.value)
}

function productIntro(product: Product) {
  const desc = getLocalized(product.description, locale.value).trim()
  if (desc && desc !== '—') return desc
  const summary = vehicleSummary(product.vehicles, locale.value, 2)
  if (!summary.text) return ''
  if (!summary.extra) return summary.text
  return `${summary.text} ${t('products.moreFitment', { n: summary.extra })}`
}

function productMedia(product: Product) {
  return product.promoVideo || product.video || ''
}

function isCoreLayer(layerIdx: number) {
  return layerIdx !== 0 && layerIdx !== LAST_LAYER
}

function faceTransform(zOffset: number, isBack: boolean) {
  return isBack
    ? `translateZ(${zOffset}px) rotateY(180deg)`
    : `translateZ(${zOffset}px)`
}

function wrapIndex(value: number, count: number) {
  if (!count) return 0
  return ((Math.round(value) % count) + count) % count
}

function wrapUnit(value: number, count: number) {
  if (!count) return 0
  return ((value % count) + count) % count
}

function updateMetrics() {
  const w = window.innerWidth
  const h = window.innerHeight
  let nextW = Math.round(w * 0.18 + 140)
  nextW = Math.round(nextW * Math.min(1, Math.max(0.65, h / 850)))
  nextW = Math.min(380, Math.max(168, nextW))
  cardW.value = nextW
  cardH.value = Math.round(nextW / CARD_RATIO)
}

function onMouseMove(e: MouseEvent) {
  if (!canHover.current) return
  const rx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
  const ry = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
  mouse.targetX = Math.max(-1, Math.min(1, rx))
  mouse.targetY = Math.max(-1, Math.min(1, ry))
}

function onMouseLeave() {
  mouse.targetX = 0
  mouse.targetY = 0
}

function syncHoverCapability() {
  const next = Boolean(hoverMq?.matches)
  canHover.current = next
  if (!next) {
    mouse.targetX = 0
    mouse.targetY = 0
    pausedOnCenter.current = false
  }
}

function onVisibility() {
  pageVisible.current = document.visibilityState === 'visible'
  if (!pageVisible.current) lastTime = 0
}

function isCurrentCard(index: number) {
  return wrapIndex(progress.current, cards.value.length) === index
}

function onCardEnter(index: number) {
  if (!canHover.current || !isCurrentCard(index)) return
  pausedOnCenter.current = true
}

function onCardLeave() {
  if (!canHover.current || !pausedOnCenter.current) return
  pausedOnCenter.current = false
  resumeAt.current = performance.now() + 1000
}

function refreshNodes() {
  cardNodes = Array.from(
    sceneRef.value?.querySelectorAll<HTMLElement>('.cylinder-card') ?? [],
  )
}

function syncDots(index: number) {
  if (paintedActive === index) return
  paintedActive = index
  const dots = sceneRef.value?.querySelectorAll('.featured-cylinder-dot')
  dots?.forEach((dot, i) => {
    const on = i === index
    dot.classList.toggle('is-active', on)
    dot.setAttribute('aria-selected', on ? 'true' : 'false')
  })
}

function expDamp(rate: number, dt: number) {
  return 1 - Math.exp(-rate * dt * 0.001)
}

function selectCard(index: number) {
  const count = cards.value.length
  if (!count) return
  const current = progress.current
  const currentPos = wrapUnit(current, count)
  let delta = index - currentPos
  if (delta > count / 2) delta -= count
  if (delta < -count / 2) delta += count
  seekTarget.current = current + delta
  resumeAt.current = performance.now() + 1800
}

function renderLoop(dt: number) {
  const now = performance.now()
  if (seekTarget.current != null) {
    const delta = seekTarget.current - progress.current
    progress.current += delta * expDamp(SEEK_RATE, dt)
    if (Math.abs(delta) < 0.002) {
      progress.current = seekTarget.current
      seekTarget.current = null
    }
  } else if (
    !pausedOnCenter.current &&
    !reducedMotion.current &&
    inView.current &&
    pageVisible.current &&
    now >= resumeAt.current
  ) {
    progress.current += AUTO_SPEED * dt * 0.001
  }

  if (reducedMotion.current) {
    mouse.targetX = 0
    mouse.targetY = 0
  }

  const mouseK = expDamp(MOUSE_RATE, dt)
  mouse.x += (mouse.targetX - mouse.x) * mouseK
  mouse.y += (mouse.targetY - mouse.y) * mouseK

  const cardCount = cards.value.length
  if (!cardCount) return

  syncDots(wrapIndex(progress.current, cardCount))

  if (!cardNodes.length) refreshNodes()
  if (!cardNodes.length) return

  const width = sceneRef.value?.clientWidth || window.innerWidth
  const widthCard = cardW.value
  const virtualActiveIndex = progress.current
  const halfCount = cardCount / 2
  const gap = 28
  const peekAmount = -55
  const D = PERSPECTIVE
  const xStart1 = widthCard + gap
  const zEnd2 = -60
  const sEnd2 = D / (D - zEnd2)
  const xEnd2 = (width / 2 - peekAmount) / sEnd2 - widthCard / 2
  const zEnd3 = -250
  const sEnd3 = D / (D - zEnd3)
  const xEnd3 = (width / 2 + 100) / sEnd3 + widthCard / 2

  for (let i = 0; i < cardCount; i++) {
    const card = cardNodes[i]
    if (!card) continue

    let offset = i - virtualActiveIndex
    while (offset > halfCount) offset -= cardCount
    while (offset < -halfCount) offset += cardCount

    const absOffset = Math.abs(offset)
    const sign = Math.sign(offset) || 1
    const vis = absOffset > 3 ? 'hidden' : 'visible'
    if (card.style.visibility !== vis) card.style.visibility = vis
    if (vis === 'hidden') continue

    let x = 0
    let z = 0
    let rot = 0

    if (absOffset <= 1) {
      x = sign * (absOffset * xStart1)
      z = 400 + absOffset * (220 - 400)
      rot = absOffset * 132
    } else if (absOffset <= 2) {
      const t = absOffset - 1
      x = sign * (xStart1 + t * (xEnd2 - xStart1))
      z = 220 + t * (zEnd2 - 220)
      rot = 132 + t * 43
    } else {
      const t = Math.min(absOffset - 2, 1)
      x = sign * (xEnd2 + t * (xEnd3 - xEnd2))
      z = zEnd2 + t * (zEnd3 - zEnd2)
      rot = 175 + t * 20
    }

    const centerFactor = Math.max(0, 1 - absOffset)
    const totalRotY = -sign * rot + mouse.x * 12 * centerFactor
    const totalRotX = -mouse.y * 9 * centerFactor
    const zIndex = String(Math.round(z))
    if (card.style.zIndex !== zIndex) card.style.zIndex = zIndex
    card.style.transform = `translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${totalRotY.toFixed(2)}deg) rotateX(${totalRotX.toFixed(2)}deg)`
  }
}

function tick(now: number) {
  const dt = lastTime ? Math.min(33, now - lastTime) : 16.67
  lastTime = now
  if (pageVisible.current) renderLoop(dt)
  else lastTime = 0
  frameId.current = requestAnimationFrame(tick)
}

watch(
  () => cards.value.length,
  () => {
    paintedActive = -1
    nextTick(refreshNodes)
  },
)

onMounted(() => {
  reducedMotion.current = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  updateMetrics()
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseleave', onMouseLeave)
  window.addEventListener('resize', updateMetrics)
  document.addEventListener('visibilitychange', onVisibility)

  io = new IntersectionObserver(
    ([entry]) => {
      inView.current = Boolean(entry?.isIntersecting)
    },
    { threshold: 0.12 },
  )
  if (sceneRef.value) io.observe(sceneRef.value)

  nextTick(() => {
    refreshNodes()
    frameId.current = requestAnimationFrame(tick)
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId.current)
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('resize', updateMetrics)
  document.removeEventListener('visibilitychange', onVisibility)
  io?.disconnect()
})
</script>

<template>
  <div
    v-if="cards.length"
    ref="sceneRef"
    class="featured-cylinder"
    :style="{
      '--card-w': `${cardW}px`,
      '--card-h': `${cardH}px`,
    }"
    :aria-label="t('home.featuredTitle')"
  >
    <div class="featured-cylinder-space">
      <div class="featured-cylinder-stage">
        <div
          v-for="(product, i) in cards"
          :key="product.id"
          class="cylinder-card"
          :style="{ width: `${cardW}px`, height: `${cardH}px` }"
          @pointerenter="onCardEnter(i)"
          @pointerleave="onCardLeave"
        >
          <template v-for="(zOffset, layerIdx) in THICKNESS" :key="layerIdx">
            <div
              v-if="isCoreLayer(layerIdx)"
              class="cylinder-slice cylinder-slice-core"
              :style="{ transform: `translateZ(${zOffset}px)` }"
            />
            <div
              v-else
              class="cylinder-slice"
              :class="
                layerIdx === 0
                  ? 'cylinder-slice-back'
                  : 'cylinder-slice-front'
              "
              :style="{ transform: faceTransform(zOffset, layerIdx === 0) }"
            >
              <video
                v-if="productMedia(product)"
                :src="productMedia(product)"
                autoplay
                loop
                muted
                playsinline
                preload="metadata"
              />
              <img
                v-else
                :src="product.previewImages[0] || product.images[0]"
                alt=""
                width="640"
                height="480"
                decoding="async"
              />
              <div class="cylinder-caption">
                <p class="cylinder-caption-name">{{ productName(product) }}</p>
                <p v-if="productIntro(product)" class="cylinder-caption-intro">
                  {{ productIntro(product) }}
                </p>
              </div>
            </div>
          </template>
          <NuxtLink
            class="cylinder-card-hit"
            :to="localePath(`/products/${product.slug}`)"
            :aria-label="productName(product)"
            prefetch
          />
        </div>
      </div>
    </div>

    <div
      class="featured-cylinder-dots"
      role="tablist"
      :aria-label="t('home.featuredDots')"
    >
      <button
        v-for="(product, i) in cards"
        :key="product.id"
        type="button"
        role="tab"
        class="featured-cylinder-dot"
        :class="{ 'is-active': i === 0 }"
        :aria-label="productName(product)"
        :aria-selected="i === 0"
        @click="selectCard(i)"
      />
    </div>
  </div>
</template>
