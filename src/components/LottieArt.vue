<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { reducedMotion } from '../core/motion.js'

const props = defineProps({
  src: { type: String, required: true },
  fallback: { type: String, required: true },
  // Result canvases emit their actual composited final frame for html2canvas.
  captureStill: Boolean,
})
const emit = defineEmits(['still'])
const root = ref(null)
const host = ref(null)
const painted = ref(false)
let observer, player, controller, epoch = 0, inView = false, ready = false, disposed = false
function discard() {
  epoch++
  controller?.abort()
  controller = null
  if (player) { player.pause(); player.destroy(); player = null }
  ready = false
  painted.value = false
}
function playback() {
  if (!ready || !player) return
  if (reducedMotion.value) player.goToAndStop(Math.max(0, player.totalFrames - 1), true)
  else if (inView && !document.hidden) player.play()
  else player.pause()
}
function useFallback() {
  discard()
  if (props.captureStill) emit('still', props.fallback)
}
async function loadPlayer() {
  if (!inView || disposed || controller) return
  const version = ++epoch
  controller = new AbortController()
  try {
    const [module, response] = await Promise.all([
      import('lottie-web/build/player/lottie_canvas.min.js'),
      fetch(props.src, { signal: controller.signal }),
    ])
    if (!response.ok) throw new Error('Animation unavailable')
    const data = await response.json()
    if (version !== epoch || !inView) return
    const directory = new URL('.', new URL(props.src, document.baseURI))
    // Resolve image references relative to this JSON; keep embedded AE images intact.
    for (const a of data.assets || []) {
      if (a.p && !a.e && !/^data:/.test(a.p)) {
        a.p = new URL((a.u || '') + a.p, directory).href
        a.u = ''
        a.e = 1
      }
    }
    player = module.default.loadAnimation({
      container: host.value, renderer: 'canvas', autoplay: false, loop: true, animationData: data,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet', clearCanvas: true, dpr: Math.min(devicePixelRatio || 1, 2) },
    })
    // The canvas renderer raises DOMLoaded after its image preloader has completed.
    player.addEventListener('DOMLoaded', () => {
      if (version !== epoch || !player) return
      ready = true
      player.goToAndStop(Math.max(0, player.totalFrames - 1), true)
      if (props.captureStill) {
        let still = props.fallback
        try { still = host.value.querySelector('canvas').toDataURL('image/png') } catch { /* Use design still. */ }
        emit('still', still)
      }
      if (!reducedMotion.value) player.goToAndStop(0, true)
      painted.value = true
      playback()
    })
    player.addEventListener('data_failed', () => { if (version === epoch) useFallback() })
    player.addEventListener('error', () => { if (version === epoch) useFallback() })
  } catch {
    if (version === epoch && !disposed) useFallback()
  }
}
watch(reducedMotion, playback)
watch(() => [props.src, props.fallback], () => { discard(); if (inView) loadPlayer() })
onMounted(() => {
  if (!('IntersectionObserver' in window)) { useFallback(); return }
  observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting && entry.intersectionRatio > 0
    if (!inView) discard()
    else if (!player) loadPlayer()
    else playback()
  }, { threshold: [0, .01] })
  observer.observe(root.value)
  document.addEventListener('visibilitychange', playback)
})
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  document.removeEventListener('visibilitychange', playback)
  discard()
})
</script>
<template>
  <div ref="root" class="lottie-art" aria-hidden="true">
    <img :src="fallback" alt="" :style="{ visibility: painted ? 'hidden' : 'visible' }" draggable="false">
    <div ref="host" class="lottie-canvas" :style="{ visibility: painted ? 'visible' : 'hidden' }"/>
  </div>
</template>

