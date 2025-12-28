// ═══════════════════════════════════════════════════════════════
//                    DRECS - Main App Controller
// ═══════════════════════════════════════════════════════════════

/**
 * DRECS Rescue Portal - Main Application
 * Handles initialization and coordinates all modules
 */

// ─────────────────────────────────────────────────────────────────
// APP STATE
// ─────────────────────────────────────────────────────────────────

const AppState = {
    currentScreen: 'main',
    isOnline: navigator.onLine,
    currentRequest: null,
    gpsPosition: null,
    isSubmitting: false
};

// ─────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DRECS] Initializing app...');
    
    // Initialize modules
    initGPS();
    initForm();
    initOfflineDetection();
    initServiceWorkerMessages();
    
    // Check URL params for direct actions
    handleURLParams();
    
    // Process any queued requests
    processQueue();
    
    console.log('[DRECS] App initialized');
});

// ─────────────────────────────────────────────────────────────────
// OFFLINE DETECTION
// ─────────────────────────────────────────────────────────────────

function initOfflineDetection() {
    const offlineNotice = document.getElementById('offline-notice');
    const connectionStatus = document.getElementById('connection-status');
    
    function updateOnlineStatus() {
        AppState.isOnline = navigator.onLine;
        
        if (AppState.isOnline) {
            offlineNotice.classList.remove('offline-visible');
            connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Đã kết nối';
            // Try to process queue when back online
            processQueue();
        } else {
            offlineNotice.classList.add('offline-visible');
            connectionStatus.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span> Không có mạng';
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
}

// ─────────────────────────────────────────────────────────────────
// SERVICE WORKER MESSAGES
// ─────────────────────────────────────────────────────────────────

function initServiceWorkerMessages() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[DRECS] SW message:', event.data);
            
            if (event.data.type === 'SYNC_READY') {
                processQueue();
            }
            
            if (event.data.type === 'NOTIFICATION_CLICKED') {
                handleNotificationData(event.data.data);
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────
// URL PARAMETERS HANDLER
// ─────────────────────────────────────────────────────────────────

function handleURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Handle panic action from PWA shortcut
    if (params.get('action') === 'panic') {
        handlePanic();
    }
    
    // Handle screen navigation
    if (params.get('screen') === 'response') {
        showScreen('response');
    }
}

// ─────────────────────────────────────────────────────────────────
// PANIC BUTTON HANDLER
// ─────────────────────────────────────────────────────────────────

async function handlePanic() {
    console.log('[DRECS] PANIC button pressed!');
    
    // Vibrate for haptic feedback (if supported)
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
    
    // Get current GPS
    const position = AppState.gpsPosition || await getCurrentPosition();
    
    // Create panic request
    const panicRequest = {
        lat: position?.lat || null,
        lng: position?.lng || null,
        people: 1,
        urgency: 3, // MAX
        injured: false,
        water_level: null,
        food_available: null,
        phone: null,
        timestamp: new Date().toISOString(),
        is_panic: true
    };
    
    // Submit immediately
    await submitRequest(panicRequest);
}

// ─────────────────────────────────────────────────────────────────
// FORM SUBMIT HANDLER
// ─────────────────────────────────────────────────────────────────

async function handleSubmit(event) {
    event.preventDefault();
    
    if (AppState.isSubmitting) return;
    
    console.log('[DRECS] Form submitted');
    
    // Gather form data
    const formData = gatherFormData();
    
    // Validate
    if (!validateForm(formData)) {
        return;
    }
    
    // Submit
    await submitRequest(formData);
}

// ─────────────────────────────────────────────────────────────────
// SUBMIT REQUEST
// ─────────────────────────────────────────────────────────────────

async function submitRequest(data) {
    AppState.isSubmitting = true;
    showLoading(true);
    
    try {
        // Add fingerprint for deduplication
        data.fingerprint = generateFingerprint(data);
        
        // Try to send
        const response = await sendRescueRequest(data);
        
        if (response.success) {
            // Success - show confirmation
            AppState.currentRequest = {
                ...data,
                request_id: response.request_id
            };
            showConfirmation(response);
        } else if (response.offline) {
            // Offline - queue and show confirmation
            const queuedId = queueRequest(data);
            AppState.currentRequest = {
                ...data,
                request_id: queuedId,
                queued: true
            };
            showConfirmation({
                success: true,
                request_id: queuedId,
                message: 'Đã lưu - sẽ gửi khi có mạng'
            });
        } else {
            // Error
            showError(response.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
    } catch (error) {
        console.error('[DRECS] Submit error:', error);
        
        // Queue for later
        const queuedId = queueRequest(data);
        AppState.currentRequest = {
            ...data,
            request_id: queuedId,
            queued: true
        };
        showConfirmation({
            success: true,
            request_id: queuedId,
            message: 'Đã lưu - sẽ gửi khi có mạng'
        });
    } finally {
        AppState.isSubmitting = false;
        showLoading(false);
    }
}

// ─────────────────────────────────────────────────────────────────
// GENERATE FINGERPRINT
// ─────────────────────────────────────────────────────────────────

function generateFingerprint(data) {
    // Simple fingerprint: rounded GPS + people count
    const latRound = data.lat ? Math.round(data.lat * 1000) / 1000 : 0;
    const lngRound = data.lng ? Math.round(data.lng * 1000) / 1000 : 0;
    const phoneLast4 = data.phone ? data.phone.slice(-4) : '0000';
    
    const str = `${latRound}|${lngRound}|${phoneLast4}|${data.people}`;
    
    // Simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────
// SHOW CONFIRMATION
// ─────────────────────────────────────────────────────────────────

function showConfirmation(response) {
    const request = AppState.currentRequest;
    
    // Update confirmation screen
    document.getElementById('confirm-request-id').textContent = `#${response.request_id}`;
    document.getElementById('confirm-location').textContent = 
        request.lat && request.lng 
            ? `${request.lat.toFixed(4)}, ${request.lng.toFixed(4)}`
            : 'Không xác định';
    document.getElementById('confirm-people').textContent = request.people || '--';
    document.getElementById('confirm-urgency').textContent = getUrgencyText(request.urgency);
    document.getElementById('confirm-time').textContent = new Date().toLocaleTimeString('vi-VN');
    
    // Show screen
    showScreen('confirm');
    
    // Start polling for response (if online)
    if (AppState.isOnline && !request.queued) {
        startPollingForResponse(response.request_id);
    }
}

// ─────────────────────────────────────────────────────────────────
// POLL FOR RESPONSE
// ─────────────────────────────────────────────────────────────────

let pollInterval = null;

function startPollingForResponse(requestId) {
    // Clear any existing interval
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    
    // Poll every 10 seconds
    pollInterval = setInterval(async () => {
        if (!AppState.isOnline) return;
        
        try {
            const response = await checkForNotification(requestId);
            
            if (response && response.hasNotification) {
                clearInterval(pollInterval);
                showResponse(response.notification);
            }
        } catch (error) {
            console.error('[DRECS] Poll error:', error);
        }
    }, 10000);
    
    // Stop polling after 30 minutes
    setTimeout(() => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    }, 30 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────────
// SHOW RESPONSE
// ─────────────────────────────────────────────────────────────────

function showResponse(notification) {
    // Update response screen
    document.getElementById('response-request-id').textContent = `#${notification.request_id}`;
    document.getElementById('response-eta').textContent = `~${notification.eta_minutes}`;
    document.getElementById('response-vehicle').textContent = getVehicleEmoji(notification.team_type) + ' ' + getVehicleName(notification.team_type);
    document.getElementById('response-direction').textContent = notification.direction || 'Đang xác định';
    document.getElementById('response-message').textContent = notification.message || 'Đội đang trên đường đến';
    
    // Update instructions
    if (notification.instructions && notification.instructions.length > 0) {
        const instructionsList = document.getElementById('response-instructions');
        instructionsList.innerHTML = notification.instructions.map(inst => `
            <li class="flex items-start">
                <span class="mr-2">•</span>
                <span>${inst}</span>
            </li>
        `).join('');
    }
    
    // Show screen
    showScreen('response');
    
    // Vibrate for attention
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

// ─────────────────────────────────────────────────────────────────
// HANDLE NOTIFICATION DATA
// ─────────────────────────────────────────────────────────────────

function handleNotificationData(data) {
    if (data && data.notification) {
        showResponse(data.notification);
    }
}

// ─────────────────────────────────────────────────────────────────
// CONFIRM RECEIVED
// ─────────────────────────────────────────────────────────────────

async function confirmReceived() {
    if (AppState.currentRequest) {
        try {
            await sendAcknowledgment(AppState.currentRequest.request_id);
        } catch (error) {
            console.error('[DRECS] Ack error:', error);
        }
    }
    
    // Reset and go back to main
    resetForm();
    showScreen('main');
}

// ─────────────────────────────────────────────────────────────────
// REQUEST MORE HELP
// ─────────────────────────────────────────────────────────────────

function requestMoreHelp() {
    // Go back to main form, pre-fill with previous data
    showScreen('main');
    
    // Maybe show a different UI for follow-up?
    showError('Vui lòng gửi thêm thông tin chi tiết');
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

function getUrgencyText(level) {
    const levels = {
        1: '🟢 Thấp',
        2: '🟡 Trung bình',
        3: '🔴 Khẩn cấp'
    };
    return levels[level] || '--';
}

function getVehicleEmoji(type) {
    const vehicles = {
        'boat': '🚤',
        'helicopter': '🚁',
        'foot': '🚶',
        'truck': '🚚'
    };
    return vehicles[type] || '🚤';
}

function getVehicleName(type) {
    const vehicles = {
        'boat': 'Xuồng',
        'helicopter': 'Trực thăng',
        'foot': 'Đội bộ',
        'truck': 'Xe cứu hộ'
    };
    return vehicles[type] || 'Đội cứu hộ';
}

// ─────────────────────────────────────────────────────────────────
// LOADING OVERLAY
// ─────────────────────────────────────────────────────────────────

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// ─────────────────────────────────────────────────────────────────
// ERROR DISPLAY
// ─────────────────────────────────────────────────────────────────

function showError(message) {
    // Simple alert for now - could be a toast/modal
    alert(message);
}

// ─────────────────────────────────────────────────────────────────
// PROCESS QUEUE (on reconnect)
// ─────────────────────────────────────────────────────────────────

async function processQueue() {
    if (!AppState.isOnline) return;
    
    const queue = getRequestQueue();
    if (queue.length === 0) return;
    
    console.log(`[DRECS] Processing ${queue.length} queued requests...`);
    
    for (const item of queue) {
        try {
            const response = await sendRescueRequest(item.data);
            if (response.success) {
                removeFromQueue(item.id);
                console.log(`[DRECS] Queued request ${item.id} sent successfully`);
            }
        } catch (error) {
            console.error(`[DRECS] Failed to send queued request ${item.id}:`, error);
        }
    }
}

console.log('[DRECS] app.js loaded');
