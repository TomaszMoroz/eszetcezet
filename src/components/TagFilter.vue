<template>
  <div class="tags">
    <span v-for="tag in tags" :key="tag" :class="{selected: selected===tag}" @click="$emit('select', tag)">{{ tag }}</span>
  </div>
</template>

<script setup>
defineProps({
  tags: Array,
  selected: String
});
</script>

<style scoped>
.tags {
  display: flex;
  gap: 1rem;
}
.tags span {
  background: var(--color-section-dark);
  padding: 0.3rem 1rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--color-text);
}
.tags span.selected {
  background: var(--color-accent);
  color: var(--color-text);
}
</style>
