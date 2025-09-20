const { ipcRenderer } = require('electron');

class CameraManager {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.cameraStatus = document.getElementById('cameraStatus');
        this.closeBtn = document.getElementById('closeBtn');
        
        this.stream = null;
        this.isCameraActive = false;
        
        this.initializeCamera();
        this.bindEvents();
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', () => {
            this.stopCamera();
            window.close();
        });

        // Handle window close
        window.addEventListener('beforeunload', () => {
            this.stopCamera();
        });
    }

    async initializeCamera() {
        try {
            this.showLoading('Requesting camera access...');
            
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user' // Front camera
                },
                audio: false
            });

            // Set video source
            this.videoElement.srcObject = this.stream;
            
            // Wait for video to load
            this.videoElement.onloadedmetadata = () => {
                this.hideLoading();
                this.showCamera();
                this.isCameraActive = true;
                this.cameraStatus.textContent = 'Camera Active';
                console.log('Camera initialized successfully');
            };

            this.videoElement.onerror = (error) => {
                console.error('Video error:', error);
                this.showError('Failed to load camera stream');
            };

        } catch (error) {
            console.error('Camera access error:', error);
            this.handleCameraError(error);
        }
    }

    showLoading(message) {
        this.loadingMessage.textContent = message;
        this.loadingMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
        this.videoElement.style.display = 'none';
    }

    hideLoading() {
        this.loadingMessage.style.display = 'none';
    }

    showCamera() {
        this.videoElement.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.loadingMessage.style.display = 'none';
        this.videoElement.style.display = 'none';
        this.cameraStatus.textContent = 'Camera Error';
        this.cameraStatus.className = 'camera-status camera-error';
    }

    handleCameraError(error) {
        let errorMessage = 'Camera access denied';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'Camera is being used by another application.';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = 'Camera constraints cannot be satisfied.';
        } else {
            errorMessage = `Camera error: ${error.message}`;
        }
        
        this.showError(errorMessage);
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        this.isCameraActive = false;
        console.log('Camera stopped');
    }
}

// Initialize camera when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cameraManager = new CameraManager();
    console.log('Camera Manager initialized');
});
