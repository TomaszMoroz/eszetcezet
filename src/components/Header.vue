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
          <button class="hamburger" @click="mobileOpen = !mobileOpen" aria-label="Toggle menu">☰</button>
          <nav :class="['main-nav', { open: mobileOpen }]">
            <a href="#" class="nav-link" @click.prevent="scrollToSection('top')">Home</a>
            <a href="#works" class="nav-link" @click.prevent="scrollToSection('works')">Portfolio</a>
            <a href="#kontakt" class="nav-link" @click.prevent="scrollToSection('kontakt')">Kontakt</a>
          </nav>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const mobileOpen = ref(false)

function scrollToSection(section) {
  mobileOpen.value = false
  let target
  if (section === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (section === 'works') {
    target = document.getElementById('works')
  } else if (section === 'kontakt') {
    // scroll to bottom of page
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    return
  }
  if (target) {
    const y = target.getBoundingClientRect().top + window.scrollY - 20
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}
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

.hamburger { display: none; }
@media (max-width: 900px) {
  .main-nav { display: none; }
  .hamburger { display: block; background: transparent; border: 1px solid rgba(255,255,255,0.06); color: var(--color-text); padding: 0.4rem 0.6rem; border-radius: 6px; }
  .main-nav.open { display: flex; position: absolute; right: 1.5rem; top: 64px; flex-direction: column; background: var(--section-navbar-bg, var(--color-header-bg)); padding: 0.75rem; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.5) }
  .main-nav.open .nav-link { margin: 0.3rem 0 }
}

@media (min-width: 1200px) {
  .main-nav a { font-size: 1.12rem; }
}
</style>