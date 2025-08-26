import { invoke } from "@tauri-apps/api/core";
import type { ModList, ModInfo, GameInfo, ModCategory } from '../types';

export class ModManager {
  private cachedModList: ModList | null = null;
  private activeFilter = 'all';
  private t: (key: string) => string = (key) => key; // Will be injected
  private onModDetailsClick?: (mod: ModInfo) => void;
  
  constructor(translationFunction?: (key: string) => string) {
    if (translationFunction) {
      this.t = translationFunction;
    }
  }
  
  setTranslationFunction(t: (key: string) => string) {
    this.t = t;
  }
  
  setActiveFilter(filter: string) {
    this.activeFilter = filter;
  }
  
  setOnModDetailsClick(callback: (mod: ModInfo) => void) {
    this.onModDetailsClick = callback;
  }
  
  getCachedModList(): ModList | null {
    return this.cachedModList;
  }

  async updateModList(): Promise<void> {
    try {
      console.log('Scanning mods...');
      const mods = await invoke<ModList>('scan_mods');
      
      if (!mods) {
        console.log('No mods data received');
        return;
      }
      
      this.cachedModList = mods;
      console.log('Mods data received:', {
        active: mods.active.length,
        deactivated: mods.deactivated.length,
        invalid: mods.invalid.length
      });
      
      this.renderModCategories(mods);
      this.updateModCounts(mods);
      
    } catch (error) {
      console.error('Error updating mod list:', error);
      this.showError('Failed to load mods');
    }
  }
  
  private renderModCategories(mods: ModList) {
    const categories = [
      { id: 'active-mods', mods: mods.active, type: 'active' as const },
      { id: 'deactivated-mods', mods: mods.deactivated, type: 'deactivated' as const },
      { id: 'invalid-mods', mods: mods.invalid, type: 'invalid' as const }
    ];
    
    categories.forEach(category => {
      const container = document.getElementById(category.id);
      if (!container) return;
      
      const itemsContainer = container.querySelector('.mod-items');
      if (!itemsContainer) return;
      
      itemsContainer.innerHTML = '';
      
      if (category.mods.length === 0) {
        itemsContainer.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📦</span>
            <p>No ${category.type} mods</p>
          </div>
        `;
        return;
      }
      
      category.mods.forEach(mod => {
        if (this.shouldShowMod(mod, category.type)) {
          const modElement = this.createModElement(mod, category.type);
          itemsContainer.appendChild(modElement);
        }
      });
    });
  }
  
  private shouldShowMod(_mod: ModInfo, type: ModCategory): boolean {
    switch (this.activeFilter) {
      case 'all':
        return true;
      case 'enabled':
        return type === 'active';
      case 'disabled':
        return type === 'deactivated';
      case 'conflicts':
        return false; // TODO: implement conflict detection
      default:
        return true;
    }
  }
  
  private createModElement(mod: ModInfo, category: ModCategory): HTMLElement {
    const modElement = document.createElement('div');
    modElement.className = `mod-item ${category === 'invalid' ? 'invalid' : ''}`;
    
    const modInfo = document.createElement('div');
    modInfo.className = 'mod-item-info';
    
    const header = document.createElement('div');
    header.className = 'mod-item-header';
    
    const title = document.createElement('div');
    title.className = 'mod-item-title';
    title.textContent = mod.name;
    
    const version = document.createElement('div');
    version.className = 'mod-item-version';
    version.textContent = mod.version || 'Unknown';
    
    header.appendChild(title);
    if (mod.version) header.appendChild(version);
    
    if (mod.author) {
      const author = document.createElement('div');
      author.className = 'mod-item-author';
      author.textContent = `By: ${mod.author}`;
      modInfo.appendChild(author);
    }
    
    if (mod.description) {
      const description = document.createElement('div');
      description.className = 'mod-item-description';
      description.textContent = mod.description;
      modInfo.appendChild(description);
    }
    
    modInfo.insertBefore(header, modInfo.firstChild);
    modElement.appendChild(modInfo);
    
    // Add action buttons
    if (category !== 'invalid') {
      const actions = document.createElement('div');
      actions.className = 'mod-actions';
      
      const toggleButton = document.createElement('button');
      toggleButton.className = 'btn btn-small btn-secondary';
      toggleButton.textContent = category === 'active' ? this.t('mods.deactivate') : this.t('mods.activate');
      toggleButton.onclick = () => this.toggleMod(mod, category);
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-small btn-danger';
      deleteButton.textContent = this.t('mods.delete');
      deleteButton.onclick = () => this.deleteMod(mod);
      
      const detailsButton = document.createElement('button');
      detailsButton.className = 'btn btn-small btn-ghost';
      detailsButton.textContent = 'Details';
      detailsButton.onclick = () => {
        // Will be handled by callback
        if (this.onModDetailsClick) {
          this.onModDetailsClick(mod);
        }
      };
      
      actions.appendChild(toggleButton);
      actions.appendChild(deleteButton);
      actions.appendChild(detailsButton);
      modElement.appendChild(actions);
    }
    
    return modElement;
  }
  
  private updateModCounts(mods: ModList) {
    const counts = {
      'active-mods': mods.active.length,
      'deactivated-mods': mods.deactivated.length,
      'invalid-mods': mods.invalid.length
    };
    
    Object.entries(counts).forEach(([id, count]) => {
      const countElement = document.querySelector(`#${id} .mod-count`);
      if (countElement) {
        countElement.textContent = count.toString();
      }
    });
  }
  
  async toggleMod(mod: ModInfo, currentState: 'active' | 'deactivated'): Promise<void> {
    try {
      const gameInfo = await invoke<GameInfo>('get_game_path');
      if (!gameInfo) {
        console.error('Game path not found');
        return;
      }
      
      const success = await invoke<boolean>('toggle_mod', {
        modPath: mod.path,
        isActive: currentState === 'active',
        gamePath: gameInfo.game_path
      });
      
      if (success) {
        await this.updateModList();
        this.showSuccess(`${mod.name} ${currentState === 'active' ? 'deactivated' : 'activated'}`);
      } else {
        this.showError(`Failed to ${currentState === 'active' ? 'deactivate' : 'activate'} ${mod.name}`);
      }
    } catch (error) {
      console.error(`Error toggling mod:`, error);
      this.showError('An error occurred while toggling the mod');
    }
  }
  
  async deleteMod(mod: ModInfo): Promise<void> {
    if (!confirm(`Are you sure you want to delete ${mod.name}?`)) {
      return;
    }
    
    try {
      const success = await invoke<boolean>('delete_mod', { modPath: mod.path });
      
      if (success) {
        await this.updateModList();
        this.showSuccess(`${mod.name} deleted`);
      } else {
        this.showError(`Failed to delete ${mod.name}`);
      }
    } catch (error) {
      console.error(`Error deleting mod:`, error);
      this.showError('An error occurred while deleting the mod');
    }
  }
  
  private showSuccess(message: string) {
    // TODO: Implement toast notifications
    console.log('Success:', message);
  }
  
  private showError(message: string) {
    // TODO: Implement toast notifications
    console.error('Error:', message);
  }
}