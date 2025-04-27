/**
 * CONDORSPACE - TEAM PARALLAX
 * Registrazione Cadetto - versione JavaScript vaniglia del componente React
 * Versione aggiornata con supporto audio
 */

// Renderizza la schermata di registrazione cadetto
function renderCadetRegistration() {
    console.log("Rendering cadet registration UI...");
    const container = document.getElementById('cadetRegistrationContainer');
    if (!container) {
        console.error("Container registrazione cadetto non trovato");
        return;
    }
    
    let cadetName = '';
    let isSubmitting = false;
    
    // Crea la struttura HTML - Rimosso l'input duplicato nel canvas
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; background: #0f0f1e; padding: 20px; border-radius: 10px;">
            <canvas id="cadetCanvas" width="600" height="500" style="margin-bottom: 20px;"></canvas>
            
            <div style="display: flex; align-items: center; width: 80%; margin-bottom: 20px;">
                <input
                    type="text" 
                    id="cadetNameInput"
                    placeholder="Inserisci il tuo nome, Cadetto"
                    style="flex: 1; padding: 10px; background: #0a0a2a; color: #49daff; border: 2px solid #49daff; border-radius: 4px; font-size: 16px; font-family: monospace;"
                    maxlength="10"
                    minlength="3"
                />
                <button
                    id="submitCadetButton"
                    style="margin-left: 10px; padding: 10px 20px; background: #49daff; color: #000; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;"
                >
                    CONFERMA
                </button>
            </div>
            
            <p style="color: #bbb; font-size: 14px; text-align: center;">
                Preparati a difendere la Terra a bordo del Raptor-X.<br/>
                Il tuo nome sarà visualizzato sulla plancia di controllo durante la missione.
            </p>
        </div>
    `;
    
    // Disegna il canvas
    drawCadetRegistrationCanvas();
    
    // Gestori eventi
    const cadetNameInput = document.getElementById('cadetNameInput');
    const submitCadetButton = document.getElementById('submitCadetButton');
    
    if (!cadetNameInput || !submitCadetButton) {
        console.error("Elementi input nome o bottone conferma non trovati");
        return;
    }
    
    cadetNameInput.addEventListener('input', function(e) {
        cadetName = e.target.value;
        updateSubmitButtonState();
    });
    
    cadetNameInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' && !isSubmitting && cadetName.length >= 3) {
            handleCadetSubmit();
        }
    });
    
    submitCadetButton.addEventListener('click', function() {
        // Riproduci il suono del pulsante
        if (window.AudioSystem && typeof window.AudioSystem.playButtonSound === 'function') {
            window.AudioSystem.playButtonSound();
        }
        
        handleCadetSubmit();
    });
    
    function updateSubmitButtonState() {
        if (isSubmitting) {
            submitCadetButton.disabled = true;
            submitCadetButton.textContent = 'REGISTRAZIONE...';
            submitCadetButton.style.background = '#274b5d';
            submitCadetButton.style.color = '#aaa';
            submitCadetButton.style.cursor = 'wait';
        } else if (cadetName.length < 3) {
            submitCadetButton.disabled = true;
            submitCadetButton.textContent = 'CONFERMA';
            submitCadetButton.style.background = '#274b5d';
            submitCadetButton.style.color = '#aaa';
            submitCadetButton.style.cursor = 'not-allowed';
        } else {
            submitCadetButton.disabled = false;
            submitCadetButton.textContent = 'CONFERMA';
            submitCadetButton.style.background = '#49daff';
            submitCadetButton.style.color = '#000';
            submitCadetButton.style.cursor = 'pointer';
        }
    }
    
    function handleCadetSubmit() {
        if (cadetName.length < 3 || isSubmitting) return;
        
        console.log("Submitting cadet registration:", cadetName);
        isSubmitting = true;
        updateSubmitButtonState();
        
        // Effetto sonoro di registrazione
        if (window.AudioSystem && window.AudioSystem.play) {
            window.AudioSystem.play('gameStart');
        }
        
        // Effetto di registrazione con timeout per dare l'idea di un processo
        setTimeout(() => {
            isSubmitting = false;
            updateSubmitButtonState();
            
            // Passa il nome al gioco
            if (typeof window.completeCadetRegistration === 'function') {
                window.completeCadetRegistration(cadetName);
            } else {
                console.error("completeCadetRegistration function not found");
                // Fallback: nascondi manualmente la schermata
                const cadetRegistrationScreen = document.getElementById('cadetRegistrationScreen');
                if (cadetRegistrationScreen) {
                    cadetRegistrationScreen.classList.remove('active');
                }
                
                const mainLayout = document.getElementById('mainLayout');
                if (mainLayout) {
                    mainLayout.classList.add('visible');
                }
                
                // Mostra il pulsante di inizio
                const startButton = document.getElementById('startButton');
                if (startButton) {
                    startButton.style.display = 'block';
                    startButton.disabled = false;
                }
            }
        }, 1000);
    }
    
    // Aggiorna lo stato iniziale del pulsante
    updateSubmitButtonState();
    
    // Focus sull'input
    setTimeout(() => {
        if (cadetNameInput) {
            cadetNameInput.focus();
        }
    }, 100);
}

// Disegna il canvas con l'interfaccia di registrazione
function drawCadetRegistrationCanvas() {
    const canvas = document.getElementById('cadetCanvas');
    if (!canvas) {
        console.error("Cadet canvas not found");
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Sfondo spaziale
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0c1445');
    bgGradient.addColorStop(1, '#0a0a20');
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Aggiungiamo qualche stella in background
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.5;
        const opacity = Math.random() * 0.8 + 0.2;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
    }
    
    // Cornice terminal con glow
    ctx.strokeStyle = '#49daff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#49daff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.shadowBlur = 0;
    
    // Effetto angoli
    ctx.lineWidth = 5;
    const cornerSize = 20;
    
    // Angolo in alto a sinistra
    ctx.beginPath();
    ctx.moveTo(20, 40);
    ctx.lineTo(20, 20);
    ctx.lineTo(40, 20);
    ctx.stroke();
    
    // Angolo in alto a destra
    ctx.beginPath();
    ctx.moveTo(width - 40, 20);
    ctx.lineTo(width - 20, 20);
    ctx.lineTo(width - 20, 40);
    ctx.stroke();
    
    // Angolo in basso a sinistra
    ctx.beginPath();
    ctx.moveTo(20, height - 40);
    ctx.lineTo(20, height - 20);
    ctx.lineTo(40, height - 20);
    ctx.stroke();
    
    // Angolo in basso a destra
    ctx.beginPath();
    ctx.moveTo(width - 40, height - 20);
    ctx.lineTo(width - 20, height - 20);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();
    
    // Titolo
    ctx.shadowColor = '#49daff';
    ctx.shadowBlur = 5;
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#49daff';
    ctx.textAlign = 'center';
    ctx.fillText('COMANDO GALATTICO', width / 2, 60);
    ctx.fillText('REGISTRAZIONE CADETTO', width / 2, 90);
    ctx.shadowBlur = 0;
    
    // Disegniamo l'astronave Raptor-X invece del mirino
    const centerX = width / 2;
    const centerY = 150;
    
    // Corpo principale dell'astronave
    ctx.fillStyle = '#2a4b8d';
    ctx.strokeStyle = '#49daff';
    ctx.lineWidth = 2;
    
    // Corpo triangolare dell'astronave
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 35);
    ctx.lineTo(centerX - 25, centerY + 25);
    ctx.lineTo(centerX + 25, centerY + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Ali laterali
    ctx.beginPath();
    ctx.moveTo(centerX - 25, centerY + 10);
    ctx.lineTo(centerX - 45, centerY + 30);
    ctx.lineTo(centerX - 25, centerY + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 25, centerY + 10);
    ctx.lineTo(centerX + 45, centerY + 30);
    ctx.lineTo(centerX + 25, centerY + 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Cabina
    ctx.shadowColor = '#49daff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 25);
    ctx.lineTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.closePath();
    ctx.fillStyle = '#6ab7ff';
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Propulsori
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY + 25);
    ctx.lineTo(centerX - 10, centerY + 40);
    ctx.lineTo(centerX, centerY + 25);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(centerX + 15, centerY + 25);
    ctx.lineTo(centerX + 10, centerY + 40);
    ctx.lineTo(centerX, centerY + 25);
    ctx.closePath();
    ctx.fill();
    
    // Effetto luminoso attorno all'astronave
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(centerX, centerY, 25, centerX, centerY, 70);
    gradient.addColorStop(0, 'rgba(73, 218, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(73, 218, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
    ctx.fill();
    
    // Testo della registrazione
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('ORDINE DELL\'AMMIRAGLIO CONDOR:', 50, 240);
    ctx.fillText('In qualità di cadetto della Flotta del Demand Galattico, sei stato', 50, 265);
    ctx.fillText('selezionato per pilotare il Raptor-X nella missione contro', 50, 290);
    ctx.fillText('l\'invasione Nethexiana guidata dal Comandante Scuderi.', 50, 315);
    
    ctx.fillStyle = '#49daff';
    ctx.fillText('INSERIRE IL NOME DEL CADETTO PER CONTINUARE:', 50, 350);
    
    // Stato del sistema
    ctx.fillStyle = '#66ff66';
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Monospace';
    ctx.fillText('SISTEMA: ONLINE', 50, height - 50);
    ctx.fillText('RAPTOR-X: ARMATO E PRONTO', 50, height - 30);
    
    // Firma dell'Ammiraglio Condor
    ctx.fillStyle = '#ffcc44';
    ctx.textAlign = 'right';
    ctx.font = 'italic 14px Arial';
    ctx.fillText('Amm. Condor', width - 50, height - 40);
}

// Esporta funzione globalmente
window.renderCadetRegistration = renderCadetRegistration;
window.drawCadetRegistrationCanvas = drawCadetRegistrationCanvas;