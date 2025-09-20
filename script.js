const { ipcRenderer } = require('electron');

class Spyn {
    constructor() {
        this.isMonitoring = false;
        this.sessionStartTime = null;
        this.sessionTimer = null;
        this.postureData = [];
        this.isGoodPosture = true;
        this.overlayMode = 'status';
        this.transparencyLevel = 'visible';
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.initializeElements();
        this.bindEvents();
        this.initializeChart();
        this.setupIPC();
    }

    initializeElements() {
        // Dashboard elements
        this.startBtn = document.getElementById('startMonitoringBtn');
        this.postureReport = document.getElementById('postureReport');
        
        // Exercise elements
        this.startExerciseBtn = document.getElementById('startExerciseBtn');
        this.exerciseAnalysis = document.getElementById('exerciseAnalysis');
        
        // Modal elements
        this.shortcutsBtn = document.getElementById('shortcutsBtn');
        this.shortcutsModal = document.getElementById('shortcutsModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        
        // Sign-out element
        this.signoutBtn = document.getElementById('signoutBtn');
        
        // Report elements
        this.overallScore = document.getElementById('overallScore');
        this.sessionDuration = document.getElementById('sessionDuration');
        this.goodPostureTime = document.getElementById('goodPostureTime');
        this.corrections = document.getElementById('corrections');
    }

    bindEvents() {
        // Dashboard events
        this.startBtn.addEventListener('click', () => this.toggleMonitoring());
        
        // Exercise events
        if (this.startExerciseBtn) {
            this.startExerciseBtn.addEventListener('click', () => this.startExerciseAnalysis());
        }
        
        // Tab switching events
        this.initializeTabs();
        
        // Modal events
        if (this.shortcutsBtn) {
            this.shortcutsBtn.addEventListener('click', () => this.showShortcutsModal());
        }
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.hideShortcutsModal());
        }
        if (this.shortcutsModal) {
            this.shortcutsModal.addEventListener('click', (e) => {
                if (e.target === this.shortcutsModal) {
                    this.hideShortcutsModal();
                }
            });
        }
        if (this.signoutBtn) {
            this.signoutBtn.addEventListener('click', () => this.handleSignOut());
        }
        
        // Keyboard shortcuts
        this.initializeKeyboardShortcuts();
    }

    initializeTabs() {
        // Get tab buttons and panes
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        
        // Add click event listeners to tab buttons
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panes
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to selected tab and pane
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        const activePane = document.getElementById(`${tabName}-tab`);
        
        if (activeButton && activePane) {
            activeButton.classList.add('active');
            activePane.classList.add('active');
            
            // If switching to exercise tab, close the overlay
            if (tabName === 'exercise' && this.isMonitoring) {
                this.stopMonitoring();
            }
        }
    }

    setupIPC() {
        // Listen for messages from main process
        ipcRenderer.on('overlay-closed', () => {
            this.stopMonitoring();
        });
    }

    toggleMonitoring() {
        if (this.isMonitoring) {
            this.stopMonitoring();
        } else {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        this.isMonitoring = true;
        this.sessionStartTime = Date.now();
        this.postureData = [];
        
        // Update UI
        this.startBtn.innerHTML = '<span class="btn-icon">⏹</span>Stop Monitoring';
        this.startBtn.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
        this.startBtn.style.boxShadow = '0 8px 32px rgba(255, 68, 68, 0.3)';
        
        // Hide report
        this.postureReport.classList.add('hidden');
        
        // Start timer
        this.startTimer();
        
        // Simulate posture monitoring (replace with actual AI logic later)
        this.startPostureSimulation();
        
        // Notify main process to start monitoring
        ipcRenderer.invoke('start-monitoring');
        
        console.log('Spyn monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        // Update UI
        this.startBtn.innerHTML = '<span class="btn-icon">▶</span>Start Spyn Monitoring';
        this.startBtn.style.background = 'linear-gradient(135deg, #00bfff, #0099cc)';
        this.startBtn.style.boxShadow = '0 8px 32px rgba(0, 191, 255, 0.3)';
        
        // Show report
        this.showPostureReport();
        
        // Stop timer
        clearInterval(this.timerInterval);
        
        // Notify main process to stop monitoring
        ipcRenderer.invoke('stop-monitoring');
        
        console.log('Spyn monitoring stopped');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.sessionStartTime) {
                const elapsed = Date.now() - this.sessionStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.sessionTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
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
        
        console.log(`Posture changed: ${this.isGoodPosture ? 'Good' : 'Bad'}`);
    }

    calculateGoodPosturePercentage() {
        if (this.postureData.length === 0) return 100;
        
        const goodCount = this.postureData.filter(data => data.isGood).length;
        return Math.round((goodCount / this.postureData.length) * 100);
    }

    showPostureReport() {
        // Calculate session metrics
        const sessionDuration = this.sessionStartTime ? 
            Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0;
        
        const minutes = Math.floor(sessionDuration / 60);
        const seconds = sessionDuration % 60;
        
        const goodPosturePercentage = this.calculateGoodPosturePercentage();
        const corrections = this.postureData.filter((data, index) => 
            index > 0 && data.isGood !== this.postureData[index - 1].isGood
        ).length;
        
        // Update report metrics
        this.overallScore.textContent = `${goodPosturePercentage}%`;
        this.sessionDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.goodPostureTime.textContent = `${goodPosturePercentage}%`;
        this.corrections.textContent = corrections.toString();
        
        // Show report
        this.postureReport.classList.remove('hidden');
        
        // Update chart
        this.updateChart();
    }

    initializeChart() {
        this.chartCanvas = document.getElementById('postureChart');
        this.chartCtx = this.chartCanvas.getContext('2d');
    }

    updateChart() {
        if (!this.chartCtx || this.postureData.length === 0) return;
        
        const canvas = this.chartCanvas;
        const ctx = this.chartCtx;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up chart dimensions
        const padding = 40;
        const chartWidth = canvas.width - (padding * 2);
        const chartHeight = canvas.height - (padding * 2);
        
        // Draw background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(padding, padding, chartWidth, chartHeight);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }
        
        // Draw posture data
        if (this.postureData.length > 1) {
            const pointSpacing = chartWidth / (this.postureData.length - 1);
            
            ctx.strokeStyle = '#00bfff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            this.postureData.forEach((data, index) => {
                const x = padding + (pointSpacing * index);
                const y = padding + chartHeight - (chartHeight * (data.percentage / 100));
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw data points
            ctx.fillStyle = '#00bfff';
            this.postureData.forEach((data, index) => {
                const x = padding + (pointSpacing * index);
                const y = padding + chartHeight - (chartHeight * (data.percentage / 100));
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
        
        // Draw labels
        ctx.fillStyle = '#888';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        // Y-axis labels
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            const value = 100 - (i * 25);
            ctx.fillText(`${value}%`, padding - 10, y + 4);
        }
    }

    startExerciseAnalysis() {
        // Show the exercise analysis section
        if (this.exerciseAnalysis) {
            this.exerciseAnalysis.classList.remove('hidden');
            
            // Update button text
            if (this.startExerciseBtn) {
                this.startExerciseBtn.textContent = '📹 Exercise Analysis Active';
                this.startExerciseBtn.disabled = true;
            }
            
            // Start exercise simulation
            this.startExerciseSimulation();
            
            console.log('Exercise analysis started');
        }
    }

    startExerciseSimulation() {
        // Simulate exercise data updates
        this.exerciseInterval = setInterval(() => {
            // Update form score (simulate slight variations)
            const formScore = document.getElementById('formScore');
            if (formScore) {
                const currentScore = parseInt(formScore.textContent);
                const variation = Math.floor(Math.random() * 6) - 3; // -3 to +3
                const newScore = Math.max(80, Math.min(100, currentScore + variation));
                formScore.textContent = `${newScore}%`;
            }
            
            // Update reps count
            const repsCount = document.getElementById('repsCount');
            if (repsCount) {
                const currentReps = parseInt(repsCount.textContent);
                repsCount.textContent = currentReps + 1;
            }
            
            // Update corrections made
            const correctionsMade = document.getElementById('correctionsMade');
            if (correctionsMade && Math.random() > 0.7) { // 30% chance of correction
                const currentCorrections = parseInt(correctionsMade.textContent);
                correctionsMade.textContent = currentCorrections + 1;
            }
        }, 3000); // Update every 3 seconds
    }

    initializeKeyboardShortcuts() {
        // Add keyboard event listener to document
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts from triggering in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // Handle shortcuts based on key combinations
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'm':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleMonitoring();
                        }
                        break;
                    case 'p':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleOverlay();
                        }
                        break;
                    case 't':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.setTransparency('transparent');
                        }
                        break;
                    case 'f':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.setTransparency('visible');
                        }
                        break;
                    case 'c':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleCamera();
                        }
                        break;
                    case 'o':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.centerOverlay();
                        }
                        break;
                }
            }

            // Function key shortcuts
            switch (e.key) {
                case 'F9':
                    e.preventDefault();
                    this.toggleMonitoring();
                    break;
                case 'F10':
                    e.preventDefault();
                    this.toggleOverlay();
                    break;
                case 'F11':
                    e.preventDefault();
                    this.toggleCamera();
                    break;
                case 'F1':
                    e.preventDefault();
                    this.setTransparency('visible');
                    break;
                case 'F2':
                    e.preventDefault();
                    this.setTransparency('transparent');
                    break;
                case 'F3':
                    e.preventDefault();
                    this.switchTab('posture');
                    break;
                case 'F4':
                    e.preventDefault();
                    this.switchTab('exercise');
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (this.shortcutsModal && !this.shortcutsModal.classList.contains('hidden')) {
                        this.hideShortcutsModal();
                    } else if (this.isMonitoring) {
                        this.stopMonitoring();
                    }
                    break;
                case 'F12':
                    e.preventDefault();
                    this.toggleShortcutsModal();
                    break;
            }
        });

        console.log('Keyboard shortcuts initialized');
    }

    toggleOverlay() {
        ipcRenderer.invoke('toggle-overlay');
    }

    setTransparency(level) {
        ipcRenderer.invoke('set-transparency', level);
    }

    toggleCamera() {
        ipcRenderer.invoke('show-camera');
    }

    centerOverlay() {
        ipcRenderer.invoke('center-overlay');
    }

    showShortcutsModal() {
        if (this.shortcutsModal) {
            this.shortcutsModal.classList.remove('hidden');
        }
    }

    hideShortcutsModal() {
        if (this.shortcutsModal) {
            this.shortcutsModal.classList.add('hidden');
        }
    }

    toggleShortcutsModal() {
        if (this.shortcutsModal) {
            if (this.shortcutsModal.classList.contains('hidden')) {
                this.showShortcutsModal();
            } else {
                this.hideShortcutsModal();
            }
        }
    }

    handleSignOut() {
        // Stop monitoring if active
        if (this.isMonitoring) {
            this.stopMonitoring();
        }
        
        // Show confirmation message
        const confirmation = confirm('Are you sure you want to sign out?');
        if (confirmation) {
            // Navigate to sign-in page
            ipcRenderer.send('navigate-to-signin');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new Spyn();
    console.log('Spyn initialized');
});
