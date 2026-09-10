import { defineStore } from "pinia";
import { ref, watch } from "vue";

const STORAGE_KEY = "cpo_theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

function getStoredTheme(): "light" | "dark" {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(getStoredTheme() === "dark");

  function init() {
    const theme = isDark.value ? "dark" : "light";
    applyTheme(theme);
  }

  function toggle() {
    isDark.value = !isDark.value;
    const theme = isDark.value ? "dark" : "light";
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function set(theme: "light" | "dark") {
    isDark.value = theme === "dark";
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  watch(isDark, (value) => {
    applyTheme(value ? "dark" : "light");
  });

  return { isDark, init, toggle, set };
});
