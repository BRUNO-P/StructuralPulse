// Canvas Contexts
const beamCanvas = document.getElementById('beamCanvas');
const sfdCanvas = document.getElementById('sfdCanvas');
const bmdCanvas = document.getElementById('bmdCanvas');

const ctxBeam = beamCanvas.getContext('2d');
const ctxSFD = sfdCanvas.getContext('2d');
const ctxBMD = bmdCanvas.getContext('2d');

// Input Controls
const spanSlider = document.getElementById('spanSlider');
const spanNum = document.getElementById('spanNum');
const loadTypeSelect = document.getElementById('loadTypeSelect');
const udlSlider = document.getElementById('udlSlider');
const udlNum = document.getElementById('udlNum');
const pointSlider = document.getElementById('pointSlider');
const pointNum = document.getElementById('pointNum');
const posSlider = document.getElementById('posSlider');
const posNum = document.getElementById('posNum');

const elasticNum = document.getElementById('elasticNum');
const inertiaNum = document.getElementById('inertiaNum');

const udlGroup = document.getElementById('udlGroup');
const pointLoadGroup = document.getElementById('pointLoadGroup');
const loadPosGroup = document.getElementById('loadPosGroup');

const resultsGrid = document.getElementById('resultsGrid');
const calcSteps = document.getElementById('calcSteps');
const toggleStepsBtn = document.getElementById('toggleStepsBtn');
const screenshotBtn = document.getElementById('screenshotBtn');

// State Variables
let beamType = 'ss'; // 'ss', 'cantilever', 'fixed'
let stepsVisible = true;

// --- TWO-WAY BINDING HELPERS ---
function bindPair(slider, numInput, callback) {
    slider.addEventListener('input', () => {
        numInput.value = parseFloat(slider.value).toFixed(1);
        callback();
    });
    numInput.addEventListener('input', () => {
        slider.value = numInput.value;
        callback();
    });
}

bindPair(spanSlider, spanNum, updateAnalyzer);
bindPair(udlSlider, udlNum, updateAnalyzer);
bindPair(pointSlider, pointNum, updateAnalyzer);
bindPair(posSlider, posNum, updateAnalyzer);

elasticNum.addEventListener('input', updateAnalyzer);
inertiaNum.addEventListener('input', updateAnalyzer);

// --- BEAM TYPE CARDS SELECTOR ---
document.querySelectorAll('.scheme-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.scheme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        beamType = card.dataset.beam;
        updateAnalyzer();
    });
});

// --- LOADING TYPE TOGGLE ---
loadTypeSelect.addEventListener('change', () => {
    const isUDL = loadTypeSelect.value === 'udl';
    udlGroup.style.display = isUDL ? 'block' : 'none';
    pointLoadGroup.style.display = isUDL ? 'none' : 'block';
    loadPosGroup.style.display = isUDL ? 'none' : 'block';
    updateAnalyzer();
});

toggleStepsBtn.addEventListener('click', () => {
    stepsVisible = !stepsVisible;
    calcSteps.style.display = stepsVisible ? 'block' : 'none';
    toggleStepsBtn.textContent = stepsVisible ? 'Hide the steps' : 'Show the steps';
});

screenshotBtn.addEventListener('click', () => { window.print(); });

// --- MAIN ANALYZER ENGINE ---
function updateAnalyzer() {
    const L = parseFloat(spanNum.value) || 6.0;
    const w = parseFloat(udlNum.value) || 0;
    const P = parseFloat(pointNum.value) || 0;
    let a = parseFloat(posNum.value) || (L / 2);

    if (a > L) { a = L; posNum.value = L; posSlider.value = L; }
    posSlider.max = L;

    const E_GPa = parseFloat(elasticNum.value) || 210;
    const I_cm4 = parseFloat(inertiaNum.value) || 8690;

    // Convert E and I to SI (N, m)
    const E = E_GPa * 1e9; // Pa
    const I = I_cm4 * 1e-8; // m4
    const EI = E * I; // N·m2

    let Ra = 0, Rb = 0, Ma = 0, Mb = 0;
    let maxV = 0, maxM = 0, maxDelta = 0;
    let stepsText = "";

    const isUDL = loadTypeSelect.value === 'udl';

    if (beamType === 'ss') {
        if (isUDL) {
            Ra = (w * L) / 2;
            Rb = Ra;
            maxV = Ra;
            maxM = (w * Math.pow(L, 2)) / 8;
            maxDelta = (5 * (w * 1000) * Math.pow(L, 4)) / (384 * EI) * 1000; // mm

            stepsText = `Simply Supported Beam with UDL (w = ${w} kN/m, L = ${L} m):

1. Support Reactions:
   R_A = R_B = (w × L) / 2 = (${w} × ${L}) / 2 = ${Ra.toFixed(2)} kN

2. Shear Force Equation V(x):
   V(x) = R_A - w × x
   V_max = ${maxV.toFixed(2)} kN (at supports x = 0 and x = L)

3. Bending Moment Equation M(x):
   M(x) = R_A × x - (w × x²) / 2
   M_max = (w × L²) / 8 = (${w} × ${L}²) / 8 = ${maxM.toFixed(2)} kNm (at midspan x = ${L/2} m)

4. Maximum Deflection δ_max:
   δ_max = (5 × w × L⁴) / (384 × E × I)
         = (5 × ${w*1000} × ${L}⁴) / (384 × ${(E/1e9).toFixed(0)}×10⁹ × ${(I*1e8).toFixed(0)}×10⁻⁸)
         = ${maxDelta.toFixed(2)} mm (at midspan x = ${L/2} m)`;
        } else {
            const b_dist = L - a;
            Ra = (P * b_dist) / L;
            Rb = (P * a) / L;
            maxV = Math.max(Ra, Rb);
            maxM = (P * a * b_dist) / L;

            if (a === L / 2) {
                maxDelta = ((P * 1000) * Math.pow(L, 3)) / (48 * EI) * 1000;
            } else {
                maxDelta = ((P * 1000) * a * b_dist * (L + a)) / (9 * Math.sqrt(3) * EI * L) * 1000;
            }

            stepsText = `Simply Supported Beam with Point Load (P = ${P} kN at a = ${a} m, L = ${L} m):

1. Support Reactions:
   R_A = (P × b) / L = (${P} × ${b_dist.toFixed(2)}) / ${L} = ${Ra.toFixed(2)} kN
   R_B = (P × a) / L = (${P} × ${a}) / ${L} = ${Rb.toFixed(2)} kN

2. Shear Force V(x):
   V = +${Ra.toFixed(2)} kN (for 0 ≤ x < ${a} m)
   V = -${Rb.toFixed(2)} kN (for ${a} m < x ≤ ${L} m)

3. Maximum Bending Moment M_max:
   M_max = (P × a × b) / L = (${P} × ${a} × ${b_dist.toFixed(2)}) / ${L} = ${maxM.toFixed(2)} kNm (under point load at x = ${a} m)

4. Deflection δ_max:
   δ_max = ${maxDelta.toFixed(2)} mm`;
        }
    } else if (beamType === 'cantilever') {
        if (isUDL) {
            Ra = w * L;
            Ma = (w * Math.pow(L, 2)) / 2;
            maxV = Ra;
            maxM = Ma;
            maxDelta = ((w * 1000) * Math.pow(L, 4)) / (8 * EI) * 1000;

            stepsText = `Cantilever Beam Fixed at Left Support A with UDL (w = ${w} kN/m, L = ${L} m):

1. Support Reactions at Fixed End A:
   R_A = w × L = ${w} × ${L} = ${Ra.toFixed(2)} kN
   M_A = (w × L²) / 2 = (${w} × ${L}²) / 2 = ${Ma.toFixed(2)} kNm

2. Shear Force & Bending Moment:
   V_max = ${maxV.toFixed(2)} kN at fixed support
   M_max = ${maxM.toFixed(2)} kNm (hogging moment at fixed support)

3. Maximum Deflection δ_max (at free end B):
   δ_max = (w × L⁴) / (8 × E × I) = ${maxDelta.toFixed(2)} mm`;
        } else {
            Ra = P;
            Ma = P * a;
            maxV = P;
            maxM = Ma;
            maxDelta = ((P * 1000) * Math.pow(a, 2) * (3 * L - a)) / (6 * EI) * 1000;

            stepsText = `Cantilever Beam Fixed at Left Support A with Point Load (P = ${P} kN at a = ${a} m):

1. Reactions at Fixed End A:
   R_A = ${Ra.toFixed(2)} kN
   M_A = P × a = ${P} × ${a} = ${Ma.toFixed(2)} kNm

2. Maximum Deflection δ_max:
   δ_max = [P × a² × (3L - a)] / (6 × E × I) = ${maxDelta.toFixed(2)} mm`;
        }
    } else if (beamType === 'fixed') {
        if (isUDL) {
            Ra = (w * L) / 2;
            Rb = Ra;
            Ma = (w * Math.pow(L, 2)) / 12;
            Mb = Ma;
            maxV = Ra;
            maxM = Ma; // Fixed end moment governs
            maxDelta = ((w * 1000) * Math.pow(L, 4)) / (384 * EI) * 1000;

            stepsText = `Fixed - Fixed Beam with UDL (w = ${w} kN/m, L = ${L} m):

1. Reactions & Fixed End Moments:
   R_A = R_B = (w × L) / 2 = ${Ra.toFixed(2)} kN
   M_A = M_B = (w × L²) / 12 = (${w} × ${L}²) / 12 = ${Ma.toFixed(2)} kNm (fixed end hogging)
   M_center = (w × L²) / 24 = ${((w * Math.pow(L,2))/24).toFixed(2)} kNm (midspan sagging)

2. Maximum Deflection δ_max (at midspan):
   δ_max = (w × L⁴) / (384 × E × I) = ${maxDelta.toFixed(2)} mm`;
        } else {
            const b_dist = L - a;
            Ra = ((P * Math.pow(b_dist, 2)) * (3 * a + b_dist)) / Math.pow(L, 3);
            Rb = P - Ra;
            Ma = ((P * a * Math.pow(b_dist, 2)) / Math.pow(L, 2));
            Mb = ((P * Math.pow(a, 2) * b_dist) / Math.pow(L, 2));
            maxV = Math.max(Ra, Rb);
            maxM = Math.max(Ma, Mb);
            maxDelta = ((2 * (P * 1000) * Math.pow(a, 3) * Math.pow(b_dist, 3)) / (3 * EI * Math.pow(L, 3))) * 1000;

            stepsText = `Fixed - Fixed Beam with Concentrated Load P = ${P} kN:

1. Fixed End Moments:
   M_A = (P × a × b²) / L² = ${Ma.toFixed(2)} kNm
   M_B = (P × a² × b) / L² = ${Mb.toFixed(2)} kNm

2. Support Vertical Reactions:
   R_A = ${Ra.toFixed(2)} kN | R_B = ${Rb.toFixed(2)} kN

3. Maximum Deflection δ_max:
   δ_max = ${maxDelta.toFixed(2)} mm`;
        }
    }

    // Render Cards
    const cards = [
        { label: 'Reaction R_A', val: `${Ra.toFixed(2)} kN` },
        { label: 'Reaction R_B', val: `${beamType === 'cantilever' ? '0.00' : Rb.toFixed(2)} kN` },
        { label: 'Max Shear Force (V_max)', val: `${maxV.toFixed(2)} kN`, highlight: true },
        { label: 'Max Bending Moment (M_max)', val: `${maxM.toFixed(2)} kNm`, highlight: true },
        { label: 'Max Deflection (δ_max)', val: `${maxDelta.toFixed(2)} mm` }
    ];

    renderCards(cards);
    calcSteps.textContent = stepsText.trim();

    drawBeamSchematic(L, w, P, a, isUDL);
    drawSFD(L, Ra, Rb, w, P, a, isUDL);
    drawBMD(L, Ra, Rb, Ma, Mb, w, P, a, isUDL);
}

function renderCards(cards) {
    resultsGrid.innerHTML = '';
    cards.forEach(c => {
        const div = document.createElement('div');
        div.className = `result-card ${c.highlight ? 'highlight' : ''}`;
        div.innerHTML = `<span class="result-label">${c.label}</span><span class="result-value">${c.val}</span>`;
        resultsGrid.appendChild(div);
    });
}

// --- DRAWING SCHEMATIC & DIAGRAMS ---
function drawBeamSchematic(L, w, P, a, isUDL) {
    ctxBeam.clearRect(0, 0, beamCanvas.width, beamCanvas.height);
    const startX = 50, endX = beamCanvas.width - 50, y = 75;
    const lenPx = endX - startX;

    // Draw Beam Axis
    ctxBeam.strokeStyle = '#0f172a';
    ctxBeam.lineWidth = 6;
    ctxBeam.beginPath(); ctx.moveTo = ctxBeam.moveTo(startX, y); ctxBeam.lineTo(endX, y); ctxBeam.stroke();

    // Supports
    ctxBeam.lineWidth = 2;
    ctxBeam.fillStyle = '#0f172a';

    if (beamType === 'ss') {
        // Pin at A
        ctxBeam.beginPath(); ctxBeam.moveTo(startX, y); ctxBeam.lineTo(startX - 10, y + 18); ctxBeam.lineTo(startX + 10, y + 18); ctxBeam.closePath(); ctxBeam.stroke();
        // Roller at B
        ctxBeam.beginPath(); ctxBeam.arc(endX, y + 10, 8, 0, Math.PI * 2); ctxBeam.stroke();
    } else if (beamType === 'cantilever' || beamType === 'fixed') {
        // Fixed wall at A
        ctxBeam.fillRect(startX - 12, y - 25, 12, 50);
        if (beamType === 'fixed') ctxBeam.fillRect(endX, y - 25, 12, 50);
        else {
            ctxBeam.beginPath(); ctxBeam.arc(endX, y + 10, 8, 0, Math.PI * 2); ctxBeam.stroke();
        }
    }

    // Loads Rendering
    ctxBeam.strokeStyle = '#e11d48';
    ctxBeam.fillStyle = '#e11d48';

    if (isUDL) {
        ctxBeam.lineWidth = 1.5;
        for (let x = startX; x <= endX; x += 15) {
            ctxBeam.beginPath(); ctxBeam.moveTo(x, y - 30); ctxBeam.lineTo(x, y - 4); ctxBeam.stroke();
            ctxBeam.beginPath(); ctxBeam.arc(x, y - 4, 3, 0, Math.PI * 2); ctxBeam.fill();
        }
        ctxBeam.beginPath(); ctxBeam.moveTo(startX, y - 30); ctxBeam.lineTo(endX, y - 30); ctxBeam.stroke();
        ctxBeam.font = 'bold 11px sans-serif';
        ctxBeam.fillText(`w = ${w} kN/m`, startX + lenPx / 2 - 25, y - 36);
    } else {
        const px = startX + (a / L) * lenPx;
        ctxBeam.lineWidth = 3;
        ctxBeam.beginPath(); ctxBeam.moveTo(px, y - 40); ctxBeam.lineTo(px, y - 6); ctxBeam.stroke();
        ctxBeam.beginPath(); ctxBeam.arc(px, y - 6, 4, 0, Math.PI * 2); ctxBeam.fill();
        ctxBeam.font = 'bold 11px sans-serif';
        ctxBeam.fillText(`P = ${P} kN`, px - 18, y - 45);
    }
}

function drawSFD(L, Ra, Rb, w, P, a, isUDL) {
    ctxSFD.clearRect(0, 0, sfdCanvas.width, sfdCanvas.height);
    const startX = 50, endX = sfdCanvas.width - 50, midY = 65;
    const lenPx = endX - startX;

    ctxSFD.strokeStyle = '#cbd5e1'; ctxSFD.lineWidth = 1;
    ctxSFD.beginPath(); ctxSFD.moveTo(startX, midY); ctxSFD.lineTo(endX, midY); ctxSFD.stroke();

    ctxSFD.strokeStyle = '#0284c7'; ctxSFD.fillStyle = 'rgba(2, 132, 199, 0.15)'; ctxSFD.lineWidth = 2;
    ctxSFD.beginPath(); ctxSFD.moveTo(startX, midY);

    const scaleV = 35 / (Math.max(Ra, Rb, P, w * L) || 1);

    if (beamType === 'ss' && isUDL) {
        ctxSFD.lineTo(startX, midY - Ra * scaleV);
        ctxSFD.lineTo(endX, midY + Rb * scaleV);
    } else if (beamType === 'cantilever' && isUDL) {
        ctxSFD.lineTo(startX, midY - Ra * scaleV);
        ctxSFD.lineTo(endX, midY);
    } else if (!isUDL) {
        const px = startX + (a / L) * lenPx;
        ctxSFD.lineTo(startX, midY - Ra * scaleV);
        ctxSFD.lineTo(px, midY - Ra * scaleV);
        ctxSFD.lineTo(px, midY + Rb * scaleV);
        ctxSFD.lineTo(endX, midY + Rb * scaleV);
    }

    ctxSFD.lineTo(endX, midY);
    ctxSFD.closePath();
    ctxSFD.fill(); ctxSFD.stroke();
}

function drawBMD(L, Ra, Rb, Ma, Mb, w, P, a, isUDL) {
    ctxBMD.clearRect(0, 0, bmdCanvas.width, bmdCanvas.height);
    const startX = 50, endX = bmdCanvas.width - 50, midY = 65;
    const lenPx = endX - startX;

    ctxBMD.strokeStyle = '#cbd5e1'; ctxBMD.lineWidth = 1;
    ctxBMD.beginPath(); ctxBMD.moveTo(startX, midY); ctxBMD.lineTo(endX, midY); ctxBMD.stroke();

    ctxBMD.strokeStyle = '#e11d48'; ctxBMD.fillStyle = 'rgba(225, 29, 72, 0.15)'; ctxBMD.lineWidth = 2;
    ctxBMD.beginPath(); ctxBMD.moveTo(startX, midY);

    const maxM = (isUDL ? (w * L * L) / 8 : (P * L) / 4) || 1;
    const scaleM = 35 / maxM;

    if (beamType === 'ss') {
        if (isUDL) {
            const midX = startX + lenPx / 2;
            ctxBMD.quadraticCurveTo(midX, midY + maxM * scaleM, endX, midY);
        } else {
            const px = startX + (a / L) * lenPx;
            const M_a = (P * a * (L - a)) / L;
            ctxBMD.lineTo(px, midY + M_a * scaleM);
            ctxBMD.lineTo(endX, midY);
        }
    } else if (beamType === 'cantilever') {
        ctxBMD.lineTo(startX, midY - Ma * scaleM);
        ctxBMD.lineTo(endX, midY);
    }

    ctxBMD.closePath();
    ctxBMD.fill(); ctxBMD.stroke();
}

// Initial Run
updateAnalyzer();