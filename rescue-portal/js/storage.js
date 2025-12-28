// ═══════════════════════════════════════════════════════════════
//                    DRECS - Storage & Queue Management
// ═══════════════════════════════════════════════════════════════

/**
 * Handles offline storage and request queue
 */

const STORAGE_KEY = 'drecs_request_queue';
const REQUEST_PREFIX = 'REQ';

// ─────────────────────────────────────────────────────────────────
// GENERATE REQUEST ID
// ─────────────────────────────────────────────────────────────────

function generateRequestId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 4; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// ─────────────────────────────────────────────────────────────────
// QUEUE REQUEST (for offline)
// ─────────────────────────────────────────────────────────────────

function queueRequest(data) {
    const queue = getRequestQueue();
    
    const requestId = generateRequestId();
    const queueItem = {
        id: requestId,
        data: data,
        timestamp: Date.now(),
        attempts: 0
    };
    
    queue.push(queueItem);
    saveRequestQueue(queue);
    
    console.log(`[DRECS] Request queued: ${requestId}`);
    
    // Register for background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.SyncManager) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-rescue-requests')
                .catch(err => console.warn('[DRECS] Sync registration failed:', err));
        });
    }
    
    return requestId;
}

// ─────────────────────────────────────────────────────────────────
// GET REQUEST QUEUE
// ─────────────────────────────────────────────────────────────────

function getRequestQueue() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[DRECS] Failed to read queue:', error);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────
// SAVE REQUEST QUEUE
// ─────────────────────────────────────────────────────────────────

function saveRequestQueue(queue) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
        console.error('[DRECS] Failed to save queue:', error);
        
        // If storage is full, remove oldest items
        if (error.name === 'QuotaExceededError') {
            const trimmedQueue = queue.slice(-10); // Keep last 10
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedQueue));
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// REMOVE FROM QUEUE
// ─────────────────────────────────────────────────────────────────

function removeFromQueue(requestId) {
    const queue = getRequestQueue();
    const filtered = queue.filter(item => item.id !== requestId);
    saveRequestQueue(filtered);
    console.log(`[DRECS] Request removed from queue: ${requestId}`);
}

// ─────────────────────────────────────────────────────────────────
// UPDATE QUEUE ITEM
// ─────────────────────────────────────────────────────────────────

function updateQueueItem(requestId, updates) {
    const queue = getRequestQueue();
    const index = queue.findIndex(item => item.id === requestId);
    
    if (index !== -1) {
        queue[index] = { ...queue[index], ...updates };
        saveRequestQueue(queue);
    }
}

// ─────────────────────────────────────────────────────────────────
// CLEAR OLD REQUESTS
// ─────────────────────────────────────────────────────────────────

function clearOldRequests() {
    const queue = getRequestQueue();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const filtered = queue.filter(item => item.timestamp > oneDayAgo);
    
    if (filtered.length !== queue.length) {
        saveRequestQueue(filtered);
        console.log(`[DRECS] Cleared ${queue.length - filtered.length} old requests`);
    }
}

// ─────────────────────────────────────────────────────────────────
// GET PENDING COUNT
// ─────────────────────────────────────────────────────────────────

function getPendingCount() {
    return getRequestQueue().length;
}

// ─────────────────────────────────────────────────────────────────
// SAVE LAST REQUEST (for reference)
// ─────────────────────────────────────────────────────────────────

function saveLastRequest(request) {
    try {
        localStorage.setItem('drecs_last_request', JSON.stringify(request));
    } catch (error) {
        console.warn('[DRECS] Failed to save last request:', error);
    }
}

function getLastRequest() {
    try {
        const data = localStorage.getItem('drecs_last_request');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────
// INDEXED DB FOR LARGER STORAGE (Future enhancement)
// ─────────────────────────────────────────────────────────────────

const DB_NAME = 'drecs_db';
const DB_VERSION = 1;
const STORE_NAME = 'requests';

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!('indexedDB' in window)) {
            reject(new Error('IndexedDB not supported'));
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

// Clean up old requests on load
document.addEventListener('DOMContentLoaded', () => {
    clearOldRequests();
});

console.log('[DRECS] storage.js loaded');
