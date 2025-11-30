// GLOBALS
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
let lastPoemUpdateTime = 0;
let poemDisplayStartTime = 0;
const POEM_DISPLAY_TIME = 3000;
const POEM_FADE_TIME = 500;


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60; 
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// RAIN
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

// CAR SPRITES
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

// CITY BACKGROUND
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

// DRAW RAIN SCENE


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

//RIVER SCENE


function drawCartoonSky() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
    skyGrad.addColorStop(0, "#c5ecff");
    skyGrad.addColorStop(1, "#a7e0ff");

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

    drawCartoonClouds();
    drawCartoonMountains();
    drawCartoonFields();
}

function drawCartoonClouds() {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    drawPuffyCloud(100, 70, 60);
    drawPuffyCloud(canvas.width * 0.65, 90, 75);
}

function drawPuffyCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y + size * 0.2, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x - size * 0.6, y + size * 0.3, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
}

function drawCartoonMountains() {
    ctx.fillStyle = "#8bc1a5";

    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.38);
    ctx.quadraticCurveTo(canvas.width * 0.2, canvas.height * 0.28,
                         canvas.width * 0.45, canvas.height * 0.38);
    ctx.quadraticCurveTo(canvas.width * 0.75, canvas.height * 0.28,
                         canvas.width, canvas.height * 0.38);
    ctx.lineTo(canvas.width, canvas.height * 0.45);
    ctx.lineTo(0, canvas.height * 0.45);
    ctx.closePath();
    ctx.fill();
}

function drawCartoonFields() {
    // Main grass field
    ctx.fillStyle = "#b9e38a";
    ctx.fillRect(0, canvas.height * 0.45, canvas.width, canvas.height * 0.1);

    // Bush line
    ctx.fillStyle = "#6ea05f";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.45);
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.quadraticCurveTo(x + 20, canvas.height * 0.42,
                             x + 40, canvas.height * 0.45);
    }
    ctx.lineTo(canvas.width, canvas.height * 0.45);
    ctx.closePath();
    ctx.fill();
}


function drawCartoonRiver() {
    const waterTop = canvas.height * 0.55;

    // Water gradient
    const grad = ctx.createLinearGradient(0, waterTop, 0, canvas.height);
    grad.addColorStop(0, "#8ed3f9");
    grad.addColorStop(0.5, "#6dbce8");
    grad.addColorStop(1, "#4a9ed2");

    ctx.fillStyle = grad;
    ctx.fillRect(0, waterTop, canvas.width, canvas.height - waterTop);

    const t = performance.now() * 0.001;
    drawFlowingRipples(waterTop, t);
}


function drawFlowingRipples(waterTop, t) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";

    const waveCount = 8;

    for (let i = 0; i < waveCount; i++) {
        const y = waterTop + 20 + i * 28;

        ctx.beginPath();

        for (let x = -200; x < canvas.width + 200; x += 20) {
            const drift = t * 30;              // sideways movement
            const curve = Math.sin((x + drift) * 0.015 + i) * 6;  // curved ripple
            const yy = y + curve;

            if (x === -200) ctx.moveTo(x, yy);
            else ctx.lineTo(x, yy);
        }

        ctx.stroke();
    }

    ctx.restore();
}

function drawCartoonRiverBank() {
    const bankY = canvas.height * 0.55;

    // Brown soil strip
    ctx.fillStyle = "#c28c42";
    ctx.fillRect(0, bankY - 5, canvas.width, 10);

    // Grass edge (wavy)
    ctx.fillStyle = "#89c66f";
    ctx.beginPath();
    ctx.moveTo(0, bankY - 5);
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.quadraticCurveTo(x + 15, bankY - 12,
                             x + 30, bankY - 5);
    }
    ctx.lineTo(canvas.width, bankY - 5);
    ctx.closePath();
    ctx.fill();
}


function drawRiver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCartoonSky();
    drawCartoonFields();
    drawCartoonRiverBank();
    drawCartoonRiver();
    updateUniversalPoem();
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

    if (lastPoemUpdateTime === 0) {
        lastPoemUpdateTime = now;
        poemDisplayStartTime = now;
        return;
    }

    const delta = now - lastPoemUpdateTime;
    lastPoemUpdateTime = now;

    if (poemFadeState === "fadeIn") {
        poemFadeProgress += delta / POEM_FADE_TIME;
        if (poemFadeProgress >= 1) {
            poemFadeProgress = 1;
            poemFadeState = "display";
            poemDisplayStartTime = now;
        }
    }
    else if (poemFadeState === "display") {
        if (now - poemDisplayStartTime >= POEM_DISPLAY_TIME) {
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
        return sceneCustomPoemEnabled[2] ? scenePoems[2] : underwaterPoemLines;
    }

    
    if (sceneCustomPoemEnabled[currentScene]) {
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
            sceneCustomPoemEnabled[currentScene] = true;

            
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
// SCENE-SPECIFIC POEM MANAGEMENT
// ==========================
let scenePoems = {
    0: [], 
    1: [], 
    2: [], 
    3: []  
};

let sceneCustomPoemEnabled = {
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
            sceneCustomPoemEnabled[i] = scenePoems[i].length >= 2;
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
        sceneCustomPoemEnabled[currentScene] = scenePoems[currentScene].length >= 2;
    }

   
    currentPoemIndex = 0;
    poemFadeState = "fadeIn";
    poemFadeProgress = 0;
    lastPoemUpdateTime = 0;
    poemDisplayStartTime = 0;
}

function resetToDefaultPoem() {
    if (confirm('Are you sure you want to reset to the default poem for this scene?')) {
        const sceneKey = `customPoem_scene_${currentScene}`;
        localStorage.removeItem(sceneKey);
        sceneCustomPoemEnabled[currentScene] = false;
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


function drawWaves() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);

    for (let x = 0; x < canvas.width; x++) {
        let y = canvas.height / 2 +
            Math.sin(x * 0.02 + performance.now() * 0.003) * 40;
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    updateUniversalPoem();
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
        setup: () => { },
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
    lastPoemUpdateTime = 0;
    poemDisplayStartTime = 0;

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
