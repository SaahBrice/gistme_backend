// --- 1. STATE MANAGEMENT (ALPINE) ---
function app() {
    return {
        loadPercent: 0,

        initApp() {
            // Preloader Sequence
            let interval = setInterval(() => {
                this.loadPercent += Math.floor(Math.random() * 5) + 1;
                if (this.loadPercent >= 100) {
                    this.loadPercent = 100;
                    clearInterval(interval);
                    this.finishLoad();
                }
                // Update Progress Bar Width
                const loadBar = document.getElementById('loadBar');
                if (loadBar) loadBar.style.width = this.loadPercent + '%';
            }, 50);
        },

        finishLoad() {
            const loader = document.getElementById('loader');
            const heroTexts = document.querySelectorAll('.hero-text');
            const revealOpacity = document.querySelectorAll('.reveal-opacity');

            if (loader) {
                const tl = gsap.timeline();
                tl.to('#loader', { yPercent: -100, duration: 1, ease: 'power4.inOut', delay: 0.2 });

                if (heroTexts.length > 0) {
                    tl.from('.hero-text', { y: '100%', stagger: 0.1, duration: 1.2, ease: 'power3.out' }, "-=0.5");
                }
                if (revealOpacity.length > 0) {
                    tl.from('.reveal-opacity', { opacity: 0, y: 20, duration: 1 }, "-=0.8");
                }
            }
        }
    }
}

// --- 2. SMOOTH SCROLL (LENIS) + NAV FIX ---
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

// FIX: Handle Anchor Links with Lenis
document.querySelectorAll('.nav-link').forEach(anchor => {
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

// --- 3. ANIMATIONS (GSAP) ---
gsap.registerPlugin(ScrollTrigger);

// A. Marquee (Scroll-Driven & Pinned)
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
            // The scroll distance (duration) is proportional to the content width
            end: () => "+=" + Math.max(window.innerWidth, marqueeTrack.scrollWidth - window.innerWidth),
            invalidateOnRefresh: true
        }
    });
}

// B. Horizontal Scroll (only runs on pages with these elements)
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

// --- 4. GLOBAL BACKGROUND (Liquid Grid) ---
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let width, height;
const points = [];
const spacing = 60;

function initBgCanvas() {
    width = bgCanvas.width = window.innerWidth;
    height = bgCanvas.height = window.innerHeight;
    points.length = 0;
    for (let x = 0; x < width + spacing; x += spacing) {
        for (let y = 0; y < height + spacing; y += spacing) {
            points.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
        }
    }
}
window.addEventListener('resize', initBgCanvas);
initBgCanvas();

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateBgCanvas() {
    bgCtx.clearRect(0, 0, width, height);
    const radius = 250;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
            const force = (radius - dist) / radius;
            const angle = Math.atan2(dy, dx);
            const push = force * 15;
            p.vx -= Math.cos(angle) * push;
            p.vy -= Math.sin(angle) * push;
        }
        p.vx += (p.ox - p.x) * 0.05;
        p.vy += (p.oy - p.y) * 0.05;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
        bgCtx.fillStyle = '#D4D4D4';
        bgCtx.fillRect(p.x, p.y, 2, 2);
    }
    requestAnimationFrame(animateBgCanvas);
}
animateBgCanvas();

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
        const radius = lW * 0.35; // Base radius

        lCtx.beginPath();

        // Generate Organic Shape using Sine summation
        for (let i = 0; i <= 360; i += 2) {
            const angle = (i * Math.PI) / 180;

            // Simulating Perlin Noise using multiple sine waves
            // Wave 1: Breathing
            const w1 = Math.sin(angle * 3 + time * 2) * 15;
            // Wave 2: Distortion
            const w2 = Math.cos(angle * 5 - time * 3) * 10;
            // Wave 3: Jitter (High frequency)
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
        lCtx.fillStyle = '#FFDE00'; // Brand Yellow
        lCtx.fill();

        // Add slight glow
        lCtx.shadowBlur = 20;
        lCtx.shadowColor = '#FFDE00';

        time += 0.03;
        requestAnimationFrame(drawBlob);
    }

    initLiquid();
    drawBlob();
}

// --- 6. TEXT SPLITTER ---
document.querySelectorAll('.hero-text').forEach(el => {
    const text = el.innerText;
    el.innerHTML = text.split('').map(char => `<span class="char inline-block">${char === ' ' ? '&nbsp;' : char}</span>`).join('');
});
