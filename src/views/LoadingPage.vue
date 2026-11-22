<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { gsap } from 'gsap'
import { animation, art } from '../core/content.js'
import { resultTheme, session } from '../core/session.js'
import { loadImage } from '../core/photo.js'
import { motion, reducedMotion } from '../core/motion.js'
import BrandMark from '../components/BrandMark.vue'
import LottieArt from '../components/LottieArt.vue'

const router = useRouter()
const dots = ref(null), error = ref('')
let timer = 0, mounted = false, ready = false, timeReady = false, wave
function advance() {
  if (mounted && ready && (timeReady || reducedMotion.value) && router.currentRoute.value.name === 'loading')
    router.replace({ name: 'result' })
}
async function prepare() {
  error.value = ''
  try {
    await Promise.all([art('poster-' + resultTheme()), ...(session.photoEnabled ? [session.photo] : [])].map(loadImage))
    ready = true
    advance()
  } catch { if (mounted) error.value = '海报素材读取失败。' }
}
function stop() { mounted = false; clearTimeout(timer); wave?.kill() }
onBeforeRouteLeave(stop)
onBeforeUnmount(stop)
function animateDots() {
  wave?.kill()
  if (!dots.value) return
  const dotsList = Array.from(dots.value.children)
  gsap.set(dotsList, { y: 0 })
  if (!reducedMotion.value) wave = gsap.to(dotsList, {
    y: -6, ...motion.loading, stagger: .12, yoyo: true, repeat: -1, force3D: true,
  })
}
onMounted(async () => {
  mounted = true
  await nextTick()
  if (!mounted) return
  animateDots()
  // Provides a readable loading beat, parallel to real image decoding. Reduced motion skips it.
  timer = setTimeout(() => { timeReady = true; advance() }, 1100)
  prepare()
})
watch(reducedMotion, () => { animateDots(); advance() })
</script>
<template>
  <section class="screen loading">
    <BrandMark/>
    <div class="loading-art">
      <i class="loading-diamond" data-loading-diamond/>
      <div ref="dots" class="loading-dots" aria-hidden="true"><b/><b/><b/></div>
    </div>
    <LottieArt class="loading-couple" :src="animation('walking-couple')" :fallback="art('walking-couple')"/>
    <h1 role="status">正在拼出你的专属海报</h1>
    <div v-if="error" class="loading-error" role="alert">{{ error }} <button @click="prepare">重新读取</button></div>
    <div class="loading-stripe" aria-hidden="true"/>
  </section>
</template>

