<template>
  <section class="hero">
    <div class="hero-media" :style="backgroundStyle"></div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1 class="hero-title">SZCZEPANSKI<br/>.STUDIO</h1>
      <p v-if="subtitle" class="hero-sub">{{ subtitle }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  image: { type: String, default: '/img/placeholder-hero.jpg' },
  subtitle: { type: String, default: '2 studia fotograficzne • 5 planów zdjęciowych' }
})

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${props.image})`
}))
</script>

<style scoped>
.hero {
  position: relative;
  height: 60vh;
  min-height: 520px;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow: hidden;
}
.hero-media {
  position:absolute;
  inset:0;
  background-size:cover;
  background-position:center;
  transform: scale(1.03);
  will-change: transform;
}
.hero {
  background-color: var(--section-hero-bg, var(--color-section-dark)); /* fallback using theme variable */
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55));
  z-index: 1;
}
.hero-content {
  position: relative;
  text-align: center;
  z-index: 2;
  color: var(--color-text);
  text-shadow: 0 8px 30px rgba(0,0,0,0.7);
  padding: 0 1rem;
}
.hero-title {
  font-size: 9.5vw;
  line-height: 0.9;
  font-weight: 900;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}
.hero-sub {
  font-size: 1.05rem;
  opacity: 0.95;
}
@media (max-width: 1200px) {
  .hero { height: 52vh; min-height: 420px; }
  .hero-title { font-size: 12.5vw; }
}
@media (max-width: 900px) {
  .hero { height: 48vh; min-height: 340px; }
  .hero-title { font-size: 16vw; }
}
</style>