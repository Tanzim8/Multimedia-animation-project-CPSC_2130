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

// Proper canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60; // subtract nav height
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

    // TWO LANES
    const laneLeftToRight  = canvas.height - 150;   // Upper lane
    const laneRightToLeft  = canvas.height - 80;   // Lower lane (slightly down)

    // Pick lane based on direction
    const y = goingRight ? laneLeftToRight : laneRightToLeft;

    cars.push({
        img,
        x: goingRight ? -w - 50 : canvas.width + 50,
        y: y + (Math.random() * 8 - 4),  // small random variation
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
        ctx.scale(-1, 1); // flip horizontally
    }

    ctx.drawImage(c.img, -c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
}



function updateCars() {
    // Spawn timing
    if (performance.now() - lastCarSpawn > 2500 + Math.random() * 2000) {
        spawnCar();
        lastCarSpawn = performance.now();
    }

    // Move cars
    for (let c of cars) {
        c.x += c.speed * c.dir;
    }

    // Remove off-screen
    cars = cars.filter(c => c.x > -400 && c.x < canvas.width + 400);

    // Draw them
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
}

// ==========================
// OTHER SCENES
// ==========================
function drawRiver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(100,150,255,0.35)";
    ctx.beginPath();

    let baseline = canvas.height * 0.65;
    ctx.moveTo(0, baseline);

    for (let x = 0; x < canvas.width; x += 30) {
        const y = baseline + Math.sin(x * 0.01 + performance.now() * 0.002) * 20;
        ctx.lineTo(x, y);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();
}

// ==========================
// UNDERWATER OCEAN + FISH
// ==========================



let fishImagePaths = [
    { src: "images/fish.png", dir: 1 },
    { src: "images/fish2.png", dir:-1},
    { src: "images/fish3.png", dir:-1},
    { src: "images/fish5.png", dir:-1}

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




function drawUnderwater() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    if (underwaterVideoReady) {
        ctx.drawImage(underwaterVideo, 0, 0, canvas.width, canvas.height);
    }

    
    updateFish();
    for (let f of fishList) drawFish(f);
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
        poem: "The horizon breathes,\nand your thoughts drift with it.",
        audio: "audio/ocean.mp3",
        setup: initFish,
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

// ==========================
// SCENE LOADING
// ==========================
function loadScene(index) {
    const s = scenes[index];

    sceneName.textContent = s.name;

    poemText.style.opacity = 0;
    poemText.innerHTML = s.poem.replace(/\n/g, "<br>");
    setTimeout(() => poemText.style.opacity = 1, 100);

    if (userInteracted) {
        bgAudio.src = s.audio;
        bgAudio.play().catch(() => { });
    }

    s.setup();
    animateScene = s.draw;
}

let userInteracted = false;
document.body.addEventListener("click", () => {
    if (!userInteracted) {
        userInteracted = true;
        bgAudio.src = scenes[currentScene].audio;
        bgAudio.play().catch(() => { });
    }
});

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
