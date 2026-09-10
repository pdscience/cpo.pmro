<script setup lang="ts">
import { useThemeStore } from "@/stores/theme";
import { storeToRefs } from "pinia";

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);
</script>

<template>
  <button
    @click="themeStore.toggle"
    :aria-label="isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
    class="relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    :class="isDark ? 'bg-slate-600' : 'bg-slate-300'"
  >
    <span
      class="absolute inset-0 flex items-center justify-between px-1.5 opacity-100 transition-opacity"
      :class="isDark ? 'opacity-100' : 'opacity-0'"
    >
      <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m8.66-9H21m-2.69 0h-1.31M5.34 12H4.34m1.31 0h1.31M6.34 6.34l.7.7M16.95 16.95l-.7-.7M6.34 17.66l.7-.7M16.95 7.05l-.7.7"
      />
      </svg>
      <svg class="-mr-1 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3c.132 0 .264.006.393.018A9 9 0 0112 21a9 9 0 01-.393-17.982c.129.012.261.018.393.002z"
        />
      </svg>
    </span>
    <span
      class="absolute inset-0 flex items-center justify-between px-1.5 transition-opacity"
      :class="isDark ? 'opacity-0' : 'opacity-100'"
    >
      <svg class="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v2m0 14v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2m14 0h2M5.64 5.64l1.42 1.42M16.96 16.96l1.42 1.42"
        />
      </svg>
      <svg class="-mr-1 h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 2.25a9.75 9.75 0 00-9.75 9.75c0 4.418 3.582 8.25 8.25 9.25.688.114 1.396.18 2.115.186a9.75 9.75 0 00-.115-19.486c.719.006 1.427.072 2.115.186A9.75 9.75 0 0012 2.25z"
        />
      </svg>
    </span>
    <span
      class="absolute top-1/2 left-2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow transition-transform"
      :class="isDark ? 'translate-x-8' : 'translate-x-0'"
    ></span>
  </button>
</template>
