const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron')
const path = require('path')
const fs = require('fs').promises
const os = require('os')
const { exec, execFile } = require('child_process');
const { spawn } = require('child_process');

// Dil ve tema sistemi için değişkenler
let currentLanguage = 'tr'; // Varsayılan dil
let currentTheme = 'default'; // Varsayılan tema
let translations = {};

// Ayarlar dosyası yolu
const settingsFilePath = path.join(app.getPath('userData'), 'settings.json');

// Ayarları yükle
async function loadSettings() {
    try {
        // Ayarlar dosyasının varlığını kontrol et
        try {
            await fs.access(settingsFilePath);
        } catch {
            // Dosya yoksa varsayılan ayarları oluştur ve kaydet
            const defaultSettings = {
                language: currentLanguage,
                theme: currentTheme
            };
            await fs.writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
            return defaultSettings;
        }

        const settingsData = await fs.readFile(settingsFilePath, 'utf-8');
        const settings = JSON.parse(settingsData);
        
        // Mevcut ayarları güncelle
        currentLanguage = settings.language || 'tr';
        currentTheme = settings.theme || 'default';
        
        return settings;
    } catch (error) {
        console.error('Ayarlar yüklenirken hata oluştu:', error);
        return {
            language: 'tr',
            theme: 'default'
        };
    }
}

// Ayarları kaydet
async function saveSettings() {
    try {
        const settings = {
            language: currentLanguage,
            theme: currentTheme
        };
        await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2));
        console.log('Ayarlar kaydedildi:', settings);
        return true;
    } catch (error) {
        console.error('Ayarlar kaydedilirken hata oluştu:', error);
        return false;
    }
}

// Dil yükleme fonksiyonu
async function loadLanguage(langCode) {
    try {
        console.log(`Dil dosyası yükleniyor: ${langCode}`);
        const langFile = path.join(__dirname, 'locales', `${langCode}.json`);
        
        // Dosyanın varlığını kontrol et
        try {
            await fs.access(langFile);
        } catch (error) {
            console.error(`Dil dosyası bulunamadı: ${langFile}`, error);
            return false;
        }
        
        // Dosyayı oku ve parse et
        const langData = await fs.readFile(langFile, 'utf-8');
        try {
            translations = JSON.parse(langData);
        } catch (parseError) {
            console.error(`Dil dosyası geçerli JSON formatında değil: ${langFile}`, parseError);
            return false;
        }
        
        currentLanguage = langCode;
        console.log(`Dil başarıyla yüklendi: ${langCode}`, translations);
        
        // Ayarları kaydet
        await saveSettings();
        
        // Pencere başlığını güncelle
        if (mainWindow) {
            mainWindow.setTitle(translations.app.title);
        }
        
        // Menüyü yeniden oluştur
        createMenu();
        
        // Render sürecine dil değişimini bildir
        if (mainWindow) {
            console.log('Render sürecine dil değişimi bildiriliyor');
            mainWindow.webContents.send('language-changed', { 
                language: currentLanguage, 
                translations: translations 
            });
        }
        
        return true;
    } catch (error) {
        console.error('Dil dosyası yüklenemedi:', error);
        return false;
    }
}

// Tema değiştirme fonksiyonu
async function changeTheme(themeName) {
    try {
        console.log(`Tema değiştiriliyor: ${themeName}`);
        
        // Tema dosyasının varlığını kontrol et
        const themeFile = path.join(__dirname, 'themes', `${themeName}.css`);
        try {
            await fs.access(themeFile);
        } catch (error) {
            console.error(`Tema dosyası bulunamadı: ${themeFile}`, error);
            return false;
        }
        
        currentTheme = themeName;
        
        // Ayarları kaydet
        await saveSettings();
        
        // Render sürecine tema değişimini bildir
        if (mainWindow) {
            console.log('Render sürecine tema değişimi bildiriliyor');
            mainWindow.webContents.send('theme-changed', { 
                theme: currentTheme 
            });
        }
        
        return true;
    } catch (error) {
        console.error('Tema değiştirme hatası:', error);
        return false;
    }
}

// Çeviri fonksiyonu
function t(key) {
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

// Steam oyun dizinini bulma fonksiyonu
async function findSteamGamePath() {
    const possiblePaths = [
        'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley',
        'C:\\Program Files\\Steam\\steamapps\\common\\Stardew Valley',
        'D:\\SteamLibrary\\steamapps\\common\\Stardew Valley',
        'E:\\SteamLibrary\\steamapps\\common\\Stardew Valley',
        'F:\\SteamLibrary\\steamapps\\common\\Stardew Valley'
    ];

    for (const gamePath of possiblePaths) {
        try {
            await fs.access(gamePath);
            // SMAPI'nin varlığını kontrol et
            const smapiPath = path.join(gamePath, 'StardewModdingAPI.exe');
            try {
                await fs.access(smapiPath);
                return {
                    gamePath,
                    smapiPath,
                    hasSMAPI: true
                };
            } catch {
                return {
                    gamePath,
                    hasSMAPI: false
                };
            }
        } catch (error) {
            continue;
        }
    }
    return null;
}

// Mod bilgilerini okuma fonksiyonu
async function readModInfo(modPath) {
    try {
        const manifestPath = path.join(modPath, 'manifest.json');
        // Önce manifest dosyasının varlığını kontrol et
        await fs.access(manifestPath);
        try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifestData = JSON.parse(manifestContent);
            return {
                isValid: true,
                data: manifestData
            };
        } catch (parseError) {
            // Manifest dosyası var ama okunamıyor veya parse edilemiyor
            return {
                isValid: true,
                data: {}
            };
        }
    } catch (error) {
        // Manifest dosyası yok
        return null;
    }
}

// Tüm modları tarama fonksiyonu
async function scanMods(gamePath) {
    const modsPath = path.join(gamePath, 'Mods');
    const deactivatedModsPath = path.join(gamePath, 'DeactivatedMods');
    const mods = { active: [], deactivated: [], invalid: [] };

    try {
        // Aktif modları tara
        const activeModFolders = await fs.readdir(modsPath);
        for (const folder of activeModFolders) {
            const modPath = path.join(modsPath, folder);
            const stat = await fs.stat(modPath);
            if (stat.isDirectory()) {
                const modInfo = await readModInfo(modPath);
                if (modInfo) {
                    // Manifest var, geçerli bir mod
                    mods.active.push({
                        name: modInfo.data.Name || folder,
                        version: modInfo.data.Version,
                        author: modInfo.data.Author,
                        description: modInfo.data.Description,
                        path: modPath,
                        folderName: folder,
                        hasManifest: true,
                        manifestData: modInfo.data
                    });
                } else {
                    // Manifest yok, geçersiz mod
                    mods.invalid.push({
                        name: folder,
                        path: modPath,
                        folderName: folder,
                        reason: t('mods.noManifest')
                    });
                }
            }
        }
    } catch (error) {
        console.error(`${t('errors.error')}: ${error}`);
    }

    try {
        // Deaktif modları tara
        const deactivatedModFolders = await fs.readdir(deactivatedModsPath);
        for (const folder of deactivatedModFolders) {
            const modPath = path.join(deactivatedModsPath, folder);
            const stat = await fs.stat(modPath);
            if (stat.isDirectory()) {
                const modInfo = await readModInfo(modPath);
                if (modInfo) {
                    // Manifest var, geçerli bir mod
                    mods.deactivated.push({
                        name: modInfo.data.Name || folder,
                        version: modInfo.data.Version,
                        author: modInfo.data.Author,
                        description: modInfo.data.Description,
                        path: modPath,
                        folderName: folder,
                        hasManifest: true,
                        manifestData: modInfo.data
                    });
                } else {
                    // Manifest yok, geçersiz mod
                    mods.invalid.push({
                        name: folder,
                        path: modPath,
                        folderName: folder,
                        reason: t('mods.noManifest')
                    });
                }
            }
        }
    } catch (error) {
        console.error(`${t('errors.error')}: ${error}`);
    }

    return mods;
}

// Mod yönetimi fonksiyonları
async function moveModToDeactivated(modPath, gamePath) {
    if (!modPath || !gamePath) {
        console.error('Geçersiz parametreler:', { modPath, gamePath });
        return false;
    }

    try {
        // Yolları düzelt
        modPath = path.normalize(modPath);
        gamePath = path.normalize(gamePath);
        
        const modName = path.basename(modPath);
        const deactivatedPath = path.join(gamePath, 'DeactivatedMods');
        
        // DeactivatedMods klasörünün varlığını kontrol et
        try {
            await fs.access(deactivatedPath);
        } catch {
            await fs.mkdir(deactivatedPath);
        }

        // Hedef yolu oluştur
        const targetPath = path.join(deactivatedPath, modName);
        let finalPath = targetPath;
        let counter = 1;

        // Eğer hedef klasörde aynı isimde mod varsa, ismine sayı ekle
        while (true) {
            try {
                await fs.access(finalPath);
                finalPath = path.join(deactivatedPath, `${modName}_${counter}`);
                counter++;
            } catch {
                break;
            }
        }

        await fs.rename(modPath, finalPath);
        return true;
    } catch (error) {
        console.error('Mod devre dışı bırakma hatası:', error);
        return false;
    }
}

async function moveModToActive(modPath, gamePath) {
    if (!modPath || !gamePath) {
        console.error('Geçersiz parametreler:', { modPath, gamePath });
        return false;
    }

    try {
        // Yolları düzelt
        modPath = path.normalize(modPath);
        gamePath = path.normalize(gamePath);
        
        const modName = path.basename(modPath);
        const activePath = path.join(gamePath, 'Mods');
        
        // Hedef yolu oluştur
        const targetPath = path.join(activePath, modName);
        let finalPath = targetPath;
        let counter = 1;

        // Eğer hedef klasörde aynı isimde mod varsa, ismine sayı ekle
        while (true) {
            try {
                await fs.access(finalPath);
                finalPath = path.join(activePath, `${modName}_${counter}`);
                counter++;
            } catch {
                break;
            }
        }

        await fs.rename(modPath, finalPath);
        return true;
    } catch (error) {
        console.error('Mod etkinleştirme hatası:', error);
        return false;
    }
}

async function deleteMod(modPath) {
    if (!modPath) {
        console.error('Geçersiz modPath:', modPath);
        return false;
    }

    try {
        // Yolu düzelt
        modPath = path.normalize(modPath);
        
        const trashPath = path.join(os.tmpdir(), 'StardewModManager_Trash');
        
        // Çöp klasörünü oluştur
        try {
            await fs.access(trashPath);
        } catch {
            await fs.mkdir(trashPath);
        }

        const modName = path.basename(modPath);
        const trashModPath = path.join(trashPath, `${modName}_${Date.now()}`);
        
        await fs.rename(modPath, trashModPath);
        return true;
    } catch (error) {
        console.error('Mod silme hatası:', error);
        return false;
    }
}

// Oyunu başlat
async function startGame() {
    try {
        console.log('Oyun başlatma işlevi çağrıldı');
        
        // Geçerli bir oyun yolu olduğunu kontrol et
        if (!gameInfo) {
            console.log('gameInfo bulunamadı, findSteamGamePath() çağrılıyor');
            gameInfo = await findSteamGamePath();
            console.log('findSteamGamePath() sonucu:', gameInfo);
        }
        
        if (!gameInfo || !gameInfo.gamePath) {
            console.error('Geçerli oyun yolu bulunamadı:', gameInfo);
            mainWindow.webContents.send('game-start-result', {
                success: false,
                message: t('errors.gameStartError'),
                error: t('errors.gamePathNotFound')
            });
            return false;
        }

        console.log('Oyun dizini:', gameInfo.gamePath);
        
        // SMAPI'nin kurulu olduğunu kontrol et
        const smapiPath = path.join(gameInfo.gamePath, 'StardewModdingAPI.exe');
        console.log('SMAPI kontrol ediliyor:', smapiPath);
        
        try {
            await fs.access(smapiPath, fs.constants.F_OK);
            console.log('SMAPI bulundu');
        } catch (error) {
            console.error('SMAPI bulunamadı:', error);
            mainWindow.webContents.send('game-start-result', {
                success: false,
                message: t('errors.gameStartError'),
                error: t('errors.smapiNotFound')
            });
            return false;
        }

        // Oyunu başlat (execFile kullanarak)
        console.log('Oyun başlatma hazırlıkları yapılıyor (execFile ile)');
        console.log('Komut:', smapiPath, 'Çalışma dizini:', gameInfo.gamePath);
        
        return new Promise((resolve) => {
            try {
                const child = execFile(smapiPath, [], {
                    cwd: gameInfo.gamePath,
                    detached: true,
                    windowsHide: false
                }, (error) => {
                    if (error) {
                        console.error('execFile hata çıktısı:', error);
                        mainWindow.webContents.send('game-start-result', {
                            success: false,
                            message: t('errors.gameStartError'),
                            error: error.message
                        });
                        resolve(false);
                        return;
                    }
                    
                    console.log('execFile başarıyla tamamlandı');
                });
                
                // Oyun bir süre sonra kapanacağı için hemen başarılı mesajı gönder
                console.log('Oyun başarıyla başlatıldı, IPC mesajı gönderiliyor');
                mainWindow.webContents.send('game-start-result', {
                    success: true,
                    message: t('mods.gameStartSuccess')
                });
                
                // Oyun başarıyla başlatıldığında pencereyi simge durumuna küçült
                if (mainWindow) {
                    console.log('Pencere 1.5 saniye sonra simge durumuna küçültülecek');
                    setTimeout(() => {
                        mainWindow.minimize();
                        console.log('Pencere simge durumuna küçültüldü');
                    }, 1500);
                }
                
                // Çocuk işlemi ana işlemden ayır
                child.unref();
                resolve(true);
            } catch (spawnError) {
                console.error('execFile doğrudan hata:', spawnError);
                mainWindow.webContents.send('game-start-result', {
                    success: false,
                    message: t('errors.gameStartError'),
                    error: spawnError.message
                });
                resolve(false);
            }
        });
    } catch (error) {
        console.error('Oyun başlatma hatası (genel):', error);
        mainWindow.webContents.send('game-start-result', {
            success: false,
            message: t('errors.gameStartError'),
            error: error.message
        });
        return false;
    }
}

// Oyun durumunu kontrol et
async function checkGameRunning() {
    console.log('checkGameRunning fonksiyonu çağrıldı');
    return new Promise((resolve) => {
        const platform = process.platform;
        let command;

        if (platform === 'win32') {
            command = 'tasklist /FI "IMAGENAME eq StardewModdingAPI.exe" /FO CSV /NH';
        } else if (platform === 'darwin') {
            command = 'pgrep -x "StardewModdingAPI"';
        } else {
            command = 'pgrep -x StardewModdingAPI';
        }

        console.log('Oyun çalışma durumu kontrol ediliyor, komut:', command);
        
        exec(command, (error, stdout) => {
            if (error) {
                // Hata varsa veya process bulunamazsa, oyun çalışmıyor demektir
                console.log('Oyun çalışmıyor (hata):', error);
                resolve(false);
                return;
            }

            // Windows için CSV formatını kontrol et
            if (platform === 'win32') {
                const isRunning = stdout.includes('StardewModdingAPI.exe');
                console.log('Oyun çalışıyor mu?', isRunning, 'Çıktı:', stdout);
                resolve(isRunning);
            } else {
                // Unix sistemleri için process ID varsa oyun çalışıyor demektir
                const isRunning = stdout.trim().length > 0;
                console.log('Oyun çalışıyor mu?', isRunning, 'Çıktı:', stdout);
                resolve(isRunning);
            }
        });
    });
}

// Menü şablonunu oluştur
function createMenu() {
    const template = [
        {
            label: t('menu.languages'),
            submenu: [
                {
                    label: 'Türkçe',
                    type: 'radio',
                    checked: currentLanguage === 'tr',
                    click: () => loadLanguage('tr')
                },
                {
                    label: 'English',
                    type: 'radio',
                    checked: currentLanguage === 'en',
                    click: () => loadLanguage('en')
                }
            ]
        },
        {
            label: t('menu.themes'),
            submenu: [
                {
                    label: t('menu.theme_default'),
                    type: 'radio',
                    checked: currentTheme === 'default',
                    click: () => changeTheme('default')
                },
                {
                    label: t('menu.theme_barbie'),
                    type: 'radio',
                    checked: currentTheme === 'barbie',
                    click: () => changeTheme('barbie')
                },
                {
                    label: t('menu.theme_dark'),
                    type: 'radio',
                    checked: currentTheme === 'dark',
                    click: () => changeTheme('dark')
                },
                {
                    label: t('menu.theme_minecraft'),
                    type: 'radio',
                    checked: currentTheme === 'minecraft',
                    click: () => changeTheme('minecraft')
                }
            ]
        },
        {
            label: t('menu.help'),
            submenu: [
                {
                    label: t('menu.smapiSite'),
                    click: () => shell.openExternal('https://smapi.io/')
                },
                {
                    label: t('menu.wiki'),
                    click: () => shell.openExternal('https://stardewvalleywiki.com/')
                },
                {
                    label: t('menu.nexusMods'),
                    click: () => shell.openExternal('https://www.nexusmods.com/stardewvalley')
                },
                { type: 'separator' },
                {
                    label: t('menu.about'),
                    click: () => {
                        shell.openExternal('https://github.com/merchizm/stardew-valley-mod-manager')
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Globalde tanımlanmış mainWindow değişkeni
let mainWindow;
// Steam oyun yolu bilgisi
let gameInfo = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: translations.app?.title || 'Stardew Valley Mod Yöneticisi',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    })

    mainWindow.loadFile('index.html')
    createMenu(); // Menüyü oluştur
    return mainWindow;
}

// IPC Kanalları
async function setupIPC() {
    // gameInfo değişkeni artık global olarak tanımlandı

    ipcMain.handle('get-game-path', async () => {
        if (!gameInfo) {
            gameInfo = await findSteamGamePath();
        }
        return gameInfo;
    });

    ipcMain.handle('scan-mods', async () => {
        if (!gameInfo) {
            gameInfo = await findSteamGamePath();
        }
        if (gameInfo) {
            return await scanMods(gameInfo.gamePath);
        }
        return null;
    });

    ipcMain.handle('toggle-mod', async (event, { modPath, isActive, gamePath }) => {
        if (!modPath || !gamePath) {
            console.error('Geçersiz parametreler:', { modPath, isActive, gamePath });
            return false;
        }

        if (isActive) {
            return await moveModToDeactivated(modPath, gamePath);
        } else {
            return await moveModToActive(modPath, gamePath);
        }
    });

    ipcMain.handle('delete-mod', async (event, { modPath }) => {
        if (!modPath) {
            console.error('Geçersiz modPath:', modPath);
            return false;
        }
        return await deleteMod(modPath);
    });

    ipcMain.handle('start-game', async () => {
        try {
            console.log('start-game IPC çağrısı alındı');
            const result = await startGame();
            console.log('startGame sonucu:', result);
            return result;
        } catch (error) {
            console.error('Start game handler error:', error);
            return false;
        }
    });

    ipcMain.handle('open-folder', async (event, folderType) => {
        if (!gameInfo) {
            gameInfo = await findSteamGamePath();
        }
        if (gameInfo) {
            let folderPath;
            switch (folderType) {
                case 'mods':
                    folderPath = path.join(gameInfo.gamePath, 'Mods');
                    break;
                case 'deactivated':
                    folderPath = path.join(gameInfo.gamePath, 'DeactivatedMods');
                    // DeactivatedMods klasörünün varlığını kontrol et
                    try {
                        await fs.access(folderPath);
                    } catch {
                        await fs.mkdir(folderPath);
                    }
                    break;
                default:
                    return false;
            }
            shell.openPath(folderPath);
            return true;
        }
        return false;
    });

    ipcMain.handle('check-game-status', async () => {
        return await checkGameRunning();
    });

    // Dil değiştirme kanalı
    ipcMain.handle('change-language', async (event, { language }) => {
        return await loadLanguage(language);
    });
    
    // Mevcut dili alma kanalı
    ipcMain.handle('get-language', () => {
        return {
            language: currentLanguage,
            translations: translations
        };
    });
    
    // Tema değiştirme kanalı
    ipcMain.handle('change-theme', async (event, { theme }) => {
        return await changeTheme(theme);
    });
    
    // Mevcut temayı alma kanalı
    ipcMain.handle('get-theme', () => {
        return {
            theme: currentTheme
        };
    });
}

app.whenReady().then(async () => {
    // Ayarları yükle
    await loadSettings();
    
    // Dil ve temayı yükle
    await loadLanguage(currentLanguage);
    createWindow();
    
    // Oyun bilgisini başlangıçta yükle
    gameInfo = await findSteamGamePath();
    
    setupIPC();
    
    // Tema değiştir
    await changeTheme(currentTheme);
    
    // Uygulama ikonunu ayarla
    if (process.platform === 'win32') {
        app.setAppUserModelId(app.name);
    }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
}); 