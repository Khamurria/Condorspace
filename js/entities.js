/**
 * CONDORSPACE - TEAM PARALLAX
 * Entità del gioco: navicella, alieni, proiettili, esplosioni, ecc.
 */

// --- Helper Functions ---
function getRandomColor() {
    return window.alienColorSchemes[Math.floor(Math.random() * window.alienColorSchemes.length)];
}

function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function isSpaceshipCurrentlyVisible() {
    if (!window.spaceship.isAlive) return false;
    if (window.spaceship.shieldActive) return true;
    if (!window.spaceship.invincibleAfterHit && !window.spaceship.invincibleAfterLifeLoss) return true;
    
    const remainingInvincibility = Math.max(
        window.spaceship.hitInvincibleTimer, 
        window.spaceship.lifeLossInvincibleTimer
    );
    
    return (remainingInvincibility % (window.BLINK_INTERVAL * 2)) < window.BLINK_INTERVAL;
}

function hexToRgba(hex, alpha = 1) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

// --- Classe Projectile (Proiettili del giocatore) ---
class Projectile {
    constructor(x, y, t = 0, a = 0) {
        this.x = x;
        this.y = y;
        this.type = t;
        this.angle = a;
        this.active = true;
        
        switch (this.type) {
            case 0: // Standard
                this.width = 6;
                this.height = 16;
                this.speed = 600;
                this.damage = 1;
                break;
            case 1: // Spread
                this.width = 5;
                this.height = 12;
                this.speed = 540;
                this.damage = 1;
                break;
            case 2: // Rapid
                this.width = 4;
                this.height = 12;
                this.speed = 720;
                this.damage = 0.75;
                break;
            case 3: // Heavy
                this.width = 10;
                this.height = 20;
                this.speed = 420;
                this.damage = 2.5;
                break;
            default:
                this.width = 6;
                this.height = 16;
                this.speed = 600;
                this.damage = 1;
                break;
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        const moveDist = this.speed * (deltaTime / 1000);
        
        if (this.type === 1) { // Spread
            this.x += Math.sin(this.angle) * moveDist;
            this.y -= Math.cos(this.angle) * moveDist;
        } else {
            this.y -= moveDist;
        }
        
        // Disattiva se esce dallo schermo
        if (this.y < -this.height || this.x < -this.width || this.x > window.canvas.width) {
            this.active = false;
        }
    }
    
    draw(animFrame) {
        if (!this.active || !window.ctx) return;
        
        window.ctx.save();
        
        let gradient, flashOffset = 0;
        const currentAnimFrame = animFrame % 4;
        
        switch (this.type) {
            case 0: // Standard - Blu
                gradient = window.ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
                gradient.addColorStop(0, "#0ff");
                gradient.addColorStop(0.5, "#80ffff");
                gradient.addColorStop(1, "#fff");
                
                window.ctx.fillStyle = gradient;
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                window.ctx.shadowColor = "#0ff";
                window.ctx.shadowBlur = 10;
                window.ctx.fillStyle = "rgba(0,255,255,0.6)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 2, this.height / 2 + 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                flashOffset = 3 + currentAnimFrame;
                window.ctx.fillStyle = "rgba(0,255,255,0.3)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2 + flashOffset, this.width / 2 + 3, this.height / 2 - 2 + flashOffset / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                break;
            
            case 1: // Spread - Verde
                gradient = window.ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
                gradient.addColorStop(0, "#00ff66");
                gradient.addColorStop(0.5, "#80ff99");
                gradient.addColorStop(1, "#fff");
                
                window.ctx.fillStyle = gradient;
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                window.ctx.shadowColor = "#00ff66";
                window.ctx.shadowBlur = 8;
                window.ctx.fillStyle = "rgba(0,255,102,0.6)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 2, this.height / 2 + 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                flashOffset = 2 + currentAnimFrame;
                window.ctx.fillStyle = "rgba(0,255,102,0.3)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2 + flashOffset, this.width / 2 + 2, this.height / 2 - 1 + flashOffset / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                break;
            
            case 2: // Rapid - Giallo
                gradient = window.ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
                gradient.addColorStop(0, "#ffcc00");
                gradient.addColorStop(0.5, "#ffee80");
                gradient.addColorStop(1, "#fff");
                
                window.ctx.fillStyle = gradient;
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                window.ctx.shadowColor = "#ffcc00";
                window.ctx.shadowBlur = 6;
                window.ctx.fillStyle = "rgba(255,204,0,0.6)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 1, this.height / 2 + 1, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                flashOffset = 1 + currentAnimFrame;
                window.ctx.fillStyle = "rgba(255,204,0,0.3)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2 + flashOffset, this.width / 2 + 1, this.height / 2 - 1 + flashOffset / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                break;
            
            case 3: // Heavy - Rosa
                gradient = window.ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
                gradient.addColorStop(0, "#ff0066");
                gradient.addColorStop(0.5, "#ff80b3");
                gradient.addColorStop(1, "#fff");
                
                window.ctx.fillStyle = gradient;
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                window.ctx.shadowColor = "#ff0066";
                window.ctx.shadowBlur = 15;
                window.ctx.fillStyle = "rgba(255,0,102,0.7)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 3, this.height / 2 + 3, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                flashOffset = 4 + currentAnimFrame;
                const pulse = Math.sin(window.game.animationFrame * 0.2) * 2;
                window.ctx.fillStyle = "rgba(255,0,102,0.4)";
                window.ctx.beginPath();
                window.ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2 + flashOffset, this.width / 2 + 4 + pulse, this.height / 2 + flashOffset / 2, 0, 0, 2 * Math.PI);
                window.ctx.fill();
                
                for (let i = 0; i < 2; i++) {
                    const sideOffset = Math.sin(window.game.animationFrame * 0.3 + i) * 3;
                    window.ctx.fillStyle = "rgba(255,0,102,0.3)";
                    window.ctx.beginPath();
                    window.ctx.arc(this.x + this.width / 2 + sideOffset, this.y + this.height / 2 + flashOffset + i * 5, 1 + Math.random() * 2, 0, 2 * Math.PI);
                    window.ctx.fill();
                }
                break;
        }
        
        window.ctx.restore();
    }
}

// --- Classe AlienProjectile (Proiettili nemici) ---
class AlienProjectile {
    constructor(x, y, s = 180, z = 5, c = "#f44", tracking = 0) {
        this.x = x;
        this.y = y;
        this.initialSpeed = s + Math.random() * 90;
        this.speedX = 0;
        this.speedY = this.initialSpeed;
        this.width = z;
        this.height = z * 1.5;
        this.color = c;
        this.active = true;
        this.damage = window.ALIEN_PROJECTILE_DAMAGE;
        this.trackingFactor = tracking * 0.002 * Math.min(window.game.level, 5);
        this.turnSpeed = 100 + Math.random() * 50;
        this.lifeTimer = null;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        const dtSeconds = deltaTime / 1000;
        
        if (this.trackingFactor > 0 && window.spaceship.isAlive) {
            const targetX = window.spaceship.x + window.spaceship.width / 2;
            const targetY = window.spaceship.y + window.spaceship.height / 2;
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const angleToTarget = Math.atan2(dy, dx);
            
            let currentAngle = Math.atan2(this.speedY, this.speedX) - Math.PI / 2;
            let angleDiff = angleToTarget - currentAngle;
            
            while (angleDiff <= -Math.PI) angleDiff += 2 * Math.PI;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            
            const turnAmount = Math.min(
                Math.abs(angleDiff),
                this.turnSpeed * this.trackingFactor * dtSeconds
            ) * Math.sign(angleDiff);
            
            currentAngle += turnAmount;
            
            const totalSpeed = this.initialSpeed;
            this.speedX = Math.sin(currentAngle) * totalSpeed;
            this.speedY = Math.cos(currentAngle) * totalSpeed;
        }
        
        this.x += this.speedX * dtSeconds;
        this.y += this.speedY * dtSeconds;
        
        // Gestione timer di vita (per mine)
        if (this.lifeTimer !== null) {
            this.lifeTimer -= deltaTime;
            if (this.lifeTimer <= 0) {
                if (typeof this.explode === 'function') {
                    this.explode();
                } else {
                    this.active = false;
                }
                return;
            }
        }
        
        // Disattiva se esce dallo schermo
        if (this.y > window.canvas.height + this.height || 
            this.y < -this.height || 
            this.x < -this.width || 
            this.x > window.canvas.width + this.width) {
            this.active = false;
        }
    }
    
    draw() {
        if (!this.active || !window.ctx) return;
        
        window.ctx.save();
        
        window.ctx.fillStyle = this.color;
        window.ctx.shadowColor = this.color;
        window.ctx.shadowBlur = 5 + this.width * 0.5;
        
        window.ctx.beginPath();
        window.ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, 2 * Math.PI);
        window.ctx.fill();
        
        try {
            window.ctx.fillStyle = hexToRgba(this.color, 0.6);
        } catch {
            window.ctx.fillStyle = this.color + "99"; // 60% di opacità in formato hex
        }
        
        window.ctx.shadowBlur = 0;
        window.ctx.beginPath();
        window.ctx.ellipse(this.x, this.y - this.height * 0.5, this.width / 3, this.height / 3, 0, 0, 2 * Math.PI);
        window.ctx.fill();
        
        try {
            window.ctx.fillStyle = hexToRgba(this.color, 0.27);
        } catch {
            window.ctx.fillStyle = this.color + "44"; // 27% di opacità in formato hex
        }
        
        window.ctx.beginPath();
        window.ctx.ellipse(this.x, this.y + this.height * 0.5, this.width / 3, this.height / 3, 0, 0, 2 * Math.PI);
        window.ctx.fill();
        
        window.ctx.restore();
    }
    
    explode() {
        if (!this.active) return;
        
        this.active = false;
        
        // Crea un'esplosione
        if (window.game && window.game.explosions) {
            window.game.explosions.push(new Explosion(
                this.x,
                this.y,
                50,
                this.colors || window.DEFAULT_ALIEN_COLORS,
                'medium'
            ));
        }
        
        // Riproduci suono esplosione
        if (window.AudioSystem) {
            window.AudioSystem.playExplosionSound('medium');
        }
    }
}

// --- Classe Alien (Nemici) ---
class Alien {
    constructor(x, y, s, c, m, p) {
        this.id = window.game.aliens.length;
        this.x = x;
        this.y = y;
        this.size = s;
        this.colors = c || getRandomColor();
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.03 * (p.speedFactor || 1);
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.energyPulse = 1;
        this.shieldOpacity = 0.4;
        this.tentaclePhase = Math.random() * Math.PI * 2;
        this.collisionRadius = s * 0.8;
        this.width = this.collisionRadius * 2;
        this.height = this.collisionRadius * 2;
        this.maxHealth = p.health;
        this.health = this.maxHealth;
        this.damaged = false;
        this.damageFrame = 0;
        this.hitEffects = [];
        this.active = true;
        this.speedY = p.speedY;
        this.movementType = m;
        this.startX = x;
        this.sineAmplitude = (15 + Math.random() * 35) * (this.size / 30) * (p.sineAmplitudeFactor || 1);
        this.sineFrequency = (0.012 + Math.random() * 0.02) * (p.speedFactor || 1) * (p.sineFrequencyFactor || 1);
        this.zigZagSpeedX = (p.speedFactor || 1) * (70 + Math.random() * 110);
        this.zigZagDir = Math.random() < 0.5 ? 1 : -1;
        this.diagonalDir = Math.random() < 0.5 ? 1 : -1;
        this.shootTimer = (p.shootCooldown || 3000) / 2 + Math.random() * (p.shootCooldown || 3000);
        this.shootCooldown = p.shootCooldown || 3000;
        this.collisionDamage = p.collisionDamageBoost ? window.ALIEN_COLLISION_DAMAGE + p.collisionDamageBoost : window.ALIEN_COLLISION_DAMAGE;
        this.eyeOffset = p.eyeOffset || 0;
        this.targetPlayer = (this.movementType === 'straight_fast');
    }
    
    update(deltaTime) {
        if (!this.active) return false;
        
        const dtSeconds = deltaTime / 1000;
        let potentialX = this.x;
        let potentialY = this.y;
        
        if (this.targetPlayer && window.spaceship.isAlive) {
            const targetX = window.spaceship.x + window.spaceship.width / 2;
            const dx = targetX - this.x;
            potentialX += Math.sign(dx) * Math.min(Math.abs(dx), this.speedY * 0.5) * dtSeconds;
            potentialY += this.speedY * dtSeconds;
        } else {
            potentialY = this.y + this.speedY * dtSeconds;
            let applyHorizontalMove = true;
            
            switch (this.movementType) {
                case 'sine':
                    potentialX = this.startX + Math.sin(window.game.lastTime * 0.001 * this.sineFrequency * 50 + this.pulsePhase) * this.sineAmplitude;
                    break;
                case 'zigzag':
                    potentialX += this.zigZagSpeedX * this.zigZagDir * dtSeconds;
                    break;
                case 'diagonal':
                    potentialX += this.zigZagSpeedX * this.diagonalDir * 0.7 * dtSeconds;
                    break;
                default:
                    applyHorizontalMove = false;
                    break;
            }
            
            if (applyHorizontalMove || this.movementType === 'zigzag' || this.movementType === 'diagonal') {
                for (const otherAlien of window.game.aliens) {
                    if (otherAlien === this || !otherAlien.active) continue;
                    
                    const dx = potentialX - otherAlien.x;
                    const dy = potentialY - otherAlien.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = this.collisionRadius + otherAlien.collisionRadius + window.game.alienSeparationBuffer;
                    
                    if (distSq < minDist * minDist) {
                        if (Math.abs(dx) > this.speedY * dtSeconds * 1.1) {
                            applyHorizontalMove = false;
                            potentialX = this.x;
                            break;
                        }
                    }
                }
            }
        }
        
        this.y = potentialY;
        this.x = potentialX;
        
        if (this.movementType === 'zigzag' || this.movementType === 'diagonal') {
            if ((this.x > window.canvas.width - this.size * 1.2 && this.zigZagDir > 0) || 
                (this.x < this.size * 1.2 && this.zigZagDir < 0)) {
                this.zigZagDir *= -1;
                if (this.movementType === 'diagonal') this.diagonalDir *= -1;
                this.x += this.zigZagSpeedX * this.zigZagDir * dtSeconds * 0.5;
            }
        }
        
        this.x = Math.max(this.size, Math.min(window.canvas.width - this.size, this.x));
        this.rotation += this.rotationSpeed * (deltaTime / (1000 / 60));
        this.energyPulse = 0.9 + Math.sin(window.game.animationFrame * 0.06 + this.pulsePhase) * 0.1;
        this.shieldOpacity = 0.3 + Math.sin(window.game.animationFrame * 0.04 + this.pulsePhase + 1) * 0.1;
        this.tentaclePhase += 0.015 * (deltaTime / (1000 / 60));
        
        if (this.damaged) {
            this.damageFrame--;
            if (this.damageFrame <= 0) {
                this.damaged = false;
            }
        }
        
        this.hitEffects = this.hitEffects.filter(e => {
            e.life -= 0.1 * (deltaTime / (1000 / 60));
            e.size *= (1 - 0.05 * (deltaTime / (1000 / 60)));
            return e.life > 0;
        });
        
        if (!this.targetPlayer) {
            this.shootTimer -= deltaTime;
            
            const currentWaveData = (window.game.currentWaveIndex >= 0 && window.game.WAVES && 
                                     window.game.currentWaveIndex < window.game.WAVES.length) ? 
                                    window.game.WAVES[window.game.currentWaveIndex] : null;
            
            const maxAliensShooting = currentWaveData ? 
                                    Math.max(2, Math.floor(currentWaveData.maxAliensOnScreen * 0.4)) : 3;
            
            if (this.shootTimer <= 0) {
                if (window.game.globalAlienFireCooldown <= 0 && 
                    window.game.alienProjectiles.filter(p => p.active).length < maxAliensShooting + Math.floor(window.game.level / 2) && 
                    this.y > -this.size && 
                    this.y < window.canvas.height - 50) {
                    
                    this.shoot();
                    this.shootTimer = this.shootCooldown + (Math.random() - 0.5) * (this.shootCooldown * 0.3);
                    window.game.globalAlienFireCooldown = 50 + Math.random() * 50;
                } else {
                    this.shootTimer = 80 + Math.random() * 120;
                }
            }
        }
        
        if (this.y > window.canvas.height + this.size * 2) {
            this.active = false;
            return false;
        }
        
        return true;
    }
    
    shoot() {
        const x = this.x;
        const y = this.y + this.size * 0.5;
        const baseSpeed = 160 + window.game.level * 5;
        const speed = baseSpeed + (Math.random() - 0.5) * 80;
        const projectileSize = Math.max(3, Math.min(8, this.size * (0.15 + Math.random() * 0.1)));
        const color = this.colors?.energy || "#f60";
        const finalColor = Math.random() < 0.2 ? (this.colors?.secondary || color) : color;
        const tracking = (this.movementType === 'elite_guardian' || this.movementType === 'fighter_elite') ? 
                        (0.1 + Math.random() * 0.15) : 0;
        
        window.game.alienProjectiles.push(new AlienProjectile(x, y, speed, projectileSize, finalColor, tracking));
        
        if (window.AudioSystem) {
            window.AudioSystem.playAlienLaserSound();
        }
    }
    
    takeDamage(amount) {
        if (!this.active) return false;
        
        this.health -= amount;
        this.damaged = true;
        this.damageFrame = 6;
        
        this.hitEffects.push({
            x: (Math.random() - 0.5) * this.size * 0.6,
            y: (Math.random() - 0.5) * this.size * 0.6,
            size: this.size * 0.5 * (1 + Math.random() * 0.5),
            life: 1
        });
        
        if (this.health <= 0) {
            this.active = false;
            
            let scoreBonus = Math.floor(this.size * 2.0 + this.maxHealth * 5);
            if (this.targetPlayer) scoreBonus = Math.floor(scoreBonus * 0.5);
            window.game.score += scoreBonus;
            
            let explosionSize = "small";
            if (this.size > 45) {
                explosionSize = "large";
            } else if (this.size > 30) {
                explosionSize = "medium";
            }
            
            const explosionColors = (this.colors && typeof this.colors === 'object') ? 
                                   this.colors : window.DEFAULT_ALIEN_COLORS;
            
            window.game.explosions.push(new Explosion(this.x, this.y, this.size * 1.2, explosionColors, explosionSize));
            
            if (window.AudioSystem) {
                window.AudioSystem.playExplosionSound(explosionSize);
            }
            
            if (Math.random() < window.POWERUP_DROP_CHANCE && !this.targetPlayer) {
                if (typeof window.spawnPowerUp === 'function') {
                    window.spawnPowerUp(this.x, this.y);
                }
            }
            
            return true;
        }
        
        return false;
    }
    
    drawTentacles() {
        if (!window.ctx) return;
        
        const tentacleCount = 5;
        const tentacleLength = this.size * 1.8;
        
        window.ctx.lineWidth = this.size * 0.1;
        window.ctx.lineCap = "round";
        
        const energyColor = this.colors?.energy || "#80ffff";
        
        for (let i = 0; i < tentacleCount; i++) {
            const angle = (i / tentacleCount) * Math.PI * 2 + this.rotation + this.pulsePhase;
            const length = tentacleLength * (0.6 + Math.sin(window.game.animationFrame * 0.07 + this.tentaclePhase + i * 0.9) * 0.4);
            
            const gradient = window.ctx.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length);
            
            try {
                gradient.addColorStop(0, hexToRgba(energyColor, 0.67));
                gradient.addColorStop(0.7, hexToRgba(energyColor, 0.27));
                gradient.addColorStop(1, hexToRgba(energyColor, 0));
            } catch {
                gradient.addColorStop(0, energyColor + "AA");
                gradient.addColorStop(0.7, energyColor + "44");
                gradient.addColorStop(1, energyColor + "00");
            }
            
            window.ctx.strokeStyle = gradient;
            window.ctx.beginPath();
            window.ctx.moveTo(0, 0);
            
            const segments = 6;
            let prevX = 0, prevY = 0;
            
            for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const segLength = length * t;
                const width = this.size * 0.18 * t;
                
                const wiggle = segLength > 0.1 ? 
                             Math.sin(t * Math.PI * 2 + window.game.animationFrame * 0.1 + this.tentaclePhase + i) * width / segLength : 0;
                
                const adjustedAngle = angle + wiggle;
                const x = Math.cos(adjustedAngle) * segLength;
                const y = Math.sin(adjustedAngle) * segLength;
                
                window.ctx.quadraticCurveTo(
                    prevX + (x - prevX) * 0.5,
                    prevY + (y - prevY) * 0.5,
                    x,
                    y
                );
                
                prevX = x;
                prevY = y;
            }
            
            window.ctx.stroke();
        }
    }
    
    draw() {
        if (!this.active || !window.ctx) return;
        
        window.ctx.save();
        window.ctx.translate(this.x, this.y);
        
        this.drawTentacles();
        
        if (this.damaged && window.game.animationFrame % 2 === 0) {
            window.ctx.fillStyle = "rgba(255,100,100,0.5)";
            window.ctx.beginPath();
            window.ctx.arc(0, 0, this.size * 1.1, 0, 2 * Math.PI);
            window.ctx.fill();
        }
        
        // Barra della salute
        if (this.health < this.maxHealth && !this.targetPlayer) {
            const barWidth = this.size * 1.5;
            const barHeight = this.size * 0.1;
            const filledWidth = barWidth * (this.health / this.maxHealth);
            
            window.ctx.fillStyle = "rgba(50,50,50,0.6)";
            window.ctx.fillRect(-barWidth / 2, -this.size - barHeight * 2.5, barWidth, barHeight);
            
            if (this.health / this.maxHealth > 0.5) {
                window.ctx.fillStyle = "#4f4";
            } else if (this.health / this.maxHealth > 0.2) {
                window.ctx.fillStyle = "#ff4";
            } else {
                window.ctx.fillStyle = "#f44";
            }
            
            window.ctx.fillRect(-barWidth / 2, -this.size - barHeight * 2.5, filledWidth, barHeight);
        }
        
        // Bagliore alieno
        const glowRadius = this.size * (1.3 + Math.sin(window.game.animationFrame * 0.05 + this.pulsePhase) * 0.15);
        const glowGradient = window.ctx.createRadialGradient(0, 0, this.size * 0.1, 0, 0, glowRadius);
        
        const glowColor = this.colors?.glow || "#0af";
        
        try {
            glowGradient.addColorStop(0, hexToRgba(glowColor, 0.18));
            glowGradient.addColorStop(0.5, hexToRgba(glowColor, 0.08));
            glowGradient.addColorStop(1, hexToRgba(glowColor, 0));
        } catch {
            glowGradient.addColorStop(0, glowColor + "30");
            glowGradient.addColorStop(0.5, glowColor + "15");
            glowGradient.addColorStop(1, glowColor + "00");
        }
        
        window.ctx.fillStyle = glowGradient;
        window.ctx.beginPath();
        window.ctx.arc(0, 0, glowRadius, 0, 2 * Math.PI);
        window.ctx.fill();
        
        // Scudo alieno
        const shieldGradient = window.ctx.createRadialGradient(0, 0, this.size * 0.2, 0, 0, this.size);
        const secondaryColor = this.colors?.secondary || "#8cf";
        
        try {
            shieldGradient.addColorStop(0, "rgba(255,255,255,0)");
            shieldGradient.addColorStop(0.7, hexToRgba(secondaryColor, 0.1));
            shieldGradient.addColorStop(0.9, hexToRgba(secondaryColor, 0.2));
            shieldGradient.addColorStop(1, hexToRgba(secondaryColor, 0.3));
        } catch {
            shieldGradient.addColorStop(0, "rgba(255,255,255,0)");
            shieldGradient.addColorStop(0.7, secondaryColor + "1A");
            shieldGradient.addColorStop(0.9, secondaryColor + "33");
            shieldGradient.addColorStop(1, secondaryColor + "4D");
        }
        
        window.ctx.fillStyle = shieldGradient;
        window.ctx.globalAlpha = this.shieldOpacity;
        window.ctx.beginPath();
        window.ctx.arc(0, 0, this.size, 0, 2 * Math.PI);
        window.ctx.fill();
        
        window.ctx.globalAlpha = 1;
        window.ctx.rotate(this.rotation);
        
        // Corpo dell'alieno
        const sides = 6;
        const outerRadius = this.size * 0.7;
        const innerRadius = outerRadius * 0.85;
        
        window.ctx.lineWidth = this.size * 0.08;
        window.ctx.strokeStyle = this.colors?.primary || "#0af";
        window.ctx.beginPath();
        
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = Math.cos(angle) * outerRadius;
            const y = Math.sin(angle) * outerRadius;
            
            if (i === 0) {
                window.ctx.moveTo(x, y);
            } else {
                window.ctx.lineTo(x, y);
            }
        }
        
        window.ctx.closePath();
        window.ctx.stroke();
        
        window.ctx.lineWidth = this.size * 0.03;
        window.ctx.strokeStyle = this.colors?.secondary || "#8cf";
        
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = Math.cos(angle) * innerRadius;
            const y = Math.sin(angle) * innerRadius;
            
            window.ctx.beginPath();
            window.ctx.moveTo(0, 0);
            window.ctx.lineTo(x, y);
            window.ctx.stroke();
        }
        
        // Nucleo centrale
        const coreRadius = this.size * 0.3 * this.energyPulse;
        const coreGradient = window.ctx.createRadialGradient(0, 0, coreRadius * 0.1, 0, 0, coreRadius);
        
        const energyColor = this.colors?.energy || "#8ff";
        const primaryColor = this.colors?.primary || "#0af";
        
        coreGradient.addColorStop(0, "#fff");
        coreGradient.addColorStop(0.3, energyColor);
        coreGradient.addColorStop(1, primaryColor);
        
        window.ctx.fillStyle = coreGradient;
        window.ctx.beginPath();
        window.ctx.arc(0, 0, coreRadius, 0, 2 * Math.PI);
        window.ctx.fill();
        
        window.ctx.lineWidth = this.size * 0.02;
        window.ctx.strokeStyle = this.colors?.accent || "#fff";
        window.ctx.beginPath();
        window.ctx.arc(0, 0, coreRadius * 1.3, 0, 2 * Math.PI);
        window.ctx.stroke();
        
        // Occhi
        const eyeOffset = this.eyeOffset || 0;
        const numEyes = this.targetPlayer ? 1 : 3;
        const eyeBaseAngle = this.targetPlayer ? Math.PI : Math.PI / 6;
        const eyeDist = coreRadius * (this.targetPlayer ? 2.0 : 1.8);
        const eyes = [];
        
        if (numEyes === 1) {
            eyes.push({a: eyeBaseAngle + eyeOffset, d: eyeDist});
        } else {
            eyes.push({a: -eyeBaseAngle + eyeOffset, d: eyeDist});
            eyes.push({a: eyeBaseAngle + eyeOffset, d: eyeDist});
            eyes.push({a: Math.PI + eyeOffset, d: eyeDist});
        }
        
        const eyeColor = this.colors?.energy || "#8ff";
        
        window.ctx.shadowColor = eyeColor;
        window.ctx.shadowBlur = this.size * 0.1;
        window.ctx.fillStyle = eyeColor;
        
        if (coreRadius > 0.1) {
            eyes.forEach(eye => {
                const eyeX = Math.cos(eye.a) * eye.d;
                const eyeY = Math.sin(eye.a) * eye.d;
                const eyeSize = Math.max(
                    1,
                    this.size * 0.07 * (0.8 + Math.sin(window.game.animationFrame * 0.1 + this.pulsePhase) * 0.2)
                );
                
                window.ctx.beginPath();
                window.ctx.arc(eyeX, eyeY, eyeSize, 0, 2 * Math.PI);
                window.ctx.fill();
            });
        }
        
        window.ctx.shadowBlur = 0;
        
        // Effetti colpo
        for (const effect of this.hitEffects) {
            window.ctx.globalAlpha = effect.life;
            
            const hitGradient = window.ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.size);
            hitGradient.addColorStop(0, "rgba(255,255,200,0.9)");
            hitGradient.addColorStop(0.5, "rgba(255,200,0,0.7)");
            hitGradient.addColorStop(1, "rgba(255,255,255,0)");
            
            window.ctx.fillStyle = hitGradient;
            window.ctx.beginPath();
            window.ctx.arc(effect.x, effect.y, Math.max(1, effect.size), 0, 2 * Math.PI);
            window.ctx.fill();
        }
        
        window.ctx.restore();
    }
}

// --- Classe PowerUp (Potenziamenti) ---
class PowerUp {
    constructor(x, y, t) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.type = t;
        this.speed = 110 + Math.random() * 40;
        this.active = true;
        this.rotationAngle = Math.random() * Math.PI * 2;
        this.pulseSize = 0;
        this.pulseSpeed = 0.08 + Math.random() * 0.04;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.y += this.speed * (deltaTime / 1000);
        this.rotationAngle += this.rotationSpeed * (deltaTime / (1000 / 60));
        this.pulseSize = Math.sin(window.game.animationFrame * this.pulseSpeed) * 2.5;
        
        // Disattivazione se fuori dallo schermo
        if (this.y > window.canvas.height + this.height) {
            this.active = false;
            return;
        }
        
        // Collisione con la navicella
        if (window.spaceship.isAlive && isColliding(this, {
            x: window.spaceship.x,
            y: window.spaceship.y,
            width: window.spaceship.width * 0.8,
            height: window.spaceship.height * 0.8
        })) {
            let weaponText = "";
            let messageColor = "#ffff88";
            let showMessage = true;
            let sound = 'powerup';
            
            if (this.type === 5) { // Scudo
                window.spaceship.shieldActive = true;
                window.spaceship.shieldTimer = window.spaceship.SHIELD_DURATION;
                sound = 'shieldUp';
                window.game.uiMessage = "Scudo Attivato!";
                messageColor = "#80ffff";
            } else if (this.type === 6) { // Salute
                const healthBefore = window.spaceship.health;
                window.spaceship.health = Math.min(window.spaceship.maxHealth, window.spaceship.health + 4);
                sound = 'powerup';
                window.game.uiMessage = healthBefore < window.spaceship.maxHealth ? "Riparazione!" : "Salute Max!";
                messageColor = "#8f8";
            } else { // Armi
                if (window.spaceship.weaponType === this.type) {
                    window.game.score += 250;
                    showMessage = false;
                } else {
                    window.spaceship.weaponType = this.type;
                }
                
                if (window.spaceship.laserBeamActive && this.type !== 4) {
                    if (window.AudioSystem) window.AudioSystem.stopContinuous();
                    window.spaceship.laserBeamActive = false;
                }
                
                switch (this.type) {
                    case 1:
                        weaponText = "Spread";
                        messageColor = "#6fa";
                        sound = 'spread';
                        break;
                    case 2:
                        weaponText = "Rapid";
                        messageColor = "#fe8";
                        sound = 'rapid';
                        break;
                    case 3:
                        weaponText = "Heavy";
                        messageColor = "#f9b";
                        sound = 'heavy';
                        break;
                    case 4:
                        weaponText = "Laser";
                        messageColor = "#e8f";
                        sound = 'laser';
                        break;
                }
                
                if (showMessage) {
                    window.game.uiMessage = `Arma: ${weaponText}!`;
                }
            }
            
            if (showMessage) {
                window.game.uiMessageTimer = window.UI_MESSAGE_DURATION;
                window.showUIMessage(window.game.uiMessage, messageColor);
                
                if (window.AudioSystem) {
                    window.AudioSystem.play(sound);
                }
            }
            
            this.active = false;
            if (typeof window.updateGameUI === 'function') {
                window.updateGameUI(window.game, window.spaceship);
            }
        }
    }
    
    draw() {
        if (!this.active || !window.ctx) return;
        
        window.ctx.save();
        window.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        window.ctx.rotate(this.rotationAngle);
        
        let mainColor = "#fff";
        let darkColor = "#aaa";
        let glowColor = "#fff";
        let text = "?";
        
        window.ctx.shadowColor = glowColor;
        window.ctx.shadowBlur = 15 + this.pulseSize * 1.5;
        
        const bgGradient = window.ctx.createRadialGradient(0, 0, 3, 0, 0, 14 + this.pulseSize);
        bgGradient.addColorStop(0, "#fff");
        
        switch (this.type) {
            case 1: // Spread
                mainColor = "#6fa";
                darkColor = "#082";
                glowColor = "#0f6";
                text = "S";
                break;
            case 2: // Rapid
                mainColor = "#fe8";
                darkColor = "#c90";
                glowColor = "#fc0";
                text = "R";
                break;
            case 3: // Heavy
                mainColor = "#f9b";
                darkColor = "#c04";
                glowColor = "#f06";
                text = "H";
                break;
            case 4: // Laser
                mainColor = "#e8f";
                darkColor = "#80c";
                glowColor = "#c1f";
                text = "L";
                break;
            case 5: // Scudo
                mainColor = "#8df";
                darkColor = "#069";
                glowColor = "#0af";
                text = "";
                
                bgGradient.addColorStop(0.4, mainColor);
                bgGradient.addColorStop(1, darkColor);
                
                window.ctx.fillStyle = bgGradient;
                window.ctx.beginPath();
                window.ctx.arc(0, 0, this.width / 2 + this.pulseSize / 2, 0, 2 * Math.PI);
                window.ctx.fill();
                
                window.ctx.strokeStyle = mainColor + "aa";
                window.ctx.lineWidth = 1.5;
                window.ctx.beginPath();
                window.ctx.arc(0, 0, this.width / 2 + 1 + this.pulseSize / 2, 0, 2 * Math.PI);
                window.ctx.stroke();
                
                window.ctx.shadowBlur = 0;
                
                const dSize = this.width * 0.4 + Math.sin(window.game.animationFrame * 0.15) * 1.5;
                window.ctx.fillStyle = "#0af";
                window.ctx.strokeStyle = "#fff";
                window.ctx.lineWidth = 1.5;
                window.ctx.beginPath();
                window.ctx.moveTo(0, -dSize);
                window.ctx.lineTo(dSize * 0.8, 0);
                window.ctx.lineTo(0, dSize);
                window.ctx.lineTo(-dSize * 0.8, 0);
                window.ctx.closePath();
                window.ctx.fill();
                window.ctx.stroke();
                
                window.ctx.restore();
                return;
            case 6: // Salute
                mainColor = "#8f8";
                darkColor = "#060";
                glowColor = "#4f4";
                text = "+";
                break;
        }
        
        bgGradient.addColorStop(0.4, mainColor);
        bgGradient.addColorStop(1, darkColor);
        
        window.ctx.fillStyle = bgGradient;
        window.ctx.beginPath();
        window.ctx.arc(0, 0, this.width / 2 + this.pulseSize / 2, 0, 2 * Math.PI);
        window.ctx.fill();
        
        window.ctx.strokeStyle = mainColor + "aa";
        window.ctx.lineWidth = 1.5;
        window.ctx.beginPath();
        window.ctx.arc(0, 0, this.width / 2 + 1 + this.pulseSize / 2, 0, 2 * Math.PI);
        window.ctx.stroke();
        
        window.ctx.shadowBlur = 0;
        window.ctx.fillStyle = "#fff";
        window.ctx.font = `bold ${this.width * 0.6}px Arial`;
        window.ctx.textAlign = "center";
        window.ctx.textBaseline = "middle";
        window.ctx.fillText(text, 0, 1);
        
        window.ctx.restore();
    }
}

// --- Classe Explosion (Esplosioni) ---
class Explosion {
    constructor(x, y, s, c, z = 'small') {
        this.x = x;
        this.y = y;
        this.baseSize = s;
        this.colors = {
            primary: (c?.primary && typeof c.primary === 'string') ? c.primary : window.DEFAULT_EXPLOSION_COLORS.primary,
            secondary: (c?.secondary && typeof c.secondary === 'string') ? c.secondary : window.DEFAULT_EXPLOSION_COLORS.secondary,
            accent: (c?.accent && typeof c.accent === 'string') ? c.accent : window.DEFAULT_EXPLOSION_COLORS.accent,
            glow: (c?.glow && typeof c.glow === 'string') ? c.glow : window.DEFAULT_EXPLOSION_COLORS.glow,
            energy: (c?.energy && typeof c.energy === 'string') ? c.energy : window.DEFAULT_EXPLOSION_COLORS.energy
        };
        this.particles = [];
        this.life = 1.0;
        this.active = true;
        this.sizeCategory = z;
        this.type = (c && c.type) ? c.type : 'explosion';
        
        if (this.type === 'explosion' && z !== 'custom') {
            this.createParticles();
        } else if (this.type === 'beam') {
            this.life = c.life;
            this.startTime = c.startTime;
            this.drawBeam = c.draw;
        }
    }
    
    createParticles() {
        let multiplier = 1;
        let particleSize = this.baseSize / 12;
        let particleSpeed = 3.5;
        let shockwaveSize = 1.6;
        let fragmentChance = 0.3;
        
        if (this.sizeCategory === "medium") {
            multiplier = 2;
            particleSize = this.baseSize / 10;
            particleSpeed = 4.5;
            shockwaveSize = 2;
            fragmentChance = 0.5;
        } else if (this.sizeCategory === "large") {
            multiplier = 3.5;
            particleSize = this.baseSize / 8;
            particleSpeed = 5.5;
            shockwaveSize = 2.5;
            fragmentChance = 0.7;
        }
        
        const particleCount = Math.floor(20 * multiplier + Math.random() * 12 * multiplier);
        const primaryColor = this.colors.primary;
        const energyColor = this.colors.energy;
        
        // Particelle di detriti
        for (let i = 0; i < particleCount; i++) {
            const isFragment = Math.random() < fragmentChance;
            
            this.particles.push({
                type: isFragment ? "fragment" : "square",
                x: (Math.random() - 0.5) * this.baseSize * 0.1,
                y: (Math.random() - 0.5) * this.baseSize * 0.1,
                size: Math.random() * particleSize + particleSize * 0.6,
                speed: (Math.random() * particleSpeed + particleSpeed * 0.6) * (isFragment ? 1.1 : 0.9),
                angle: Math.random() * Math.PI * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.15,
                color: Math.random() > 0.4 ? primaryColor : energyColor,
                life: 1 + Math.random() * 0.6,
                decay: 0.01 + Math.random() * 0.015
            });
        }
        
        // Onde d'urto
        const energyGlowColor = this.colors.energy;
        const primaryGlowColor = this.colors.primary;
        
        if (this.sizeCategory === 'medium' || this.sizeCategory === 'large') {
            const numShockwaves = (this.sizeCategory === 'large' ? 3 : 2);
            
            for (let i = 0; i < numShockwaves; i++) {
                this.particles.push({
                    type: "shockwave",
                    size: 0,
                    maxSize: this.baseSize * (shockwaveSize + i * 0.4),
                    speed: (particleSpeed * 0.9 + i * 1.8) * (0.9 + Math.random() * 0.3),
                    opacity: 0.8 - i * 0.18,
                    color: i % 2 === 0 ? energyGlowColor : primaryGlowColor,
                    life: 1,
                    decay: 0.016 + i * 0.003
                });
            }
        }
        
        // Flash centrale
        this.particles.push({
            type: "flash",
            size: this.baseSize * 1.5,
            life: 0.4,
            decay: 0.05
        });
    }
    
    update(deltaTime) {
        if (!this.active) return false;
        
        if (this.type === 'beam') {
            this.life -= deltaTime;
            if (this.life <= 0) this.active = false;
            return this.active;
        }
        
        const dtRatio = deltaTime / (1000 / 60);
        this.life -= 0.015 * dtRatio;
        
        let hasActiveParticles = false;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay * dtRatio;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            hasActiveParticles = true;
            
            switch (p.type) {
                case "shockwave":
                    p.size += p.speed * Math.max(0.1, p.life) * dtRatio;
                    p.opacity = Math.max(0, p.opacity - p.decay * 1.2 * dtRatio);
                    p.speed *= (1 - 0.015 * dtRatio);
                    break;
                case "flash":
                    p.size *= (1 + p.decay * dtRatio);
                    break;
                case "fragment":
                case "square":
                default:
                    p.x += Math.cos(p.angle) * p.speed * Math.max(0.1, p.life) * dtRatio;
                    p.y += Math.sin(p.angle) * p.speed * Math.max(0.1, p.life) * dtRatio;
                    p.rotation += p.rotationSpeed * dtRatio;
                    p.speed *= (1 - (0.03 + p.decay) * dtRatio);
                    p.size = Math.max(0, p.size - p.decay * 20 * dtRatio);
                    break;
            }
        }
        
        if (this.life <= 0 && !hasActiveParticles) {
            this.active = false;
        }
        
        return this.active;
    }
    
    draw(ctx) {
        if (!this.active || !ctx) return;
        
        if (this.type === 'beam' && typeof this.drawBeam === 'function') {
            this.drawBeam(ctx);
            return;
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const safeAccent = this.colors.accent || "#fff";
        const safeEnergy = this.colors.energy || "#ff0";
        const safePrimary = this.colors.primary || "#f80";
        
        // Disegna particelle normali
        ctx.globalCompositeOperation = "source-over";
        this.particles.forEach(p => {
            if (p.life > 0 && p.size >= 0.5 && p.type !== "shockwave" && p.type !== "flash") {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = Math.max(0, p.life * 1.2);
                ctx.fillStyle = p.color;
                
                if (p.type === "fragment") {
                    ctx.beginPath();
                    const sz = p.size / 2;
                    ctx.moveTo(0, -sz * 1.2);
                    ctx.lineTo(sz, sz * 0.8);
                    ctx.lineTo(-sz, sz * 0.8);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                }
                
                ctx.restore();
            }
        });
        
        // Disegna effetti luminosi
        ctx.globalCompositeOperation = "lighter";
        this.particles.forEach(p => {
            if (p.life > 0 && p.type === "flash") {
                try {
                    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * p.life);
                    gradient.addColorStop(0, safeAccent + "FF");
                    gradient.addColorStop(0.2, safeAccent + "CC");
                    gradient.addColorStop(0.6, safeEnergy + "99");
                    gradient.addColorStop(1, safePrimary + "00");
                    
                    ctx.fillStyle = gradient;
                    ctx.globalAlpha = Math.max(0, p.life * 2.5);
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * p.life, 0, 2 * Math.PI);
                    ctx.fill();
                } catch (e) {}
            }
        });
        
        // Disegna onde d'urto
        this.particles.forEach(p => {
            if (p.life > 0 && p.size >= 1 && p.type === "shockwave") {
                ctx.globalAlpha = p.opacity * p.life;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = Math.max(1, this.baseSize / 20 * p.life * (1.5 + (p.maxSize / this.baseSize) * 0.1));
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
}

// --- Classe Planet (Pianeti di sfondo) ---
class Planet {
    // ... 
    // (mantieni tutto il resto della classe Planet uguale)
    
    update(deltaTime) {
        if (!this.active || !canvas) return;  // Modifica qui
        
        const moveDist = this.speed * (deltaTime / 1000) * 60;
        this.y += moveDist;
        this.rotationAngle += this.rotationSpeed * (deltaTime / (1000 / 60));
        
        if (this.y - this.size > canvas.height) {  // Modifica qui
            this.active = false;
            
            if (currentPlanetTypes) {  // Modifica qui
                const index = currentPlanetTypes.indexOf(this.type);
                if (index > -1) {
                    currentPlanetTypes.splice(index, 1);
                }
            }
        }
    }
    
    draw() {
        if (!this.active || !isFinite(this.x) || !isFinite(this.y) || 
            !isFinite(this.size) || this.size <= 0 || !window.ctx) return;
        
        window.ctx.save();
        window.ctx.globalAlpha = 0.5 + this.depth * 0.5;
        window.ctx.translate(this.x, this.y);
        window.ctx.rotate(this.rotationAngle);
        
        let baseColor, lightColor, darkColor, craterColor, craterStroke, craterHighlight;
        
        switch (this.type) {
            case 0: // Blu
                baseColor = "rgb(30,70,130)";
                lightColor = "rgb(70,130,180)";
                darkColor = "rgb(20,50,100)";
                craterStroke = "rgba(100,160,210,0.8)";
                craterColor = "rgba(15,35,65,0.6)";
                craterHighlight = "rgba(180,210,240,0.6)";
                break;
            case 6: // Verde
                baseColor = "rgb(40,120,60)";
                lightColor = "rgb(100,180,100)";
                darkColor = "rgb(20,80,40)";
                craterStroke = "rgba(130,200,140,0.8)";
                craterColor = "rgba(15,60,30,0.6)";
                craterHighlight = "rgba(180,220,190,0.6)";
                break;
            case 7: // Rosso
                baseColor = "rgb(80,10,10)";
                lightColor = "rgb(120,30,30)";
                darkColor = "rgb(60,5,5)";
                craterStroke = "rgba(150,40,40,0.8)";
                craterColor = "rgba(40,5,5,0.6)";
                craterHighlight = "rgba(180,60,60,0.6)";
                break;
            case 8: // Viola
                baseColor = "rgb(80,30,130)";
                lightColor = "rgb(130,70,180)";
                darkColor = "rgb(50,20,100)";
                craterStroke = "rgba(160,100,210,0.8)";
                craterColor = "rgba(40,15,65,0.6)";
                craterHighlight = "rgba(200,150,240,0.6)";
                break;
            case 9: // Grigio
            default:
                baseColor = "rgb(50,50,50)";
                lightColor = "rgb(100,100,100)";
                darkColor = "rgb(30,30,30)";
                craterStroke = "rgba(140,140,140,0.8)";
                craterColor = "rgba(20,20,20,0.6)";
                craterHighlight = "rgba(180,180,180,0.6)";
                break;
        }
        
        try {
            const gradient = window.ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            gradient.addColorStop(0, lightColor);
            gradient.addColorStop(0.6, baseColor);
            gradient.addColorStop(1, darkColor);
            window.ctx.fillStyle = gradient;
            window.ctx.beginPath();
            window.ctx.arc(0, 0, this.size, 0, 2 * Math.PI);
            window.ctx.fill();
        } catch (error) {
            window.ctx.restore();
            return;
        }
        
        const rand = seededPseudoRandom(this.featureSeed);
        const numCraters = 4 + Math.floor(rand() * 6);
        
        for (let i = 0; i < numCraters; i++) {
            const angle = rand() * Math.PI * 2;
            const radius = rand() * this.size * 0.85;
            const cx = Math.cos(angle) * radius;
            const cy = Math.sin(angle) * radius;
            const craterSize = this.size * (0.04 + rand() * 0.12);
            const crescentAngle = Math.PI * 1.35 + (rand() - 0.5) * 0.4;
            
            window.ctx.save();
            window.ctx.translate(cx, cy);
            window.ctx.fillStyle = craterColor;
            window.ctx.beginPath();
            window.ctx.arc(
                Math.cos(crescentAngle + Math.PI) * craterSize * 0.1,
                Math.sin(crescentAngle + Math.PI) * craterSize * 0.1,
                craterSize * 0.85,
                0,
                2 * Math.PI
            );
            window.ctx.fill();
            
            window.ctx.strokeStyle = craterStroke;
            window.ctx.lineWidth = Math.max(0.5, craterSize * 0.15 + rand() * craterSize * 0.1);
            window.ctx.lineCap = "round";
            window.ctx.beginPath();
            window.ctx.arc(
                0,
                0,
                craterSize * 0.92,
                crescentAngle - Math.PI * 0.5,
                crescentAngle + Math.PI * 0.5
            );
            window.ctx.stroke();
            
            if (craterSize > this.size * 0.1 && rand() > 0.4) {
                window.ctx.fillStyle = craterHighlight;
                window.ctx.beginPath();
                window.ctx.arc(0, 0, craterSize * 0.2, 0, 2 * Math.PI);
                window.ctx.fill();
            }
            
            window.ctx.restore();
        }
        
        const haloGradient = window.ctx.createRadialGradient(0, 0, this.size * 0.9, 0, 0, this.size * 1.1);
        haloGradient.addColorStop(0, "rgba(255,255,255,0.03)");
        haloGradient.addColorStop(1, "rgba(255,255,255,0)");
        window.ctx.fillStyle = haloGradient;
        window.ctx.beginPath();
        window.ctx.arc(0, 0, this.size * 1.1, 0, 2 * Math.PI);
        window.ctx.fill();
        
        window.ctx.restore();
    }
}

// Esponi le classi globalmente
window.Projectile = Projectile;
window.AlienProjectile = AlienProjectile;
window.Alien = Alien;
window.PowerUp = PowerUp;
window.Explosion = Explosion;
window.Planet = Planet;

// Esponi le funzioni di utilità
window.getRandomColor = getRandomColor;
window.isColliding = isColliding;
window.isSpaceshipCurrentlyVisible = isSpaceshipCurrentlyVisible;
window.hexToRgba = hexToRgba;
