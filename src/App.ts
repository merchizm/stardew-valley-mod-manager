import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import {
  NavigationManager,
  ThemeManager,
  SettingsManager,
  GameStatusManager,
  FilterManager,
  ModManager,
  ModDrawer
} from './managers';

import type { LanguageResponse, ThemeResponse } from './types';
import { t, setTranslations, updateUITexts } from './utils/translation';
import { startGame } from './utils/gameActions';

// Main Application
export class App {
  public navigation: NavigationManager;
  public themeManager: ThemeManager;
  public settingsManager: SettingsManager;
  public gameStatus: GameStatusManager;
  public filterManager: FilterManager;
  public modManager: ModManager;
  public modDrawer: ModDrawer;
  
  private currentLanguage = 'tr';
  private currentTheme = 'default';
  
  constructor() {
    // Initialize all managers
    this.modManager = new ModManager(t);
    this.modDrawer = new ModDrawer();
    this.navigation = new NavigationManager();
    this.themeManager = new ThemeManager();
    this.settingsManager = new SettingsManager();
    this.gameStatus = new GameStatusManager(t);
    this.filterManager = new FilterManager(null, () => {
      this.modManager.setActiveFilter(this.filterManager.getActiveFilter());
      this.modManager.updateModList();
    });
    
    // Set up relationships
    this.modManager.setOnModDetailsClick((mod) => {
      this.modDrawer.openMod(mod);
    });
    
    this.navigation.setOnLoadModsData(async () => {
      await this.modManager.updateModList();
    });
    
    this.navigation.setOnLoadSettingsData(async () => {
      await this.settingsManager.loadSettings();
    });
  }
  
  async init() {
    console.log('Initializing Stardew Valley Mod Manager...');
    
    try {
      // Load language and translations
      const langData = await invoke<LanguageResponse>('get_language');
      this.currentLanguage = langData.language;
      setTranslations(langData.translations);
      
      this.settingsManager.setCurrentLanguage(this.currentLanguage);
      
      console.log('Loaded language:', this.currentLanguage);
      console.log('Translation keys count:', Object.keys(langData.translations).length);
      
      // Load theme
      const themeData = await invoke<ThemeResponse>('get_theme');
      this.currentTheme = themeData.theme;
      this.themeManager.setCurrentTheme(this.currentTheme);
      this.themeManager.applyTheme(this.currentTheme);
      
      // Update UI texts
      updateUITexts();
      
      // Initialize all managers
      this.navigation.setCachedModList(this.modManager.getCachedModList());
      this.filterManager.setCachedModList(this.modManager.getCachedModList());
      
      this.navigation.init();
      this.themeManager.init();
      this.settingsManager.init();
      this.filterManager.init();
      this.modDrawer.init();
      
      // Update game status
      await this.gameStatus.updateStatus();
      
      // Load initial data
      await this.modManager.updateModList();
      
      // Update cached mod list in other managers
      const cachedModList = this.modManager.getCachedModList();
      this.navigation.setCachedModList(cachedModList);
      this.filterManager.setCachedModList(cachedModList);
      
      // Set up global event handlers
      this.setupEventHandlers();
      
      console.log('App initialized successfully');
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.showFallbackUI();
    }
  }
  
  private setupEventHandlers() {
    // Global refresh button
    const refreshBtn = document.getElementById('refresh-all');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.modManager.updateModList();
        await this.gameStatus.updateStatus();
        
        // Update cached mod list in other managers
        const cachedModList = this.modManager.getCachedModList();
        this.navigation.setCachedModList(cachedModList);
        this.filterManager.setCachedModList(cachedModList);
      });
    }
    
    // Refresh mods button
    const refreshModsBtn = document.getElementById('refresh-mods');
    if (refreshModsBtn) {
      refreshModsBtn.addEventListener('click', async () => {
        await this.modManager.updateModList();
        
        // Update cached mod list in other managers
        const cachedModList = this.modManager.getCachedModList();
        this.navigation.setCachedModList(cachedModList);
        this.filterManager.setCachedModList(cachedModList);
      });
    }
    
    // Play game buttons
    const playBtn = document.getElementById('play-game');
    if (playBtn) {
      playBtn.addEventListener('click', startGame);
    }
    
    const playVanillaBtn = document.getElementById('play-vanilla');
    if (playVanillaBtn) {
      playVanillaBtn.addEventListener('click', startGame); // Same for now
    }
  }
  
  private showFallbackUI() {
    const smapiStatus = document.getElementById('smapi-status');
    if (smapiStatus) {
      smapiStatus.innerHTML = `
        <div class="status-indicator warning">
          Demo Mode: Backend functionality not available
        </div>
      `;
    }
  }
  
  async setupTauriListeners() {
    try {
      // Listen for language changes
      await listen('language-changed', (event: any) => {
        this.currentLanguage = event.payload.language;
        setTranslations(event.payload.translations);
        this.settingsManager.setCurrentLanguage(this.currentLanguage);
        
        console.log('Language changed to:', this.currentLanguage);
        updateUITexts();
        this.modManager.updateModList();
        this.gameStatus.updateStatus();
      });
      
      // Listen for theme changes
      await listen('theme-changed', (event: any) => {
        this.currentTheme = event.payload.theme;
        this.themeManager.setCurrentTheme(this.currentTheme);
        this.themeManager.applyTheme(this.currentTheme);
      });
      
      console.log('Tauri event listeners set up');
    } catch (error) {
      console.error('Error setting up Tauri event listeners:', error);
    }
  }
}