import './styles/main.css';

// Theme system - initialize on app startup
import { initTheme, toggleTheme } from '@ui/index';

// Digital Archaeology - CPU Development Environment
// Application shell will be implemented in Story 1.5

// Initialize theme from stored preference or default (lab mode)
const currentTheme = initTheme();

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  // Note: innerHTML with static template - no user input, safe from XSS
  app.innerHTML = `
    <div class="min-h-screen bg-da-bg-primary text-da-text-primary flex flex-col items-center justify-center gap-4">
      <h1 class="text-2xl font-bold">Digital Archaeology</h1>
      <p class="text-da-text-secondary">CPU Development Environment</p>
      <p class="text-sm">Current theme: <span id="theme-display" class="text-da-accent font-mono">${currentTheme}</span></p>
      <button
        id="theme-toggle"
        class="px-4 py-2 bg-da-accent text-da-bg-primary rounded hover:bg-da-accent-hover transition-colors"
      >
        Toggle Theme
      </button>
      <p class="text-xs text-da-text-secondary mt-4">Application shell coming in Story 1.5</p>
    </div>
  `;

  // Add theme toggle functionality for testing
  const toggleButton = document.querySelector<HTMLButtonElement>('#theme-toggle');
  const themeDisplay = document.querySelector<HTMLSpanElement>('#theme-display');

  if (toggleButton && themeDisplay) {
    toggleButton.addEventListener('click', () => {
      const newTheme = toggleTheme();
      themeDisplay.textContent = newTheme;
    });
  }
}
