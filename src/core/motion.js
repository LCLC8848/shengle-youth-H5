import { readonly, shallowRef } from 'vue'

const media = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : null
const reduced = shallowRef(Boolean(media?.matches))
function sync(event) { reduced.value = event.matches }
if (media?.addEventListener) media.addEventListener('change', sync)
else media?.addListener(sync)
if (import.meta.hot) import.meta.hot.dispose(() => {
  if (media?.removeEventListener) media.removeEventListener('change', sync)
  else media?.removeListener(sync)
})
export const reducedMotion = readonly(reduced)

// GSAP durations use seconds. Idle delay is independently randomized per element.
export const motion = Object.freeze({
  page: { duration: .6, ease: 'power3.inOut' },
  entry: { duration: .38, stagger: .08, ease: 'power2.out' },
  idle: { duration: 1.6, ease: 'sine.inOut' },
  popUp: { duration: .14, ease: 'power2.out' },
  popDown: { duration: .18, ease: 'power2.inOut' },
  dim: { duration: .16, ease: 'power1.out' },
  hold: .4,
  gather: { duration: .28, ease: 'power3.in' },
  progress: { duration: .48, ease: 'back.out(1.7)' },
  join: { duration: .32, ease: 'power3.in' },
  expand: { duration: .28, ease: 'power3.out' },
  loading: { duration: .64, ease: 'sine.inOut' },
  fragment: { duration: .48, ease: 'power2.in' },
  poster: { duration: .44, ease: 'back.out(1.4)' },
  stroke: { duration: .2, ease: 'none' }, // Four consecutive straight segments = 800 ms.
  letter: .05,
})

