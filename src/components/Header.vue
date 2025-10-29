<template>
  <header class="site-header">
    <div class="site-inner">
      <div class="brand">
        <div class="logo-wrap">
          <img src="/img/graph/logo_bw.png" alt="Warsaw Studios logo" class="logo-img" />
        </div>
      </div>
      <div class="brand-text">
        <slot name="brand"> </slot>
      </div>
      <nav class="main-nav">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link :to="{ path: '/', hash: '#works' }" class="nav-link">Portfolio</router-link>
        <router-link :to="{ path: '/', hash: '#kontakt' }" class="nav-link">Kontakt</router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
// prosty statyczny header — można później podpiąć router-link
</script>

<style scoped>
.site-header {
  background: var(--section-navbar-bg, var(--color-header-bg)); /* header color controlled from main.css */
  color: var(--color-text);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.site-inner {
  max-width: 1280px;
  margin: 0 auto; 
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}
.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.logo-wrap {
  width: 88px;
  height: 88px;
  display:flex;
  align-items:center;
  justify-content:center;
}
.logo-img {
  max-height: 72px;
  display: block;
  filter: grayscale(100%);
}

/* Larger logo on wide screens */
@media (min-width: 1200px) {
  .logo-wrap {
    width: 180px;
    height: 180px;
  }
  .logo-img {
    max-height: 160px;
  }
  .brand-name {
    font-size: 1.15rem;
  }
}
.brand-name {
  font-weight:700;
  letter-spacing: 1px;
}
.main-nav a {
  color: #fff;
  text-decoration: none;
  margin-left: 1rem;
  font-size: 0.95rem;
}
@media (max-width: 900px) {
  .main-nav { display: none; }
}
</style>