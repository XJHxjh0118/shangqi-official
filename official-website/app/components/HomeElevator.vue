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

function pickActive() {
  if (locking.value) return
  const line = window.innerHeight * 0.35
  let current = props.items[0]?.id || ''
  for (const item of props.items) {
    const el = document.getElementById(item.id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.top <= line && rect.bottom > line) current = item.id
  }
  if (current) activeId.value = current
}

function onScroll() {
  updateProgress()
  pickActive()
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (lockTimer) clearTimeout(lockTimer)
})

watch(
  () => props.items.map((item) => item.id).join(),
  (ids) => {
    if (!ids.includes(activeId.value)) {
      activeId.value = props.items[0]?.id || ''
    }
    nextTick(pickActive)
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
