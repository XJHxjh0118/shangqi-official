export function useViewTransition() {
  const reducedMotion = usePreferredReducedMotion()

  function withViewTransition(update: () => void) {
    if (
      import.meta.client &&
      reducedMotion.value !== 'reduce' &&
      typeof document !== 'undefined' &&
      'startViewTransition' in document
    ) {
      document.startViewTransition(update)
      return
    }

    update()
  }

  return { withViewTransition }
}
