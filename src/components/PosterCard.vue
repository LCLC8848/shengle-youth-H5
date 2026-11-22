<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { themes, art, animation } from '../core/content.js'
import { motion, reducedMotion } from '../core/motion.js'
import LottieArt from './LottieArt.vue'

const props = defineProps({ theme: String, tags: Array, photo: String, phase: String, print: Boolean, still: String })
const emit = defineEmits(['still', 'drawn'])
const card = ref(null)
const look = computed(() => themes[props.theme])
// Each path starts at its own pivot. A fixed dasharray and axial scaling draw the segment
// without animating stroke-dashoffset, path length, or any layout property.
const lines = [
  { d: 'M138 221H505', origin: '138px 221px', axis: 'scaleX' },
  { d: 'M505 221V763', origin: '505px 221px', axis: 'scaleY' },
  { d: 'M505 763H138', origin: '505px 763px', axis: 'scaleX' },
  { d: 'M138 763V221', origin: '138px 763px', axis: 'scaleY' },
]
let reveal
function finalState() {
  reveal?.kill()
  if (!card.value) return
  gsap.set(card.value, { scale: 1 })
  card.value.querySelectorAll('.door-segment').forEach(path => {
    path.style.transform = 'translateZ(0)'
    path.style.opacity = '1'
  })
  gsap.set(card.value.querySelectorAll('.poster-glyph'), { opacity: 1 })
}
function draw() {
  if (!card.value || props.print || props.phase !== 'revealing') return
  if (reducedMotion.value) { finalState(); emit('drawn'); return }
  reveal?.kill()
  const segments = Array.from(card.value.querySelectorAll('.door-segment'))
  const glyphs = Array.from(card.value.querySelectorAll('.poster-glyph'))
  reveal = gsap.timeline({ onComplete: () => emit('drawn') })
  reveal.fromTo(card.value, { scale: .9 }, { scale: 1, force3D: true, ...motion.poster }, 0)
  gsap.set(glyphs, { opacity: 0 })
  segments.forEach((path, i) => {
    const { axis } = lines[i]
    const stroke = { fraction: 0 }
    function updateStroke() {
      path.style.transform = 'translateZ(0) ' + axis + '(' + stroke.fraction + ')'
    }
    updateStroke()
    reveal.to(stroke, { fraction: 1, ...motion.stroke, onUpdate: updateStroke }, i * motion.stroke.duration)
  })
  // Instant glyph steps at 50 ms intervals, after the 800 ms border.
  glyphs.forEach((g, i) => reveal.set(g, { opacity: 1 }, .8 + i * motion.letter))
}
onMounted(draw)
watch(() => props.phase, async p => { if (p === 'revealing') { await nextTick(); draw() } })
watch(reducedMotion, v => {
  if (v && !props.print && props.phase === 'revealing') { finalState(); emit('drawn') }
})
onBeforeUnmount(() => reveal?.kill())
</script>
<template>
  <article ref="card" class="poster-card" :class="{ covered: phase === 'covered' && !print }"
    :style="{ backgroundColor: look.color, color: look.ink }" :aria-label="'盛乐青年 · ' + look.label">
    <img v-if="print" class="poster-base" :src="still || art('poster-' + theme)" alt="">
    <LottieArt v-else class="poster-base" :src="animation('result-' + theme)"
      :fallback="art('poster-' + theme)" capture-still @still="s => emit('still', s)" />
    <svg class="poster-door" viewBox="0 0 640 1136" fill="none" aria-hidden="true">
      <path v-for="line in lines" :key="line.d" class="door-segment" :d="line.d"
        :style="{ transformBox: 'view-box', transformOrigin: line.origin }"
        pathLength="100" stroke-dasharray="100 100" :stroke="look.line" stroke-width="3" />
    </svg>
    <div class="poster-info">
      <img v-if="photo" class="poster-avatar" :src="photo" alt="你的照片">
      <span v-else class="poster-star" aria-hidden="true">✳</span>
      <h2>{{ look.label }}青年</h2>
      <p class="slogan">{{ look.slogan }}</p>
    </div>
    <div class="poster-tags" :aria-label="tags.join('、')">
      <span v-for="tag in tags" :key="tag" class="whole-tag" aria-hidden="true"><span
        v-for="(c, i) in Array.from('#' + tag)" :key="i" class="poster-glyph">{{ c }}</span></span>
    </div>
  </article>
</template>

