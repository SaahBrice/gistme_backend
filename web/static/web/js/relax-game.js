/**
 * Gist4U Relax Game - Mirror Pattern Puzzle
 * Version 5 with partial mirrors and penalty system
 */

(function () {
    const SAVE_KEY = 'gist4u_relax_v5';

    const themes = [
        { bg: '#0a0a12', o1: '#10B981', o2: '#3B82F6' },
        { bg: '#0f0a18', o1: '#8B5CF6', o2: '#EC4899' },
        { bg: '#0a1212', o1: '#14B8A6', o2: '#06B6D4' },
        { bg: '#120a0a', o1: '#EF4444', o2: '#F97316' },
        { bg: '#0a0a18', o1: '#6366F1', o2: '#A78BFA' },
        { bg: '#0f0f0a', o1: '#EAB308', o2: '#84CC16' },
    ];

    // =========================================================
    // LEVEL CONFIGURATIONS
    // Each level has: rows, cols, patternCols/patternRows, lit, axis, phase
    // From level 50+: partialMirror can be 1,2,3 or 'full'
    // =========================================================
    const LEVEL_CONFIGS = [
        // Phase 1: Intro (1-10)
        { rows: 2, cols: 4, patternCols: 2, lit: 1, axis: 'v', phase: '🌱 Learning' },
        { rows: 2, cols: 4, patternCols: 2, lit: 2, axis: 'v', phase: '🌱 Learning' },
        { rows: 4, cols: 2, patternRows: 2, lit: 2, axis: 'h', phase: '🌱 Learning' },
        { rows: 2, cols: 4, patternCols: 3, lit: 2, axis: 'v', phase: '🌱 Learning' },
        { rows: 4, cols: 2, patternRows: 3, lit: 2, axis: 'h', phase: '🌱 Learning' },
        { rows: 2, cols: 6, patternCols: 3, lit: 2, axis: 'v', phase: '🌱 Learning' },
        { rows: 2, cols: 6, patternCols: 4, lit: 3, axis: 'v', phase: '🌱 Learning' },
        { rows: 6, cols: 2, patternRows: 4, lit: 3, axis: 'h', phase: '🌱 Learning' },
        { rows: 3, cols: 4, patternCols: 2, lit: 3, axis: 'v', phase: '🌱 Learning' },
        { rows: 3, cols: 4, patternCols: 3, lit: 3, axis: 'v', phase: '🌱 Learning' },

        // Phase 2: Warming up (11-25)
        { rows: 4, cols: 4, patternCols: 2, lit: 3, axis: 'v', phase: '📚 Warming Up' },
        { rows: 4, cols: 4, patternRows: 2, lit: 3, axis: 'h', phase: '📚 Warming Up' },
        { rows: 3, cols: 6, patternCols: 3, lit: 4, axis: 'v', phase: '📚 Warming Up' },
        { rows: 3, cols: 6, patternCols: 4, lit: 4, axis: 'v', phase: '📚 Warming Up' },
        { rows: 6, cols: 3, patternRows: 4, lit: 4, axis: 'h', phase: '📚 Warming Up' },
        { rows: 4, cols: 6, patternCols: 3, lit: 4, axis: 'v', phase: '📚 Warming Up' },
        { rows: 4, cols: 6, patternCols: 4, lit: 5, axis: 'v', phase: '📚 Warming Up' },
        { rows: 6, cols: 4, patternRows: 4, lit: 5, axis: 'h', phase: '📚 Warming Up' },
        { rows: 4, cols: 6, patternCols: 5, lit: 4, axis: 'v', phase: '📚 Warming Up' },
        { rows: 6, cols: 4, patternRows: 5, lit: 4, axis: 'h', phase: '📚 Warming Up' },
        { rows: 3, cols: 8, patternCols: 4, lit: 4, axis: 'v', phase: '📚 Warming Up' },
        { rows: 3, cols: 8, patternCols: 5, lit: 5, axis: 'v', phase: '📚 Warming Up' },
        { rows: 8, cols: 3, patternRows: 5, lit: 5, axis: 'h', phase: '📚 Warming Up' },
        { rows: 4, cols: 8, patternCols: 4, lit: 5, axis: 'v', phase: '📚 Warming Up' },
        { rows: 4, cols: 8, patternCols: 6, lit: 5, axis: 'v', phase: '📚 Warming Up' },

        // Phase 3: Getting serious (26-49) - Before partial mirrors
        { rows: 5, cols: 6, patternCols: 3, lit: 5, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 5, cols: 6, patternCols: 4, lit: 5, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 5, patternRows: 4, lit: 5, axis: 'h', phase: '🔥 Heating Up' },
        { rows: 5, cols: 8, patternCols: 4, lit: 6, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 5, cols: 8, patternCols: 5, lit: 6, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 8, cols: 5, patternRows: 5, lit: 6, axis: 'h', phase: '🔥 Heating Up' },
        { rows: 5, cols: 8, patternCols: 6, lit: 6, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 6, patternCols: 3, lit: 6, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 6, patternCols: 4, lit: 6, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 6, patternRows: 4, lit: 6, axis: 'h', phase: '🔥 Heating Up' },
        { rows: 6, cols: 8, patternCols: 4, lit: 7, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 8, patternCols: 5, lit: 7, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 8, patternCols: 6, lit: 7, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 8, cols: 6, patternRows: 5, lit: 7, axis: 'h', phase: '🔥 Heating Up' },
        { rows: 8, cols: 6, patternRows: 6, lit: 7, axis: 'h', phase: '🔥 Heating Up' },
        { rows: 5, cols: 8, patternCols: 4, lit: 7, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 5, cols: 8, patternCols: 5, lit: 7, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 5, cols: 8, patternCols: 6, lit: 8, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 8, patternCols: 5, lit: 8, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 8, patternCols: 6, lit: 8, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 8, patternCols: 4, lit: 8, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 6, cols: 8, patternCols: 5, lit: 8, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 7, cols: 8, patternCols: 5, lit: 8, axis: 'v', phase: '🔥 Heating Up' },
        { rows: 7, cols: 8, patternCols: 6, lit: 8, axis: 'v', phase: '🔥 Heating Up' },

        // Phase 4: PARTIAL MIRRORS BEGIN (50-70)
        // mirrorLength: how many cells the mirror spans (not full grid!)
        { rows: 4, cols: 6, patternCols: 3, lit: 4, axis: 'v', phase: '⚡ Partial!', mirrorLength: 2 },
        { rows: 4, cols: 6, patternCols: 4, lit: 4, axis: 'v', phase: '⚡ Partial!', mirrorLength: 2 },
        { rows: 6, cols: 4, patternRows: 3, lit: 4, axis: 'h', phase: '⚡ Partial!', mirrorLength: 2 },
        { rows: 4, cols: 8, patternCols: 4, lit: 5, axis: 'v', phase: '⚡ Partial!', mirrorLength: 2 },
        { rows: 4, cols: 8, patternCols: 5, lit: 5, axis: 'v', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 5, cols: 6, patternCols: 3, lit: 5, axis: 'v', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 5, cols: 6, patternCols: 4, lit: 5, axis: 'v', phase: '⚡ Partial!', mirrorLength: 2 },
        { rows: 6, cols: 5, patternRows: 3, lit: 5, axis: 'h', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 5, cols: 8, patternCols: 4, lit: 6, axis: 'v', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 5, cols: 8, patternCols: 5, lit: 6, axis: 'v', phase: '⚡ Partial!', mirrorLength: 2 },
        { rows: 6, cols: 6, patternCols: 3, lit: 5, axis: 'v', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 6, cols: 6, patternCols: 4, lit: 5, axis: 'v', phase: '⚡ Partial!', mirrorLength: 2 },
        { rows: 6, cols: 8, patternCols: 4, lit: 6, axis: 'v', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 6, cols: 8, patternCols: 5, lit: 6, axis: 'v', phase: '⚡ Partial!', mirrorLength: 4 },
        { rows: 8, cols: 6, patternRows: 4, lit: 6, axis: 'h', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 6, cols: 8, patternCols: 4, lit: 6, axis: 'v', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 6, cols: 8, patternCols: 5, lit: 6, axis: 'v', phase: '⚡ Partial!', mirrorLength: 4 },
        { rows: 7, cols: 8, patternCols: 4, lit: 7, axis: 'v', phase: '⚡ Partial!', mirrorLength: 4 },
        { rows: 7, cols: 8, patternCols: 5, lit: 7, axis: 'v', phase: '⚡ Partial!', mirrorLength: 3 },
        { rows: 8, cols: 8, patternCols: 4, lit: 7, axis: 'v', phase: '⚡ Partial!', mirrorLength: 4 },
        { rows: 8, cols: 8, patternCols: 5, lit: 7, axis: 'v', phase: '⚡ Partial!', mirrorLength: 5 },
    ];

    const MILESTONES = {
        10: { text: '🎉 Level 10!', sub: 'Great start!' },
        25: { text: '🔥 Level 25!', sub: 'Getting tougher!' },
        50: { text: '⚡ Level 50!', sub: 'PARTIAL MIRRORS UNLOCKED!' },
        75: { text: '💪 Level 75!', sub: 'You\'re amazing!' },
        100: { text: '⏱️ Level 100!', sub: 'TIMER MODE UNLOCKED!' },
        150: { text: '🔷 Level 150!', sub: 'CIRCLES UNLOCKED!' },
        200: { text: '🔺 Level 200!', sub: 'TRIANGLES UNLOCKED!' },
        250: { text: '🌈 Level 250!', sub: 'COLORS UNLOCKED!' },
        300: { text: '⭐ Level 300!', sub: 'STARS UNLOCKED!' },
    };

    // Game state
    let level = 1, score = 0;
    let rows = 2, cols = 4;
    let patternCols = 2, patternRows = 2;
    let mirrorAxis = 'v';
    let mirrorLength = null; // null = full, number = partial
    let mirrorStart = 0;     // Starting row/col for partial mirror
    let patternData = [], playerData = [];
    let won = false, failed = false;

    let timerEnabled = false, timerSeconds = 0, timerRemaining = 0, timerInterval = null;
    let shapesUnlocked = ['square'], colorsUnlocked = ['green'];
    let selectedShape = 'square', selectedColor = 'green';

    // DOM elements
    let gridEl, levelEl, scoreEl, statusEl, orb1, orb2;
    let phaseBadge, timerBadge, timerContainer, timerFill;
    let shapePalette, colorPalette;
    let milestoneOverlay, milestoneText, milestoneSub, milestoneBtn;
    let penaltyEl;

    // Initialize DOM references
    function initDOM() {
        gridEl = document.getElementById('grid');
        levelEl = document.getElementById('level');
        scoreEl = document.getElementById('score');
        statusEl = document.getElementById('status');
        orb1 = document.getElementById('orb1');
        orb2 = document.getElementById('orb2');
        phaseBadge = document.getElementById('phaseBadge');
        timerBadge = document.getElementById('timerBadge');
        timerContainer = document.getElementById('timerContainer');
        timerFill = document.getElementById('timerFill');
        shapePalette = document.getElementById('shapePalette');
        colorPalette = document.getElementById('colorPalette');
        milestoneOverlay = document.getElementById('milestoneOverlay');
        milestoneText = document.getElementById('milestoneText');
        milestoneSub = document.getElementById('milestoneSub');
        milestoneBtn = document.getElementById('milestoneBtn');
        penaltyEl = document.getElementById('penaltyDisplay');
    }

    function getLevelConfig(lvl) {
        if (lvl <= LEVEL_CONFIGS.length) {
            return LEVEL_CONFIGS[lvl - 1];
        }
        // Beyond defined levels: cycle with increasing difficulty
        const cycleIdx = (lvl - LEVEL_CONFIGS.length - 1) % 20;
        const base = LEVEL_CONFIGS[LEVEL_CONFIGS.length - 20 + cycleIdx];
        return {
            ...base,
            lit: Math.min(base.lit + 2, Math.floor(base.rows * base.cols * 0.35)),
            phase: lvl >= 300 ? '⭐ Legend' : lvl >= 200 ? '👑 Master' : '🎯 Expert',
            mirrorLength: base.mirrorLength || (lvl >= 50 ? Math.floor(Math.random() * 3) + 2 : null)
        };
    }

    function getTimerSeconds(lvl) {
        if (lvl < 100) return null;
        if (lvl <= 130) return 45;
        if (lvl <= 160) return 40;
        if (lvl <= 200) return 35;
        if (lvl <= 250) return 30;
        if (lvl <= 300) return 25;
        return Math.max(15, 25 - Math.floor((lvl - 300) * 0.05));
    }

    function getUnlockedShapes(lvl) {
        const s = ['square'];
        if (lvl >= 150) s.push('circle');
        if (lvl >= 200) s.push('triangle');
        if (lvl >= 300) s.push('star');
        return s;
    }

    function getUnlockedColors(lvl) {
        const c = ['green'];
        if (lvl >= 250) c.push('purple');
        if (lvl >= 300) c.push('orange');
        return c;
    }

    function init() {
        initDOM();
        loadProgress();
        setupPaletteListeners();
        milestoneBtn.addEventListener('click', closeMilestone);
        newLevel();
    }

    function newLevel() {
        won = false;
        failed = false;
        stopTimer();

        const t = themes[(level - 1) % themes.length];
        document.body.style.background = t.bg;
        orb1.style.background = t.o1;
        orb2.style.background = t.o2;

        const config = getLevelConfig(level);
        rows = config.rows;
        cols = config.cols;
        mirrorAxis = config.axis;

        // Get the explicit split from config
        if (mirrorAxis === 'v') {
            patternCols = config.patternCols;
            patternRows = rows;
        } else {
            patternRows = config.patternRows;
            patternCols = cols;
        }

        // Partial mirror setup
        mirrorLength = config.mirrorLength || null;
        if (mirrorLength) {
            const maxLen = mirrorAxis === 'v' ? rows : cols;
            mirrorLength = Math.min(mirrorLength, maxLen);
            mirrorStart = Math.floor(Math.random() * (maxLen - mirrorLength + 1));
        } else {
            mirrorStart = 0;
        }

        const playerColsCount = mirrorAxis === 'v' ? cols - patternCols : cols;
        const playerRowsCount = mirrorAxis === 'h' ? rows - patternRows : rows;
        const patternSize = patternRows * patternCols;
        const playerSize = playerRowsCount * playerColsCount;

        shapesUnlocked = getUnlockedShapes(level);
        colorsUnlocked = getUnlockedColors(level);
        selectedShape = 'square';
        selectedColor = 'green';

        // Init arrays
        patternData = [];
        playerData = [];
        for (let i = 0; i < patternSize; i++) {
            patternData.push({ on: false, shape: 'square', color: 'green' });
        }
        for (let i = 0; i < playerSize; i++) {
            playerData.push({ on: false, shape: 'square', color: 'green' });
        }

        // Calculate mirrorable indices - ONLY positions with valid mirror
        const mirrorableIndices = [];
        for (let i = 0; i < patternSize; i++) {
            const mi = getMirrorIdx(i, playerColsCount, playerRowsCount);
            if (mi >= 0 && mi < playerSize) {
                mirrorableIndices.push(i);
            }
        }

        // Light up cells
        const litCount = Math.max(1, Math.min(config.lit, mirrorableIndices.length));
        mirrorableIndices.sort(() => Math.random() - 0.5);

        for (let i = 0; i < litCount; i++) {
            const idx = mirrorableIndices[i];
            const shape = shapesUnlocked[Math.floor(Math.random() * shapesUnlocked.length)];
            const color = colorsUnlocked[Math.floor(Math.random() * colorsUnlocked.length)];
            patternData[idx] = { on: true, shape, color };
        }

        timerSeconds = getTimerSeconds(level);
        timerEnabled = timerSeconds !== null;

        updateUI(config.phase);
        render();

        if (timerEnabled) startTimer();
    }

    function getMirrorIdx(patternIdx, plCols, plRows) {
        const pRow = Math.floor(patternIdx / patternCols);
        const pCol = patternIdx % patternCols;

        if (mirrorAxis === 'v') {
            // Check if row is within partial mirror range
            if (mirrorLength) {
                if (pRow < mirrorStart || pRow >= mirrorStart + mirrorLength) {
                    return -1; // Not in mirror zone
                }
            }
            const mCol = patternCols - 1 - pCol;
            if (mCol >= plCols || pRow >= plRows) return -1;
            return pRow * plCols + mCol;
        } else {
            // Check if col is within partial mirror range
            if (mirrorLength) {
                if (pCol < mirrorStart || pCol >= mirrorStart + mirrorLength) {
                    return -1; // Not in mirror zone
                }
            }
            const mRow = patternRows - 1 - pRow;
            if (mRow >= plRows || pCol >= plCols) return -1;
            return mRow * plCols + pCol;
        }
    }

    function render() {
        gridEl.innerHTML = '';
        gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        // Add mirror line (partial or full)
        const lineEl = document.createElement('div');
        lineEl.className = `mirror-line ${mirrorAxis === 'v' ? 'vertical' : 'horizontal'}`;

        if (mirrorAxis === 'v') {
            lineEl.style.left = `calc(${(patternCols / cols) * 100}% - 1.5px)`;
            if (mirrorLength) {
                const cellHeight = 100 / rows;
                lineEl.style.top = `calc(${mirrorStart * cellHeight}% + 10px)`;
                lineEl.style.bottom = `calc(${(rows - mirrorStart - mirrorLength) * cellHeight}% + 10px)`;
            }
        } else {
            lineEl.style.top = `calc(${(patternRows / rows) * 100}% - 1.5px)`;
            if (mirrorLength) {
                const cellWidth = 100 / cols;
                lineEl.style.left = `calc(${mirrorStart * cellWidth}% + 10px)`;
                lineEl.style.right = `calc(${(cols - mirrorStart - mirrorLength) * cellWidth}% + 10px)`;
            }
        }
        gridEl.appendChild(lineEl);

        const playerColsCount = mirrorAxis === 'v' ? cols - patternCols : cols;
        const playerRowsCount = mirrorAxis === 'h' ? rows - patternRows : rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';

                let isPattern, idx, data;

                if (mirrorAxis === 'v') {
                    isPattern = col < patternCols;
                    if (isPattern) {
                        idx = row * patternCols + col;
                        data = patternData[idx];
                    } else {
                        idx = row * playerColsCount + (col - patternCols);
                        data = playerData[idx];
                    }
                } else {
                    isPattern = row < patternRows;
                    if (isPattern) {
                        idx = row * patternCols + col;
                        data = patternData[idx];
                    } else {
                        idx = (row - patternRows) * playerColsCount + col;
                        data = playerData[idx];
                    }
                }

                if (!data) continue;

                if (data.shape !== 'square') cell.classList.add(data.shape);

                if (isPattern) {
                    cell.classList.add('pattern');
                    if (data.on) {
                        cell.classList.add('on');
                        if (data.color !== 'green') cell.classList.add(`color-${data.color}`);
                    }
                } else {
                    cell.classList.add('player');
                    if (data.on) {
                        cell.classList.add('on');
                        if (data.color !== 'green') cell.classList.add(`color-${data.color}`);
                    }
                    cell.dataset.idx = idx;
                    cell.addEventListener('click', () => tapPlayer(idx));
                }

                if (won) cell.classList.add('won');
                if (failed && !isPattern) cell.classList.add('wrong');

                gridEl.appendChild(cell);
            }
        }
    }


    function tapPlayer(idx) {
        if (won || failed) return;

        const current = playerData[idx];
        const playerColsCount = mirrorAxis === 'v' ? cols - patternCols : cols;
        const playerRowsCount = mirrorAxis === 'h' ? rows - patternRows : rows;

        // Check if this is a valid mirror target
        let isCorrectTap = false;

        // Find if any pattern cell mirrors to this position
        for (let i = 0; i < patternData.length; i++) {
            if (patternData[i].on) {
                const mi = getMirrorIdx(i, playerColsCount, playerRowsCount);
                if (mi === idx) {
                    isCorrectTap = true;
                    break;
                }
            }
        }

        // Toggle the cell
        if (shapesUnlocked.length > 1 || colorsUnlocked.length > 1) {
            if (current.on && current.shape === selectedShape && current.color === selectedColor) {
                playerData[idx] = { on: false, shape: 'square', color: 'green' };
            } else {
                playerData[idx] = { on: true, shape: selectedShape, color: selectedColor };
            }
        } else {
            playerData[idx] = { on: !current.on, shape: 'square', color: 'green' };
        }

        // HARSH PENALTY for wrong tap - scales heavily with level, negative allowed!
        if (playerData[idx].on && !isCorrectTap) {
            // Penalty grows fast: level 1 = -5, level 50 = -30, level 100 = -60
            const penalty = 5 + Math.floor(level * 0.55);
            score -= penalty; // Negative scores are OK!
            showPenalty(-penalty);
        }

        render();
        checkWin();
    }

    function showPenalty(amount) {
        if (!penaltyEl) return;

        penaltyEl.textContent = amount;
        penaltyEl.classList.add('show');
        scoreEl.textContent = score;

        setTimeout(() => {
            penaltyEl.classList.remove('show');
        }, 800);
    }

    function checkWin() {
        const playerColsCount = mirrorAxis === 'v' ? cols - patternCols : cols;
        const playerRowsCount = mirrorAxis === 'h' ? rows - patternRows : rows;

        for (let i = 0; i < patternData.length; i++) {
            const p = patternData[i];
            const mi = getMirrorIdx(i, playerColsCount, playerRowsCount);

            if (mi < 0 || mi >= playerData.length) {
                if (p.on) return; // Can't mirror this, but it's lit = impossible
                continue;
            }

            const pl = playerData[mi];
            if (p.on !== pl.on) return;
            if (p.on && (p.shape !== pl.shape || p.color !== pl.color)) return;
        }

        won = true;
        stopTimer();

        const pts = 10 + Math.floor(level * 0.5);
        score += pts;

        render();
        statusEl.textContent = `✓ Perfect! +${pts} points`;
        statusEl.className = 'status-msg win';
        scoreEl.textContent = score;
        saveProgress();

        const nextLevel = level + 1;
        if (MILESTONES[nextLevel]) {
            setTimeout(() => showMilestone(nextLevel), 800);
        } else {
            setTimeout(() => {
                level++;
                statusEl.textContent = 'Tap to mirror the pattern';
                statusEl.className = 'status-msg';
                newLevel();
            }, 1000);
        }
    }

    function startTimer() {
        timerContainer.classList.add('active');
        timerBadge.style.display = 'flex';
        timerRemaining = timerSeconds;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timerRemaining -= 0.1;
            updateTimerDisplay();
            if (timerRemaining <= 0) failLevel();
        }, 100);
    }

    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        timerContainer.classList.remove('active');
    }

    function updateTimerDisplay() {
        const pct = (timerRemaining / timerSeconds) * 100;
        timerFill.style.width = pct + '%';
        timerFill.classList.remove('warning', 'danger');
        if (pct < 30) timerFill.classList.add('danger');
        else if (pct < 50) timerFill.classList.add('warning');
    }

    function failLevel() {
        failed = true;
        stopTimer();
        render();
        statusEl.textContent = '⏱️ Time\'s up! Retry...';
        statusEl.className = 'status-msg fail';
        setTimeout(() => {
            failed = false;
            statusEl.textContent = 'Tap to mirror the pattern';
            statusEl.className = 'status-msg';
            newLevel();
        }, 1500);
    }

    function updateUI(phase) {
        levelEl.textContent = level;
        scoreEl.textContent = score;
        phaseBadge.textContent = phase || getLevelConfig(level).phase;
        timerBadge.style.display = timerEnabled ? 'flex' : 'none';

        if (shapesUnlocked.length > 1) {
            shapePalette.classList.add('active');
            document.querySelectorAll('.shape-btn').forEach(btn => {
                const shape = btn.dataset.shape;
                btn.style.display = shapesUnlocked.includes(shape) ? 'flex' : 'none';
                btn.classList.toggle('selected', shape === selectedShape);
            });
        } else {
            shapePalette.classList.remove('active');
        }

        if (colorsUnlocked.length > 1) {
            colorPalette.classList.add('active');
            document.querySelectorAll('.color-btn').forEach(btn => {
                const color = btn.dataset.color;
                btn.style.display = colorsUnlocked.includes(color) ? 'flex' : 'none';
                btn.classList.toggle('selected', color === selectedColor);
            });
        } else {
            colorPalette.classList.remove('active');
        }
    }

    function setupPaletteListeners() {
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => { selectedShape = btn.dataset.shape; updateUI(); });
        });
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => { selectedColor = btn.dataset.color; updateUI(); });
        });
    }

    function showMilestone(lvl) {
        const m = MILESTONES[lvl];
        if (!m) return;
        milestoneText.textContent = m.text;
        milestoneSub.textContent = m.sub;
        milestoneOverlay.classList.add('active');
    }

    function closeMilestone() {
        milestoneOverlay.classList.remove('active');
        level++;
        statusEl.textContent = 'Tap to mirror the pattern';
        statusEl.className = 'status-msg';
        newLevel();
    }

    // ============ BACKEND SYNC ============

    function getCsrfToken() {
        const cookie = document.cookie.split('; ').find(c => c.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }

    async function saveProgress() {
        // Save to localStorage as backup
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({ level, score, savedAt: Date.now() }));
        } catch (e) { }

        // Save to backend
        try {
            await fetch('/relax/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ level, score })
            });
            fetchLeaderboard(); // Refresh leaderboard after save
        } catch (e) {
            console.log('Backend save failed, using localStorage');
        }
    }

    async function loadProgress() {
        // Try to load from backend first
        try {
            const response = await fetch('/relax/load/');
            const data = await response.json();
            if (data.success && data.found) {
                level = data.level;
                score = data.score;
                return;
            }
        } catch (e) {
            console.log('Backend load failed, falling back to localStorage');
        }

        // Fallback to localStorage
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                level = data.level || 1;
                score = data.score || 0;
            }
        } catch (e) { }
    }

    // ============ LEADERBOARD ============

    let lbToggle, lbPanel, lbClose, lbContent, lbRankText, userRankBadge;
    let resetBtn, confirmOverlay, confirmCancel, confirmYes;

    function initLeaderboard() {
        lbToggle = document.getElementById('lbToggle');
        lbPanel = document.getElementById('leaderboardPanel');
        lbClose = document.getElementById('lbClose');
        lbContent = document.getElementById('lbContent');
        lbRankText = document.getElementById('lbRankText');
        userRankBadge = document.getElementById('userRankBadge');
        resetBtn = document.getElementById('resetBtn');
        confirmOverlay = document.getElementById('confirmOverlay');
        confirmCancel = document.getElementById('confirmCancel');
        confirmYes = document.getElementById('confirmYes');

        if (lbToggle) lbToggle.addEventListener('click', () => {
            lbPanel.classList.add('open');
            fetchLeaderboard();
        });
        if (lbClose) lbClose.addEventListener('click', () => lbPanel.classList.remove('open'));

        if (resetBtn) resetBtn.addEventListener('click', () => confirmOverlay.classList.add('open'));
        if (confirmCancel) confirmCancel.addEventListener('click', () => confirmOverlay.classList.remove('open'));
        if (confirmYes) confirmYes.addEventListener('click', resetProgress);

        // Fetch initial leaderboard
        fetchLeaderboard();

        // Refresh leaderboard every 30 seconds
        setInterval(fetchLeaderboard, 30000);
    }

    async function fetchLeaderboard() {
        try {
            const response = await fetch('/relax/leaderboard/');
            const data = await response.json();
            if (data.success) {
                renderLeaderboard(data.leaderboard, data.user_rank, data.total_players);
            }
        } catch (e) {
            console.log('Leaderboard fetch failed');
        }
    }

    function renderLeaderboard(items, rank, total) {
        if (!lbContent) return;

        // Update rank badge
        if (userRankBadge) userRankBadge.textContent = `#${rank}`;
        if (lbRankText) lbRankText.textContent = `You are #${rank} of ${total} player${total !== 1 ? 's' : ''}`;

        // Calculate starting position (for display)
        let startPos = Math.max(1, rank - 3);

        lbContent.innerHTML = items.map((item, idx) => {
            const pos = startPos + idx;
            return `
                <div class="lb-item ${item.is_current_user ? 'current' : ''}">
                    <span class="lb-pos">#${pos}</span>
                    <span class="lb-name">${escapeHtml(item.name)}</span>
                    <span class="lb-score">⭐${item.score}</span>
                    <span class="lb-level">Lv.${item.level}</span>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function resetProgress() {
        confirmOverlay.classList.remove('open');

        try {
            const response = await fetch('/relax/reset/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                }
            });
            const data = await response.json();
            if (data.success) {
                level = 1;
                score = 0;
                localStorage.removeItem(SAVE_KEY);
                statusEl.textContent = '🔄 Progress reset! Starting fresh...';
                statusEl.className = 'status-msg';
                newLevel();
                fetchLeaderboard();
            }
        } catch (e) {
            console.log('Reset failed');
        }
    }

    // ============ INIT ============

    async function init() {
        initDOM();
        await loadProgress();
        setupPaletteListeners();
        milestoneBtn.addEventListener('click', closeMilestone);
        initLeaderboard();
        newLevel();
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
