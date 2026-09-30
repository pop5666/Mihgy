const PALETTES = [
    ["#000000", "#ff4d4d", "#4da6ff", "#ffcc00", "#ffffff"],
    ["#000000", "#2ed573", "#ffa502", "#ff4757", "#ffffff"],
    ["#000000", "#70a1ff", "#5352ed", "#ff6b81", "#ffffff"]
];

let levels = [];
for (let i = 1; i <= 50; i++) {
    const size = 16;
    const matrix = [];
    const palette = PALETTES[i % PALETTES.length];
    
    for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
            const dist = Math.abs(r - 8) + Math.abs(c - 8);
            if (dist < (i % 6) + 3) {
                row.push(( (r + c + i) % (palette.length - 1) ) + 1);
            } else {
                row.push(0);
            }
        }
        matrix.push(row);
    }

    levels.push({
        id: i,
        name: `ด่านที่ ${i}`,
        size: size,
        palette: palette,
        matrix: matrix,
        totalCells: matrix.flat().filter(x => x > 0).length
    });
}

let currentLevel = null;
let selectedColor = 1;
let userProgress = {};
let scale = 1;
let panX = 0, panY = 0;
let isDragging = false;
let startX, startY;

const canvas = document.getElementById('game-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const container = document.getElementById('canvas-container');

function init() {
    renderLevels();
    setupCanvasEvents();
}

function renderLevels() {
    const grid = document.getElementById('levels-grid');
    if (!grid) return;
    grid.innerHTML = '';

    levels.forEach(lvl => {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.onclick = () => startLevel(lvl);

        const thumb = document.createElement('canvas');
        thumb.className = 'level-thumb';
        thumb.width = lvl.size;
        thumb.height = lvl.size;
        const tCtx = thumb.getContext('2d');

        for (let r = 0; r < lvl.size; r++) {
            for (let c = 0; c < lvl.size; c++) {
                const val = lvl.matrix[r][c];
                if (val > 0) {
                    tCtx.fillStyle = lvl.palette[val];
                    tCtx.fillRect(c, r, 1, 1);
                }
            }
        }

        card.appendChild(thumb);
        card.innerHTML += `
            <div class="level-name">${lvl.name}</div>
            <div class="level-meta">${lvl.totalCells} ช่อง</div>
        `;
        grid.appendChild(card);
    });
}

function sortLevels(type) {
    if (type === 'easy') {
        levels.sort((a, b) => a.totalCells - b.totalCells);
    } else {
        levels.sort((a, b) => b.totalCells - a.totalCells);
    }
    renderLevels();
}

function startLevel(lvl) {
    currentLevel = lvl;
    userProgress = {};
    selectedColor = 1;
    
    document.getElementById('screen-main').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    document.getElementById('game-title').innerText = lvl.name;

    resetView();
    renderPalette();
    draw();
}

function resetView() {
    if (!container || !currentLevel) return;
    scale = Math.min(container.clientWidth, container.clientHeight) / (currentLevel.size * 20);
    panX = (container.clientWidth - currentLevel.size * 20 * scale) / 2;
    panY = (container.clientHeight - currentLevel.size * 20 * scale) / 2;
}

function renderPalette() {
    const bar = document.getElementById('palette-bar');
    if (!bar || !currentLevel) return;
    bar.innerHTML = '';

    currentLevel.palette.forEach((color, idx) => {
        if (idx === 0) return;

        const item = document.createElement('div');
        item.className = `color-item ${selectedColor === idx ? 'selected' : ''}`;
        item.style.backgroundColor = color;
        item.innerText = idx;
        item.onclick = () => {
            selectedColor = idx;
            renderPalette();
        };

        bar.appendChild(item);
    });
}

function draw() {
    if (!currentLevel || !ctx) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    const cellSize = 20;

    for (let r = 0; r < currentLevel.size; r++) {
        for (let c = 0; c < currentLevel.size; c++) {
            const targetVal = currentLevel.matrix[r][c];
            const key = `${r}_${c}`;
            const paintedVal = userProgress[key];

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.5;

            if (targetVal === 0) continue;

            if (paintedVal) {
                ctx.fillStyle = currentLevel.palette[paintedVal];
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

                ctx.fillStyle = '#94a3b8';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(targetVal, c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
            }
        }
    }

    ctx.restore();
}

function setupCanvasEvents() {
    if (!container) return;
    container.addEventListener('mousedown', e => {
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
    });

    window.addEventListener('mousemove', e => {
        if (isDragging) {
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            draw();
        }
    });

    window.addEventListener('mouseup', () => isDragging = false);

    container.addEventListener('wheel', e => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        scale *= zoomFactor;
        draw();
    }, { passive: false });
}

function exitGame() {
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-main').classList.add('active');
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    document.getElementById('view-levels').style.display = tab === 'levels' ? 'flex' : 'none';
    document.getElementById('view-freedraw').style.display = tab === 'freedraw' ? 'flex' : 'none';
    document.getElementById('view-gallery').style.display = tab === 'gallery' ? 'grid' : 'none';
    document.getElementById('view-stats').style.display = tab === 'stats' ? 'block' : 'none';
}

function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleAudio() { alert('เปิด/ปิด เสียงผ่อนคลาย'); }

window.onload = init;
