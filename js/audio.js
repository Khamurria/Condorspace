/**
 * CONDORSPACE - TEAM PARALLAX
 * Sistema Audio del gioco - Versione ottimizzata con supporto MP3 e fix CORS
 */

// Sistema Audio
const AudioSystem = {
    context: null,
    sfxGainNode: null,
    musicGainNode: null,
    isInitialized: false,
    audioUnlockNeeded: true,
    
    // Elementi audio MP3
    musicElements: {}, 
    soundBank: {}, 
    
    // Path dei file MP3
    audioFiles: {
        logoMusic: "assets/audio/parallax_logo.mp3",
        introMusic: "assets/audio/intro_music.mp3",
        gameplayMusic: "assets/audio/gameplay_music.mp3"
    },

    init(callback) {
        if (this.isInitialized) { 
            if (callback) callback(); 
            return; 
        }
        console.log("Initializing AudioSystem...");
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!window.AudioContext) throw new Error("Web Audio API not supported.");
            
            this.context = new AudioContext();
            this.sfxGainNode = this.context.createGain();
            this.sfxGainNode.gain.setValueAtTime(0.6, this.context.currentTime);
            this.sfxGainNode.connect(this.context.destination);
            
            this.musicGainNode = this.context.createGain();
            this.musicGainNode.gain.setValueAtTime(0.15, this.context.currentTime);
            this.musicGainNode.connect(this.context.destination);
            
            if (this.context.state === 'suspended') {
                console.log("AudioContext suspended.");
                this.audioUnlockNeeded = true;
            } else {
                this.audioUnlockNeeded = false;
                console.log("AudioContext is running.");
            }
            
            this.isInitialized = true;
            if (callback) callback();
        } catch (error) {
            console.error("AudioContext init failed:", error);
            this.isInitialized = false;
            if (callback) callback();
        }
    },

    resumeContext(callback) {
        if (!this.context || !this.isInitialized) {
            if (callback) callback();
            return;
        }
        
        if (this.context.state === 'suspended') {
            console.log("Attempting to resume AudioContext...");
            this.context.resume().then(() => {
                console.log("AudioContext resumed.");
                this.audioUnlockNeeded = false;
                if (callback) callback();
            }).catch(error => {
                console.error("AudioContext resume failed:", error);
                this.audioUnlockNeeded = true;
                if (callback) callback();
            });
        } else if (this.context.state === 'running') {
            this.audioUnlockNeeded = false;
            if (callback) callback();
        } else {
            if (callback) callback();
        }
    },

    /**
     * Riproduce un suono di click per i pulsanti
     * Generato proceduralmente senza bisogno di file MP3
     */
    playButtonSound() {
        if (!this.context || this.context.state !== 'running') return;
        
        const now = this.context.currentTime;
        
        // Componente principale del click (suono secco)
        this._createToneSweep("sine", 700, 0, 0.03, 0.2, 0.001, 0.02, now);
        
        // Componente secondaria per dare più "corpo" al click
        this._createToneSweep("square", 1200, 800, 0.015, 0.1, 0.001, 0.01, now + 0.005);
        
        // Leggero rumore per effetto "clic" meccanico
        this._createFilteredNoise(0.02, 3000, 10, 0.05, "bandpass", now);
    },

    /**
     * Carica e riproduce un brano MP3 usando l'elemento audio HTML5
     * @param {string} id - Identificatore del brano
     * @param {string} url - URL del file audio
     * @param {number} volume - Volume della musica (0.0 - 1.0)
     * @param {boolean} loop - Se la musica deve essere riprodotta in loop
     */
    playMP3Music(id, url, volume = 0.5, loop = true) {
        // Prima verifica se c'è già musica in riproduzione e fermala
        this.stopAllMP3Music(500);
        
        console.log(`Attempting to play MP3 '${id}' from: ${url}`);
        
        // Verifica esistenza URL con timeout ridotto
        fetch(url, { 
            method: 'HEAD',
            cache: 'no-cache',
            timeout: 2000
        })
        .then(response => {
            if (!response.ok) {
                console.warn(`MP3 file not found: ${url}`);
                return false;
            }
            return true;
        })
        .then(fileExists => {
            if (!fileExists) {
                console.warn(`MP3 file not found: ${url}, could not play music`);
                return;
            }
            
            // Crea un nuovo elemento audio
            const audioElement = new Audio();
            audioElement.volume = 0; // Inizia con volume zero per fade-in
            audioElement.loop = loop;
            audioElement.src = url;
            
            // Applica cross-origin attribute se necessario
            audioElement.crossOrigin = "anonymous";
            
            // Memorizza l'elemento
            this.musicElements[id] = audioElement;
            
            // Evento oncanplaythrough per sapere quando l'audio è pronto
            audioElement.oncanplaythrough = () => {
                // Fade in progressivo
                const fadeInTime = 1000; // 1 secondo
                const fadeStep = volume / (fadeInTime / 50); // 50ms per step
                let currentVolume = 0;
                
                const fadeInterval = setInterval(() => {
                    if (currentVolume < volume) {
                        currentVolume = Math.min(volume, currentVolume + fadeStep);
                        audioElement.volume = currentVolume;
                    } else {
                        clearInterval(fadeInterval);
                    }
                }, 50);
                
                audioElement.play().catch(error => {
                    console.error(`Error playing MP3 '${id}':`, error);
                    // Se l'autoplay è bloccato, possiamo riprovare dopo un'interazione utente
                    if (error.name === 'NotAllowedError') {
                        console.warn("Autoplay prevented. Will try to play on next user interaction.");
                        clearInterval(fadeInterval);
                        
                        // Configura un gestore di eventi per riprovare dopo l'interazione dell'utente
                        const tryPlayOnInteraction = () => {
                            audioElement.play().then(() => {
                                document.removeEventListener('click', tryPlayOnInteraction);
                                document.removeEventListener('keydown', tryPlayOnInteraction);
                            }).catch(e => console.error("Still couldn't play audio:", e));
                        };
                        
                        document.addEventListener('click', tryPlayOnInteraction, { once: true });
                        document.addEventListener('keydown', tryPlayOnInteraction, { once: true });
                    }
                });
            };
            
            // Gestisci errori di caricamento
            audioElement.onerror = (e) => {
                console.error(`Error loading MP3 '${id}':`, e);
            };
        })
        .catch(error => {
            console.error("Error checking MP3 file:", error);
        });
    },

    /**
     * Ferma uno specifico brano MP3
     * @param {string} id - Identificatore del brano
     * @param {number} fadeOutTime - Tempo di dissolvenza in ms (opzionale)
     */
    stopMP3Music(id, fadeOutTime = 0) {
        const audioElement = this.musicElements[id];
        if (!audioElement) return;
        
        if (fadeOutTime > 0) {
            // Applica dissolvenza
            const originalVolume = audioElement.volume;
            const fadeStep = originalVolume / (fadeOutTime / 50); // 50ms per step
            
            const fadeInterval = setInterval(() => {
                if (audioElement.volume > fadeStep) {
                    audioElement.volume -= fadeStep;
                } else {
                    audioElement.pause();
                    audioElement.currentTime = 0;
                    clearInterval(fadeInterval);
                    delete this.musicElements[id];
                }
            }, 50);
        } else {
            // Ferma immediatamente
            audioElement.pause();
            audioElement.currentTime = 0;
            delete this.musicElements[id];
        }
    },

    /**
     * Ferma tutti i brani MP3
     * @param {number} fadeOutTime - Tempo di dissolvenza in ms (opzionale)
     */
    stopAllMP3Music(fadeOutTime = 0) {
        Object.keys(this.musicElements).forEach(id => {
            this.stopMP3Music(id, fadeOutTime);
        });
    },

    /**
     * Riproduce la musica del logo PARALLAX
     */
    playLogoMusic() {
        console.log("Playing logo music from:", this.audioFiles.logoMusic);
        this.playMP3Music('logo', this.audioFiles.logoMusic, 0.5, false);
    },

    /**
     * Riproduce la musica dell'intro
     */
    playIntroMP3() {
        console.log("Playing intro music from:", this.audioFiles.introMusic);
        this.playMP3Music('intro', this.audioFiles.introMusic, 0.4, true);
    },

    /**
     * Riproduce la musica del gameplay
     */
    playGameplayMP3() {
        console.log("Playing gameplay music from:", this.audioFiles.gameplayMusic);
        this.playMP3Music('gameplay', this.audioFiles.gameplayMusic, 0.3, true);
    },

    _createToneSweep(type, freqStart, freqEnd, duration, gain = 1, attack = 0.01, decay = 0.1, startTime = null) {
        if (!this.context || !this.sfxGainNode || this.context.state !== 'running') return null;
        
        const now = this.context.currentTime;
        const t = startTime !== null ? startTime : now;
        
        try {
            const osc = this.context.createOscillator();
            osc.type = type;
            
            const freqS = Math.max(20, Math.min(20000, freqStart));
            const freqE = Math.max(20, Math.min(20000, freqEnd));
            
            osc.frequency.setValueAtTime(freqS, t);
            if (duration > 0.001 && freqE !== freqS) {
                osc.frequency.exponentialRampToValueAtTime(freqE, t + duration * 0.8);
            } else {
                osc.frequency.setValueAtTime(freqE, t + duration * 0.8);
            }
            
            const gainNode = this.context.createGain();
            gainNode.gain.setValueAtTime(0, t);
            
            if (attack > 0.001) {
                gainNode.gain.linearRampToValueAtTime(gain, t + attack);
            } else {
                gainNode.gain.setValueAtTime(gain, t + attack);
            }
            
            const endTime = t + Math.max(attack, duration);
            
            if (decay > 0.001) {
                gainNode.gain.exponentialRampToValueAtTime(0.001, endTime + decay);
            } else {
                gainNode.gain.setValueAtTime(0.001, endTime + decay);
            }
            
            osc.connect(gainNode).connect(this.sfxGainNode);
            osc.start(t);
            osc.stop(endTime + decay + 0.05);
            
            return { o: osc, g: gainNode };
        } catch (e) {
            console.warn("ToneSweep error:", e);
            return null;
        }
    },

    _createFilteredNoise(duration, freq, Q = 1, gain = 1, type = "bandpass", startTime = null) {
        if (!this.context || !this.sfxGainNode || this.context.state !== 'running') return null;
        
        const now = this.context.currentTime;
        const t = startTime !== null ? startTime : now;
        
        try {
            const bufferSize = Math.max(1, Math.floor(this.context.sampleRate * duration));
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noiseSource = this.context.createBufferSource();
            noiseSource.buffer = buffer;
            
            const filter = this.context.createBiquadFilter();
            filter.type = type;
            filter.frequency.setValueAtTime(freq, t);
            filter.Q.setValueAtTime(Q, t);
            
            const gainNode = this.context.createGain();
            gainNode.gain.setValueAtTime(0, t);
            gainNode.gain.linearRampToValueAtTime(gain, t + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
            
            noiseSource.connect(filter).connect(gainNode).connect(this.sfxGainNode);
            noiseSource.start(t);
            noiseSource.stop(t + duration + 0.1);
            
            return { n: noiseSource, f: filter, ng: gainNode };
        } catch(e) {
            console.warn("FilteredNoise error:", e);
            return null;
        }
    },

    play(e) {
        if (!this.context || this.context.state !== 'running' || !this.sfxGainNode) return null;
        
        if (e === "alienLaser") {
            this.playAlienLaser();
            return;
        }
        
        if (e === "explosionSmall" || e === "explosionMedium" || e === "explosionLarge") {
            this.playExplosion(e);
            return;
        }
        
        if (e === "megaExplosion") {
            this.playMegaExplosionSound();
            return;
        }
        
        if (e === "buttonClick") {
            this.playButtonSound();
            return;
        }
        
        const t = this.context.currentTime;
        
        switch(e) {
            case "laser":
                return this._createToneSweep("square", 780, 380, 0.11, 0.38, 0.005, 0.06, t);
            case "spread":
                return this._createToneSweep("sawtooth", 900, 450, 0.1, 0.32, 0.005, 0.05, t);
            case "rapid":
                return this._createToneSweep("triangle", 920, 500, 0.07, 0.28, 0.003, 0.04, t);
            case "heavy":
                this._createToneSweep("sawtooth", 280, 140, 0.22, 0.48, 0.01, 0.25, t);
                return this._createToneSweep("square", 560, 280, 0.18, 0.28, 0.02, 0.2, t + 0.02);
            case "powerup":
                this._createToneSweep("sine", 800, 1500, 0.35, 0.55, 0.01, 0.2, t);
                return this._createToneSweep("sine", 1200, 1900, 0.25, 0.45, 0.01, 0.1, t + 0.1);
            case "shieldUp":
                this._createToneSweep("sine", 440, 880, 0.4, 0.6, 0.01, 0.25, t);
                return this._createToneSweep("triangle", 660, 1320, 0.3, 0.5, 0.02, 0.15, t + 0.1);
            case "shieldDown":
                return this._createToneSweep("sawtooth", 660, 220, 0.4, 0.3, 0.01, 0.3, t);
            case "playerHit":
                this._createToneSweep("sawtooth", 500, 100, 0.3, 0.65, 0.005, 0.2, t);
                return this._createFilteredNoise(0.3, 1200, 6, 0.5, "lowpass", t);
            case "gameOver":
                this._createToneSweep("sawtooth", 400, 100, 1.2, 0.5, 0.05, 0.6, t);
                return this._createToneSweep("sawtooth", 300, 80, 1.1, 0.4, 0.1, 0.7, t + 0.2);
            case "gameStart":
                this._createToneSweep("sawtooth", 220, 770, 0.6, 0.5, 0.02, 0.3, t);
                return this._createToneSweep("square", 440, 990, 0.5, 0.4, 0.01, 0.2, t + 0.1);
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
                return null;
        }
    },

    playAlienLaser() {
        if (!this.context || this.context.state !== "running" || !this.sfxGainNode) return null;
        
        const e = this.context.currentTime;
        const t = Math.random() < 0.6 ? "triangle" : "sine";
        const i = 900 + Math.random() * 400;
        const s = i * (0.35 + Math.random() * 0.3);
        const h = 0.07 + Math.random() * 0.05;
        const a = 0.22 + Math.random() * 0.1;
        
        this._createToneSweep(t, i, s, h, a, 0.005, 0.05, e);
    },

    playExplosion(e) {
        if (!this.context || this.context.state !== "running" || !this.sfxGainNode) return null;
        
        const t = this.context.currentTime;
        
        switch(e) {
            case "explosionSmall":
                this._createFilteredNoise(0.3, 1600, 11, 0.45, "bandpass", t);
                this._createToneSweep("square", 650, 250, 0.18, 0.35, 0.01, 0.12, t + 0.02);
                break;
            case "explosionMedium":
                this._createFilteredNoise(0.5, 900, 9, 0.65, "bandpass", t);
                this._createToneSweep("sawtooth", 450, 120, 0.35, 0.55, 0.01, 0.25, t + 0.05);
                this._createToneSweep("square", 250, 90, 0.35, 0.45, 0.05, 0.3, t + 0.1);
                break;
            case "explosionLarge":
                this._createFilteredNoise(1, 500, 7, 0.85, "lowpass", t);
                this._createToneSweep("sawtooth", 220, 60, 0.7, 0.75, 0.02, 0.5, t + 0.05);
                this._createToneSweep("square", 120, 50, 0.8, 0.65, 0.1, 0.6, t + 0.15);
                for (let i = 0; i < 7; i++) {
                    this._createFilteredNoise(
                        0.06 + Math.random() * 0.04,
                        3500 + Math.random() * 2500,
                        18,
                        0.35,
                        "highpass",
                        t + 0.1 + Math.random() * 0.6
                    );
                }
                break;
        }
    },

    playMegaExplosionSound() {
        if (!this.context || this.context.state !== 'running') return;
        
        console.log("Playing MEGA Explosion Sound");
        const t = this.context.currentTime;
        
        this._createFilteredNoise(1.8, 300, 5, 1.0, "lowpass", t);
        this._createToneSweep("sawtooth", 180, 40, 1.2, 0.9, 0.03, 0.8, t + 0.05);
        this._createToneSweep("square", 100, 30, 1.4, 0.8, 0.15, 1.0, t + 0.15);
        
        for (let i = 0; i < 15; i++) {
            this._createFilteredNoise(
                0.1 + Math.random() * 0.15,
                4000 + Math.random() * 3000,
                15 + Math.random() * 10,
                0.4 + Math.random() * 0.3,
                "highpass",
                t + 0.2 + Math.random() * 1.5
            );
        }
        
        this._createToneSweep("sine", 80, 50, 3.0, 0.3, 1.0, 2.0, t + 0.5);
    },

    // Funzioni di utilità per la riproduzione di suoni
    playLaserSound() { this.play('laser'); },
    playSpreadSound() { this.play('spread'); },
    playRapidSound() { this.play('rapid'); },
    playHeavySound() { this.play('heavy'); },
    playAlienLaserSound() { this.playAlienLaser(); },
    
    playExplosionSound(e) {
        if (!this.context || this.context.state !== 'running') return;
        if (e === "large") {
            this.playExplosion("explosionLarge");
        } else if (e === "medium") {
            this.playExplosion("explosionMedium");
        } else {
            this.playExplosion("explosionSmall");
        }
    },
    
    playPowerUpSound() { this.play('powerup'); },
    playPlayerHitSound() { this.play('playerHit'); },
    playGameOverSound() { this.play('gameOver'); },
    playGameStartSound() { this.play('gameStart'); },
    playShieldUpSound() { this.play('shieldUp'); },
    playShieldDownSound() { this.play('shieldDown'); },

    playEpicFanfare() {
        if (!this.context || this.context.state !== 'running') return;
        
        const now = this.context.currentTime;
        
        // Sequenza di suoni per la fanfara
        this._createToneSweep("sawtooth", 220, 440, 0.2, 0.6, 0.01, 0.1, now);
        this._createToneSweep("triangle", 440, 880, 0.3, 0.5, 0.02, 0.15, now + 0.2);
        this._createToneSweep("sine", 660, 990, 0.25, 0.4, 0.01, 0.1, now + 0.5);
        this._createToneSweep("triangle", 880, 1320, 0.3, 0.5, 0.02, 0.15, now + 0.75);
        this._createToneSweep("sawtooth", 440, 880, 0.4, 0.6, 0.02, 0.2, now + 1.0);
        
        // Effetto percussione
        this._createFilteredNoise(0.2, 500, 5, 0.6, "lowpass", now + 0.1);
        this._createFilteredNoise(0.15, 1000, 10, 0.4, "bandpass", now + 0.5);
        this._createFilteredNoise(0.25, 300, 8, 0.7, "lowpass", now + 1.0);
    },
    
    // Supporto per laser continuo
    continuousLaserSound: null,
    
    startContinuous() {
        if (!this.context || this.context.state !== 'running') return;
        
        // Ferma qualsiasi suono continuo precedente
        this.stopContinuous();
        
        const now = this.context.currentTime;
        
        // Crea oscillatore principale
        const osc1 = this.context.createOscillator();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.setValueAtTime(920, now + 0.1);
        
        // Crea oscillatore secondario per armoniche
        const osc2 = this.context.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(440, now);
        
        // Crea un nodo gain per il volume
        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        
        // Crea un filtro per modulare il suono
        const filter = this.context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2000, now);
        filter.Q.setValueAtTime(5, now);
        
        // Crea un LFO per modulare il filtro
        const lfo = this.context.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(8, now);
        
        const lfoGain = this.context.createGain();
        lfoGain.gain.setValueAtTime(400, now);
        
        // Collega tutto
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGainNode);
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        // Avvia oscillatori
        osc1.start(now);
        osc2.start(now);
        lfo.start(now);
        
        // Memorizza riferimenti per poterli fermare
        this.continuousLaserSound = {
            osc1: osc1,
            osc2: osc2,
            lfo: lfo,
            gain: gainNode,
            filter: filter,
            lfoGain: lfoGain
        };
    },
    
    stopContinuous() {
        if (!this.continuousLaserSound) return;
        
        const now = this.context.currentTime;
        
        // Fade out per evitare click
        this.continuousLaserSound.gain.gain.linearRampToValueAtTime(0, now + 0.1);
        
        // Ferma gli oscillatori dopo il fade out
        setTimeout(() => {
            if (this.continuousLaserSound.osc1) {
                this.continuousLaserSound.osc1.stop();
            }
            if (this.continuousLaserSound.osc2) {
                this.continuousLaserSound.osc2.stop();
            }
            if (this.continuousLaserSound.lfo) {
                this.continuousLaserSound.lfo.stop();
            }
            this.continuousLaserSound = null;
        }, 150);
    }
};

// --- Gestione CORS e cross-browser audio ---
// Intercettore globale per gestire eventuali errori audio
window.addEventListener('error', function(e) {
    // Cattura errori relativi a file audio
    if (e.message && (
        e.message.includes('audio') || 
        e.message.includes('mp3') || 
        e.message.includes('media')
    )) {
        console.warn('Audio error caught:', e.message);
        return true; // Impedisce che l'errore si propaghi
    }
});

// CORS fallback per file audio
(function() {
    // Crea un proxy per i metodi Audio
    const originalAudio = window.Audio;
    window.Audio = function(src) {
        const audio = new originalAudio(src);
        
        // Imposta attributi per migliorare la compatibilità
        if (src) {
            audio.crossOrigin = "anonymous";
        }
        
        // Gestisci eventuali errori di caricamento
        audio.addEventListener('error', function(e) {
            console.warn('Audio load error:', e);
        });
        
        return audio;
    };
    
    // Traccia la riproduzione dell'audio
    const originalPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function() {
        const src = this.src || 'unknown';
        
        // Chiamata originale con gestione promessa
        return originalPlay.call(this).catch(error => {
            console.warn(`Audio play error (${src}):`, error);
            return Promise.reject(error);
        });
    };
    
    console.log('Audio CORS fixes installed');
})();

// Sistema di gestione audio globale - sincronizzazione con eventi di gioco
document.addEventListener('DOMContentLoaded', function() {
    // Assicurati che il sistema audio sia disponibile
    if (!window.AudioSystem) {
        console.warn('AudioSystem not available, skip audio sync fixes');
        return;
    }
    
    // Cambia la schermata corrente evitando overlap audio
    window.changeScreenWithAudio = function(fromScreen, toScreen, audio, delay = 500) {
        if (fromScreen && typeof fromScreen === 'string') {
            const fromElement = document.getElementById(fromScreen);
            if (fromElement) fromElement.style.display = 'none';
        }
        
        // Riproduci audio se specificato
        if (audio && AudioSystem) {
            if (typeof audio === 'string') {
                // Riproduci per nome
                if (AudioSystem[audio] && typeof AudioSystem[audio] === 'function') {
                    AudioSystem[audio]();
                } else if (AudioSystem.play) {
                    AudioSystem.play(audio);
                }
            } else if (typeof audio === 'function') {
                // Esegui funzione audio
                audio();
            }
        }
        
        // Mostra la schermata successiva con ritardo
        if (toScreen && typeof toScreen === 'string') {
            setTimeout(() => {
                const toElement = document.getElementById(toScreen);
                if (toElement) toElement.style.display = 'block';
            }, delay);
        }
    };
    
    // Verifica lo stato dell'audio dopo 2 secondi
    setTimeout(() => {
        if (window.AudioSystem && window.AudioSystem.isInitialized) {
            document.dispatchEvent(new CustomEvent('audioSystemReady'));
        } else {
            console.warn("AudioSystem not initialized after timeout");
        }
    }, 2000);
});

// Esponi AudioSystem globalmente
window.AudioSystem = AudioSystem;