/**
 * CONDORSPACE - TEAM PARALLAX
 * Sistema Audio del gioco - Versione aggiornata con supporto MP3 e suono pulsanti procedurale
 */

// Sistema Audio
const AudioSystem = {
    context: null,
    sfxGainNode: null,
    musicGainNode: null,
    continuousSource: null,
    isInitialized: false,
    audioUnlockNeeded: true,
    themes: { intro: null, background: null, boss: null },
    activeTheme: null,
    musicElements: {}, // Buffer per elementi audio HTML5
    soundBank: {}, // Buffer per suoni caricati tramite Web Audio API
    
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
        
        // Creazione di un suono di click breve e nitido
        
        // Componente principale del click (suono secco)
        this._createToneSweep("sine", 700, 0, 0.03, 0.2, 0.001, 0.02, now);
        
        // Componente secondaria per dare più "corpo" al click
        this._createToneSweep("square", 1200, 800, 0.015, 0.1, 0.001, 0.01, now + 0.005);
        
        // Leggero rumore per effetto "clic" meccanico
        this._createFilteredNoise(0.02, 3000, 10, 0.05, "bandpass", now);
    },

    /**
     * Carica un file audio nel buffer del sistema
     * @param {string} id - Identificatore del suono
     * @param {string} url - URL del file audio
     * @param {Function} callback - Funzione di callback opzionale
     */
    loadSound(id, url, callback) {
        if (!this.context) {
            console.error("Cannot load sound, AudioContext not initialized");
            if (callback) callback(false);
            return;
        }

        // Controlla se il suono è già stato caricato
        if (this.soundBank[id]) {
            if (callback) callback(true);
            return;
        }

        // Carica il file audio
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        
        request.onload = () => {
            this.context.decodeAudioData(request.response, 
                (buffer) => {
                    this.soundBank[id] = buffer;
                    console.log(`Sound '${id}' loaded successfully`);
                    if (callback) callback(true);
                },
                (error) => {
                    console.error(`Error decoding audio data for '${id}':`, error);
                    if (callback) callback(false);
                }
            );
        };
        
        request.onerror = () => {
            console.error(`XHR error loading sound '${id}'`);
            if (callback) callback(false);
        };
        
        request.send();
    },

    /**
     * Riproduce un suono caricato nel buffer
     * @param {string} id - Identificatore del suono
     * @param {number} volume - Volume del suono (0.0 - 1.0)
     * @param {boolean} loop - Se il suono deve essere riprodotto in loop
     * @returns {AudioBufferSourceNode} - La sorgente audio creata
     */
    playSound(id, volume = 1.0, loop = false) {
        if (!this.context || this.context.state !== 'running' || !this.soundBank[id]) {
            console.warn(`Cannot play sound '${id}': context not running or sound not loaded`);
            return null;
        }

        try {
            const source = this.context.createBufferSource();
            source.buffer = this.soundBank[id];
            source.loop = loop;
            
            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            source.start(0);
            return source;
        } catch (error) {
            console.error(`Error playing sound '${id}':`, error);
            return null;
        }
    },

    /**
     * Carica e riproduce un brano MP3 usando l'elemento audio HTML5
     * @param {string} id - Identificatore del brano
     * @param {string} url - URL del file audio
     * @param {number} volume - Volume della musica (0.0 - 1.0)
     * @param {boolean} loop - Se la musica deve essere riprodotta in loop
     */
    playMP3Music(id, url, volume = 0.5, loop = true) {
        // Verifica se l'URL esiste
        fetch(url, { method: 'HEAD' })
            .then(response => {
                if (!response.ok) {
                    console.warn(`MP3 file not found: ${url}, falling back to procedural audio`);
                    return false;
                }
                return true;
            })
            .then(fileExists => {
                if (!fileExists) return;
                
                // Ferma qualsiasi altro brano musicale
                this.stopAllMP3Music();
        
                // Crea un nuovo elemento audio
                const audioElement = new Audio(url);
                audioElement.volume = volume;
                audioElement.loop = loop;
                
                // Memorizza l'elemento
                this.musicElements[id] = audioElement;
                
                // Riproduci il brano
                const playPromise = audioElement.play();
                
                // Gestisci la promessa per potenziali errori
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error(`Error playing MP3 '${id}':`, error);
                        // Se l'autoplay è bloccato, possiamo riprovare dopo un'interazione utente
                        if (error.name === 'NotAllowedError') {
                            console.warn("Autoplay prevented. Will try to play on next user interaction.");
                            
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
                }
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
        this.playMP3Music('logo', this.audioFiles.logoMusic, 0.5, false);
    },

    /**
     * Riproduce la musica dell'intro
     */
    playIntroMP3() {
        this.playMP3Music('intro', this.audioFiles.introMusic, 0.4, true);
    },

    /**
     * Riproduce la musica del gameplay
     */
    playGameplayMP3() {
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
            case "continuous":
                console.warn("Use startContinuous()");
                return null;
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

    startContinuous() {
        if (!this.context || this.context.state !== "running" || this.continuousSource) return;
        
        this.stopContinuous();
        
        try {
            const e = this.context.currentTime;
            const t = this.context.createOscillator();
            const i = this.context.createOscillator();
            const s = this.context.createGain();
            const h = this.context.createGain();
            const a = this.context.createBiquadFilter();
            
            t.type = "sawtooth";
            t.frequency.setValueAtTime(900, e);
            t.frequency.linearRampToValueAtTime(1100, e + 0.5);
            
            i.type = "sine";
            i.frequency.setValueAtTime(18, e);
            
            h.gain.setValueAtTime(0.2, e);
            i.connect(h).connect(s.gain);
            
            s.gain.setValueAtTime(0, e);
            s.gain.linearRampToValueAtTime(0.45, e + 0.1);
            
            a.type = "bandpass";
            a.frequency.setValueAtTime(2500, e);
            a.frequency.linearRampToValueAtTime(1800, e + 0.5);
            a.Q.setValueAtTime(8, e);
            
            t.connect(s).connect(a).connect(this.sfxGainNode);
            t.start(e);
            i.start(e);
            
            this.continuousSource = { o: t, l: i, g: s, lg: h, f: a };
        } catch (error) {
            console.error("Failed start continuous sound", error);
            this.continuousSource = null;
        }
    },

    stopContinuous() {
        if (this.continuousSource && this.context && this.context.state === "running") {
            const e = this.context.currentTime;
            const t = 0.15;
            
            try {
                if (this.continuousSource.g?.gain) {
                    this.continuousSource.g.gain.cancelScheduledValues(e);
                    this.continuousSource.g.gain.setValueAtTime(this.continuousSource.g.gain.value, e);
                    this.continuousSource.g.gain.linearRampToValueAtTime(0.001, e + t);
                }
            } catch (i) {}
            
            const s = e + t + 0.1;
            
            try {
                this.continuousSource.o?.stop(s);
            } catch (i) {}
            
            try {
                this.continuousSource.l?.stop(s);
            } catch (i) {}
            
            setTimeout(() => {
                try {
                    this.continuousSource?.o?.disconnect();
                } catch (h) {}
                
                try {
                    this.continuousSource?.l?.disconnect();
                } catch (h) {}
                
                try {
                    this.continuousSource?.lg?.disconnect();
                } catch (h) {}
                
                try {
                    this.continuousSource?.g?.disconnect();
                } catch (h) {}
                
                try {
                    this.continuousSource?.f?.disconnect();
                } catch (h) {}
                
                this.continuousSource = null;
            }, (t + 0.2) * 1000);
        } else if (this.continuousSource) {
            this.continuousSource = null;
        }
    },

    _createMusicNodes(gain = 0.12, delayTime = 0.3, feedback = 0.35) {
        if (!this.context || this.context.state !== 'running' || !this.musicGainNode) {
            return null;
        }
        
        try {
            // Usa il nodo principale di gain per la musica
            return { 
                gainNode: this.musicGainNode, 
                sources: [], 
                scheduler: null 
            };
        } catch(e) {
            console.error("Error creating music nodes:", e);
            return null;
        }
    },

    stopAllMusic(fadeDuration = 0.2) {
        // Ferma tutti i temi musicali
        ['intro', 'background', 'boss'].forEach(themeKey => {
            const theme = this.themes[themeKey];
            if (!theme) return;
            
            if (theme.scheduler) {
                clearTimeout(theme.scheduler);
                theme.scheduler = null;
            }
            
            // Ferma le sorgenti sonore individuali
            (theme.sources || []).forEach(s => {
                try {
                    // Verifica che la sorgente sia ancora valida
                    if (s && typeof s.stop === 'function') {
                        s.stop(this.context.currentTime + fadeDuration + 0.1);
                        
                        // Pianifica la disconnessione
                        setTimeout(() => {
                            try {
                                s.disconnect();
                            } catch(e) {}
                        }, (fadeDuration + 0.2) * 1000);
                    }
                } catch (e) {
                    // Ignora errori nella fermata/disconnessione
                }
            });
            
            theme.sources = [];
            this.themes[themeKey] = null;
        });

        // Fade out del nodo gain principale per la musica
        if (this.musicGainNode && this.context && this.context.state === 'running') {
            const now = this.context.currentTime;
            try {
                this.musicGainNode.gain.cancelScheduledValues(now);
                this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
                this.musicGainNode.gain.linearRampToValueAtTime(0.001, now + fadeDuration);
            } catch(e) {
                console.warn("Error fading music gain:", e);
            }
        }
        
        this.activeTheme = null;
        
        // Ferma anche qualsiasi musica MP3
        this.stopAllMP3Music(fadeDuration * 1000);
    },

    playIntroTheme() {
        if (!this.context || this.context.state !== 'running' || !this.isInitialized || !this.musicGainNode) return;
        if (this.activeTheme === 'intro') return;
        
        // Se abbiamo un file MP3 per l'intro, usiamo quello invece
        if (this.audioFiles.introMusic) {
            this.stopAllMusic(0.1);
            this.playIntroMP3();
            this.activeTheme = 'intro';
            return;
        }
        
        this.stopAllMusic(0.1);
        console.log("Playing Intro Theme");
        this.activeTheme = 'intro';
        
        this.themes.intro = this._createMusicNodes(0.22); // Intro leggermente più forte
        if (!this.themes.intro) {
            console.error("Failed intro music nodes.");
            this.activeTheme = null;
            return;
        }
        
        this.themes.intro.isIntroMusic = true;
        
        try {
            // Reset gain per l'intro
            const now = this.context.currentTime;
            this.musicGainNode.gain.cancelScheduledValues(now);
            this.musicGainNode.gain.linearRampToValueAtTime(0.22, now + 0.1);

            const tempo = 100;
            const bPM = 4;
            const nPB = 4;
            const sPN = (60 / tempo) / nPB;
            const loopT = sPN * bPM * nPB * 4;
            
            const baseNote = 48;
            const fanfareMelody = [7, 11, 12, 9, 7, 12, 11, 7, 5, 9, 7, 0];
            const chords = [[48, 55, 60], [53, 60, 65], [55, 62, 67], [48, 55, 60]];
            const kickPattern = [1, 0, 0, 0, 1, 0, 1, 0];
            const snarePattern = [0, 0, 1, 0, 0, 0, 1, 0];
            
            let fanfareC = 0;
            let chordC = 0;
            
            const scheduleLoop = (lST) => {
                const nodes = this.themes.intro;
                
                if (!nodes || !nodes.isIntroMusic || this.activeTheme !== 'intro' || 
                    !this.context || this.context.state !== 'running' || window.introOver) {
                    this.stopAllMusic();
                    return;
                }
                
                const cT = this.context.currentTime;
                const nIL = bPM * nPB * 4;
                
                for (let i = 0; i < nIL; i++) {
                    const nT = lST + i * sPN;
                    if (nT < cT) continue;
                    
                    const currentStep = i % (bPM * nPB);
                    
                    if (i % 2 === 0) {
                        const melNoteIndex = fanfareMelody[fanfareC % fanfareMelody.length];
                        if (melNoteIndex !== 0) {
                            const melNoteMidi = baseNote + 12 + melNoteIndex;
                            const melFreq = 440 * Math.pow(2, (melNoteMidi - 69) / 12);
                            this.playMusicNote(nodes, 'sawtooth', melFreq, 0.45, nT, sPN * 1.8);
                            this.playMusicNote(nodes, 'square', melFreq * 0.995, 0.35, nT, sPN * 1.8);
                        }
                        fanfareC++;
                    }
                    
                    if (i % 8 === 0) {
                        const currentChord = chords[chordC % chords.length];
                        currentChord.forEach((note, idx) => {
                            const chordFreq = 440 * Math.pow(2, (note - 69) / 12);
                            this.playMusicNote(nodes, 'square', chordFreq, 0.3, nT, sPN * 7.5);
                        });
                        chordC++;
                    }
                    
                    const percStep = i % 8;
                    if (kickPattern[percStep] === 1) {
                        this._createFilteredNoise(0.15, 100, 5, 0.7, "lowpass", nT);
                    }
                    
                    if (snarePattern[percStep] === 1) {
                        this._createFilteredNoise(0.1, 1800, 12, 0.4, "bandpass", nT);
                        this._createFilteredNoise(0.1, 6000, 15, 0.2, "highpass", nT + 0.005);
                    }
                }
                
                const tUNL = (lST + loopT - cT) * 1000;
                
                nodes.scheduler = setTimeout(() => {
                    if (nodes) {
                        nodes.sources = nodes.sources.filter(s => s && s.stopTime > (this.context?.currentTime || 0));
                    }
                    scheduleLoop(lST + loopT);
                }, Math.max(100, tUNL));
            };
            
            scheduleLoop(this.context.currentTime + 0.05);
        } catch (e) {
            console.error("Error starting intro music:", e);
            this.stopAllMusic();
            this.activeTheme = null;
        }
    },

    playBackgroundMusic() {
        if (!this.context || this.context.state !== 'running' || !this.isInitialized || !this.musicGainNode) return;
        if (this.activeTheme === 'background') return;
        
        // Se abbiamo un file MP3 per il gameplay, usiamo quello invece
        if (this.audioFiles.gameplayMusic) {
            this.stopAllMusic(0.2);
            this.playGameplayMP3();
            this.activeTheme = 'background';
            return;
        }
        
        this.stopAllMusic(0.2);
        console.log("Playing Background Music");
        this.activeTheme = 'background';
        
        this.themes.background = this._createMusicNodes(0.15); // Volume normale
        if (!this.themes.background) {
            console.error("Failed background music nodes.");
            this.activeTheme = null;
            return;
        }
        
        this.themes.background.isBackgroundMusic = true;
        
        try {
            const now = this.context.currentTime;
            this.musicGainNode.gain.cancelScheduledValues(now);
            this.musicGainNode.gain.linearRampToValueAtTime(0.15, now + 0.2);

            const tempo = 110;
            const bPM = 4;
            const nPB = 2;
            const sPN = (60 / tempo) / nPB;
            const loopT = sPN * bPM * nPB * 2;
            
            const bassP = [45, 52, 43, 50, 36, 43, 41, 48];
            const arpP = [69, 72, 76, 72, 67, 71, 74, 71, 60, 64, 67, 64, 65, 69, 72, 69];
            
            let nC = 0;
            
            const scheduleLoop = (lST) => {
                const nodes = this.themes.background;
                
                if (!nodes || !nodes.isBackgroundMusic || this.activeTheme !== 'background' || 
                    !window.game?.running || window.game?.paused || !this.context || this.context.state !== 'running') {
                    this.stopAllMusic();
                    return;
                }
                
                const cT = this.context.currentTime;
                const nIL = bPM * nPB * 2;
                
                for (let i = 0; i < nIL; i++) {
                    const nT = lST + i * sPN;
                    if (nT < cT) continue;
                    
                    if (i % 2 === 0) {
                        const bI = Math.floor(i / 4) % (bassP.length / 2);
                        const bN = bassP[bI * 2];
                        if (bN > 0) {
                            const bF = 440 * Math.pow(2, (bN - 69) / 12);
                            this.playMusicNote(nodes, 'sawtooth', bF, 0.6, nT, sPN * 1.8);
                        }
                    }
                    
                    const aI = nC % arpP.length;
                    const aN = arpP[aI];
                    if (aN > 0) {
                        const aF = 440 * Math.pow(2, (aN - 69) / 12);
                        this.playMusicNote(nodes, 'triangle', aF, 0.5, nT, sPN * 1.2);
                    }
                    nC++;
                }
                
                const tUNL = (lST + loopT - cT) * 1000;
                
                nodes.scheduler = setTimeout(() => {
                    if (nodes) {
                        nodes.sources = nodes.sources.filter(s => s && s.stopTime > (this.context?.currentTime || 0));
                    }
                    scheduleLoop(lST + loopT);
                }, Math.max(100, tUNL));
            };
            
            scheduleLoop(this.context.currentTime + 0.05);
        } catch (e) {
            console.error("Error starting background music:", e);
            this.stopAllMusic();
            this.activeTheme = null;
        }
    },

    playBossBattleMusic() {
        if (!this.context || this.context.state !== 'running' || !this.isInitialized || !this.musicGainNode) return;
        if (this.activeTheme === 'boss') return;
        
        this.stopAllMusic(0.2);
        console.log("Playing Boss Music");
        this.activeTheme = 'boss';
        
        this.themes.boss = this._createMusicNodes(0.20); // Boss leggermente più forte
        if (!this.themes.boss) {
            console.error("Failed boss music nodes.");
            this.activeTheme = null;
            return;
        }
        
        this.themes.boss.isBossMusic = true;
        
        try {
            const now = this.context.currentTime;
            this.musicGainNode.gain.cancelScheduledValues(now);
            this.musicGainNode.gain.linearRampToValueAtTime(0.20, now + 0.2);

            const tempo = 135;
            const bPM = 4;
            const nPB = 2;
            const sPN = (60 / tempo) / nPB;
            const loopT = sPN * bPM * nPB * 2;
            
            const bassP = [36, 38, 39, 41, 43, 41, 39, 38];
            const arpP = [72, 75, 79, 75, 70, 74, 77, 74];
            
            let nC = 0;
            
            const scheduleLoop = (lST) => {
                const nodes = this.themes.boss;
                
                if (!nodes || !nodes.isBossMusic || this.activeTheme !== 'boss' || 
                    !window.game?.running || window.game?.paused || !window.game?.bossSpawned || 
                    window.game?.bossDefeated || !this.context || this.context.state !== 'running') {
                    this.stopAllMusic();
                    return;
                }
                
                const cT = this.context.currentTime;
                const nIL = bPM * nPB * 2;
                
                for (let i = 0; i < nIL; i++) {
                    const nT = lST + i * sPN;
                    if (nT < cT) continue;
                    
                    if (i % 2 === 0) {
                        const bI = Math.floor(i / 4) % (bassP.length / 2);
                        const bN = bassP[bI * 2];
                        if (bN > 0) {
                            const bF = 440 * Math.pow(2, (bN - 69) / 12);
                            this.playMusicNote(nodes, 'square', bF, 0.7, nT, sPN * 1.7);
                        }
                    }
                    
                    const aI = nC % arpP.length;
                    const aN = arpP[aI];
                    if (aN > 0) {
                        const aF = 440 * Math.pow(2, (aN - 69) / 12);
                        this.playMusicNote(nodes, 'sawtooth', aF, 0.45, nT, sPN * 0.9);
                    }
                    nC++;
                }
                
                const tUNL = (lST + loopT - cT) * 1000;
                
                nodes.scheduler = setTimeout(() => {
                    if (nodes) {
                        nodes.sources = nodes.sources.filter(s => s && s.stopTime > (this.context?.currentTime || 0));
                    }
                    scheduleLoop(lST + loopT);
                }, Math.max(100, tUNL));
            };
            
            scheduleLoop(this.context.currentTime + 0.05);
        } catch (e) {
            console.error("Error starting boss music:", e);
            this.stopAllMusic();
            this.activeTheme = null;
        }
    },

    playMusicNote(nodes, type, freq, gainVal, startTime, duration) {
        if (!this.context || !nodes || !nodes.gainNode || !isFinite(freq) || freq <= 0 || this.context.state !== "running") return;
        
        try {
            const osc = this.context.createOscillator();
            const gN = this.context.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            
            gN.gain.setValueAtTime(0, startTime);
            gN.gain.linearRampToValueAtTime(gainVal, startTime + duration * 0.1);
            gN.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gN);
            gN.connect(nodes.gainNode);
            
            osc.start(startTime);
            const stopTime = startTime + duration + 0.05;
            osc.stop(stopTime);
            osc.stopTime = stopTime; // Memorizza il momento in cui si fermerà per pulizia
            
            nodes.sources.push(osc);
        } catch (e) {
            console.warn("PlayMusicNote error:", e);
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
        if (!this.context || this.context.state !== 'running' || !this.isInitialized) return;
        
        console.log("Playing Epic Fanfare");
        
        // Creiamo un nodo dedicato alla fanfara con volume più alto
        const fanfareGain = this.context.createGain();
        fanfareGain.gain.setValueAtTime(0.3, this.context.currentTime);
        fanfareGain.connect(this.context.destination);
        
        const now = this.context.currentTime;
        
        // Sequenza fanfara con note più potenti e trionfali
        const tempo = 120; // Tempo più veloce
        const notes = [
            // Parte 1: Apertura drammatica
            { note: 'G4', duration: 0.25, delay: 0 },
            { note: 'C5', duration: 0.5, delay: 0.25 },
            { note: 'E5', duration: 0.25, delay: 0.75 },
            { note: 'G5', duration: 0.75, delay: 1 },
            
            // Parte 2: Motivo principale
            { note: 'C5', duration: 0.25, delay: 2 },
            { note: 'G4', duration: 0.25, delay: 2.25 },
            { note: 'C5', duration: 0.5, delay: 2.5 },
            { note: 'E5', duration: 0.5, delay: 3 },
            { note: 'G5', duration: 0.75, delay: 3.5 },
            
            // Parte 3: Finale trionfale
            { note: 'C6', duration: 0.25, delay: 4.5 },
            { note: 'G5', duration: 0.25, delay: 4.75 },
            { note: 'E5', duration: 0.25, delay: 5 },
            { note: 'C5', duration: 0.25, delay: 5.25 },
            { note: 'G5', duration: 0.25, delay: 5.5 },
            { note: 'C6', duration: 0.75, delay: 5.75 }
        ];
        
        // Mappa delle frequenze delle note musicali
        const noteFrequencies = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
            'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
            'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
            'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
            'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77, 'C6': 1046.50
        };
        
        // Suona ogni nota della sequenza
        notes.forEach(noteData => {
            const freq = noteFrequencies[noteData.note];
            if (!freq) return;
            
            // Oscillatore principale (suono melodico)
            const osc = this.context.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + noteData.delay);
            
            const oscGain = this.context.createGain();
            oscGain.gain.setValueAtTime(0, now + noteData.delay);
            oscGain.gain.linearRampToValueAtTime(0.5, now + noteData.delay + 0.05);
            oscGain.gain.linearRampToValueAtTime(0.3, now + noteData.delay + noteData.duration * 0.8);
            oscGain.gain.linearRampToValueAtTime(0, now + noteData.delay + noteData.duration);
            
            osc.connect(oscGain).connect(fanfareGain);
            osc.start(now + noteData.delay);
            osc.stop(now + noteData.delay + noteData.duration + 0.1);
            
            // Oscillatore secondario (rinforzo armonico)
            const osc2 = this.context.createOscillator();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(freq * 0.5, now + noteData.delay);
            
            const osc2Gain = this.context.createGain();
            osc2Gain.gain.setValueAtTime(0, now + noteData.delay);
            osc2Gain.gain.linearRampToValueAtTime(0.2, now + noteData.delay + 0.05);
            osc2Gain.gain.linearRampToValueAtTime(0, now + noteData.delay + noteData.duration);
            
            osc2.connect(osc2Gain).connect(fanfareGain);
            osc2.start(now + noteData.delay);
            osc2.stop(now + noteData.delay + noteData.duration + 0.1);
        });
        
        // Sezione percussiva per enfatizzare i momenti salienti
        const percussionTimes = [0, 1, 2, 3.5, 4.5, 5.75];
        
        percussionTimes.forEach(time => {
            // Suono percussivo (simile a timpani)
            const percOsc = this.context.createOscillator();
            percOsc.type = 'sine';
            percOsc.frequency.setValueAtTime(80, now + time);
            percOsc.frequency.exponentialRampToValueAtTime(60, now + time + 0.3);
            
            const percGain = this.context.createGain();
            percGain.gain.setValueAtTime(0, now + time);
            percGain.gain.linearRampToValueAtTime(0.4, now + time + 0.02);
            percGain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.3);
            
            percOsc.connect(percGain).connect(fanfareGain);
            percOsc.start(now + time);
            percOsc.stop(now + time + 0.4);
            
            // Rumore percussivo (simile a cassa)
            if (time === 0 || time === 2 || time === 4.5) {
                this._createFilteredNoise(0.2, 200, 5, 0.3, "lowpass", now + time);
            }
        });
        
        // Pulizia - scolleghiamo la fanfara dopo che è finita
        setTimeout(() => {
            try {
                if (fanfareGain) {
                    fanfareGain.disconnect();
                }
            } catch (e) {
                console.warn("Error disconnecting fanfare", e);
            }
        }, 7000); // 7 secondi è più che sufficiente per l'intera fanfara
    }
};

// Esponi AudioSystem globalmente
window.AudioSystem = AudioSystem;