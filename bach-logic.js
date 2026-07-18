/**
 * NEXUS VOCAL V7 - COACH BACH AI & UI BINDING
 * Lógica CVT e Feedback Biomecânico
 */

const uiPitch = document.getElementById('pitchVal');
const uiVol = document.getElementById('volVal');
const domMask = document.getElementById('mask');
const domLarynx = document.getElementById('larynx');
const domDiaphragm = document.getElementById('diaphragm');
const chatBox = document.getElementById('bachChat');

let currentMode = 'NEUTRAL';
let lastFeedbackTime = 0;

// Sistema de Chat do Bach
function postBachMessage(msg, isError = false) {
    const div = document.createElement('div');
    div.className = 'bach-msg';
    div.innerHTML = `<span>[BACH]:</span> ${msg}`;
    if (isError) div.style.color = 'var(--red)';
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
}

function setMode(mode) {
    currentMode = mode;
    postBachMessage(`Modo alterado para: <span>${mode}</span>. Concentre-se na técnica.`);
}

// Escuta os dados do motor de áudio (60 vezes por segundo)
window.addEventListener('nexusDataUpdate', (e) => {
    const { pitch, volume, db } = e.detail;
    const now = Date.now();

    // 1. Atualiza HUD
    if (volume > 0.01) {
        uiPitch.innerText = pitch.toFixed(1);
        uiVol.innerText = db.toFixed(1);
    } else {
        uiPitch.innerText = "--";
        uiVol.innerText = "--";
    }

    // 2. Análise Biomecânica e SVG
    // Zera todas as zonas
    domMask.classList.remove('active');
    domLarynx.classList.remove('active');
    domDiaphragm.classList.remove('active');

    if (volume > 0.02) { // Cantando/Ativo
        domDiaphragm.classList.add('active'); // Apoio sempre ativo ao emitir som

        // Lógica de Ressonância (Simplificada baseada em Frequência/Volume)
        if (pitch > 400 || currentMode === 'NAY' || currentMode === 'BELTING') {
            domMask.classList.add('active'); // Notas altas ou modos metálicos ativam máscara
        }
        
        if (volume > 0.15 || currentMode === 'OVERDRIVE') {
            domLarynx.classList.add('active'); // Volume alto ativa drive/laringe
        }

        // 3. Sistema de Feedback de IA do Bach (Throttle de 3 segundos para não espamar)
        if (now - lastFeedbackTime > 3000) {
            evaluateCVT(pitch, volume, db);
            lastFeedbackTime = now;
        }
    }
});

// Cérebro CVT do Sebastian Bach
function evaluateCVT(pitch, volume, db) {
    if (currentMode === 'SSS') {
        if (volume < 0.05) postBachMessage("Mantenha o fluxo de ar constante no SSS. Sinta o diafragma expandir!");
        else postBachMessage("Boa pressão no SSS. Esse é o seu apoio para os agudos.");
    } 
    else if (currentMode === 'NAY') {
        if (pitch < 200) postBachMessage("O NAY precisa rasgar na máscara. Suba o pitch e sinta o nariz vibrar!");
        else postBachMessage("Aí sim! Ressonância focalizada, twang ativado. Segura essa colocação.");
    }
    else if (currentMode === 'BELTING') {
        if (db < -15) postBachMessage("Belting exige energia e apoio metálico! Joga esse som pra frente!");
        else postBachMessage("Drive perfeito. Cuidado com a tensão no pescoço, o poder vem do plexo.");
    }
}
