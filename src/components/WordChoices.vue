<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { art } from '../core/content.js'
import { motion, reducedMotion } from '../core/motion.js'

const props = defineProps({ kind: String, choices: Array, selected: String })
const emit = defineEmits(['select', 'complete', 'busy'])
const group = ref(null)
let nodes = [], floaters = [], buttons = []
let entry, pop, dim, hold, gather, idles = [], busy = false, alive = true
function stopIdle() { idles.forEach(t => t.kill()); idles = [] }
function dims(selected, instant = false) {
  dim?.kill()
  const opacity = i => !selected || props.choices[i].id === selected ? 1 : .35
  if (instant || reducedMotion.value) gsap.set(buttons, { opacity })
  else dim = gsap.to(buttons, { opacity, ...motion.dim })
}
function startIdle() {
  if (!alive || reducedMotion.value || busy) return
  idles = floaters.map(el => {
    const v = Math.random() > .5 ? 6 : -6
    const idle = gsap.timeline({ delay: Math.random() * .85, repeat: -1, defaults: { ease: motion.idle.ease, force3D: true } })
    return idle.to(el, { y: v, duration: motion.idle.duration / 2 })
      .to(el, { y: -v, duration: motion.idle.duration })
      .to(el, { y: 0, duration: motion.idle.duration / 2 })
  })
}
function resetMotion() {
  entry?.kill(); pop?.kill(); stopIdle()
  gsap.set(nodes, { x: 0, y: 0, scale: 1, opacity: 1 })
  gsap.set(floaters, { y: 0 })
  gsap.set(buttons, { scale: 1 })
  dims(props.selected, true)
}
function begin() {
  hold?.kill(); hold = null
  if (!alive || busy || !props.selected) return
  busy = true
  emit('busy', true)
  if (reducedMotion.value) { emit('complete'); return }
  entry?.progress(1); stopIdle()
  const area = group.value.getBoundingClientRect()
  const dx = [], dy = []
  nodes.forEach(node => {
    const r = node.getBoundingClientRect()
    dx.push(area.left + area.width / 2 - r.left - r.width / 2)
    dy.push(area.top + area.height / 2 - r.top - r.height / 2)
  })
  gather = gsap.to(nodes, {
    x: i => dx[i], y: i => dy[i], scale: .18, ...motion.gather, force3D: true,
    onComplete: () => { if (alive) emit('complete') },
  })
}
function arm() {
  hold?.kill()
  if (reducedMotion.value) { nextTick(begin); return }
  hold = gsap.delayedCall(motion.hold, begin)
}
function pick(item, index) {
  if (!alive || busy) return
  emit('select', item.id)
  pop?.kill()
  gsap.set(buttons, { scale: 1 })
  dims(item.id)
  if (!reducedMotion.value) {
    pop = gsap.timeline().to(buttons[index], { scale: 1.15, ...motion.popUp })
      .to(buttons[index], { scale: 1, ...motion.popDown })
  }
  arm()
}
function confirm() {
  if (!props.selected || busy || hold) return
  arm()
}
function cancel() {
  alive = false
  hold?.kill(); entry?.kill(); pop?.kill(); dim?.kill(); gather?.kill(); stopIdle()
}
function boxStyle(box) {
  return box ? { left: box[0] + '%', top: box[1] + '%', width: box[2] + '%', height: box[3] + '%' } : {}
}
onMounted(() => {
  nodes = Array.from(group.value.querySelectorAll('.choice-shell'))
  floaters = nodes.map(n => n.firstElementChild)
  buttons = floaters.map(n => n.querySelector('button'))
  dims(props.selected, true)
  if (!reducedMotion.value) {
    entry = gsap.fromTo(nodes, { y: 22, opacity: 0 }, { y: 0, opacity: 1,
      ...motion.entry, force3D: true, onComplete: startIdle })
  }
})
watch(reducedMotion, value => {
  if (!alive) return
  if (value) {
    if (busy) { gather?.progress(1); return }
    const pending = !!hold
    resetMotion()
    if (pending) begin()
  } else if (!busy) startIdle()
})
onBeforeUnmount(cancel)
defineExpose({ confirm, cancel })
</script>
<template>
  <div ref="group" class="choice-group" :class="'choices-' + kind" role="group" aria-label="选择一个词组">
    <div v-for="(item, i) in choices" :key="item.id" class="choice-shell" :style="boxStyle(item.box)">
      <div class="choice-float"><button class="choice-button" :aria-label="item.label"
        :class="{ picked: selected === item.id }" :aria-pressed="selected === item.id"
        :disabled="busy" @click="pick(item, i)">
        <img :src="art(item.art || item.icon)" alt="" draggable="false">
        <span :class="{ 'sr-only': kind === 'status' }">{{ item.label }}</span>
      </button></div>
    </div>
  </div>
</template>

