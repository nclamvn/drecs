// ═══════════════════════════════════════════════════════════════
//                    DRECS - Screen Management
// ═══════════════════════════════════════════════════════════════

/**
 * Handles screen transitions and navigation
 */

// ─────────────────────────────────────────────────────────────────
// SHOW SCREEN
// ─────────────────────────────────────────────────────────────────

function showScreen(screenId) {
    console.log(`[DRECS] Showing screen: ${screenId}`);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Update URL without reload (for back button support)
        const url = new URL(window.location);
        if (screenId === 'main') {
            url.searchParams.delete('screen');
        } else {
            url.searchParams.set('screen', screenId);
        }
        history.pushState({ screen: screenId }, '', url);
    } else {
        console.error(`[DRECS] Screen not found: ${screenId}`);
    }
}

// ─────────────────────────────────────────────────────────────────
// HANDLE BROWSER BACK BUTTON
// ─────────────────────────────────────────────────────────────────

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.screen) {
        showScreen(event.state.screen);
    } else {
        showScreen('main');
    }
});

// ─────────────────────────────────────────────────────────────────
// PREVENT ACCIDENTAL NAVIGATION
// ─────────────────────────────────────────────────────────────────

// Warn before leaving during form fill
window.addEventListener('beforeunload', (event) => {
    if (AppState.currentScreen === 'main' && hasFormData()) {
        event.preventDefault();
        event.returnValue = 'Bạn có dữ liệu chưa gửi. Chắc chắn muốn rời trang?';
        return event.returnValue;
    }
});

// ─────────────────────────────────────────────────────────────────
// CHECK IF FORM HAS DATA
// ─────────────────────────────────────────────────────────────────

function hasFormData() {
    const people = document.getElementById('input-people').value;
    const phone = document.getElementById('input-phone').value;
    
    return !!(people || phone);
}

console.log('[DRECS] screens.js loaded');
