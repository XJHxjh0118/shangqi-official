<script setup lang="ts">
type ElevatorItem = {
  id: string
  label: string
}

const props = defineProps<{
  items: ElevatorItem[]
}>()

const { t } = useI18n()
const activeId = ref(props.items[0]?.id || '')
const progress = ref(0)
const locking = ref(false)
let lockTimer: ReturnType<typeof setTimeout> | null = null
let io: IntersectionObserver | null = null

const onHero = computed(() => activeId.value === 'home-hero')

function updateProgress() {
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}

function go(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  locking.value = true
  activeId.value = id
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  if (lockTimer) clearTimeout(lockTimer)
  lockTimer = setTimeout(() => {
    locking.value = false
  }, 1200)
}

function observeItems() {
  io?.disconnect()
  io = new IntersectionObserver(
    (entries) => {
      if (locking.value) return
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
      const top = visible[0]?.target.id
      if (top) activeId.value = top
    },
    {
      rootMargin: '-28% 0px -52% 0px',
      threshold: [0.1, 0.25, 0.5],
    },
  )

  for (const item of props.items) {
    const el = document.getElementById(item.id)
    if (el) io.observe(el)
  }
}

onMounted(() => {
  updateProgress()
  window.addEventListener('scroll', updateProgress, { passive: true })
  observeItems()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateProgress)
  io?.disconnect()
  if (lockTimer) clearTimeout(lockTimer)
})

watch(
  () => props.items.map((item) => item.id).join(),
  (ids) => {
    if (!ids.includes(activeId.value)) {
      activeId.value = props.items[0]?.id || ''
    }
    nextTick(observeItems)
  },
)
</script>

<template>
  <nav
    class="elevator"
    :class="{ 'is-on-hero': onHero }"
    :aria-label="t('home.elevator.label')"
  >
    <div class="elevator-rail" aria-hidden="true">
      <span class="elevator-fill" :style="{ transform: `scaleY(${progress})` }" />
    </div>
    <div class="elevator-list">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="elevator-item"
        :class="{ 'is-active': item.id === activeId }"
        :aria-current="item.id === activeId ? 'true' : undefined"
        @click="go(item.id)"
      >
        <span class="elevator-tick" />
        <span class="elevator-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
