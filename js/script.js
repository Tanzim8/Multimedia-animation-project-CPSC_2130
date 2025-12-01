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
    const scale = 0.12;

    const w = img.width * scale;
    const h = img.height * scale;

    // --- ROAD ALIGNMENT (PERFECT) ---
    const roadHeight = 120;
    const roadTop = canvas.height - roadHeight;

    // Where car wheels should touch
    const groundY = canvas.height - 35;

    // Two proper road lanes
    const laneRight = groundY - 20;  // bottom lane
    const laneLeft  = groundY - 70;  // top lane

    // Determine direction
    const goingRight = Math.random() > 0.5;

    const y = goingRight ? laneRight : laneLeft;

    cars.push({
        img,
        x: goingRight ? -w - 60 : canvas.width + 60,
        y,
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



// ---------------------------------------------------------
// CITY SKYLINE SPRITE
// ---------------------------------------------------------
let skylineImg = new Image();
skylineImg.src = "assets/buildings/buildings.png"; 
let skylineReady = false;

skylineImg.onload = () => {
    skylineReady = true;
};


// ---------------------------------------------------------
// CITY BACKGROUND (Sky, Clouds, Skyline, Road)
// ---------------------------------------------------------
function drawCityBackground() {

    // --- SKY ---
    let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#14161c");
    sky.addColorStop(0.6, "#1c1f26");
    sky.addColorStop(1, "#2b2e38");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- CLOUDS ---
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
    for (let c of clouds) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(20,20,30,${c.a})`;
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        c.x += c.speed;
        if (c.x - c.r > canvas.width) c.x = -c.r;
    }

    // ===== FIXED ROAD HEIGHT =====
    const roadHeight = 120;

    // --- SKYLINE SPRITE ---
    if (skylineReady) {
        const desiredHeight = canvas.height * 0.8;
        const scale = desiredHeight / skylineImg.height;
        const spriteWidth = skylineImg.width * scale;

        // ===== FIXED SKYLINE ALIGNMENT =====
        const y = canvas.height - roadHeight - (desiredHeight * .88);

        for (let x = 0; x < canvas.width; x += spriteWidth) {
            ctx.drawImage(skylineImg, x, y, spriteWidth, desiredHeight);
        }
    }

    // --- ROAD ---
    ctx.fillStyle = "#1a1a1d";
    ctx.fillRect(0, canvas.height - roadHeight, canvas.width, roadHeight);

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 4;
    ctx.setLineDash([30, 25]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - roadHeight / 2);
    ctx.lineTo(canvas.width, canvas.height - roadHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- BORDER ---
    ctx.strokeStyle = "rgba(200,200,255,0.08)";
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}



// ---------------------------------------------------------
// DRAW RAIN SCENE (Final render)
// ---------------------------------------------------------
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
// ---------------------------------------------------------
// SKY
// ---------------------------------------------------------

function drawCartoonSky() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.45);
    skyGrad.addColorStop(0, "#c5ecff");
    skyGrad.addColorStop(1, "#a7e0ff");

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.45);

    drawCloudLayer();
    drawBackMountains();
}


// ---------------------------------------------------------
// CLOUDS
// ---------------------------------------------------------

function drawBetterCloud(x, y, size) {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();

    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.9, y + size * 0.1, size * 0.75, 0, Math.PI * 2);
    ctx.arc(x - size * 0.9, y + size * 0.1, size * 0.65, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.3, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x - size * 0.4, y - size * 0.25, size * 0.55, 0, Math.PI * 2);

    ctx.fill();
}

function drawCloudLayer() {
    const t = performance.now() * 0.0001;

    for (let i = 0; i < 6; i++) {
        const x = (i * 300 + t * (20 + i * 5)) % (canvas.width + 200) - 100;
        const y = canvas.height * (0.10 + Math.sin(i * 0.5) * 0.03);
        const size = 50 + i * 10;

        drawBetterCloud(x, y, size);
    }
}


// ---------------------------------------------------------
// BLUE MOUNTAINS
// ---------------------------------------------------------

let mountainBlue = new Image();
mountainBlue.src = "assets/Mountain/mountains.png";
let mountainBlueReady = false;

mountainBlue.onload = () => { mountainBlueReady = true; };

function drawBackMountains() {
    if (!mountainBlueReady) return;

    const spriteH = mountainBlue.height;
    const desiredH = canvas.height * 0.55;
    const scale = desiredH / spriteH;

    const spriteW = mountainBlue.width * scale;

    // ✔ LOWERED so it touches the riverbank
    const y = canvas.height * 0.65 - desiredH;

    for (let x = 0; x < canvas.width; x += spriteW) {
        ctx.drawImage(mountainBlue, x, y, spriteW, desiredH);
    }
}



// ---------------------------------------------------------
// FIELDS (foreground)
// ---------------------------------------------------------

function drawCartoonFields() {
    ctx.fillStyle = "#b9e38a";
    ctx.fillRect(0, canvas.height * 0.45, canvas.width, canvas.height * 0.1);
}


// ---------------------------------------------------------
// RIVER BANK
// ---------------------------------------------------------

function drawCartoonRiverBank() {
    const bankY = canvas.height * 0.55;

    // Brown soil
    ctx.fillStyle = "#c28c42";
    ctx.fillRect(0, bankY - 5, canvas.width, 10);

    // Grass edge
    ctx.fillStyle = "#89c66f";
    ctx.beginPath();
    ctx.moveTo(0, bankY - 5);
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.quadraticCurveTo(x + 15, bankY - 12, x + 30, bankY - 5);
    }
    ctx.lineTo(canvas.width, bankY - 5);
    ctx.closePath();
    ctx.fill();
}


// ---------------------------------------------------------
// WATER + WAVES
// ---------------------------------------------------------

function drawCartoonRiver() {
    const waterTop = canvas.height * 0.55;

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

    ctx.strokeStyle = "rgba(180, 250, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const waves = 10;
    for (let i = 0; i < waves; i++) {
        const y = waterTop + 20 + i * 26;
        const speed = 45 + i * 10;
        const amp = 8 + i * 0.5;
        const freq = 0.018 + i * 0.0015;

        ctx.beginPath();
        for (let x = -200; x < canvas.width + 200; x += 10) {
            const drift = t * speed;
            const wave =
                Math.sin((x + drift) * freq) * amp +
                Math.cos((x + drift) * freq * 0.75) * (amp * 0.55);

            const yy = y + wave;
            x === -200 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
    }
    ctx.restore();
}



// ---------------------------------------------------------
// FLOATING RIVER SPRITES (wood1, wood2)
// ---------------------------------------------------------

let floatSprites = [];
let floatImages = [];

const floatFiles = [
    "assets/riverSprites/wood1.png",
    "assets/riverSprites/wood3.png"
];

// Load the images
function loadFloatingSprites() {
    for (let src of floatFiles) {
        const img = new Image();
        img.src = src;
        floatImages.push(img);
    }
}
loadFloatingSprites();


// Spawn a floating object on the RIGHT side
function spawnFloatingObject() {
    if (floatImages.length === 0) return;

    const img = floatImages[Math.floor(Math.random() * floatImages.length)];
    const scale = 0.12;

    floatSprites.push({
        img: img,
        x: canvas.width + 150,                    // START on the right
        y: canvas.height * 0.59 + Math.random() * 40,
        w: img.width * scale,
        h: img.height * scale,
        speed: 0.8 + Math.random() * 0.6,         // flow speed
        bobSpeed: 0.002 + Math.random() * 0.003,  // bobbing rate
        bobOffset: Math.random() * 99999          // unique wave phase
    });
}

// Create a new floating object every 3 seconds
setInterval(spawnFloatingObject, 3000);


// Update + draw floating objects
function updateFloatingObjects(t) {
    for (let obj of floatSprites) {

        // drift RIGHT → LEFT
        obj.x -= obj.speed;

        // loop back to right side when offscreen
        if (obj.x < -200) {
            obj.x = canvas.width + 150;
            obj.y = canvas.height * 0.59 + Math.random() * 40;  // reset height randomness
        }

        // soft bobbing animation
        obj.y += Math.sin(t * obj.bobSpeed + obj.bobOffset) * 0.3;

        // draw object
        ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h);
    }
}



// ---------------------------------------------------------
// FRONT GRASS SPRITE
// ---------------------------------------------------------

let grassSprite = new Image();
grassSprite.src = "assets/grass/grass4.png";
let grassReady = false;
grassSprite.onload = () => { grassReady = true; };

function drawGrassSprite() {
    if (!grassReady) return;

    const spriteHeight = 200;
    const y = canvas.height - spriteHeight;

    const scale = 0.08;
    const spriteWidth = grassSprite.width * scale;

    for (let x = 0; x < canvas.width; x += spriteWidth) {
        ctx.drawImage(grassSprite, x, y, spriteWidth, spriteHeight);
    }
}



// ---------------------------------------------------------
// MAIN RIVER SCENE
// ---------------------------------------------------------

function drawRiver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCartoonSky();
    drawCartoonFields();
    drawCartoonRiverBank();
    drawCartoonRiver();

    // ✔ floating wood pieces drifting in water
    updateFloatingObjects(performance.now());

    drawGrassSprite();
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
