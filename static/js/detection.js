import { formatConfidence, formatDetectionResult, handleError } from './helpers.js';
import camera from './camera.js';

class SignLanguageDetector {
    constructor() {
        this.socket = null;
        this.isDetecting = false;
        this.currentMode = 'letter'; // 'letter' or 'sentence'
        this.detectionInterval = null;
        this.resultsList = document.querySelector('.results-list');
        this.confidenceDisplay = document.querySelector('.confidence-display');
        this.modeButtons = document.querySelectorAll('.mode-button');
        
        this.initializeSocket();
        this.setupEventListeners();
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('detection_result', (result) => {
            this.handleDetectionResult(result);
        });
    }

    setupEventListeners() {
        // Mode selection
        this.modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setMode(button.dataset.mode);
            });
        });

        // Start/Stop detection
        document.querySelector('.start-button').addEventListener('click', () => {
            if (this.isDetecting) {
                this.stopDetection();
            } else {
                this.startDetection();
            }
        });
    }

    setMode(mode) {
        this.currentMode = mode;
        this.modeButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.mode === mode);
        });
    }

    async startDetection() {
        try {
            if (!await camera.initialize()) {
                throw new Error('Failed to initialize camera');
            }

            this.isDetecting = true;
            document.querySelector('.start-button').textContent = 'Dừng nhận diện';
            
            // Start sending frames to server
            this.detectionInterval = setInterval(() => {
                const frame = camera.getFrame();
                if (frame) {
                    this.socket.emit('detection_frame', {
                        frame: frame.toDataURL('image/jpeg'),
                        mode: this.currentMode
                    });
                }
            }, 100); // Send frame every 100ms

        } catch (error) {
            handleError(error, 'Starting detection');
        }
    }

    stopDetection() {
        this.isDetecting = false;
        document.querySelector('.start-button').textContent = 'Bắt đầu nhận diện';
        
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        camera.stop();
    }

    handleDetectionResult(result) {
        // Update confidence display
        this.confidenceDisplay.textContent = formatConfidence(result.confidence);

        // Add result to list
        const resultItem = this.createResultItem(result);
        this.resultsList.insertBefore(resultItem, this.resultsList.firstChild);

        // Draw detection results on canvas
        camera.drawDetectionResults(result);
    }

    createResultItem(result) {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        const formattedResult = formatDetectionResult(result);
        
        item.innerHTML = `
            <div class="result-content">
                <span class="result-sign">${formattedResult.sign}</span>
                <span class="result-confidence">${formatConfidence(formattedResult.confidence)}</span>
            </div>
            <span class="result-time">${new Date(formattedResult.timestamp).toLocaleTimeString()}</span>
        `;

        return item;
    }
}

// Initialize the detector when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SignLanguageDetector();
}); 