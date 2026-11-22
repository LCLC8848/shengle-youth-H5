<script setup>
import { ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { Button as VanButton } from 'vant'
import { options } from '../core/options.js'
import { art, animation } from '../core/content.js'
import { choose, session } from '../core/session.js'
import BrandMark from '../components/BrandMark.vue'
import ForwardGlyph from '../components/ForwardGlyph.vue'
import WordChoices from '../components/WordChoices.vue'
import QuizProgress from '../components/QuizProgress.vue'
import LottieArt from '../components/LottieArt.vue'
const props = defineProps({ step: Object })
const router = useRouter()
const group = ref(null)
const busy = ref(false)
function next() {
  if (router.currentRoute.value.name === props.step.route) router.push({ name: props.step.next })
}
onBeforeRouteLeave(() => group.value?.cancel())
</script>
<template>
  <section class="screen quiz" :class="'quiz-' + step.key">
    <div class="quiz-scroll">
      <BrandMark/>
      <LottieArt v-if="step.key === 'attitude'" class="hanging-art"
        :src="animation('hanging-decor')" :fallback="art('hanging-decor')" />
      <div class="question">
        <h1>{{ step.title }}</h1>
        <p>{{ step.caption }}</p>
      </div>
      <LottieArt v-if="step.key === 'partner'" class="item-banner"
        :src="animation('item-pool')" :fallback="art('item-pool')" />
      <WordChoices ref="group" :kind="step.key" :choices="options[step.key]"
        :selected="session.answers[step.key]" @select="id => choose(step.key, id)"
        @busy="v => busy = v" @complete="next" />
    </div>
    <footer class="route-footer">
      <QuizProgress :step="step.index"/>
      <span class="step-count">0{{ step.index }} <i>/ 03</i></span>
      <VanButton round class="forward" :disabled="!session.answers[step.key] || busy"
        aria-label="下一步" @click="group.confirm()"><ForwardGlyph/></VanButton>
    </footer>
  </section>
</template>

