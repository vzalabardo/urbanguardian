/* =============================================
   URBAN GUARDIAN — app.js
   SPA Logic · Navegación · Interacciones
   ============================================= */

// ---- Cached DOM Elements ----
const mobileFrame   = document.getElementById('mobile-frame');
const views         = document.querySelectorAll('.view');
const navItems      = document.querySelectorAll('#bottom-nav .nav-item');

// Mapa
const btnSafeRoute     = document.getElementById('btn-safe-route');
const btnFastRoute     = document.getElementById('btn-fast-route');
const safeRouteOverlay = document.getElementById('safe-route-overlay');
const btnRefugio       = document.getElementById('btn-refugio');
const destinationInput = document.getElementById('destination-input');

// Modales
const reportModal      = document.getElementById('report-modal');
const shelterModal     = document.getElementById('shelter-modal');
const sosSettingsModal = document.getElementById('sos-settings-modal');
const pinModal         = document.getElementById('pin-modal');

// SOS
const sosBtn        = document.getElementById('sos-btn');
const sosProgress   = document.getElementById('sos-progress');
const sosScreen     = document.getElementById('sos-active-screen');
const btnCancelSOS  = document.getElementById('btn-cancel-sos');

// Toast
const toastEl   = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

// XP bar
const xpFill = document.getElementById('xp-fill');


/* ===========================================
   1. SPA NAVIGATION
   =========================================== */

/**
 * Cambia la vista activa. Si view === 'reportar' abre el modal en lugar de una vista.
 * @param {string} viewName — 'mapa' | 'reportar' | 'red' | 'perfil'
 */
function navigateTo(viewName) {
    // Si es "reportar", abrir modal y no cambiar de vista
    if (viewName === 'reportar') {
        openModal(reportModal);
        // highlight nav item briefly
        setActiveNav(viewName);
        return;
    }

    // Ocultar todas las vistas, mostrar la seleccionada
    views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + viewName);
    if (target) {
        target.classList.add('active');
    }

    setActiveNav(viewName);

    // Animate XP fill when entering profile
    if (viewName === 'perfil' && xpFill) {
        setTimeout(() => { xpFill.style.width = '65%'; }, 100);
    }
}

/** Marca el nav-item correspondiente como activo */
function setActiveNav(viewName) {
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
}

// Bind nav clicks
navItems.forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.view));
});


/* ===========================================
   2. MODAL HELPERS
   =========================================== */

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
    // If we closed the report modal, re-highlight the real active view
    if (modal === reportModal) {
        const activeView = document.querySelector('.view.active');
        if (activeView) {
            setActiveNav(activeView.id.replace('view-', ''));
        }
    }
}

// Close buttons (generic — uses modal-close class inside each overlay)
document.getElementById('close-report-modal').addEventListener('click', () => closeModal(reportModal));
document.getElementById('close-shelter-modal').addEventListener('click', () => closeModal(shelterModal));
document.getElementById('close-sos-settings').addEventListener('click', () => closeModal(sosSettingsModal));

// Close modals on overlay click (outside content)
[reportModal, shelterModal, sosSettingsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
});


/* ===========================================
   3. MAPA — RUTA SEGURA CON SVG ANIMADO
   =========================================== */

let safeRouteActive = false;
const routePath = document.getElementById('route-path');

function calculatePathLength() {
    if (routePath) {
        const length = routePath.getTotalLength();
        routePath.style.strokeDasharray = length;
        routePath.style.strokeDashoffset = length;
    }
}

btnSafeRoute.addEventListener('click', () => {
    btnSafeRoute.classList.add('active');
    btnFastRoute.classList.remove('active');
    btnSafeRoute.style.backgroundColor = 'var(--safe)';
    btnSafeRoute.style.color = '#000';
    btnFastRoute.style.backgroundColor = 'var(--bg-input)';
    btnFastRoute.style.color = 'var(--text-muted)';

    // Show safe route overlay
    if (!safeRouteActive) {
        safeRouteActive = true;
        // Calculate and set path length for animation
        calculatePathLength();
        // Trigger reflow
        if (routePath) routePath.getBoundingClientRect();
        // Show overlay
        safeRouteOverlay.classList.add('visible');
        showToast('Calculando ruta segura... 🛡️');
        
        // Update route stats based on destination
        updateRouteInfo();
    }
});

btnFastRoute.addEventListener('click', () => {
    btnFastRoute.classList.add('active');
    btnSafeRoute.classList.remove('active');
    btnFastRoute.style.backgroundColor = 'var(--primary)';
    btnFastRoute.style.color = '#fff';
    btnSafeRoute.style.backgroundColor = 'rgba(46,204,113,0.1)';
    btnSafeRoute.style.color = 'var(--safe)';

    // Hide safe route overlay
    safeRouteActive = false;
    safeRouteOverlay.classList.remove('visible');
    showToast('Ruta rápida seleccionada ⚡');
});

// Initialize path length on load
document.addEventListener('DOMContentLoaded', calculatePathLength);

/** Actualiza la información de navegación según el destino */
function updateRouteInfo() {
    const destination = document.getElementById('destination-input').value || 'Destino';
    // In a real app, this would calculate actual route data
    console.log('Ruta calculada hacia:', destination);
}


/* ===========================================
   4. MAPA — REFUGIO CERCANO (Bottom Sheet)
   =========================================== */

btnRefugio.addEventListener('click', () => {
    openModal(shelterModal);
});

/** Simula la navegación al safe spot seleccionado */
function navigateToSpot(btn) {
    const name = btn.closest('.safe-spot-item').querySelector('h4').textContent;
    btn.textContent = '✓';
    btn.style.background = 'var(--safe)';
    setTimeout(() => {
        closeModal(shelterModal);
        showToast('Navegando a ' + name);
        // Reset button after modal closes
        setTimeout(() => {
            btn.textContent = 'Ir';
            btn.style.background = 'var(--primary)';
        }, 400);
    }, 600);
}


/* ===========================================
   5. REPORTE DE MICRO-INCIDENTES
   =========================================== */

function sendReport(el) {
    const originalHtml = el.innerHTML;
    el.innerHTML = '<i class="fa-solid fa-check" style="color:var(--safe);"></i><br>¡Reportado!';
    el.style.borderColor = 'var(--safe)';
    setTimeout(() => {
        closeModal(reportModal);
        showToast('Micro-incidente reportado ✓');
        setTimeout(() => {
            el.innerHTML = originalHtml;
            el.style.borderColor = 'transparent';
        }, 300);
    }, 800);
}


/* ===========================================
   6. RED — TABS
   =========================================== */

const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels  = document.querySelectorAll('.tab-panel');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Deactivate all
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        // Activate clicked
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});


/* ===========================================
   7. RED — TOGGLES (compartir ubicación)
   =========================================== */

document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('on');
        const isOn = toggle.classList.contains('on');
        const label = toggle.closest('.contact-card, .setting-item')?.querySelector('.contact-info p, .setting-text p');
        if (toggle.dataset.toggle && toggle.dataset.toggle.startsWith('contact')) {
            if (label) {
                label.textContent = isOn ? 'Compartiendo ubicación en vivo' : 'Ubicación no compartida';
            }
            showToast(isOn ? 'Ubicación compartida activada' : 'Ubicación desactivada');
        }
    });
});


/* ===========================================
   8. RED — SOLICITAR GUARDIÁN
   =========================================== */

function requestGuardian(btn) {
    if (btn.disabled) return;
    const name = btn.closest('.guardian-card').querySelector('h4').textContent;
    btn.textContent = 'Solicitado ✓';
    btn.style.background = 'var(--safe)';
    btn.disabled = true;
    showToast('Solicitud enviada a ' + name);
    // Reset after 3 seconds
    setTimeout(() => {
        btn.textContent = 'Solicitar';
        btn.style.background = 'var(--primary)';
        btn.disabled = false;
    }, 3000);
}


/* ===========================================
   9. PERFIL — AJUSTES SOS
   =========================================== */

document.getElementById('btn-sos-settings').addEventListener('click', () => {
    openModal(sosSettingsModal);
});


/* ===========================================
   10. SOS — LONG PRESS
   =========================================== */

let pressTimer;
let rotationValue = 0;
let animationInterval;

function startSOSPress() {
    sosBtn.style.transform = 'scale(0.9)';
    sosProgress.style.opacity = '1';

    // Animación de anillo de carga
    animationInterval = setInterval(() => {
        rotationValue += 10;
        sosProgress.style.transform = 'rotate(' + rotationValue + 'deg)';
    }, 30);

    // 1.5 segundos para activar SOS
    pressTimer = setTimeout(() => {
        clearInterval(animationInterval);
        activateSOS();
    }, 1500);
}

function endSOSPress() {
    clearTimeout(pressTimer);
    clearInterval(animationInterval);
    sosBtn.style.transform = 'scale(1)';
    sosProgress.style.opacity = '0';
    rotationValue = 0;
}

function activateSOS() {
    endSOSPress();
    sosScreen.classList.add('active');
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

// Mouse events
sosBtn.addEventListener('mousedown', startSOSPress);
sosBtn.addEventListener('mouseup', endSOSPress);
sosBtn.addEventListener('mouseleave', endSOSPress);

// Touch events
sosBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startSOSPress(); });
sosBtn.addEventListener('touchend', endSOSPress);


/* ===========================================
   11. SOS — CANCEL WITH PIN
   =========================================== */

let pinBuffer = '';
const REAL_PIN = '5678';  // PIN real (cancela de verdad)
const FAKE_PIN = '1234';  // PIN falso (simula cancelar)

btnCancelSOS.addEventListener('click', () => {
    pinModal.classList.add('active');
    pinBuffer = '';
    updatePinDots();
});

function enterPin(digit) {
    if (pinBuffer.length >= 4) return;
    pinBuffer += digit;
    updatePinDots();

    if (pinBuffer.length === 4) {
        setTimeout(() => validatePin(), 200);
    }
}

function deletePin() {
    pinBuffer = pinBuffer.slice(0, -1);
    updatePinDots();
}

function updatePinDots() {
    for (let i = 0; i < 4; i++) {
        document.getElementById('dot-' + i).classList.toggle('filled', i < pinBuffer.length);
    }
}

function validatePin() {
    if (pinBuffer === REAL_PIN) {
        // Real cancel
        pinModal.classList.remove('active');
        sosScreen.classList.remove('active');
        pinBuffer = '';
        updatePinDots();
        showToast('SOS desactivado correctamente');
    } else if (pinBuffer === FAKE_PIN) {
        // Fake cancel — looks like it cancels but doesn't
        pinModal.classList.remove('active');
        sosScreen.classList.remove('active');
        pinBuffer = '';
        updatePinDots();
        // In a real app, recording + GPS would continue in background
        showToast('SOS desactivado (modo falso activo)');
    } else {
        // Wrong PIN — shake and reset
        const pinBox = document.querySelector('.pin-box');
        pinBox.style.animation = 'none';
        pinBox.offsetHeight; // trigger reflow
        pinBox.style.animation = 'shake 0.4s ease';
        pinBuffer = '';
        setTimeout(() => updatePinDots(), 400);
    }
}

// Add shake keyframes dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-10px); }
    40% { transform: translateX(10px); }
    60% { transform: translateX(-8px); }
    80% { transform: translateX(8px); }
}`;
document.head.appendChild(shakeStyle);


/* ===========================================
   12. TOAST NOTIFICATION
   =========================================== */

let toastTimeout;

function showToast(message) {
    clearTimeout(toastTimeout);
    toastText.textContent = message;
    toastEl.classList.add('show');
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2500);
}


/* ===========================================
   13. INIT — Default state
   =========================================== */

// Start XP bar at 0 and animate
if (xpFill) xpFill.style.width = '0%';

// Log ready
console.log('Urban Guardian SPA initialized ✓');
