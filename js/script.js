// ==========================
// GLOBALS
// ==========================
const canvas = document.getElementById("waterCanvas");
const ctx = canvas.getContext("2d");

const poemText = document.getElementById("poemText");
const bgAudio = document.getElementById("bgAudio");
const sceneName = document.getElementById("sceneName");

let currentScene = 0;
let animateScene = null;

let cityBuildings = [];
let cityReady = false;

let clouds = [];
let cloudReady = false;

let userInteracted = false;
let currentPoemIndex = 0;
let poemFadeState = "fadeIn";
let poemFadeProgress = 0;
let lastUpdate = 0;
let startTime = 0;
const POEM_DISPLAY_TIME = 2000;
const POEM_FADE_TIME = 500;


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60; 
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ==========================
// RAIN
// ==========================
const rainDrops = [];
const RAIN_DROP_COUNT = 400;

function initRain() {
    rainDrops.length = 0;
    for (let i = 0; i < RAIN_DROP_COUNT; i++) {
        rainDrops.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 5 + Math.random() * 18,
            length: 10 + Math.random() * 10
        });
    }
}

// ==========================
// CAR SPRITES
// ==========================
let carSheet;
let sideCars = [];
let cars = [];

let CAR_COLS = 4;
let CAR_ROWS = 2;

let CAR_W = 0;
let CAR_H = 0;

let lastCarSpawn = 0;


let carImages = [];
let carFiles = [
    "assets/cars/BlueCarR.png",
    "assets/cars/GreenCarNew.png",
    "assets/cars/TruckNewB.png",
    "assets/cars/CabNewB.png"
];


function loadCarSprites() {
    carImages = [];

    for (let src of carFiles) {
        let img = new Image();
        img.src = src;
        carImages.push(img);
    }
}
loadCarSprites();


function spawnCar() {
    if (carImages.length === 0) return;

    const img = carImages[Math.floor(Math.random() * carImages.length)];

    const goingRight = Math.random() > 0.5;
    const scale = 0.15;

    const w = img.width * scale;
    const h = img.height * scale;

    
    const laneLeftToRight = canvas.height - 150;   
    const laneRightToLeft = canvas.height - 80;   

    
    const y = goingRight ? laneLeftToRight : laneRightToLeft;

    cars.push({
        img,
        x: goingRight ? -w - 50 : canvas.width + 50,
        y: y + (Math.random() * 8 - 4),  
        w,
        h,
        dir: goingRight ? 1 : -1,
        speed: 3 + Math.random() * 2
    });
}


function drawCar(c) {
    ctx.save();
    ctx.translate(c.x, c.y);

    if (c.dir === -1) {
        ctx.scale(-1, 1); 
    }

    ctx.drawImage(c.img, -c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
}



function updateCars() {
    
    if (performance.now() - lastCarSpawn > 2500 + Math.random() * 2000) {
        spawnCar();
        lastCarSpawn = performance.now();
    }

    
    for (let c of cars) {
        c.x += c.speed * c.dir;
    }

    
    cars = cars.filter(c => c.x > -400 && c.x < canvas.width + 400);

    
    for (let c of cars) {
        drawCar(c);
    }
}

// ==========================
// CITY BACKGROUND
// ==========================
function drawCityBackground() {

    // BUILDINGS
    if (!cityReady) {
        cityBuildings = [];

        for (let i = 0; i < 10; i++) {
            let w = 140 + Math.random() * 120;
            let h = 220 + Math.random() * 200;
            let x = i * (canvas.width / 10);
            let y = canvas.height - h - 150;

            let windows = [];
            let rows = Math.floor(h / 25);
            let cols = Math.floor(w / 22);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.random() < 0.35) {
                        windows.push({
                            x: x + 10 + c * 22,
                            y: y + 10 + r * 25
                        });
                    }
                }
            }

            cityBuildings.push({ x, y, w, h, windows });
        }

        cityReady = true;
    }

    // SKY + CLOUDS
    if (!cloudReady) {
        clouds = [];
        for (let i = 0; i < 25; i++) {
            clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height * 0.6),
                r: 120 + Math.random() * 180,
                a: 0.08 + Math.random() * 0.1,
                speed: 0.05 + Math.random() * 0.1
            });
        }
        cloudReady = true;
    }

    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#14161c");
    sky.addColorStop(0.6, "#1c1f26");
    sky.addColorStop(1, "#2b2e38");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let c of clouds) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(20,20,30,${c.a})`;
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();

        c.x += c.speed;
        if (c.x - c.r > canvas.width) c.x = -c.r;
    }

    // BUILDINGS
    for (let b of cityBuildings) {
        ctx.fillStyle = "#0f1116";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.fillStyle = "rgba(255,255,180,0.85)";
        for (let w of b.windows) {
            ctx.fillRect(w.x, w.y, 8, 12);
        }
    }

    // ROAD
    ctx.fillStyle = "#1a1a1d";
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 25]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 75);
    ctx.lineTo(canvas.width, canvas.height - 75);
    ctx.stroke();
    ctx.setLineDash([]);

    // WINDOW BORDER
    ctx.strokeStyle = "rgba(200,200,255,0.08)";
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// ==========================
// DRAW RAIN SCENE
// ==========================


function drawRain() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCityBackground();
    updateCars();

    ctx.strokeStyle = "rgba(170,200,255,0.45)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let drop of rainDrops) {
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);

        drop.y += drop.speed;
        if (drop.y > canvas.height) {
            drop.y = -20;
            drop.x = Math.random() * canvas.width;
        }
    }
    ctx.stroke();


    updateUniversalPoem();
}

// ==========================
// OTHER SCENES
// ==========================
function drawRiver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ─── BACKGROUND SKY (warm sunrise gradient) ───
    drawSunriskySky();

    // ─── RIVER WATER & REFLECTIONS ───
    drawRiverWater();

    // // ─── ANIMATED PARTICLES (leaves, mist) ───
    // drawFloatingParticles();

    // // ─── FOREGROUND BANKS & VEGETATION ───
    // drawRiverBanks();
    updateUniversalPoem();

}

//drawSubriseSky
function drawSunriskySky() {
    const t = performance.now() * 0.0002;

    // ─ MAIN SKY GRADIENT (smooth sunrise) ─
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.52);

    skyGrad.addColorStop(0.00, '#350808');      
    skyGrad.addColorStop(0.22, '#6e1a0a');      
    skyGrad.addColorStop(0.45, '#c2410c');     
    skyGrad.addColorStop(0.68, '#f59e0b');     
    skyGrad.addColorStop(0.85, '#f4d35e');      
    skyGrad.addColorStop(1.00, '#fff3bc');     

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.52);

    
    const sunX = canvas.width * 0.75;
    const sunY = canvas.height * 0.13;
    const sunRadius = Math.max(40, Math.min(70, canvas.width * 0.05));

    // Outer glow
    const sunGlow = ctx.createRadialGradient(
        sunX, sunY, sunRadius * 0.3,
        sunX, sunY, sunRadius * 4.5
    );
    sunGlow.addColorStop(0, 'rgba(255, 200, 80, 0.85)');
    sunGlow.addColorStop(0.4, 'rgba(255, 170, 50, 0.35)');
    sunGlow.addColorStop(1, 'rgba(255, 140, 30, 0)');

    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = 'rgba(255, 220, 120, 0.97)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // ─ CLOUDS (improved shapes + movement) ─
    ctx.globalAlpha = 0.25;

    for (let i = 0; i < 6; i++) {
        const speed = 12 + i * 4;
        const sway = Math.sin(t * (0.8 + i * 0.15) + i) * 12;
        const drift = Math.cos(t * (0.5 + i * 0.12) + i) * 6;

        const cloudX = (canvas.width * (0.05 + i * 0.22) + t * speed) % (canvas.width + 300);
        const cloudY = canvas.height * (0.05 + i * 0.03) + sway + drift;

        ctx.globalAlpha = 0.12 + i * 0.03;
        drawCloud(cloudX, cloudY, 75 + i * 14);
    }

    ctx.globalAlpha = 1;
}


function drawCloud(x, y, size) {
    ctx.fillStyle = 'rgba(255, 200, 140, 0.18)';

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.25, size * 0.75, 0, Math.PI * 2);
    ctx.arc(x - size * 0.6, y - size * 0.15, size * 0.65, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y + size * 0.2, size * 0.55, 0, Math.PI * 2);
    ctx.arc(x - size * 0.3, y + size * 0.25, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
}

// ─────────────────────────────────────────────────────────
// RIVER
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// DRAW RIVER WATER
// ─────────────────────────────────────────────
function drawRiverWater() {
    const waterTopY = canvas.height * 0.48;
    const t = performance.now() * 0.0005;

    // ─ 1. VERY SOFT SKY REFLECTION (evened out) ─
    const reflGrad = ctx.createLinearGradient(0, waterTopY, 0, waterTopY + canvas.height * 0.18);
    reflGrad.addColorStop(0.00, 'rgba(255, 200, 120, 0.18)');
    reflGrad.addColorStop(0.50, 'rgba(255, 170, 90, 0.10)');
    reflGrad.addColorStop(1.00, 'rgba(120, 150, 180, 0.05)');

    ctx.fillStyle = reflGrad;
    ctx.fillRect(0, waterTopY, canvas.width, canvas.height * 0.18);

    // ─ 2. MAIN WATER (very smooth fade) ─
    const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, canvas.height);
    waterGrad.addColorStop(0.00, 'rgba(110, 170, 200, 0.33)');
    waterGrad.addColorStop(0.25, 'rgba(80, 135, 170, 0.40)');
    waterGrad.addColorStop(0.55, 'rgba(50, 95, 140, 0.50)');
    waterGrad.addColorStop(0.85, 'rgba(30, 60, 100, 0.65)');
    waterGrad.addColorStop(1.00, 'rgba(20, 40, 75, 0.75)');

    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterTopY, canvas.width, canvas.height - waterTopY);

    // ─ 3. VERY subtle horizontal movement (even, not bright) ─
    drawEvenBands(waterTopY, t);

    // ─ 4. Much softer waves ─
    drawEvenWaves(waterTopY, t);

    // ─ 5. VERY soft sparkles ─
    drawSoftSparkles(waterTopY, t);
}


// ─────────────────────────────────────────────
// EVENED HORIZONTAL BANDS (minimal contrast)
// ─────────────────────────────────────────────
function drawEvenBands(waterY, t) {
    ctx.save();

    for (let i = 0; i < 5; i++) {
        const y = waterY + i * 25 + Math.sin(t * 0.5 + i) * 2;

        const g = ctx.createLinearGradient(0, y, canvas.width, y);
        g.addColorStop(0.0, 'rgba(255,255,255,0.02)');
        g.addColorStop(0.5, 'rgba(255,255,255,0)');
        g.addColorStop(1.0, 'rgba(255,255,255,0.02)');

        ctx.fillStyle = g;
        ctx.fillRect(0, y - 2, canvas.width, 4);
    }

    ctx.restore();
}


// ─────────────────────────────────────────────
// EVENED WAVES (quiet + blended)
// ─────────────────────────────────────────────
function drawEvenWaves(waterY, t) {
    ctx.save();
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';

    for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();

        const freq = 0.006 + layer * 0.002;
        const speed = 0.45 + layer * 0.2;
        const amp = 3 + Math.sin(t * 0.3 + layer) * 1;

        ctx.strokeStyle = `rgba(255,255,255,${0.04 + layer * 0.02})`;

        for (let x = 0; x <= canvas.width; x += 7) {
            const perspective = 0.4 + (x / canvas.width) * 0.6;

            const y =
                waterY +
                Math.sin(x * freq + t * speed) * amp * perspective +
                Math.cos(x * freq * 1.7 + t * speed * 0.7) * (amp * 0.4) * perspective;

            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        ctx.stroke();
    }

    ctx.restore();
}


// ─────────────────────────────────────────────
// SUPER SOFT SPARKLES (barely noticeable)
// ─────────────────────────────────────────────
function drawSoftSparkles(waterY, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.35;

    for (let i = 0; i < 12; i++) {
        const x =
            (canvas.width * (0.2 + i * 0.05) +
                t * 26 * (0.5 + Math.sin(i * 0.4))) %
            canvas.width;

        const baseY = waterY + canvas.height * (0.045 + Math.sin(i * 0.25) * 0.02);
        const y = baseY + Math.sin(t * 1.0 + i * 0.6) * 3;

        const size = 1 + Math.sin(t * 1.3 + i * 0.3) * 0.8;

        ctx.fillStyle = 'rgba(255,230,170,0.75)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}




// ==========================
// UNDERWATER OCEAN + FISH
// ==========================



let fishImagePaths = [
    { src: "images/fish.png", dir: 1 },
    { src: "images/fish2.png", dir: -1 },
    { src: "images/fish3.png", dir: -1 },
    { src: "images/fish5.png", dir: -1 }

];

let fishImages = [];

function loadFishImages() {
    fishImages = [];

    for (let f of fishImagePaths) {
        const img = new Image();
        img.src = f.src;

        fishImages.push({
            img: img,
            orgDir: f.dir
        });
    }
}
loadFishImages();








let underwaterVideo = document.createElement("video");
underwaterVideo.src = "images/ocean.mp4";
underwaterVideo.loop = true;
underwaterVideo.muted = true;
underwaterVideo.autoplay = true;
underwaterVideo.playsInline = true;

let underwaterVideoReady = false;

underwaterVideo.addEventListener("canplay", () => {
    underwaterVideoReady = true;
    underwaterVideo.play();
});





let fishList = [];
let FISH_COUNT = 10;

function initFish() {
    fishList = [];

    for (let i = 0; i < FISH_COUNT; i++) {
        const fishData = fishImages[Math.floor(Math.random() * fishImages.length)];

        fishList.push({
            img: fishData.img,
            orgDir: fishData.orgDir,
            moveDir: Math.random() < 0.5 ? 1 : -1,
            x: Math.random() * canvas.width,
            y: canvas.height * 0.4 + Math.random() * canvas.height * 0.4,
            speed: 0.5 + Math.random() * 1.5,
            size: 40 + Math.random() * 40
        });
    }
}




function drawFish(f) {
    ctx.save();
    ctx.translate(f.x, f.y);

    let flip = (f.moveDir === f.orgDir) ? 1 : -1;
    ctx.scale(flip, 1);

    ctx.drawImage(
        f.img,
        -f.size / 2,
        -f.size / 2,
        f.size,
        f.size
    );

    ctx.restore();
}
function updateFish() {
    for (let f of fishList) {
        f.x += f.speed * f.moveDir;

        if (f.x > canvas.width + 60)
            f.x = -60;
        if (f.x < -60)
            f.x = canvas.width + 60;
    }
}
// ==========================
// UNDERWATER POEM 
// ==========================
let underwaterPoemLines = [
    "In the deep blue silence,",
    "where light dances with shadow,",
    "Whispers of the ancient currents,",
    "carry stories untold.",
    "Fish dart like living jewels,",
    "in liquid cathedral halls,",
    "Each flicker of fin and scale,",
    "a prayer to the depths.",
    "The weight of oceans above,",
    "holds dreams in gentle pressure,",
    "And in this watery world,",
    "we find our own reflection."
];



// ==========================
// CUSTOM POEM FUNCTIONALITY
// ==========================
let customPoemEnabled = false;
let userPoemLines = [];


const poemMaker = document.getElementById('poemMaker');
const addPoemBtn = document.getElementById('addPoemBtn');
const closemaker = document.querySelector('.close');
const customPoemTextarea = document.getElementById('customPoem');
const savePoemBtn = document.getElementById('savePoem');
const resetPoemBtn = document.getElementById('resetPoem');


addPoemBtn.addEventListener('click', openpoemMaker);
closemaker.addEventListener('click', closepoemMaker);
savePoemBtn.addEventListener('click', saveCustomPoem);
resetPoemBtn.addEventListener('click', resetToDefaultPoem);


window.addEventListener('click', (e) => {
    if (e.target === poemMaker) {
        closepoemMaker();
    }
});

// ==========================
// UNIVERSAL POEM ANIMATION
// ==========================
function updateUniversalPoem() {
    const now = performance.now();

    if (lastUpdate === 0) {
        lastUpdate = now;
        startTime = now;
        return;
    }

    const delta = now - lastUpdate;
    lastUpdate = now;

    if (poemFadeState === "fadeIn") {
        poemFadeProgress += delta / POEM_FADE_TIME;
        if (poemFadeProgress >= 1) {
            poemFadeProgress = 1;
            poemFadeState = "display";
            startTime = now;
        }
    }
    else if (poemFadeState === "display") {
        if (now - startTime >= POEM_DISPLAY_TIME) {
            poemFadeState = "fadeOut";
            poemFadeProgress = 1;
        }
    }
    else if (poemFadeState === "fadeOut") {
        poemFadeProgress -= delta / POEM_FADE_TIME;
        if (poemFadeProgress <= 0) {
            poemFadeProgress = 0;
            currentPoemIndex += 2;

            
            const currentPoemLines = getCurrentPoemLines();

            if (currentPoemIndex >= currentPoemLines.length) {
                currentPoemIndex = 0;
            }
            poemFadeState = "fadeIn";
        }
    }

    poemText.style.opacity = poemFadeProgress;

    
    const currentPoemLines = getCurrentPoemLines();
    const line1 = currentPoemLines[currentPoemIndex] || "";
    const line2 = currentPoemLines[currentPoemIndex + 1] || "";
    poemText.innerHTML = `${line1}<br>${line2}`;
}

function getCurrentPoemLines() {
    
    if (currentScene === 2) {
        return CustomPoemList[2] ? scenePoems[2] : underwaterPoemLines;
    }

    
    if (CustomPoemList[currentScene]) {
        return scenePoems[currentScene];
    } else {
        
        const defaultPoem = scenes[currentScene].poem;
        return defaultPoem.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
}

function openpoemMaker() {
    poemMaker.style.display = 'block';

   
    const sceneKey = `customPoem_scene_${currentScene}`;
    const savedPoem = localStorage.getItem(sceneKey);

    if (savedPoem) {
        customPoemTextarea.value = savedPoem;
    } else {
        
        if (currentScene === 2) { 
            customPoemTextarea.value = underwaterPoemLines.join('\n');
        } else {
            customPoemTextarea.value = scenes[currentScene].poem;
        }
    }

    
    const sceneTitles = {
        0: "Rain Scene Poem",
        1: "River Scene Poem",
        2: "Ocean Scene Poem",
        3: "Waves Scene Poem"
    };
    document.querySelector('.maker-content h2').textContent = sceneTitles[currentScene] + " - Write Your Poem";
}

function closepoemMaker() {
    poemMaker.style.display = 'none';
}

function saveCustomPoem() {
    const poemText = customPoemTextarea.value.trim();

    if (poemText) {
        
        const userLines = poemText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (userLines.length >= 2) {
            
            const sceneKey = `customPoem_scene_${currentScene}`;
            localStorage.setItem(sceneKey, poemText);

            
            scenePoems[currentScene] = userLines;
            CustomPoemList[currentScene] = true;

            
            updateScenePoem();

            alert(`Your custom poem has been saved for the ${scenes[currentScene].name} scene!`);
            closepoemMaker();
        } else {
            alert('Please write at least 2 lines for your poem.');
        }
    } else {
        alert('Please write a poem before saving.');
    }
}
// ==========================
// SCENE-SPECIFIC POEM 
// ==========================
let scenePoems = {
    0: [], 
    1: [], 
    2: [], 
    3: []  
};

let CustomPoemList = {
    0: false,
    1: false,
    2: false,
    3: false
};

function loadAllCustomPoems() {
    for (let i = 0; i < scenes.length; i++) {
        const sceneKey = `customPoem_scene_${i}`;
        const savedPoem = localStorage.getItem(sceneKey);
        if (savedPoem) {
            scenePoems[i] = savedPoem.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            CustomPoemList[i] = scenePoems[i].length >= 2;
        }
    }
}

function updateScenePoem() {
    const sceneKey = `customPoem_scene_${currentScene}`;
    const savedPoem = localStorage.getItem(sceneKey);

    if (savedPoem) {
        scenePoems[currentScene] = savedPoem.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        CustomPoemList[currentScene] = scenePoems[currentScene].length >= 2;
    }

   
    currentPoemIndex = 0;
    poemFadeState = "fadeIn";
    poemFadeProgress = 0;
    lastUpdate = 0;
    startTime = 0;
}

function resetToDefaultPoem() {
    if (confirm('Are you sure you want to reset to the default poem for this scene?')) {
        const sceneKey = `customPoem_scene_${currentScene}`;
        localStorage.removeItem(sceneKey);
        CustomPoemList[currentScene] = false;
        scenePoems[currentScene] = [];
        customPoemTextarea.value = '';

        updateScenePoem();
        alert('Reset to default poem for this scene!');
        closepoemMaker();
    }
}


function loadCustomPoem() {
    const savedPoem = localStorage.getItem('customUnderwaterPoem');
    if (savedPoem) {
        userPoemLines = savedPoem.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        customPoemEnabled = userPoemLines.length >= 2;
    }
}




function drawUnderwater() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (underwaterVideoReady) {
        ctx.drawImage(underwaterVideo, 0, 0, canvas.width, canvas.height);
    }

    updateFish();
    for (let f of fishList) drawFish(f);


    updateUniversalPoem();

    if (fishList.length === 0) {
        initFish();
    }
}











canvas.addEventListener("click", (e) => {

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;


    for (let i = fishList.length - 1; i >= 0; i--) {
        const f = fishList[i];


        const left = f.x - f.size / 2;
        const right = f.x + f.size / 2;
        const top = f.y - f.size / 2;
        const bottom = f.y + f.size / 2;


        if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
            fishList.splice(i, 1);
            break;
        }
    }
});


//Draw Waves------------



let wavesVideo = document.createElement("video");
wavesVideo.src = "images/waves2.mov"; 
wavesVideo.loop = true;
wavesVideo.muted = true;
wavesVideo.autoplay = true;
wavesVideo.playsInline = true;

let wavesVideoReady = false;

wavesVideo.addEventListener("canplay", () => {
    wavesVideoReady = true;
    wavesVideo.play(); 
});


wavesVideo.load();



// function drawWaves() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.strokeStyle = "rgba(255,255,255,0.8)";
//     ctx.lineWidth = 2;

//     ctx.beginPath();
//     ctx.moveTo(0, canvas.height / 2);

//     for (let x = 0; x < canvas.width; x++) {
//         let y = canvas.height / 2 +
//             Math.sin(x * 0.02 + performance.now() * 0.003) * 40;
//         ctx.lineTo(x, y);
//     }
//     ctx.stroke();
//     updateUniversalPoem();
// }
// ==========================
// SIMPLE WAVES SCENE WITH VIDEO
// ==========================

function drawWaves() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    
    if (wavesVideoReady) {
        
        ctx.drawImage(wavesVideo, 0, 0, canvas.width, canvas.height);
        
       
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        
        videoFailImage();
    }
    
    
    updateUniversalPoem();
}

function videoFailImage() {
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Waves Video Loading...', canvas.width / 2, canvas.height / 2);
}

// ==========================
// SCENES SETUP
// ==========================
const scenes = [
    {
        name: "Rain",
        poem: "Each drop holds a memory,\nfinding its way home.",
        audio: "audio/rain.mp3",
        setup: initRain,
        draw: drawRain
    },
    {
        name: "River",
        poem: "Flowing gently with time,\ncarrying echoes of the earth.",
        audio: "audio/river.mp3",
        setup: () => { },
        draw: drawRiver
    },
    {
        name: "Ocean",
        poem: "",
        audio: "audio/ocean.mp3",
        setup: function () {
            initFish();
            currentPoemIndex = 0;
            poemFadeState = "fadeIn";
            poemFadeProgress = 0;

        },
        draw: drawUnderwater
    },
    {
        name: "Waves",
        poem: "Rise, fall, return again —\nthe rhythm of being.",
        audio: "audio/waves.mp3",
        setup: function() {
            
            currentPoemIndex = 0;
            poemFadeState = "fadeIn";
            poemFadeProgress = 0;
            
            
            if (wavesVideoReady) {
                wavesVideo.currentTime = 0;
                wavesVideo.play();
            }
        },
        draw: drawWaves
    }
];
loadAllCustomPoems();

document.body.addEventListener("click", () => {
    if (!userInteracted) {
        userInteracted = true;
        bgAudio.src = scenes[currentScene].audio;
        bgAudio.play().catch(() => { });
    }
});


// ==========================
// SCENE LOADING
// ==========================
function loadScene(index) {
    const s = scenes[index];

    sceneName.textContent = s.name;

    
    poemText.style.fontFamily = "'Great Vibes', cursive";
    poemText.style.fontSize = "50px";
    poemText.style.fontWeight = "300";
    poemText.style.lineHeight = "1.6";
    poemText.style.textAlign = "center";

    
    poemText.style.transition = "none"; 
    currentPoemIndex = 0;
    poemFadeState = "fadeIn";
    poemFadeProgress = 0;
    lastUpdate = 0;
    startTime = 0;

    if (userInteracted) {
        bgAudio.src = s.audio;
        bgAudio.play().catch(() => { });
    }

    s.setup();
    animateScene = s.draw;
}
// ==========================
// BUTTONS
// ==========================
document.getElementById("nextScene").onclick = () => {
    currentScene = (currentScene + 1) % scenes.length;
    loadScene(currentScene);
};

document.getElementById("prevScene").onclick = () => {
    currentScene = (currentScene - 1 + scenes.length) % scenes.length;
    loadScene(currentScene);
};

// ==========================
// MAIN LOOP
// ==========================
function animate() {
    if (animateScene) animateScene();
    requestAnimationFrame(animate);
}

animate();
loadScene(0);
