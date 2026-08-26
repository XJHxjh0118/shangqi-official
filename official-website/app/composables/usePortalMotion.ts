import type { Ref } from 'vue'

/** 产品卡倾斜 + 金属反光跟随鼠标（对齐原型 prepareMotion） */
export function usePortalCardTilt(el: Ref<HTMLElement | null>) {
  function onPointerMove(event: PointerEvent) {
    const card = el.value
    if (!card) return
    card.classList.add('is-tilting')
    const rect = card.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    card.style.setProperty('--mx', `${x * 100}%`)
    card.style.setProperty('--my', `${y * 100}%`)
    card.style.setProperty('--rx', `${(0.5 - y) * 4.2}deg`)
    card.style.setProperty('--ry', `${(x - 0.5) * 5.2}deg`)
  }

  function onPointerLeave() {
    const card = el.value
    if (!card) return
    card.classList.remove('is-tilting')
    card.style.setProperty('--mx', '50%')
    card.style.setProperty('--my', '22%')
    card.style.setProperty('--rx', '0deg')
    card.style.setProperty('--ry', '0deg')
  }

  onMounted(() => {
    const card = el.value
    if (!card) return
    card.addEventListener('pointermove', onPointerMove)
    card.addEventListener('pointerleave', onPointerLeave)
  })

  onBeforeUnmount(() => {
    const card = el.value
    if (!card) return
    card.removeEventListener('pointermove', onPointerMove)
    card.removeEventListener('pointerleave', onPointerLeave)
  })
}

/** 滚动渐入，对齐原型 reveal-item（进入视口才显示） */
export function usePortalReveal(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined
  let seq = 0

  function ensureObserver() {
    if (observer || !import.meta.client) return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -10% 0px' },
    )
  }

  function refresh() {
    if (!import.meta.client || !root.value) return
    ensureObserver()
    const targets = root.value.querySelectorAll('.p-reveal:not(.is-visible)')
    targets.forEach((element) => {
      const el = element as HTMLElement
      if (el.dataset.revealBound === '1') return
      el.dataset.revealBound = '1'
      el.style.setProperty('--reveal-delay', `${Math.min(seq * 55, 330)}ms`)
      seq += 1
      observer?.observe(el)
    })
  }

  onMounted(() => {
    nextTick(() => refresh())
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = undefined
  })

  return { refresh }
}
