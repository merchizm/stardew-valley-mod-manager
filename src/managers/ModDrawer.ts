import type { ModInfo } from '../types';

export class ModDrawer {
  private currentMod: ModInfo | null = null;
  
  init() {
    const closeBtn = document.getElementById('close-drawer');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.target as HTMLElement).dataset.tab;
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }
  
  openMod(mod: ModInfo) {
    this.currentMod = mod;
    
    const drawer = document.getElementById('mod-drawer');
    if (drawer) {
      drawer.classList.add('open');
    }
    
    const titleEl = document.getElementById('drawer-mod-name');
    if (titleEl) {
      titleEl.textContent = mod.name;
    }
    
    this.loadModDetails(mod);
  }
  
  close() {
    const drawer = document.getElementById('mod-drawer');
    if (drawer) {
      drawer.classList.remove('open');
    }
    this.currentMod = null;
  }
  
  private switchTab(tabName: string) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    
    if (this.currentMod) {
      this.loadTabContent(tabName, this.currentMod);
    }
  }
  
  private loadModDetails(mod: ModInfo) {
    // Load overview tab by default
    this.loadTabContent('overview', mod);
  }
  
  private loadTabContent(tab: string, mod: ModInfo) {
    const content = document.getElementById(`tab-${tab}`);
    if (!content) return;
    
    switch (tab) {
      case 'overview':
        content.innerHTML = `
          <div class="mod-details-overview">
            <h3>${mod.name}</h3>
            <p><strong>Version:</strong> ${mod.version || 'Unknown'}</p>
            <p><strong>Author:</strong> ${mod.author || 'Unknown'}</p>
            <p><strong>Description:</strong></p>
            <p>${mod.description || 'No description available'}</p>
            <p><strong>Path:</strong> ${mod.path}</p>
            <p><strong>Has Manifest:</strong> ${mod.has_manifest ? 'Yes' : 'No'}</p>
          </div>
        `;
        break;
      case 'requirements':
        content.innerHTML = `
          <div class="mod-requirements">
            <h3>Dependencies</h3>
            <p>No dependency information available</p>
          </div>
        `;
        break;
      case 'changelog':
        content.innerHTML = `
          <div class="mod-changelog">
            <h3>Changelog</h3>
            <p>No changelog information available</p>
          </div>
        `;
        break;
      case 'files':
        content.innerHTML = `
          <div class="mod-files">
            <h3>Files</h3>
            <p>Folder: ${mod.folder_name}</p>
            <p>Full path: ${mod.path}</p>
          </div>
        `;
        break;
    }
  }
}