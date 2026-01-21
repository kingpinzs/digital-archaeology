import './styles/main.css';

// Path alias verification - ensures @state alias resolves correctly
// This import will be replaced with actual state imports in later stories
import '@state/index';

// Digital Archaeology - CPU Development Environment
// Application shell will be implemented in Story 1.5

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p class="text-xl">Digital Archaeology - Loading...</p>
    </div>
  `;
}
