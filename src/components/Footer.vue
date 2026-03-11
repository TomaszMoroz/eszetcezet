<template>
  <footer id="kontakt" class="site-footer">
    <div class="site-inner footer-shell">
      <div class="footer-intro">
        <p class="footer-kicker">Kontakt</p>
        <h2>Porozmawiajmy o sesji, kampanii albo o tym, jak zbudować plan pod konkretny rezultat.</h2>
        <p>Najlepiej sprawdza się krótki brief z celem projektu, formatem materiałów i terminem. Resztę można dopracować już po pierwszej rozmowie.</p>
      </div>

      <div class="footer-grid">
        <template v-if="footerBlocks && footerBlocks.length">
          <div v-for="(b, i) in footerBlocks" :key="i" class="footer-col" v-html="b"></div>
        </template>
        <template v-else>
          <div class="footer-col footer-col--primary">
            <h4>Szczepanski Studio</h4>
            <p>ul. Rydygiera 8 bud. 18 piętro 3<br/>01-793 Warszawa</p>
          </div>
          <div class="footer-col">
            <h4>Kontakt</h4>
            <p><a href="tel:+48534079773">+48 534 079 773</a><br/><a href="mailto:wero@warsawstudios.com">wero@warsawstudios.com</a></p>
          </div>
          <div class="footer-col">
            <h4>Dane do faktury</h4>
            <p>Warsaw Studios Grzegorz Klukowski<br/>NIP: 1181782655</p>
          </div>
        </template>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useSections } from '../composables/useSections'

const { sections } = useSections()

const footerBlocks = computed(() => {
  try { return sections.value && sections.value.footer && Array.isArray(sections.value.footer.blocks) ? sections.value.footer.blocks : null } catch (e) { return null }
})
</script>

<style>
.site-footer {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)),
    var(--section-footer-bg, var(--color-section-light));
  color: var(--section-footer-text-color, var(--color-text-dark));
  padding: 4rem 0;
}

.footer-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 2rem;
  align-items: start;
}

.footer-intro h2 {
  margin-bottom: 1rem;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
}

.footer-intro p {
  max-width: 32rem;
  line-height: 1.7;
}

.footer-kicker {
  margin-bottom: 1rem;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  opacity: 0.72;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.footer-col {
  padding: 1.1rem;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(31,43,42,0.08);
}

.footer-col--primary {
  background: color-mix(in srgb, var(--color-accent) 16%, rgba(255,255,255,0.08));
}

.footer-col h4 { margin-bottom: 0.75rem; }
.footer-col p { font-size: 0.95rem; line-height: 1.7 }
.footer-col a {
  color: inherit;
}

@media (max-width: 800px) {
  .footer-shell,
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>