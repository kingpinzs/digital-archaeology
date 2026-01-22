import './styles/main.css';

// Theme system and application shell
import { initTheme, App } from '@ui/index';

// Digital Archaeology - CPU Development Environment
// Initialize theme from stored preference or default (lab mode)
initTheme();

// Mount the application
const appContainer = document.querySelector<HTMLDivElement>('#app');
if (appContainer) {
  const app = new App();
  app.mount(appContainer);
}
