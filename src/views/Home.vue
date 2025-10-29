<template>
  <div>
    <Header>
      <template #brand>
        <div style="font-weight:700; font-size:1rem">
          {{ (navbarBlocks && navbarBlocks.length && navbarBlocks[0]) ? navbarBlocks[0] : '' }}
        </div>
      </template>
    </Header>
  <Hero :subtitle="heroSubtitle" />

    <main class="site-main">
      <section id="works" class="works-section">
        <div class="site-inner">
          <Gallery />
        </div>
      </section>

      <section class="text-section">
        <div class="container">
          <div class="text-card">
            <template v-if="infoBlocks">
              <div v-for="(b, i) in infoBlocks" :key="i">
                <p v-html="b"></p>
              </div>
            </template>
            <template v-else>
              <h2>Usługi</h2>
              <p>Oferujemy kompleksowe usługi fotograficzne, wynajem studia oraz scenografię.
                 Nasze plany zdjęciowe są w pełni adaptowalne — zmieniamy je pod Twoje potrzeby.</p>
            </template>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import Hero from '../components/Hero.vue'
import Footer from '../components/Footer.vue'
import Gallery from './Gallery.vue'
import { computed } from 'vue'
import { useSections } from '../composables/useSections'

const { sections } = useSections()

const heroSubtitle = computed(() => {
  try {
    return (sections.value && sections.value.hero && Array.isArray(sections.value.hero.blocks) && sections.value.hero.blocks[0]) || '2 studia fotograficzne • 5 planów zdjęciowych'
  } catch (e) { return '2 studia fotograficzne • 5 planów zdjęciowych' }
})

const infoBlocks = computed(() => {
  try {
    return (sections.value && sections.value.info && Array.isArray(sections.value.info.blocks) && sections.value.info.blocks.length) ? sections.value.info.blocks : null
  } catch (e) { return null }
})

const navbarBlocks = computed(() => {
  try { return sections.value && sections.value.navbar && Array.isArray(sections.value.navbar.blocks) ? sections.value.navbar.blocks : null } catch(e) { return null }
})
</script>

<style scoped>
.container { max-width: 1300px; margin: 0 auto; padding: 0 1.5rem; }
.site-main { background: var(--color-bg); color: var(--color-text); }
.works-section { padding: 2rem 0 0; background: var(--color-section-dark); }
.text-section { padding: 4rem 0; background: var(--color-section-light); color: var(--color-text-dark) }
.text-card { max-width: 900px; margin: 0 auto; }
.text-card h2 { font-size: 2rem; margin-bottom: 1rem }
</style>