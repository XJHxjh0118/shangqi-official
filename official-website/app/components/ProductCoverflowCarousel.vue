<script setup lang="ts">
import type { Product } from '~/data/products'

const props = defineProps<{
  products: Product[]
}>()

const { t } = useI18n()

const viewportRef = ref<HTMLElement | null>(null)
const cardW = ref(360)
const grabbing = ref(false)
const activeIndex = ref(0)

const progress = { current: 0 }
const display = { current: 0 }
const seekTarget = { current: null as number | null }
const dragging = { current: false }
const moved = { current: false }
const dragOrigin = { x: 0, p: 0 }
const dragPointerId = { current: null as number | null }
const reduced = { current: false }
const frameId = { current: 0 }
let lastTime = 0
let cardNodes: HTMLElement[] = []
let snapTimer: ReturnType<typeof setTimeout> | null = null

const count = computed(() => props.products.length)

function wrapIndex(value: number, total: number) {
  if (!total) return 0
  return ((Math.round(value) % total) + total) % total
}

function shortestOffset(index: number, origin: number, total: number) {
  let offset = index - origin
  if (!total) return 0
  while (offset > total / 2) offset -= total
  while (offset < -total / 2) offset += total
  return offset
}

function expDamp(rate: number, dt: number) {
  return 1 - Math.exp(-rate * dt * 0.001)
}

function updateMetrics() {
  const w = viewportRef.value?.clientWidth || window.innerWidth
  cardW.value = Math.round(
    w < 640
      ? Math.min(300, Math.max(220, w * 0.72))
      : Math.min(480, Math.max(320, w * 0.3)),
  )
  applyTransforms()
}

function refreshNodes() {
  cardNodes = Array.from(
    viewportRef.value?.querySelectorAll<HTMLElement>('.coverflow-item') ?? [],
  )
}

function lerp(abs: number, a: number, b: number, c: number) {
  if (abs <= 1) return a + (b - a) * abs
  if (abs <= 2) return b + (c - b) * (abs - 1)
  return c
}

function applyTransforms() {
  const total = count.value
  if (!total || !cardNodes.length) return

  const origin = display.current
  const spacing1 = cardW.value * 0.82
  const spacing2 = cardW.value * 1.48
  const maxRot = reduced.current ? 0 : 1

  for (let i = 0; i < total; i++) {
    const el = cardNodes[i]
    if (!el) continue

    const offset = shortestOffset(i, origin, total)
    const abs = Math.abs(offset)
    if (abs > 2.7) {
      if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
      continue
    }
    if (el.style.visibility !== 'visible') el.style.visibility = 'visible'

    const sign = Math.sign(offset) || 1
    const x = sign * lerp(abs, 0, spacing1, spacing2)
    const z = lerp(abs, 80, 12, -90)
    const rot = -sign * lerp(abs, 0, 16, 28) * maxRot
    const scale = lerp(abs, 1, 0.88, 0.74)
    const opacity = lerp(abs, 1, 0.72, 0.28)
    const zIndex = String(Math.round(50 - abs * 12))

    if (el.style.zIndex !== zIndex) el.style.zIndex = zIndex
    el.style.opacity = opacity.toFixed(3)
    el.style.transform = `translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`
    el.classList.toggle('is-center', abs < 0.45)
  }

  activeIndex.value = wrapIndex(origin, total)
}

function ensureLoop() {
  if (!frameId.current) {
    lastTime = 0
    frameId.current = requestAnimationFrame(tick)
  }
}

function tick(now: number) {
  const dt = lastTime ? Math.min(33, now - lastTime) : 16.67
  lastTime = now

  if (dragging.current) {
    display.current = progress.current
  } else if (seekTarget.current != null) {
    const delta = seekTarget.current - progress.current
    progress.current += delta * expDamp(reduced.current ? 18 : 11, dt)
    display.current = progress.current
    if (Math.abs(delta) < 0.002) {
      progress.current = seekTarget.current
      display.current = seekTarget.current
      seekTarget.current = null
    }
  }

  applyTransforms()

  if (dragging.current || seekTarget.current != null) {
    frameId.current = requestAnimationFrame(tick)
  } else {
    frameId.current = 0
  }
}

function snapTo(value: number) {
  seekTarget.current = value
  ensureLoop()
}

function step(dir: number) {
  snapTo(Math.round(progress.current) + dir)
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0 || count.value < 2) return
  dragging.current = false
  moved.current = false
  dragPointerId.current = e.pointerId
  dragOrigin.x = e.clientX
  dragOrigin.p = progress.current
}

function onPointerMove(e: PointerEvent) {
  if (dragPointerId.current !== e.pointerId) return
  const dx = e.clientX - dragOrigin.x
  if (!dragging.current) {
    if (Math.abs(dx) < 10) return
    dragging.current = true
    moved.current = true
    grabbing.value = true
    seekTarget.current = null
    viewportRef.value?.setPointerCapture(e.pointerId)
    ensureLoop()
  }
  progress.current = dragOrigin.p - dx / (cardW.value * 0.72)
}

function onPointerUp(e: PointerEvent) {
  if (dragPointerId.current !== e.pointerId) return
  dragPointerId.current = null
  if (!dragging.current) return
  dragging.current = false
  grabbing.value = false
  snapTo(Math.round(progress.current))
}

function onItemClick(e: MouseEvent) {
  if (!moved.current) return
  e.preventDefault()
  e.stopPropagation()
}

function onWheel(e: WheelEvent) {
  if (count.value < 2) return
  if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.2) return
  e.preventDefault()
  progress.current += e.deltaX / (cardW.value * 1.1)
  display.current = progress.current
  applyTransforms()
  if (snapTimer) clearTimeout(snapTimer)
  snapTimer = setTimeout(() => snapTo(Math.round(progress.current)), 80)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    step(-1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    step(1)
  }
}

watch(
  () => count.value,
  async () => {
    progress.current = 0
    display.current = 0
    seekTarget.current = null
    await nextTick()
    refreshNodes()
    updateMetrics()
  },
)

onMounted(async () => {
  reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('resize', updateMetrics)
  await nextTick()
  refreshNodes()
  updateMetrics()
  viewportRef.value?.addEventListener('wheel', onWheel, { passive: false })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId.current)
  window.removeEventListener('resize', updateMetrics)
  viewportRef.value?.removeEventListener('wheel', onWheel)
  if (snapTimer) clearTimeout(snapTimer)
})
</script>

<template>
  <div
    v-if="products.length"
    class="coverflow"
    :class="{ 'is-grabbing': grabbing }"
    :style="{ '--card-w': `${cardW}px` }"
    role="region"
    :aria-roledescription="t('home.coverflowRole')"
    :aria-label="t('home.newTitle')"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div
      ref="viewportRef"
      class="coverflow-viewport"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="coverflow-stage">
        <div
          v-for="(product, i) in products"
          :key="product.id"
          class="coverflow-item"
          :class="{ 'is-center': i === activeIndex }"
          @click.capture="onItemClick"
        >
          <ProductCard :product="product" />
        </div>
      </div>
    </div>
  </div>
</template>
