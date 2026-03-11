<template>
  <div>
    <Header />
    <Hero
      :eyebrow="heroEyebrow"
      :title="heroTitle"
      :subtitle="heroSubtitle"
      :description="heroDescription"
      :metrics="heroMetrics"
    />

    <main class="site-main">
      <section class="intro-section">
        <div class="site-inner intro-grid">
          <div>
            <p class="section-kicker">Studio</p>
            <h2 class="section-title">Przestrzeń pod realizacje, które mają wyglądać pewnie już od pierwszego kadru.</h2>
          </div>

          <div class="intro-copy">
            <p v-for="paragraph in introParagraphs" :key="paragraph">{{ paragraph }}</p>
          </div>
        </div>
      </section>

      <section id="uslugi" class="services-section">
        <div class="site-inner">
          <div class="section-heading">
            <p class="section-kicker">Zakres</p>
            <h2 class="section-title">Projektujemy workflow pod efekt końcowy, nie pod przypadkowy wynajem planu.</h2>
          </div>

          <div class="services-grid">
            <article v-for="service in services" :key="service.title" class="service-card">
              <p class="service-index">{{ service.index }}</p>
              <h3>{{ service.title }}</h3>
              <p>{{ service.copy }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="works" class="works-section">
        <div class="site-inner">
          <div class="section-heading works-heading">
            <p class="section-kicker">Portfolio</p>
            <h2 class="section-title">Wybrane realizacje i materiały, które pokazują tempo, estetykę i zakres pracy studia.</h2>
          </div>
          <Gallery />
        </div>
      </section>

      <section class="text-section">
        <div class="site-inner text-grid">
          <div>
            <p class="section-kicker section-kicker--dark">Proces</p>
            <h2 class="section-title section-title--dark">Od briefu po publikację: mniej chaosu, lepsza kontrola nad rezultatem.</h2>
          </div>

          <div class="process-list">
            <article v-for="step in processSteps" :key="step.title" class="process-card">
              <span>{{ step.index }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.copy }}</p>
            </article>
          </div>

          <aside class="text-card">
            <template v-if="infoBlocks">
              <div v-for="(block, index) in infoBlocks" :key="index" class="text-block">
                <p>{{ block }}</p>
              </div>
            </template>
            <template v-else>
              <h3>Co dostajesz</h3>
              <p>Kompleksowe usługi fotograficzne, wynajem studia i scenografię przygotowaną pod konkretny cel kampanii.</p>
              <p>Plany zdjęciowe są adaptowalne, więc produkcja może zmieniać charakter bez zmiany miejsca i bez strat czasowych.</p>
            </template>
          </aside>
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

const heroTitle = 'SZCZEPANSKI STUDIO'
const heroEyebrow = 'Warszawskie studio do realizacji foto i wideo'

const heroMetrics = [
  { label: 'Przestrzeń', value: '2 studia i kilka gotowych scen' },
  { label: 'Zakres', value: 'Sesje, kampanie, short-form video' },
  { label: 'Tryb pracy', value: 'Szybkie przygotowanie planu' }
]

const services = [
  {
    index: '01',
    title: 'Sesje komercyjne i wizerunkowe',
    copy: 'Produkcje dla marek, osób publicznych i zespołów, które potrzebują spójnych materiałów sprzedażowych lub employer brandingowych.'
  },
  {
    index: '02',
    title: 'Wideo produktowe i social content',
    copy: 'Formaty pod kampanie, ecommerce i krótkie formy do kanałów social, bez budowania procesu od zera przy każdej realizacji.'
  },
  {
    index: '03',
    title: 'Scenografia i organizacja planu',
    copy: 'Od ustawienia scen po przepływ pracy na planie, tak żeby zespół kreatywny mógł skupić się na obrazie, a nie na gaszeniu chaosu.'
  }
]

const processSteps = [
  {
    index: '01',
    title: 'Brief i kierunek wizualny',
    copy: 'Doprecyzowanie celu, estetyki i formatu materiałów jeszcze przed wejściem na plan.'
  },
  {
    index: '02',
    title: 'Przygotowanie przestrzeni',
    copy: 'Dobór scenografii, ustawienia światła i organizacji pracy pod konkretny zakres zdjęć lub wideo.'
  },
  {
    index: '03',
    title: 'Realizacja i selekcja materiału',
    copy: 'Produkcja z myślą o użyciu końcowym: kampanii, stronie, ecommerce albo social mediach.'
  }
]

const heroSubtitle = computed(() => {
  try {
    return (sections.value && sections.value.hero && Array.isArray(sections.value.hero.blocks) && sections.value.hero.blocks[0]) || '2 studia fotograficzne • 5 planów zdjęciowych'
  } catch (e) { return '2 studia fotograficzne • 5 planów zdjęciowych' }
})

const heroDescription = computed(() => {
  try {
    return (sections.value && sections.value.hero && Array.isArray(sections.value.hero.blocks) && sections.value.hero.blocks[1]) || 'Realizacje komercyjne, sesje wizerunkowe i produkcje contentowe w przestrzeni przygotowanej do szybkiej adaptacji.'
  } catch (e) { return 'Realizacje komercyjne, sesje wizerunkowe i produkcje contentowe w przestrzeni przygotowanej do szybkiej adaptacji.' }
})

const infoBlocks = computed(() => {
  try {
    return (sections.value && sections.value.info && Array.isArray(sections.value.info.blocks) && sections.value.info.blocks.length) ? sections.value.info.blocks : null
  } catch (e) { return null }
})

const introParagraphs = computed(() => {
  if (infoBlocks.value && infoBlocks.value.length) {
    return infoBlocks.value.slice(0, 2)
  }

  return [
    'Szczepanski Studio łączy gotową przestrzeń, elastyczną scenografię i proces realizacji, który nie rozpada się przy zmianie briefu.',
    'To miejsce dla marek i twórców, którzy chcą szybko wejść w produkcję, ale nadal dowieźć obraz na poziomie premium.'
  ]
})

</script>

<style scoped>
.site-main {
  background: var(--color-bg);
  color: var(--color-text);
}

.section-kicker {
  margin-bottom: 0.9rem;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: color-mix(in srgb, var(--color-accent) 60%, white 40%);
}

.section-kicker--dark {
  color: color-mix(in srgb, var(--color-accent) 72%, black 28%);
}

.section-title {
  max-width: 14ch;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1;
}

.section-title--dark {
  color: color-mix(in srgb, var(--color-text-dark) 92%, black 8%);
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.intro-section {
  padding: 4.5rem 0 1rem;
}

.intro-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.9fr);
  gap: 2rem;
  align-items: start;
}

.intro-copy {
  display: grid;
  gap: 1rem;
  max-width: 42rem;
  font-size: 1.02rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
}

.services-section {
  padding: 2rem 0 1rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.service-card {
  min-height: 260px;
  padding: 1.4rem;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
}

.service-index {
  margin-bottom: 2.4rem;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.16em;
}

.service-card h3,
.process-card h3,
.text-card h3 {
  margin-bottom: 0.85rem;
  font-size: 1.35rem;
}

.service-card p,
.process-card p,
.text-card p {
  line-height: 1.7;
}

.works-section {
  padding: 3rem 0 0;
  background: var(--color-section-dark);
}

.works-heading {
  margin-bottom: 1.5rem;
}

.text-section {
  padding: 4rem 0;
  background:
    radial-gradient(circle at top left, rgba(184, 106, 68, 0.14), transparent 22%),
    var(--color-section-light);
  color: var(--color-text-dark);
}

.text-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr) minmax(280px, 0.8fr);
  gap: 1.2rem;
  align-items: start;
}

.process-list {
  display: grid;
  gap: 1rem;
}

.process-card,
.text-card {
  padding: 1.25rem;
  border-radius: 22px;
  background: rgba(255,255,255,0.68);
  border: 1px solid rgba(31,43,42,0.12);
  color: rgba(25, 21, 19, 0.96);
}

.process-card span {
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.82rem;
  letter-spacing: 0.16em;
  color: rgba(31,43,42,0.72);
}

.process-card h3,
.text-card h3 {
  color: rgba(18, 15, 13, 0.98);
}

.process-card p,
.text-card p,
.text-block p {
  color: rgba(31, 26, 22, 0.9);
}

.text-card {
  display: grid;
  gap: 0.8rem;
}

.text-block + .text-block {
  border-top: 1px solid rgba(31,43,42,0.1);
  padding-top: 0.8rem;
}

@media (max-width: 1100px) {
  .section-heading,
  .intro-grid,
  .services-grid,
  .text-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    max-width: none;
  }
}

@media (max-width: 720px) {
  .intro-section,
  .services-section,
  .works-section,
  .text-section {
    padding-top: 3rem;
  }

  .service-card,
  .process-card,
  .text-card {
    border-radius: 18px;
  }
}
</style>