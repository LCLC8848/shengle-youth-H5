<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { Button as VanButton, Popup as VanPopup } from 'vant'
import PosterCard from '../components/PosterCard.vue'
import ScratchMask from '../components/ScratchMask.vue'
import { art } from '../core/content.js'
import { session, resultTheme, selectedOptions, markRevealed, restart } from '../core/session.js'
import { reducedMotion } from '../core/motion.js'
import { exportPoster } from '../core/exportPoster.js'

const router = useRouter()
const theme = computed(resultTheme)
const tags = computed(() => selectedOptions().map(o => o.label))
const portraitPhoto = computed(() => session.photoEnabled ? session.photo : '')
const phase = ref(session.revealed || reducedMotion.value ? 'final' : 'covered')
const scratch = ref(null), percent = ref(0)
const printHost = ref(null), still = ref(''), png = ref(''), message = ref(''), exporting = ref(false)
const preview = ref(false)
let token = 0, active = true, fallbackTimer
function beginReveal() { if (phase.value === 'covered') phase.value = 'revealing' }
function finishReveal() { if (active) { phase.value = 'final'; markRevealed() } }
watch(reducedMotion, v => { if (v && active) finishReveal() })
async function renderPNG() {
  const id = ++token
  const previous = png.value
  exporting.value = true; message.value = ''
  try {
    await nextTick()
    const root = printHost.value?.firstElementChild
    if (!root || !active) return
    const blob = await exportPoster(root)
    if (id !== token || !active) return
    png.value = URL.createObjectURL(blob)
    if (previous) URL.revokeObjectURL(previous)
  } catch {
    if (id === token && active) message.value = '图片生成失败，请重新生成。'
  } finally { if (id === token && active) exporting.value = false }
}
function acceptStill(src) {
  if (!active || !src || still.value === src) return
  clearTimeout(fallbackTimer)
  still.value = src
  renderPNG()
}
onMounted(() => {
  if (phase.value === 'final') markRevealed()
  // Degraded asset networks still produce a complete static poster.
  fallbackTimer = setTimeout(() => { if (!still.value) acceptStill(art('poster-' + theme.value)) }, 1800)
})
function dispose() {
  if (!active) return
  active = false; token++; clearTimeout(fallbackTimer)
}
onBeforeRouteLeave(dispose)
onBeforeUnmount(() => { dispose(); if (png.value) URL.revokeObjectURL(png.value) })
function again() {
  dispose()
  restart()
  router.replace({ name: 'cover' })
}
</script>
<template>
  <section class="screen result">
    <div class="result-body">
      <header class="result-heading"><h1>{{ phase === 'final' ? '这就是，今天的你。' : '揭晓你的青年画像' }}</h1></header>
      <div class="poster-area">
        <PosterCard v-if="phase !== 'final' || !png || exporting" :theme="theme" :tags="tags" :photo="portraitPhoto"
          :phase="phase" @still="acceptStill" @drawn="finishReveal" />
        <img v-else class="saved-poster" :src="png" :alt="'盛乐青年画像：' + tags.join('、')">
        <ScratchMask v-if="phase === 'covered'" ref="scratch" @progress="v => percent = v" @reveal="beginReveal"/>
      </div>
      <p v-if="phase === 'covered'" class="result-hint">已刮开 {{ percent }}% · 超过 60% 即可揭晓</p>
      <p v-else-if="phase === 'final'" class="result-hint" role="status">{{ message || (png ? '长按海报可保存或分享' : '正在生成可保存的图片…') }}</p>
      <p v-else class="result-hint" role="status">画像揭晓中…</p>
    </div>
    <footer class="route-footer result-footer">
      <template v-if="phase === 'final'">
        <button class="text-action" @click="again">再测一次</button>
        <VanButton v-if="message" round class="action" @click="renderPNG">重新生成</VanButton>
        <VanButton v-else round class="action" :disabled="!png || exporting" @click="preview = true">保存海报</VanButton>
      </template>
      <template v-else><span class="footer-note">盛乐青年刮刮乐</span>
        <button class="text-action" :disabled="phase !== 'covered'" @click="scratch?.reveal()">直接揭晓</button>
      </template>
    </footer>
    <Teleport to="body"><div ref="printHost" class="export-host" aria-hidden="true" inert>
      <PosterCard print phase="final" :theme="theme" :tags="tags" :photo="portraitPhoto" :still="still" />
    </div></Teleport>
    <VanPopup v-model:show="preview" round class="save-popup" :duration="0" teleport="body" closeable
      aria-label="海报保存预览">
      <div class="save-content">
        <h2>保存你的画像</h2>
        <img v-if="png" :src="png" alt="可长按保存的完整 PNG 海报">
        <p>长按图片保存，或用下方按钮下载。</p>
        <a :href="png" :download="'盛乐青年-' + theme + '.png'">下载 PNG</a>
      </div>
    </VanPopup>
  </section>
</template>

