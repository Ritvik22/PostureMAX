const { ipcRenderer } = require('electron');

class PostureMAX {
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
        
        // Report elements
        this.overallScore = document.getElementById('overallScore');
        this.sessionDuration = document.getElementById('sessionDuration');
        this.goodPostureTime = document.getElementById('goodPostureTime');
        this.corrections = document.getElementById('corrections');
    }

    bindEvents() {
        // Dashboard events
        this.startBtn.addEventListener('click', () => this.toggleMonitoring());
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
        
        console.log('PostureMAX monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        // Update UI
        this.startBtn.innerHTML = '<span class="btn-icon">▶</span>Start PostureMAX Monitoring';
        this.startBtn.style.background = 'linear-gradient(135deg, #00bfff, #0099cc)';
        this.startBtn.style.boxShadow = '0 8px 32px rgba(0, 191, 255, 0.3)';
        
        // Show report
        this.showPostureReport();
        
        // Stop timer
        clearInterval(this.timerInterval);
        
        // Notify main process to stop monitoring
        ipcRenderer.invoke('stop-monitoring');
        
        console.log('PostureMAX monitoring stopped');
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PostureMAX();
    console.log('PostureMAX initialized');
});
