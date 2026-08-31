import type { Ref } from 'vue'

/** 宫格卡片：鼠标移入时图片随指针平滑平移，露出更多画面 */
export function useGridImagePan(
  container: Ref<HTMLElement | null>,
  enabled: Ref<boolean>,
) {
  const reducedMotion = usePreferredReducedMotion()
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')

  let frame = 0
  let targetX = 0
  let targetY = 0
  let currentX = 0
  let currentY = 0
  let tracking = false

  function isEnabled() {
    return (
      enabled.value &&
      canHover.value &&
      reducedMotion.value !== 'reduce' &&
      import.meta.client
    )
  }

  function applyTransform(el: HTMLElement) {
    el.style.setProperty('--pan-x', `${currentX.toFixed(2)}%`)
    el.style.setProperty('--pan-y', `${currentY.toFixed(2)}%`)
  }

  function tick() {
    const el = container.value
    if (!el) {
      frame = 0
      return
    }

    const easing = tracking ? 0.14 : 0.18
    currentX += (targetX - currentX) * easing
    currentY += (targetY - currentY) * easing
    applyTransform(el)

    const settled =
      Math.abs(targetX - currentX) <= 0.02 &&
      Math.abs(targetY - currentY) <= 0.02

    if (settled) {
      if (!tracking) {
        currentX = 0
        currentY = 0
        applyTransform(el)
      }
      frame = 0
      return
    }

    frame = requestAnimationFrame(tick)
  }

  function startLoop() {
    if (frame) return
    frame = requestAnimationFrame(tick)
  }

  function stopLoop() {
    if (!frame) return
    cancelAnimationFrame(frame)
    frame = 0
  }

  function onPointerMove(event: PointerEvent) {
    if (!isEnabled()) return
    const el = container.value
    if (!el) return

    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const nx = (event.clientX - rect.left) / rect.width
    const ny = (event.clientY - rect.top) / rect.height
    const intensity = 7.5

    tracking = true
    targetX = (0.5 - nx) * intensity
    targetY = (0.5 - ny) * intensity * 0.72
    el.classList.add('is-panning')
    startLoop()
  }

  function onPointerLeave() {
    const el = container.value
    if (!el) return

    tracking = false
    targetX = 0
    targetY = 0
    el.classList.remove('is-panning')
    startLoop()
  }

  onMounted(() => {
    const el = container.value
    if (!el) return
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerleave', onPointerLeave)
  })

  onBeforeUnmount(() => {
    stopLoop()
    const el = container.value
    if (!el) return
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerleave', onPointerLeave)
  })
}
