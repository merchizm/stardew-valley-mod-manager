import { invoke } from "@tauri-apps/api/core";
import type { GameInfo } from '../types';

export class SettingsManager {
  private currentLanguage = 'tr';
  
  async loadSettings() {
    try {
      // Load current game path
      const gameInfo = await invoke<GameInfo>('get_game_path');
      const pathInput = document.getElementById('game-path') as HTMLInputElement;
      if (pathInput && gameInfo) {
        pathInput.value = gameInfo.game_path;
      }
      
      // Load language setting
      const langSelect = document.getElementById('language-select') as HTMLSelectElement;
      if (langSelect) {
        langSelect.value = this.currentLanguage;
      }
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  init() {
    // Language selector
    const langSelect = document.getElementById('language-select') as HTMLSelectElement;
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const newLang = (e.target as HTMLSelectElement).value;
        this.changeLanguage(newLang);
      });
    }
  }
  
  async changeLanguage(language: string) {
    try {
      await invoke('set_language', { language });
      // Language change will be handled by the event listener
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }
  
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  
  setCurrentLanguage(language: string) {
    this.currentLanguage = language;
  }
}