/**
 * Carica e riproduce un brano MP3 usando l'elemento audio HTML5
 * Versione aggiornata che evita errori CORS in contesto file://
 * @param {string} id - Identificatore del brano
 * @param {string} url - URL del file audio
 * @param {number} volume - Volume della musica (0.0 - 1.0)
 * @param {boolean} loop - Se la musica deve essere riprodotta in loop
 */
playMP3Music(id, url, volume = 0.5, loop = true) {
    // Verifica se siamo in un contesto file:// (locale)
    const isLocalFile = window.location.protocol === 'file:';
    
    if (isLocalFile) {
        // In contesto file:// proviamo a caricare direttamente senza fetch
        console.log(`Trying to load MP3 directly in file:// context: ${url}`);
        
        try {
            // Ferma qualsiasi altro brano musicale
            this.stopAllMP3Music();
            
            // Crea un nuovo elemento audio
            const audioElement = new Audio(url);
            audioElement.volume = volume;
            audioElement.loop = loop;
            
            // Aggiungi gestori eventi per tracciare successo/errore
            audioElement.addEventListener('error', (error) => {
                console.warn(`Error loading audio file ${url}:`, error);
                // Non memorizzare l'elemento in caso di errore
                if (this.musicElements[id] === audioElement) {
                    delete this.musicElements[id];
                }
            });
            
            audioElement.addEventListener('canplaythrough', () => {
                console.log(`Audio file loaded successfully: ${url}`);
            });
            
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
        } catch (error) {
            console.error("Error trying to play audio file directly:", error);
        }
    } else {
        // In contesto http:// usiamo fetch per verificare l'esistenza
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
    }
}