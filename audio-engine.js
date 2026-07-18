/**
 * NEXUS VOCAL V7 - AUDIO CORE DSP
 * Engenharia de Captação e Análise Espectral
 */

let audioCtx, analyser, microphone, pcmData;
let isAudioActive = false;
let currentPitch = 0;
let currentVolume = 0;

// Configuração do Web Audio API
async function initAudioEngine() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } });
        
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048; // Alta resolução espectral
        
        microphone = audioCtx.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        pcmData = new Float32Array(analyser.fftSize);
        isAudioActive = true;
        
        document.getElementById('startBtn').style.display = 'none';
        postBachMessage("Microfone ativado! Captando ressonância. Vamos trabalhar essa voz, rockstar!");
        
        audioLoop(); // Inicia o loop de análise
    } catch (err) {
        postBachMessage("ERRO: Permissão de microfone negada. O sistema precisa do áudio para operar.", true);
        console.error(err);
    }
}

// Algoritmo de Autocorrelação para detecção precisa de Pitch (f0)
function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Som ambiente ignorado

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;
    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    let T0 = maxpos;
    return sampleRate / T0;
}

// Loop de renderização sincronizado com a tela (60fps)
function audioLoop() {
    if (!isAudioActive) return;
    
    analyser.getFloatTimeDomainData(pcmData);
    
    // Cálculo do Volume (dB aproximado)
    let sumSquares = 0.0;
    for (const amplitude of pcmData) { sumSquares += amplitude * amplitude; }
    currentVolume = Math.sqrt(sumSquares / pcmData.length);
    let db = 20 * Math.log10(currentVolume);
    
    // Cálculo do Pitch
    let pitch = autoCorrelate(pcmData, audioCtx.sampleRate);
    if (pitch !== -1) currentPitch = pitch;

    // Dispara evento para o Coach Bach processar os dados
    window.dispatchEvent(new CustomEvent('nexusDataUpdate', { 
        detail: { pitch: currentPitch, volume: currentVolume, db: db }
    }));

    requestAnimationFrame(audioLoop);
}

document.getElementById('startBtn').addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    initAudioEngine();
});
