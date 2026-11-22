<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { motion, reducedMotion } from '../core/motion.js'

defineProps({ pageKey: String, page: String })
const stage = ref(null)
const bridge = ref(null)
const entering = new Map()
const leaving = new Map()
let lastPanel
let bridgeOwner
function restore(el) {
  el.classList.remove('entering', 'leaving', 'morph-photo', 'morph-loading')
  const iris = el.firstElementChild
  iris.style.clipPath = ''
  iris.style.webkitClipPath = ''
  iris.style.transform = ''
  iris.firstElementChild.style.transform = ''
  if (bridgeOwner === el) { bridge.value.hidden = true; bridgeOwner = null }
}
function finish(map, el) {
  const run = map.get(el)
  if (!run) return
  map.delete(el)
  run.animation.kill()
  restore(el)
  if (map === leaving && lastPanel === el) lastPanel = null
  run.done()
}
function leave(el, done) {
  lastPanel = el
  el.inert = true
  el.setAttribute('aria-hidden', 'true')
  el.classList.add('leaving')
  if (reducedMotion.value) { lastPanel = null; done(); return }
  const animation = gsap.delayedCall(motion.page.duration, () => finish(leaving, el))
  leaving.set(el, { animation, done })
}
// Move the three visible P4 diamonds into the exact centre and size of P5's loading tile.
function addBridge(tl, oldPanel, newPanel) {
  const target = newPanel.querySelector('[data-loading-diamond]')
  const starts = Array.from(oldPanel?.querySelectorAll('[data-photo-diamond]') || [])
  if (!target || starts.length !== 3) return
  const b = bridge.value
  const stageBox = stage.value.getBoundingClientRect()
  const goal = target.getBoundingClientRect()
  const cx = goal.left + goal.width / 2
  const cy = goal.top + goal.height / 2
  b.hidden = false
  bridgeOwner = newPanel
  oldPanel.classList.add('morph-photo')
  newPanel.classList.add('morph-loading')
  const pieces = Array.from(b.children)
  pieces.forEach((piece, i) => {
    const rect = starts[i].getBoundingClientRect()
    const side = starts[i].offsetWidth
    Object.assign(piece.style, {
      left: (cx - stageBox.left - side / 2) + 'px', top: (cy - stageBox.top - side / 2) + 'px',
      width: side + 'px', height: side + 'px', background: getComputedStyle(starts[i]).backgroundColor,
    })
    gsap.set(piece, { x: rect.left + rect.width / 2 - cx, y: rect.top + rect.height / 2 - cy,
      rotation: 45, scale: 1, opacity: 1, force3D: true })
  })
  tl.to(pieces, { x: 0, y: 0, rotation: 225, scale: .14, ...motion.join }, 0)
    .set([pieces[0], pieces[2]], { opacity: 0 }, motion.join.duration)
    .to(pieces[1], {
      scale: target.offsetWidth / starts[1].offsetWidth, ...motion.expand,
    }, motion.join.duration)
}
function enter(el, done) {
  el.inert = false
  el.removeAttribute('aria-hidden')
  if (reducedMotion.value) { restore(el); done(); return }
  el.classList.add('entering')
  const iris = el.firstElementChild
  const content = iris.firstElementChild
  const radius = Math.ceil(Math.hypot(el.clientWidth, el.clientHeight) / 2) + 2
  const clip = 'circle(' + radius + 'px at 50% 50%)'
  const tl = gsap.timeline({ paused: true, onComplete: () => finish(entering, el) })
  if (lastPanel?.dataset.page === 'photo' && el.dataset.page === 'loading') addBridge(tl, lastPanel, el)
  iris.style.clipPath = clip
  iris.style.webkitClipPath = clip
  const progress = { scale: .002 }
  function paint() {
    iris.style.transform = 'translateZ(0) scale(' + progress.scale + ')'
    content.style.transform = 'translateZ(0) scale(' + (1 / progress.scale) + ')'
  }
  paint()
  // Fixed circle, reciprocal inner scale. Only transforms change during the 600 ms reveal.
  tl.to(progress, { scale: 1, ...motion.page, onUpdate: paint }, 0)
  entering.set(el, { animation: tl, done })
  tl.play()
}
function cancel(map, el) {
  map.get(el)?.animation.kill()
  map.delete(el)
  restore(el)
}
watch(reducedMotion, value => {
  if (value) {
    for (const el of entering.keys()) finish(entering, el)
    for (const el of leaving.keys()) finish(leaving, el)
  }
})
onBeforeUnmount(() => {
  for (const [el] of entering) cancel(entering, el)
  for (const [el] of leaving) cancel(leaving, el)
})
</script>
<template>
  <div ref="stage" class="route-stage">
    <Transition :css="false" @enter="enter" @leave="leave"
      @enter-cancelled="el => cancel(entering, el)" @leave-cancelled="el => cancel(leaving, el)">
      <div :key="pageKey" class="route-panel" :data-page="page">
        <div class="iris"><div class="iris-content"><slot /></div></div>
      </div>
    </Transition>
    <div ref="bridge" class="diamond-bridge" aria-hidden="true" hidden><i/><i/><i/></div>
  </div>
</template>

