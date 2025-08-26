import type { ModList } from '../types';

export class FilterManager {
  private activeFilter = 'all';
  private onFilterChange?: () => void;
  
  constructor(_cachedModList: ModList | null = null, onFilterChange?: () => void) {
    this.onFilterChange = onFilterChange;
  }
  
  setCachedModList(_modList: ModList | null) {
    // Cached mod list is handled externally via callback
  }
  
  setOnFilterChange(callback: () => void) {
    this.onFilterChange = callback;
  }
  
  getActiveFilter(): string {
    return this.activeFilter;
  }
  
  init() {
    document.querySelectorAll('.segment').forEach(segment => {
      segment.addEventListener('click', (e) => {
        const filter = (e.target as HTMLElement).dataset.filter;
        if (filter) {
          this.setFilter(filter);
        }
      });
    });
  }
  
  setFilter(filter: string) {
    this.activeFilter = filter;
    
    // Update UI
    document.querySelectorAll('.segment').forEach(segment => {
      segment.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
    
    // Re-render mods with new filter
    if (this.onFilterChange) {
      this.onFilterChange();
    }
  }
}