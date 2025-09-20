const { ipcRenderer } = require('electron');

class SpynOverlay {
    constructor() {
        this.isMonitoring = false;
        this.sessionStartTime = null;
        this.timerInterval = null;
        this.postureData = [];
        this.isGoodPosture = true;
        this.overlayMode = 'status';
        this.transparencyLevel = 'visible';
        
        this.initializeElements();
        this.bindEvents();
        this.setupIPC();
        
        // Start timer after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.startTimer();
        }, 100);
    }

    initializeElements() {
        // Overlay elements
        this.sessionTimer = document.getElementById('sessionTimer');
        this.postureStatus = document.getElementById('postureStatus');
        this.overlayMode = document.getElementById('overlayMode');
        this.posturePercentage = document.getElementById('posturePercentage');
        this.closeBtn = document.getElementById('closeBtn');
        
        // Title timer
        this.titleTimer = document.getElementById('titleTimer');
        
        // Transparency controls
        this.transparentBtn = document.getElementById('transparentBtn');
        this.visibleBtn = document.getElementById('visibleBtn');
        
        // Container for state management
        this.container = document.querySelector('.overlay-container');
        
        // Debug element initialization
        console.log('Elements initialized:', {
            sessionTimer: !!this.sessionTimer,
            titleTimer: !!this.titleTimer,
            postureStatus: !!this.postureStatus
        });
    }

    bindEvents() {
        // Overlay events
        this.closeBtn.addEventListener('click', () => this.closeOverlay());
        this.overlayMode.addEventListener('change', (e) => this.changeOverlayMode(e.target.value));
        
        // Transparency controls
        this.transparentBtn.addEventListener('click', () => this.setTransparency('transparent'));
        this.visibleBtn.addEventListener('click', () => this.setTransparency('visible'));
    }

    setupIPC() {
        // Listen for messages from main process
        ipcRenderer.on('start-monitoring', () => {
            this.startMonitoring();
        });

        ipcRenderer.on('stop-monitoring', () => {
            this.stopMonitoring();
        });


        ipcRenderer.on('transparency-changed', (event, level) => {
            this.container.classList.remove('transparent', 'visible');
            this.container.classList.add(level);
        });
    }

    startMonitoring() {
        this.isMonitoring = true;
        this.sessionStartTime = Date.now();
        this.postureData = [];
        
        // Restart timer with new start time
        this.startTimer();
        
        // Start posture simulation
        this.startPostureSimulation();
        
        console.log('Overlay: Monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        // Stop timer
        clearInterval(this.timerInterval);
        
        // Stop posture simulation
        if (this.postureSimulation) {
            clearInterval(this.postureSimulation);
        }
        
        console.log('Overlay: Monitoring stopped');
    }

    startTimer() {
        // Clear any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Ensure we have a start time
        if (!this.sessionStartTime) {
            this.sessionStartTime = Date.now();
        }
        
        // Start the timer immediately
        this.updateTimer();
        
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
        
        console.log('Timer started with start time:', this.sessionStartTime);
    }
    
    updateTimer() {
        if (this.sessionStartTime) {
            const elapsed = Date.now() - this.sessionStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Re-find elements in case they weren't available initially
            if (!this.sessionTimer) {
                this.sessionTimer = document.getElementById('sessionTimer');
            }
            if (!this.titleTimer) {
                this.titleTimer = document.getElementById('titleTimer');
            }
            
            // Update timers
            if (this.sessionTimer) {
                this.sessionTimer.textContent = timeString;
            }
            if (this.titleTimer) {
                this.titleTimer.textContent = timeString;
            }
            
            console.log('Timer updated:', timeString);
        }
    }

    startPostureSimulation() {
        // Simulate posture changes every 3-8 seconds
        this.postureSimulation = setInterval(() => {
            if (this.isMonitoring) {
                this.simulatePostureChange();
            }
        }, Math.random() * 5000 + 3000);
    }

    simulatePostureChange() {
        // Randomly change posture status
        const wasGoodPosture = this.isGoodPosture;
        this.isGoodPosture = Math.random() > 0.3; // 70% chance of good posture
        
        // Record posture data
        this.postureData.push({
            timestamp: Date.now(),
            isGood: this.isGoodPosture,
            percentage: this.calculateGoodPosturePercentage()
        });
        
        this.updatePostureStatus();
        
        // Handle bad posture behavior
        if (!this.isGoodPosture && wasGoodPosture) {
            this.handleBadPosture();
        } else if (this.isGoodPosture && !wasGoodPosture) {
            this.handleGoodPosture();
        }
        
        this.updatePosturePercentage();
    }

    updatePostureStatus() {
        const statusElement = this.postureStatus;
        const statusIcon = statusElement.querySelector('.status-icon');
        const statusText = statusElement.querySelector('.status-text');
        
        if (this.isGoodPosture) {
            statusElement.className = 'posture-status good';
            statusIcon.textContent = '✓';
            statusText.textContent = 'Good';
        } else {
            statusElement.className = 'posture-status bad';
            statusIcon.textContent = '✗';
            statusText.textContent = 'Bad';
        }
    }

    handleBadPosture() {
        // Center-lock overlay and make it solid
        document.body.classList.add('bad-posture');
        
        // Notify main process to center the window
        ipcRenderer.send('center-overlay');
        
        console.log('Bad posture detected - overlay centered and locked');
    }

    handleGoodPosture() {
        // Remove center-lock
        document.body.classList.remove('bad-posture');
        
        console.log('Good posture restored - overlay unlocked');
    }

    calculateGoodPosturePercentage() {
        if (this.postureData.length === 0) return 100;
        
        const goodCount = this.postureData.filter(data => data.isGood).length;
        return Math.round((goodCount / this.postureData.length) * 100);
    }

    updatePosturePercentage() {
        const percentage = this.calculateGoodPosturePercentage();
        this.posturePercentage.textContent = `${percentage}%`;
    }

    changeOverlayMode(mode) {
        this.overlayMode = mode;
        
        switch (mode) {
            case 'camera':
                console.log('Switched to camera feed mode');
                this.showCamera();
                break;
            case 'status':
                console.log('Switched to status mode');
                this.hideCamera();
                break;
            case 'percentage':
                console.log('Switched to percentage mode');
                this.hideCamera();
                break;
        }
    }

    showCamera() {
        // Notify main process to show camera window
        ipcRenderer.invoke('show-camera');
        console.log('Camera window requested');
    }

    hideCamera() {
        // Notify main process to hide camera window
        ipcRenderer.invoke('hide-camera');
        console.log('Camera window hide requested');
    }

    setTransparency(level) {
        this.transparencyLevel = level;
        
        // Update button states
        document.querySelectorAll('.transparency-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`).classList.add('active');
        
        // Notify main process to handle transparency
        ipcRenderer.invoke('set-transparency', level);
        
        console.log(`Transparency set to: ${level}`);
    }



    closeOverlay() {
        // Notify main process to stop monitoring and close overlay
        ipcRenderer.invoke('stop-monitoring');
        window.close();
    }
}

// Initialize the overlay when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const overlay = new SpynOverlay();
    console.log('Spyn Overlay initialized');
});
