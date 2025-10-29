<template>
  <div>
    <Header />
    <Hero />

    <main class="site-main">
      <section id="works" class="works-section">
        <div class="site-inner">
          <Gallery />
        </div>
      </section>

      <section class="text-section">
        <div class="container">
          <div class="text-card">
            <h2>Usługi</h2>
            <p>Oferujemy kompleksowe usługi fotograficzne, wynajem studia oraz scenografię.
               Nasze plany zdjęciowe są w pełni adaptowalne — zmieniamy je pod Twoje potrzeby.</p>
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
</script>

<style scoped>
.container { max-width: 1300px; margin: 0 auto; padding: 0 1.5rem; }
.site-main { background: var(--color-bg); color: var(--color-text); }
.works-section { padding: 2rem 0 0; background: var(--color-section-dark); }
.text-section { padding: 4rem 0; background: var(--color-section-light); color: var(--color-text-dark) }
.text-card { max-width: 900px; margin: 0 auto; }
.text-card h2 { font-size: 2rem; margin-bottom: 1rem }
</style>