/**
 * CONDORSPACE - TEAM PARALLAX
 * Logica principale del gioco
 */

// --- Costanti del gioco ---
const BLINK_INTERVAL = 150;
const UI_MESSAGE_DURATION = 1800;
const UI_MESSAGE_FADEOUT_TIME = 400;
const SCREEN_FLASH_DURATION = 150;
const ALIEN_PROJECTILE_DAMAGE = 1;
const ALIEN_COLLISION_DAMAGE = 3;
const POWERUP_DROP_CHANCE = 0.18; // Probabilità di drop potenziamenti
const LASER_DPS = 15; // Danno per secondo del laser

// --- Colori predefiniti ---
const DEFAULT_EXPLOSION_COLORS = { 
    primary: "#ff8800", 
    secondary: "#ffaa44", 
    accent: "#ffffff", 
    glow: "#ff6600", 
    energy: "#ffff88" 
};

const DEFAULT_ALIEN_COLORS = { 
    primary: "#aa00ff", 
    secondary: "#cc66ff", 
    accent: "#ffffff", 
    glow: "#aa00ff", 
    energy: "#ff00ff" 
};

const alienColorSchemes = [
    {primary:"#00aaff", secondary:"#80ccff", accent:"#fff", glow:"#00aaff", energy:"#80ffff"},
    {primary:"#ff5500", secondary:"#ffaa00", accent:"#fff", glow:"#ff5500", energy:"#ffff00"},
    {primary:"#aa00ff", secondary:"#cc66ff", accent:"#fff", glow:"#aa00ff", energy:"#ff00ff"},
    {primary:"#00ff66", secondary:"#80ffaa", accent:"#fff", glow:"#00ff66", energy:"#ccff00"},
    {primary:"#ff0066", secondary:"#ff80aa", accent:"#fff", glow:"#ff0066", energy:"#ffcc66"},
    {primary:"#cc0000", secondary:"#ff6666", accent:"#fff", glow:"#ff0000", energy:"#ffaaaa"}
];

// --- Chiavi per lo storage ---
const HIGH_SCORE_KEY = 'condorspaceHighScores_v3';
const MAX_HIGH_SCORES = 7;

// --- PRNG ---
let prngSeed = Date.now(); 
function pseudoRandom() {
    return prngSeed = (prngSeed * 9301 + 49297) % 233280, prngSeed / 233280;
}

function seededPseudoRandom(seed) {
    let t = seed % 2147483647;
    if (t <= 0) t += 2147483646;
    return () => {
        return t = (t * 16807) % 2147483647, (t - 1) / 2147483646;
    }
}

// --- Definizione ondate di nemici ---
const WAVES = [
    { 
        name: "Ricognitori Nethex", 
        duration: 35000, 
        spawnInterval: 1600, 
        maxAliensOnScreen: 11,
        alienTypes: [ 
            { 
                type: 'scout', 
                params: { 
                    health: 1, 
                    speedY: 80, 
                    shootCooldown: 2600, 
                    movement: 'straight', 
                    speedFactor: 0.95 
                } 
            }, 
            { 
                type: 'scout_sine', 
                params: { 
                    health: 1.2, 
                    speedY: 70, 
                    shootCooldown: 2800, 
                    movement: 'sine', 
                    speedFactor: 0.95, 
                    sineAmplitude: 55, 
                    sineFrequency: 0.016 
                } 
            } 
        ], 
        pauseAfter: 3500 
    },
    { 
        name: "Squadriglie d'Assalto", 
        duration: 50000, 
        spawnInterval: 1300, 
        maxAliensOnScreen: 15,
        alienTypes: [ 
            { 
                type: 'fighter', 
                params: { 
                    health: 3, 
                    speedY: 95, 
                    shootCooldown: 1900, 
                    movement: 'zigzag', 
                    speedFactor: 1.0 
                } 
            }, 
            { 
                type: 'scout_sine', 
                params: { 
                    health: 2, 
                    speedY: 80, 
                    shootCooldown: 2200, 
                    movement: 'sine', 
                    speedFactor: 1.0, 
                    sineAmplitude: 75, 
                    sineFrequency: 0.021 
                } 
            } 
        ], 
        pauseAfter: 4500 
    },
    { 
        name: "Bombardieri Pesanti", 
        duration: 65000, 
        spawnInterval: 1100, 
        maxAliensOnScreen: 17,
        alienTypes: [ 
            { 
                type: 'bomber', 
                params: { 
                    health: 7, 
                    speedY: 65, 
                    shootCooldown: 1600, 
                    movement: 'straight', 
                    speedFactor: 1.1, 
                    sizeMultiplier: 1.2 
                } 
            }, 
            { 
                type: 'fighter_elite', 
                params: { 
                    health: 4, 
                    speedY: 105, 
                    shootCooldown: 1700, 
                    movement: 'diagonal', 
                    speedFactor: 1.1 
                } 
            } 
        ], 
        pauseAfter: 5500 
    },
    { 
        name: "Guardia Scelta", 
        duration: 50000, 
        spawnInterval: 800, 
        maxAliensOnScreen: 14,
        alienTypes: [ 
            { 
                type: 'elite_guardian', 
                params: { 
                    health: 6, 
                    speedY: 125, 
                    shootCooldown: 1300, 
                    movement: 'sine', 
                    speedFactor: 1.2, 
                    sineAmplitude: 95, 
                    sineFrequency: 0.026, 
                    eyeOffset: Math.PI 
                } 
            }, 
            { 
                type: 'kamikaze', 
                params: { 
                    health: 1.5, 
                    speedY: 200, 
                    shootCooldown: 99999, 
                    movement: 'straight_fast', 
                    speedFactor: 1.5, 
                    collisionDamageBoost: 6 
                } 
            } 
        ], 
        pauseAfter: 7000 
    }
];

// --- Stato del gioco ---
const game = {
    // Timing e stato
    animationFrame: 0,
    lastTime: 0,
    deltaTime: 0,
    running: false,
    paused: false,
    
    // Punteggio e progressione
    score: 0,
    lives: 3,
    isGameOver: false,
    level: 1,
    
    // Entità di gioco
    playerProjectiles: [],
    aliens: [],
    alienProjectiles: [],
    explosions: [],
    powerUps: [],
    stars: [],
    planets: [],
    crystals: [],
    
    // Cooldown e timing
    globalAlienFireCooldown: 0,
    alienSeparationBuffer: 7,
    
    // High score
    currentScoreSubmitted: false,
    
    // UI
    uiMessage: "",
    uiMessageTimer: 0,
    screenFlashTimer: 0,
    
    // Sistema onde
    currentWaveIndex: -1,
    waveTimer: 0,
    timeUntilNextWave: 0,
    inWavePause: true,
    allWavesCompleted: false,
    
    // Boss
    bossSpawned: false,
    bossDefeated: false,
    
    // Componenti cristalli
    gemCount: 0,
    gemValue: 0,
    
    // Nome cadetto
    cadetName: "Condor",
    
    // Gestione errori
    errorNotified: false
};

// --- Navicella del giocatore ---
const spaceship = {
    x: 0,
    y: 0,
    width: 50,
    height: 60,
    speed: 260,
    thrustPower: 0,
    engineAnimFrame: 0,
    engineFrameCount: 0,
    firing: false,
    fireDelay: 0,
    fireRate: 145,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    weaponType: 0,
    laserBeamActive: false,
    health: 10,
    maxHealth: 10,
    invincibleAfterHit: false,
    invincibleAfterLifeLoss: false,
    hitInvincibleTimer: 0,
    lifeLossInvincibleTimer: 0,
    HIT_INVINCIBILITY_DURATION: 1100,
    LIFE_LOSS_INVINCIBILITY_DURATION: 2500,
    shieldActive: false,
    shieldTimer: 0,
    SHIELD_DURATION: 8500,
    isAlive: true,
    blinkTimer: 0,
    
    takeDamage: function(amount) {
        if (!this.isAlive || this.shieldActive || this.invincibleAfterHit || this.invincibleAfterLifeLoss) {
            return;
        }
        
        this.health -= amount;
        if (AudioSystem) AudioSystem.playPlayerHitSound();
        game.screenFlashTimer = SCREEN_FLASH_DURATION;
        
        if (this.health <= 0) {
            this.health = 0;
            loseLife();
        } else {
            this.invincibleAfterHit = true;
            this.hitInvincibleTimer = this.HIT_INVINCIBILITY_DURATION;
        }
        
        updateGameUI(game, spaceship);
    }
};

// Variabili globali
let canvas, ctx, startButton, gameOverOverlay, restartButton, finalScoreUI;
let highScoreEntryUI, playerNameInput, saveScoreButton, highScoreListUI;
let scoreValueUI, livesValueUI, weaponValueUI, levelValueUI, statusValueUI;
let waveValueUI, enemiesValueUI, pauseOverlay, uiMessageDisplay;
let healthValueUI, healthBarUI, healthBarContainer;
let bossHealthBarContainer, bossHealthBar, bossHealthText;
let introOverlay, mainLayout, titleLogoCanvas;
let animationFrameId = null;
let gameBoss = null;
let currentPlanetTypes = [];
const starSpeed = 1.0;
const starCount = 160;
const MAX_PLANETS = 3;
const availablePlanetTypes = [0, 6, 7, 8, 9];

// --- Inizializzazione del gioco ---
function initGame() {
    console.log("Inizializzazione gioco...");
    
    // Assegna elementi DOM
    assignElements();
    
    // Inizializza sistema audio
    if (typeof AudioSystem !== 'undefined') {
        AudioSystem.init(() => {
            console.log("Sistema audio inizializzato.");
        });
    }
    
    // Disegna il logo del titolo
    if (typeof drawTitleLogo === 'function' && titleLogoCanvas) {
        drawTitleLogo(titleLogoCanvas);
    }
    
    // Mostra lo splash screen e l'intro
    displaySplashScreen();
    
    // Inizializza i punteggi elevati
    displayHighScores();
    
    // Collega gli eventi
    setupButtonListeners();
    addGameEventListeners();
    
    // Visualizza stelle e pianeti di sfondo
    initStars();
    initPlanets();
    if (ctx && canvas) drawBackground();
    
    // Inizializza il sistema cristalli se disponibile
    if (typeof initCrystalSystem === 'function') {
        initCrystalSystem();
    }
    
    console.log("Inizializzazione completata!");
}

// --- Assegna elementi DOM ---
function assignElements() {
    try {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error("Elemento canvas non trovato");
        
        ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Impossibile ottenere contesto 2D");
        
        // Principali elementi UI
        startButton = document.getElementById('startButton');
        gameOverOverlay = document.getElementById('gameOverOverlay');
        restartButton = document.getElementById('restartButton');
        finalScoreUI = document.getElementById('finalScore');
        highScoreEntryUI = document.getElementById('highScoreEntry');
        playerNameInput = document.getElementById('playerNameInput');
        saveScoreButton = document.getElementById('saveScoreButton');
        highScoreListUI = document.getElementById('highScoreList');
        
        // Elementi UI stato
        scoreValueUI = document.getElementById('scoreValue');
        livesValueUI = document.getElementById('livesValue');
        weaponValueUI = document.getElementById('weaponValue');
        levelValueUI = document.getElementById('levelValue');
        statusValueUI = document.getElementById('statusValue');
        waveValueUI = document.getElementById('waveValue');
        enemiesValueUI = document.getElementById('enemiesValue');
        pauseOverlay = document.getElementById('pauseOverlay');
        uiMessageDisplay = document.getElementById('uiMessageDisplay');
        healthValueUI = document.getElementById('healthValue');
        healthBarUI = document.getElementById('healthBar');
        healthBarContainer = document.getElementById('healthBarContainer');
        
        // Elementi boss
        bossHealthBarContainer = document.getElementById('bossHealthBarContainer');
        bossHealthBar = document.getElementById('bossHealthBar');
        bossHealthText = document.getElementById('bossHealthText');
        
        // Elementi intro e layout
        introOverlay = document.getElementById('introOverlay');
        mainLayout = document.getElementById('mainLayout');
        titleLogoCanvas = document.getElementById('titleLogoCanvas');
        
        if (!startButton || !gameOverOverlay || !scoreValueUI || !mainLayout || !introOverlay) {
            console.warn("Uno o più elementi UI principali non trovati.");
        }
        
        console.log("Elementi DOM assegnati.");
        return true;
    } catch (error) {
        console.error("Errore fatale nell'assegnazione degli elementi DOM:", error.message);
        alert("Errore di inizializzazione: " + error.message);
        
        if (mainLayout) mainLayout.style.display = 'none';
        if (introOverlay) introOverlay.style.display = 'none';
        
        return false;
    }
}

// --- Splash Screen ---
function displaySplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    const parallaxLogoSplash = document.getElementById('parallaxLogoSplash');
    const parallaxLogoSmall = document.getElementById('parallaxLogoSmall');
    
    // Imposta il background con il logo reale
    if (parallaxLogoSplash) {
        parallaxLogoSplash.style.backgroundImage = "url('assets/images/logo.png')";
    }
    
    if (parallaxLogoSmall) {
        parallaxLogoSmall.style.backgroundImage = "url('assets/images/logo.png')";
    }
    
    // Nascondi lo splash screen dopo 4 secondi e mostra l'intro
    setTimeout(function() {
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(function() {
                splashScreen.style.display = 'none';
                // Avvia la sequenza intro
                if (typeof startIntroSequence === 'function') {
                    startIntroSequence();
                }
            }, 1000);
        }
    }, 4000);
}

// --- Setup Button Listeners ---
function setupButtonListeners() {
    if (startButton) {
        startButton.addEventListener("click", () => {
            if (startButton.disabled) return;
            startButton.disabled = true;
            startButton.textContent = "Avvio...";
            
            if (AudioSystem && typeof AudioSystem.resumeContext === 'function') {
                AudioSystem.resumeContext(() => {
                    startGame();
                });
            } else {
                startGame();
            }
        });
    } else {
        console.error("Start Button non trovato!");
    }
    
    if (restartButton) {
        restartButton.addEventListener("click", () => {
            if (!gameOverOverlay || gameOverOverlay.style.display === 'none') return;
            gameOverOverlay.style.display = "none";
            
            if (mainLayout) mainLayout.classList.add('visible');
            
            if (ctx && canvas) {
                ctx.fillStyle = "#050510";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#aaccff";
                ctx.textAlign = "center";
                ctx.fillText("Riavvio...", canvas.width / 2, canvas.height / 2);
                ctx.textAlign = "left";
            }
            
            startGame(true);
        });
    } else {
        console.error("Restart Button non trovato!");
    }
    
    if (saveScoreButton) {
        saveScoreButton.addEventListener('click', submitHighScore);
    } else {
        console.error("Save Score Button non trovato!");
    }
    
    if (playerNameInput) {
        playerNameInput.addEventListener('keyup', function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                submitHighScore();
            }
        });
    } else {
        console.error("Player Name Input non trovato!");
    }
}

// --- Add Game Event Listeners ---
function addGameEventListeners() {
    window.addEventListener('keydown', function(e) {
        if (e.key.toUpperCase() === "P") {
            if (!game.isGameOver) {
                togglePause();
                e.preventDefault();
                return;
            }
        }
        
        if (game.isGameOver || !game.running || game.paused) return;
        
        let preventDefault = true;
        
        switch (e.key.toUpperCase()) {
            case "ARROWLEFT":
            case "A":
                spaceship.moveLeft = true;
                break;
            case "ARROWRIGHT":
            case "D":
                spaceship.moveRight = true;
                break;
            case "ARROWUP":
            case "W":
                spaceship.moveUp = true;
                break;
            case "ARROWDOWN":
            case "S":
                spaceship.moveDown = true;
                break;
            case " ":
                if (!spaceship.firing) spaceship.firing = true;
                break;
            default:
                preventDefault = false;
                break;
        }
        
        if (preventDefault) e.preventDefault();
    });
    
    window.addEventListener('keyup', function(e) {
        let preventDefault = true;
        
        switch (e.key.toUpperCase()) {
            case "ARROWLEFT":
            case "A":
                spaceship.moveLeft = false;
                break;
            case "ARROWRIGHT":
            case "D":
                spaceship.moveRight = false;
                break;
            case "ARROWUP":
            case "W":
                spaceship.moveUp = false;
                break;
            case "ARROWDOWN":
            case "S":
                spaceship.moveDown = false;
                break;
            case " ":
                spaceship.firing = false;
                break;
            default:
                preventDefault = false;
                break;
        }
        
        if (preventDefault) e.preventDefault();
    });
    
    window.addEventListener('keydown', function(e) {
        if (e.key === " " && document.activeElement !== playerNameInput && (!game.running || game.paused) && !window.introOver) {
            e.preventDefault();
        }
    });
    
    window.addEventListener('blur', () => {
        if (game.running && !game.paused && !game.isGameOver) {
            console.log("Window lost focus, pausing game.");
            pauseGame();
        }
    });
    
    window.addEventListener('error', e => {
        console.error("Unhandled error:", e.message, e.filename, e.lineno);
        if (!game.errorNotified) {
            game.errorNotified = true;
        }
    });
}

// --- Inizializzazione Stelle ---
function initStars() {
    game.stars = [];
    prngSeed = Date.now();
    
    if (!canvas) {
        console.error("Canvas non inizializzato in initStars!");
        return;
    }
    
    for (let i = 0; i < starCount; i++) {
        game.stars.push({
            x: pseudoRandom() * canvas.width,
            y: pseudoRandom() * canvas.height,
            size: pseudoRandom() * 1.6 + 0.4,
            speed: pseudoRandom() * 0.7 + starSpeed * 0.4,
            brightness: pseudoRandom() * Math.PI * 2
        });
    }
}

// --- Inizializzazione Pianeti ---
function initPlanets() {
    game.planets = [];
    currentPlanetTypes = [];
    
    // Verifica che canvas sia definito
    if (!canvas) {
        console.error("Canvas non inizializzato in initPlanets!");
        return;
    }
    
    for (let i = 0; i < MAX_PLANETS; i++) {
        spawnPlanet();
    }
}

// --- Spawn Pianeta ---
function spawnPlanet() {
    const minDistance = 40;
    
    if (game.planets.length >= MAX_PLANETS) return;
    
    let possibleTypes = availablePlanetTypes.filter(t => !currentPlanetTypes.includes(t));
    if (possibleTypes.length === 0) {
        possibleTypes = availablePlanetTypes; // Consenti ripetizioni se tutti i tipi sono già stati usati
    }
    
    const planetType = possibleTypes[Math.floor(pseudoRandom() * possibleTypes.length)];
    let attempts = 0;
    let validPlacement = false;
    let newPlanet = null;
    
    while (!validPlacement && attempts < 30) {
        attempts++;
        
        const depth = pseudoRandom() * 0.7 + 0.1;
        const size = 35 + pseudoRandom() * 55 + depth * 40;
        const x = pseudoRandom() * (canvas.width - size * 2) + size;
        const y = -size * 1.5 - pseudoRandom() * canvas.height * 0.6;
        
        newPlanet = new Planet(x, y, size, planetType, depth);
        
        let overlaps = false;
        for (const existingPlanet of game.planets) {
            if (!existingPlanet || !existingPlanet.active) continue;
            
            const dx = newPlanet.x - existingPlanet.x;
            const dy = newPlanet.y - existingPlanet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const requiredDist = newPlanet.size + existingPlanet.size + minDistance;
            
            if (dist < requiredDist) {
                overlaps = true;
                break;
            }
        }
        
        if (!overlaps) {
            validPlacement = true;
        }
    }
    
    if (validPlacement && newPlanet) {
        game.planets.push(newPlanet);
        if (!currentPlanetTypes.includes(newPlanet.type)) {
            currentPlanetTypes.push(newPlanet.type);
        }
    }
}

// --- Inizializzazione Dati di Gioco ---
function initGameData() {
    // Reset punteggio e progressione
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    game.isGameOver = false;
    game.paused = false;
    
    // Reset entità
    game.playerProjectiles = [];
    game.aliens = [];
    game.alienProjectiles = [];
    game.explosions = [];
    game.powerUps = [];
    game.crystals = [];
    
    // Reset timers e counters
    game.globalAlienFireCooldown = 0;
    game.currentScoreSubmitted = false;
    game.uiMessage = "";
    game.uiMessageTimer = 0;
    game.screenFlashTimer = 0;
    
    // Reset sistema onde
    game.currentWaveIndex = -1;
    game.waveTimer = 0;
    game.timeUntilNextWave = 500;
    game.inWavePause = true;
    game.allWavesCompleted = false;
    
    // Reset boss
    game.bossSpawned = false;
    game.bossDefeated = false;
    
    // Reset navicella
    spaceship.x = canvas.width / 2 - spaceship.width / 2;
    spaceship.y = canvas.height - spaceship.height - 40;
    spaceship.health = spaceship.maxHealth;
    spaceship.weaponType = 0;
    spaceship.thrustPower = 0;
    spaceship.moveLeft = false;
    spaceship.moveRight = false;
    spaceship.moveUp = false;
    spaceship.moveDown = false;
    spaceship.firing = false;
    spaceship.laserBeamActive = false;
    spaceship.invincibleAfterHit = false;
    spaceship.invincibleAfterLifeLoss = false;
    spaceship.hitInvincibleTimer = 0;
    spaceship.lifeLossInvincibleTimer = 0;
    spaceship.shieldActive = false;
    spaceship.shieldTimer = 0;
    spaceship.isAlive = true;
    
    // Reset sistema cristalli
    game.gemCount = 0;
    game.gemValue = 0;
    
    // Reset RNG
    prngSeed = Date.now();
    
    // Reset riferimenti globali
    currentPlanetTypes = [];
    gameBoss = null;
    
    console.log("Dati di gioco inizializzati.");
    
    // Aggiorna UI
    updateGameUI(game, spaceship);
}

// --- Gestione Ondate e Spawning ---
function manageWavesAndSpawning(deltaTime) {
    if (game.bossSpawned || game.isGameOver) return;
    
    if (game.allWavesCompleted && !game.inWavePause) {
        if (game.aliens.filter(a => a.active).length === 0) {
            if (!gameBoss && !game.bossSpawned) {
                console.log("Tutti gli alieni eliminati post-ondate. Spawning boss...");
                gameBoss = new Boss();
                gameBoss.spawn();
            }
        }
        return;
    }
    
    if (game.inWavePause) {
        game.timeUntilNextWave -= deltaTime;
        
        if (game.timeUntilNextWave <= 0) {
            game.inWavePause = false;
            game.currentWaveIndex++;
            
            if (game.currentWaveIndex >= WAVES.length) {
                game.allWavesCompleted = true;
                game.inWavePause = false;
                console.log("Tutte le ondate completate! Preparazione boss...");
                warningBeforeBoss();
                
                if (waveValueUI) {
                    waveValueUI.textContent = "BOSS";
                }
            } else {
                game.waveTimer = 0;
                game.alienSpawnTimer = 500;
                const nextWave = WAVES[game.currentWaveIndex];
                
                game.uiMessage = `Ondata ${game.currentWaveIndex + 1}`;
                game.uiMessageTimer = 2500;
                
                if (uiMessageDisplay) {
                    uiMessageDisplay.style.color = "#aaccff";
                }
                
                if (waveValueUI) {
                    waveValueUI.textContent = `${game.currentWaveIndex + 1}/${WAVES.length}`;
                }
                
                game.level = game.currentWaveIndex + 1;
            }
        }
        return;
    }
    
    const currentWaveData = WAVES[game.currentWaveIndex];
    if (!currentWaveData) return;
    
    game.waveTimer += deltaTime;
    game.alienSpawnTimer -= deltaTime;
    
    if (game.waveTimer >= currentWaveData.duration && !game.allWavesCompleted) {
        game.inWavePause = true;
        game.timeUntilNextWave = currentWaveData.pauseAfter;
        game.alienSpawnTimer = 0;
        return;
    }
    
    if (game.alienSpawnTimer <= 0 && game.aliens.filter(a => a.active).length < currentWaveData.maxAliensOnScreen) {
        const availableTypes = currentWaveData.alienTypes;
        const typeToSpawn = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const size = (25 + Math.random() * 15) * (typeToSpawn.params.sizeMultiplier || 1);
        const spawnX = size + Math.random() * (canvas.width - size * 2);
        const spawnY = -size - Math.random() * 40;
        
        let alienParams = JSON.parse(JSON.stringify(typeToSpawn.params));
        
        // Aumenta la difficoltà con il progredire del livello
        alienParams.health *= (1 + game.currentWaveIndex * 0.1);
        alienParams.speedY *= (1 + game.currentWaveIndex * 0.08);
        alienParams.shootCooldown = Math.max(400, alienParams.shootCooldown * (1 - game.currentWaveIndex * 0.09));
        
        let colors = getRandomColor();
        
        // Colori speciali per nemici d'élite
        if (game.currentWaveIndex === WAVES.length - 1 && 
            (typeToSpawn.type === 'elite_guardian' || typeToSpawn.type === 'kamikaze')) {
            colors = alienColorSchemes[5];
        } else if (typeToSpawn.type === 'bomber') {
            colors = alienColorSchemes[1];
        }
        
        const newAlien = new Alien(spawnX, spawnY, size, colors, alienParams.movement, alienParams);
        game.aliens.push(newAlien);
        
        // Imposta il timer per lo spawn successivo
        game.alienSpawnTimer = currentWaveData.spawnInterval * (0.85 + Math.random() * 0.25);
    }
}

// --- WARNING: Boss in arrivo ---
function warningBeforeBoss() {
    console.log("Warning: Boss in arrivo!");
    
    let flashes = 0;
    const maxFlashes = 5;
    
    const flashIntervalId = setInterval(() => {
        if (flashes >= maxFlashes || game.isGameOver || game.bossSpawned) {
            clearInterval(flashIntervalId);
            if (canvas) canvas.style.borderColor = "#303050";
            return;
        }
        
        if (canvas) {
            canvas.style.borderColor = flashes % 2 === 0 ? "#ff4444" : "#303050";
        }
        
        game.screenFlashTimer = SCREEN_FLASH_DURATION;
        flashes++;
        
        if (flashes === 1) {
            game.uiMessage = "⚠️ BOSS IN ARRIVO ⚠️";
            game.uiMessageTimer = UI_MESSAGE_DURATION * 2.5;
            if (uiMessageDisplay) uiMessageDisplay.style.color = "#ff4444";
        }
    }, 600);
}

// --- Spawn Power Up ---
function spawnPowerUp(x, y) {
    const typeRoll = Math.random();
    let type;
    
    if (typeRoll < 0.55) {
        // Armi (55%)
        type = Math.floor(Math.random() * 4) + 1;
    } else if (typeRoll < 0.85) {
        // Scudo (30%)
        type = 5;
    } else {
        // Salute (15%)
        type = 6;
    }
    
    if (game.powerUps.length < 4) {
        game.powerUps.push(new PowerUp(x, y, type));
    }
}

// --- Update Spaceship ---
function updateSpaceship(deltaTime) {
    if (!spaceship.isAlive) return;
    
    const dtSeconds = deltaTime / 1000;
    
    // Movimento
    let moveX = 0;
    let moveY = 0;
    
    if (spaceship.moveLeft && !spaceship.moveRight) moveX = -1;
    else if (spaceship.moveRight && !spaceship.moveLeft) moveX = 1;
    
    if (spaceship.moveUp && !spaceship.moveDown) moveY = -1;
    else if (spaceship.moveDown && !spaceship.moveUp) moveY = 1;
    
    let currentSpeed = spaceship.speed;
    
    // Movimento diagonale più lento
    if (moveX !== 0 && moveY !== 0) {
        currentSpeed *= 0.7071; // Cos(45°) per mantenere la velocità diagonale costante
    }
    
    spaceship.x += moveX * currentSpeed * dtSeconds;
    spaceship.y += moveY * currentSpeed * dtSeconds;
    
    // Limita la posizione della navicella dentro lo schermo
    spaceship.x = Math.max(0, Math.min(canvas.width - spaceship.width, spaceship.x));
    spaceship.y = Math.max(0, Math.min(canvas.height - spaceship.height, spaceship.y));
    
    // Effetto propulsione
    if (spaceship.moveUp) {
        spaceship.thrustPower = Math.min(spaceship.thrustPower + 0.1, 1);
    } else {
        spaceship.thrustPower = Math.max(0, spaceship.thrustPower - 0.08);
    }
    
    spaceship.engineFrameCount++;
    if (spaceship.engineFrameCount >= 3) {
        spaceship.engineFrameCount = 0;
        spaceship.engineAnimFrame = (spaceship.engineAnimFrame + 1) % 4;
    }
    
    // Sparo
    if (spaceship.fireDelay > 0) spaceship.fireDelay -= deltaTime;
    
    if (isSpaceshipCurrentlyVisible()) {
        if (spaceship.firing) {
            if (spaceship.weaponType === 4) {
                if (!spaceship.laserBeamActive) {
                    if (AudioSystem) AudioSystem.startContinuous();
                    spaceship.laserBeamActive = true;
                }
            } else if (spaceship.fireDelay <= 0) {
                fireProjectile();
            }
        } else if (spaceship.laserBeamActive) {
            if (AudioSystem) AudioSystem.stopContinuous();
            spaceship.laserBeamActive = false;
        }
    } else if (spaceship.laserBeamActive) {
        if (AudioSystem) AudioSystem.stopContinuous();
        spaceship.laserBeamActive = false;
    }
    
    updateInvincibility(deltaTime);
    updateShield(deltaTime);
}

// --- Update Invincibility ---
function updateInvincibility(deltaTime) {
    if (spaceship.invincibleAfterHit) {
        spaceship.hitInvincibleTimer -= deltaTime;
        if (spaceship.hitInvincibleTimer <= 0) {
            spaceship.invincibleAfterHit = false;
        }
    }
    
    if (spaceship.invincibleAfterLifeLoss) {
        spaceship.lifeLossInvincibleTimer -= deltaTime;
        if (spaceship.lifeLossInvincibleTimer <= 0) {
            spaceship.invincibleAfterLifeLoss = false;
        }
    }
}

// --- Update Shield ---
function updateShield(deltaTime) {
    if (spaceship.shieldActive) {
        spaceship.shieldTimer -= deltaTime;
        if (spaceship.shieldTimer <= 0) {
            spaceship.shieldActive = false;
            if (AudioSystem) AudioSystem.playShieldDownSound();
        }
    }
}

// --- Fire Projectile ---
function fireProjectile() {
    if (!spaceship.isAlive || spaceship.fireDelay > 0) return;
    
    switch (spaceship.weaponType) {
        case 0: // Standard
            game.playerProjectiles.push(new Projectile(spaceship.x + 8, spaceship.y + 10, 0));
            game.playerProjectiles.push(new Projectile(spaceship.x + spaceship.width - 8 - 6, spaceship.y + 10, 0));
            spaceship.fireDelay = spaceship.fireRate;
            if (AudioSystem) AudioSystem.playLaserSound();
            break;
            
        case 1: // Spread
            const angles = [-0.4, -0.2, 0, 0.2, 0.4];
            for (let angle of angles) {
                game.playerProjectiles.push(new Projectile(
                    spaceship.x + spaceship.width / 2 - 3,
                    spaceship.y + 10,
                    1,
                    angle
                ));
            }
            spaceship.fireDelay = spaceship.fireRate + 100;
            if (AudioSystem) AudioSystem.playSpreadSound();
            break;
            
        case 2: // Rapid
            game.playerProjectiles.push(new Projectile(
                spaceship.x + spaceship.width / 2 - 2,
                spaceship.y + 10,
                2
            ));
            spaceship.fireDelay = Math.max(40, spaceship.fireRate - 90);
            if (AudioSystem) AudioSystem.playRapidSound();
            break;
            
        case 3: // Heavy
            game.playerProjectiles.push(new Projectile(
                spaceship.x + spaceship.width / 2 - 5,
                spaceship.y + 5,
                3
            ));
            spaceship.fireDelay = spaceship.fireRate + 150;
            if (AudioSystem) AudioSystem.playHeavySound();
            break;
    }
}

// --- Update Projectiles ---
function updateProjectiles(projectiles, deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(deltaTime);
        if (!projectiles[i].active) {
            projectiles.splice(i, 1);
        }
    }
}

// --- Update Aliens ---
function updateAliens(deltaTime) {
    for (let i = game.aliens.length - 1; i >= 0; i--) {
        if (!game.aliens[i].update(deltaTime)) {
            game.aliens.splice(i, 1);
        }
    }
}

// --- Update Power Ups ---
function updatePowerUps(deltaTime) {
    for (let i = game.powerUps.length - 1; i >= 0; i--) {
        game.powerUps[i].update(deltaTime);
        if (!game.powerUps[i].active) {
            game.powerUps.splice(i, 1);
        }
    }
}

// --- Update Explosions ---
function updateExplosions(deltaTime) {
    for (let i = game.explosions.length - 1; i >= 0; i--) {
        try {
            if (!game.explosions[i].update(deltaTime)) {
                game.explosions.splice(i, 1);
            }
        } catch(e) {
            console.error("Error updating explosion:", e);
            game.explosions.splice(i, 1);
        }
    }
}

// --- Update Stars & Planets ---
function updateStarsAndPlanets(deltaTime) {
    // Assicurati che canvas sia definito
    if (!canvas) {
        console.error("Canvas non inizializzato in updateStarsAndPlanets!");
        return;
    }
    
    // Update stars
    for (let i = 0; i < game.stars.length; i++) {
        const star = game.stars[i];
        const moveDist = star.speed * (deltaTime / 1000) * 60;
        star.y += moveDist;
        
        if (star.y > canvas.height) {
            star.y = 0 - star.size;
            star.x = Math.random() * canvas.width;
        }
    }
    
    // Update planets
    let planetExited = false;
    for (let i = game.planets.length - 1; i >= 0; i--) {
        const planet = game.planets[i];
        planet.update(deltaTime);
        
        if (!planet.active) {
            game.planets.splice(i, 1);
            planetExited = true;
        }
    }
    
    if (planetExited || game.planets.length < MAX_PLANETS) {
        if (game.animationFrame % 50 === 0 || planetExited) {
            spawnPlanet();
        }
    }
}

// --- Collision Detection ---
function checkCollisions(deltaTime) {
    const dtSeconds = deltaTime / 1000;
    
    // 1. Player Projectiles vs Aliens
    for (let i = game.playerProjectiles.length - 1; i >= 0; i--) {
        const proj = game.playerProjectiles[i];
        if (!proj.active) continue;
        
        for (let j = game.aliens.length - 1; j >= 0; j--) {
            const alien = game.aliens[j];
            if (!alien.active) continue;
            
            const dx = (proj.x + proj.width / 2) - alien.x;
            const dy = (proj.y + proj.height / 2) - alien.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < (alien.collisionRadius + proj.width / 2) ** 2) {
                alien.takeDamage(proj.damage);
                proj.active = false;
                break;
            }
        }
    }
    
    // 2. Player Laser vs Aliens
    if (spaceship.laserBeamActive && spaceship.weaponType === 4 && 
        spaceship.isAlive && isSpaceshipCurrentlyVisible()) {
        const laserWidth = 12;
        const laserRect = {
            x: spaceship.x + spaceship.width / 2 - laserWidth / 2,
            y: 0,
            width: laserWidth,
            height: spaceship.y
        };
        
        for (let j = game.aliens.length - 1; j >= 0; j--) {
            const alien = game.aliens[j];
            if (!alien.active) continue;
            
            const alienRect = {
                x: alien.x - alien.collisionRadius,
                y: alien.y - alien.collisionRadius,
                width: alien.collisionRadius * 2,
                height: alien.collisionRadius * 2
            };
            
            if (isColliding(laserRect, alienRect)) {
                alien.takeDamage(LASER_DPS * dtSeconds);
                
                if (game.animationFrame % 5 === 0) {
                    alien.hitEffects.push({
                        x: (Math.random() - 0.5) * alien.size * 0.3,
                        y: (Math.random() - 0.5) * alien.size * 0.3,
                        size: alien.size * 0.2,
                        life: 0.5
                    });
                }
            }
        }
    }
    
    // 3. Aliens / Alien Projectiles vs Player Ship
    if (spaceship.isAlive) {
        if (!spaceship.shieldActive) {
            // Collisione con alieni
            for (let i = game.aliens.length - 1; i >= 0; i--) {
                const alien = game.aliens[i];
                if (alien.active && isColliding(spaceship, alien)) {
                    spaceship.takeDamage(alien.collisionDamage);
                    alien.takeDamage(1000);
                }
            }
            
            // Collisione con proiettili nemici
            for (let i = game.alienProjectiles.length - 1; i >= 0; i--) {
                const alienProj = game.alienProjectiles[i];
                if (alienProj.active && isColliding(spaceship, alienProj)) {
                    alienProj.active = false;
                    spaceship.takeDamage(alienProj.damage);
                }
            }
            
            // Collisione con boss
            if (gameBoss && gameBoss.active && !gameBoss.isEntering) {
                const bossRect = {
                    x: gameBoss.x - gameBoss.width / 2,
                    y: gameBoss.y - gameBoss.height / 2,
                    width: gameBoss.width,
                    height: gameBoss.height
                };
                
                if (isColliding(spaceship, bossRect)) {
                    spaceship.takeDamage(ALIEN_COLLISION_DAMAGE * 3);
                }
            }
        } else {
            // Con lo scudo attivo, distruggi i proiettili nemici ma non danneggia la navicella
            const shieldRadius = spaceship.width * 0.8;
            const shipCenterX = spaceship.x + spaceship.width / 2;
            const shipCenterY = spaceship.y + spaceship.height / 2;
            
            // Blocca proiettili nemici
            for (let i = game.alienProjectiles.length - 1; i >= 0; i--) {
                const alienProj = game.alienProjectiles[i];
                if (!alienProj.active) continue;
                
                const dx = alienProj.x + alienProj.width / 2 - shipCenterX;
                const dy = alienProj.y + alienProj.height / 2 - shipCenterY;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < (shieldRadius + alienProj.width / 2) ** 2) {
                    alienProj.active = false;
                    game.explosions.push(new Explosion(
                        alienProj.x,
                        alienProj.y,
                        15,
                        { primary: "#fff", energy: "#80ffff" },
                        'small'
                    ));
                }
            }
            
            // Danneggia alieni che collidono con lo scudo
            for (let i = game.aliens.length - 1; i >= 0; i--) {
                const alien = game.aliens[i];
                const dx = alien.x - shipCenterX;
                const dy = alien.y - shipCenterY;
                const distSq = dx * dx + dy * dy;
                const radiiSq = (alien.collisionRadius + shieldRadius) ** 2;
                
                if (alien.active && distSq < radiiSq) {
                    alien.takeDamage(25 * dtSeconds);
                }
            }
        }
    }
    
    // 4. Player vs Boss
    if (gameBoss && gameBoss.active && !gameBoss.isEntering) {
        // Proiettili del giocatore vs boss
        for (let i = game.playerProjectiles.length - 1; i >= 0; i--) {
            const proj = game.playerProjectiles[i];
            if (!proj.active) continue;
            
            const bossRect = {
                x: gameBoss.x - gameBoss.width / 2,
                y: gameBoss.y - gameBoss.height / 2,
                width: gameBoss.width,
                height: gameBoss.height
            };
            
            if (isColliding(proj, bossRect)) {
                gameBoss.takeDamage(
                    proj.damage,
                    proj.x + proj.width / 2,
                    proj.y + proj.height / 2
                );
                proj.active = false;
            }
        }
        
        // Laser del giocatore vs boss
        if (spaceship.laserBeamActive && spaceship.weaponType === 4 && 
            spaceship.isAlive && isSpaceshipCurrentlyVisible()) {
            const laserWidth = 12;
            const laserRect = {
                x: spaceship.x + spaceship.width / 2 - laserWidth / 2,
                y: 0,
                width: laserWidth,
                height: spaceship.y
            };
            
            for (const key in gameBoss.components) {
                const comp = gameBoss.components[key];
                if (!comp.active || !comp.isHittable) continue;
                
                const compRect = {
                    x: gameBoss.x + comp.x - comp.width / 2,
                    y: gameBoss.y + comp.y - comp.height / 2,
                    width: comp.width,
                    height: comp.height
                };
                
                if (isColliding(laserRect, compRect)) {
                    const hitX = spaceship.x + spaceship.width / 2;
                    const hitY = Math.max(compRect.y, laserRect.y);
                    gameBoss.takeDamage(LASER_DPS * dtSeconds, hitX, hitY);
                }
            }
        }
    }
}

// --- Lose Life ---
function loseLife() {
    if (!spaceship.isAlive) return;
    
    game.lives--;
    
    game.uiMessage = "VITA PERSA!";
    game.uiMessageTimer = UI_MESSAGE_DURATION + 500;
    if (uiMessageDisplay) uiMessageDisplay.style.color = "#ff6666";
    
    game.explosions.push(new Explosion(
        spaceship.x + spaceship.width / 2,
        spaceship.y + spaceship.height / 2,
        spaceship.width * 0.9,
        { primary: "#fa0", energy: "#ff0", accent: "#fff", glow: "#f80" },
        "medium"
    ));
    
    if (AudioSystem) AudioSystem.playExplosionSound('medium');
    
    if (game.lives <= 0) {
        spaceship.isAlive = false;
        updateGameUI(game, spaceship);
        gameOver(false);
    } else {
        spaceship.health = spaceship.maxHealth;
        spaceship.x = canvas.width / 2 - spaceship.width / 2;
        spaceship.y = canvas.height - spaceship.height - 60;
        spaceship.invincibleAfterLifeLoss = true;
        spaceship.lifeLossInvincibleTimer = spaceship.LIFE_LOSS_INVINCIBILITY_DURATION;
        spaceship.invincibleAfterHit = false;
        spaceship.hitInvincibleTimer = 0;
        spaceship.weaponType = 0;
        
        if (spaceship.laserBeamActive) {
            if (AudioSystem) AudioSystem.stopContinuous();
            spaceship.laserBeamActive = false;
        }
        
        updateGameUI(game, spaceship);
    }
}

// --- Create Boss Explosion ---
function createBossExplosion(x, y, size) {
    const bossColors = {
        primary: "#ff4400",
        secondary: "#ffaa00",
        accent: "#ffffff",
        glow: "#ff6600",
        energy: "#ffff88"
    };
    
    game.screenFlashTimer = 500;
    
    // Esplosione centrale grande
    const centralExplosion = new Explosion(x, y, size * 1.8, bossColors, 'large');
    game.explosions.push(centralExplosion);
    
    // Esplosioni secondarie
    const numSecondaryExplosions = 30;
    for (let i = 0; i < numSecondaryExplosions; i++) {
        setTimeout(() => {
            if (game.isGameOver) return;
            
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * size + size * 0.3;
            const offsetX = Math.cos(angle) * dist;
            const offsetY = Math.sin(angle) * dist;
            const explosionSize = size * 0.15 + Math.random() * size * 0.35;
            const type = Math.random() < 0.7 ? 'medium' : 'large';
            
            game.explosions.push(new Explosion(
                x + offsetX,
                y + offsetY,
                explosionSize,
                bossColors,
                type
            ));
            
            if (i % 3 === 0 && AudioSystem) {
                AudioSystem.playExplosionSound(Math.random() < 0.6 ? 'medium' : 'small');
            }
        }, i * 70 + Math.random() * 100);
    }
    
    // Onde d'urto
    const numShockwaves = 5;
    for (let i = 0; i < numShockwaves; i++) {
        setTimeout(() => {
            if (game.isGameOver) return;
            
            let shockwaveParticle = {
                type: "shockwave",
                size: 0,
                maxSize: size * (1.5 + i * 0.6),
                speed: (size / 8) * (0.9 - i * 0.1),
                opacity: 0.9 - i * 0.15,
                color: i % 2 === 0 ? bossColors.energy : bossColors.primary,
                life: 1.8 + i * 0.3,
                decay: 0.008 - i * 0.0005
            };
            
            let shockwaveExplosion = new Explosion(x, y, 1, bossColors, 'custom');
            shockwaveExplosion.particles = [shockwaveParticle];
            game.explosions.push(shockwaveExplosion);
        }, 400 + i * 350);
    }
}

// --- Draw Spaceship --- 
function drawSpaceship() {
    if (!spaceship.isAlive || !isSpaceshipCurrentlyVisible() || !ctx) {
        return;
    }
    
    ctx.save();
    
    const centerX = spaceship.x + spaceship.width / 2;
    const centerY = spaceship.y + spaceship.height / 2;
    
    // Disegna scudo se attivo
    if (spaceship.shieldActive) {
        const shieldMaxRadius = spaceship.width * 0.8;
        const shieldPulse = Math.sin(game.animationFrame * 0.08) * 4;
        const currentRadius = shieldMaxRadius + shieldPulse;
        const shieldAlpha = 0.4 + Math.sin(game.animationFrame * 0.1) * 0.15;
        const fadeFactor = Math.min(1, spaceship.shieldTimer / (spaceship.SHIELD_DURATION * 0.3));
        
        ctx.globalAlpha = shieldAlpha * fadeFactor;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, currentRadius * 0.5, centerX, centerY, currentRadius);
        gradient.addColorStop(0, "rgba(180, 220, 255, 0.1)");
        gradient.addColorStop(0.7, "rgba(100, 180, 255, 0.6)");
        gradient.addColorStop(1, "rgba(50, 120, 200, 0.3)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(200, 230, 255, ${0.7 * fadeFactor})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.globalAlpha = 1.0;
    }
    
    // Disegna propulsori
    const nozzleHeight = spaceship.height * 0.18;
    const nozzleWidth = spaceship.width * 0.5;
    const nozzleY = spaceship.y + spaceship.height * 0.85;
    
    const nozzleGrad = ctx.createLinearGradient(
        centerX - nozzleWidth / 2,
        nozzleY,
        centerX + nozzleWidth / 2,
        nozzleY + nozzleHeight
    );
    nozzleGrad.addColorStop(0, "#8899aa");
    nozzleGrad.addColorStop(0.5, "#cdd0d4");
    nozzleGrad.addColorStop(1, "#667788");
    
    ctx.fillStyle = nozzleGrad;
    ctx.beginPath();
    ctx.moveTo(centerX - nozzleWidth / 2, nozzleY);
    ctx.lineTo(centerX + nozzleWidth / 2, nozzleY);
    ctx.lineTo(centerX + nozzleWidth * 0.35, nozzleY + nozzleHeight);
    ctx.lineTo(centerX - nozzleWidth * 0.35, nozzleY + nozzleHeight);
    ctx.closePath();
    ctx.fill();
    
    // Disegna fiamma propulsione
    const thrustMultiplier = 0.5 + spaceship.thrustPower * 0.8;
    const flameStartY = nozzleY + nozzleHeight * 0.5;
    
    const flameGradient = ctx.createLinearGradient(centerX, flameStartY, centerX, flameStartY + 30 * thrustMultiplier);
    flameGradient.addColorStop(0, "#00ffff");
    flameGradient.addColorStop(0.5, "#0066ff");
    flameGradient.addColorStop(1, "rgba(0,40,255,0)");
    
    const flameWidth = 20 * (0.8 + Math.sin(spaceship.engineAnimFrame / 2) * 0.2) * thrustMultiplier;
    const flameHeight = (20 + 10 * spaceship.engineAnimFrame * 0.8) * thrustMultiplier * 1.5;
    
    if (thrustMultiplier > 0.05 && flameHeight > 1) {
        ctx.shadowColor = "#0af";
        ctx.shadowBlur = 10 + 10 * spaceship.thrustPower;
        ctx.fillStyle = flameGradient;
        
        ctx.beginPath();
        ctx.moveTo(centerX - flameWidth / 2, flameStartY - 5);
        ctx.quadraticCurveTo(
            centerX,
            flameStartY + flameHeight * 0.7,
            centerX - flameWidth * 0.3,
            flameStartY + flameHeight
        );
        ctx.quadraticCurveTo(
            centerX,
            flameStartY + flameHeight * 0.7,
            centerX + flameWidth / 2,
            flameStartY - 5
        );
        ctx.closePath();
        ctx.fill();
    }
    
    // Corpo della navicella
    const shipGradient = ctx.createLinearGradient(
        centerX - spaceship.width * 0.4,
        centerY - spaceship.height * 0.4,
        centerX + spaceship.width * 0.4,
        centerY + spaceship.height * 0.3
    );
    shipGradient.addColorStop(0, "#5588aa");
    shipGradient.addColorStop(0.5, "#8899bb");
    shipGradient.addColorStop(1, "#5566aa");
    
    ctx.fillStyle = shipGradient;
    ctx.shadowColor = "#0af";
    ctx.shadowBlur = 0;
    
    // Fusoliera principale
    ctx.beginPath();
    ctx.moveTo(centerX, spaceship.y + spaceship.height * 0.2); // Punta della navicella
    ctx.lineTo(centerX - spaceship.width * 0.28, spaceship.y + spaceship.height * 0.6);
    ctx.lineTo(centerX - spaceship.width * 0.4, spaceship.y + spaceship.height * 0.85);
    ctx.lineTo(centerX, spaceship.y + spaceship.height * 0.7);
    ctx.lineTo(centerX + spaceship.width * 0.4, spaceship.y + spaceship.height * 0.85);
    ctx.lineTo(centerX + spaceship.width * 0.28, spaceship.y + spaceship.height * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Bordo della navicella
    ctx.strokeStyle = "#bbccff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Cabina cockpit
    const cockpitGradient = ctx.createLinearGradient(
        centerX - spaceship.width * 0.15,
        spaceship.y + spaceship.height * 0.35,
        centerX + spaceship.width * 0.15,
        spaceship.y + spaceship.height * 0.55
    );
    cockpitGradient.addColorStop(0, "#80ddff");
    cockpitGradient.addColorStop(0.5, "#00aaff");
    cockpitGradient.addColorStop(1, "#0088cc");
    
    ctx.fillStyle = cockpitGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, spaceship.y + spaceship.height * 0.3);
    ctx.lineTo(centerX - spaceship.width * 0.15, spaceship.y + spaceship.height * 0.45);
    ctx.lineTo(centerX, spaceship.y + spaceship.height * 0.6);
    ctx.lineTo(centerX + spaceship.width * 0.15, spaceship.y + spaceship.height * 0.45);
    ctx.closePath();
    ctx.fill();
    
    // Bordo cabina con effetto shine
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Ali laterali
    const wingGradient = ctx.createLinearGradient(
        centerX - spaceship.width * 0.5,
        spaceship.y + spaceship.height * 0.6,
        centerX + spaceship.width * 0.5,
        spaceship.y + spaceship.height * 0.6
    );
    wingGradient.addColorStop(0, "#445577");
    wingGradient.addColorStop(0.5, "#7799bb");
    wingGradient.addColorStop(1, "#445577");
    
    ctx.fillStyle = wingGradient;
    
    // Ala sinistra
    ctx.beginPath();
    ctx.moveTo(centerX - spaceship.width * 0.25, spaceship.y + spaceship.height * 0.5);
    ctx.lineTo(centerX - spaceship.width * 0.5, spaceship.y + spaceship.height * 0.7);
    ctx.lineTo(centerX - spaceship.width * 0.3, spaceship.y + spaceship.height * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#aaccff";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // Ala destra
    ctx.beginPath();
    ctx.moveTo(centerX + spaceship.width * 0.25, spaceship.y + spaceship.height * 0.5);
    ctx.lineTo(centerX + spaceship.width * 0.5, spaceship.y + spaceship.height * 0.7);
    ctx.lineTo(centerX + spaceship.width * 0.3, spaceship.y + spaceship.height * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Dettagli della navicella
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.8;
    
    // Linee dettaglio corpo centrale
    ctx.beginPath();
    ctx.moveTo(centerX - spaceship.width * 0.1, spaceship.y + spaceship.height * 0.3);
    ctx.lineTo(centerX - spaceship.width * 0.1, spaceship.y + spaceship.height * 0.7);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + spaceship.width * 0.1, spaceship.y + spaceship.height * 0.3);
    ctx.lineTo(centerX + spaceship.width * 0.1, spaceship.y + spaceship.height * 0.7);
    ctx.stroke();
    
    // Ripristina il contesto
    ctx.restore();
} // Parentesi graffa mancante aggiunta qui

// --- Draw Background ---
function drawBackground() {
    if (!ctx || !canvas) return;
    
    // Sfondo nero dello spazio
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Disegna le stelle
    for (const star of game.stars) {
        const brightness = 0.5 + Math.sin(game.animationFrame * 0.01 + star.brightness) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.9})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Disegna i pianeti
    for (const planet of game.planets) {
        planet.draw();
    }
}

// --- Display High Scores ---
function displayHighScores() {
    try {
        if (!highScoreListUI) return;
        
        let highScores = [];
        
        // Carica highscores da localStorage
        const savedScores = localStorage.getItem(HIGH_SCORE_KEY);
        if (savedScores) {
            highScores = JSON.parse(savedScores);
        }
        
        // Assicurati che highScores sia un array
        if (!Array.isArray(highScores)) {
            highScores = [];
        }
        
        // Rimuovi voci obsolete o malformate
        highScores = highScores.filter(item => 
            item && 
            typeof item === 'object' && 
            'name' in item && 
            'score' in item
        );
        
        // Ordina per punteggio descrescente
        highScores.sort((a, b) => b.score - a.score);
        
        // Tronca alla massima dimensione
        if (highScores.length > MAX_HIGH_SCORES) {
            highScores = highScores.slice(0, MAX_HIGH_SCORES);
        }
        
        // Aggiorna il display
        highScoreListUI.innerHTML = "";
        
        if (highScores.length === 0) {
            const noScoresItem = document.createElement('li');
            noScoresItem.innerHTML = '<span>Nessun record</span><span></span>';
            highScoreListUI.appendChild(noScoresItem);
        } else {
            for (let i = 0; i < highScores.length; i++) {
                const scoreItem = document.createElement('li');
                scoreItem.style.borderLeft = `3px solid hsl(${210 - i * 25}, 80%, 50%)`;
                scoreItem.innerHTML = `<span>${highScores[i].name}</span><span>${highScores[i].score}</span>`;
                highScoreListUI.appendChild(scoreItem);
            }
        }
    } catch (e) {
        console.error("Error displaying high scores:", e);
    }
}

// --- Submit High Score ---
function submitHighScore() {
    if (!playerNameInput || !highScoreEntryUI) return;
    
    // Ottieni il nome del giocatore
    const playerName = playerNameInput.value.trim();
    
    // Valida il nome
    if (playerName.length < 3 || playerName.length > 10) {
        alert("Il nome deve essere lungo tra 3 e 10 caratteri!");
        return;
    }
    
    try {
        let highScores = [];
        
        // Carica highscores da localStorage
        const savedScores = localStorage.getItem(HIGH_SCORE_KEY);
        if (savedScores) {
            highScores = JSON.parse(savedScores);
        }
        
        // Assicurati che highScores sia un array
        if (!Array.isArray(highScores)) {
            highScores = [];
        }
        
        // Aggiungi il nuovo punteggio
        highScores.push({
            name: playerName,
            score: game.score,
            date: new Date().toISOString()
        });
        
        // Ordina per punteggio descrescente
        highScores.sort((a, b) => b.score - a.score);
        
        // Tronca alla massima dimensione
        if (highScores.length > MAX_HIGH_SCORES) {
            highScores = highScores.slice(0, MAX_HIGH_SCORES);
        }
        
        // Salva in localStorage
        localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScores));
        
        // Aggiorna il display
        displayHighScores();
        
        // Nascondi il form di inserimento
        highScoreEntryUI.style.display = "none";
        
        // Segnala che il punteggio è stato inviato
        game.currentScoreSubmitted = true;
        
        // Aggiungi un messaggio di conferma
        const confirmMessage = document.createElement('p');
        confirmMessage.textContent = "Punteggio salvato nella Hall of Fame!";
        confirmMessage.style.color = "#4f4";
        gameOverOverlay.insertBefore(confirmMessage, restartButton);
        
        // Suono di conferma
        if (AudioSystem && typeof AudioSystem.playPowerUpSound === 'function') {
            AudioSystem.playPowerUpSound();
        }
    } catch (e) {
        console.error("Error submitting high score:", e);
        alert("Errore nel salvataggio del punteggio. Riprova più tardi.");
    }
}

// --- Check High Score ---
function checkHighScore() {
    try {
        let highScores = [];
        
        // Carica highscores da localStorage
        const savedScores = localStorage.getItem(HIGH_SCORE_KEY);
        if (savedScores) {
            highScores = JSON.parse(savedScores);
        }
        
        // Assicurati che highScores sia un array
        if (!Array.isArray(highScores)) {
            highScores = [];
        }
        
        // Rimuovi voci obsolete o malformate
        highScores = highScores.filter(item => 
            item && 
            typeof item === 'object' && 
            'name' in item && 
            'score' in item
        );
        
        // Se ci sono meno di MAX_HIGH_SCORES o il punteggio è più alto dell'ultimo
        const isNewHighScore = highScores.length < MAX_HIGH_SCORES || 
                              highScores.some(item => game.score > item.score);
        
        return isNewHighScore;
    } catch (e) {
        console.error("Error checking high score:", e);
        return false;
    }
}

// --- Toggle Pause ---
function togglePause() {
    if (game.isGameOver || !game.running) return;
    
    if (game.paused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// --- Pause Game ---
function pauseGame() {
    if (!game.running || game.paused || game.isGameOver) return;
    
    game.paused = true;
    
    if (pauseOverlay) {
        pauseOverlay.style.display = "flex";
    }
    
    // Ferma l'arma continua se attiva
    if (spaceship.laserBeamActive && AudioSystem && typeof AudioSystem.stopContinuous === 'function') {
        AudioSystem.stopContinuous();
    }
}

// --- Resume Game ---
function resumeGame() {
    if (!game.running || !game.paused || game.isGameOver) return;
    
    game.paused = false;
    
    if (pauseOverlay) {
        pauseOverlay.style.display = "none";
    }
    
    if (!animationFrameId) {
        game.lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Riattiva l'arma continua se necessario
    if (spaceship.weaponType === 4 && spaceship.firing && spaceship.isAlive && 
        AudioSystem && typeof AudioSystem.startContinuous === 'function') {
        spaceship.laserBeamActive = true;
        AudioSystem.startContinuous();
    }
}

// --- Game Over ---
function gameOver(victory = false) {
    if (game.isGameOver) return;
    
    game.isGameOver = true;
    game.running = false;
    
    // Ferma l'arma continua se attiva
    if (spaceship.laserBeamActive && AudioSystem && typeof AudioSystem.stopContinuous === 'function') {
        AudioSystem.stopContinuous();
    }
    
    // Riproduci suono di game over o vittoria
    if (AudioSystem) {
        if (victory) {
            AudioSystem.playGameStartSound(); // Usiamo il suono di inizio come fanfara di vittoria
        } else {
            AudioSystem.playGameOverSound();
        }
    }
    
    // Aggiorna UI
    if (gameOverOverlay) {
        if (victory) {
            gameOverOverlay.classList.add('victory');
            gameOverOverlay.querySelector('h2').textContent = "VITTORIA!";
        } else {
            gameOverOverlay.classList.remove('victory');
            gameOverOverlay.querySelector('h2').textContent = "FINE PARTITA";
        }
        
        if (finalScoreUI) {
            finalScoreUI.textContent = game.score;
        }
        
        // Controlla se è un nuovo high score
        const isNewHighScore = checkHighScore();
        
        if (isNewHighScore && highScoreEntryUI && !game.currentScoreSubmitted) {
            highScoreEntryUI.style.display = "block";
            if (playerNameInput) {
                playerNameInput.value = game.cadetName || "";
                setTimeout(() => {
                    playerNameInput.focus();
                    playerNameInput.select();
                }, 300);
            }
        } else {
            if (highScoreEntryUI) highScoreEntryUI.style.display = "none";
        }
        
        gameOverOverlay.style.display = "flex";
    }
    
    // Aggiorna display high scores
    displayHighScores();
}

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!game.running) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }
    
    if (game.paused) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    
    // Calcola il deltaTime
    if (!game.lastTime) game.lastTime = timestamp;
    game.deltaTime = timestamp - game.lastTime;
    game.lastTime = timestamp;
    
    // Limita il deltaTime per evitare salti strani
    if (game.deltaTime > 100) game.deltaTime = 100;
    
    // Incrementa il contatore di animazione
    game.animationFrame++;
    
    // Aggiorna il cooldown di sparo globale degli alieni
    if (game.globalAlienFireCooldown > 0) {
        game.globalAlienFireCooldown -= game.deltaTime;
    }
    
    // Aggiorna il timer dei messaggi UI
    if (game.uiMessageTimer > 0) {
        game.uiMessageTimer -= game.deltaTime;
        
        if (game.uiMessageTimer <= 0 && uiMessageDisplay) {
            uiMessageDisplay.classList.remove('visible');
        } else if (game.uiMessageTimer < UI_MESSAGE_FADEOUT_TIME && uiMessageDisplay) {
            uiMessageDisplay.style.opacity = game.uiMessageTimer / UI_MESSAGE_FADEOUT_TIME;
        } else if (uiMessageDisplay && !uiMessageDisplay.classList.contains('visible')) {
            uiMessageDisplay.textContent = game.uiMessage;
            uiMessageDisplay.classList.add('visible');
            uiMessageDisplay.style.opacity = 1;
        }
    }
    
    // Aggiorna il timer del flash dello schermo
    if (game.screenFlashTimer > 0) {
        game.screenFlashTimer -= game.deltaTime;
    }
    
    // Aggiorna il Boss
    if (gameBoss && gameBoss.active) {
        gameBoss.update(game.deltaTime);
    }
    
    // Aggiorna la navicella
    updateSpaceship(game.deltaTime);
    
    // Aggiorna proiettili
    updateProjectiles(game.playerProjectiles, game.deltaTime);
    updateProjectiles(game.alienProjectiles, game.deltaTime);
    
    // Aggiorna nemici
    updateAliens(game.deltaTime);
    
    // Aggiorna powerups
    updatePowerUps(game.deltaTime);
    
    // Aggiorna esplosioni
    updateExplosions(game.deltaTime);
    
    // Aggiorna cristalli se la funzione è disponibile
    if (typeof updateCrystals === 'function') {
        updateCrystals(game.deltaTime);
    }
    
    // Aggiorna sfondo
    updateStarsAndPlanets(game.deltaTime);
    
    // Verifica collisioni
    checkCollisions(game.deltaTime);
    
    // Gestione wave e spawning
    manageWavesAndSpawning(game.deltaTime);
    
    // Aggiorna UI
    if (game.animationFrame % 10 === 0) {
        updateGameUI(game, spaceship);
    }
    
    // Render
    render();
    
    // Continua il game loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Render ---
function render() {
    if (!ctx || !canvas) return;
    
    // Pulisci il canvas
    drawBackground();
    
    // Disegna le entità del gioco
    
    // Pianeti (già disegnati in drawBackground)
    
    // Cristalli
    if (typeof drawCrystals === 'function' && game.crystals) {
        drawCrystals(ctx);
    }
    
    // PowerUps
    for (const powerUp of game.powerUps) {
        powerUp.draw();
    }
    
    // Proiettili del giocatore
    for (const proj of game.playerProjectiles) {
        proj.draw(game.animationFrame);
    }
    
    // Proiettili nemici
    for (const alienProj of game.alienProjectiles) {
        alienProj.draw();
    }
    
    // Nemici
    for (const alien of game.aliens) {
        alien.draw();
    }
    
    // Boss
    if (gameBoss && gameBoss.active) {
        gameBoss.draw(ctx);
    }
    
    // Laser continuo
    if (spaceship.laserBeamActive && spaceship.weaponType === 4 && 
        spaceship.isAlive && isSpaceshipCurrentlyVisible()) {
        
        const laserWidth = 12;
        const centerX = spaceship.x + spaceship.width / 2;
        const startY = spaceship.y + 10;
        
        // Effetto bagliore
        const laserGlow = ctx.createLinearGradient(centerX, 0, centerX, startY);
        laserGlow.addColorStop(0, "rgba(150, 70, 200, 0.2)");
        laserGlow.addColorStop(1, "rgba(150, 70, 200, 0.8)");
        
        ctx.fillStyle = laserGlow;
        ctx.beginPath();
        ctx.rect(centerX - laserWidth * 2, 0, laserWidth * 4, startY);
        ctx.fill();
        
        // Raggio principale
        const laserGradient = ctx.createLinearGradient(centerX, 0, centerX, startY);
        laserGradient.addColorStop(0, "#ff88ff");
        laserGradient.addColorStop(0.5, "#aa44ff");
        laserGradient.addColorStop(1, "#8800ff");
        
        ctx.fillStyle = laserGradient;
        ctx.beginPath();
        ctx.rect(centerX - laserWidth / 2, 0, laserWidth, startY);
        ctx.fill();
        
        // Linee decorative
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - laserWidth / 2, 0);
        ctx.lineTo(centerX - laserWidth / 2, startY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + laserWidth / 2, 0);
        ctx.lineTo(centerX + laserWidth / 2, startY);
        ctx.stroke();
        
        // Effetto particellare
        for (let i = 0; i < 3; i++) {
            const particleY = Math.random() * startY;
            const particleSize = 2 + Math.random() * 3;
            const particleX = centerX + (Math.random() - 0.5) * laserWidth * 0.8;
            
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Navicella
    drawSpaceship();
    
    // Esplosioni
    for (const explosion of game.explosions) {
        explosion.draw(ctx);
    }
    
    // Effetto flash dello schermo
    if (game.screenFlashTimer > 0) {
        const alpha = game.screenFlashTimer / SCREEN_FLASH_DURATION * 0.3;
        ctx.fillStyle = `rgba(255, 70, 70, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// --- Start Game ---
function startGame(isRestart = false) {
    console.log("Starting game...");
    
    // Se è un riavvio, nascondi l'overlay di game over
    if (isRestart && gameOverOverlay) {
        gameOverOverlay.style.display = "none";
    }
    
    // Inizializza dati di gioco
    initGameData();
    
    // Riavvia la musica di gameplay
    if (AudioSystem) {
        // Stop musica attuale con fade out
        AudioSystem.stopAllMP3Music(500);
        
        // Avvia musica gameplay dopo il fade out
        setTimeout(() => {
            AudioSystem.playGameplayMP3();
        }, 600);
    }
    
    // Se era la prima partita, nascondi il pulsante di start
    if (startButton) {
        startButton.style.display = "none";
    }
    
    // Segnala che il gioco è in esecuzione
    game.running = true;
    game.paused = false;
    game.isGameOver = false;
    
    // Riproduci suono di inizio partita
    if (AudioSystem) {
        AudioSystem.playGameStartSound();
    }
    
    // Avvia il game loop
    game.lastTime = performance.now();
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Mostra messaggio di inizio
    game.uiMessage = "Partita Iniziata!";
    game.uiMessageTimer = UI_MESSAGE_DURATION;
    showUIMessage(game.uiMessage, "#40f0ff");
    
    console.log("Game started!");
}

// Inizializza il gioco quando la pagina è caricata
window.addEventListener('load', initGame);

// Esponi funzioni globalmente
window.game = game;
window.spaceship = spaceship;
window.startGame = startGame;
window.gameOver = gameOver;
window.togglePause = togglePause;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.checkHighScore = checkHighScore;
window.submitHighScore = submitHighScore;
window.displayHighScores = displayHighScores;
window.showUIMessage = showUIMessage;
window.updateBossUI = updateBossUI;
window.updateGameUI = updateGameUI;
window.createBossExplosion = createBossExplosion;
