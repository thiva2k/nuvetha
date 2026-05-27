/**
 * Nuvetha's 16th Birthday Website - app.js
 * Implements interactive features:
 * 1. Time-Locked Countdowns & Stage Transitions
 * 2. Canvas Background Particle Physics (Hearts & Sparkles) + Confetti bursts
 *    - New Canvas VFX: Golden glitter explosion, Rose gold heart shockwave, Typing sparkles
 * 3. Draggable Polaroids (Desktop & Mobile Touch) clamped inside container
 *    - New Polaroid secret: dragging Polaroid #3 reveals the hidden gold key
 * 4. Swipeable Card Deck (Click, drag, swipe navigation)
 *    - New swipe tracking: monitors if Card #5 is shown to solve Quest 3
 * 5. Floating Balloon Pop & Confetti + Wishes Popup
 *    - New floating balloon: Golden Helium Balloon containing a key solves Quest 4
 * 6. Escape Quest Engine: tracks completion of 4 quests to auto-slide PIN pad
 * 7. PIN Pad Passcode Validation ('1223' Anniversary date or '28923' Clue PIN) + Typing letter reveal
 * 8. Background Music state management (videoplayback.mp3 theme) with reliable Audio wake fix
 * 9. Hidden Developer Debug Panel (5 clicks on title/footer to bypass gates)
 */

// Debug override state
const debugState = {
    simulateStage1Unlocked: false,
    simulateStage2Unlocked: false,
    bypassPin: false
};

// Global variables
let bgMusic = null;
let musicFading = false;
let isLetterUnlocked = false;

// Escape Quest Engine state
const questStatus = {
    q1: false, // Fill-in-the-blank: 'nee'
    q2: false, // Gold key found behind Polaroid
    q3: false, // Card deck swipe to card #5
    q4: false, // Timeline hidden star clicked
    q5: false  // Gold helium balloon popped (final quest)
};

// Global Canvas VFX Registry
window.canvasVFX = {
    triggerGoldenGlitterExplosion: null,
    triggerRoseGoldHeartShockwave: null,
    spawnTypingSparkle: null
};

// ----------------------------------------------------
// 1. Dynamic CSS Injection
// ----------------------------------------------------
// Adds styles for interactive elements dynamically to keep HTML/CSS files clean
const injectDynamicStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        /* Dynamic Canvas Layer */
        #ambient-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }

        /* Interactive Floating Balloons */
        .interactive-balloon {
            position: absolute;
            bottom: -150px;
            left: var(--balloon-left);
            width: var(--balloon-size);
            height: calc(var(--balloon-size) * 1.25);
            border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
            animation: float-up-interactive var(--balloon-duration) linear forwards;
            opacity: 0.95;
            box-shadow: inset -5px -5px 15px rgba(0,0,0,0.1), 0 10px 20px rgba(138, 79, 88, 0.15);
            z-index: 80;
            cursor: pointer;
            pointer-events: auto !important;
            transition: transform 0.1s ease;
        }
        
        .interactive-balloon::after {
            content: '';
            position: absolute;
            bottom: -12px;
            left: 50%;
            width: 1px;
            height: 16px;
            background-color: var(--text-light);
            transform: translateX(-50%);
            opacity: 0.6;
        }
        
        .interactive-balloon::before {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 50%;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 5px solid var(--rose-gold-dark);
            transform: translateX(-50%);
            opacity: 0.8;
        }
        
        @keyframes float-up-interactive {
            0% {
                transform: translateY(120vh) translateX(0) rotate(0deg);
            }
            33% {
                transform: translateY(80vh) translateX(30px) rotate(8deg);
            }
            66% {
                transform: translateY(40vh) translateX(-25px) rotate(-8deg);
            }
            100% {
                transform: translateY(-20vh) translateX(15px) rotate(4deg);
            }
        }
        
        /* Wish Popup Modal styling */
        .wish-popup-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 200;
            background-color: rgba(74, 47, 51, 0.45);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease;
        }
        
        .wish-popup-modal.active {
            opacity: 1;
            pointer-events: auto;
        }
        
        .wish-popup-card {
            background: linear-gradient(135deg, #ffffff 0%, #fff8f9 100%);
            border-radius: 24px;
            padding: 3rem 2.2rem;
            max-width: 420px;
            width: 90%;
            box-shadow: 0 25px 55px rgba(138, 79, 88, 0.22);
            border: 1px solid var(--glass-border);
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
        }
        
        .wish-popup-modal.active .wish-popup-card {
            transform: scale(1);
        }
        
        .wish-popup-icon {
            font-size: 2.8rem;
            color: var(--rose-gold);
            margin-bottom: 1.2rem;
            animation: seal-pulse 2s infinite ease-in-out;
        }
        
        .wish-popup-title {
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            color: var(--text-dark);
            font-size: 1.3rem;
            margin-bottom: 1rem;
            letter-spacing: 0.5px;
        }
        
        .wish-popup-message {
            font-family: 'Dancing Script', cursive;
            font-size: 1.6rem;
            color: var(--rose-gold-dark);
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        
        .wish-popup-close-btn {
            padding: 10px 24px;
            border-radius: 25px;
            border: none;
            background: var(--rose-gold);
            color: white;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px var(--rose-gold-glow);
            transition: var(--transition-bounce);
        }
        
        .wish-popup-close-btn:hover {
            background: var(--rose-gold-dark);
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(138, 79, 88, 0.35);
        }
        
        /* Developer Debug Panel */
        .debug-panel {
            position: fixed;
            bottom: 15px;
            right: 15px;
            background: rgba(30, 30, 30, 0.95);
            color: #00ff66;
            padding: 18px;
            border-radius: 12px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            z-index: 9999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            border: 1px solid #00ff66;
            max-width: 260px;
        }
        
        .debug-title {
            font-weight: bold;
            margin-bottom: 12px;
            border-bottom: 1px solid #00ff66;
            padding-bottom: 6px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
        }
        
        .debug-close {
            cursor: pointer;
            color: #ff3333;
            font-weight: bold;
        }
        
        .debug-btn {
            background: #252525;
            color: #00ff66;
            border: 1px solid #00ff66;
            padding: 6px 10px;
            margin: 5px 0;
            cursor: pointer;
            border-radius: 6px;
            width: 100%;
            text-align: left;
            font-size: 11px;
            transition: all 0.2s ease;
        }
        
        .debug-btn:hover {
            background: #00ff66;
            color: #111;
        }
        
        /* Dragging visual helpers */
        .polaroid-card.dragging {
            box-shadow: 0 30px 60px rgba(138, 79, 88, 0.25), 0 12px 20px rgba(0, 0, 0, 0.08);
            transform: scale(1.05) rotate(0deg) !important;
            cursor: grabbing;
        }

        /* Quest Card shake animation on error */
        .quest-card.shake {
            animation: card-shake-error 0.5s ease-in-out;
        }

        @keyframes card-shake-error {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
        }
    `;
    document.head.appendChild(style);
};

// ----------------------------------------------------
// 2. Canvas Background Particle Physics & Confetti
// ----------------------------------------------------
let width, height;
const backgroundParticles = [];
const activeConfetti = [];
const activeGoldGlitter = [];
const activeRoseGoldHearts = [];
const activeTypingSparkles = [];
const maxBgParticles = 40;

const initCanvasPhysics = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'ambient-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    const updateSize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Helpers to draw particles
    const drawHeart = (ctx, x, y, size, angle, color) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        // Left curve
        ctx.bezierCurveTo(-size / 2, -size, -size, -size / 3, 0, size);
        // Right curve
        ctx.bezierCurveTo(size, -size / 3, size / 2, -size, 0, -size / 2);
        ctx.fill();
        ctx.restore();
    };

    const drawSparkle = (ctx, x, y, size, opacity, color) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    // VFX functions registered globally
    window.canvasVFX.triggerGoldenGlitterExplosion = (startX, startY) => {
        const colors = ['#ffd700', '#f7e7ce', '#d4af37', '#fff5ee'];
        for (let i = 0; i < 120; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 2;
            activeGoldGlitter.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3.5 + 1.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1,
                decay: Math.random() * 0.015 + 0.005,
                gravity: 0.04,
                friction: 0.98
            });
        }
    };

    window.canvasVFX.triggerRoseGoldHeartShockwave = (startX, startY) => {
        const colors = ['#b76e79', '#e0b0b8', '#ffc0cb', '#ffb6c1'];
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            activeRoseGoldHearts.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 8 + 6,
                angle: Math.random() * Math.PI * 2,
                angleSpeed: (Math.random() - 0.5) * 0.08,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1,
                decay: Math.random() * 0.012 + 0.006,
                friction: 0.97
            });
        }
    };

    window.canvasVFX.spawnTypingSparkle = (startX, startY) => {
        const colors = ['#ffd700', '#f7e7ce', '#b76e79', '#ffc0cb'];
        for (let i = 0; i < 2; i++) {
            activeTypingSparkles.push({
                x: startX + (Math.random() - 0.5) * 6,
                y: startY + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -(Math.random() * 1.5 + 0.5), // drifting upward
                size: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1,
                decay: Math.random() * 0.03 + 0.015
            });
        }
    };

    const spawnBgParticle = (initY = false) => {
        const isHeart = Math.random() > 0.65;
        return {
            isHeart,
            x: Math.random() * width,
            y: initY ? Math.random() * height : height + 30,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: -(Math.random() * 0.6 + 0.3),
            size: isHeart ? Math.random() * 10 + 8 : Math.random() * 2.5 + 1.2,
            angle: Math.random() * Math.PI * 2,
            angleSpeed: (Math.random() - 0.5) * 0.015,
            opacity: Math.random() * 0.4 + 0.3,
            pulseSpeed: Math.random() * 0.015 + 0.005,
            pulseTime: Math.random() * 100,
            color: isHeart
                ? `rgba(183, 110, 121, ${Math.random() * 0.35 + 0.35})`  // Rose-gold tint
                : `rgba(247, 231, 206, ${Math.random() * 0.5 + 0.4})`    // Champagne tint
        };
    };

    // Populate initial background particles
    for (let i = 0; i < maxBgParticles; i++) {
        backgroundParticles.push(spawnBgParticle(true));
    }

    // Canvas animation tick
    const loop = () => {
        ctx.clearRect(0, 0, width, height);

        // Update & Render Background Ambient Particles
        for (let i = 0; i < backgroundParticles.length; i++) {
            const p = backgroundParticles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.angle += p.angleSpeed;
            p.pulseTime += p.pulseSpeed;

            if (!p.isHeart) {
                p.opacity = 0.25 + Math.sin(p.pulseTime) * 0.2;
            }

            if (p.isHeart) {
                drawHeart(ctx, p.x, p.y, p.size, p.angle, p.color);
            } else {
                drawSparkle(ctx, p.x, p.y, p.size, p.opacity, p.color);
            }

            // Recycle if floats out of bounds
            if (p.y < -40 || p.x < -40 || p.x > width + 40) {
                backgroundParticles[i] = spawnBgParticle();
            }
        }

        // Update & Render Burst Confetti
        for (let i = activeConfetti.length - 1; i >= 0; i--) {
            const c = activeConfetti[i];
            c.vx *= c.friction;
            c.vy *= c.friction;
            c.vy += c.gravity;
            c.x += c.vx;
            c.y += c.vy;
            c.rotation += c.rotationSpeed;
            c.opacity -= c.decay;

            if (c.opacity <= 0) {
                activeConfetti.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.scale(c.widthScale, 1);
            ctx.fillStyle = c.color;
            ctx.globalAlpha = c.opacity;
            ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
            ctx.restore();
        }

        // Update & Render Gold Glitter Explosion
        for (let i = activeGoldGlitter.length - 1; i >= 0; i--) {
            const p = activeGoldGlitter[i];
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.opacity -= p.decay;

            if (p.opacity <= 0) {
                activeGoldGlitter.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Update & Render Rose Gold Hearts Shockwave
        for (let i = activeRoseGoldHearts.length - 1; i >= 0; i--) {
            const p = activeRoseGoldHearts[i];
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.x += p.vx;
            p.y += p.vy;
            p.angle += p.angleSpeed;
            p.opacity -= p.decay;

            if (p.opacity <= 0) {
                activeRoseGoldHearts.splice(i, 1);
                continue;
            }

            drawHeart(ctx, p.x, p.y, p.size, p.angle, p.color);
        }

        // Update & Render Typing Sparkles
        for (let i = activeTypingSparkles.length - 1; i >= 0; i--) {
            const p = activeTypingSparkles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.opacity -= p.decay;

            if (p.opacity <= 0) {
                activeTypingSparkles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
};

// Trigger Canvas Confetti Burst at specific position
const triggerConfetti = (startX, startY) => {
    const colors = [
        '#b76e79', // Rose gold
        '#e0b0b8', // Light rose gold
        '#f7e7ce', // Champagne
        '#d4af37', // Gold
        '#ffc0cb', // Pink
        '#fff5ee', // Shell white
        '#ffd700'  // Bright gold
    ];

    for (let i = 0; i < 70; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 4;
        activeConfetti.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - Math.random() * 3.5, // upward bias
            size: Math.random() * 6 + 4,
            widthScale: Math.random() * 0.8 + 0.2, // simulated 3D flip
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.25,
            gravity: 0.16,
            friction: 0.95,
            opacity: 1,
            decay: Math.random() * 0.018 + 0.008
        });
    }
};

// ----------------------------------------------------
// 3. Audio Controls & Music Management
// ----------------------------------------------------
const initAudioEngine = () => {
    // Beautiful romantic instrumental track
    bgMusic = new Audio('assets/audio/videoplayback.mp3');
    bgMusic.preload = 'auto'; // Audio fix
    bgMusic.loop = true;
    bgMusic.volume = 0; // Starts at 0 for fade-in effect

    const toggleBtn = document.getElementById('audio-toggle-btn');
    const widget = document.getElementById('audio-widget-container');

    // Hide audio controller initially
    widget.style.display = 'none';

    toggleBtn.addEventListener('click', () => {
        resumeAudioContext();
        if (bgMusic.paused) {
            playBackgroundMusic();
        } else {
            pauseBackgroundMusic();
        }
    });

    // Audio fix: Attach a one-time global click/touchstart event listener to wake audio context
    const wakeAudioContext = () => {
        resumeAudioContext();
        if (bgMusic) {
            bgMusic.load(); // Load/preload audio reliably
        }
        document.removeEventListener('click', wakeAudioContext);
        document.removeEventListener('touchstart', wakeAudioContext);
    };
    document.addEventListener('click', wakeAudioContext);
    document.addEventListener('touchstart', wakeAudioContext);
};

const playBackgroundMusic = () => {
    if (!bgMusic) return;
    
    bgMusic.play().then(() => {
        const widget = document.getElementById('audio-widget-container');
        const icon = document.getElementById('audio-btn-icon');
        
        if (widget) widget.classList.add('playing');
        if (icon) icon.className = 'fa-solid fa-pause';
        
        // Fade-in volume safely if not already at target
        if (bgMusic.volume < 0.5) {
            musicFading = true;
            let currentVol = bgMusic.volume;
            const interval = setInterval(() => {
                if (currentVol < 0.5) {
                     currentVol += 0.05;
                     bgMusic.volume = Math.min(currentVol, 0.5);
                } else {
                     clearInterval(interval);
                     musicFading = false;
                }
            }, 100);
        }
    }).catch(err => {
        console.warn("Autoplay block or music failed to load: ", err);
    });
};

const pauseBackgroundMusic = () => {
    if (!bgMusic) return;
    bgMusic.pause();
    
    const widget = document.getElementById('audio-widget-container');
    const icon = document.getElementById('audio-btn-icon');
    
    if (widget) widget.classList.remove('playing');
    if (icon) icon.className = 'fa-solid fa-play';
};

// Resumes Web Audio contexts if browser suspended them
const resumeAudioContext = () => {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            const ctx = new AudioContextClass();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
        }
    } catch (e) {
        console.warn("Could not resume AudioContext:", e);
    }
};

// Synthesizes a clean physical "pop" sound using Web Audio API (No files needed!)
const playPopSound = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        // Quick pitch sweep for popping effect
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
        console.warn("Web Audio pop synth failed:", e);
    }
};

// ----------------------------------------------------
// 4. Time-Locked Countdowns & Stage Transitions
// ----------------------------------------------------
// Stage 1 countdown: May 28, 2026, 00:00:00 (Midnight)
const birthdayTargetTime = new Date(2026, 4, 28, 0, 0, 0).getTime();
// Stage 2 countdown: May 28, 2026, 02:36:00 (Lock time)
const letterTargetTime = new Date(2026, 4, 28, 2, 36, 0).getTime();

const initCountdowns = () => {
    const preBdayScreen = document.getElementById('countdown-screen');
    const envelopeScreen = document.getElementById('envelope-screen');
    const envelope = document.getElementById('envelope');
    const sealBtn = document.getElementById('wax-seal-btn');
    const mainDashboard = document.getElementById('main-dashboard');
    const audioWidget = document.getElementById('audio-widget-container');

    // 1. Pre-Birthday Countdown Tick
    const updatePreBirthdayCountdown = () => {
        const now = new Date().getTime();

        if (debugState.simulateStage1Unlocked || now >= birthdayTargetTime) {
            // Unlock Stage 1: Transition landing screen
            if (preBdayScreen && preBdayScreen.classList.contains('active')) {
                preBdayScreen.classList.remove('active');
                if (envelopeScreen && !mainDashboard.classList.contains('active') && !envelope.classList.contains('open')) {
                    envelopeScreen.classList.add('active');
                }
                // Trigger Golden Glitter Explosion VFX
                if (window.canvasVFX && window.canvasVFX.triggerGoldenGlitterExplosion) {
                    window.canvasVFX.triggerGoldenGlitterExplosion(window.innerWidth / 2, window.innerHeight / 2);
                }
            }
            return true;
        }

        const distance = birthdayTargetTime - now;

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        const dEl = document.getElementById('countdown-days');
        const hEl = document.getElementById('countdown-hours');
        const mEl = document.getElementById('countdown-minutes');
        const sEl = document.getElementById('countdown-seconds');

        if (dEl) dEl.innerText = String(d).padStart(2, '0');
        if (hEl) hEl.innerText = String(h).padStart(2, '0');
        if (mEl) mEl.innerText = String(m).padStart(2, '0');
        if (sEl) sEl.innerText = String(s).padStart(2, '0');
        
        return false;
    };

    // 2. Secret Letter Timer Tick (inside Main Dashboard)
    const updateLetterLockCountdown = () => {
        const now = new Date().getTime();
        const lockCard = document.getElementById('secret-lock-card');
        const revealedCard = document.getElementById('secret-revealed-card');
        const lockBtn = document.getElementById('unlock-letter-btn');

        if (isLetterUnlocked) {
            if (lockCard) lockCard.classList.remove('active');
            if (revealedCard) revealedCard.classList.add('unlocked');
            return;
        }

        if (debugState.simulateStage2Unlocked || now >= letterTargetTime) {
            // Enable passcode entry once timer is done
            if (lockBtn) {
                lockBtn.disabled = false;
                lockBtn.innerHTML = 'Enter Passcode <i class="fa-solid fa-key"></i>';
                lockBtn.style.cursor = 'pointer';
                lockBtn.style.opacity = '1';
            }

            const lhEl = document.getElementById('letter-hours');
            const lmEl = document.getElementById('letter-minutes');
            const lsEl = document.getElementById('letter-seconds');
            if (lhEl) lhEl.innerText = '00';
            if (lmEl) lmEl.innerText = '00';
            if (lsEl) lsEl.innerText = '00';

            // Auto-trigger PIN pad modal once all 5 quests are completed and timer hits zero
            const completedCount = Object.values(questStatus).filter(v => v === true).length;
            if (completedCount >= 5) {
                const pinModal = document.getElementById('pin-pad-modal');
                if (pinModal && !pinModal.classList.contains('active')) {
                    setTimeout(() => {
                        pinModal.classList.add('active');
                        const desc = pinModal.querySelector('.pin-modal-desc');
                        if (desc) {
                            desc.innerText = "All quests complete! Enter the passcode to unlock the letter.";
                        }
                    }, 1000);
                }
            }
            return;
        }

        // Before 2:36 AM: button is disabled
        if (lockBtn) {
            lockBtn.disabled = true;
            lockBtn.innerHTML = 'Locked until 2:36 AM <i class="fa-solid fa-lock"></i>';
            lockBtn.style.cursor = 'not-allowed';
            lockBtn.style.opacity = '0.6';
        }

        const distance = letterTargetTime - now;

        const h = Math.floor(distance / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        const lhEl = document.getElementById('letter-hours');
        const lmEl = document.getElementById('letter-minutes');
        const lsEl = document.getElementById('letter-seconds');

        if (lhEl) lhEl.innerText = String(h).padStart(2, '0');
        if (lmEl) lmEl.innerText = String(m).padStart(2, '0');
        if (lsEl) lsEl.innerText = String(s).padStart(2, '0');

        // Update text timer inside PIN pad modal if it's currently open
        const pinModal = document.getElementById('pin-pad-modal');
        if (pinModal && pinModal.classList.contains('active')) {
            const desc = pinModal.querySelector('.pin-modal-desc');
            if (desc) {
                desc.innerText = `Enter the passcode or wait for 2:36 AM: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        }
    };

    // Transition: Click Wax Seal -> Open Envelope -> Fade to Dashboard
    if (sealBtn) {
        sealBtn.addEventListener('click', () => {
            resumeAudioContext();
            if (envelope) envelope.classList.add('open');
            playBackgroundMusic();
            
            // Show audio control widget
            if (audioWidget) audioWidget.style.display = 'block';

            setTimeout(() => {
                if (envelopeScreen) envelopeScreen.classList.remove('active');
                if (mainDashboard) mainDashboard.classList.add('active');
                
                // Adjust canvas viewport sizing once dashboard loads
                window.dispatchEvent(new Event('resize'));
            }, 1500);
        });
    }

    // Start timer loops
    const preBdayTimerInterval = setInterval(() => {
        const unlocked = updatePreBirthdayCountdown();
        if (unlocked) {
            clearInterval(preBdayTimerInterval);
        }
    }, 1000);
    updatePreBirthdayCountdown();

    setInterval(updateLetterLockCountdown, 1000);
    updateLetterLockCountdown();
};

// ----------------------------------------------------
// 5. Polaroid Drag-and-Drop (Desktop & Mobile)
// ----------------------------------------------------
const initPolaroids = () => {
    const gallery = document.getElementById('polaroid-gallery');
    if (!gallery) return;
    const cards = gallery.querySelectorAll('.polaroid-card');
    const goldKey = document.getElementById('gold-key');

    // Initialize gold key styling
    if (goldKey) {
        goldKey.style.display = 'none';
        goldKey.style.opacity = '0';
        goldKey.style.transition = 'opacity 0.5s ease, transform 0.3s ease';
        
        goldKey.addEventListener('click', () => {
            solveQuest(2);
            goldKey.style.opacity = '0';
            setTimeout(() => {
                goldKey.style.display = 'none';
            }, 500);
        });
    }

    const setupAbsoluteLayout = () => {
        const galleryRect = gallery.getBoundingClientRect();
        const cachedPositions = [];

        // 1. Measure initial flex positions
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            cachedPositions.push({
                card,
                left: rect.left - galleryRect.left + gallery.scrollLeft,
                top: rect.top - galleryRect.top + gallery.scrollTop,
                width: rect.width,
                height: rect.height
            });
        });

        // 2. Set static height to prevent page reflow collapse
        gallery.style.height = `${gallery.clientHeight}px`;
        gallery.style.position = 'relative';

        // 3. Anchor polaroids absolutely based on measurements
        cachedPositions.forEach(pos => {
            pos.card.style.position = 'absolute';
            pos.card.style.left = `${pos.left}px`;
            pos.card.style.top = `${pos.top}px`;
            pos.card.style.margin = '0';
            const rot = pos.card.style.getPropertyValue('--rot') || '0deg';
            pos.card.style.transform = `rotate(${rot})`;
        });
    };

    // Execute layout anchoring after viewport assets stabilize
    if (document.readyState === 'complete') {
        setupAbsoluteLayout();
    } else {
        window.addEventListener('load', setupAbsoluteLayout);
    }

    // Attach dragging physics listeners
    cards.forEach(card => {
        let dragging = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;

        const startDrag = (clientX, clientY) => {
            dragging = true;
            startX = clientX;
            startY = clientY;
            initialLeft = parseFloat(card.style.left) || 0;
            initialTop = parseFloat(card.style.top) || 0;

            card.style.transition = 'none'; // Instant dragging feedback
            card.classList.add('dragging');

            // Float dragged card above others dynamically
            let highestZ = 5;
            cards.forEach(c => {
                const z = parseInt(c.style.zIndex) || 5;
                if (z > highestZ) highestZ = z;
            });
            card.style.zIndex = highestZ + 1;

            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('touchend', dragEnd);
        };

        const dragMove = (e) => {
            if (!dragging) return;

            const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

            const dx = clientX - startX;
            const dy = clientY - startY;

            let nextLeft = initialLeft + dx;
            let nextTop = initialTop + dy;

            // Strict clamping within gallery container dimensions
            const maxW = gallery.clientWidth - card.offsetWidth;
            const maxH = gallery.clientHeight - card.offsetHeight;

            nextLeft = Math.max(0, Math.min(nextLeft, maxW));
            nextTop = Math.max(0, Math.min(nextTop, maxH));

            card.style.left = `${nextLeft}px`;
            card.style.top = `${nextTop}px`;

            // If Polaroid #3 is dragged away, show the hidden gold key
            if (card.classList.contains('polaroid-item-3')) {
                const dist = Math.hypot(dx, dy);
                if (dist > 60 && goldKey && goldKey.style.display === 'none') {
                    goldKey.style.display = 'block';
                    goldKey.offsetHeight; // Force reflow
                    goldKey.style.opacity = '1';
                }
            }

            if (e.cancelable) {
                e.preventDefault(); // Stop mobile screen bounces
            }
        };

        const dragEnd = () => {
            if (!dragging) return;
            dragging = false;

            card.style.transition = ''; // Restore smooth transition
            card.classList.remove('dragging');

            // Apply randomized rotation on drop
            const angle = (Math.random() * 12 - 6).toFixed(1); // -6deg to +6deg
            card.style.setProperty('--rot', `${angle}deg`);
            card.style.transform = `rotate(${angle}deg)`;

            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('touchend', dragEnd);
        };

        // Desktop mouse bind
        card.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            startDrag(e.clientX, e.clientY);
        });

        // Mobile touch bind
        card.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
    });
};

// ----------------------------------------------------
// 6. Swipeable Card Deck
// ----------------------------------------------------
const initCardDeck = () => {
    const deck = document.getElementById('card-deck');
    const prevBtn = document.getElementById('deck-prev-btn');
    const nextBtn = document.getElementById('deck-next-btn');
    if (!deck) return;

    let deckCards = Array.from(deck.querySelectorAll('.deck-card'));

    const updateStackIndexes = () => {
        deckCards.forEach((card, idx) => {
            card.style.setProperty('--card-idx', idx);
            // Block clicks on background cards
            card.style.pointerEvents = idx === 0 ? 'auto' : 'none';
        });

        // Quest 3 Reasons Card swipe tracking (monitors if Card #16 is reached/shown)
        if (deckCards[0]) {
            const cardNumEl = deckCards[0].querySelector('.card-number');
            if (cardNumEl && cardNumEl.innerText.trim() === '16') {
                solveQuest(3);
            }
        }
    };
    updateStackIndexes();

    let dragging = false;
    let startX = 0, startY = 0;
    let dx = 0, dy = 0;

    const startSwipe = (clientX, clientY) => {
        const topCard = deckCards[0];
        if (!topCard) return;

        dragging = true;
        startX = clientX;
        startY = clientY;
        dx = 0;
        dy = 0;

        topCard.style.transition = 'none';

        document.addEventListener('mousemove', swipeMove);
        document.addEventListener('mouseup', swipeEnd);
        document.addEventListener('touchmove', swipeMove, { passive: false });
        document.addEventListener('touchend', swipeEnd);
    };

    const swipeMove = (e) => {
        if (!dragging) return;
        const topCard = deckCards[0];
        if (!topCard) return;

        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        dx = clientX - startX;
        dy = clientY - startY;

        // Apply temporary dragging transform with rotation tilt
        const rot = dx * 0.08;
        topCard.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg) scale(1.02)`;

        if (e.cancelable && Math.abs(dx) > Math.abs(dy)) {
            e.preventDefault();
        }
    };

    const swipeEnd = () => {
        if (!dragging) return;
        dragging = false;

        const topCard = deckCards[0];
        if (!topCard) return;

        topCard.style.transition = '';

        document.removeEventListener('mousemove', swipeMove);
        document.removeEventListener('mouseup', swipeEnd);
        document.removeEventListener('touchmove', swipeMove);
        document.removeEventListener('touchend', swipeEnd);

        const threshold = 120; // swipe displacement threshold
        if (dx > threshold) {
            triggerSwipeOut('right');
        } else if (dx < -threshold) {
            triggerSwipeOut('left');
        } else {
            // Cancel and snap back
            topCard.style.transform = '';
        }
    };

    // Cycle card out of stack
    const triggerSwipeOut = (direction) => {
        const topCard = deckCards[0];
        if (!topCard) return;

        topCard.classList.add(direction === 'right' ? 'swipe-right' : 'swipe-left');

        setTimeout(() => {
            const cycled = deckCards.shift();
            deckCards.push(cycled);

            cycled.classList.remove('swipe-left', 'swipe-right');
            cycled.style.transform = '';

            updateStackIndexes();
        }, 500);
    };

    // Cycle bottom card back to top
    const triggerPullIn = () => {
        if (deckCards.length <= 1) return;

        const bottomCard = deckCards[deckCards.length - 1];
        bottomCard.style.transition = 'none';
        bottomCard.classList.add('swipe-left');
        bottomCard.offsetHeight; // force paint reflow

        const pulled = deckCards.pop();
        deckCards.unshift(pulled);
        updateStackIndexes();

        pulled.offsetHeight; // force paint reflow
        pulled.style.transition = '';
        pulled.classList.remove('swipe-left');
    };

    // Mouse and Touch event handlers
    deck.addEventListener('mousedown', (e) => {
        if (e.target.closest('.deck-card') === deckCards[0] && e.button === 0) {
            startSwipe(e.clientX, e.clientY);
        }
    });

    deck.addEventListener('touchstart', (e) => {
        if (e.target.closest('.deck-card') === deckCards[0] && e.touches && e.touches[0]) {
            startSwipe(e.touches[0].clientX, e.touches[0].clientY);
        }
    });

    // Control buttons bind
    nextBtn.addEventListener('click', () => {
        triggerSwipeOut(Math.random() > 0.5 ? 'right' : 'left');
    });

    prevBtn.addEventListener('click', triggerPullIn);
};

// ----------------------------------------------------
// 7. Floating Balloon Pops, Confetti & Wishes Popup
// ----------------------------------------------------
const balloonColors = ['balloon-rose', 'balloon-champagne', 'balloon-gold', 'balloon-rose-light', 'balloon-gold-light'];
const fallbackWishes = [
    { author: "Family", message: "Happy 16th, Nuvetha! Watching you grow into such a kind, brilliant person is the greatest joy. Keep shining!" },
    { author: "Admirer", message: "You carry a rare light that changes the mood of every room you walk into. Never let the world dim it." },
    { author: "A Friend", message: "Wishing you a gorgeous Sweet 16! May this year bring endless adventures, inside jokes, and sweet memories." },
    { author: "Wellwisher", message: "Happy birthday Nuvetha! Follow your dreams with the same fierce grace you show every day. You've got this!" },
    { author: "Star light", message: "To sixteen years of making the world a sweeter place. May this be your happiest and most magic chapter yet!" },
    { author: "Warm Soul", message: "On this landmark birthday, know that you are loved unconditionally for precisely who you are. Happy Sweet 16!" }
];

const initFloatingBalloons = () => {
    // Periodically spawn interactive balloons
    setInterval(spawnInteractiveBalloon, 6000);
    
    // Wire up custom wish submission form
    const form = document.getElementById('wish-creation-form');
    const inputMsg = document.getElementById('wish-message-input');
    const inputName = document.getElementById('wish-author-name');
    const board = document.getElementById('wishes-board');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const message = inputMsg.value.trim();
            const author = inputName.value.trim();

            if (message && author) {
                // 1. Create sticky post-it note on the wall
                const note = document.createElement('div');
                const col = Math.floor(Math.random() * 4) + 1; // note-color-1 to 4
                note.className = `wish-sticky-note note-color-${col}`;
                
                const tilt = (Math.random() * 6 - 3).toFixed(1); // -3deg to 3deg rotation
                note.style.transform = `rotate(${tilt}deg)`;
                note.innerHTML = `
                    <div class="note-pin"></div>
                    <p class="note-text font-cursive">"${message}"</p>
                    <span class="note-signature font-sans">&mdash; ${author}</span>
                `;

                if (board) board.insertBefore(note, board.firstChild);

                // 2. Launch a custom balloon representing this wish!
                const formRect = form.getBoundingClientRect();
                const startX = formRect.left + formRect.width / 2;
                const leftOffsetPercent = (startX / window.innerWidth) * 100;

                const b = document.createElement('div');
                const colClass = balloonColors[Math.floor(Math.random() * balloonColors.length)];
                b.className = `balloon ${colClass} interactive-balloon`;
                b.style.setProperty('--balloon-left', `${leftOffsetPercent}%`);
                b.style.setProperty('--balloon-size', '68px');
                b.style.setProperty('--balloon-duration', '15s');

                // Attach user details to balloon
                b.wishData = { author, message };

                // Add pop interactions
                b.addEventListener('click', (e) => popInteractiveBalloon(b, e.clientX, e.clientY));
                b.addEventListener('touchstart', (e) => {
                    if (e.touches && e.touches[0]) {
                        popInteractiveBalloon(b, e.touches[0].clientX, e.touches[0].clientY);
                        e.preventDefault();
                    }
                });
                b.addEventListener('animationend', () => b.remove());

                document.body.appendChild(b);

                // Confetti burst on submit button area
                triggerConfetti(formRect.left + formRect.width / 2, formRect.top + formRect.height / 2);

                // Clear inputs
                inputMsg.value = '';
                inputName.value = '';
            }
        });
    }
};

const spawnInteractiveBalloon = () => {
    // Only spawn balloons if the user has unlocked the main dashboard screen
    if (!document.getElementById('main-dashboard').classList.contains('active')) {
        return;
    }

    const b = document.createElement('div');
    const colClass = balloonColors[Math.floor(Math.random() * balloonColors.length)];
    b.className = `balloon ${colClass} interactive-balloon`;

    // Vary balloon styling parameters
    const size = Math.floor(Math.random() * 25) + 52; // 52px to 77px
    const left = Math.random() * 80 + 10; // 10% to 90%
    const duration = Math.floor(Math.random() * 8) + 12; // 12s to 20s

    b.style.setProperty('--balloon-left', `${left}%`);
    b.style.setProperty('--balloon-size', `${size}px`);
    b.style.setProperty('--balloon-duration', `${duration}s`);

    // Click pops balloon
    b.addEventListener('click', (e) => popInteractiveBalloon(b, e.clientX, e.clientY));
    b.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            popInteractiveBalloon(b, e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    });
    
    b.addEventListener('animationend', () => b.remove());
    document.body.appendChild(b);
};

const popInteractiveBalloon = (balloon, clickX, clickY) => {
    playPopSound();

    let x = clickX;
    let y = clickY;
    
    // Fallback coordinates if trigger events didn't supply them
    if (!x || !y) {
        const rect = balloon.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
    }

    triggerConfetti(x, y);

    // Retrieve either the attached user wish or pull a random fallback wish
    const data = balloon.wishData || fallbackWishes[Math.floor(Math.random() * fallbackWishes.length)];
    showBlessingPopup(data.author, data.message);

    balloon.remove();
};

const showBlessingPopup = (author, message) => {
    let modal = document.getElementById('wish-popup-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'wish-popup-modal';
        modal.className = 'wish-popup-modal';
        modal.innerHTML = `
            <div class="wish-popup-card">
                <div class="wish-popup-icon"><i class="fa-solid fa-gift"></i></div>
                <h3 class="wish-popup-title" id="wish-popup-title">A Blessing for Nuvetha</h3>
                <p class="wish-popup-message" id="wish-popup-message">"Wishing you a beautiful year ahead!"</p>
                <button class="wish-popup-close-btn" id="wish-popup-close-btn">With Love</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#wish-popup-close-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    modal.querySelector('#wish-popup-title').innerText = author ? `From ${author}` : "A Birthday Wish";
    modal.querySelector('#wish-popup-message').innerText = `"${message}"`;
    modal.classList.add('active');
};

// ----------------------------------------------------
// 8. Escape Quest Engine
// ----------------------------------------------------
const initQuestEngine = () => {
    // 1. Setup Quest 1: Fill in the blank ("nee")
    const submitBtn = document.getElementById('quest-1-submit');
    const inputEl = document.getElementById('quest-1-input');
    if (submitBtn && inputEl) {
        const checkAnswer = () => {
            if (inputEl.value.toLowerCase().trim() === 'nee') {
                solveQuest(1);
                inputEl.disabled = true;
                submitBtn.disabled = true;
            } else {
                const card = document.getElementById('quest-1-card');
                if (card) {
                    card.classList.add('shake');
                    setTimeout(() => card.classList.remove('shake'), 800);
                }
            }
        };
        submitBtn.addEventListener('click', checkAnswer);
        inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkAnswer(); });
    }

    // 2. Quest 2 (Gold Key) is solved via initPolaroids drag detection (no extra setup here)

    // 3. Quest 3: Card Deck Swipe is solved via updateStackIndexes in initCardDeck (no extra setup here)

    // 5. Quest 5: Gold Balloon Pop — the grand finale! (spawns periodically)
    setInterval(spawnGoldQuestBalloon, 15000);
    setTimeout(spawnGoldQuestBalloon, 4000);

    // 4. Quest 4: Hidden Star — click listener inside Timeline section
    const timelineStar = document.getElementById('quest-3-star');
    if (timelineStar) {
        timelineStar.addEventListener('click', () => {
            solveQuest(4);
            timelineStar.classList.remove('pulse-anim');
            timelineStar.style.color = 'var(--gold)';
            timelineStar.style.opacity = '1';
            triggerConfetti(window.innerWidth / 2, window.innerHeight / 2);
        });
    }

    // Initialize Scratch Card canvas (Quest 2 visual — key is hidden behind polaroid)
    initScratchCard();
};

const initScratchCard = () => {
    const canvas = document.getElementById('quest-2-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d8b2b7'; // Rose gold
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Montserrat';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch here', canvas.width / 2, canvas.height / 2);

    let isDrawing = false;

    const scratch = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
    };

    const startScratching = (e) => {
        isDrawing = true;
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        scratch(clientX, clientY);
    };

    const moveScratching = (e) => {
        if (!isDrawing) return;
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        scratch(clientX, clientY);
        
        if (e.cancelable) {
            e.preventDefault();
        }
    };

    const endScratching = () => {
        isDrawing = false;
    };

    canvas.addEventListener('mousedown', startScratching);
    canvas.addEventListener('mousemove', moveScratching);
    canvas.addEventListener('mouseup', endScratching);
    canvas.addEventListener('mouseleave', endScratching);

    canvas.addEventListener('touchstart', startScratching, { passive: false });
    canvas.addEventListener('touchmove', moveScratching, { passive: false });
    canvas.addEventListener('touchend', endScratching);
};

const spawnGoldQuestBalloon = () => {
    // Only spawn if main dashboard is active and Quest 5 (balloon) is not yet solved
    if (!document.getElementById('main-dashboard').classList.contains('active') || questStatus.q5) {
        return;
    }

    const b = document.createElement('div');
    b.className = 'balloon balloon-quest-gold interactive-balloon';
    b.innerHTML = '<div style="position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%); font-size: 1.5rem; color: #fff;"><i class="fa-solid fa-key"></i></div>';

    const size = 70; // Constant prominent size
    const left = Math.random() * 80 + 10; // 10% to 90%
    const duration = Math.floor(Math.random() * 5) + 10; // 10s to 15s

    b.style.setProperty('--balloon-left', `${left}%`);
    b.style.setProperty('--balloon-size', `${size}px`);
    b.style.setProperty('--balloon-duration', `${duration}s`);

    const popHandler = (clientX, clientY) => {
        playPopSound();
        triggerConfetti(clientX || window.innerWidth / 2, clientY || window.innerHeight / 2);
        
        // Solve Quest 5 — final quest, pop the balloon for the last secret digit!
        solveQuest(5);
        b.remove();
    };

    b.addEventListener('click', (e) => popHandler(e.clientX, e.clientY));
    b.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches[0]) {
            popHandler(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        }
    });

    b.addEventListener('animationend', () => b.remove());
    document.body.appendChild(b);
};

const solveQuest = (questNum) => {
    if (questNum === 1) {
        if (questStatus.q1) return;
        questStatus.q1 = true;
        const card = document.getElementById('quest-1-card');
        if (card) {
            card.classList.add('solved');
            const icon = document.getElementById('q1-status');
            if (icon) icon.innerHTML = '<i class="fa-solid fa-unlock"></i>';
            const clue = document.getElementById('q1-clue');
            if (clue) clue.classList.remove('hidden');
            const rect = card.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    } else if (questNum === 2) {
        if (questStatus.q2) return;
        questStatus.q2 = true;
        
        // Solves Card 2 (Polaroid Key quest)
        const card2 = document.getElementById('quest-2-card');
        if (card2) {
            card2.classList.add('solved');
            const icon2 = document.getElementById('q2-status');
            if (icon2) icon2.innerHTML = '<i class="fa-solid fa-unlock"></i>';
            const clue2 = document.getElementById('q2-clue');
            if (clue2) clue2.classList.remove('hidden');

            const canvas = document.getElementById('quest-2-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            const rect = card2.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    } else if (questNum === 3) {
        if (questStatus.q3) return;
        questStatus.q3 = true;
        const card = document.getElementById('quest-3-card');
        if (card) {
            card.classList.add('solved');
            const icon = document.getElementById('q3-status');
            if (icon) icon.innerHTML = '<i class="fa-solid fa-unlock"></i>';
            const clue = document.getElementById('q3-clue');
            if (clue) clue.classList.remove('hidden');
            const rect = card.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    } else if (questNum === 4) {
        if (questStatus.q4) return;
        questStatus.q4 = true;
        const card = document.getElementById('quest-4-card');
        if (card) {
            card.classList.add('solved');
            const icon = document.getElementById('q4-status');
            if (icon) icon.innerHTML = '<i class="fa-solid fa-unlock"></i>';
            const clue = document.getElementById('q4-clue');
            if (clue) clue.classList.remove('hidden');
            const rect = card.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    } else if (questNum === 5) {
        if (questStatus.q5) return;
        questStatus.q5 = true;
        const card = document.getElementById('quest-5-card');
        if (card) {
            card.classList.add('solved');
            const icon = document.getElementById('q5-status');
            if (icon) icon.innerHTML = '<i class="fa-solid fa-unlock"></i>';
            const clue = document.getElementById('q5-clue');
            if (clue) clue.classList.remove('hidden');
            const rect = card.getBoundingClientRect();
            triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
            // Grand finale VFX — golden glitter explosion for the last quest!
            if (window.canvasVFX && window.canvasVFX.triggerGoldenGlitterExplosion) {
                setTimeout(() => {
                    window.canvasVFX.triggerGoldenGlitterExplosion(window.innerWidth / 2, window.innerHeight / 2);
                }, 300);
            }
        }
    }

    checkQuestCompletion();
};

const checkQuestCompletion = () => {
    const completedCount = Object.values(questStatus).filter(v => v === true).length;
    
    // Update progress tracker out of 5 HTML cards solved
    const solvedHTMLCards = document.querySelectorAll('.quest-card.solved').length;
    const questCountEl = document.getElementById('quest-count');
    const questProgressFill = document.getElementById('quest-progress-fill');
    
    if (questCountEl) questCountEl.innerText = solvedHTMLCards;
    if (questProgressFill) questProgressFill.style.width = `${(solvedHTMLCards / 5) * 100}%`;

    // When all 5 engine quests complete, automatically slide in PIN pad modal (only if timer is finished)
    if (completedCount >= 5) {
        const now = new Date().getTime();
        if (debugState.simulateStage2Unlocked || now >= letterTargetTime) {
            setTimeout(() => {
                const pinModal = document.getElementById('pin-pad-modal');
                if (pinModal && !pinModal.classList.contains('active') && !isLetterUnlocked) {
                    pinModal.classList.add('active');
                    const desc = pinModal.querySelector('.pin-modal-desc');
                    if (desc) {
                        desc.innerText = "All quests complete! Enter the passcode to unlock the letter.";
                    }
                }
            }, 1200);
        }
    }
};

// ----------------------------------------------------
// 9. PIN Pad Passcode Validation & Letter Reveal
// ----------------------------------------------------
const initPinPadValidation = () => {
    const lockBtn = document.getElementById('unlock-letter-btn');
    const modal = document.getElementById('pin-pad-modal');
    const closeBtn = document.getElementById('pin-modal-close');
    const clearBtn = document.getElementById('pin-btn-clear');
    const backBtn = document.getElementById('pin-btn-back');
    const errorMsg = document.getElementById('pin-error-message');
    const dots = document.getElementById('pin-entry-dots').querySelectorAll('.entry-dot');
    const digitBtns = document.querySelectorAll('.pin-digit-btn[data-val]');

    let enteredCode = '';

    const updateDots = () => {
        dots.forEach((dot, idx) => {
            if (idx < enteredCode.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    };

    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            const now = new Date().getTime();
            if (now < letterTargetTime && !debugState.simulateStage2Unlocked) {
                return; // Guard to prevent opening modal if early
            }
            if (modal) {
                modal.classList.add('active');
                enteredCode = '';
                updateDots();
                if (errorMsg) errorMsg.classList.remove('active');
            }
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            enteredCode = '';
            updateDots();
            if (errorMsg) errorMsg.classList.remove('active');
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (enteredCode.length > 0) {
                enteredCode = enteredCode.slice(0, -1);
                updateDots();
                if (errorMsg) errorMsg.classList.remove('active');
            }
        });
    }

    // Handle number pad button clicks
    digitBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const now = new Date().getTime();
            if (now < letterTargetTime && !debugState.simulateStage2Unlocked) {
                return; // Guard to prevent input if accessed early
            }
            resumeAudioContext();
            const val = btn.getAttribute('data-val');

            if (enteredCode.length < 5) {
                enteredCode += val;
                updateDots();
                if (errorMsg) errorMsg.classList.remove('active');

                // Quest clues form the 5-digit passcode: 28923
                // (28 = her birthday, 9 = your birthday, 23 = anniversary)
                if (enteredCode.length === 5) {
                    if (enteredCode === '28923' || debugState.bypassPin) {
                        if (modal) modal.classList.remove('active');
                        // Rose gold heart shockwave VFX
                        if (window.canvasVFX && window.canvasVFX.triggerRoseGoldHeartShockwave) {
                            window.canvasVFX.triggerRoseGoldHeartShockwave(window.innerWidth / 2, window.innerHeight / 2);
                        }
                        unlockSecretLetterSection();
                    } else {
                        // Shake card and clear input on passcode mismatch
                        if (modal) {
                            const card = modal.querySelector('.pin-pad-card');
                            if (card) card.classList.add('shake');
                            if (errorMsg) errorMsg.classList.add('active');

                            setTimeout(() => {
                                if (card) card.classList.remove('shake');
                                enteredCode = '';
                                updateDots();
                            }, 800);
                        }
                    }
                }
            }
        });
    });
};

const unlockSecretLetterSection = () => {
    if (isLetterUnlocked) return;
    isLetterUnlocked = true;

    // Transition elements visibility
    const lockCard = document.getElementById('secret-lock-card');
    if (lockCard) lockCard.classList.remove('active');
    
    const revealCard = document.getElementById('secret-revealed-card');
    if (revealCard) revealCard.classList.add('unlocked');

    // Run Typing Effect
    typeOutSecretLetter();
    
    // Attach video player interaction
    setupVideoFrameActions();
};

// Smooth typing reveal inside scrollable paper body with sparkles
const typeOutSecretLetter = () => {
    const body = document.querySelector('.letter-scrollable-body');
    if (!body) return;
    const paragraphs = body.querySelectorAll('p');

    const contents = [];
    paragraphs.forEach(p => {
        contents.push(p.innerHTML);
        p.innerHTML = '';
        p.style.opacity = '1';
    });

    let pIdx = 0;
    let charIdx = 0;

    const type = () => {
        if (pIdx >= paragraphs.length) {
            // Typing sequence complete
            return;
        }

        const p = paragraphs[pIdx];
        const text = contents[pIdx];

        if (charIdx < text.length) {
            p.innerHTML = text.slice(0, charIdx + 1);
            charIdx++;

            // Scroll down as typing expands contents
            body.scrollTop = body.scrollHeight;

            // Spawn typing sparkles at the current typing position
            const tempSpan = document.createElement('span');
            tempSpan.innerHTML = '&#8203;'; // Zero width space
            p.appendChild(tempSpan);
            const rect = tempSpan.getBoundingClientRect();
            p.removeChild(tempSpan);

            if (rect.left && rect.top && window.canvasVFX && window.canvasVFX.spawnTypingSparkle) {
                window.canvasVFX.spawnTypingSparkle(rect.left, rect.top);
            }

            let delay = 15; // Base typing speed
            
            // Pauses on grammar marks for natural human voice pacing
            const last = text.charAt(charIdx - 1);
            if (last === '.' || last === '!' || last === '?') {
                delay = 420;
            } else if (last === ',') {
                delay = 200;
            }

            setTimeout(type, delay);
        } else {
            // Completed current paragraph, slide to next
            pIdx++;
            charIdx = 0;
            setTimeout(type, 350); // Pause between paragraphs
        }
    };

    type();
};

const setupVideoFrameActions = () => {
    const trigger = document.getElementById('video-play-trigger');
    const placeholder = document.getElementById('video-placeholder');
    const iframe = document.getElementById('video-iframe');

    if (trigger) {
        trigger.addEventListener('click', () => {
            // Load target official YouTube video
            if (iframe) {
                iframe.src = "https://www.youtube.com/embed/2Vv-BfVoq4g?autoplay=1";
                if (placeholder) placeholder.classList.add('hidden');
                iframe.classList.remove('hidden');
            }

            // Pause background music to prioritize video sound
            pauseBackgroundMusic();
        });
    }
};

// ----------------------------------------------------
// 10. Secret Developer Debug Panel
// ----------------------------------------------------
const initDebugMenu = () => {
    let clicks = 0;
    let timer;

    const handler = () => {
        clicks++;
        if (clicks >= 5) {
            clicks = 0;
            spawnDebugUI();
        }
        
        clearTimeout(timer);
        timer = setTimeout(() => { clicks = 0; }, 3000);
    };

    // Bind triggers on countdown header and footer text
    const title = document.querySelector('.countdown-title');
    const footerText = document.querySelector('.footer-text');
    const footerSec = document.querySelector('.dashboard-footer');

    if (title) title.addEventListener('click', handler);
    if (footerText) footerText.addEventListener('click', handler);
    if (footerSec) footerSec.addEventListener('click', handler);
};

const spawnDebugUI = () => {
    let ui = document.getElementById('developer-debug-panel');
    if (ui) {
        ui.style.display = 'block';
        return;
    }

    ui = document.createElement('div');
    ui.id = 'developer-debug-panel';
    ui.className = 'debug-panel';
    ui.innerHTML = `
        <div class="debug-title">
            <span>Dev Debug Menu</span>
            <span class="debug-close" id="debug-close-btn">&times;</span>
        </div>
        <button class="debug-btn" id="db-btn-s1">Simulate Stage 1 Unlocked (May 28)</button>
        <button class="debug-btn" id="db-btn-s2">Simulate Stage 2 Unlocked (02:36 AM)</button>
        <button class="debug-btn" id="db-btn-bypass">Enable PIN Bypass (Any Code)</button>
        <button class="debug-btn" id="db-btn-solve">Solve All Quests (Show Clues)</button>
        <button class="debug-btn" id="db-btn-unlock">Auto Unlock Letter Directly</button>
    `;
    document.body.appendChild(ui);

    document.getElementById('debug-close-btn').addEventListener('click', () => {
        ui.style.display = 'none';
    });

    const forceMusicAndBypassQuests = () => {
        debugState.simulateStage1Unlocked = true;
        debugState.simulateStage2Unlocked = true;
        debugState.bypassPin = true;

        // Force-play background music
        resumeAudioContext();
        if (bgMusic) {
            bgMusic.volume = 0.5;
            playBackgroundMusic();
        }
        const audioWidget = document.getElementById('audio-widget-container');
        if (audioWidget) audioWidget.style.display = 'block';

        // Skip quest checks (mark all HTML cards as solved)
        solveQuest(1);
        solveQuest(2);
        solveQuest(3);
        solveQuest(4);
        solveQuest(5);

        // Transition countdown screens to show dashboard
        const preBdayScreen = document.getElementById('countdown-screen');
        const envelopeScreen = document.getElementById('envelope-screen');
        const mainDashboard = document.getElementById('main-dashboard');
        
        if (preBdayScreen) preBdayScreen.classList.remove('active');
        if (envelopeScreen) envelopeScreen.classList.remove('active');
        if (mainDashboard) {
            mainDashboard.classList.add('active');
            window.dispatchEvent(new Event('resize'));
        }
    };

    document.getElementById('db-btn-s1').addEventListener('click', () => {
        debugState.simulateStage1Unlocked = true;
        
        // Transition countdown-screen to envelope-screen
        const preBdayScreen = document.getElementById('countdown-screen');
        const envelopeScreen = document.getElementById('envelope-screen');
        if (preBdayScreen) preBdayScreen.classList.remove('active');
        if (envelopeScreen) envelopeScreen.classList.add('active');
        
        alert("Debug: Stage 1 Bypassed! (Countdown unlocked)");
    });

    document.getElementById('db-btn-s2').addEventListener('click', () => {
        debugState.simulateStage2Unlocked = true;
        alert("Debug: Stage 2 Timer Bypassed! (Secret letter will unlock when quests/PIN are done)");
    });

    document.getElementById('db-btn-bypass').addEventListener('click', () => {
        debugState.bypassPin = true;
        alert("Debug: Enter any digits in PIN pad to unlock!");
    });

    document.getElementById('db-btn-solve').addEventListener('click', () => {
        solveQuest(1);
        solveQuest(2);
        solveQuest(3);
        solveQuest(4);
        solveQuest(5);
        alert("Debug: All 5 quests solved! Clues revealed and PIN pad triggered.");
    });

    document.getElementById('db-btn-unlock').addEventListener('click', () => {
        ui.style.display = 'none';
        forceMusicAndBypassQuests();
        unlockSecretLetterSection();
        alert("Debug: Letter and Video Unlocked Instantly!");
    });
};

// ----------------------------------------------------
// 11. Scroll progress for Timeline Path
// ----------------------------------------------------
const initTimelinePathAnimation = () => {
    const path = document.getElementById('timeline-filled-line');
    const container = document.querySelector('.timeline-container');
    if (!path || !container) return;

    const fillTimelineScroll = () => {
        const rect = container.getBoundingClientRect();
        const screenHeight = window.innerHeight;
        
        // Fills line relative to scroll height entrance
        const triggerPos = screenHeight * 0.78;
        const progress = triggerPos - rect.top;
        
        let pct = (progress / rect.height) * 100;
        pct = Math.max(0, Math.min(pct, 100)); // Clamp between 0-100%

        path.style.height = `${pct}%`;
    };

    window.addEventListener('scroll', fillTimelineScroll);
    fillTimelineScroll();
};

const initNameTextAnimations = () => {
    const targets = [
        { selector: '.hero-title' },
        { selector: '.countdown-title' }
    ];

    targets.forEach(item => {
        const el = document.querySelector(item.selector);
        if (!el) return;

        const text = el.innerText.trim();
        el.innerHTML = '';
        el.style.display = 'flex';
        el.style.justifyContent = 'center';
        el.style.flexWrap = 'nowrap';

        Array.from(text).forEach((char, idx) => {
            const span = document.createElement('span');
            span.className = 'animated-char';
            span.style.setProperty('--i', idx + 1);
            if (char === ' ') {
                span.innerHTML = '&nbsp;';
            } else {
                span.innerText = char;
            }
            el.appendChild(span);
        });
    });
};

// ----------------------------------------------------
// Initialization Bootstrap
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    injectDynamicStyles();
    initCanvasPhysics();
    initAudioEngine();
    initCountdowns();
    initNameTextAnimations();
    initPolaroids();
    initCardDeck();
    initFloatingBalloons();
    initQuestEngine();
    initPinPadValidation();
    initTimelinePathAnimation();
    initDebugMenu();
});
