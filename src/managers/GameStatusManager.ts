import { invoke } from "@tauri-apps/api/core";
import type { GameInfo } from '../types';

export class GameStatusManager {
  private t: (key: string) => string = (key) => key; // Will be injected
  
  constructor(translationFunction?: (key: string) => string) {
    if (translationFunction) {
      this.t = translationFunction;
    }
  }
  
  setTranslationFunction(t: (key: string) => string) {
    this.t = t;
  }
  
  async updateStatus() {
    try {
      const gameInfo = await invoke<GameInfo>('get_game_path');
      const statusDot = document.getElementById('smapi-indicator');
      const gameVersion = document.getElementById('game-version');
      const gamePathShort = document.getElementById('game-path-short');
      const smapiStatus = document.getElementById('smapi-status');
      
      if (gameInfo) {
        // Update sidebar status
        if (statusDot) statusDot.classList.add('connected');
        if (gameVersion) gameVersion.textContent = gameInfo.has_smapi ? 'SMAPI Ready' : 'SMAPI Missing';
        if (gamePathShort) {
          const shortPath = gameInfo.game_path.split(/[\\\\/]/).slice(-2).join('/');
          gamePathShort.textContent = shortPath;
        }
        
        // Update dashboard status
        if (smapiStatus) {
          if (gameInfo.has_smapi) {
            smapiStatus.className = 'status-indicator success';
            smapiStatus.textContent = this.t('smapi.found');
          } else {
            smapiStatus.className = 'status-indicator warning';
            smapiStatus.textContent = this.t('smapi.notInstalled');
          }
        }
      } else {
        // No game found
        if (statusDot) statusDot.classList.remove('connected');
        if (gameVersion) gameVersion.textContent = 'Not Found';
        if (gamePathShort) gamePathShort.textContent = 'Detecting...';
        
        if (smapiStatus) {
          smapiStatus.className = 'status-indicator error';
          smapiStatus.textContent = this.t('smapi.notFound');
        }
      }
    } catch (error) {
      console.error('Error updating game status:', error);
    }
  }
}