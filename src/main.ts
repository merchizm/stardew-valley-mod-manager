import { App } from './App';
import { startGame, openFolder } from './utils/gameActions';

// Global instances
const app = new App();

// Export for other modules that need access
export { app };
export const modManager = app.modManager;
export const modDrawer = app.modDrawer;

// Make functions available globally for onclick handlers
declare global {
  interface Window {
    startGame: () => Promise<void>;
    openFolder: (folderType: string) => Promise<void>;
  }
}

window.startGame = startGame;
window.openFolder = openFolder;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing app...');
  
  // Set up Tauri listeners first
  await app.setupTauriListeners();
  
  // Initialize the app
  await app.init();
});