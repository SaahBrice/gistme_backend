// --- 1. STATE MANAGEMENT (ALPINE) ---
function app() {
    return {
        // Simple init, no loader
        initApp() {
            // App is ready immediately
            console.log('[Gist4U] App initialized');
        }
    }
}

// --- 2. SMOOTH SCROLL (LENIS) + NAV FIX ---
// Only initialize Lenis if on landing page (has nav-links)
const navLinks = document.querySelectorAll('.nav-link');
if (navLinks.length > 0) {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Handle Anchor Links with Lenis
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                lenis.scrollTo(targetId, {
                    offset: 0,
                    immediate: false
                });
            }
        });
    });
}

// --- 3. ANIMATIONS (GSAP) - Only on landing page ---
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Marquee Animation
    const marqueeSection = document.querySelector("#marquee-section");
    const marqueeTrack = document.querySelector(".marquee-track");

    if (marqueeSection && marqueeTrack) {
        gsap.to(marqueeTrack, {
            x: () => -(marqueeTrack.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                trigger: marqueeSection,
                pin: true,
                start: "center center",
                scrub: 1,
                end: () => "+=" + Math.max(window.innerWidth, marqueeTrack.scrollWidth - window.innerWidth),
                invalidateOnRefresh: true
            }
        });
    }

    // Horizontal Scroll
    let hScrollWrapper = document.querySelector(".h-scroll-wrapper");
    let hContainer = document.querySelector(".h-scroll-container");

    if (hScrollWrapper && hContainer) {
        let panels = gsap.utils.toArray(".h-panel");
        gsap.to(panels, {
            xPercent: -100 * (panels.length - 1),
            ease: "none",
            scrollTrigger: {
                trigger: ".h-scroll-wrapper",
                pin: true,
                scrub: 1,
                end: () => "+=" + hContainer.offsetWidth
            }
        });
    }
}

// --- 4. TEXT SPLITTER (Hero only) ---
document.querySelectorAll('.hero-text').forEach(el => {
    const text = el.innerText;
    el.innerHTML = text.split('').map(char => `<span class="char inline-block">${char === ' ' ? '&nbsp;' : char}</span>`).join('');
});

// --- 5. LIQUID VOICE VISUALIZER (The "Liquid Blob" Feature) ---
const liquidCanvas = document.getElementById('liquid-canvas');

if (liquidCanvas) {
    const lCtx = liquidCanvas.getContext('2d');
    let lW, lH;
    let time = 0;

    function initLiquid() {
        lW = liquidCanvas.width = liquidCanvas.offsetWidth;
        lH = liquidCanvas.height = liquidCanvas.offsetHeight;
    }

    // Handle resizing of the inner canvas
    const lObserver = new ResizeObserver(() => initLiquid());
    lObserver.observe(liquidCanvas.parentElement);

    function drawBlob() {
        lCtx.clearRect(0, 0, lW, lH);

        // Black Background
        lCtx.fillStyle = '#080808';
        lCtx.fillRect(0, 0, lW, lH);

        const centerX = lW / 2;
        const centerY = lH / 2;
        const radius = lW * 0.35;

        lCtx.beginPath();

        // Generate Organic Shape using Sine summation
        for (let i = 0; i <= 360; i += 2) {
            const angle = (i * Math.PI) / 180;
            const w1 = Math.sin(angle * 3 + time * 2) * 15;
            const w2 = Math.cos(angle * 5 - time * 3) * 10;
            const w3 = Math.sin(angle * 10 + time * 5) * 5;
            const r = radius + w1 + w2 + w3;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (i === 0) {
                lCtx.moveTo(x, y);
            } else {
                lCtx.lineTo(x, y);
            }
        }

        lCtx.closePath();
        lCtx.fillStyle = '#FFDE00';
        lCtx.fill();
        lCtx.shadowBlur = 20;
        lCtx.shadowColor = '#FFDE00';

        time += 0.03;
        requestAnimationFrame(drawBlob);
    }

    initLiquid();
    drawBlob();
}
