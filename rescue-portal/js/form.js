// ═══════════════════════════════════════════════════════════════
//                    DRECS - Form Handling
// ═══════════════════════════════════════════════════════════════

/**
 * Handles form interactions, validation, and data collection
 */

// ─────────────────────────────────────────────────────────────────
// INITIALIZE FORM
// ─────────────────────────────────────────────────────────────────

function initForm() {
    console.log('[DRECS] Initializing form...');
    
    // Setup selection buttons
    setupSelectionButtons();
    
    // Setup phone input formatting
    setupPhoneInput();
    
    // Set default values
    setDefaultValues();
}

// ─────────────────────────────────────────────────────────────────
// SELECTION BUTTONS
// ─────────────────────────────────────────────────────────────────

function setupSelectionButtons() {
    const buttons = document.querySelectorAll('.select-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const field = button.dataset.field;
            const value = button.dataset.value;
            
            // Remove selected from siblings
            const siblings = document.querySelectorAll(`.select-btn[data-field="${field}"]`);
            siblings.forEach(sib => sib.classList.remove('selected'));
            
            // Add selected to clicked
            button.classList.add('selected');
            
            // Update hidden input
            const input = document.getElementById(`input-${field}`);
            if (input) {
                input.value = value;
            }
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        });
    });
}

// ─────────────────────────────────────────────────────────────────
// PHONE INPUT
// ─────────────────────────────────────────────────────────────────

function setupPhoneInput() {
    const phoneInput = document.getElementById('input-phone');
    
    if (phoneInput) {
        // Only allow numbers
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        // Limit length
        phoneInput.addEventListener('keypress', (e) => {
            if (e.target.value.length >= 11) {
                e.preventDefault();
            }
        });
    }
}

// ─────────────────────────────────────────────────────────────────
// DEFAULT VALUES
// ─────────────────────────────────────────────────────────────────

function setDefaultValues() {
    // Urgency defaults to 3 (urgent)
    document.getElementById('input-urgency').value = '3';
    
    // Injured defaults to false
    document.getElementById('input-injured').value = 'false';
    
    // Food defaults to true
    document.getElementById('input-food_available').value = 'true';
}

// ─────────────────────────────────────────────────────────────────
// GATHER FORM DATA
// ─────────────────────────────────────────────────────────────────

function gatherFormData() {
    return {
        lat: parseFloat(document.getElementById('input-lat').value) || null,
        lng: parseFloat(document.getElementById('input-lng').value) || null,
        people: parseInt(document.getElementById('input-people').value) || 1,
        urgency: parseInt(document.getElementById('input-urgency').value) || 3,
        injured: document.getElementById('input-injured').value === 'true',
        water_level: document.getElementById('input-water_level').value || null,
        food_available: document.getElementById('input-food_available').value === 'true',
        phone: document.getElementById('input-phone').value || null,
        timestamp: new Date().toISOString(),
        is_panic: false
    };
}

// ─────────────────────────────────────────────────────────────────
// VALIDATE FORM
// ─────────────────────────────────────────────────────────────────

function validateForm(data) {
    const errors = [];
    
    // GPS is recommended but not required (panic button works without it)
    if (!data.lat || !data.lng) {
        // Just warn, don't block
        console.warn('[DRECS] No GPS coordinates');
    }
    
    // People count is required
    if (!data.people || data.people < 1) {
        errors.push('Vui lòng chọn số người cần cứu');
    }
    
    // Phone validation (optional but if provided, must be valid)
    if (data.phone && !/^0[0-9]{9,10}$/.test(data.phone)) {
        errors.push('Số điện thoại không hợp lệ');
    }
    
    if (errors.length > 0) {
        showError(errors.join('\n'));
        return false;
    }
    
    return true;
}

// ─────────────────────────────────────────────────────────────────
// RESET FORM
// ─────────────────────────────────────────────────────────────────

function resetForm() {
    // Reset hidden inputs
    document.getElementById('input-people').value = '';
    document.getElementById('input-water_level').value = '';
    document.getElementById('input-phone').value = '';
    
    // Reset to defaults
    setDefaultValues();
    
    // Reset selection buttons
    document.querySelectorAll('.select-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Re-select defaults
    document.querySelector('[data-field="urgency"][data-value="3"]')?.classList.add('selected');
    document.querySelector('[data-field="injured"][data-value="false"]')?.classList.add('selected');
    document.querySelector('[data-field="food_available"][data-value="true"]')?.classList.add('selected');
    
    // Refresh GPS
    refreshGPS();
}

// ─────────────────────────────────────────────────────────────────
// PRE-FILL FORM (for follow-up requests)
// ─────────────────────────────────────────────────────────────────

function prefillForm(data) {
    if (data.lat && data.lng) {
        document.getElementById('input-lat').value = data.lat;
        document.getElementById('input-lng').value = data.lng;
        document.getElementById('input-location').value = `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`;
    }
    
    if (data.phone) {
        document.getElementById('input-phone').value = data.phone;
    }
    
    // Select appropriate buttons
    if (data.people) {
        const btn = document.querySelector(`[data-field="people"][data-value="${data.people}"]`);
        if (btn) btn.click();
    }
    
    if (data.urgency) {
        const btn = document.querySelector(`[data-field="urgency"][data-value="${data.urgency}"]`);
        if (btn) btn.click();
    }
}

console.log('[DRECS] form.js loaded');
