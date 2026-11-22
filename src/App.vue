<script setup>
import { RouterView } from 'vue-router'
import PageTransition from './components/PageTransition.vue'
</script>
<template>
  <main class="device" aria-label="盛乐青年互动画像" data-html2canvas-ignore>
    <RouterView v-slot="{ Component, route }">
      <PageTransition :page-key="route.path" :page="route.name">
        <component :is="Component" />
      </PageTransition>
    </RouterView>
  </main>
</template>

