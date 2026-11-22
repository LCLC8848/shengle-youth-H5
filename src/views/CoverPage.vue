<script setup>
import { useRouter } from 'vue-router'
import { Button as VanButton } from 'vant'
import { art, animation } from '../core/content.js'
import LottieArt from '../components/LottieArt.vue'
const router = useRouter()
</script>
<template>
  <section class="screen cover" aria-label="盛乐青年刮刮乐">
    <div class="cover-art" :style="{ backgroundImage: 'url(' + art('cover') + ')' }">
      <h1 class="cover-title">盛乐<br>青年<small>刮刮乐</small></h1>
      <p class="cover-call">你是哪种<br>盛乐青年？</p>
      <LottieArt class="cover-bench" :src="animation('bench-couple')" :fallback="art('bench-couple')" />
      <VanButton class="cover-cta" round @click="router.push({ name: 'status' })">定制你的画像</VanButton>
    </div>
  </section>
</template>

