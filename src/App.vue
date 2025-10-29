
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// Czysta aplikacja bez nawigacji - wszystko w Gallery
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  color: #ffffff;
}

#app {
  min-height: 100vh;
}
</style>
