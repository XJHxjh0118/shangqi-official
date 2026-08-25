export function useHomeHeroProgress() {
  return useState('home-hero-progress', () => 0)
}

const LERP_TAU = 8
const SNAP = 0.002

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useStickyHeroProgress(container: Ref<HTMLElement | null>) {
  const progress = useHomeHeroProgress()
  const visual = ref(0)

  let current = 0
  let raf = 0
  let lastTs = 0

  function getProgress() {
    const el = container.value
    if (!el) return 0
    const span = el.offsetHeight - window.innerHeight
    if (span <= 0) return 0
    return Math.min(1, Math.max(0, window.scrollY / span))
  }

  function measure() {
    const p = getProgress()
    progress.value = p
  }

  function tick(now: number) {
    const dt = Math.min(0.1, lastTs ? (now - lastTs) / 1000 : 0.016)
    lastTs = now
    const target = getProgress()
    progress.value = target
    if (prefersReducedMotion()) {
      current = target
    } else {
      current += (target - current) * (1 - Math.exp(-dt * LERP_TAU))
      if (Math.abs(target - current) < SNAP) current = target
    }
    visual.value = current
    raf = requestAnimationFrame(tick)
  }

  onMounted(() => {
    measure()
    visual.value = progress.value
    current = progress.value
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', measure)
    window.removeEventListener('orientationchange', measure)
    progress.value = 0
  })

  return { progress, visual }
}
