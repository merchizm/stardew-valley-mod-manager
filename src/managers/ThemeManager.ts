import { invoke } from "@tauri-apps/api/core";

export class ThemeManager {
  private currentTheme = 'default';
  
  init() {
    // Set up theme selector buttons
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = (e.currentTarget as HTMLElement).dataset.theme;
        if (theme) {
          this.switchTheme(theme);
        }
      });
    });
  }
  
  async switchTheme(theme: string) {
    try {
      await invoke('set_theme', { theme });
      this.applyTheme(theme);
      this.currentTheme = theme;
      
      // Update active theme button
      document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-theme="${theme}"]`)?.classList.add('active');
      
    } catch (error) {
      console.error('Error switching theme:', error);
    }
  }
  
  applyTheme(theme: string) {
    // Set data attribute for theme
    document.body.setAttribute('data-theme', theme);
    
    // Load theme CSS
    const existingThemeLink = document.getElementById('theme-css') as HTMLLinkElement;
    if (existingThemeLink) {
      existingThemeLink.remove();
    }
    
    const themeLink = document.createElement('link');
    themeLink.id = 'theme-css';
    themeLink.rel = 'stylesheet';
    themeLink.href = `/themes/${theme}.css`;
    document.head.appendChild(themeLink);
    
    this.currentTheme = theme;
  }
  
  getCurrentTheme(): string {
    return this.currentTheme;
  }
  
  setCurrentTheme(theme: string) {
    this.currentTheme = theme;
  }
}