<template>
  <section class="hero">
    <div class="hero-media" :style="backgroundStyle"></div>
    <div class="hero-overlay"></div>
    <div class="hero-shell site-inner">
      <div class="hero-content">
        <p v-if="eyebrow" class="hero-eyebrow">{{ eyebrow }}</p>
        <h1 class="hero-title">{{ title }}</h1>
        <p v-if="subtitle" class="hero-sub">{{ subtitle }}</p>
        <p v-if="description" class="hero-description">{{ description }}</p>

        <div class="hero-actions">
          <a :href="primaryHref" class="hero-action hero-action--primary">{{ primaryLabel }}</a>
          <a :href="secondaryHref" class="hero-action hero-action--secondary">{{ secondaryLabel }}</a>
        </div>
      </div>

      <dl class="hero-metrics" aria-label="Najważniejsze atuty studia">
        <div v-for="metric in metrics" :key="metric.label" class="hero-metric">
          <dt>{{ metric.label }}</dt>
          <dd>{{ metric.value }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  image: { type: String, default: '/img/dashboard/001_PPX_2894.JPG' },
  eyebrow: { type: String, default: 'Warszawskie studio do produkcji foto i wideo' },
  title: { type: String, default: 'SZCZEPANSKI STUDIO' },
  subtitle: { type: String, default: '2 studia fotograficzne • 5 planów zdjęciowych' },
  description: { type: String, default: 'Realizacje komercyjne, sesje wizerunkowe i produkcje contentowe w przestrzeni gotowej do szybkiej adaptacji.' },
  primaryLabel: { type: String, default: 'Zobacz portfolio' },
  primaryHref: { type: String, default: '#works' },
  secondaryLabel: { type: String, default: 'Skontaktuj się' },
  secondaryHref: { type: String, default: '#kontakt' },
  metrics: {
    type: Array,
    default: () => ([
      { label: 'Tryb pracy', value: 'Foto + wideo' },
      { label: 'Ustawienia planu', value: 'Elastyczne scenografie' },
      { label: 'Zespół', value: 'Produkcja od briefu do finalu' }
    ])
  }
})

const backgroundStyle = computed(() => ({
  backgroundImage: `url(${props.image})`
}))
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 720px;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}
.hero-media {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.03);
  will-change: transform;
}
.hero {
  background-color: var(--section-hero-bg, var(--color-section-dark)); /* fallback using theme variable */
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(184, 106, 68, 0.28), transparent 28%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.86), rgba(0, 0, 0, 0.45) 48%, rgba(0, 0, 0, 0.82));
  z-index: 1;
}

.hero-shell {
  position: relative;
  z-index: 2;
  width: 100%;
  padding-top: 6rem;
  padding-bottom: 3rem;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  align-items: end;
  gap: 2rem;
}

.hero-content {
  max-width: 720px;
  color: var(--color-text);
  text-shadow: 0 8px 30px rgba(0,0,0,0.55);
}

.hero-eyebrow {
  font-size: 0.9rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-text) 74%, var(--color-accent) 26%);
  margin-bottom: 1rem;
}

.hero-title {
  font-size: clamp(4rem, 8vw, 7.2rem);
  line-height: 0.9;
  font-weight: 900;
  margin-bottom: 1rem;
  letter-spacing: 0.03em;
}

.hero-sub {
  font-size: 1.15rem;
  opacity: 0.95;
  max-width: 42rem;
}

.hero-description {
  margin-top: 1rem;
  max-width: 34rem;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-top: 1.8rem;
}

.hero-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  padding: 0.95rem 1.4rem;
  border-radius: 999px;
  text-decoration: none;
  transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
}

.hero-action:hover {
  transform: translateY(-1px);
}

.hero-action--primary {
  background: var(--color-accent);
  color: #fff;
}

.hero-action--secondary {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text);
}

.hero-metrics {
  display: grid;
  gap: 1rem;
  align-self: end;
}

.hero-metric {
  padding: 1rem 1.1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.hero-metric dt {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.66;
}

.hero-metric dd {
  margin-top: 0.4rem;
  font-size: 1.05rem;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .hero {
    min-height: 640px;
  }

  .hero-shell {
    grid-template-columns: 1fr;
    align-items: end;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .hero {
    min-height: 580px;
  }

  .hero-shell {
    padding-top: 5rem;
  }

  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: clamp(3.2rem, 16vw, 4.8rem);
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-action {
    width: 100%;
  }
}
</style>