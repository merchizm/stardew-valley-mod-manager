import type { ModList } from '../types';

export class NavigationManager {
  private currentSection = 'dashboard';
  private cachedModList: ModList | null = null;
  private onLoadModsData?: () => Promise<void>;
  private onLoadSettingsData?: () => Promise<void>;
  
  constructor(cachedModList: ModList | null = null) {
    this.cachedModList = cachedModList;
  }
  
  setCachedModList(modList: ModList | null) {
    this.cachedModList = modList;
  }
  
  setOnLoadModsData(callback: () => Promise<void>) {
    this.onLoadModsData = callback;
  }
  
  setOnLoadSettingsData(callback: () => Promise<void>) {
    this.onLoadSettingsData = callback;
  }
  
  init() {
    // Set up navigation click handlers
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = (e.currentTarget as HTMLElement).dataset.section;
        if (section) {
          this.navigateToSection(section);
        }
      });
    });
    
    // Initialize with dashboard
    this.navigateToSection('dashboard');
  }
  
  navigateToSection(section: string) {
    // Update navigation state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(section)?.classList.add('active');
    
    this.currentSection = section;
    console.log('Navigated to section:', this.currentSection);
    
    // Load section-specific data
    this.loadSectionData(section);
  }
  
  private async loadSectionData(section: string) {
    switch (section) {
      case 'dashboard':
        await this.loadDashboardData();
        break;
      case 'mods':
        await this.loadModsData();
        break;
      case 'conflicts':
        await this.loadConflictsData();
        break;
      case 'settings':
        await this.loadSettingsData();
        break;
    }
  }
  
  private async loadDashboardData() {
    // Update mod count and stats
    if (this.cachedModList) {
      const modCountEl = document.getElementById('mod-count');
      if (modCountEl) {
        modCountEl.textContent = this.cachedModList.active.length.toString();
      }
      
      // Show conflict count (placeholder)
      const conflictCountEl = document.getElementById('conflict-count');
      if (conflictCountEl) {
        conflictCountEl.textContent = '0';
      }
    }
  }
  
  private async loadModsData() {
    if (this.onLoadModsData) {
      await this.onLoadModsData();
    } else {
      console.log('Loading mods data...');
    }
  }
  
  private async loadConflictsData() {
    // Placeholder for conflicts detection
    console.log('Loading conflicts data...');
  }
  
  private async loadSettingsData() {
    if (this.onLoadSettingsData) {
      await this.onLoadSettingsData();
    } else {
      console.log('Loading settings data...');
    }
  }
}