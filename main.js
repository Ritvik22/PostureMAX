const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

class PostureMAXApp {
    constructor() {
        this.mainWindow = null;
        this.overlayWindow = null;
        this.isMonitoring = false;
        this.isOverlayVisible = false;
    }

    createMainWindow() {
        // Get primary display info
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;

        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            titleBarStyle: 'hiddenInset',
            title: 'PostureMAX',
            icon: path.join(__dirname, 'assets/icon.png'), // Optional: add app icon
            show: false, // Don't show until ready
            backgroundColor: '#0a0a0a'
        });

        // Load the main HTML file
        this.mainWindow.loadFile('index.html');

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Focus on the window
            if (process.platform === 'darwin') {
                app.dock.show();
            }
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            if (this.overlayWindow) {
                this.overlayWindow.close();
            }
        });

        // Handle minimize to tray (optional)
        this.mainWindow.on('minimize', (event) => {
            if (process.platform === 'win32') {
                event.preventDefault();
                this.mainWindow.hide();
            }
        });

        // Open DevTools in development
        if (process.argv.includes('--dev')) {
            this.mainWindow.webContents.openDevTools();
        }
    }

    createOverlayWindow() {
        if (this.overlayWindow) {
            this.overlayWindow.focus();
            return;
        }

        // Get screen dimensions
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;

        // Horizontal bar layout
        this.overlayWindow = new BrowserWindow({
            width: 800,
            height: 80,
            minWidth: 700,
            minHeight: 80,
            maxWidth: 1000,
            maxHeight: 80,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            frame: false, // Frameless window
            resizable: true,
            alwaysOnTop: true, // Always on top
            skipTaskbar: true, // Don't show in taskbar
            transparent: true, // Enable transparency
            show: false,
            backgroundColor: '#00000000', // Transparent background
            x: Math.round((width - 800) / 2), // Center horizontally
            y: 50, // Position near top
            opacity: 1.0
        });

        // Load overlay HTML
        this.overlayWindow.loadFile('overlay.html');

        // Show when ready
        this.overlayWindow.once('ready-to-show', () => {
            this.overlayWindow.show();
            this.isOverlayVisible = true;
        });

        // Handle overlay closed
        this.overlayWindow.on('closed', () => {
            this.overlayWindow = null;
            this.isOverlayVisible = false;
        });

        // Make overlay draggable
        this.overlayWindow.setMovable(true);
        this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');

        // Store initial state
        this.overlayState = {
            transparency: 'visible'
        };
    }

    startMonitoring() {
        this.isMonitoring = true;
        this.createOverlayWindow();
        
        // Send start signal to overlay
        if (this.overlayWindow) {
            this.overlayWindow.webContents.send('start-monitoring');
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.overlayWindow) {
            this.overlayWindow.webContents.send('stop-monitoring');
            // Close overlay after a short delay to show final stats
            setTimeout(() => {
                if (this.overlayWindow) {
                    this.overlayWindow.close();
                }
            }, 2000);
        }
    }

    toggleOverlay() {
        if (this.isOverlayVisible) {
            if (this.overlayWindow) {
                this.overlayWindow.close();
            }
        } else {
            this.createOverlayWindow();
        }
    }

    centerOverlay() {
        if (this.overlayWindow) {
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height } = primaryDisplay.workAreaSize;
            
            const overlayBounds = this.overlayWindow.getBounds();
            const x = Math.round((width - overlayBounds.width) / 2);
            const y = Math.round((height - overlayBounds.height) / 2);
            
            this.overlayWindow.setPosition(x, y);
        }
    }



    setOverlayTransparency(level) {
        if (this.overlayWindow) {
            this.overlayState.transparency = level;
            
            switch (level) {
                case 'transparent':
                    this.overlayWindow.setOpacity(0.3);
                    this.overlayWindow.webContents.send('transparency-changed', 'transparent');
                    break;
                case 'visible':
                    this.overlayWindow.setOpacity(1.0);
                    this.overlayWindow.webContents.send('transparency-changed', 'visible');
                    break;
            }
        }
    }

    setupGlobalShortcuts() {
        // Register global shortcuts
        globalShortcut.register('CommandOrControl+Shift+P', () => {
            this.toggleOverlay();
        });

        globalShortcut.register('CommandOrControl+Shift+M', () => {
            if (this.isMonitoring) {
                this.stopMonitoring();
            } else {
                this.startMonitoring();
            }
        });
    }

    setupIPC() {
        // Handle IPC messages from renderer process
        ipcMain.handle('start-monitoring', () => {
            this.startMonitoring();
            return { success: true };
        });

        ipcMain.handle('stop-monitoring', () => {
            this.stopMonitoring();
            return { success: true };
        });

        ipcMain.handle('toggle-overlay', () => {
            this.toggleOverlay();
            return { success: true };
        });

        ipcMain.handle('center-overlay', () => {
            this.centerOverlay();
            return { success: true };
        });



        ipcMain.handle('set-transparency', (event, level) => {
            this.setOverlayTransparency(level);
            return { success: true };
        });

        ipcMain.handle('close-overlay', () => {
            this.stopMonitoring();
            return { success: true };
        });

        ipcMain.handle('get-app-version', () => {
            return app.getVersion();
        });
    }
}

// Create app instance
const postureApp = new PostureMAXApp();

// App event handlers
app.whenReady().then(() => {
    postureApp.createMainWindow();
    postureApp.setupIPC();
    postureApp.setupGlobalShortcuts();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            postureApp.createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Unregister all global shortcuts
    globalShortcut.unregisterAll();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });
});

// Export for potential use in renderer
if (typeof module !== 'undefined' && module.exports) {
    module.exports = postureApp;
}
