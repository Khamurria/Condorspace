/**
 * CONDORSPACE - TEAM PARALLAX
 * UI e funzioni di rendering dell'interfaccia con supporto audio
 */

/**
 * Funzione modificata per disegnare il logo nel titolo
 * Adattata per mostrare l'intera navicella con cerchio completo
 */
function drawTitleLogo(canvas) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Assicuriamoci di avere dimensioni adeguate
    canvas.width = 80;
    canvas.height = 80;
    
    // Pulisci il canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sfondo uniforme
    ctx.fillStyle = 'rgba(10, 10, 26, 0.2)'; // Sfondo semi-trasparente
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Parametri centrali
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 5; // Spostato leggermente in basso
    
    // Cerchio esterno (glow)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(73, 218, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Cerchio interno
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(73, 218, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Disegna la navicella
    // Dimensioni ridotte per adattarsi meglio
    const shipScale = 0.8;
    
    // Corpo principale della navicella
    ctx.fillStyle = '#2a4b8d';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 25 * shipScale); // Punta della navicella
    ctx.lineTo(centerX - 18 * shipScale, centerY + 15 * shipScale);
    ctx.lineTo(centerX + 18 * shipScale, centerY + 15 * shipScale);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#49daff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Ali laterali
    ctx.beginPath();
    ctx.moveTo(centerX - 18 * shipScale, centerY + 5 * shipScale);
    ctx.lineTo(centerX - 30 * shipScale, centerY + 20 * shipScale);
    ctx.lineTo(centerX - 18 * shipScale, centerY + 15 * shipScale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 18 * shipScale, centerY + 5 * shipScale);
    ctx.lineTo(centerX + 30 * shipScale, centerY + 20 * shipScale);
    ctx.lineTo(centerX + 18 * shipScale, centerY + 15 * shipScale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Cabina
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 15 * shipScale);
    ctx.lineTo(centerX - 8 * shipScale, centerY);
    ctx.lineTo(centerX + 8 * shipScale, centerY);
    ctx.closePath();
    ctx.fillStyle = '#6ab7ff';
    ctx.fill();
    ctx.stroke();
    
    // Propulsori
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.moveTo(centerX - 12 * shipScale, centerY + 15 * shipScale);
    ctx.lineTo(centerX - 8 * shipScale, centerY + 25 * shipScale);
    ctx.lineTo(centerX, centerY + 15 * shipScale);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 12 * shipScale, centerY + 15 * shipScale);
    ctx.lineTo(centerX + 8 * shipScale, centerY + 25 * shipScale);
    ctx.lineTo(centerX, centerY + 15 * shipScale);
    ctx.closePath();
    ctx.fill();
    
    // Effetto bagliore
    ctx.shadowColor = '#49daff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(73, 218, 255, 0.2)';
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Collega gli eventi sonori ai pulsanti
function setupButtonSounds() {
    // Funzione helper per aggiungere l'audio ai pulsanti
    function addSoundToButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            // Aggiungi l'evento click al pulsante
            button.addEventListener('click', () => {
                // Riproduci il suono del pulsante se AudioSystem è disponibile
                if (window.AudioSystem && typeof window.AudioSystem.playButtonSound === 'function') {
                    window.AudioSystem.playButtonSound();
                }
            });
            console.log(`Sound added to button: ${buttonId}`);
        }
    }
    
    // Aggiungi suono a tutti i pulsanti del gioco
    const buttonIds = [
        'preStartButton',    // Pulsante iniziale
        'skipIntroButton',   // Pulsante per saltare l'intro
        'submitCadetButton', // Pulsante conferma nella registrazione cadetto
        'startButton',       // Pulsante per iniziare il gioco
        'restartButton',     // Pulsante per ricominciare
        'saveScoreButton'    // Pulsante per salvare il punteggio
    ];
    
    buttonIds.forEach(addSoundToButton);
    
    // Gestisci manualmente il pulsante di conferma nella registrazione cadetto
    // poiché potrebbe essere creato dinamicamente
    document.addEventListener('click', function(event) {
        if (event.target && event.target.id === 'submitCadetButton') {
            if (window.AudioSystem && typeof window.AudioSystem.playButtonSound === 'function') {
                window.AudioSystem.playButtonSound();
            }
        }
    });
}

// Esporta la funzione globalmente
window.drawTitleLogo = drawTitleLogo;
window.setupButtonSounds = setupButtonSounds;

// Gestione Logo PARALLAX e setup audio
document.addEventListener('DOMContentLoaded', function() {
    // Logo Splash Screen
    const parallaxLogoSplash = document.getElementById('parallaxLogoSplash');
    const parallaxLogoSmall = document.getElementById('parallaxLogoSmall');
    
    // Imposta il background con il logo vero (non placeholder)
    if (parallaxLogoSplash) {
        parallaxLogoSplash.style.backgroundImage = "url('assets/images/logo.png')";
    }
    
    if (parallaxLogoSmall) {
        parallaxLogoSmall.style.backgroundImage = "url('assets/images/logo.png')";
    }
    
    // Nascondi la schermata splash dopo 4 secondi e mostra l'intro
    setTimeout(function() {
        const splashScreen = document.getElementById('splashScreen');
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
    
    // Disegna il logo del titolo
    const titleLogoCanvas = document.getElementById('titleLogoCanvas');
    if (titleLogoCanvas) {
        drawTitleLogo(titleLogoCanvas);
    }
    
    // Collega i suoni ai pulsanti
    setupButtonSounds();
    
    // Assicurati che il sottotitolo sia sempre corretto
    const subtitleElement = document.querySelector('#titleHeader h2');
    if (subtitleElement) {
        subtitleElement.textContent = "NETHEX CONTRO IL DEMAND GALATTICO";
    }
    
    // Sovrascrive la funzione completeCadetRegistration per non modificare il sottotitolo
    const originalCompleteCadetRegistration = window.completeCadetRegistration;
    if (typeof originalCompleteCadetRegistration === 'function') {
        window.completeCadetRegistration = function(cadetName) {
            // Chiama la funzione originale
            originalCompleteCadetRegistration(cadetName);
            
            // Assicurati che il sottotitolo rimanga invariato
            if (subtitleElement) {
                subtitleElement.textContent = "NETHEX CONTRO IL DEMAND GALATTICO";
            }
        };
    }
});

// Funzione per mostrare messaggi UI durante il gioco
function showUIMessage(message, color) {
    const uiMessageDisplay = document.getElementById('uiMessageDisplay');
    if (!uiMessageDisplay) return;
    
    uiMessageDisplay.textContent = message;
    uiMessageDisplay.style.color = color || '#ff6666';
    uiMessageDisplay.classList.add('visible');
    
    // Rimuovi la classe dopo un intervallo
    setTimeout(() => {
        uiMessageDisplay.classList.remove('visible');
    }, 2000);
}

// Aggiorna i contatori dei cristalli
function updateCrystalCounter() {
    const crystalCounterElem = document.getElementById('crystalCounter');
    const crystalValueElem = document.getElementById('crystalValue');
    
    if (crystalCounterElem && crystalValueElem && window.game) {
        crystalCounterElem.textContent = window.game.gemCount || 0;
        crystalValueElem.textContent = window.game.gemValue || 0;
    }
}

// Aggiorna UI Boss
function updateBossUI(health, maxHealth, name) {
    const bossHealthBarContainer = document.getElementById('bossHealthBarContainer');
    const bossHealthBar = document.getElementById('bossHealthBar');
    const bossHealthText = document.getElementById('bossHealthText');
    
    if (!bossHealthBarContainer || !bossHealthBar || !bossHealthText) return;
    
    const healthPercent = Math.max(0, health) / maxHealth * 100;
    bossHealthBar.style.width = `${healthPercent}%`;
    bossHealthText.textContent = `${name || 'COMANDANTE SCUDERI'} (${Math.round(healthPercent)}%)`;
    
    // Imposta il colore in base alla salute
    if (healthPercent > 60) {
        bossHealthBar.style.backgroundColor = '#ff4444';
    } else if (healthPercent > 30) {
        bossHealthBar.style.backgroundColor = '#ff8800';
    } else {
        bossHealthBar.style.backgroundColor = '#ff0000';
    }
}

// Funzione per aggiornare l'UI principale del gioco
function updateGameUI(game, spaceship) {
    if (!game || !spaceship) return;
    
    // Aggiorna valori UI base
    const elements = {
        scoreValue: document.getElementById('scoreValue'),
        livesValue: document.getElementById('livesValue'),
        healthValue: document.getElementById('healthValue'),
        healthBar: document.getElementById('healthBar'),
        weaponValue: document.getElementById('weaponValue'),
        statusValue: document.getElementById('statusValue'),
        waveValue: document.getElementById('waveValue'),
        levelValue: document.getElementById('levelValue'),
        enemiesValue: document.getElementById('enemiesValue')
    };
    
    // Verifica se gli elementi esistono
    if (!elements.scoreValue || !elements.livesValue) return;
    
    // Aggiorna i valori
    elements.scoreValue.textContent = game.score;
    elements.livesValue.textContent = Math.max(0, game.lives);
    
    if (elements.levelValue) {
        elements.levelValue.textContent = game.level;
    }
    
    if (elements.enemiesValue) {
        elements.enemiesValue.textContent = (game.aliens ? game.aliens.filter(a => a.active).length : 0) + 
                                           (game.gameBoss && game.gameBoss.active ? 1 : 0);
    }
    
    if (elements.healthValue && elements.healthBar) {
        elements.healthValue.textContent = `${Math.max(0, spaceship.health)}/${spaceship.maxHealth}`;
        const healthPercent = Math.max(0, spaceship.health) / spaceship.maxHealth * 100;
        elements.healthBar.style.width = `${healthPercent}%`;
        
        if (healthPercent > 60) {
            elements.healthBar.style.backgroundColor = '#40ff40';
        } else if (healthPercent > 30) {
            elements.healthBar.style.backgroundColor = '#ffff40';
        } else {
            elements.healthBar.style.backgroundColor = '#ff4040';
        }
    }
    
    if (elements.weaponValue) {
        let weaponText = "Standard";
        switch (spaceship.weaponType) {
            case 1: weaponText = "Spread"; break;
            case 2: weaponText = "Rapid"; break;
            case 3: weaponText = "Heavy"; break;
            case 4: weaponText = "Laser"; break;
        }
        elements.weaponValue.textContent = weaponText;
    }
    
    if (elements.statusValue) {
        elements.statusValue.classList.remove('shieldActiveUI');
        elements.statusValue.style.color = '#fff';
        
        if (spaceship.shieldActive) {
            elements.statusValue.textContent = `Scudo (${Math.ceil(spaceship.shieldTimer / 1000)}s)`;
            elements.statusValue.classList.add('shieldActiveUI');
        } else if (spaceship.invincibleAfterLifeLoss) {
            elements.statusValue.textContent = "Invincibile";
            elements.statusValue.style.color = '#ffdd88';
        } else if (spaceship.invincibleAfterHit) {
            elements.statusValue.textContent = "Colpito!";
            elements.statusValue.style.color = '#ffaa88';
        } else {
            elements.statusValue.textContent = "OK";
        }
    }
    
    if (elements.waveValue) {
        if (game.bossSpawned) {
            elements.waveValue.textContent = "BOSS";
        } else if (game.currentWaveIndex >= 0 && game.WAVES && game.currentWaveIndex < game.WAVES.length) {
            elements.waveValue.textContent = `${game.currentWaveIndex + 1}/${game.WAVES.length}`;
        } else if (game.allWavesCompleted && !game.bossSpawned) {
            elements.waveValue.textContent = "???";
        } else {
            elements.waveValue.textContent = "-";
        }
    }
    
    // Aggiorna contatore cristalli
    updateCrystalCounter();
}
