// ═══════════════════════════════════════════════════════════════
//                    DRECS - API Client
// ═══════════════════════════════════════════════════════════════

/**
 * Handles HTTP communication with drone edge server
 */

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────

const API_CONFIG = {
    // Base URL - will be relative when served from drone
    baseUrl: '',
    
    // Endpoints
    endpoints: {
        rescueRequest: '/api/rescue-request',
        notifications: '/api/notifications',
        acknowledge: '/api/acknowledge'
    },
    
    // Timeout in ms
    timeout: 10000
};

// ─────────────────────────────────────────────────────────────────
// SEND RESCUE REQUEST
// ─────────────────────────────────────────────────────────────────

async function sendRescueRequest(data) {
    const url = API_CONFIG.baseUrl + API_CONFIG.endpoints.rescueRequest;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('[DRECS] API error:', error);
        
        // Check if it's a network error (offline)
        if (error.name === 'AbortError' || error.name === 'TypeError') {
            return {
                success: false,
                offline: true,
                message: 'Không có kết nối. Yêu cầu sẽ được gửi khi có mạng.'
            };
        }
        
        return {
            success: false,
            offline: false,
            message: error.message || 'Có lỗi xảy ra'
        };
    }
}

// ─────────────────────────────────────────────────────────────────
// CHECK FOR NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────

async function checkForNotification(requestId) {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.notifications}/${requestId}`;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            if (response.status === 404) {
                // No notification yet
                return { hasNotification: false };
            }
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const result = await response.json();
        return {
            hasNotification: true,
            notification: result
        };
        
    } catch (error) {
        console.error('[DRECS] Check notification error:', error);
        return { hasNotification: false, error: error.message };
    }
}

// ─────────────────────────────────────────────────────────────────
// SEND ACKNOWLEDGMENT
// ─────────────────────────────────────────────────────────────────

async function sendAcknowledgment(requestId) {
    const url = API_CONFIG.baseUrl + API_CONFIG.endpoints.acknowledge;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request_id: requestId,
                acknowledged_at: new Date().toISOString()
            })
        });
        
        return response.ok;
        
    } catch (error) {
        console.error('[DRECS] Ack error:', error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────
// MOCK API (for testing without drone)
// ─────────────────────────────────────────────────────────────────

// Enable mock mode for testing
const MOCK_MODE = true;

if (MOCK_MODE) {
    console.log('[DRECS] Running in MOCK mode');
    
    // Override sendRescueRequest
    window._originalSendRescueRequest = sendRescueRequest;
    window.sendRescueRequest = async function(data) {
        console.log('[DRECS MOCK] Sending request:', data);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate mock response
        const requestId = generateRequestId();
        
        return {
            success: true,
            request_id: requestId,
            message: 'Đã nhận yêu cầu (MOCK)'
        };
    };
    
    // Override checkForNotification
    window._originalCheckForNotification = checkForNotification;
    window.checkForNotification = async function(requestId) {
        console.log('[DRECS MOCK] Checking notification for:', requestId);
        
        // Simulate getting a response after some time
        const now = Date.now();
        const mockResponseTime = 30000; // 30 seconds
        
        // Check if enough time has passed (stored in sessionStorage)
        const requestTime = sessionStorage.getItem(`mock_request_${requestId}`);
        
        if (!requestTime) {
            sessionStorage.setItem(`mock_request_${requestId}`, now.toString());
            return { hasNotification: false };
        }
        
        if (now - parseInt(requestTime) > mockResponseTime) {
            return {
                hasNotification: true,
                notification: {
                    request_id: requestId,
                    type: 'eta',
                    eta_minutes: 45,
                    team_type: 'boat',
                    direction: 'Từ phía Nam',
                    message: 'Đội cứu hộ đang trên đường đến',
                    instructions: [
                        'Di chuyển lên vị trí cao nhất có thể',
                        'Nếu có áo phao, hãy mặc sẵn',
                        'Giữ điện thoại còn pin',
                        'Vẫy tay khi thấy xuồng cứu hộ'
                    ]
                }
            };
        }
        
        return { hasNotification: false };
    };
}

console.log('[DRECS] api.js loaded');
