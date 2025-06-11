class CameraManager {
    constructor() {
        this.video = document.getElementById('camera-feed');
        this.canvas = document.getElementById('detection-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.isRunning = false;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });
            
            this.video.srcObject = this.stream;
            this.isRunning = true;
            
            // Set canvas dimensions to match video
            this.video.onloadedmetadata = () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            };
            
            return true;
        } catch (error) {
            console.error('Lỗi truy cập camera:', error);
            helpers.showNotification('Không thể truy cập camera', 'error');
            return false;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
            this.isRunning = false;
        }
    }

    getFrame() {
        if (!this.isRunning) return null;
        
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        return this.canvas;
    }

    drawDetectionBox(x, y, width, height, label) {
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw label
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(label, x, y - 5);
    }
}

// Initialize camera manager
const cameraManager = new CameraManager();

// Start camera automatically when page loads
window.addEventListener('load', async () => {
    await cameraManager.startCamera();
});

// Stop camera when page is unloaded
window.addEventListener('beforeunload', () => {
    cameraManager.stopCamera();
}); 