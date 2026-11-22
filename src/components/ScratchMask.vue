<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { motion, reducedMotion } from '../core/motion.js'

const emit = defineEmits(['progress', 'reveal'])
const canvas = ref(null), shards = ref(null)
const W = 320, H = 568
const radius = 25
let ctx, pressed = false, lastPoint, owner = null, finished = false, mounted = false
let lastRead = -Infinity, flight, lastPercent = 0
function paint() {
  ctx = canvas.value.getContext('2d', { willReadFrequently: true })
  if (!ctx) { reveal(); return }
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#eefa86'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#cbda70'
  for (let y = 2; y < H; y += 8) {
    for (let x = (y % 16 ? 2 : 6); x < W; x += 8) ctx.fillRect(x, y, 1, 1)
  }
  ctx.strokeStyle = '#536831'; ctx.lineWidth = 1
  ctx.setLineDash([5, 5]); ctx.strokeRect(14.5, 14.5, W - 29, H - 29); ctx.setLineDash([])
  ctx.fillStyle = '#344d30'
  ctx.textAlign = 'left'; ctx.font = 'bold 11px "Shengle UI", sans-serif'; ctx.fillText('SHENGLE YOUTH', 30, 44)
  ctx.textAlign = 'right'; ctx.fillText('刮刮乐', W - 30, 44)
  ctx.save(); ctx.translate(W / 2, 210); ctx.rotate(Math.PI / 4)
  ctx.strokeStyle = '#344d30'; ctx.lineWidth = 2.5
  ctx.strokeRect(-29, -29, 58, 58); ctx.strokeRect(-19, -19, 38, 38); ctx.restore()
  ctx.textAlign = 'center'; ctx.font = '900 39px "Shengle UI", sans-serif'; ctx.fillText('刮开你的画像', W / 2, 316)
  ctx.font = '15px "Shengle UI", sans-serif'; ctx.fillText('用指尖涂一涂，看看今天的你。', W / 2, 354)
  ctx.font = 'bold 11px "Shengle UI", sans-serif'; ctx.fillText('SCRATCH  /  REVEAL', W / 2, H - 35)
  ctx.globalCompositeOperation = 'destination-out'
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = radius * 2
  ctx.strokeStyle = '#000'; ctx.fillStyle = '#000'
}
function point(x, y) {
  const r = canvas.value.getBoundingClientRect()
  return { x: (x - r.left) * W / r.width, y: (y - r.top) * H / r.height }
}
function measure(force = false) {
  if (finished || !ctx) return
  const now = performance.now()
  if (!force && now - lastRead < 85) return
  lastRead = now
  // Measure real alpha coverage, including antialiased edges and overlapping strokes.
  const { data } = ctx.getImageData(0, 0, W, H)
  let erased = 0
  for (let i = 3; i < data.length; i += 4) erased += 255 - data[i]
  const fraction = erased / (255 * W * H)
  const percent = Math.floor(fraction * 100)
  if (percent !== lastPercent) { lastPercent = percent; emit('progress', percent) }
  if (fraction > .60) reveal()
}
function start(id, x, y) {
  if (finished || pressed || !ctx) return
  owner = id; pressed = true; lastPoint = point(x, y)
  ctx.beginPath(); ctx.arc(lastPoint.x, lastPoint.y, radius, 0, 2 * Math.PI); ctx.fill()
  measure()
}
function move(id, x, y) {
  if (!pressed || finished || id !== owner) return
  const p = point(x, y)
  ctx.beginPath(); ctx.moveTo(lastPoint.x, lastPoint.y); ctx.lineTo(p.x, p.y); ctx.stroke()
  lastPoint = p
  measure()
}
function end(id) {
  if (id !== owner || !pressed) return
  pressed = false; owner = null; measure(true)
}
function touchStart(e) {
  const t = e.changedTouches[0]
  if (t && !pressed) start('t' + t.identifier, t.clientX, t.clientY)
}
function touchMove(e) {
  for (const t of e.changedTouches) move('t' + t.identifier, t.clientX, t.clientY)
}
function touchEnd(e) { for (const t of e.changedTouches) end('t' + t.identifier) }
function pointerDown(e) {
  if (e.pointerType === 'touch' || e.button !== 0 || pressed) return
  canvas.value.setPointerCapture(e.pointerId)
  start(e.pointerId, e.clientX, e.clientY)
}
function pointerMove(e) { if (e.pointerType !== 'touch') move(e.pointerId, e.clientX, e.clientY) }
function reveal() {
  if (finished) return
  finished = true; pressed = false
  if (reducedMotion.value || !ctx) { emit('reveal'); return }
  const tiles = []
  const cols = 4, rows = 5
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = Math.round(col * W / cols), y = Math.round(row * H / rows)
      const w = Math.round((col + 1) * W / cols) - x, h = Math.round((row + 1) * H / rows) - y
      const tile = document.createElement('canvas')
      tile.width = w; tile.height = h
      const t = tile.getContext('2d')
      if (!t) continue
      t.drawImage(canvas.value, x, y, w, h, 0, 0, w, h)
      Object.assign(tile.style, { left: 100 * x / W + '%', top: 100 * y / H + '%',
        width: 100 * w / W + '%', height: 100 * h / H + '%' })
      shards.value.appendChild(tile); tiles.push(tile)
    }
  }
  canvas.value.style.visibility = 'hidden'
  if (!tiles.length) { emit('reveal'); return }
  flight = gsap.to(tiles, {
    y: () => (0.35 + Math.random() * .6) * canvas.value.clientHeight,
    x: () => (Math.random() - .5) * 70, rotation: () => (Math.random() - .5) * 120,
    opacity: 0, ...motion.fragment, stagger: { amount: .10, from: 'center' },
    force3D: true, onComplete: () => emit('reveal'),
  })
}
onMounted(async () => {
  mounted = true
  if (reducedMotion.value) { reveal(); return }
  try { await document.fonts?.ready } catch { /* Draw with system fonts. */ }
  if (mounted && !finished) paint()
})
watch(reducedMotion, value => {
  if (value) { if (flight) flight.progress(1); else reveal() }
})
onBeforeUnmount(() => { mounted = false; flight?.kill() })
defineExpose({ reveal })
</script>
<template>
  <div class="scratch-mask">
    <canvas ref="canvas" :width="W" :height="H" aria-label="用手指或鼠标刮开海报，也可以点按下方的直接揭晓"
      @touchstart.prevent="touchStart" @touchmove.prevent="touchMove" @touchend="touchEnd" @touchcancel="touchEnd"
      @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="end($event.pointerId)"
      @pointercancel="end($event.pointerId)" @lostpointercapture="end($event.pointerId)" />
    <div ref="shards" class="mask-shards" aria-hidden="true"/>
  </div>
</template>

