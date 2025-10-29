<template>
  <footer id="kontakt" class="site-footer">
    <div class="site-inner footer-grid">
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
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.site-footer {
  background: var(--color-section-light); /* theme-controlled light section */
  color: var(--color-text-dark);
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