// ═══════════════════════════════════════════════════════════════
//                    DRECS - GPS Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Handles GPS location detection and management
 */

// ─────────────────────────────────────────────────────────────────
// INITIALIZE GPS
// ─────────────────────────────────────────────────────────────────

function initGPS() {
    console.log('[DRECS] Initializing GPS...');
    
    // Check for geolocation support
    if (!('geolocation' in navigator)) {
        showGPSError('Trình duyệt không hỗ trợ GPS');
        return;
    }
    
    // Get initial position
    refreshGPS();
}

// ─────────────────────────────────────────────────────────────────
// GET CURRENT POSITION
// ─────────────────────────────────────────────────────────────────

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // Cache for 1 minute
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const result = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                resolve(result);
            },
            (error) => {
                reject(error);
            },
            options
        );
    });
}

// ─────────────────────────────────────────────────────────────────
// REFRESH GPS
// ─────────────────────────────────────────────────────────────────

async function refreshGPS() {
    const locationInput = document.getElementById('input-location');
    const gpsButton = document.getElementById('btn-gps');
    const gpsError = document.getElementById('gps-error');
    
    // Show loading state
    locationInput.value = 'Đang lấy vị trí...';
    gpsButton.disabled = true;
    gpsError.classList.add('hidden');
    
    try {
        const position = await getCurrentPosition();
        
        // Update app state
        AppState.gpsPosition = position;
        
        // Update UI
        document.getElementById('input-lat').value = position.lat;
        document.getElementById('input-lng').value = position.lng;
        locationInput.value = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
        
        // Show accuracy if poor
        if (position.accuracy > 100) {
            locationInput.value += ` (±${Math.round(position.accuracy)}m)`;
        }
        
        console.log('[DRECS] GPS acquired:', position);
        
    } catch (error) {
        console.error('[DRECS] GPS error:', error);
        
        // Show error
        locationInput.value = 'Không lấy được vị trí';
        showGPSError(getGPSErrorMessage(error));
        
        // Allow manual input
        locationInput.removeAttribute('readonly');
        locationInput.placeholder = 'Nhập tọa độ: vd: 16.4637, 107.5909';
        
    } finally {
        gpsButton.disabled = false;
    }
}

// ─────────────────────────────────────────────────────────────────
// GPS ERROR HANDLING
// ─────────────────────────────────────────────────────────────────

function getGPSErrorMessage(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt';
        case error.POSITION_UNAVAILABLE:
            return 'Không thể xác định vị trí. Thử lại hoặc nhập tay.';
        case error.TIMEOUT:
            return 'Hết thời gian chờ. Thử lại.';
        default:
            return 'Lỗi không xác định. Thử lại hoặc nhập tay.';
    }
}

function showGPSError(message) {
    const gpsError = document.getElementById('gps-error');
    if (gpsError) {
        gpsError.textContent = message;
        gpsError.classList.remove('hidden');
    }
}

// ─────────────────────────────────────────────────────────────────
// WATCH POSITION (for real-time updates)
// ─────────────────────────────────────────────────────────────────

let watchId = null;

function startWatchingPosition() {
    if (!('geolocation' in navigator)) return;
    
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
    
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            AppState.gpsPosition = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
        },
        (error) => {
            console.warn('[DRECS] Watch position error:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 10000
        }
    );
}

function stopWatchingPosition() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// ─────────────────────────────────────────────────────────────────
// PARSE MANUAL COORDINATES
// ─────────────────────────────────────────────────────────────────

function parseManualCoordinates(input) {
    // Try to parse "lat, lng" format
    const parts = input.split(/[,\s]+/);
    
    if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        // Validate Vietnam coordinates roughly
        if (lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110) {
            return { lat, lng };
        }
    }
    
    return null;
}

// Handle manual input
document.addEventListener('DOMContentLoaded', () => {
    const locationInput = document.getElementById('input-location');
    
    if (locationInput) {
        locationInput.addEventListener('change', (e) => {
            if (!locationInput.hasAttribute('readonly')) {
                const coords = parseManualCoordinates(e.target.value);
                
                if (coords) {
                    document.getElementById('input-lat').value = coords.lat;
                    document.getElementById('input-lng').value = coords.lng;
                    AppState.gpsPosition = coords;
                    
                    // Clear error
                    document.getElementById('gps-error').classList.add('hidden');
                } else {
                    showGPSError('Tọa độ không hợp lệ. VD: 16.4637, 107.5909');
                }
            }
        });
    }
});

console.log('[DRECS] gps.js loaded');
