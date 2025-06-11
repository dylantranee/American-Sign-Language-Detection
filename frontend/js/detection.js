class SignLanguageDetector {
    constructor(cameraManager) {
        this.cameraManager = cameraManager;
        this.canvas = document.getElementById('detection-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resultsContainer = document.getElementById('results-container');
        this.isDetecting = false;
        this.detectionInterval = null;
        this.socket = null;
        this.lastDetection = null;
        this.detectionCount = 0;
        this.maxResults = 5;
        this.currentMode = 'letter'; // Default mode
        this.setupModeSwitching();
    }

    setupModeSwitching() {
        const letterModeBtn = document.getElementById('letter-mode');
        const sentenceModeBtn = document.getElementById('sentence-mode');

        letterModeBtn.addEventListener('click', () => this.switchMode('letter'));
        sentenceModeBtn.addEventListener('click', () => this.switchMode('sentence'));
    }

    switchMode(mode) {
        if (this.currentMode === mode) return;

        this.currentMode = mode;
        const letterModeBtn = document.getElementById('letter-mode');
        const sentenceModeBtn = document.getElementById('sentence-mode');

        // Update button states
        letterModeBtn.classList.toggle('active', mode === 'letter');
        sentenceModeBtn.classList.toggle('active', mode === 'sentence');

        // Clear current results
        this.resultsContainer.innerHTML = `
            <div class="detection-result placeholder">
                <p>Đang chờ nhận diện ${mode === 'letter' ? 'chữ cái' : 'câu'}...</p>
            </div>
        `;

        // Reset detection state
        this.lastDetection = null;
        this.detectionCount = 0;
    }

    async initialize() {
        // Initialize Socket.IO connection with current host
        const serverUrl = window.location.origin;
        this.socket = io(serverUrl);
        
        this.socket.on('connect', () => {
            console.log('Đã kết nối với máy chủ');
            helpers.showNotification('Đã kết nối với máy chủ', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Mất kết nối với máy chủ');
            helpers.showNotification('Mất kết nối với máy chủ', 'error');
        });

        this.socket.on('detection_update', (data) => {
            this.updateResults(data);
        });

        // Here you would initialize your ML model
        try {
            // TODO: Load your trained model here
            // this.model = await tf.loadLayersModel('path/to/model.json');
            return true;
        } catch (error) {
            console.error('Lỗi khởi tạo mô hình nhận diện:', error);
            return false;
        }
    }

    startDetection() {
        this.cameraManager.startCamera();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.detectFrame();
    }

    resizeCanvas() {
        const video = this.cameraManager.video;
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
    }

    async detectFrame() {
        if (!this.cameraManager.isRunning) return;

        const video = this.cameraManager.video;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            try {
                const response = await fetch('/detect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: imageData.data,
                        width: this.canvas.width,
                        height: this.canvas.height,
                        mode: this.currentMode
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.detected) {
                        this.updateResults(result);
                    }
                }
            } catch (error) {
                console.error('Detection error:', error);
                helpers.showNotification('Lỗi kết nối máy chủ', 'error');
            }
        }

        requestAnimationFrame(() => this.detectFrame());
    }

    stopDetection() {
        if (!this.isDetecting) return;
        
        this.isDetecting = false;
        clearInterval(this.detectionInterval);
    }

    updateResults(result) {
        // Only update if the detection is different from the last one
        if (this.lastDetection && 
            this.lastDetection.sign === result.sign && 
            Math.abs(this.lastDetection.confidence - result.confidence) < 0.05) {
            return;
        }

        this.lastDetection = result;
        this.detectionCount++;

        // Remove placeholder if it exists
        const placeholder = this.resultsContainer.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        // Create new result element
        const resultElement = document.createElement('div');
        resultElement.className = 'detection-result';
        resultElement.style.opacity = '0';
        resultElement.style.transform = 'translateY(20px)';
        
        const resultText = this.currentMode === 'letter' 
            ? `Chữ cái: ${result.sign}`
            : `Câu: ${result.sign}`;

        resultElement.innerHTML = `
            <p>
                <span class="sign-text">${resultText}</span>
            </p>
            <p>
                <span class="confidence-label">Độ chính xác:</span>
                <span class="confidence-value">${(result.confidence * 100).toFixed(1)}%</span>
            </p>
        `;

        // Add to container
        this.resultsContainer.insertBefore(resultElement, this.resultsContainer.firstChild);

        // Animate in
        requestAnimationFrame(() => {
            resultElement.style.transition = 'all 0.3s ease-out';
            resultElement.style.opacity = '1';
            resultElement.style.transform = 'translateY(0)';
        });

        // Limit number of results
        while (this.resultsContainer.children.length > this.maxResults) {
            const lastResult = this.resultsContainer.lastElementChild;
            lastResult.style.opacity = '0';
            lastResult.style.transform = 'translateY(20px)';
            setTimeout(() => lastResult.remove(), 300);
        }
    }

    drawDetection(detection) {
        const { x, y, width, height } = detection.boundingBox;
        this.cameraManager.drawDetectionBox(x, y, width, height, detection.sign);
    }
}

// Initialize detector
const signDetector = new SignLanguageDetector();

// Initialize when the page loads
window.addEventListener('load', async () => {
    await signDetector.initialize();
    // Start detection automatically when camera is ready
    signDetector.cameraManager.video.addEventListener('loadedmetadata', () => {
        signDetector.startDetection();
    });
});

// Stop detection when page is unloaded
window.addEventListener('beforeunload', () => {
    signDetector.stopDetection();
}); 