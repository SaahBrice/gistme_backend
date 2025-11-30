// PWA Install Prompt Handler
let deferredPrompt;
let installButton = null;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] beforeinstallprompt event fired');

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later
    deferredPrompt = e;

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

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
        console.log('[PWA] User previously dismissed install prompt');
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

// Install PWA
async function installPWA() {
    if (!deferredPrompt) {
        console.log('[PWA] Install prompt not available');
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to the install prompt: ${outcome}`);

    // Clear the prompt
    deferredPrompt = null;

    // Remove UI
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.remove();
    }
}

// Dismiss install prompt
function dismissInstallPrompt() {
    localStorage.setItem('pwa_install_dismissed', 'true');

    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.remove();
    }
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed successfully');

    // Clear any existing prompts
    deferredPrompt = null;
    const prompt = document.getElementById('pwa-install-prompt');
    if (prompt) {
        prompt.remove();
    }
});

// Check if already installed (display mode)
window.addEventListener('load', () => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        console.log('[PWA] App is running in standalone mode');
    }
});
