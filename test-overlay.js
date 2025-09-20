const { app, BrowserWindow, screen } = require('electron');

// Test script to verify overlay window properties
function testOverlayWindow() {
    console.log('Testing overlay window creation...');
    
    // Get screen dimensions
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    // Create test overlay window with our updated settings
    const testOverlay = new BrowserWindow({
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
        frame: false,
        resizable: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        show: false,
        backgroundColor: '#00000000',
        x: Math.round((width - 800) / 2),
        y: 50,
        opacity: 1.0,
        fullscreenable: false,
        maximizable: false,
        minimizable: false,
        closable: true,
        focusable: false,
        acceptFirstMouse: true,
        visibleOnAllWorkspaces: true,
        fullscreenable: false,
        showInactive: true,
        disableAutoHideCursor: true,
        alwaysOnTop: true,
        skipTaskbar: true
    });
    
    // Test window properties
    console.log('Overlay window created with properties:');
    console.log('- Always on top:', testOverlay.isAlwaysOnTop());
    console.log('- Focusable:', testOverlay.isFocusable());
    console.log('- Skip taskbar:', testOverlay.isSkipTaskbar());
    console.log('- Visible on all workspaces:', testOverlay.isVisibleOnAllWorkspaces());
    console.log('- Position:', testOverlay.getPosition());
    console.log('- Size:', testOverlay.getSize());
    
    // Test focus prevention
    testOverlay.on('focus', () => {
        console.log('Focus event triggered - should blur immediately');
        testOverlay.blur();
    });
    
    testOverlay.on('activate', () => {
        console.log('Activate event triggered - should blur immediately');
        testOverlay.blur();
    });
    
    // Load test content
    testOverlay.loadURL('data:text/html,<html><body style="background: rgba(0,0,0,0.8); color: white; font-family: Arial; padding: 20px;"><h1>Overlay Test Window</h1><p>This window should stay on top and not steal focus when clicked.</p><p>Z-index: 2147483647</p></body></html>');
    
    testOverlay.once('ready-to-show', () => {
        testOverlay.show();
        console.log('Test overlay window shown');
        
        // Test after 3 seconds
        setTimeout(() => {
            console.log('Testing window properties after 3 seconds...');
            console.log('- Still always on top:', testOverlay.isAlwaysOnTop());
            console.log('- Still not focusable:', !testOverlay.isFocusable());
            
            // Close test window
            setTimeout(() => {
                testOverlay.close();
                console.log('Test completed - overlay window closed');
            }, 2000);
        }, 3000);
    });
}

// Run test if this is the main process
if (require.main === module) {
    app.whenReady().then(() => {
        testOverlayWindow();
        
        // Exit after test
        setTimeout(() => {
            app.quit();
        }, 10000);
    });
}

module.exports = { testOverlayWindow };
