/** 首页区块进入视口后只播放一次显现。先加 will-reveal，避免脚本失败时内容被藏住。 */
export function useScrollReveal(source?: MaybeRefOrGetter<unknown>) {
  let io: IntersectionObserver | null = null

  function bind() {
    for (const container of document.querySelectorAll<HTMLElement>('[data-reveal-blocks]')) {
      for (const child of container.children) {
        if (child instanceof HTMLElement && !child.hasAttribute('data-reveal')) {
          child.setAttribute('data-reveal', '')
        }
      }
    }

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      nodes.forEach((el) => el.classList.add('is-revealed'))
      return
    }

    if (!io) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            entry.target.classList.add('is-revealed')
            io?.unobserve(entry.target)
          }
        },
        { threshold: 0.14, rootMargin: '0px 0px -10% 0px' },
      )
    }

    for (const el of nodes) {
      if (el.classList.contains('is-revealed')) continue
      el.classList.add('will-reveal')
      io.observe(el)
    }
  }

  onMounted(() => {
    bind()
  })

  if (source) {
    watch(
      () => toValue(source),
      () => {
        nextTick(bind)
      },
    )
  }

  onBeforeUnmount(() => io?.disconnect())
}
