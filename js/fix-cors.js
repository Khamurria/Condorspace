/**
 * CONDORSPACE - TEAM PARALLAX
 * Fix per problemi CORS con file MP3 e sincronizzazioni audio
 */

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

// CORS fallback per file audio - se necessario il cross-origin
(function() {
    // Crea un proxy per i metodi Audio
    const originalAudio = window.Audio;
    window.Audio = function(src) {
        const audio = new originalAudio(src);
        
        // Gestisci eventuali errori di caricamento
        audio.addEventListener('error', function(e) {
            console.warn('Audio load error:', e);
            
            // Puoi implementare qui un fallback per caricare l'audio in modo diverso
            // Es. usando XMLHttpRequest + AudioContext invece di tag Audio
        });
        
        return audio;
    };
    
    // Traccia la riproduzione dell'audio
    const originalPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function() {
        const src = this.src || 'unknown';
        console.log('Playing audio:', src);
        
        // Chiamata originale con gestione promessa
        return originalPlay.call(this).catch(error => {
            console.warn(`Audio play error (${src}):`, error);
            // Rigenera l'evento per consentire la gestione dell'errore
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
    
    // Inizializzazione sistema audio e UI
    const audioSystemReadyEvent = new CustomEvent('audioSystemReady');
    
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
    
    // Sovrascrive funzioni critiche per la sincronizzazione audio/video
    const originalStartGame = window.startGame;
    window.startGame = function(restart) {
        // Ferma la musica dell'intro e avvia quella di gameplay
        if (window.AudioSystem) {
            // Ferma qualsiasi musica precedente
            if (typeof window.AudioSystem.stopAllMP3Music === 'function') {
                window.AudioSystem.stopAllMP3Music(500);
            } else if (typeof window.AudioSystem.stopAllMusic === 'function') {
                window.AudioSystem.stopAllMusic(0.5);
            }
            
            // Avvia la musica di gameplay dopo un breve delay
            setTimeout(() => {
                if (typeof window.AudioSystem.playGameplayMP3 === 'function') {
                    window.AudioSystem.playGameplayMP3();
                } else if (typeof window.AudioSystem.playBackgroundMusic === 'function') {
                    window.AudioSystem.playBackgroundMusic();
                }
            }, 600);
        }
        
        // Riproduci suono di avvio gioco
        if (window.AudioSystem && typeof window.AudioSystem.playGameStartSound === 'function') {
            window.AudioSystem.playGameStartSound();
        }
        
        // Chiama la funzione originale
        if (typeof originalStartGame === 'function') {
            originalStartGame(restart);
        } else {
            console.error("Original startGame function not found");
        }
    };
    
    // Codice per debug audio
    window.debugAudio = function() {
        if (!window.AudioSystem) {
            console.error("AudioSystem not available");
            return;
        }
        
        // Verifica quali file audio sono disponibili
        const audioFiles = window.AudioSystem.audioFiles || {};
        console.group("Audio Files Status");
        for (const [key, path] of Object.entries(audioFiles)) {
            fetch(path, { method: 'HEAD' })
                .then(response => {
                    console.log(`${key}: ${path} - ${response.ok ? 'OK' : 'NOT FOUND'}`);
                })
                .catch(error => {
                    console.error(`${key}: ${path} - ERROR`, error);
                });
        }
        console.groupEnd();
        
        // Test dei suoni principali
        console.log("Testing main sound methods...");
        const methods = [
            'playLogoMusic', 'playIntroMP3', 'playGameplayMP3', 
            'playButtonSound', 'playGameStartSound', 'playEpicFanfare'
        ];
        
        methods.forEach(method => {
            console.log(`Method ${method} is ${typeof window.AudioSystem[method] === 'function' ? 'available' : 'NOT FOUND'}`);
        });
        
        return "Audio debug complete. See console for details.";
    };
    
    // Verifica lo stato dell'audio dopo 2 secondi
    setTimeout(() => {
        if (window.AudioSystem && window.AudioSystem.isInitialized) {
            document.dispatchEvent(audioSystemReadyEvent);
        } else {
            console.warn("AudioSystem not initialized after timeout");
        }
    }, 2000);
});
