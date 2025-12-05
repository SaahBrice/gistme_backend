// PWA Install Prompt Handler
let deferredPrompt;
let installButton = null;

// Constants
const DISMISS_DURATION_DAYS = 7; // Reset dismissed state after 7 days

// Check if app is already installed
function isAppInstalled() {
    // Check display mode (standalone = installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    // iOS Safari standalone mode
    if (window.navigator.standalone === true) return true;
    // Check our localStorage flag
    if (localStorage.getItem('pwa_installed') === 'true') return true;
    return false;
}

// Check if dismissal has expired (7 days)
function shouldShowPromptAgain() {
    const dismissedAt = localStorage.getItem('pwa_install_dismissed_at');
    if (!dismissedAt) return true; // Never dismissed

    const dismissedDate = new Date(parseInt(dismissedAt));
    const now = new Date();
    const daysPassed = (now - dismissedDate) / (1000 * 60 * 60 * 24);

    if (daysPassed >= DISMISS_DURATION_DAYS) {
        // Clear the old dismissal
        localStorage.removeItem('pwa_install_dismissed');
        localStorage.removeItem('pwa_install_dismissed_at');
        console.log('[PWA] Dismiss period expired, will show prompt again');
        return true;
    }

    console.log(`[PWA] User dismissed ${Math.floor(daysPassed)} days ago, waiting ${DISMISS_DURATION_DAYS - Math.floor(daysPassed)} more days`);
    return false;
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] beforeinstallprompt event fired');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Update any install buttons visibility
    updateInstallButtonVisibility();

    // Show the install prompt after a delay
    setTimeout(() => {
        showInstallPrompt();
    }, 10000); // Show after 10 seconds
});

// Show custom install prompt
function showInstallPrompt() {
    if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available');
        return;
    }

    // Don't show if already installed
    if (isAppInstalled()) {
        console.log('[PWA] App already installed, not showing prompt');
        return;
    }

    // Check if user dismissed before (with 7-day reset)
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed && !shouldShowPromptAgain()) {
        return;
    }

    // Create install prompt UI
    const promptHTML = `
    <div id="pwa-install-prompt" class="fixed bottom-4 left-4 z-50 max-w-sm w-full bg-brand-dark border border-brand-yellow/20 rounded-lg shadow-2xl p-4 backdrop-blur-md animate-fade-in">
        <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
                <div class="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a 3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </div>
            </div>
            <div class="flex-1">
                <h3 class="text-sm font-medium text-white">Install Gist4U</h3>
                <p class="mt-1 text-xs text-gray-400">Install our app for quick access and offline reading. Get the full experience!</p>
                <div class="mt-3 flex gap-2">
                    <button id="pwa-install-btn" class="text-xs bg-brand-yellow text-brand-black px-3 py-1.5 rounded font-medium hover:bg-yellow-400 transition-colors">
                        Install Now
                    </button>
                    <button id="pwa-dismiss-btn" class="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors">
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', promptHTML);

    // Add event listeners
    document.getElementById('pwa-install-btn').addEventListener('click', installPWA);
    document.getElementById('pwa-dismiss-btn').addEventListener('click', dismissInstallPrompt);
}

// Install PWA - exposed globally for button use
async function installPWA() {
    if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available');
        return false;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to the install prompt: ${outcome}`);

    if (outcome === 'accepted') {
        // Mark as installed
        localStorage.setItem('pwa_installed', 'true');
        updateInstallButtonVisibility();
    }

    // Clear the prompt
    deferredPrompt = null;

    // Remove UI
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.remove();
    }

    return outcome === 'accepted';
}

// Expose installPWA globally for button clicks
window.installPWA = installPWA;

// Check if PWA can be installed (for button visibility)
window.canInstallPWA = function () {
    return deferredPrompt !== null && !isAppInstalled();
};

// Update visibility of any install buttons on the page
function updateInstallButtonVisibility() {
    const canInstall = window.canInstallPWA();
    // Dispatch custom event for Alpine.js components to react
    window.dispatchEvent(new CustomEvent('pwa-install-status-changed', {
        detail: { canInstall }
    }));
}

// Dismiss install prompt
function dismissInstallPrompt() {
    localStorage.setItem('pwa_install_dismissed', 'true');
    localStorage.setItem('pwa_install_dismissed_at', Date.now().toString());

    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.remove();
    }
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed successfully');

    // Mark as installed
    localStorage.setItem('pwa_installed', 'true');

    // Clear dismissal since they installed
    localStorage.removeItem('pwa_install_dismissed');
    localStorage.removeItem('pwa_install_dismissed_at');

    // Clear any existing prompts
    deferredPrompt = null;
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.remove();
    }

    // Update button visibility
    updateInstallButtonVisibility();
});

// Check if already installed (display mode) on load
window.addEventListener('load', () => {
    if (isAppInstalled()) {
        console.log('[PWA] App is already installed');
    }

    // Initial visibility update
    setTimeout(updateInstallButtonVisibility, 100);
});
