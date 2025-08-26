// Bu dosya Tauri frontend'inde çalışacak olan JavaScript kodunu içerir
console.log('Tauri frontend başlatıldı')
console.log('User agent:', navigator.userAgent)
console.log('Window location:', window.location.href)
console.log('Is file protocol?', window.location.protocol === 'file:')
console.log('Is https?', window.location.protocol === 'https:')
console.log('Is tauri?', window.location.protocol === 'tauri:' || window.location.protocol === 'https:')
console.log('Available globals:', Object.keys(window).filter(key => key.includes('TAURI') || key.includes('tauri')))
console.log('All window keys (first 20):', Object.keys(window).slice(0, 20))

// Tauri API globals - will be set when Tauri is available
let invoke = null;
let listen = null;

// Initialize Tauri API
function initTauri() {
    console.log('Checking for Tauri APIs...');
    console.log('Current protocol:', window.location.protocol);
    console.log('Current host:', window.location.host);
    console.log('User agent:', navigator.userAgent);
    console.log('window.__TAURI__ exists:', !!window.__TAURI__);
    
    // Check if we're in Tauri environment
    const isTauri = window.location.protocol === 'tauri:' || 
                   (window.__TAURI__ && typeof window.__TAURI__ === 'object');
    
    console.log('Is Tauri environment:', isTauri);
    
    if (window.__TAURI__) {
        console.log('__TAURI__ contents:', Object.keys(window.__TAURI__));
        if (window.__TAURI__.tauri) {
            console.log('tauri contents:', Object.keys(window.__TAURI__.tauri));
        }
        if (window.__TAURI__.event) {
            console.log('event contents:', Object.keys(window.__TAURI__.event));
        }
    }
    
    // Try multiple ways to access Tauri APIs
    if (window.__TAURI__ && window.__TAURI__.tauri && window.__TAURI__.event) {
        invoke = window.__TAURI__.tauri.invoke;
        listen = window.__TAURI__.event.listen;
        console.log('Tauri APIs loaded successfully via __TAURI__');
        return true;
    }
    
    // Alternative access method
    if (window.__TAURI_INVOKE__ && window.__TAURI_LISTEN__) {
        invoke = window.__TAURI_INVOKE__;
        listen = window.__TAURI_LISTEN__;
        console.log('Tauri APIs loaded successfully via globals');
        return true;
    }
    
    console.log('Tauri APIs not found');
    return false;
}

// Wait for Tauri to be available
function waitForTauri() {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkTauri = () => {
            console.log(`Tauri check attempt ${attempts + 1}`);
            if (initTauri()) {
                console.log('Tauri became available!');
                resolve(true);
            } else if (attempts < 200) { // More attempts
                attempts++;
                setTimeout(checkTauri, 50);
            } else {
                console.error('Tauri not available after waiting');
                resolve(false);
            }
        };
        checkTauri();
    });
}

// Çeviriler için global değişkenler
let currentLanguage = 'tr';
let currentTheme = 'default';
let translations = {};

// Tema değişim olayını dinle
document.addEventListener('theme-changed', (event) => {
    currentTheme = event.detail.theme;
    
    // Tema CSS'ini değiştir
    updateTheme(currentTheme);
    
    // Tema değiştiğini bildir
    showToast(translations.themes?.themeChanged || 'Tema değiştirildi!');
});

// Tema yükleme fonksiyonu
function updateTheme(themeName) {
    const themeLink = document.getElementById('theme-css');
    
    // Eğer tema linki yoksa oluştur
    if (!themeLink) {
        const link = document.createElement('link');
        link.id = 'theme-css';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = `themes/${themeName}.css`;
        document.head.appendChild(link);
    } else {
        // Varsa sadece href'i güncelle
        themeLink.href = `themes/${themeName}.css`;
    }
    
    console.log(`Tema yüklendi: ${themeName}`);
}

// Toast mesaj gösterme fonksiyonu
function showToast(message, duration = 3000) {
    // Eğer önceden toast varsa kaldır
    const existingToast = document.getElementById('toast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Yeni toast oluştur
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.textContent = message;
    
    // Toast stilini ekle (CSS zaten varsa atlanacak)
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--success-bg, #90EE90);
                color: var(--success-text, #006400);
                border: 2px solid var(--success-border, #006400);
                padding: 10px 20px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 9999;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
                font-family: 'Press Start 2P', cursive;
                font-size: 8px;
            }
            
            .toast.show {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Toast'u ekle
    document.body.appendChild(toast);
    
    // Görünür yap
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Belirli süre sonra kaldır
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Çeviri fonksiyonu
function t(key) {
    if (!translations || Object.keys(translations).length === 0) {
        // Fallback translations for demo mode
        const fallbackTranslations = {
            'app.header': '🌾 Stardew Valley Mod Yöneticisi 🌾',
            'game.location': 'Stardew Valley Konumu:',
            'mods.refresh': '🔄 Yenile',
            'mods.activeMods': 'Aktif Modlar',
            'mods.deactivatedMods': 'Deaktif Modlar', 
            'mods.invalidMods': 'Hatalı Modlar',
            'game.startGame': '🎮 Oyunu Başlat',
            'game.openModsFolder': '📁 Mod Klasörü',
            'game.openDeactivatedFolder': '📁 Deaktif Modlar',
            'game.compactView': 'Kompakt Görünüm',
            'smapi.installed': 'SMAPI Kurulu',
            'smapi.notFound': 'Oyun bulunamadı',
            'smapi.notInstalled': 'SMAPI kurulu değil'
        };
        
        return fallbackTranslations[key] || key;
    }
    
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            return key; // Çeviri bulunamazsa anahtarı geri döndür
        }
    }
    
    return value;
}

// Dil değişikliği olayını dinle
document.addEventListener('language-changed', (event) => {
    currentLanguage = event.detail.language;
    translations = event.detail.translations;
    
    // UI'daki tüm metinleri güncelle
    updateUITexts();
    
    // Mod listesini yeniden yükle
    updateModList();
});

// UI metinlerini güncelleme fonksiyonu
function updateUITexts() {
    console.log("UI metinleri güncelleniyor... Dil:", currentLanguage, translations);
    
    // Başlık
    document.querySelector('.header h1').textContent = t('app.header');
    
    // Oyun konumu
    const gamePathLabel = document.querySelector('.game-path-label');
    if (gamePathLabel) {
        gamePathLabel.textContent = t('game.location');
    }
    
    // Butonlar
    const refreshButton = document.getElementById('refresh-mods');
    if (refreshButton) {
        refreshButton.textContent = t('mods.refresh');
    }
    
    // Kategori başlıkları
    const activeModsTitle = document.querySelector('#active-mods .mod-category-title');
    if (activeModsTitle) {
        activeModsTitle.textContent = t('mods.activeMods');
    }
    
    const deactivatedModsTitle = document.querySelector('#deactivated-mods .mod-category-title');
    if (deactivatedModsTitle) {
        deactivatedModsTitle.textContent = t('mods.deactivatedMods');
    }
    
    const invalidModsTitle = document.querySelector('#invalid-mods .mod-category-title');
    if (invalidModsTitle) {
        invalidModsTitle.textContent = t('mods.invalidMods');
    }
    
    // Aksiyon butonları
    const startGameBtn = document.querySelector('.action-button.play');
    if (startGameBtn) {
        startGameBtn.textContent = t('game.startGame');
    }
    
    const openModsFolderBtn = document.querySelector('.action-button[data-folder="mods"]');
    if (openModsFolderBtn) {
        openModsFolderBtn.textContent = t('game.openModsFolder');
    }
    
    const openDeactivatedFolderBtn = document.querySelector('.action-button[data-folder="deactivated"]');
    if (openDeactivatedFolderBtn) {
        openDeactivatedFolderBtn.textContent = t('game.openDeactivatedFolder');
    }
    
    // Kompakt görünüm metni
    const compactViewLabel = document.querySelector('label[for="compact-view"]');
    if (compactViewLabel) {
        compactViewLabel.textContent = t('game.compactView');
    }
    
    // SMAPI durumu
    const smapiBox = document.querySelector('.success-box');
    if (smapiBox && smapiBox.textContent.includes('SMAPI')) {
        smapiBox.textContent = t('smapi.installed');
    }
    
    // Mod listesini yenile - buradaki mod butonları da çevrilecek
    updateModList();
}

// Piksel tarzı tıklama sesi oluştur
const createClickSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);
};

// Mod listesini oluştur
function createModElement(mod, isInvalid = false) {
    const modElement = document.createElement('div');
    modElement.className = `mod-item ${isInvalid ? 'invalid' : ''}`;

    if (isInvalid) {
        modElement.innerHTML = `
            <div class="mod-item-header">
                <span class="mod-item-title">${mod.name}</span>
            </div>
            <div class="mod-item-description">${t('mods.error')}${mod.reason}</div>
            <div class="mod-actions">
                <button class="mod-action-button danger" onclick="handleModAction('${mod.folderName}', '${mod.path}', 'delete')">
                    🗑️ ${t('mods.delete')}
                </button>
            </div>
        `;
    } else {
        // Manifest olan modlar için görünüm
        let versionText = mod.version ? `v${mod.version}` : '';
        let authorText = mod.author ? `${t('mods.author')}${mod.author}` : '';
        let descriptionText = mod.description || '';

        modElement.innerHTML = `
            <div class="mod-item-header">
                <span class="mod-item-title">${mod.name}</span>
                ${versionText ? `<span class="mod-item-version">${versionText}</span>` : ''}
            </div>
            ${authorText ? `<div class="mod-item-author">${authorText}</div>` : ''}
            ${descriptionText ? `<div class="mod-item-description">${descriptionText}</div>` : ''}
            <div class="mod-actions">
                ${mod.active ? 
                    `<button class="mod-action-button" onclick="handleModAction('${mod.folderName}', '${mod.path}', 'deactivate')">
                        📴 ${t('mods.deactivate')}
                    </button>` : 
                    `<button class="mod-action-button" onclick="handleModAction('${mod.folderName}', '${mod.path}', 'activate')">
                        📳 ${t('mods.activate')}
                    </button>`
                }
                <button class="mod-action-button danger" onclick="handleModAction('${mod.folderName}', '${mod.path}', 'delete')">
                    🗑️ ${t('mods.delete')}
                </button>
            </div>
        `;
    }

    return modElement;
}

// Mod listesini güncelle
async function updateModList() {
    if (!invoke) {
        console.error('Tauri invoke not available');
        return;
    }
    
    try {
        const mods = await invoke('scan_mods');
        
        // Mod listelerini temizle
        document.getElementById('active-mods').innerHTML = `<div class="mod-category-title">${t('mods.activeMods')}</div>`;
        document.getElementById('deactivated-mods').innerHTML = `<div class="mod-category-title">${t('mods.deactivatedMods')}</div>`;
        document.getElementById('invalid-mods').innerHTML = `<div class="mod-category-title">${t('mods.invalidMods')}</div>`;

        if (!mods) return;

        // Aktif modları ekle
        mods.active.forEach(mod => {
            mod.active = true;
            document.getElementById('active-mods').appendChild(createModElement(mod));
        });

        // Deaktif modları ekle
        mods.deactivated.forEach(mod => {
            mod.active = false;
            document.getElementById('deactivated-mods').appendChild(createModElement(mod));
        });

        // Geçersiz modları ekle
        mods.invalid.forEach(mod => {
            document.getElementById('invalid-mods').appendChild(createModElement(mod, true));
        });
    } catch (error) {
        console.error('Failed to update mod list:', error);
    }
}

// SMAPI durumunu kontrol et ve göster
async function checkAndDisplaySMAPIStatus() {
    if (!invoke) {
        console.error('Tauri invoke not available');
        return;
    }
    
    try {
        const smapiStatus = document.getElementById('smapi-status');
        const gameInfo = await invoke('get_game_path');

        if (!gameInfo) {
            smapiStatus.innerHTML = `
                <div class="warning-box">
                    ${t('smapi.notFound')}
                </div>
            `;
            return;
        }

        if (!gameInfo.has_smapi) {
            smapiStatus.innerHTML = `
                <div class="warning-box">
                    ${t('smapi.notInstalled')}
                </div>
            `;
        } else {
            smapiStatus.innerHTML = `
                <div class="success-box">
                    ${t('smapi.installed')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to check SMAPI status:', error);
    }
}

// Mod işlemlerini yönet
async function handleModAction(folderName, modPath, action) {
    createClickSound();

    if (!invoke) {
        console.error('Tauri invoke not available');
        alert('Application not ready. Please wait.');
        return;
    }

    try {
        const modsContainer = document.querySelector('#mods');
        const gamePath = document.getElementById('game-path').textContent.trim();
        
        if (gamePath === 'Aranıyor...' || gamePath === t('game.searching') || gamePath === t('game.notFound')) {
            alert(t('game.gameNotFound'));
            return;
        }

        // Aksiyon loading efekti
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading';
        loadingEl.textContent = t('mods.processing');
        modsContainer.appendChild(loadingEl);

        let success = false;
        let errorMessage = '';

        try {
            if (action === 'delete') {
                // Mod silme işlemi
                success = await invoke('delete_mod', { modPath });
                if (!success) {
                    errorMessage = t('errors.deleteError');
                }
            } else if (action === 'activate') {
                // Mod etkinleştirme işlemi
                success = await invoke('toggle_mod', { 
                    modPath,
                    isActive: false,
                    gamePath
                });
                if (!success) {
                    errorMessage = t('errors.activateError');
                }
            } else if (action === 'deactivate') {
                // Mod devre dışı bırakma işlemi
                success = await invoke('toggle_mod', { 
                    modPath,
                    isActive: true,
                    gamePath
                });
                if (!success) {
                    errorMessage = t('errors.deactivateError');
                }
            }
        } catch (invokeError) {
            success = false;
            errorMessage = invokeError.toString();
        }

        // Loading kaldırılıyor
        if (modsContainer.contains(loadingEl)) {
            modsContainer.removeChild(loadingEl);
        }

        if (!success) {
            // Hata mesajı göster
            const errorEl = document.createElement('div');
            errorEl.className = 'warning-box';
            errorEl.textContent = errorMessage;
            
            modsContainer.insertBefore(errorEl, modsContainer.firstChild);
            
            // 3 saniye sonra hata mesajını kaldır
            setTimeout(() => {
                if (modsContainer.contains(errorEl)) {
                    modsContainer.removeChild(errorEl);
                }
            }, 3000);
        } else {
            // Başarı mesajı göster
            const successEl = document.createElement('div');
            successEl.className = 'success-box';
            successEl.textContent = t('mods.success');
            
            modsContainer.insertBefore(successEl, modsContainer.firstChild);
            
            // 2 saniye sonra başarı mesajını kaldır
            setTimeout(() => {
                if (modsContainer.contains(successEl)) {
                    modsContainer.removeChild(successEl);
                }
            }, 2000);

            // Mod listesini yenile
            await updateModList();
        }
    } catch (error) {
        console.error('Mod işlemi hatası:', error);
        alert(`${t('game.generalError')} ${error.message}`);
    }
}

// CSS stillerini ekle
const style = document.createElement('style');
style.textContent = `
    :root {
        --primary-color: #5C9B72;
        --secondary-color: #2C4A36;
        --background-color: #1a1a1a;
        --text-color: #ffffff;
        --border-color: #333333;
        --hover-color: #7baf8c;
    }

    body {
        background-color: var(--background-color);
        color: var(--text-color);
        margin: 0;
        padding: 0;
        font-family: 'Press Start 2P', cursive;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }

    .content-container {
        background-color: #2a2a2a;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        padding: 20px;
        margin-top: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }

    .menu-item {
        background-color: var(--primary-color);
        border: none;
        border-radius: 4px;
        padding: 15px;
        margin: 10px 0;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .menu-item:hover {
        background-color: var(--hover-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .mod-item {
        background-color: #333333;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 15px;
        margin: 10px 0;
        transition: all 0.2s;
    }

    .mod-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .mod-item.invalid {
        background-color: #4a2828;
        border-color: #8B0000;
    }

    .mod-action-button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Press Start 2P', cursive;
        font-size: 8px;
    }

    .mod-action-button:hover {
        background-color: var(--hover-color);
        transform: translateY(-1px);
    }

    .mod-action-button.danger {
        background-color: #8B0000;
    }

    .mod-action-button.danger:hover {
        background-color: #a00000;
    }

    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .loading-content {
        background-color: #2a2a2a;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--primary-color);
        border-top: 4px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }

    .loading-text {
        font-size: 12px;
        color: var(--text-color);
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .settings-row {
        background-color: #333333;
        border-radius: 6px;
        padding: 15px;
        margin: 10px 0;
    }

    .settings-label {
        color: #888888;
        margin-bottom: 8px;
    }

    .settings-value {
        background-color: #444444;
        padding: 10px;
        border-radius: 4px;
        word-break: break-all;
    }

    .warning-box {
        background-color: #4a2828;
        border: 1px solid #8B0000;
        color: #ff9999;
        padding: 15px;
        border-radius: 6px;
        margin: 10px 0;
    }

    .success-box {
        background-color: #2c4a2c;
        border: 1px solid #006400;
        color: #90EE90;
        padding: 15px;
        border-radius: 6px;
        margin: 10px 0;
    }

    .refresh-button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 12px 20px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Press Start 2P', cursive;
        font-size: 12px;
        margin: 15px 0;
    }

    .refresh-button:hover {
        background-color: var(--hover-color);
        transform: translateY(-2px);
    }

    .mod-category-title {
        color: var(--primary-color);
        font-size: 16px;
        margin: 20px 0 10px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .action-buttons {
        display: flex;
        gap: 10px;
        margin: 20px 0;
    }

    .action-button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 12px 20px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Press Start 2P', cursive;
        font-size: 10px;
    }

    .action-button:hover {
        background-color: var(--hover-color);
        transform: translateY(-2px);
    }

    .action-button.play {
        background-color: #4CAF50;
    }

    .action-button.play:hover {
        background-color: #45a049;
    }

    .compact-view .mod-item-author,
    .compact-view .mod-item-description {
        display: none;
    }

    .compact-view .mod-item {
        padding: 8px;
    }

    .compact-view .mod-item-header {
        margin-bottom: 5px;
    }

    .view-toggle {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        color: var(--text-color);
        font-size: 10px;
    }

    .view-toggle input {
        margin-right: 10px;
    }

    .header {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        border: 2px solid var(--border-color);
        position: relative;
        overflow: hidden;
    }

    .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%);
        animation: shine 3s infinite;
    }

    .header h1 {
        font-size: 24px;
        margin: 0;
        color: #fff;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        text-align: center;
    }

    @keyframes shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;

document.head.appendChild(style);

// DOM yüklendiğinde çalışacak kodlar
window.addEventListener('load', async () => {
    console.log('Window loaded, checking for Tauri...');
    
    // Give Tauri a moment to inject its APIs
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to initialize Tauri immediately
    let tauriReady = initTauri();
    
    if (!tauriReady) {
        console.log('Tauri not immediately available, waiting...');
        // Wait for Tauri to be available with longer timeout
        tauriReady = await Promise.race([
            waitForTauri(),
            new Promise(resolve => setTimeout(() => resolve(false), 10000)) // 10 second timeout
        ]);
    }
    
    if (!tauriReady) {
        console.warn('Tauri API not available - running in fallback mode');
        // Don't block the UI - show warning but continue
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #ffeb3b; color: #333; padding: 10px; border-radius: 5px; z-index: 9999; font-family: sans-serif; font-size: 12px;';
        warningDiv.textContent = 'Warning: Running in browser mode - functionality limited';
        document.body.appendChild(warningDiv);
        
        // Hide warning after 5 seconds
        setTimeout(() => warningDiv.remove(), 5000);
    } else {
        console.log('Tauri API initialized successfully');
    }
    
    // Set up Tauri event listeners only if Tauri is available
    if (tauriReady && listen) {
        try {
            await listen('language-changed', (event) => {
                currentLanguage = event.payload.language;
                translations = event.payload.translations;
                updateUITexts();
                updateModList();
            });

            await listen('theme-changed', (event) => {
                currentTheme = event.payload.theme;
                updateTheme(currentTheme);
                showToast(translations.themes?.themeChanged || 'Tema değiştirildi!');
            });

            await listen('game-start-result', (event) => {
                const result = event.payload;
                const startButton = document.querySelector('.action-button.play');
                
                if (!result.success) {
                    console.error('Oyun başlatma başarısız:', result.message, result.error);
                    alert(result.message + ": " + result.error);
                    // Hata durumunda butonu tekrar aktif et
                    startButton.disabled = false;
                    startButton.style.opacity = '1';
                    startButton.style.cursor = 'pointer';
                    startButton.textContent = t('game.startGame');
                } else {
                    // Oyun başarıyla başlatıldı
                    console.log('Oyun başarıyla başlatıldı, toast gösteriliyor');
                    showToast(result.message, 3000);
                    startButton.textContent = t('game.gameRunning');
                    
                    // Oyun kapandığında butonu tekrar aktif et
                    const checkGameStatus = setInterval(async () => {
                        try {
                            const gameRunning = await invoke('check_game_status');
                            if (!gameRunning) {
                                clearInterval(checkGameStatus);
                                startButton.disabled = false;
                                startButton.style.opacity = '1';
                                startButton.style.cursor = 'pointer';
                                startButton.textContent = t('game.startGame');
                            }
                        } catch (error) {
                            console.error('Failed to check game status:', error);
                        }
                    }, 5000);
                }
            });
        } catch (error) {
            console.error('Error setting up Tauri event listeners:', error);
        }
    }

    try {
        if (tauriReady && invoke) {
            // Dil ayarlarını yükle
            const langData = await invoke('get_language');
            currentLanguage = langData.language;
            translations = langData.translations;
            
            // Tema ayarlarını yükle
            const themeData = await invoke('get_theme');
            currentTheme = themeData.theme;
            
            // Temayı uygula
            updateTheme(currentTheme);
            
            // UI metinlerini güncelle
            updateUITexts();

            // SMAPI durumunu kontrol et
            await checkAndDisplaySMAPIStatus();

            // Oyun yolunu göster
            const gameInfo = await invoke('get_game_path');
            const gamePathElement = document.getElementById('game-path');
            gamePathElement.textContent = gameInfo ? gameInfo.game_path : t('smapi.notFound');

            // Mod listesini ilk kez yükle
            await updateModList();
        } else {
            // Fallback mode - load basic UI without backend
            console.log('Loading basic UI without Tauri backend');
            
            // Set default theme
            currentTheme = 'default';
            updateTheme(currentTheme);
            
            // Set default language
            currentLanguage = 'tr';
            translations = {}; // Empty translations - t() function will return keys
            
            // Update basic UI
            updateUITexts();
            
            // Show placeholder content
            const gamePathElement = document.getElementById('game-path');
            if (gamePathElement) {
                gamePathElement.textContent = 'Demo Mode - Backend not available';
            }
            
            const smapiStatus = document.getElementById('smapi-status');
            if (smapiStatus) {
                smapiStatus.innerHTML = `
                    <div class="warning-box">
                        Demo Mode: Backend functionality not available
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }

    // Aksiyon butonlarını ekle
    const modsContainer = document.getElementById('mods');
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    actionButtons.innerHTML = `
        <button class="action-button play" onclick="startGame()">
            🎮 ${t('game.startGame')}
        </button>
        <button class="action-button" data-folder="mods" onclick="openFolder('mods')">
            📁 ${t('game.openModsFolder')}
        </button>
        <button class="action-button" data-folder="deactivated" onclick="openFolder('deactivated')">
            📁 ${t('game.openDeactivatedFolder')}
        </button>
    `;

    // Kompakt görünüm toggle'ı ekle
    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';
    viewToggle.innerHTML = `
        <input type="checkbox" id="compact-view" onchange="toggleCompactView()">
        <label for="compact-view">${t('game.compactView')}</label>
    `;

    // Yenile butonunu ayarla ve elementleri yerleştir
    const refreshButton = document.getElementById('refresh-mods');
    refreshButton.parentNode.insertBefore(actionButtons, refreshButton);
    refreshButton.parentNode.insertBefore(viewToggle, document.querySelector('.mod-list'));

    refreshButton.addEventListener('click', async () => {
        createClickSound();
        refreshButton.style.transform = 'scale(0.95)';
        await updateModList();
        setTimeout(() => {
            refreshButton.style.transform = '';
        }, 100);
    });

    // Menü öğelerine tıklama efekti ekle
    const menuItems = document.querySelectorAll('.menu-item');
    const containers = document.querySelectorAll('.content-container');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Tıklama efekti
            createClickSound();
            e.target.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                e.target.style.transform = '';
            }, 100);

            // Tüm containerları gizle
            containers.forEach(container => {
                container.classList.remove('active');
            });

            // Seçilen bölümü göster
            const section = item.dataset.section;
            const container = document.getElementById(section);
            if (container) {
                container.classList.add('active');
            }
        });
        
        // Hover efekti için piksel-perfect hareket
        item.addEventListener('mouseover', () => {
            item.style.transform = 'translateY(-2px)';
        });
        
        item.addEventListener('mouseout', () => {
            item.style.transform = '';
        });
    });
});

// Oyunu başlat
async function startGame() {
    const startButton = document.querySelector('.action-button.play');
    console.log('startGame() çağrıldı, buton:', startButton);
    
    if (!invoke) {
        console.error('Tauri invoke not available');
        alert('Application not ready. Please wait.');
        return;
    }
    
    try {
        startButton.disabled = true;
        startButton.style.opacity = '0.5';
        startButton.style.cursor = 'not-allowed';
        startButton.textContent = t('game.gameStarting');
        console.log('Oyun başlatma butonu devre dışı bırakıldı ve stil değiştirildi');
        
        // Oyunu başlat
        console.log('start_game invoke çağrısı yapılıyor...');
        const result = await invoke('start_game');
        console.log('start_game invoke çağrısı sonucu:', result);
    } catch (error) {
        console.error('Oyun başlatma hatası (client):', error);
        alert(t('game.generalError'));
        // Hata durumunda butonu tekrar aktif et
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.cursor = 'pointer';
        startButton.textContent = t('game.startGame');
    }
}

// Klasör aç
async function openFolder(folderType) {
    if (!invoke) {
        console.error('Tauri invoke not available');
        alert('Application not ready. Please wait.');
        return;
    }
    
    try {
        await invoke('open_folder', { folderType });
    } catch (error) {
        console.error('Klasör açma hatası:', error);
        alert(t('game.folderOpenError'));
    }
}

// Görünüm modunu değiştir
function toggleCompactView() {
    const modList = document.querySelector('.mod-list');
    modList.classList.toggle('compact-view');
} 