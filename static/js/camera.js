import { hasCamera, handleError } from './helpers.js';

class Camera {
    constructor() {
        this.videoElement = document.querySelector('.video-feed');
        this.canvas = document.getElementById('detection-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            if (!await hasCamera()) {
                throw new Error('No camera found on this device');
            }

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();

            // Set canvas dimensions to match video
            this.videoElement.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.videoElement.videoWidth;
                this.canvas.height = this.videoElement.videoHeight;
            });

            this.isInitialized = true;
            return true;
        } catch (error) {
            handleError(error, 'Camera initialization');
            return false;
        }
    }

    async stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.isInitialized = false;
    }

    getFrame() {
        if (!this.isInitialized) return null;

        // Draw the current video frame to the canvas
        this.ctx.drawImage(
            this.videoElement,
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Return the canvas data
        return this.canvas;
    }

    // Draw detection results on the canvas
    drawDetectionResults(results) {
        if (!this.isInitialized || !results) return;

        // Clear previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the current video frame
        this.ctx.drawImage(
            this.videoElement,
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Draw detection results
        if (results.landmarks) {
            this.drawLandmarks(results.landmarks);
        }

        if (results.boundingBox) {
            this.drawBoundingBox(results.boundingBox);
        }
    }

    // Draw hand landmarks
    drawLandmarks(landmarks) {
        this.ctx.strokeStyle = '#a855f7';
        this.ctx.lineWidth = 2;

        landmarks.forEach(landmark => {
            this.ctx.beginPath();
            this.ctx.arc(
                landmark.x * this.canvas.width,
                landmark.y * this.canvas.height,
                3, 0, 2 * Math.PI
            );
            this.ctx.fillStyle = '#a855f7';
            this.ctx.fill();
        });
    }

    // Draw bounding box around detected hand
    drawBoundingBox(box) {
        const { x, y, width, height } = box;
        
        this.ctx.strokeStyle = '#a855f7';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            x * this.canvas.width,
            y * this.canvas.height,
            width * this.canvas.width,
            height * this.canvas.height
        );
    }
}

// Create and export a singleton instance
const camera = new Camera();
export default camera; 