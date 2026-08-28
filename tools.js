// --- BEAM CALCULATION ENGINE ---

// DOM Inputs
const spanInput = document.getElementById('span');
const loadUDLInput = document.getElementById('loadUDL');
const loadPointInput = document.getElementById('loadPoint');
const elasticityInput = document.getElementById('elasticity');
const inertiaInput = document.getElementById('inertia');

const loadGroupUDL = document.getElementById('loadGroupUDL');
const loadGroupPoint = document.getElementById('loadGroupPoint');

// DOM Output Elements
const resMoment = document.getElementById('resMoment');
const resShear = document.getElementById('resShear');
const resReactions = document.getElementById('resReactions');
const resDeflection = document.getElementById('resDeflection');
const resDeflectionRatio = document.getElementById('resDeflectionRatio');

// Scheme Selection State
let currentScheme = 'ss-udl';
const schemeCards = document.querySelectorAll('.scheme-card');

schemeCards.forEach(card => {
    card.addEventListener('click', () => {
        schemeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentScheme = card.dataset.scheme;

        // Toggle Input Fields based on load type
        if (currentScheme === 'ss-udl' || currentScheme === 'cant-udl') {
            loadGroupUDL.style.display = 'block';
            loadGroupPoint.style.display = 'none';
        } else {
            loadGroupUDL.style.display = 'none';
            loadGroupPoint.style.display = 'block';
        }

        calculate();
    });
});

// Calculate Function
function calculate() {
    const L = parseFloat(spanInput.value) || 0;            // m
    const q = parseFloat(loadUDLInput.value) || 0;         // kN/m
    const P = parseFloat(loadPointInput.value) || 0;       // kN
    const E_GPa = parseFloat(elasticityInput.value) || 0;  // GPa
    const I_cm4 = parseFloat(inertiaInput.value) || 0;     // cm^4

    // Unit Conversions to N and mm
    const E = E_GPa * 1e9;               // Pa (N/m^2)
    const I = I_cm4 * 1e-8;              // m^4

    let Mmax = 0;  // kN.m
    let Vmax = 0;  // kN
    let delta = 0; // mm
    let reactionsText = "";

    if (L <= 0 || E <= 0 || I <= 0) return;

    switch (currentScheme) {
        case 'ss-udl':
            // Simply Supported + UDL
            Mmax = (q * L * L) / 8;
            Vmax = (q * L) / 2;
            reactionsText = `R_A = ${(q * L / 2).toFixed(2)} kN | R_B = ${(q * L / 2).toFixed(2)} kN`;
            // Deflection: 5 * q * L^4 / (384 * E * I)
            const delta_m_1 = (5 * (q * 1000) * Math.pow(L, 4)) / (384 * E * I);
            delta = delta_m_1 * 1000; // convert to mm
            break;

        case 'ss-point':
            // Simply Supported + Midspan Point Load
            Mmax = (P * L) / 4;
            Vmax = P / 2;
            reactionsText = `R_A = ${(P / 2).toFixed(2)} kN | R_B = ${(P / 2).toFixed(2)} kN`;
            // Deflection: P * L^3 / (48 * E * I)
            const delta_m_2 = ((P * 1000) * Math.pow(L, 3)) / (48 * E * I);
            delta = delta_m_2 * 1000;
            break;

        case 'cant-udl':
            // Cantilever + UDL
            Mmax = (q * L * L) / 2;
            Vmax = q * L;
            reactionsText = `R_Fixed = ${(q * L).toFixed(2)} kN | M_Fixed = ${Mmax.toFixed(2)} kN·m`;
            // Deflection: q * L^4 / (8 * E * I)
            const delta_m_3 = ((q * 1000) * Math.pow(L, 4)) / (8 * E * I);
            delta = delta_m_3 * 1000;
            break;

        case 'cant-point':
            // Cantilever + End Point Load
            Mmax = P * L;
            Vmax = P;
            reactionsText = `R_Fixed = ${P.toFixed(2)} kN | M_Fixed = ${Mmax.toFixed(2)} kN·m`;
            // Deflection: P * L^3 / (3 * E * I)
            const delta_m_4 = ((P * 1000) * Math.pow(L, 3)) / (3 * E * I);
            delta = delta_m_4 * 1000;
            break;
    }

    // Update Output Cards
    resMoment.textContent = `${Mmax.toFixed(2)} kN·m`;
    resShear.textContent = `${Vmax.toFixed(2)} kN`;
    resReactions.textContent = reactionsText;
    resDeflection.textContent = `${delta.toFixed(2)} mm`;

    const spanRatio = delta > 0 ? Math.round((L * 1000) / delta) : 0;
    resDeflectionRatio.textContent = `Span Ratio: L / ${spanRatio}`;
}

// Attach Live Event Listeners to Form Inputs
[spanInput, loadUDLInput, loadPointInput, elasticityInput, inertiaInput].forEach(input => {
    input.addEventListener('input', calculate);
});

// Run Initial Calculation
calculate();