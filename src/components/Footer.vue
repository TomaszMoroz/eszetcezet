<template>
  <footer id="kontakt" class="site-footer">
    <div class="site-inner footer-grid">
      <template v-if="footerBlocks && footerBlocks.length">
        <div v-for="(b, i) in footerBlocks" :key="i" class="footer-col" v-html="b"></div>
      </template>
      <template v-else>
        <div class="footer-col">
          <h4>Warsaw Studios</h4>
          <p>ul. Rydygiera 8 bud. 18 piętro 3<br/>01-793 Warszawa</p>
        </div>
        <div class="footer-col">
          <h4>Kontakt</h4>
          <p>+48 534 079 773<br/>wero@warsawstudios.com</p>
        </div>
        <div class="footer-col">
          <h4>Dane do faktury</h4>
          <p>Warsaw Studios Grzegorz Klukowski<br/>NIP: 1181782655</p>
        </div>
      </template>
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
  background: var(--section-footer-bg, var(--color-section-light)); /* theme-controlled light section */
  color: var(--section-footer-text-color, var(--color-text-dark));
  padding: 2.5rem 0;
}
.container { max-width: 1300px; margin: 0 auto; padding: 0 1.5rem; }
.footer-grid { display:flex; gap:2rem; }
.footer-col h4 { margin-bottom:0.5rem; }
.footer-col p { font-size:0.95rem; line-height:1.5 }
@media (max-width: 800px) {
  .footer-grid { flex-direction: column; }
}
</style>