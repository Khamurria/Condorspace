/**
 * CONDORSPACE - TEAM PARALLAX
 * Sistema Cristalli Esagonali
 */

// --- Classe Crystal (Cristalli Esagonali) ---
class Crystal {
    constructor(x, y, type = 0) {
        this.x = x;
        this.y = y;
        this.type = type; // 0 = piccolo, 1 = medio, 2 = grande, 3 = raro
        
        // Valori diversi in base al tipo
        switch(this.type) {
            case 0: // Piccolo (blu)
                this.width = 15;
                this.height = 15;
                this.value = 100;
                this.speed = 90 + Math.random() * 30;
                this.color = {
                    primary: "rgba(52, 152, 219, 0.8)",    // Blu con trasparenza
                    secondary: "rgba(41, 128, 185, 0.6)",  // Blu scuro con trasparenza
                    highlight: "rgba(179, 229, 252, 0.9)", // Highlight azzurro
                    glow: "#6ab7ff"
                };
                break;
            case 1: // Medio (verde)
                this.width = 20;
                this.height = 20;
                this.value = 250;
                this.speed = 80 + Math.random() * 25;
                this.color = {
                    primary: "rgba(46, 204, 113, 0.8)",    // Verde con trasparenza
                    secondary: "rgba(39, 174, 96, 0.6)",   // Verde scuro con trasparenza
                    highlight: "rgba(200, 255, 213, 0.9)", // Highlight verde chiaro
                    glow: "#6de896"
                };
                break;
            case 2: // Grande (arancione)
                this.width = 25;
                this.height = 25;
                this.value = 500;
                this.speed = 70 + Math.random() * 20;
                this.color = {
                    primary: "rgba(230, 126, 34, 0.8)",    // Arancione con trasparenza
                    secondary: "rgba(211, 84, 0, 0.6)",    // Arancione scuro con trasparenza
                    highlight: "rgba(255, 224, 178, 0.9)", // Highlight arancione chiaro
                    glow: "#f5ab6e"
                };
                break;
            case 3: // Raro (viola)
                this.width = 30;
                this.height = 30;
                this.value = 1000;
                this.speed = 60 + Math.random() * 15;
                this.color = {
                    primary: "rgba(155, 89, 182, 0.8)",    // Viola con trasparenza
                    secondary: "rgba(142, 68, 173, 0.6)",  // Viola scuro con trasparenza
                    highlight: "rgba(225, 190, 231, 0.9)", // Highlight viola chiaro
                    glow: "#c39bd3"
                };
                break;
        }
        
        this.active = true;
        this.rotationAngle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.pulseSize = 0;
        this.pulseSpeed = 0.08 + Math.random() * 0.04;
        
        // Effetti cristallo
        this.innerPulse = 0;
        this.innerPulseSpeed = 0.05 + Math.random() * 0.03;
        this.reflections = [];
        this.generateReflections();
        
        // Proprietà per l'effetto calamita
        this.isBeingAttracted = false;
        this.attractionSpeed = 0;
        this.maxAttractionSpeed = 500;
        this.attractionAcceleration = 2000;
    }
    
    // Genera riflessi casuali all'interno del cristallo
    generateReflections() {
        const reflectionCount = 2 + Math.floor(Math.random() * 3);
        this.reflections = [];
        
        for (let i = 0; i < reflectionCount; i++) {
            this.reflections.push({
                x: (Math.random() - 0.5) * 0.6,
                y: (Math.random() - 0.5) * 0.6,
                size: 0.1 + Math.random() * 0.3,
                angle: Math.random() * Math.PI * 2,
                speed: 0.01 + Math.random() * 0.03
            });
        }
    }
    
    update(deltaTime, playerShip) {
        if (!this.active) return;
        
        const dtSeconds = deltaTime / 1000;
        
        // Effetti di animazione
        this.pulseSize = Math.sin(window.game.animationFrame * this.pulseSpeed) * 2;
        this.rotationAngle += this.rotationSpeed * dtSeconds * 60;
        this.innerPulse = 0.7 + Math.sin(window.game.animationFrame * this.innerPulseSpeed) * 0.3;
        
        // Aggiorna posizione riflessi
        for (let reflection of this.reflections) {
            reflection.angle += reflection.speed * dtSeconds * 60;
        }
        
        // Verifica se il cristallo è nel raggio di attrazione della navicella
        const ATTRACTION_RADIUS = 150;
        
        if (playerShip && playerShip.isAlive) {
            const dx = (playerShip.x + playerShip.width / 2) - (this.x + this.width / 2);
            const dy = (playerShip.y + playerShip.height / 2) - (this.y + this.height / 2);
            const distSq = dx * dx + dy * dy;
            
            if (distSq < ATTRACTION_RADIUS * ATTRACTION_RADIUS) {
                // Attrazione magnetica
                this.isBeingAttracted = true;
                
                // Calcola la direzione verso il giocatore
                const dist = Math.sqrt(distSq);
                const dirX = dx / dist;
                const dirY = dy / dist;
                
                // Accelera verso il giocatore
                this.attractionSpeed = Math.min(
                    this.attractionSpeed + this.attractionAcceleration * dtSeconds,
                    this.maxAttractionSpeed
                );
                
                // Aumenta la velocità in base alla vicinanza
                const proximityFactor = 1 - (dist / ATTRACTION_RADIUS);
                const currentSpeed = this.attractionSpeed * proximityFactor;
                
                // Applica il movimento verso il giocatore
                this.x += dirX * currentSpeed * dtSeconds;
                this.y += dirY * currentSpeed * dtSeconds;
                
                // Verifica collisione con la navicella (raccolta)
                if (isColliding(this, playerShip)) {
                    this.active = false;
                    
                    // Aggiorna contatore cristalli e score
                    window.game.gemCount = (window.game.gemCount || 0) + 1;
                    window.game.gemValue = (window.game.gemValue || 0) + this.value;
                    window.game.score += this.value;
                    
                    // Effetto grafico di raccolta
                    createCrystalCollectEffect(this.x, this.y, this.color);
                    
                    // Suono di raccolta
                    playCrystalCollectSound(this.type);
                    
                    return;
                }
            } else {
                this.isBeingAttracted = false;
                this.attractionSpeed = 0;
                this.y += this.speed * dtSeconds;
            }
        } else {
            this.y += this.speed * dtSeconds;
        }
        
        // Disattiva se esce dallo schermo
        if (this.y > window.canvas.height + this.height) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active || !ctx) return;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotationAngle);
        
        // Dimensione attuale con pulsazione
        const size = this.width + this.pulseSize;
        
        // Effetto glow
        ctx.shadowColor = this.color.glow;
        ctx.shadowBlur = 15 + this.pulseSize;
        
        // Disegna esagono
        this.drawHexCrystal(ctx, size);
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // Disegna effetto di attrazione
        if (this.isBeingAttracted) {
            ctx.save();
            
            const attractionAlpha = Math.min(1.0, this.attractionSpeed / this.maxAttractionSpeed);
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${attractionAlpha * 0.4})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(window.spaceship.x + window.spaceship.width / 2, window.spaceship.y + window.spaceship.height / 2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // Disegna il cristallo esagonale con effetti di vetro
    drawHexCrystal(ctx, size) {
        const sides = 6;
        const step = Math.PI * 2 / sides;
        const halfSize = size / 2;
        
        // Disegna l'esagono base
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = i * step - Math.PI / 6; // Rotazione per avere un esagono "flat-top"
            const x = Math.cos(angle) * halfSize;
            const y = Math.sin(angle) * halfSize;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        // Riempimento con gradiente per effetto cristallo
        const gradient = ctx.createRadialGradient(0, 0, halfSize * this.innerPulse, 0, 0, halfSize);
        gradient.addColorStop(0, this.color.primary);
        gradient.addColorStop(0.7, this.color.secondary);
        gradient.addColorStop(1, this.color.primary);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Bordo dell'esagono
        ctx.strokeStyle = this.color.highlight;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Struttura interna (linee di divisione)
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(0, halfSize);
        ctx.strokeStyle = this.color.highlight + "60"; // Semitrasparente
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Linee diagonali per struttura cristallina
        ctx.beginPath();
        ctx.moveTo(-halfSize * 0.866, -halfSize * 0.5);
        ctx.lineTo(halfSize * 0.866, halfSize * 0.5);
        ctx.strokeStyle = this.color.highlight + "50";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-halfSize * 0.866, halfSize * 0.5);
        ctx.lineTo(halfSize * 0.866, -halfSize * 0.5);
        ctx.stroke();
        
        // Disegna riflessi interni
        for (let reflection of this.reflections) {
            const rx = reflection.x * halfSize;
            const ry = reflection.y * halfSize;
            const rs = reflection.size * halfSize;
            
            ctx.beginPath();
            ctx.arc(rx, ry, rs, 0, Math.PI * 2);
            
            const reflectionGradient = ctx.createRadialGradient(rx, ry, 0, rx, ry, rs);
            reflectionGradient.addColorStop(0, this.color.highlight);
            reflectionGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            
            ctx.fillStyle = reflectionGradient;
            ctx.fill();
        }
        
        // Piccoli punti luce
        const sparkleCount = 2 + Math.floor(this.type);
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (window.game.animationFrame * 0.01 + i * Math.PI * 2 / sparkleCount) % (Math.PI * 2);
            const distance = halfSize * 0.7 * Math.sin(window.game.animationFrame * 0.03 + i);
            
            const sx = Math.cos(angle) * distance * 0.5;
            const sy = Math.sin(angle) * distance * 0.5;
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(sx, sy, 1 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Effetto di raccolta cristallo
function createCrystalCollectEffect(x, y, color) {
    // Esplosione piccola e colorata
    const explosionColors = {
        primary: color.primary,
        secondary: color.secondary,
        accent: "#ffffff",
        glow: color.glow,
        energy: color.highlight
    };
    
    window.game.explosions.push(new window.Explosion(x, y, 25, explosionColors, "small"));
}

// Suono di raccolta cristallo
function playCrystalCollectSound(type) {
    if (!window.AudioSystem) return;
    
    switch(type) {
        case 0: // Piccolo
            window.AudioSystem.play('crystalSmall');
            break;
        case 1: // Medio
            window.AudioSystem.play('crystalMedium');
            break;
        case 2: // Grande
            window.AudioSystem.play('crystalLarge');
            break;
        case 3: // Raro
            window.AudioSystem.play('crystalRare');
            break;
    }
}

// Funzione per spawnare cristalli dai nemici
function spawnCrystalsFromAlien(alien) {
    // Determina quanti cristalli spawnare in base al tipo/dimensione del nemico
    let crystalCount = 0;
    let crystalTypes = [];
    
    // Usa la size e la maxHealth dell'alieno per determinare il tipo e numero di cristalli
    const alienPower = alien.size * alien.maxHealth;
    
    if (alienPower < 50) {
        // Nemico debole - 70% niente, 30% un cristallo piccolo
        if (Math.random() < 0.3) {
            crystalCount = 1;
            crystalTypes = [0];
        }
    } else if (alienPower < 100) {
        // Nemico medio - 50% niente, 40% un cristallo piccolo, 10% un cristallo medio
        const roll = Math.random();
        if (roll < 0.4) {
            crystalCount = 1;
            crystalTypes = [0];
        } else if (roll < 0.5) {
            crystalCount = 1;
            crystalTypes = [1];
        }
    } else if (alienPower < 200) {
        // Nemico forte
        const roll = Math.random();
        if (roll < 0.4) {
            crystalCount = 1;
            crystalTypes = [0];
        } else if (roll < 0.6) {
            crystalCount = 1;
            crystalTypes = [1];
        } else if (roll < 0.7) {
            crystalCount = 2;
            crystalTypes = [0, 0];
        }
    } else {
        // Boss o nemico elite
        const roll = Math.random();
        if (roll < 0.2) {
            crystalCount = 1;
            crystalTypes = [1];
        } else if (roll < 0.4) {
            crystalCount = 2;
            crystalTypes = [0, 1];
        } else if (roll < 0.6) {
            crystalCount = 1;
            crystalTypes = [2];
        } else if (roll < 0.9) {
            crystalCount = 2;
            crystalTypes = [1, 1];
        } else {
            crystalCount = 1;
            crystalTypes = [3]; // Cristallo raro
        }
    }
    
    // Spawna i cristalli
    if (!window.game.crystals) window.game.crystals = [];
    
    for (let i = 0; i < crystalCount; i++) {
        // Posiziona i cristalli attorno alla posizione del nemico
        const offsetX = (Math.random() - 0.5) * alien.size;
        const offsetY = (Math.random() - 0.5) * alien.size;
        
        const crystal = new Crystal(
            alien.x + offsetX,
            alien.y + offsetY,
            crystalTypes[i]
        );
        
        // Aggiungi il cristallo al gioco
        window.game.crystals.push(crystal);
    }
}

// Funzione per inizializzare il sistema audio con i suoni dei cristalli
function addCrystalSoundsToAudioSystem() {
    if (!window.AudioSystem || !window.AudioSystem.play) return;
    
    // Estende il metodo play per supportare i nuovi suoni
    const originalPlay = window.AudioSystem.play;
    window.AudioSystem.play = function(e) {
        if (!this.context || this.context.state !== 'running' || !this.sfxGainNode) return null;
        
        const t = this.context.currentTime;
        
        // Gestisci i nuovi suoni di cristallo
        switch(e) {
            case 'crystalSmall':
                this._createToneSweep("sine", 440, 880, 0.1, 0.3, 0.01, 0.05, t);
                this._createToneSweep("triangle", 660, 770, 0.05, 0.2, 0.01, 0.03, t + 0.02);
                return;
            case 'crystalMedium':
                this._createToneSweep("sine", 440, 880, 0.15, 0.4, 0.01, 0.08, t);
                this._createToneSweep("triangle", 660, 1100, 0.1, 0.3, 0.01, 0.05, t + 0.05);
                this._createFilteredNoise(0.05, 4000, 15, 0.1, "highpass", t + 0.02);
                return;
            case 'crystalLarge':
                this._createToneSweep("sine", 440, 880, 0.15, 0.5, 0.01, 0.1, t);
                this._createToneSweep("triangle", 660, 1100, 0.12, 0.4, 0.01, 0.08, t + 0.05);
                this._createToneSweep("sine", 880, 1320, 0.1, 0.3, 0.01, 0.05, t + 0.1);
                this._createFilteredNoise(0.1, 3500, 12, 0.15, "highpass", t + 0.05);
                return;
            case 'crystalRare':
                this._createToneSweep("sine", 440, 880, 0.15, 0.6, 0.01, 0.12, t);
                this._createToneSweep("triangle", 660, 1320, 0.12, 0.5, 0.01, 0.1, t + 0.08);
                this._createToneSweep("sine", 880, 1760, 0.1, 0.4, 0.01, 0.08, t + 0.16);
                this._createToneSweep("triangle", 1320, 2200, 0.08, 0.3, 0.01, 0.05, t + 0.24);
                this._createFilteredNoise(0.2, 3000, 10, 0.2, "highpass", t + 0.2);
                return;
            default:
                return originalPlay.call(this, e);
        }
    };
}

// Inizializzazione del sistema di cristalli
function initCrystalSystem() {
    console.log("Inizializzazione sistema di cristalli...");
    
    // Crea l'array di cristalli se non esiste
    if (!window.game.crystals) window.game.crystals = [];
    
    // Inizializza contatori
    window.game.gemCount = 0;
    window.game.gemValue = 0;
    
    // Aggiungi i suoni dei cristalli al sistema audio
    addCrystalSoundsToAudioSystem();
    
    // Aggiungi hook per far spawnare cristalli quando gli alieni vengono distrutti
    const originalTakeDamageFn = window.Alien.prototype.takeDamage;
    if (originalTakeDamageFn) {
        window.Alien.prototype.takeDamage = function(amount) {
            const wasDestroyed = originalTakeDamageFn.call(this, amount);
            if (wasDestroyed) {
                // Spawn cristalli
                spawnCrystalsFromAlien(this);
            }
            return wasDestroyed;
        };
    }
    
    console.log("Sistema di cristalli inizializzato!");
}

// Funzione per aggiornare i cristalli nel gameLoop
function updateCrystals(deltaTime) {
    if (!window.game.crystals) return;
    
    // Aggiorna e disegna cristalli
    for (let i = window.game.crystals.length - 1; i >= 0; i--) {
        window.game.crystals[i].update(deltaTime, window.spaceship);
        if (!window.game.crystals[i].active) {
            window.game.crystals.splice(i, 1);
        }
    }
    
    // Aggiorna UI
    updateCrystalCounter();
}

// Funzione per disegnare i cristalli
function drawCrystals(ctx) {
    if (!window.game.crystals || !ctx) return;
    
    for (let crystal of window.game.crystals) {
        crystal.draw(ctx);
    }
}
