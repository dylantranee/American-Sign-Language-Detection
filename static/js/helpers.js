// Utility functions for the application

// Format confidence score to percentage
export const formatConfidence = (score) => {
    return `${(score * 100).toFixed(1)}%`;
};

// Debounce function to limit how often a function can be called
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle function to limit how often a function can be called
export const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Format timestamp to readable format
export const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
};

// Create a unique ID
export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

// Check if device has camera
export const hasCamera = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
        console.error('Error checking camera:', error);
        return false;
    }
};

// Format detection result for display
export const formatDetectionResult = (result) => {
    return {
        id: generateId(),
        timestamp: Date.now(),
        sign: result.sign,
        confidence: result.confidence,
        mode: result.mode
    };
};

// Error handling utility
export const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    // You can add additional error handling logic here
    return {
        error: true,
        message: error.message || 'An error occurred',
        context
    };
}; 