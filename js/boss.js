/**
 * CONDORSPACE - TEAM PARALLAX
 * Sistema Boss - Comandante Scuderi e la sua nave ammiraglia
 */

// --- Classe Boss (Comandante Scuderi) ---
class Boss {
    constructor() {
        // Proprietà principali
        this.x = window.canvas.width / 2;
        this.y = -250;
        this.width = 200;
        this.height = 240;
        this.targetY = 150;
        this.maxHealth = 500;
        this.health = this.maxHealth;
        this.active = false;
        this.defeated = false;
        this.isEntering = true;
        this.entranceSpeed = 40;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.002;
        
        // Timers e fasi
        this.currentPhase = 0;
        this.phaseTimer = 0;
        this.actionTimer = 0;
        this.currentAction = 'idle';
        this.phaseChangeThresholds = [0.7, 0.4, 0.15]; // % di vita per cambio fase
        this.damageMultiplier = 1.0;
        this.invulnerable = true;
        this.warningBeamActive = false;
        this.chargeBeamTimer = 0;
        
        // Colori e styling
        this.colors = {
            primary: "#cc3300",
            secondary: "#aa2200",
            accent: "#ffaa00",
            glow: "#ff6600",
            energy: "#ffff88",
            shields: "#8080ff"
        };
        
        // Effetti
        this.pulsePhase = 0;
        this.shieldPulse = 0;
        this.hitEffects = [];
        this.engineGlow = 1.0;
        this.weaponCharge = 0;
        this.chargeSpeed = 0;
        this.powerupPulse = 0;
        
        // Pattern di movimento
        this.movePattern = 'idle';
        this.moveTimer = 0;
        this.moveSpeed = 70;
        this.targetX = this.x;
        this.horizontalAmplitude = window.canvas.width * 0.35;
        this.horizontalFrequency = 0.0004;
        this.horizontalPhase = 0;
        
        // Sistema di componenti
        this.components = {
            core: {
                x: 0,
                y: 0,
                width: 60,
                height: 60,
                active: true,
                isHittable: true,
                health: 200,
                maxHealth: 200,
                damageMultiplier: 0.5
            },
            leftWing: {
                x: -70,
                y: 20,
                width: 80,
                height: 40,
                active: true,
                isHittable: true,
                health: 100,
                maxHealth: 100,
                damageMultiplier: 1.2
            },
            rightWing: {
                x: 70,
                y: 20,
                width: 80,
                height: 40,
                active: true,
                isHittable: true,
                health: 100,
                maxHealth: 100,
                damageMultiplier: 1.2
            },
            frontCannon: {
                x: 0,
                y: -60,
                width: 40,
                height: 60,
                active: true,
                isHittable: true,
                health: 80,
                maxHealth: 80,
                damageMultiplier: 1.5
            },
            leftEngine: {
                x: -50,
                y: 70,
                width: 30,
                height: 50,
                active: true,
                isHittable: true,
                health: 60,
                maxHealth: 60,
                damageMultiplier: 1.0
            },
            rightEngine: {
                x: 50,
                y: 70,
                width: 30,
                height: 50,
                active: true,
                isHittable: true,
                health: 60,
                maxHealth: 60,
                damageMultiplier: 1.0
            },
            shield: {
                active: true,
                health: 150,
                maxHealth: 150,
                regenRate: 0.1,
                regenTimer: 0,
                regenCooldown: 5000,
                regenActive: false
            }
        };
    }
    
    // Spawna il boss nel gioco
    spawn() {
        this.active = true;
        this.health = this.maxHealth;
        this.isEntering = true;
        this.defeated = false;
        this.currentPhase = 0;
        this.phaseTimer = 0;
        this.actionTimer = 0;
        this.invulnerable = true;
        this.damageMultiplier = 1.0;
        
        // Reset salute di tutti i componenti
        Object.keys(this.components).forEach(key => {
            const comp = this.components[key];
            if (typeof comp.health !== 'undefined') {
                comp.health = comp.maxHealth;
                comp.active = true;
            }
        });
        
        // Attiva lo scudo inizialmente
        this.components.shield.active = true;
        this.components.shield.health = this.components.shield.maxHealth;
        
        console.log("Boss spawned!");
        window.game.bossSpawned = true;
        window.game.bossDefeated = false;
        
        // Mostra la barra della salute del boss
        const bossHealthBarContainer = document.getElementById('bossHealthBarContainer');
        if (bossHealthBarContainer) {
            bossHealthBarContainer.style.display = 'block';
        }
        
        // Musica boss
        if (window.AudioSystem && window.AudioSystem.playBossBattleMusic) {
            window.AudioSystem.playBossBattleMusic();
        }
        
        // Notifica UI
        window.game.uiMessage = "COMANDANTE SCUDERI";
        window.game.uiMessageTimer = window.UI_MESSAGE_DURATION + 1500;
        
        if (window.uiMessageDisplay) {
            window.uiMessageDisplay.style.color = "#ff4444";
        }
        
        // Aggiorna UI del boss
        if (typeof window.updateBossUI === 'function') {
            window.updateBossUI(this.health, this.maxHealth, "COMANDANTE SCUDERI");
        }
    }
    
    // Gestisce il danno
    takeDamage(amount, hitX, hitY) {
        if (!this.active || this.isEntering || this.invulnerable || this.defeated) return false;
        
        // Determina il componente colpito
        let hitComponent = null;
        let damageMultiplier = 1.0;
        
        if (hitX && hitY) {
            // Converti le coordinate globali in coordinate locali del boss
            const localX = hitX - this.x;
            const localY = hitY - this.y;
            
            // Verifica la collisione con ogni componente
            for (const key in this.components) {
                const comp = this.components[key];
                if (!comp.active || !comp.isHittable) continue;
                
                const compLeft = comp.x - comp.width / 2;
                const compRight = comp.x + comp.width / 2;
                const compTop = comp.y - comp.height / 2;
                const compBottom = comp.y + comp.height / 2;
                
                if (localX >= compLeft && localX <= compRight && 
                    localY >= compTop && localY <= compBottom) {
                    hitComponent = comp;
                    damageMultiplier = comp.damageMultiplier || 1.0;
                    break;
                }
            }
        }
        
        // Se abbiamo uno scudo attivo, danneggia quello invece
        if (this.components.shield.active && this.components.shield.health > 0) {
            this.components.shield.health -= amount;
            this.components.shield.regenTimer = this.components.shield.regenCooldown;
            this.components.shield.regenActive = false;
            
            // Crea un effetto visivo dove lo scudo è stato colpito
            if (hitX && hitY) {
                const shieldHitEffect = {
                    x: hitX - this.x,
                    y: hitY - this.y,
                    size: 25,
                    life: 1.0,
                    rotation: Math.random() * Math.PI * 2,
                    color: "#8080ff"
                };
                
                this.hitEffects.push(shieldHitEffect);
            }
            
            // Se lo scudo è stato distrutto
            if (this.components.shield.health <= 0) {
                this.components.shield.active = false;
                window.game.explosions.push(new window.Explosion(
                    this.x, 
                    this.y, 
                    this.width * 0.6,
                    { primary: "#8080ff", secondary: "#4040ff", energy: "#ffffff" },
                    "medium"
                ));
                
                if (window.AudioSystem) {
                    window.AudioSystem.playExplosionSound('medium');
                }
                
                window.game.uiMessage = "Scudi del boss neutralizzati!";
                window.game.uiMessageTimer = window.UI_MESSAGE_DURATION;
                if (window.uiMessageDisplay) {
                    window.uiMessageDisplay.style.color = "#40f0ff";
                }
            }
            
            return true;
        }
        
        // Applica il danno al componente colpito o al boss in generale
        if (hitComponent) {
            const actualDamage = amount * damageMultiplier;
            hitComponent.health -= actualDamage;
            
            // Crea un effetto visivo
            const hitEffect = {
                x: hitX - this.x,
                y: hitY - this.y,
                size: 15 + Math.random() * 10,
                life: 1.0,
                rotation: Math.random() * Math.PI * 2,
                color: "#ffaa00"
            };
            
            this.hitEffects.push(hitEffect);
            
            // Se il componente è stato distrutto
            if (hitComponent.health <= 0 && hitComponent.active) {
                hitComponent.active = false;
                hitComponent.health = 0;
                
                // Esplosione
                window.game.explosions.push(new window.Explosion(
                    this.x + hitComponent.x, 
                    this.y + hitComponent.y, 
                    hitComponent.width * 1.5,
                    this.colors,
                    "medium"
                ));
                
                if (window.AudioSystem) {
                    window.AudioSystem.playExplosionSound('medium');
                }
                
                // Disabilita funzionalità in base al componente distrutto
                if (key === 'leftEngine' || key === 'rightEngine') {
                    this.moveSpeed = Math.max(20, this.moveSpeed - 25);
                    window.game.score += 2500;
                } else if (key === 'frontCannon') {
                    this.damageMultiplier = Math.max(0.5, this.damageMultiplier - 0.3);
                    window.game.score += 5000;
                } else if (key === 'leftWing' || key === 'rightWing') {
                    window.game.score += 3500;
                } else if (key === 'core') {
                    // Danneggia molto il boss quando il core è distrutto
                    this.health -= this.maxHealth * 0.2;
                    window.game.score += 10000;
                }
            }
            
            // Aggiorna la salute totale del boss basandosi sullo stato dei componenti
            this.updateTotalHealth();
        } else {
            // Danno generico al boss
            this.health -= amount;
            
            // Effetto visivo
            if (hitX && hitY) {
                const hitEffect = {
                    x: hitX - this.x,
                    y: hitY - this.y,
                    size: 15 + Math.random() * 10,
                    life: 1.0,
                    rotation: Math.random() * Math.PI * 2,
                    color: "#ffaa00"
                };
                
                this.hitEffects.push(hitEffect);
            }
        }
        
        // Verifica cambio fase
        this.checkPhaseChange();
        
        // Verifica sconfitta del boss
        if (this.health <= 0 && !this.defeated) {
            this.health = 0;
            this.defeated = true;
            this.defeatBoss();
        }
        
        // Aggiorna UI del boss
        if (typeof window.updateBossUI === 'function') {
            window.updateBossUI(this.health, this.maxHealth, "COMANDANTE SCUDERI");
        }
        
        return true;
    }
    
    // Aggiorna lo stato totale della salute in base ai componenti
    updateTotalHealth() {
        // La salute totale è influenzata dallo stato dei componenti
        let componentsHealth = 0;
        let componentsMaxHealth = 0;
        
        for (const key in this.components) {
            const comp = this.components[key];
            if (typeof comp.health !== 'undefined' && comp.isHittable) {
                componentsHealth += comp.health;
                componentsMaxHealth += comp.maxHealth;
            }
        }
        
        // La salute del boss è parzialmente basata sulla salute dei componenti
        const componentHealthRatio = componentsHealth / componentsMaxHealth;
        const adjustedHealth = this.maxHealth * (0.6 + componentHealthRatio * 0.4);
        
        // Limita la salute massima in base allo stato dei componenti
        this.health = Math.min(this.health, adjustedHealth);
    }
    
    // Verifica se bisogna cambiare fase
    checkPhaseChange() {
        const healthRatio = this.health / this.maxHealth;
        const shouldBePhase = this.phaseChangeThresholds.findIndex(threshold => healthRatio <= threshold) + 1;
        
        if (shouldBePhase > this.currentPhase) {
            this.currentPhase = shouldBePhase;
            this.phaseTimer = 0;
            
            // Effetti cambio fase
            window.game.explosions.push(new window.Explosion(
                this.x,
                this.y,
                this.width * 0.7,
                this.colors,
                "large"
            ));
            
            if (window.AudioSystem) {
                window.AudioSystem.playExplosionSound('large');
            }
            
            // Incrementa danno e velocità con le fasi
            this.damageMultiplier += 0.3;
            this.moveSpeed += 20;
            
            // Messaggi in base alla fase
            switch (this.currentPhase) {
                case 1:
                    window.game.uiMessage = "Il Comandante Scuderi aumenta la potenza!";
                    break;
                case 2:
                    window.game.uiMessage = "Attivati protocolli Backoffice d'emergenza!";
                    break;
                case 3:
                    window.game.uiMessage = "Il Comandante Scuderi è furioso!";
                    break;
            }
            
            window.game.uiMessageTimer = window.UI_MESSAGE_DURATION;
            if (window.uiMessageDisplay) {
                window.uiMessageDisplay.style.color = "#ff4444";
            }
            
            // Ripristina temporaneamente lo scudo a fasi avanzate
            if (this.currentPhase >= 2 && !this.components.shield.active) {
                this.components.shield.active = true;
                this.components.shield.health = this.components.shield.maxHealth * 0.6;
                this.components.shield.regenRate = 0.2;
            }
        }
    }
    
    // Gestisce la sconfitta del boss
    defeatBoss() {
        if (!this.active || !this.defeated) return;
        
        console.log("Boss defeated!");
        window.game.bossDefeated = true;
        
        // Megaesplosione
        if (typeof window.createBossExplosion === 'function') {
            window.createBossExplosion(this.x, this.y, 150);
        } else {
            // Fallback se manca la funzione specifica
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * this.width;
                    const offsetY = (Math.random() - 0.5) * this.height;
                    window.game.explosions.push(new window.Explosion(
                        this.x + offsetX,
                        this.y + offsetY,
                        50 + Math.random() * 50,
                        this.colors,
                        Math.random() < 0.5 ? "medium" : "large"
                    ));
                }, i * 200);
            }
        }
        
        // Nascondi la barra della salute
        const bossHealthBarContainer = document.getElementById('bossHealthBarContainer');
        if (bossHealthBarContainer) {
            bossHealthBarContainer.style.display = 'none';
        }
        
        // Audio esplosione
        if (window.AudioSystem) {
            window.AudioSystem.playMegaExplosionSound();
            window.AudioSystem.stopAllMusic(1.0);
        }
        
        // Score bonus
        window.game.score += 100000;
        
        // Vittoria
        setTimeout(() => {
            if (!window.game.isGameOver) {
                gameOver(true);
            }
        }, 5000);
    }
    
    // Aggiorna lo stato del boss
    update(deltaTime) {
        if (!this.active) return false;
        
        // Gestione dell'entrata in scena
        if (this.isEntering) {
            const dtSeconds = deltaTime / 1000;
            this.y += this.entranceSpeed * dtSeconds;
            
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.isEntering = false;
                this.invulnerable = false;
                
                // Inizia con un pattern di movimento
                this.movePattern = 'sine';
                this.horizontalPhase = 0;
            }
            
            return true;
        }
        
        if (this.defeated) return true;
        
        // Aggiorna gli effetti visivi
        this.updateVisualEffects(deltaTime);
        
        // Gestione dello scudo
        this.updateShield(deltaTime);
        
        // Gestione del movimento
        this.updateMovement(deltaTime);
        
        // Gestione degli attacchi
        this.updateAttacks(deltaTime);
        
        // Azioni in base alla fase
        this.phaseTimer += deltaTime;
        this.updatePhaseActions(deltaTime);
        
        return true;
    }
    
    // Aggiorna gli effetti visivi
    updateVisualEffects(deltaTime) {
        // Animazione pulsante
        this.pulsePhase += deltaTime * 0.0015;
        this.shieldPulse = 0.7 + Math.sin(this.pulsePhase * 2) * 0.3;
        this.engineGlow = 0.8 + Math.sin(this.pulsePhase * 3 + 1) * 0.2;
        this.powerupPulse = (this.powerupPulse + deltaTime * 0.003) % (Math.PI * 2);
        
        // Rotazione lenta
        this.rotationAngle += this.rotationSpeed * deltaTime;
        
        // Aggiorna gli effetti di colpo
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.life -= deltaTime * 0.002;
            effect.size *= (1 - deltaTime * 0.001);
            return effect.life > 0;
        });
    }
    
    // Aggiorna lo scudo
    updateShield(deltaTime) {
        if (!this.components.shield.active) {
            // Rigenerazione dello scudo dopo un po' in fasi avanzate
            if (this.currentPhase >= 2) {
                this.components.shield.regenTimer -= deltaTime;
                
                if (this.components.shield.regenTimer <= 0 && !this.components.shield.regenActive) {
                    this.components.shield.regenActive = true;
                    this.components.shield.health = 0; // Parte da zero
                    this.components.shield.active = true;
                    
                    // Notifica
                    window.game.uiMessage = "Lo scudo nemico si rigenera!";
                    window.game.uiMessageTimer = window.UI_MESSAGE_DURATION;
                    if (window.uiMessageDisplay) {
                        window.uiMessageDisplay.style.color = "#40f0ff";
                    }
                }
            }
        } else if (this.components.shield.regenActive) {
            // Rigenerazione scudo
            this.components.shield.health = Math.min(
                this.components.shield.maxHealth,
                this.components.shield.health + this.components.shield.regenRate * deltaTime
            );
            
            // Disattiva rigenerazione quando è completo
            if (this.components.shield.health >= this.components.shield.maxHealth) {
                this.components.shield.regenActive = false;
            }
        }
    }
    
    // Aggiorna il movimento
    updateMovement(deltaTime) {
        const dtSeconds = deltaTime / 1000;
        
        switch (this.movePattern) {
            case 'idle':
                // Resta fermo
                break;
                
            case 'sine':
                // Movimento sinusoidale
                this.horizontalPhase += this.horizontalFrequency * deltaTime;
                this.x = window.canvas.width / 2 + Math.sin(this.horizontalPhase) * this.horizontalAmplitude;
                break;
                
            case 'target':
                // Si muove verso un obiettivo
                const dx = this.targetX - this.x;
                if (Math.abs(dx) > 5) {
                    this.x += Math.sign(dx) * this.moveSpeed * dtSeconds;
                } else {
                    this.movePattern = 'sine';
                }
                break;
                
            case 'random':
                // Movimento casuale
                this.moveTimer -= deltaTime;
                if (this.moveTimer <= 0) {
                    // Cambia direzione
                    this.targetX = Math.random() * (window.canvas.width - this.width / 2) + this.width / 4;
                    this.movePattern = 'target';
                    this.moveTimer = 3000 + Math.random() * 2000;
                }
                break;
        }
        
        // Limita la posizione
        this.x = Math.max(this.width / 2, Math.min(window.canvas.width - this.width / 2, this.x));
    }
    
    // Aggiorna gli attacchi
    updateAttacks(deltaTime) {
        this.actionTimer -= deltaTime;
        
        if (this.warningBeamActive) {
            // Gestione del raggio di avvertimento
            this.chargeBeamTimer -= deltaTime;
            
            if (this.chargeBeamTimer <= 0) {
                this.warningBeamActive = false;
                this.fireDeathBeam();
            }
            
            return;
        }
        
        if (this.actionTimer <= 0 && !this.isEntering && !this.defeated && window.spaceship.isAlive) {
            // Scegli un attacco in base alla fase
            const possibleAttacks = this.getAttacksForPhase();
            const attackType = possibleAttacks[Math.floor(Math.random() * possibleAttacks.length)];
            
            this.executeAttack(attackType);
            
            // Cooldown più rapido nelle fasi avanzate
            this.actionTimer = 3000 - this.currentPhase * 500 + Math.random() * 1000;
        }
    }
    
    // Ottieni gli attacchi disponibili per la fase corrente
    getAttacksForPhase() {
        const baseAttacks = ['spreadShot', 'waveFire'];
        
        if (this.currentPhase >= 1) {
            baseAttacks.push('targetedShot', 'mineField');
        }
        
        if (this.currentPhase >= 2) {
            baseAttacks.push('bulletHell', 'crossFire');
        }
        
        if (this.currentPhase >= 3) {
            baseAttacks.push('deathBeam', 'bulletHell');
        }
        
        // Rimuovi gli attacchi se i relativi componenti sono distrutti
        if (!this.components.frontCannon.active) {
            const idx = baseAttacks.indexOf('deathBeam');
            if (idx !== -1) baseAttacks.splice(idx, 1);
        }
        
        if (!this.components.leftWing.active && !this.components.rightWing.active) {
            const idx = baseAttacks.indexOf('bulletHell');
            if (idx !== -1) baseAttacks.splice(idx, 1);
        }
        
        return baseAttacks;
    }
    
    // Esegue un attacco
    executeAttack(attackType) {
        if (!window.game.alienProjectiles) window.game.alienProjectiles = [];
        
        if (!this.components.frontCannon.active && 
            (attackType === 'spreadShot' || attackType === 'deathBeam')) {
            attackType = 'waveFire'; // Fallback se il cannone è distrutto
        }
        
        switch (attackType) {
            case 'spreadShot':
                this.executeSpreadShot();
                break;
                
            case 'waveFire':
                this.executeWaveFire();
                break;
                
            case 'targetedShot':
                this.executeTargetedShot();
                break;
                
            case 'mineField':
                this.executeMineField();
                break;
                
            case 'bulletHell':
                this.executeBulletHell();
                break;
                
            case 'crossFire':
                this.executeCrossFire();
                break;
                
            case 'deathBeam':
                this.startDeathBeamWarning();
                break;
        }
    }
    
    // Attacco: Sparo a ventaglio
    executeSpreadShot() {
        const numShots = 7 + this.currentPhase * 2;
        const spreadAngle = Math.PI * 0.6;
        const startAngle = Math.PI * 0.5 - (spreadAngle / 2);
        
        for (let i = 0; i < numShots; i++) {
            const angle = startAngle + (i / (numShots - 1)) * spreadAngle;
            const speed = 160 + Math.random() * 40;
            const size = 7 + Math.random() * 3;
            
            const proj = new window.AlienProjectile(
                this.x + this.components.frontCannon.x,
                this.y + this.components.frontCannon.y + 30,
                speed,
                size,
                this.colors.energy
            );
            
            // Modifica velocità per seguire l'angolo
            proj.speedX = Math.cos(angle) * speed;
            proj.speedY = Math.sin(angle) * speed;
            
            window.game.alienProjectiles.push(proj);
        }
        
        if (window.AudioSystem) {
            window.AudioSystem.playAlienLaserSound();
        }
    }
    
    // Attacco: Onda di fuoco
    executeWaveFire() {
        const numWaves = 3 + Math.min(2, this.currentPhase);
        const shotsPerWave = 8 + this.currentPhase * 2;
        const waveSpacing = 300; // ms
        
        const fireWave = (waveNum) => {
            for (let i = 0; i < shotsPerWave; i++) {
                const angle = (i / shotsPerWave) * Math.PI * 2;
                const speedMod = 1 + (Math.sin(angle * 2) * 0.2);
                const speed = (140 + waveNum * 20) * speedMod;
                const size = 5 + Math.random() * 3;
                
                // Posizioni di spawn basate sui componenti attivi
                let spawnX, spawnY;
                
                if (this.components.leftWing.active && i < shotsPerWave / 3) {
                    spawnX = this.x + this.components.leftWing.x;
                    spawnY = this.y + this.components.leftWing.y;
                } else if (this.components.rightWing.active && i >= 2 * shotsPerWave / 3) {
                    spawnX = this.x + this.components.rightWing.x;
                    spawnY = this.y + this.components.rightWing.y;
                } else {
                    spawnX = this.x;
                    spawnY = this.y + 30;
                }
                
                const proj = new window.AlienProjectile(
                    spawnX,
                    spawnY,
                    speed,
                    size,
                    this.currentPhase >= 2 ? this.colors.accent : this.colors.energy
                );
                
                // Modifica velocità per seguire l'angolo
                proj.speedX = Math.cos(angle) * speed;
                proj.speedY = Math.sin(angle) * speed;
                
                window.game.alienProjectiles.push(proj);
            }
            
            if (window.AudioSystem) {
                window.AudioSystem.playAlienLaserSound();
            }
        };
        
        // Spara la prima ondata subito
        fireWave(0);
        
        // Spara le ondate successive con delay
        for (let wave = 1; wave < numWaves; wave++) {
            setTimeout(() => {
                if (this.active && !this.defeated) {
                    fireWave(wave);
                }
            }, wave * waveSpacing);
        }
    }
    
    // Attacco: Sparo mirato
    executeTargetedShot() {
        if (!window.spaceship.isAlive) return;
        
        const numShots = 3 + this.currentPhase;
        const shotSpacing = 200; // ms
        
        const fireShot = (shotNum) => {
            // Calcola direzione verso il giocatore
            const targetX = window.spaceship.x + window.spaceship.width / 2;
            const targetY = window.spaceship.y + window.spaceship.height / 2;
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const angle = Math.atan2(dy, dx);
            
            // Base speed and tracking factor
            const speed = 210 + shotNum * 20;
            const trackingFactor = 0.3 + this.currentPhase * 0.15 + shotNum * 0.05;
            const size = 8 + Math.random() * 4;
            
            // Posizione di spawn
            let spawnX, spawnY;
            if (this.components.frontCannon.active) {
                spawnX = this.x + this.components.frontCannon.x;
                spawnY = this.y + this.components.frontCannon.y + 20;
            } else {
                spawnX = this.x;
                spawnY = this.y + 20;
            }
            
            const proj = new window.AlienProjectile(
                spawnX,
                spawnY,
                speed,
                size,
                this.colors.accent,
                trackingFactor * 100
            );
            
            // Modifica velocità iniziale
            proj.speedX = Math.cos(angle) * speed;
            proj.speedY = Math.sin(angle) * speed;
            
            window.game.alienProjectiles.push(proj);
            
            if (window.AudioSystem) {
                window.AudioSystem.playAlienLaserSound();
            }
        };
        
        // Spara il primo colpo subito
        fireShot(0);
        
        // Spara i colpi successivi con delay
        for (let shot = 1; shot < numShots; shot++) {
            setTimeout(() => {
                if (this.active && !this.defeated && window.spaceship.isAlive) {
                    fireShot(shot);
                }
            }, shot * shotSpacing);
        }
    }
    
    // Attacco: Campo minato
    executeMineField() {
        const numMines = 4 + this.currentPhase * 2;
        const fieldWidth = window.canvas.width * 0.7;
        const fieldTop = this.y + 100;
        const fieldBottom = window.canvas.height * 0.7;
        
        for (let i = 0; i < numMines; i++) {
            const x = (window.canvas.width - fieldWidth) / 2 + Math.random() * fieldWidth;
            const y = fieldTop + Math.random() * (fieldBottom - fieldTop);
            const size = 12 + Math.random() * 6;
            
            const mine = new window.AlienProjectile(
                x,
                y,
                0, // Velocità zero (stazionaria)
                size,
                i % 2 === 0 ? this.colors.accent : this.colors.primary
            );
            
            // Imposta velocità a zero
            mine.speedX = 0;
            mine.speedY = 0;
            
            // Imposta il timer di vita
            mine.lifeTimer = 5000 + Math.random() * 2000;
            
            // Funzione di esplosione personalizzata
            mine.explode = function() {
                this.active = false;
                
                // Crea un'esplosione
                if (window.game && window.game.explosions) {
                    window.game.explosions.push(new window.Explosion(
                        this.x,
                        this.y,
                        60,
                        { primary: "#ff8800", secondary: "#ffaa44", accent: "#ffffff" },
                        'medium'
                    ));
                }
                
                // Riproduci suono esplosione
                if (window.AudioSystem) {
                    window.AudioSystem.playExplosionSound('medium');
                }
                
                // Spara proiettili in tutte le direzioni
                const numProjectiles = 8;
                for (let j = 0; j < numProjectiles; j++) {
                    const angle = (j / numProjectiles) * Math.PI * 2;
                    const projSpeed = 180 + Math.random() * 60;
                    const projSize = 6 + Math.random() * 2;
                    
                    const proj = new window.AlienProjectile(
                        this.x,
                        this.y,
                        projSpeed,
                        projSize,
                        "#ff8800"
                    );
                    
                    // Imposta velocità con angolo
                    proj.speedX = Math.cos(angle) * projSpeed;
                    proj.speedY = Math.sin(angle) * projSpeed;
                    
                    window.game.alienProjectiles.push(proj);
                }
            };
            
            window.game.alienProjectiles.push(mine);
        }
        
        if (window.AudioSystem) {
            window.AudioSystem.playAlienLaserSound();
        }
    }
    
    // Attacco: Bullet Hell
    executeBulletHell() {
        const numBursts = 5 + this.currentPhase;
        const burstSpacing = 200; // ms
        const shotsPerBurst = 6 + this.currentPhase;
        
        let burstCount = 0;
        
        const fireBurst = () => {
            if (!this.active || this.defeated) return;
            
            const angleOffset = (burstCount / numBursts) * Math.PI;
            
            for (let i = 0; i < shotsPerBurst; i++) {
                const angle = angleOffset + (i / shotsPerBurst) * Math.PI * 2;
                const speed = 160 + Math.random() * 40;
                const size = 5 + Math.random() * 2;
                
                // Alterna i colori
                const color = burstCount % 2 === 0 ? this.colors.energy : this.colors.accent;
                
                const proj = new window.AlienProjectile(
                    this.x,
                    this.y,
                    speed,
                    size,
                    color
                );
                
                // Modifica velocità per seguire l'angolo
                proj.speedX = Math.cos(angle) * speed;
                proj.speedY = Math.sin(angle) * speed;
                
                window.game.alienProjectiles.push(proj);
            }
            
            if (window.AudioSystem) {
                window.AudioSystem.playAlienLaserSound();
            }
            
            burstCount++;
            
            if (burstCount < numBursts) {
                setTimeout(fireBurst, burstSpacing);
            }
        };
        
        // Inizia la sequenza
        fireBurst();
    }
    
    // Attacco: Fuoco incrociato
    executeCrossFire() {
        const numRows = 3 + Math.min(2, this.currentPhase);
        const rowSpacing = 200; // ms
        const baseY = this.y + 80;
        const rowHeight = (window.canvas.height - baseY) / (numRows + 1);
        
        const fireRow = (rowNum) => {
            const y = baseY + rowNum * rowHeight;
            const direction = rowNum % 2 === 0 ? 1 : -1;
            const numShots = 10 + this.currentPhase * 2;
            const shotSpacing = window.canvas.width / numShots;
            
            for (let i = 0; i < numShots; i++) {
                const x = direction > 0 ? i * shotSpacing : window.canvas.width - i * shotSpacing;
                const speed = 140 + Math.random() * 30;
                const size = 5 + Math.random() * 3;
                
                // Alterna i colori
                const color = rowNum % 2 === 0 ? this.colors.energy : this.colors.accent;
                
                const proj = new window.AlienProjectile(
                    x,
                    y,
                    speed,
                    size,
                    color
                );
                
                // Imposta velocità orizzontale
                proj.speedX = direction * speed * 0.4;
                proj.speedY = speed * 0.6;
                
                window.game.alienProjectiles.push(proj);
            }
            
            if (window.AudioSystem) {
                window.AudioSystem.playAlienLaserSound();
            }
        };
        
        // Spara la prima riga subito
        fireRow(0);
        
        // Spara le righe successive con delay
        for (let row = 1; row < numRows; row++) {
            setTimeout(() => {
                if (this.active && !this.defeated) {
                    fireRow(row);
                }
            }, row * rowSpacing);
        }
    }
    
    // Inizia l'avvertimento per il Death Beam
    startDeathBeamWarning() {
        this.warningBeamActive = true;
        this.chargeBeamTimer = 2000 - this.currentPhase * 300;
        
        // Usa la posizione del cannone frontale o la posizione del boss
        let beamX;
        if (this.components.frontCannon.active) {
            beamX = this.x + this.components.frontCannon.x;
        } else {
            beamX = this.x;
        }
        
        // Aggiungi effetto raggio di avvertimento
        const warningBeam = new window.Explosion(
            beamX,
            window.canvas.height / 2,
            1,
            this.colors,
            'custom'
        );
        
        warningBeam.type = 'beam';
        warningBeam.life = this.chargeBeamTimer;
        warningBeam.startTime = window.game.lastTime;
        
        warningBeam.draw = (ctx) => {
            if (!ctx || !this.active || !this.warningBeamActive) return;
            
            const elapsed = window.game.lastTime - warningBeam.startTime;
            const progress = Math.min(1, elapsed / (warningBeam.life * 0.7));
            const pulseEffect = Math.sin(window.game.animationFrame * 0.1) * 5;
            
            ctx.save();
            
            // Raggio di avvertimento (linea tratteggiata)
            ctx.strokeStyle = this.colors.accent;
            ctx.lineWidth = 8 + pulseEffect * progress;
            ctx.setLineDash([15, 10]);
            ctx.lineCap = "round";
            ctx.globalAlpha = 0.6 + Math.sin(window.game.animationFrame * 0.2) * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(beamX, this.y + 30);
            ctx.lineTo(beamX, window.canvas.height);
            ctx.stroke();
            
            // Puntini energetici
            ctx.setLineDash([]);
            for (let i = 0; i < 10; i++) {
                const dotY = this.y + 50 + (window.canvas.height - this.y - 50) * (i / 10) + 
                             Math.sin(window.game.animationFrame * 0.1 + i) * 5 * progress;
                
                ctx.fillStyle = i % 2 === 0 ? this.colors.energy : this.colors.accent;
                ctx.globalAlpha = 0.8 * progress;
                ctx.beginPath();
                ctx.arc(beamX, dotY, 4 + Math.sin(window.game.animationFrame * 0.2 + i) * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Effetto carica al cannone
            if (this.components.frontCannon.active) {
                const chargeGradient = ctx.createRadialGradient(
                    beamX, this.y + this.components.frontCannon.y + 20,
                    2, 
                    beamX, this.y + this.components.frontCannon.y + 20,
                    30 * progress + pulseEffect
                );
                
                chargeGradient.addColorStop(0, this.colors.energy);
                chargeGradient.addColorStop(0.6, this.colors.accent);
                chargeGradient.addColorStop(1, "rgba(255,255,255,0)");
                
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = chargeGradient;
                ctx.beginPath();
                ctx.arc(
                    beamX, 
                    this.y + this.components.frontCannon.y + 20, 
                    30 * progress + pulseEffect, 
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.restore();
        };
        
        window.game.explosions.push(warningBeam);
        
        // Audio carica
        if (window.AudioSystem) {
            window.AudioSystem.playHeavySound();
        }
    }
    
    // Spara il Death Beam
    fireDeathBeam() {
        // Usa la posizione del cannone frontale o la posizione del boss
        let beamX;
        if (this.components.frontCannon.active) {
            beamX = this.x + this.components.frontCannon.x;
        } else {
            beamX = this.x;
        }
        
        // Crea il raggio della morte
        const deathBeam = new window.Explosion(
            beamX,
            window.canvas.height / 2,
            1,
            this.colors,
            'custom'
        );
        
        deathBeam.type = 'beam';
        deathBeam.life = 1200;
        deathBeam.startTime = window.game.lastTime;
        deathBeam.beamWidth = 40;
        
        // Funzione che disegna il raggio
        deathBeam.draw = (ctx) => {
            if (!ctx || !this.active) return;
            
            const elapsed = window.game.lastTime - deathBeam.startTime;
            const fadeIn = Math.min(1, elapsed / 200);
            const fadeOut = Math.max(0, 1 - (elapsed - (deathBeam.life - 300)) / 300);
            const alpha = Math.min(fadeIn, fadeOut);
            
            if (alpha <= 0) return;
            
            ctx.save();
            
            // Primo strato del raggio (interno)
            const gradient1 = ctx.createLinearGradient(beamX, this.y, beamX, window.canvas.height);
            gradient1.addColorStop(0, "#ffffff");
            gradient1.addColorStop(0.2, this.colors.energy);
            gradient1.addColorStop(0.8, this.colors.energy);
            gradient1.addColorStop(1, this.colors.accent);
            
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = gradient1;
            
            const beamInnerWidth = deathBeam.beamWidth * 0.6;
            const beamPulse = Math.sin(window.game.animationFrame * 0.2) * 5;
            
            ctx.beginPath();
            ctx.rect(
                beamX - beamInnerWidth / 2 + beamPulse * 0.2, 
                this.y + this.components.frontCannon.y, 
                beamInnerWidth + beamPulse * 0.6, 
                window.canvas.height
            );
            ctx.fill();
            
            // Secondo strato del raggio (esterno)
            const gradient2 = ctx.createLinearGradient(beamX, this.y, beamX, window.canvas.height);
            gradient2.addColorStop(0, "rgba(255,255,255,0.8)");
            gradient2.addColorStop(0.2, "rgba(255,240,130,0.6)");
            gradient2.addColorStop(0.8, "rgba(255,170,0,0.4)");
            gradient2.addColorStop(1, "rgba(255,80,0,0.1)");
            
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = gradient2;
            
            ctx.beginPath();
            ctx.rect(
                beamX - deathBeam.beamWidth / 2 + beamPulse * 0.5, 
                this.y + this.components.frontCannon.y, 
                deathBeam.beamWidth + beamPulse, 
                window.canvas.height
            );
            ctx.fill();
            
            // Effetti particellari
            ctx.globalAlpha = alpha * 0.8;
            for (let i = 0; i < 10; i++) {
                const particleY = this.y + 50 + (window.canvas.height - this.y - 50) * (i / 10) + 
                                Math.sin(window.game.animationFrame * 0.1 + i) * 10;
                
                const particleSize = 5 + Math.random() * 8;
                const particleX = beamX + (Math.random() - 0.5) * deathBeam.beamWidth * 0.8;
                
                ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : this.colors.energy;
                ctx.beginPath();
                ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Collisione con il giocatore
            if (alpha > 0.5 && window.spaceship.isAlive && window.isSpaceshipCurrentlyVisible()) {
                const beamRect = {
                    x: beamX - deathBeam.beamWidth / 2,
                    y: this.y,
                    width: deathBeam.beamWidth,
                    height: window.canvas.height
                };
                
                if (window.isColliding(window.spaceship, beamRect)) {
                    window.spaceship.takeDamage(4 * (deltaTime / 1000));
                }
            }
            
            ctx.restore();
        };
        
        window.game.explosions.push(deathBeam);
        
        // Audio raggio
        if (window.AudioSystem) {
            window.AudioSystem.playHeavySound();
        }
    }
    
    // Aggiorna azioni basate sulla fase
    updatePhaseActions(deltaTime) {
        switch (this.currentPhase) {
            case 1:
                // Fase 1: Movimento più veloce, attacchi più frequenti
                if (this.movePattern === 'sine') {
                    this.horizontalFrequency = 0.0005;
                    this.horizontalAmplitude = window.canvas.width * 0.4;
                }
                break;
                
            case 2:
                // Fase 2: Movimento più imprevedibile, cambi di direzione
                if (Math.random() < 0.005) {
                    this.movePattern = 'random';
                    this.moveTimer = 2000;
                }
                
                // Rigenerazione parziale scudo
                if (!this.components.shield.active && this.components.shield.health <= 0) {
                    this.components.shield.regenTimer -= deltaTime;
                }
                break;
                
            case 3:
                // Fase 3: Movimento molto aggressivo
                if (this.movePattern === 'sine') {
                    this.horizontalFrequency = 0.0007;
                    this.horizontalAmplitude = window.canvas.width * 0.45;
                }
                
                // Cerca di inseguire il giocatore
                if (window.spaceship.isAlive && Math.random() < 0.01) {
                    this.targetX = window.spaceship.x;
                    this.movePattern = 'target';
                }
                
                // Rigenerazione scudo più veloce
                if (this.components.shield.active && this.components.shield.regenActive) {
                    this.components.shield.regenRate = 0.3;
                }
                break;
        }
    }
    
    // Disegna il boss
    draw(ctx) {
        if (!this.active || !ctx) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);
        
        // Disegna scudo
        if (this.components.shield.active) {
            const shieldSize = this.width * 0.65;
            const shieldPulse = Math.sin(this.pulsePhase * 2) * 5;
            const shieldAlpha = 0.2 + Math.sin(this.pulsePhase) * 0.1;
            const shieldOpacity = this.components.shield.regenActive ? 
                                 (this.components.shield.health / this.components.shield.maxHealth) * 0.8 :
                                 Math.min(0.8, this.components.shield.health / this.components.shield.maxHealth);
            
            ctx.globalAlpha = shieldOpacity;
            
            const shieldGradient = ctx.createRadialGradient(0, 0, shieldSize * 0.3, 0, 0, shieldSize + shieldPulse);
            shieldGradient.addColorStop(0, "rgba(180, 220, 255, 0.1)");
            shieldGradient.addColorStop(0.7, "rgba(100, 140, 255, 0.3)");
            shieldGradient.addColorStop(1, "rgba(50, 80, 200, 0.2)");
            
            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(0, 0, shieldSize + shieldPulse, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "rgba(120, 180, 255, 0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, shieldSize + shieldPulse, 0, Math.PI * 2);
            ctx.stroke();
            
            // Effetto griglia dello scudo
            ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
            ctx.lineWidth = 1;
            
            // Linee orizzontali
            for (let i = -3; i <= 3; i++) {
                const y = i * (shieldSize / 3);
                ctx.beginPath();
                ctx.moveTo(-shieldSize, y);
                ctx.lineTo(shieldSize, y);
                ctx.stroke();
            }
            
            // Linee verticali
            for (let i = -3; i <= 3; i++) {
                const x = i * (shieldSize / 3);
                ctx.beginPath();
                ctx.moveTo(x, -shieldSize);
                ctx.lineTo(x, shieldSize);
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1.0;
        }
        
        // Disegna il corpo principale (navicella ammiraglia)
        this.drawHull(ctx);
        
        // Disegna tutti i componenti
        Object.keys(this.components).forEach(key => {
            const comp = this.components[key];
            if (!comp.active || !comp.isHittable) return;
            
            switch (key) {
                case 'core':
                    this.drawCore(ctx, comp);
                    break;
                case 'leftWing':
                    this.drawWing(ctx, comp, -1);
                    break;
                case 'rightWing':
                    this.drawWing(ctx, comp, 1);
                    break;
                case 'frontCannon':
                    this.drawCannon(ctx, comp);
                    break;
                case 'leftEngine':
                    this.drawEngine(ctx, comp, -1);
                    break;
                case 'rightEngine':
                    this.drawEngine(ctx, comp, 1);
                    break;
            }
        });
        
        // Disegna gli effetti di colpo
        for (const effect of this.hitEffects) {
            ctx.save();
            ctx.globalAlpha = effect.life * 0.8;
            
            const hitGradient = ctx.createRadialGradient(
                effect.x, effect.y, 0, 
                effect.x, effect.y, effect.size
            );
            
            hitGradient.addColorStop(0, "#ffffff");
            hitGradient.addColorStop(0.3, effect.color);
            hitGradient.addColorStop(1, "rgba(0,0,0,0)");
            
            ctx.fillStyle = hitGradient;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    // Disegna lo scafo principale
    drawHull(ctx) {
        // Bagliore dietro la nave
        const glowRadius = this.width * 0.6;
        const glowGradient = ctx.createRadialGradient(0, 0, glowRadius * 0.1, 0, 0, glowRadius);
        
        glowGradient.addColorStop(0, "rgba(255,100,50,0.15)");
        glowGradient.addColorStop(0.6, "rgba(255,70,30,0.08)");
        glowGradient.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Corpo della nave
        ctx.fillStyle = this.colors.secondary;
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.4);
        ctx.lineTo(-this.width * 0.4, this.height * 0.2);
        ctx.lineTo(-this.width * 0.2, this.height * 0.3);
        ctx.lineTo(this.width * 0.2, this.height * 0.3);
        ctx.lineTo(this.width * 0.4, this.height * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Dettagli sulla nave
        ctx.fillStyle = this.colors.primary;
        
        // Parte centrale superiore
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.1, -this.height * 0.3);
        ctx.lineTo(-this.width * 0.2, -this.height * 0.1);
        ctx.lineTo(this.width * 0.2, -this.height * 0.1);
        ctx.lineTo(this.width * 0.1, -this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Parte centrale inferiore
        ctx.beginPath();
        ctx.rect(-this.width * 0.15, -this.height * 0.1, this.width * 0.3, this.height * 0.3);
        ctx.fill();
        
        // Bordo luminoso
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.38, this.height * 0.18);
        ctx.lineTo(-this.width * 0.2, -this.height * 0.1);
        ctx.lineTo(this.width * 0.2, -this.height * 0.1);
        ctx.lineTo(this.width * 0.38, this.height * 0.18);
        ctx.stroke();
    }
    
    // Disegna il nucleo
    drawCore(ctx, comp) {
        const coreSize = comp.width * 0.5;
        const corePulse = Math.sin(this.pulsePhase * 3) * 3;
        
        // Bagliore attorno al nucleo
        const coreGlow = ctx.createRadialGradient(
            comp.x, comp.y, 0,
            comp.x, comp.y, coreSize * 1.5 + corePulse
        );
        
        coreGlow.addColorStop(0, "rgba(255,255,255,0.8)");
        coreGlow.addColorStop(0.3, "rgba(255,200,100,0.4)");
        coreGlow.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(comp.x, comp.y, coreSize * 1.5 + corePulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Nucleo interno
        const coreGradient = ctx.createRadialGradient(
            comp.x, comp.y, 0,
            comp.x, comp.y, coreSize + corePulse * 0.5
        );
        
        coreGradient.addColorStop(0, "#ffffff");
        coreGradient.addColorStop(0.4, this.colors.energy);
        coreGradient.addColorStop(0.8, this.colors.accent);
        coreGradient.addColorStop(1, this.colors.primary);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(comp.x, comp.y, coreSize + corePulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bordo luminoso
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(comp.x, comp.y, coreSize + corePulse * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Effetto energy pulse
        for (let i = 0; i < 3; i++) {
            const angle = this.pulsePhase * 2 + i * Math.PI * 2 / 3;
            const distance = coreSize * 0.7;
            const pulseX = comp.x + Math.cos(angle) * distance;
            const pulseY = comp.y + Math.sin(angle) * distance;
            const pulseSize = 3 + Math.sin(this.pulsePhase * 3 + i) * 1.5;
            
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, pulseSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Disegna le ali
    drawWing(ctx, comp, side) {
        const sign = Math.sign(side);
        
        // Ala principale
        ctx.fillStyle = this.colors.secondary;
        ctx.beginPath();
        ctx.moveTo(comp.x, comp.y - comp.height * 0.5);
        ctx.lineTo(comp.x + comp.width * 0.5 * sign, comp.y);
        ctx.lineTo(comp.x, comp.y + comp.height * 0.5);
        ctx.lineTo(comp.x - comp.width * 0.3 * sign, comp.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Porta cannoni
        ctx.fillStyle = this.colors.primary;
        ctx.beginPath();
        ctx.rect(
            comp.x + sign * comp.width * 0.2 - comp.width * 0.1, 
            comp.y - comp.height * 0.15, 
            comp.width * 0.2, 
            comp.height * 0.3
        );
        ctx.fill();
        
        // Dettagli luminosi
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(comp.x - comp.width * 0.2 * sign, comp.y);
        ctx.lineTo(comp.x + comp.width * 0.4 * sign, comp.y);
        ctx.stroke();
        
        // Emettitore energetico
        const emitterX = comp.x + comp.width * 0.3 * sign;
        const emitterY = comp.y;
        const emitterSize = comp.width * 0.1;
        const emitterPulse = Math.sin(this.pulsePhase * 3 + side) * 2;
        
        const emitterGradient = ctx.createRadialGradient(
            emitterX, emitterY, 0,
            emitterX, emitterY, emitterSize + emitterPulse
        );
        
        emitterGradient.addColorStop(0, "#ffffff");
        emitterGradient.addColorStop(0.6, this.colors.energy);
        emitterGradient.addColorStop(1, this.colors.primary);
        
        ctx.fillStyle = emitterGradient;
        ctx.beginPath();
        ctx.arc(emitterX, emitterY, emitterSize + emitterPulse, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Disegna il cannone frontale
    drawCannon(ctx, comp) {
        // Struttura principale del cannone
        ctx.fillStyle = this.colors.secondary;
        ctx.beginPath();
        ctx.rect(comp.x - comp.width * 0.5, comp.y - comp.height * 0.5, comp.width, comp.height);
        ctx.fill();
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Dettagli del cannone
        ctx.fillStyle = this.colors.primary;
        ctx.beginPath();
        ctx.rect(comp.x - comp.width * 0.3, comp.y - comp.height * 0.4, comp.width * 0.6, comp.height * 0.8);
        ctx.fill();
        
        // Apertura del cannone
        const barrelY = comp.y - comp.height * 0.3;
        const barrelHeight = comp.height * 0.2;
        
        // Effetto carica del cannone
        const chargeLevel = Math.sin(this.pulsePhase * 2) * 0.5 + 0.5;
        const chargeGradient = ctx.createLinearGradient(
            comp.x, barrelY,
            comp.x, barrelY + barrelHeight
        );
        
        chargeGradient.addColorStop(0, "#ffffff");
        chargeGradient.addColorStop(0.5, this.colors.energy);
        chargeGradient.addColorStop(1, this.colors.accent);
        
        ctx.fillStyle = chargeGradient;
        ctx.beginPath();
        ctx.rect(comp.x - comp.width * 0.2, barrelY, comp.width * 0.4, barrelHeight);
        ctx.fill();
        
        // Dettagli luminosi
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(comp.x - comp.width * 0.4, comp.y - comp.height * 0.4, comp.width * 0.8, comp.height * 0.8);
        ctx.stroke();
        
        // Luce di carica
        const chargePulse = Math.sin(this.pulsePhase * 4) * 3;
        const chargeCircleGradient = ctx.createRadialGradient(
            comp.x, barrelY + barrelHeight * 0.5, 0,
            comp.x, barrelY + barrelHeight * 0.5, comp.width * 0.15 + chargePulse
        );
        
        chargeCircleGradient.addColorStop(0, "#ffffff");
        chargeCircleGradient.addColorStop(0.6, this.colors.energy);
        chargeCircleGradient.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = chargeCircleGradient;
        ctx.globalAlpha = 0.7 + Math.sin(this.pulsePhase * 3) * 0.3;
        ctx.beginPath();
        ctx.arc(comp.x, barrelY + barrelHeight * 0.5, comp.width * 0.15 + chargePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    
    // Disegna i propulsori
    drawEngine(ctx, comp, side) {
        const sign = Math.sign(side);
        
        // Struttura principale del propulsore
        ctx.fillStyle = this.colors.secondary;
        ctx.beginPath();
        ctx.rect(comp.x - comp.width * 0.5, comp.y - comp.height * 0.5, comp.width, comp.height);
        ctx.fill();
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Scarico del propulsore
        const exhaustY = comp.y + comp.height * 0.3;
        const exhaustWidth = comp.width * 0.6;
        const exhaustHeight = comp.height * 0.3;
        
        // Fiamma del propulsore
        const flameHeight = comp.height * (0.5 + this.engineGlow * 0.3);
        const flameWidth = comp.width * 0.4;
        
        const flameGradient = ctx.createLinearGradient(
            comp.x, exhaustY,
            comp.x, exhaustY + flameHeight
        );
        
        flameGradient.addColorStop(0, "#ffffff");
        flameGradient.addColorStop(0.3, this.colors.energy);
        flameGradient.addColorStop(0.7, this.colors.accent);
        flameGradient.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = flameGradient;
        
        // Forma della fiamma
        ctx.beginPath();
        ctx.moveTo(comp.x - flameWidth * 0.5, exhaustY);
        ctx.quadraticCurveTo(
            comp.x, 
            exhaustY + flameHeight * 0.7, 
            comp.x - flameWidth * 0.2 + Math.sin(this.pulsePhase * 5) * flameWidth * 0.2, 
            exhaustY + flameHeight
        );
        ctx.quadraticCurveTo(
            comp.x, 
            exhaustY + flameHeight * 0.7, 
            comp.x + flameWidth * 0.5, 
            exhaustY
        );
        ctx.closePath();
        ctx.fill();
        
        // Bagliore attorno alla fiamma
        const glowGradient = ctx.createRadialGradient(
            comp.x, exhaustY + flameHeight * 0.5, 0,
            comp.x, exhaustY + flameHeight * 0.5, flameWidth * 1.5
        );
        
        glowGradient.addColorStop(0, "rgba(255,200,50,0.3)");
        glowGradient.addColorStop(0.7, "rgba(255,100,0,0.1)");
        glowGradient.addColorStop(1, "rgba(0,0,0,0)");
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(comp.x, exhaustY + flameHeight * 0.3, flameWidth * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Apertura di scarico
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.rect(comp.x - exhaustWidth * 0.5, exhaustY - exhaustHeight * 0.5, exhaustWidth, exhaustHeight);
        ctx.fill();
        
        // Dettagli luminosi
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(comp.x - comp.width * 0.4, comp.y - comp.height * 0.4, comp.width * 0.8, comp.height * 0.6);
        ctx.stroke();
    }
}