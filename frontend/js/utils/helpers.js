// Utility functions for the application

const helpers = {
    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - The function to debounce
     * @param {number} wait - The time to wait in milliseconds
     * @returns {Function} - The debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format confidence score as percentage
     * @param {number} score - The confidence score (0-1)
     * @returns {string} - Formatted percentage
     */
    formatConfidence(score) {
        return `${(score * 100).toFixed(1)}%`;
    },

    /**
     * Create a notification element
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, warning)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    /**
     * Check if the browser supports required features
     * @returns {boolean} - Whether the browser is supported
     */
    checkBrowserSupport() {
        const requiredFeatures = [
            'mediaDevices' in navigator,
            'getUserMedia' in navigator.mediaDevices,
            'CanvasRenderingContext2D' in window
        ];
        
        return requiredFeatures.every(feature => feature);
    }
};

// Export helpers
window.helpers = helpers; 