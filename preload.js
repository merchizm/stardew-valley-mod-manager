const { contextBridge, ipcRenderer } = require('electron')

// IPC kanallarını doğrula
const validChannels = [
    'get-game-path',
    'scan-mods',
    'toggle-mod',
    'delete-mod',
    'start-game',
    'open-folder',
    'check-game-status',
    'change-language',
    'get-language',
    'change-theme',
    'get-theme'
];

// Dinleme kanalları
const validListeners = [
    'language-changed',
    'theme-changed',
    'game-start-result'
];

// IPC kanallarını expose et
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: async (channel, ...args) => {
            if (validChannels.includes(channel)) {
                return await ipcRenderer.invoke(channel, ...args);
            }
            throw new Error(`Invalid channel: ${channel}`);
        },
        on: (channel, func) => {
            if (validListeners.includes(channel)) {
                const subscription = (event, ...args) => func(event, ...args);
                ipcRenderer.on(channel, subscription);
                return () => {
                    ipcRenderer.removeListener(channel, subscription);
                };
            }
            throw new Error(`Invalid listener channel: ${channel}`);
        }
    }
});

// Dil değişikliği olayını dinlemek için
ipcRenderer.on('language-changed', (event, data) => {
    document.dispatchEvent(new CustomEvent('language-changed', { detail: data }));
});

// Tema değişikliği olayını dinlemek için
ipcRenderer.on('theme-changed', (event, data) => {
    document.dispatchEvent(new CustomEvent('theme-changed', { detail: data }));
});

// Oyun başlatma sonucu olayını dinlemek için
ipcRenderer.on('game-start-result', (event, data) => {
    document.dispatchEvent(new CustomEvent('game-start-result', { detail: data }));
}); 