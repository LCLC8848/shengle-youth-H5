<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { motion, reducedMotion } from '../core/motion.js'
const props = defineProps({ step: { type: Number, required: true } })
const fill = ref(null)
let tween
function update() {
  tween?.kill()
  if (!fill.value) return
  const scaleX = props.step / 3
  if (reducedMotion.value) gsap.set(fill.value, { scaleX })
  else tween = gsap.fromTo(fill.value, { scaleX: (props.step - 1) / 3 },
    { scaleX, force3D: true, ...motion.progress })
}
onMounted(update)
watch([() => props.step, reducedMotion], update)
onBeforeUnmount(() => tween?.kill())
</script>
<template>
  <div class="progress-track" role="progressbar" aria-label="答题进度"
    :aria-valuenow="step" :aria-valuemin="0" :aria-valuemax="3" :aria-valuetext="step + '/3'">
    <i ref="fill" />
  </div>
</template>

