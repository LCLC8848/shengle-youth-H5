<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { Button as VanButton, Switch as VanSwitch, Uploader as VanUploader } from 'vant'
import { art } from '../core/content.js'
import { session, setPhoto, confirmPhoto } from '../core/session.js'
import { maxPhotoBytes, preparePhoto } from '../core/photo.js'
import BrandMark from '../components/BrandMark.vue'
import ForwardGlyph from '../components/ForwardGlyph.vue'

const router = useRouter()
const reading = ref(false), error = ref('')
let version = 0, navigating = false
function interrupt() { version++; reading.value = false }
onBeforeRouteLeave(interrupt)
onBeforeUnmount(interrupt)
function toggle(value) {
  interrupt(); error.value = ''
  setPhoto(value, '')
}
async function onRead(entry) {
  const id = ++version
  reading.value = true; error.value = ''
  try {
    const photo = await preparePhoto(entry.file)
    if (id === version && session.photoEnabled) setPhoto(true, photo)
  } catch (e) {
    if (id === version) error.value = e.message
  } finally { if (id === version) reading.value = false }
}
async function next() {
  if (navigating || reading.value || !confirmPhoto()) return
  navigating = true
  try { await router.push({ name: 'loading' }) } finally { navigating = false }
}
</script>
<template>
  <section class="screen photo">
    <div class="quiz-scroll">
      <BrandMark/>
      <div class="question"><h1>如何记录此刻的你？</h1><p>让一张照片，或一个插画角色，走进你的画像。</p></div>
      <div class="photo-card">
        <div class="photo-diamonds" aria-hidden="true"><i data-photo-diamond/><i data-photo-diamond/><i data-photo-diamond/></div>
        <div class="avatar">
          <img v-if="session.photoEnabled && session.photo" :src="session.photo" alt="海报头像预览">
          <img v-else :src="art('bench-couple')" alt="默认插画头像" class="illustration-avatar">
        </div>
        <div class="photo-controls">
          <label id="photo-label">使用我的照片</label>
          <VanSwitch :model-value="session.photoEnabled" size="27px" active-color="#306e46"
            aria-labelledby="photo-label" @update:model-value="toggle" />
        </div>
        <template v-if="session.photoEnabled">
          <VanUploader accept="image/jpeg,image/png,image/webp" result-type="file"
            :after-read="onRead" :max-size="maxPhotoBytes" :preview-image="false"
            @oversize="error = '请选择 10 MB 以内的照片。'">
            <span class="upload-label">{{ reading ? '正在读取照片…' : session.photo ? '重新选照片' : '从相册选照片' }}</span>
          </VanUploader>
          <p class="photo-note">JPG、PNG、WebP · 最大 10 MB<br>照片只在本机处理，居中裁成方形。</p>
        </template>
        <p v-else class="photo-note">本次使用插画形象</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>
    </div>
    <footer class="route-footer"><span class="footer-note">青年画像</span>
      <VanButton round class="action" :disabled="reading || (session.photoEnabled && !session.photo)" @click="next">拼出我的海报 <ForwardGlyph/></VanButton>
    </footer>
  </section>
</template>

