// PWA Update Manager - Detects and prompts for service worker updates
(function () {
    let newWorker;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.log('[Update Manager] Service workers not supported');
        return;
    }

    // Register service worker
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(registration => {
            console.log('[Update Manager] Service Worker registered');

            // Check for updates every hour
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000); // 1 hour

            // Listen for updates
            registration.addEventListener('updatefound', () => {
                newWorker = registration.installing;
                console.log('[Update Manager] New service worker found');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        console.log('[Update Manager] New version available!');
                        showUpdatePrompt();
                    }
                });
            });
        })
        .catch(err => {
            console.error('[Update Manager] Service Worker registration failed:', err);
        });

    // Show update notification UI
    function showUpdatePrompt() {
        // Check if user dismissed update before
        const dismissed = sessionStorage.getItem('update_dismissed');
        if (dismissed) {
            console.log('[Update Manager] User previously dismissed update');
            return;
        }

        // Create update prompt UI
        const promptHTML = `
        <div id="pwa-update-prompt" class="fixed top-4 right-4 z-50 max-w-sm w-full bg-brand-dark border border-brand-yellow/20 rounded-lg shadow-2xl p-4 backdrop-blur-md animate-fade-in">
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                </div>
                <div class="flex-1">
                    <h3 class="text-sm font-medium text-white">Update Available</h3>
                    <p class="mt-1 text-xs text-gray-400">A new version of Gist4U is available. Update now for the latest features!</p>
                    <div class="mt-3 flex gap-2">
                        <button id="update-now-btn" class="text-xs bg-brand-yellow text-brand-black px-3 py-1.5 rounded font-medium hover:bg-yellow-400 transition-colors">
                            Update Now
                        </button>
                        <button id="update-later-btn" class="text-xs text-gray-400 hover:text-white px-3 py-1.5 transition-colors">
                            Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', promptHTML);

        // Add event listeners
        document.getElementById('update-now-btn').addEventListener('click', updateNow);
        document.getElementById('update-later-btn').addEventListener('click', dismissUpdate);
    }

    // Update now - skip waiting and reload
    function updateNow() {
        if (newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
        }

        // Remove UI
        const prompt = document.getElementById('pwa-update-prompt');
        if (prompt) {
            prompt.remove();
        }

        // Reload page when new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    // Dismiss update
    function dismissUpdate() {
        sessionStorage.setItem('update_dismissed', 'true');

        const prompt = document.getElementById('pwa-update-prompt');
        if (prompt) {
            prompt.remove();
        }
    }

    console.log('[Update Manager] Initialized');
})();
