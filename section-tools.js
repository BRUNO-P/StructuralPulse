// Canvas & Context
const canvas = document.getElementById('sectionCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Static Diagram Container
const dimensionDiagram = document.getElementById('dimensionDiagram');

// Standard Input Binding Elements
const widthSlider = document.getElementById('widthSlider');
const widthNum = document.getElementById('widthNum');
const heightSlider = document.getElementById('heightSlider');
const heightNum = document.getElementById('heightNum');
const diamSlider = document.getElementById('diamSlider');
const diamNum = document.getElementById('diamNum');
const thickSlider = document.getElementById('thickSlider');
const thickNum = document.getElementById('thickNum');
const webThickSlider = document.getElementById('webThickSlider');
const webThickNum = document.getElementById('webThickNum');
const flangeThickSlider = document.getElementById('flangeThickSlider');
const flangeThickNum = document.getElementById('flangeThickNum');

// PSC I-Girder Specific Input Elements (Sliders & Numbers)
const psciInputsWrap = document.getElementById('psciInputs');
const standardInputsWrap = document.getElementById('standardInputs');

const ht1Slider = document.getElementById('ht1Slider'); const ht1Num = document.getElementById('ht1Num');
const ht2Slider = document.getElementById('ht2Slider'); const ht2Num = document.getElementById('ht2Num');
const ht3Slider = document.getElementById('ht3Slider'); const ht3Num = document.getElementById('ht3Num');
const t1Slider  = document.getElementById('t1Slider');  const t1Num  = document.getElementById('t1Num');
const t2Slider  = document.getElementById('t2Slider');  const t2Num  = document.getElementById('t2Num');
const hwSlider  = document.getElementById('hwSlider');  const hwNum  = document.getElementById('hwNum');
const w1Slider  = document.getElementById('w1Slider');  const w1Num  = document.getElementById('w1Num');
const hb1Slider = document.getElementById('hb1Slider'); const hb1Num = document.getElementById('hb1Num');
const hb2Slider = document.getElementById('hb2Slider'); const hb2Num = document.getElementById('hb2Num');
const hb3Slider = document.getElementById('hb3Slider'); const hb3Num = document.getElementById('hb3Num');
const b1Slider  = document.getElementById('b1Slider');  const b1Num  = document.getElementById('b1Num');
const b2Slider  = document.getElementById('b2Slider');  const b2Num  = document.getElementById('b2Num');

// Labels
const widthLabelTxt = document.getElementById('widthLabelTxt');
const flangeThickLabelTxt = document.getElementById('flangeThickLabelTxt');

// Material & Specific Weight Elements
const materialSelect = document.getElementById('materialSelect');
const customGammaWrap = document.getElementById('customGammaWrap');
const gammaNum = document.getElementById('gammaNum');

// Form Groups & Controls
const widthGroup = document.getElementById('widthGroup');
const heightGroup = document.getElementById('heightGroup');
const diamGroup = document.getElementById('diamGroup');
const thickGroup = document.getElementById('thickGroup');
const webThickGroup = document.getElementById('webThickGroup');
const flangeThickGroup = document.getElementById('flangeThickGroup');

const catalogueGroup = document.getElementById('catalogueGroup');
const presetSelect = document.getElementById('presetSelect');
const resultsGrid = document.getElementById('resultsGrid');

// Legend Group References
const legendGroupIbeam = document.getElementById('legendGroupIbeam');
const legendGroupTee = document.getElementById('legendGroupTee');
const legendGroupAngle = document.getElementById('legendGroupAngle');
const legendGroupChannel = document.getElementById('legendGroupChannel');
const legendGroupHollow = document.getElementById('legendGroupHollow');

const calcSteps = document.getElementById('calcSteps');
const toggleStepsBtn = document.getElementById('toggleStepsBtn');
const screenshotBtn = document.getElementById('screenshotBtn');

// State Variables
let activeShape = 'rectangle';
let inputUnit = 'mm';
let outputUnit = 'cm';
let stepsVisible = true;
let currentPresets = [];
let selectedPresetObj = null;

const toMMFactor = { mm: 1, cm: 10, m: 1000 };

function addSafeListener(el, evt, fn) {
    if (el) el.addEventListener(evt, fn);
}

// Material Specific Weight Listener
addSafeListener(materialSelect, 'change', () => {
    if (materialSelect.value === 'custom') {
        if (customGammaWrap) customGammaWrap.style.display = 'flex';
    } else {
        if (customGammaWrap) customGammaWrap.style.display = 'none';
        if (gammaNum) gammaNum.value = materialSelect.value;
    }
    updateCalculator();
});

addSafeListener(gammaNum, 'input', () => {
    updateCalculator();
});

function getActiveGamma() {
    return gammaNum ? (parseFloat(gammaNum.value) || 78.5) : 78.5;
}

// Bind Standard & PSC Sliders
function syncInputs(slider, numInput) {
    if (slider && numInput) {
        slider.addEventListener('input', () => {
            numInput.value = parseFloat(slider.value).toString();
            selectedPresetObj = null;
            updateCalculator();
        });
        numInput.addEventListener('input', () => {
            slider.value = numInput.value;
            selectedPresetObj = null;
            updateCalculator();
        });
    }
}
syncInputs(widthSlider, widthNum);
syncInputs(heightSlider, heightNum);
syncInputs(diamSlider, diamNum);
syncInputs(thickSlider, thickNum);
syncInputs(webThickSlider, webThickNum);
syncInputs(flangeThickSlider, flangeThickNum);

// Bind PSC Parametric Inputs
syncInputs(ht1Slider, ht1Num); syncInputs(ht2Slider, ht2Num); syncInputs(ht3Slider, ht3Num);
syncInputs(t1Slider, t1Num);   syncInputs(t2Slider, t2Num);   syncInputs(hwSlider, hwNum);
syncInputs(w1Slider, w1Num);   syncInputs(hb1Slider, hb1Num); syncInputs(hb2Slider, hb2Num);
syncInputs(hb3Slider, hb3Num); syncInputs(b1Slider, b1Num);   syncInputs(b2Slider, b2Num);


function updateLegendVisibility() {
    if (legendGroupIbeam) legendGroupIbeam.style.display = (['ibeam', 'psci'].includes(activeShape)) ? 'block' : 'none';
    if (legendGroupTee) legendGroupTee.style.display = (activeShape === 'tee') ? 'block' : 'none';
    if (legendGroupAngle) legendGroupAngle.style.display = (activeShape === 'angle') ? 'block' : 'none';
    if (legendGroupChannel) legendGroupChannel.style.display = (activeShape === 'channel') ? 'block' : 'none';
    if (legendGroupHollow) legendGroupHollow.style.display = (['box', 'pipe'].includes(activeShape)) ? 'block' : 'none';
}

function populateCatalogue() {
    if (!presetSelect) return;
    presetSelect.innerHTML = '';
    currentPresets = [];
    selectedPresetObj = null;

    const db = (typeof sectionDatabase !== 'undefined') ? sectionDatabase : {};
    let categoryMap = {};

    if (activeShape === 'ibeam') {
        categoryMap = {
            "IPE Profiles": db.ipe || [],
            "HE / HL Profiles": db.he || [],
            "IPN Profiles": db.ipn || [],
            "HD Heavy Columns": db.hd || [],
            "HP Bearing Piles": db.hp || []
        };
    } else if (activeShape === 'channel') {
        categoryMap = {
            "UPE Parallel Flange Channels": db.upe || [],
            "UPN Standard Channels": db.upn || []
        };
    } else if (activeShape === 'angle') {
        categoryMap = {
            "Equal Leg Angles": db.angle_equal || [],
            "Unequal Leg Angles": db.angle_unequal || []
        };
    } else if (activeShape === 'pipe') {
        categoryMap = {
            "CHS Circular Tubes (Hot Formed)": db.chs_hot || [],
            "CHS Circular Tubes (Cold Formed)": db.chs_cold || []
        };
    } else if (activeShape === 'box') {
        categoryMap = {
            "SHS Square Tubes (Hot Formed)": db.shs_hot || [],
            "SHS Square Tubes (Cold Formed)": db.shs_cold || [],
            "RHS Rectangular Tubes (Hot Formed)": db.rhs_hot || [],
            "RHS Rectangular Tubes (Cold Formed)": db.rhs_cold || []
        };
    }

    const hasPresets = Object.values(categoryMap).some(arr => arr.length > 0);

    if (hasPresets) {
        if (catalogueGroup) catalogueGroup.style.display = 'block';

        const customOpt = document.createElement('option');
        customOpt.value = "-1";
        customOpt.textContent = "Custom / Manual Input";
        presetSelect.appendChild(customOpt);

        let globalIdx = 0;
        for (const [groupLabel, items] of Object.entries(categoryMap)) {
            if (!items || items.length === 0) continue;

            const optgroup = document.createElement('optgroup');
            optgroup.label = groupLabel;

            items.forEach(item => {
                const opt = document.createElement('option');
                opt.value = globalIdx;
                opt.textContent = `${item.name}${item.G ? ' (' + item.G + ' kg/m)' : ''}`;
                optgroup.appendChild(opt);
                currentPresets.push(item);
                globalIdx++;
            });

            presetSelect.appendChild(optgroup);
        }
    } else {
        if (catalogueGroup) catalogueGroup.style.display = 'none';
    }
}

addSafeListener(presetSelect, 'change', () => {
    const idx = parseInt(presetSelect.value);
    if (idx >= 0 && currentPresets[idx]) {
        selectedPresetObj = currentPresets[idx];
        const item = selectedPresetObj;
        const scale = 1 / toMMFactor[inputUnit];

        if (item.h !== undefined && item.h !== null && heightNum) { heightNum.value = (item.h * scale).toFixed(1); if (heightSlider) heightSlider.value = heightNum.value; }
        if (item.b !== undefined && item.b !== null && widthNum) { widthNum.value = (item.b * scale).toFixed(1); if (widthSlider) widthSlider.value = widthNum.value; }
        if (item.D !== undefined && item.D !== null && diamNum) { diamNum.value = (item.D * scale).toFixed(1); if (diamSlider) diamSlider.value = diamNum.value; }
        if (item.t !== undefined && item.t !== null && thickNum) { thickNum.value = (item.t * scale).toFixed(1); if (thickSlider) thickSlider.value = thickNum.value; }
        if (item.tw !== undefined && item.tw !== null && webThickNum) { webThickNum.value = (item.tw * scale).toFixed(1); if (webThickSlider) webThickSlider.value = webThickNum.value; }
        if (item.tf !== undefined && item.tf !== null && flangeThickNum) { flangeThickNum.value = (item.tf * scale).toFixed(1); if (flangeThickSlider) flangeThickSlider.value = flangeThickNum.value; }

        updateCalculator();
    } else {
        selectedPresetObj = null;
        updateCalculator();
    }
});

// Render Vector SVG Dimension Key Diagrams (Symbols Only, Subscript tw & tf)
function updateDimensionDiagram() {
    if (!dimensionDiagram) return;

    const commonDefs = `<defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
        </marker>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
        </marker>
    </defs>
    <pattern id="grid_key" width="15" height="15" patternUnits="userSpaceOnUse">
        <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
    </pattern>
    <rect width="100%" height="100%" fill="url(#grid_key)" />`;

    if (activeShape === 'rectangle') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <rect x="110" y="80" width="180" height="240" fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>
            <line x1="110" y1="55" x2="290" y2="55" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="110" y1="50" x2="110" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="290" y1="50" x2="290" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="200" y="47" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">b</text>

            <line x1="315" y1="80" x2="315" y2="320" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="290" y1="80" x2="325" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="290" y1="320" x2="325" y2="320" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="332" y="205" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="start">H</text>
        </svg>`;
    } else if (activeShape === 'box') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <rect x="100" y="80" width="200" height="240" fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>
            <rect x="130" y="110" width="140" height="180" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
            
            <line x1="100" y1="55" x2="300" y2="55" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="100" y1="50" x2="100" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="300" y1="50" x2="300" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="200" y="47" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">b</text>

            <line x1="325" y1="80" x2="325" y2="320" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="300" y1="80" x2="335" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="300" y1="320" x2="335" y2="320" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="342" y="205" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="start">H</text>

            <line x1="100" y1="200" x2="130" y2="200" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="115" y="192" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="middle">t</text>
        </svg>`;
    } else if (activeShape === 'circle') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <circle cx="200" cy="200" r="110" fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>
            
            <line x1="90" y1="200" x2="310" y2="200" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="90" y1="85" x2="90" y2="205" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="310" y1="85" x2="310" y2="205" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="200" y="192" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">D</text>
        </svg>`;
    } else if (activeShape === 'pipe') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <circle cx="200" cy="200" r="120" fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>
            <circle cx="200" cy="200" r="85" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
            
            <line x1="80" y1="200" x2="320" y2="200" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="200" y="192" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">D</text>

            <line x1="285" y1="200" x2="320" y2="200" stroke="#d97706" stroke-width="1.5" marker-start="url(#arrow-amber)" marker-end="url(#arrow-amber)"/>
            <text x="302" y="190" fill="#b45309" font-size="15" font-weight="bold" font-style="italic" text-anchor="middle">t</text>
        </svg>`;
    } else if (activeShape === 'ibeam') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <path d="M 100,320 L 300,320 L 300,280 L 215,280 L 215,120 L 300,120 L 300,80 L 100,80 L 100,120 L 185,120 L 185,280 L 100,280 Z" 
                  fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>

            <line x1="100" y1="55" x2="300" y2="55" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="100" y1="50" x2="100" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="300" y1="50" x2="300" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="200" y="47" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">b</text>

            <line x1="325" y1="80" x2="325" y2="320" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="300" y1="80" x2="335" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="300" y1="320" x2="335" y2="320" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="342" y="205" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="start">H</text>

            <line x1="300" y1="80" x2="300" y2="120" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="310" y="104" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="start">t<tspan dy="4" font-size="0.75em">f</tspan></text>

            <line x1="185" y1="200" x2="215" y2="200" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="200" y="192" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="middle">t<tspan dy="4" font-size="0.75em">w</tspan></text>
        </svg>`;
    } else if (activeShape === 'tee') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <path d="M 100,80 L 300,80 L 300,120 L 215,120 L 215,320 L 185,320 L 185,120 L 100,120 Z" 
                  fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>

            <line x1="100" y1="55" x2="300" y2="55" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="100" y1="50" x2="100" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="300" y1="50" x2="300" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="200" y="47" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">b</text>

            <line x1="325" y1="80" x2="325" y2="320" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="300" y1="80" x2="335" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="215" y1="320" x2="335" y2="320" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="342" y="205" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="start">H</text>

            <line x1="300" y1="80" x2="300" y2="120" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="310" y="104" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="start">t<tspan dy="4" font-size="0.75em">f</tspan></text>

            <line x1="185" y1="220" x2="215" y2="220" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="200" y="212" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="middle">t<tspan dy="4" font-size="0.75em">w</tspan></text>
        </svg>`;
    } else if (activeShape === 'channel') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <path d="M 120,80 L 280,80 L 280,120 L 160,120 L 160,280 L 280,280 L 280,320 L 120,320 Z" 
                  fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>

            <line x1="120" y1="55" x2="280" y2="55" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="120" y1="50" x2="120" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="280" y1="50" x2="280" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="200" y="47" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">b</text>

            <line x1="305" y1="80" x2="305" y2="320" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="280" y1="80" x2="315" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="280" y1="320" x2="315" y2="320" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="322" y="205" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="start">H</text>

            <line x1="280" y1="80" x2="280" y2="120" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="290" y="104" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="start">t<tspan dy="4" font-size="0.75em">f</tspan></text>

            <line x1="120" y1="200" x2="160" y2="200" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="140" y="192" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="middle">t<tspan dy="4" font-size="0.75em">w</tspan></text>
        </svg>`;
    } else if (activeShape === 'angle') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 400 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <path d="M 100,80 L 140,80 L 140,280 L 300,280 L 300,320 L 100,320 Z" 
                  fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5"/>

            <line x1="100" y1="345" x2="300" y2="345" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="100" y1="320" x2="100" y2="355" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="300" y1="320" x2="300" y2="355" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="200" y="365" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="middle">b</text>

            <line x1="75" y1="80" x2="75" y2="320" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="65" y1="80" x2="100" y2="80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="65" y1="320" x2="100" y2="320" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="65" y="205" fill="#0369a1" font-size="16" font-weight="bold" font-style="italic" text-anchor="end">H</text>

            <line x1="100" y1="180" x2="140" y2="180" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="120" y="172" fill="#0369a1" font-size="15" font-weight="bold" font-style="italic" text-anchor="middle">t</text>
        </svg>`;
    } else if (activeShape === 'psci') {
        dimensionDiagram.innerHTML = `<svg viewBox="0 0 450 480" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:6px; font-family:sans-serif;">
            ${commonDefs}
            <!-- Symmetrical PSC I-Girder Path mapped to CSV Parameters -->
            <path d="M 110,410 L 290,410 L 290,340 L 245,320 L 220,295 L 220,105 L 235,85 L 320,65 L 320,30 L 80,30 L 80,65 L 165,85 L 180,105 L 180,295 L 155,320 L 110,340 Z" 
                  fill="#e2e8f0" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>

            <!-- Left Heights -->
            <line x1="60" y1="30" x2="60" y2="65" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="55" y1="30" x2="80" y2="30" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="55" y1="65" x2="80" y2="65" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="52" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="end">HT1</text>

            <line x1="60" y1="65" x2="60" y2="85" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="55" y1="85" x2="165" y2="85" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="79" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="end">HT2</text>

            <line x1="60" y1="85" x2="60" y2="105" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="55" y1="105" x2="180" y2="105" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="99" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="end">HT3</text>

            <line x1="60" y1="105" x2="60" y2="295" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="55" y1="295" x2="180" y2="295" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="204" fill="#0369a1" font-size="13" font-weight="bold" text-anchor="end">HW</text>

            <line x1="60" y1="295" x2="60" y2="320" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="55" y1="320" x2="155" y2="320" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="312" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="end">HB1</text>

            <line x1="60" y1="320" x2="60" y2="340" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="55" y1="340" x2="110" y2="340" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="334" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="end">HB2</text>

            <line x1="60" y1="340" x2="60" y2="410" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="55" y1="410" x2="110" y2="410" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="50" y="380" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="end">HB3</text>

            <!-- Top Flange T2 & T1 -->
            <line x1="235" y1="18" x2="320" y2="18" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="235" y1="15" x2="235" y2="85" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="320" y1="15" x2="320" y2="65" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="277.5" y="12" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">T2</text>

            <line x1="220" y1="18" x2="235" y2="18" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="220" y1="15" x2="220" y2="105" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="227.5" y="12" fill="#0369a1" font-size="11" font-weight="bold" text-anchor="middle">T1</text>

            <!-- Web Width W1 -->
            <line x1="180" y1="200" x2="220" y2="200" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="200" y="193" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">W1</text>

            <!-- Bottom Bulb B1 & B2 -->
            <line x1="220" y1="430" x2="245" y2="430" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="220" y1="295" x2="220" y2="435" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="245" y1="320" x2="245" y2="435" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="232.5" y="445" fill="#0369a1" font-size="11" font-weight="bold" text-anchor="middle">B1</text>

            <line x1="245" y1="430" x2="290" y2="430" stroke="#0284c7" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <line x1="290" y1="340" x2="290" y2="435" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="267.5" y="445" fill="#0369a1" font-size="12" font-weight="bold" text-anchor="middle">B2</text>

            <!-- Total Height Right Dimension -->
            <line x1="365" y1="30" x2="365" y2="410" stroke="#d97706" stroke-width="1.8" marker-start="url(#arrow-amber)" marker-end="url(#arrow-amber)"/>
            <line x1="320" y1="30" x2="375" y2="30" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="290" y1="410" x2="375" y2="410" stroke="#f59e0b" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="382" y="225" fill="#b45309" font-size="14" font-weight="bold" font-style="italic" text-anchor="start">H</text>
        </svg>`;
    }
}

// Shape Selection Cards
document.querySelectorAll('.scheme-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.scheme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        activeShape = card.dataset.shape;

        if (activeShape === 'psci') {
            if (psciInputsWrap) psciInputsWrap.style.display = 'flex';
            if (standardInputsWrap) standardInputsWrap.style.display = 'none';
            if (materialSelect) materialSelect.value = '25.0';
            if (gammaNum) gammaNum.value = '25.0';
            if (customGammaWrap) customGammaWrap.style.display = 'none';
        } else {
            if (psciInputsWrap) psciInputsWrap.style.display = 'none';
            if (standardInputsWrap) standardInputsWrap.style.display = 'block';

            if (widthGroup) widthGroup.style.display = ['rectangle', 'box', 'ibeam', 'tee', 'channel', 'angle'].includes(activeShape) ? 'block' : 'none';
            if (heightGroup) heightGroup.style.display = ['rectangle', 'box', 'ibeam', 'tee', 'channel', 'angle'].includes(activeShape) ? 'block' : 'none';
            if (diamGroup) diamGroup.style.display = ['circle', 'pipe'].includes(activeShape) ? 'block' : 'none';
            if (thickGroup) thickGroup.style.display = ['box', 'pipe', 'angle'].includes(activeShape) ? 'block' : 'none';
            if (webThickGroup) webThickGroup.style.display = ['ibeam', 'tee', 'channel'].includes(activeShape) ? 'block' : 'none';
            if (flangeThickGroup) flangeThickGroup.style.display = ['ibeam', 'tee', 'channel'].includes(activeShape) ? 'block' : 'none';

            if (widthLabelTxt) widthLabelTxt.innerHTML = 'Width <i>b</i>';
            if (flangeThickLabelTxt) flangeThickLabelTxt.innerHTML = 'Flange Thickness <i>t<sub>f</sub></i>';
        }

        updateLegendVisibility();
        populateCatalogue();
        updateCalculator();
    });
});

addSafeListener(toggleStepsBtn, 'click', () => {
    stepsVisible = !stepsVisible;
    if (calcSteps) calcSteps.style.display = stepsVisible ? 'block' : 'none';
    if (toggleStepsBtn) toggleStepsBtn.textContent = stepsVisible ? 'Hide the steps' : 'Show the steps';
});

// Input & Output Unit Toggles
document.querySelectorAll('.input-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.input-unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const newUnit = btn.dataset.unit;

        if (newUnit !== inputUnit) {
            const ratio = toMMFactor[inputUnit] / toMMFactor[newUnit];
            [widthNum, heightNum, diamNum, thickNum, webThickNum, flangeThickNum].forEach(input => {
                if (input) input.value = (parseFloat(input.value) * ratio).toFixed(newUnit === 'm' ? 3 : 1);
            });
            inputUnit = newUnit;
            document.querySelectorAll('.input-unit-txt').forEach(el => el.textContent = inputUnit);
            updateCalculator();
        }
    });
});

document.querySelectorAll('.output-unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.output-unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        outputUnit = btn.dataset.unit;
        updateCalculator();
    });
});

function formatCardVal(val, valType, baseUnit) {
    if (val === undefined || val === null || isNaN(val)) return "-";

    const unitStrMap = {
        'weight': 'kg/m',
        'load': 'kN/m',
        'area': `${outputUnit}²`,
        'length': `${outputUnit}`,
        'inertia': `${outputUnit}⁴`,
        'modulus': `${outputUnit}³`,
        'warping': `${outputUnit}⁶`
    };

    let factor = 1;
    if (baseUnit === 'cm') {
        const factorMap = {
            'weight': { mm: 1, cm: 1, m: 1 },
            'load': { mm: 1, cm: 1, m: 1 },
            'area': { mm: 100, cm: 1, m: 1e-4 },
            'length': { mm: 10, cm: 1, m: 0.01 },
            'inertia': { mm: 1e4, cm: 1, m: 1e-8 },
            'modulus': { mm: 1e3, cm: 1, m: 1e-6 },
            'warping': { mm: 1e6, cm: 1, m: 1e-12 }
        };
        factor = factorMap[valType][outputUnit];
    } else {
        const factorMap = {
            'weight': { mm: 1, cm: 1, m: 1 },
            'load': { mm: 1, cm: 1, m: 1 },
            'area': { mm: 1, cm: 0.01, m: 1e-6 },
            'length': { mm: 1, cm: 0.1, m: 0.001 },
            'inertia': { mm: 1, cm: 1e-4, m: 1e-12 },
            'modulus': { mm: 1, cm: 1e-3, m: 1e-9 },
            'warping': { mm: 1, cm: 1e-6, m: 1e-18 }
        };
        factor = factorMap[valType][outputUnit];
    }

    const converted = val * factor;
    if (converted === 0) return `0 ${unitStrMap[valType]}`;

    let formattedNum = "";
    const absVal = Math.abs(converted);
    if (absVal < 0.00001) formattedNum = converted.toExponential(3);
    else if (absVal < 0.1) formattedNum = converted.toFixed(5);
    else if (absVal < 100) formattedNum = converted.toFixed(2);
    else if (absVal < 10000) formattedNum = converted.toFixed(1);
    else formattedNum = converted.toLocaleString('en-US', { maximumFractionDigits: 0 });

    return `${formattedNum} ${unitStrMap[valType]}`;
}

function renderResultCards(cards) {
    if (!resultsGrid) return;
    resultsGrid.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = `result-card ${card.highlight ? 'highlight' : ''}`;
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'result-label';
        labelSpan.innerHTML = card.label;

        const valSpan = document.createElement('span');
        valSpan.className = 'result-value';
        valSpan.textContent = card.val;

        cardDiv.appendChild(labelSpan);
        cardDiv.appendChild(valSpan);
        resultsGrid.appendChild(cardDiv);
    });
}

function pscIExactPoints(HT1, HT2, HT3, HW, HB1, HB2, HB3, W1, T1, T2, B1, B2) {
    var z0 = 0.0;
    var z1 = z0 + HB3;
    var z2 = z1 + HB2;
    var z3 = z2 + HB1;
    var z4 = z3 + HW;
    var z5 = z4 + HT3;
    var z6 = z5 + HT2;
    var z7 = z6 + HT1;

    var x_web = W1 / 2.0;
    var x_haunch_top = W1 / 2.0 + T1;
    var x_top = W1 / 2.0 + T1 + T2;

    var x_taper_bot = W1 / 2.0 + B1;
    var x_bot = W1 / 2.0 + B1 + B2;

    return {
        pts: [
            [-x_bot, z0],
            [x_bot, z0],
            [x_bot, z1],
            [x_taper_bot, z2],
            [x_web, z3],
            [x_web, z4],
            [x_haunch_top, z5],
            [x_top, z6],
            [x_top, z7],
            [-x_top, z7],
            [-x_top, z6],
            [-x_haunch_top, z5],
            [-x_web, z4],
            [-x_web, z3],
            [-x_taper_bot, z2],
            [-x_bot, z1]
        ],
        H_total: z7,
        W_top: x_top * 2,
        W_bot: x_bot * 2
    };
}

function calculatePolygonProps(pts) {
    var n = pts.length;
    var A = 0, cx = 0, cy = 0, Ix = 0, Iy = 0;

    for (var i = 0; i < n; i++) {
        var j = (i + 1) % n;
        var xi = pts[i][0], yi = pts[i][1];
        var xj = pts[j][0], yj = pts[j][1];
        
        var cross = (xi * yj - xj * yi);
        A += cross;
        cx += (xi + xj) * cross;
        cy += (yi + yj) * cross;
        Ix += (yi * yi + yi * yj + yj * yj) * cross;
        Iy += (xi * xi + xi * xj + xj * xj) * cross;
    }

    A = Math.abs(A) / 2;
    cy = Math.abs(cy) / (6 * A);
    cx = cx / (6 * A);
    
    Ix = Math.abs(Ix) / 12;
    Iy = Math.abs(Iy) / 12;

    var Iy_cent = Ix - A * cy * cy;
    var Iz_cent = Iy - A * cx * cx;

    var maxY = 0;
    for (var k = 0; k < n; k++) {
        if (pts[k][1] > maxY) maxY = pts[k][1];
    }

    var cb = cy;
    var ct = maxY - cy;

    return {
        A: A,
        ys: cy,
        cb: cb,
        ct: ct,
        Iy: Iy_cent,
        Iz: Iz_cent,
        Wely_top: Iy_cent / ct,
        Wely_bot: Iy_cent / cb,
        iy: Math.sqrt(Iy_cent / A),
        iz: Math.sqrt(Iz_cent / A)
    };
}

// Master execution
function updateCalculator() {
    updateDimensionDiagram();

    const rawB = widthNum ? parseFloat(widthNum.value) || 0 : 0;
    const rawH = heightNum ? parseFloat(heightNum.value) || 0 : 0;
    const rawD = diamNum ? parseFloat(diamNum.value) || 0 : 0;
    const rawT = thickNum ? parseFloat(thickNum.value) || 0 : 0;
    const rawTw = webThickNum ? parseFloat(webThickNum.value) || 0 : 0;
    const rawTf = flangeThickNum ? parseFloat(flangeThickNum.value) || 0 : 0;
    const gamma = getActiveGamma();

    const scaleIn = toMMFactor[inputUnit] || 1;

    const b = rawB * scaleIn;
    const h = rawH * scaleIn;
    const D = rawD * scaleIn;
    const t = rawT * scaleIn;
    const tw = rawTw * scaleIn;
    const tf = rawTf * scaleIn;

    let props = {};
    let baseUnit = 'mm';
    let stepsLaTeX = "";
    let psciData = null;

    if (selectedPresetObj) {
        baseUnit = 'cm';
        props = {
            G: selectedPresetObj.G,
            A: selectedPresetObj.A,
            Iy: selectedPresetObj.Iy,
            Wely: selectedPresetObj.Wely,
            Wply: selectedPresetObj.Wply,
            iy: selectedPresetObj.iy,
            Iz: selectedPresetObj.Iz,
            Welz: selectedPresetObj.Welz,
            Wplz: selectedPresetObj.Wplz,
            iz: selectedPresetObj.iz,
            It: selectedPresetObj.It,
            Iw: selectedPresetObj.Iw,
            Avz: selectedPresetObj.Avz,
            ys: selectedPresetObj.ys,
            ym: selectedPresetObj.ym,
            zs: selectedPresetObj.zs
        };

        if (props.A) {
            const area_m2 = props.A * 1e-4;
            props.w = area_m2 * gamma;
            props.G = (gamma === 78.5 && selectedPresetObj.G) ? selectedPresetObj.G : props.w * 101.9716;
        }

        stepsLaTeX = `<p><b>Selected Catalogue Profile:</b> ${selectedPresetObj.name}</p>
        <p>Standard Section Properties retrieved from Eurocode EN 10365 Tables:</p>
        $$\\text{Area } A = ${props.A}\\text{ cm}^2 = ${(props.A * 100).toLocaleString()}\\text{ mm}^2$$
        $$I_y = ${props.Iy.toLocaleString()}\\text{ cm}^4, \\quad W_{\\text{el},y} = ${props.Wely.toLocaleString()}\\text{ cm}^3, \\quad W_{\\text{pl},y} = ${props.Wply || '-'}\\text{ cm}^3$$
        $$I_z = ${props.Iz ? props.Iz.toLocaleString() : '-'}\\text{ cm}^4, \\quad W_{\\text{el},z} = ${props.Welz || '-'}\\text{ cm}^3, \\quad W_{\\text{pl},z} = ${props.Wplz || '-'}\\text{ cm}^3$$
        $$i_y = ${props.iy || '-'}\\text{ cm}, \\quad i_z = ${props.iz || '-'}\\text{ cm}$$
        $$\\text{Self-Weight Load } w = A \\cdot \\gamma = ${props.A}\\text{ cm}^2 \\cdot ${gamma.toFixed(1)}\\text{ kN/m}^3 = ${props.w.toFixed(3)}\\text{ kN/m}$$
        $$\\text{Linear Mass } G = ${props.G.toFixed(1)}\\text{ kg/m}$$`;
    } else {
        baseUnit = 'mm';
        switch (activeShape) {
            case 'ibeam':
                props.A = 2 * (b * tf) + (h - 2 * tf) * tw;
                props.Iy = (b * Math.pow(h, 3) - (b - tw) * Math.pow(h - 2 * tf, 3)) / 12;
                props.Wely = props.Iy / (h / 2);
                props.Wply = b * tf * (h - tf) + (tw * Math.pow(h - 2 * tf, 2)) / 4;
                props.iy = Math.sqrt(props.Iy / props.A);
                props.Iz = (2 * tf * Math.pow(b, 3) + (h - 2 * tf) * Math.pow(tw, 3)) / 12;
                props.Welz = props.Iz / (b / 2);
                props.Wplz = (tf * Math.pow(b, 2)) / 2 + ((h - 2 * tf) * Math.pow(tw, 2)) / 4;
                props.iz = Math.sqrt(props.Iz / props.A);
                props.Avz = h * tw;
                props.It = (1 / 3) * (2 * b * Math.pow(tf, 3) + (h - 2 * tf) * Math.pow(tw, 3));
                props.Iw = (props.Iz * Math.pow(h - tf, 2)) / 4;
                props.ys = h / 2;
                props.zs = b / 2;
                props.w = (props.A * 1e-6) * gamma;
                props.G = props.w * 101.9716;

                stepsLaTeX = `<p><b>1. Cross-Sectional Area ($A$):</b></p>
                $$A = 2 \\cdot b \\cdot t_f + (h - 2 t_f) \\cdot t_w$$
                $$A = 2 \\cdot (${b.toFixed(1)}) \\cdot (${tf.toFixed(1)}) + (${h.toFixed(1)} - 2 \\cdot ${tf.toFixed(1)}) \\cdot (${tw.toFixed(1)}) = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2 = ${(props.A/100).toFixed(2)}\\text{ cm}^2$$

                <p><b>2. Strong-Axis Moment of Inertia ($I_y$):</b></p>
                $$I_y = \\frac{b \\cdot h^3 - (b - t_w)(h - 2 t_f)^3}{12}$$
                $$I_y = \\frac{${b.toFixed(1)} \\cdot ${h.toFixed(1)}^3 - (${(b-tw).toFixed(1)})(${ (h-2*tf).toFixed(1) })^3}{12} = ${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4 = ${(props.Iy/10000).toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ cm}^4$$

                <p><b>3. Weak-Axis Moment of Inertia ($I_z$):</b></p>
                $$I_z = \\frac{2 \\cdot t_f \\cdot b^3 + (h - 2 t_f) \\cdot t_w^3}{12} = ${props.Iz.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4 = ${(props.Iz/10000).toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ cm}^4$$

                <p><b>4. Elastic Section Modulus ($W_{\\text{el},y}$):</b></p>
                $$W_{\\text{el},y} = \\frac{I_y}{h / 2} = \\frac{${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}}{${(h/2).toFixed(1)}} = ${props.Wely.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^3 = ${(props.Wely/1000).toFixed(1)}\\text{ cm}^3$$

                <p><b>5. Plastic Section Modulus ($W_{\\text{pl},y}$):</b></p>
                $$W_{\\text{pl},y} = b \\cdot t_f \\cdot (h - t_f) + \\frac{t_w \\cdot (h - 2 t_f)^2}{4} = ${props.Wply.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^3 = ${(props.Wply/1000).toFixed(1)}\\text{ cm}^3$$

                <p><b>6. Radii of Gyration ($i_y, i_z$):</b></p>
                $$i_y = \\sqrt{\\frac{I_y}{A}} = ${props.iy.toFixed(2)}\\text{ mm}, \\quad i_z = \\sqrt{\\frac{I_z}{A}} = ${props.iz.toFixed(2)}\\text{ mm}$$

                <p><b>7. Material Self-Weight Load ($w$) & Linear Mass ($G$):</b></p>
                $$w = A \\cdot \\gamma = ${(props.A*1e-6).toFixed(6)}\\text{ m}^2 \\cdot ${gamma.toFixed(1)}\\text{ kN/m}^3 = ${props.w.toFixed(3)}\\text{ kN/m}, \\quad G = ${props.G.toFixed(1)}\\text{ kg/m}$$`;
                break;

            case 'psci':
                const HT1 = (ht1Num ? parseFloat(ht1Num.value) || 120.0 : 120.0) * scaleIn;
                const HT2 = (ht2Num ? parseFloat(ht2Num.value) || 60.0 : 60.0) * scaleIn;
                const HT3 = (ht3Num ? parseFloat(ht3Num.value) || 40.0 : 40.0) * scaleIn;
                const T1  = (t1Num  ? parseFloat(t1Num.value)  || 40.0 : 40.0) * scaleIn;
                const T2  = (t2Num  ? parseFloat(t2Num.value)  || 402.5 : 402.5) * scaleIn;
                const HW  = (hwNum  ? parseFloat(hwNum.value)  || 1242.0 : 1242.0) * scaleIn;
                const W1  = (w1Num  ? parseFloat(w1Num.value)  || 200.0 : 200.0) * scaleIn;
                const HB1 = (hb1Num ? parseFloat(hb1Num.value) || 48.0 : 48.0) * scaleIn;
                const HB2 = (hb2Num ? parseFloat(hb2Num.value) || 40.0 : 40.0) * scaleIn;
                const HB3 = (hb3Num ? parseFloat(hb3Num.value) || 150.0 : 150.0) * scaleIn;
                const B1  = (b1Num  ? parseFloat(b1Num.value)  || 48.0 : 48.0) * scaleIn;
                const B2  = (b2Num  ? parseFloat(b2Num.value)  || 110.0 : 110.0) * scaleIn;

                psciData = pscIExactPoints(HT1, HT2, HT3, HW, HB1, HB2, HB3, W1, T1, T2, B1, B2);
                const polyRes = calculatePolygonProps(psciData.pts);
                
                props.A = polyRes.A;
                props.ys = polyRes.ys;
                props.cb = polyRes.cb;
                props.ct = polyRes.ct;
                props.Iy = polyRes.Iy;
                props.Iz = polyRes.Iz;
                props.Wely_top = polyRes.Wely_top;
                props.Wely_bot = polyRes.Wely_bot;
                props.Wely = polyRes.Wely_bot;
                props.iy = polyRes.iy;
                props.iz = polyRes.iz;
                props.w = (props.A * 1e-6) * gamma;
                props.G = props.w * 101.9716;

                stepsLaTeX = `<p><b>1. Total Section Height ($H$) & Flange Widths:</b></p>
                $$H = HT1 + HT2 + HT3 + HW + HB1 + HB2 + HB3 = ${psciData.H_total.toFixed(1)}\\text{ mm}$$
                $$\\text{Top Width } b_t = W1 + 2 T1 + 2 T2 = ${psciData.W_top.toFixed(1)}\\text{ mm}$$
                $$\\text{Bottom Width } b_b = W1 + 2 B1 + 2 B2 = ${psciData.W_bot.toFixed(1)}\\text{ mm}$$

                <p><b>2. Cross-Sectional Area ($A$) via Green's Polygon Theorem:</b></p>
                $$A = \\frac{1}{2} \\sum_{i=1}^n (x_i y_{i+1} - x_{i+1} y_i) = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2 = ${(props.A/100).toFixed(2)}\\text{ cm}^2$$

                <p><b>3. Centroid Coordinates ($Z_g = c_b, c_t$):</b></p>
                $$c_b = Z_g = ${props.cb.toFixed(1)}\\text{ mm}, \\quad c_t = H - Z_g = ${props.ct.toFixed(1)}\\text{ mm}$$

                <p><b>4. Second Moments of Area ($I_y, I_z$):</b></p>
                $$I_y = ${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4 = ${(props.Iy/10000).toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ cm}^4$$
                $$I_z = ${props.Iz.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4 = ${(props.Iz/10000).toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ cm}^4$$

                <p><b>5. Top and Bottom Elastic Section Moduli ($W_{\\text{el},y,\\text{top}}, W_{\\text{el},y,\\text{bot}}$):</b></p>
                $$W_{\\text{el},y,\\text{top}} = \\frac{I_y}{c_t} = ${props.Wely_top.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^3 = ${(props.Wely_top/1000).toFixed(1)}\\text{ cm}^3$$
                $$W_{\\text{el},y,\\text{bot}} = \\frac{I_y}{c_b} = ${props.Wely_bot.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^3 = ${(props.Wely_bot/1000).toFixed(1)}\\text{ cm}^3$$`;
                break;

            case 'rectangle':
                props.A = b * h;
                props.Iy = (b * Math.pow(h, 3)) / 12;
                props.Wely = props.Iy / (h / 2);
                props.Wply = (b * Math.pow(h, 2)) / 4;
                props.iy = Math.sqrt(props.Iy / props.A);
                props.Iz = (h * Math.pow(b, 3)) / 12;
                props.Welz = props.Iz / (b / 2);
                props.Wplz = (h * Math.pow(b, 2)) / 4;
                props.iz = Math.sqrt(props.Iz / props.A);
                props.ys = h / 2;
                props.zs = b / 2;
                props.w = (props.A * 1e-6) * gamma;
                props.G = props.w * 101.9716;

                stepsLaTeX = `<p><b>1. Cross-Sectional Area ($A$):</b></p>
                $$A = b \\cdot h = ${b.toFixed(1)} \\cdot ${h.toFixed(1)} = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2$$
                <p><b>2. Moments of Inertia ($I_y, I_z$):</b></p>
                $$I_y = \\frac{b \\cdot h^3}{12} = ${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4, \\quad I_z = \\frac{h \\cdot b^3}{12} = ${props.Iz.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4$$`;
                break;

            case 'box':
                const bi = b - 2 * t, hi = h - 2 * t;
                if (bi > 0 && hi > 0) {
                    props.A = (b * h) - (bi * hi);
                    props.Iy = ((b * Math.pow(h, 3)) - (bi * Math.pow(hi, 3))) / 12;
                    props.Wely = props.Iy / (h / 2);
                    props.Wply = (b * Math.pow(h, 2) - bi * Math.pow(hi, 2)) / 4;
                    props.iy = Math.sqrt(props.Iy / props.A);
                    props.Iz = ((h * Math.pow(b, 3)) - (hi * Math.pow(bi, 3))) / 12;
                    props.Welz = props.Iz / (b / 2);
                    props.Wplz = (h * Math.pow(b, 2) - hi * Math.pow(bi, 2)) / 4;
                    props.iz = Math.sqrt(props.Iz / props.A);
                    props.w = (props.A * 1e-6) * gamma;
                    props.G = props.w * 101.9716;

                    stepsLaTeX = `<p><b>1. Net Area ($A$):</b></p>
                    $$A = b \\cdot h - b_{\\text{in}} \\cdot h_{\\text{in}} = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2$$
                    <p><b>2. Moments of Inertia ($I_y, I_z$):</b></p>
                    $$I_y = \\frac{b \\cdot h^3 - b_{\\text{in}} \\cdot h_{\\text{in}}^3}{12} = ${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4$$`;
                }
                break;

            case 'circle':
                props.A = (Math.PI * Math.pow(D, 2)) / 4;
                props.Iy = (Math.PI * Math.pow(D, 4)) / 64;
                props.Iz = props.Iy;
                props.Wely = props.Iy / (D / 2);
                props.Welz = props.Wely;
                props.Wply = Math.pow(D, 3) / 6;
                props.Wplz = props.Wply;
                props.iy = D / 4;
                props.iz = props.iy;
                props.It = (Math.PI * Math.pow(D, 4)) / 32;
                props.w = (props.A * 1e-6) * gamma;
                props.G = props.w * 101.9716;

                stepsLaTeX = `<p><b>1. Area ($A$):</b></p>
                $$A = \\frac{\\pi D^2}{4} = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2$$
                <p><b>2. Moment of Inertia ($I_y = I_z$):</b></p>
                $$I_y = I_z = \\frac{\\pi D^4}{64} = ${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4$$`;
                break;

            case 'pipe':
                const Di = D - 2 * t;
                if (Di > 0) {
                    props.A = (Math.PI / 4) * (Math.pow(D, 2) - Math.pow(Di, 2));
                    props.Iy = (Math.PI / 64) * (Math.pow(D, 4) - Math.pow(Di, 4));
                    props.Iz = props.Iy;
                    props.Wely = props.Iy / (D / 2);
                    props.Welz = props.Wely;
                    props.Wply = (Math.pow(D, 3) - Math.pow(Di, 3)) / 6;
                    props.Wplz = props.Wply;
                    props.iy = Math.sqrt(props.Iy / props.A);
                    props.iz = props.iy;
                    props.It = (Math.PI / 32) * (Math.pow(D, 4) - Math.pow(Di, 4));
                    props.w = (props.A * 1e-6) * gamma;
                    props.G = props.w * 101.9716;

                    stepsLaTeX = `<p><b>1. Area ($A$):</b></p>
                    $$A = \\frac{\\pi}{4} (D^2 - d_{\\text{in}}^2) = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2$$
                    <p><b>2. Moment of Inertia ($I_y = I_z$):</b></p>
                    $$I_y = I_z = \\frac{\\pi}{64} (D^4 - d_{\\text{in}}^4) = ${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4$$`;
                }
                break;

            case 'channel':
                props.A = 2 * (b * tf) + (h - 2 * tf) * tw;
                props.Iy = (b * Math.pow(h, 3) - (b - tw) * Math.pow(h - 2 * tf, 3)) / 12;
                props.Wely = props.Iy / (h / 2);
                props.Wply = b * tf * (h - tf) + (tw * Math.pow(h - 2 * tf, 2)) / 4;
                props.iy = Math.sqrt(props.Iy / props.A);
                props.ys = (2 * (b * tf) * (b / 2) + (h - 2 * tf) * tw * (tw / 2)) / props.A;
                props.Iz = (2 * tf * Math.pow(b, 3) + (h - 2 * tf) * Math.pow(tw, 3)) / 3 - props.A * Math.pow(props.ys, 2);
                props.Welz = props.Iz / Math.max(props.ys, b - props.ys);
                props.iz = Math.sqrt(props.Iz / props.A);
                props.w = (props.A * 1e-6) * gamma;
                props.G = props.w * 101.9716;

                stepsLaTeX = `<p><b>1. Area ($A$):</b></p>
                $$A = 2 b t_f + (h - 2 t_f) t_w = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2$$
                <p><b>2. Centroid ($y_s$):</b></p>
                $$y_s = ${props.ys.toFixed(1)}\\text{ mm}$$
                <p><b>3. Inertia ($I_y$):</b></p>
                $$I_y = ${props.Iy.toLocaleString('en-US', {maximumFractionDigits:0})}\\text{ mm}^4$$`;
                break;

            case 'tee':
                const A1 = b * tf, y1 = h - tf / 2;
                const A2 = tw * (h - tf), y2 = (h - tf) / 2;
                props.A = A1 + A2;
                props.ys = (A1 * y1 + A2 * y2) / props.A;
                const Ix1 = (b * Math.pow(tf, 3)) / 12 + A1 * Math.pow(y1 - props.ys, 2);
                const Ix2 = (tw * Math.pow(h - tf, 3)) / 12 + A2 * Math.pow(y2 - props.ys, 2);
                props.Iy = Ix1 + Ix2;
                props.Wely = props.Iy / Math.max(props.ys, h - props.ys);
                props.iy = Math.sqrt(props.Iy / props.A);
                props.Iz = (tf * Math.pow(b, 3) + (h - tf) * Math.pow(tw, 3)) / 12;
                props.Welz = props.Iz / (b / 2);
                props.iz = Math.sqrt(props.Iz / props.A);
                props.w = (props.A * 1e-6) * gamma;
                props.G = props.w * 101.9716;

                stepsLaTeX = `<p><b>1. Area ($A$):</b></p>
                $$A = b t_f + (h - t_f) t_w = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2$$
                <p><b>2. Centroid ($y_s$):</b></p>
                $$y_s = \\frac{A_1 y_1 + A_2 y_2}{A} = ${props.ys.toFixed(1)}\\text{ mm}$$`;
                break;

            case 'angle':
                const Aa1 = tw * (h - tw), ya1 = tw + (h - tw) / 2;
                const Aa2 = b * tw, ya2 = tw / 2;
                props.A = Aa1 + Aa2;
                props.ys = (Aa1 * ya1 + Aa2 * ya2) / props.A;
                props.zs = (Aa1 * (tw / 2) + Aa2 * (b / 2)) / props.A;
                const Ixa1 = (tw * Math.pow(h - tw, 3)) / 12 + Aa1 * Math.pow(ya1 - props.ys, 2);
                const Ixa2 = (b * Math.pow(tw, 3)) / 12 + Aa2 * Math.pow(ya2 - props.ys, 2);
                props.Iy = Ixa1 + Ixa2;
                props.Wely = props.Iy / Math.max(props.ys, h - props.ys);
                props.iy = Math.sqrt(props.Iy / props.A);
                const Iza1 = ((h - tw) * Math.pow(tw, 3)) / 12 + Aa1 * Math.pow(tw / 2 - props.zs, 2);
                const Iza2 = (tw * Math.pow(b, 3)) / 12 + Aa2 * Math.pow(b / 2 - props.zs, 2);
                props.Iz = Iza1 + Iza2;
                props.Welz = props.Iz / Math.max(props.zs, b - props.zs);
                props.iz = Math.sqrt(props.Iz / props.A);
                props.w = (props.A * 1e-6) * gamma;
                props.G = props.w * 101.9716;

                stepsLaTeX = `<p><b>1. Area ($A$):</b></p>
                $$A = ${props.A.toLocaleString('en-US', {maximumFractionDigits:1})}\\text{ mm}^2$$
                <p><b>2. Centroids ($y_s, z_s$):</b></p>
                $$y_s = ${props.ys.toFixed(1)}\\text{ mm}, \\quad z_s = ${props.zs.toFixed(1)}\\text{ mm}$$`;
                break;
        }
    }

    const cardsList = [];

    if (props.G !== undefined) cardsList.push({ label: 'Linear Mass (<i>G</i>)', val: formatCardVal(props.G, 'weight', baseUnit) });
    if (props.w !== undefined) cardsList.push({ label: 'Self-Weight Load (<i>w</i>)', val: formatCardVal(props.w, 'load', baseUnit) });
    if (props.A !== undefined) cardsList.push({ label: 'Cross Area (<i>A</i>)', val: formatCardVal(props.A, 'area', baseUnit) });

    // Output Strong Inertia without the forced red highlight border
    if (props.Iy !== undefined) cardsList.push({ label: 'Strong Inertia (<i>I<sub>y</sub></i>)', val: formatCardVal(props.Iy, 'inertia', baseUnit) });

    if (activeShape === 'psci') {
        if (props.Wely_top !== undefined) cardsList.push({ label: 'Top Modulus (<i>W<sub>el.y.top</sub></i>)', val: formatCardVal(props.Wely_top, 'modulus', baseUnit) });
        if (props.Wely_bot !== undefined) cardsList.push({ label: 'Bottom Modulus (<i>W<sub>el.y.bot</sub></i>)', val: formatCardVal(props.Wely_bot, 'modulus', baseUnit) });
        if (props.ct !== undefined) cardsList.push({ label: 'Top Fibre Dist (<i>c<sub>t</sub></i>)', val: formatCardVal(props.ct, 'length', baseUnit) });
        if (props.cb !== undefined) cardsList.push({ label: 'Bottom Fibre Dist (<i>c<sub>b</sub></i>)', val: formatCardVal(props.cb, 'length', baseUnit) });
    } else {
        if (props.Wely !== undefined) cardsList.push({ label: 'Elastic Modulus (<i>W<sub>el.y</sub></i>)', val: formatCardVal(props.Wely, 'modulus', baseUnit) });
        if (props.Wply !== undefined) cardsList.push({ label: 'Plastic Modulus (<i>W<sub>pl.y</sub></i>)', val: formatCardVal(props.Wply, 'modulus', baseUnit) });
    }

    if (props.iy !== undefined) cardsList.push({ label: 'Gyration Radius (<i>i<sub>y</sub></i>)', val: formatCardVal(props.iy, 'length', baseUnit) });

    if (props.Iz !== undefined) cardsList.push({ label: 'Weak Inertia (<i>I<sub>z</sub></i>)', val: formatCardVal(props.Iz, 'inertia', baseUnit) });
    if (props.Welz !== undefined) cardsList.push({ label: 'Elastic Modulus (<i>W<sub>el.z</sub></i>)', val: formatCardVal(props.Welz, 'modulus', baseUnit) });
    if (props.Wplz !== undefined) cardsList.push({ label: 'Plastic Modulus (<i>W<sub>pl.z</sub></i>)', val: formatCardVal(props.Wplz, 'modulus', baseUnit) });
    if (props.iz !== undefined) cardsList.push({ label: 'Gyration Radius (<i>i<sub>z</sub></i>)', val: formatCardVal(props.iz, 'length', baseUnit) });

    if (props.Avz !== undefined) cardsList.push({ label: 'Shear Area (<i>A<sub>vz</sub></i>)', val: formatCardVal(props.Avz, 'area', baseUnit) });
    if (props.It !== undefined) cardsList.push({ label: 'Torsion Constant (<i>I<sub>t</sub></i>)', val: formatCardVal(props.It, 'inertia', baseUnit) });
    if (props.Iw !== undefined) cardsList.push({ label: 'Warping Constant (<i>I<sub>w</sub></i>)', val: formatCardVal(props.Iw, 'warping', baseUnit) });

    if (activeShape !== 'psci') {
        if (props.ys !== undefined) cardsList.push({ label: 'Centroid (<i>y<sub>s</sub></i>)', val: formatCardVal(props.ys, 'length', baseUnit) });
        if (props.zs !== undefined) cardsList.push({ label: 'Centroid (<i>z<sub>s</sub></i>)', val: formatCardVal(props.zs, 'length', baseUnit) });
    }

    renderResultCards(cardsList);
    
    if (calcSteps) {
        calcSteps.innerHTML = stepsLaTeX;
        if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
            window.MathJax.typesetPromise([calcSteps]).catch((err) => console.log(err));
        }
    }

    const effectiveH = psciData ? psciData.H_total : h;
    drawSection(b, effectiveH, D, t, tw, tf, props.cb || props.ys || (effectiveH / 2), props.ct || (effectiveH / 2), props.zs || (b / 2), psciData);
}

function drawSection(b, h, D, t, tw, tf, cb, ct, zs, psciData) {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width;
    const H = canvas.height;
    const centerX = W / 2;
    const centerY = H / 2;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.0;
    for (let x = 0; x <= W; x += 75) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 75) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    let maxDim = 1;
    if (['circle', 'pipe'].includes(activeShape)) {
        maxDim = D;
    } else if (activeShape === 'psci' && psciData) {
        maxDim = Math.max(psciData.W_top, psciData.W_bot, psciData.H_total);
    } else {
        maxDim = Math.max(b, h);
    }

    const scale = 340 / (maxDim || 1);

    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;

    if (activeShape === 'rectangle') {
        const dW = b * scale, dH = h * scale;
        ctx.beginPath();
        ctx.rect(centerX - dW / 2, centerY - dH / 2, dW, dH);
        ctx.fill(); ctx.stroke();
    } else if (activeShape === 'box') {
        const dW = b * scale, dH = h * scale, dT = t * scale;
        ctx.beginPath();
        ctx.rect(centerX - dW / 2, centerY - dH / 2, dW, dH);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.rect(centerX - dW / 2 + dT, centerY - dH / 2 + dT, dW - 2 * dT, dH - 2 * dT);
        ctx.fill(); ctx.stroke();
    } else if (activeShape === 'circle') {
        const R = (D * scale) / 2;
        ctx.beginPath(); ctx.arc(centerX, centerY, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    } else if (activeShape === 'pipe') {
        const R = (D * scale) / 2, r = R - t * scale;
        ctx.beginPath(); ctx.arc(centerX, centerY, R, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.arc(centerX, centerY, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    } else if (activeShape === 'ibeam') {
        const dW = b * scale, dH = h * scale, dTw = tw * scale, dTf = tf * scale;
        ctx.beginPath();
        ctx.moveTo(centerX - dW / 2, centerY - dH / 2);
        ctx.lineTo(centerX + dW / 2, centerY - dH / 2);
        ctx.lineTo(centerX + dW / 2, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX + dTw / 2, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX + dTw / 2, centerY + dH / 2 - dTf);
        ctx.lineTo(centerX + dW / 2, centerY + dH / 2 - dTf);
        ctx.lineTo(centerX + dW / 2, centerY + dH / 2);
        ctx.lineTo(centerX - dW / 2, centerY + dH / 2);
        ctx.lineTo(centerX - dW / 2, centerY + dH / 2 - dTf);
        ctx.lineTo(centerX - dTw / 2, centerY + dH / 2 - dTf);
        ctx.lineTo(centerX - dTw / 2, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX - dW / 2, centerY - dH / 2 + dTf);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
    } else if (activeShape === 'psci' && psciData) {
        ctx.beginPath();
        psciData.pts.forEach((pt, idx) => {
            const px = centerX + pt[0] * scale;
            const py = centerY + (h / 2 - pt[1]) * scale;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill(); ctx.stroke();
    } else if (activeShape === 'tee') {
        const dW = b * scale, dH = h * scale, dTw = tw * scale, dTf = tf * scale;
        ctx.beginPath();
        ctx.moveTo(centerX - dW / 2, centerY - dH / 2);
        ctx.lineTo(centerX + dW / 2, centerY - dH / 2);
        ctx.lineTo(centerX + dW / 2, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX + dTw / 2, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX + dTw / 2, centerY + dH / 2);
        ctx.lineTo(centerX - dTw / 2, centerY + dH / 2);
        ctx.lineTo(centerX - dTw / 2, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX - dW / 2, centerY - dH / 2 + dTf);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
    } else if (activeShape === 'channel') {
        const dW = b * scale, dH = h * scale, dTw = tw * scale, dTf = tf * scale;
        ctx.beginPath();
        ctx.moveTo(centerX - dW / 2, centerY - dH / 2);
        ctx.lineTo(centerX - dW / 2 + dW, centerY - dH / 2);
        ctx.lineTo(centerX - dW / 2 + dW, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX - dW / 2 + dTw, centerY - dH / 2 + dTf);
        ctx.lineTo(centerX - dW / 2 + dTw, centerY + dH / 2 - dTf);
        ctx.lineTo(centerX - dW / 2 + dW, centerY + dH / 2 - dTf);
        ctx.lineTo(centerX - dW / 2 + dW, centerY + dH / 2);
        ctx.lineTo(centerX - dW / 2, centerY + dH / 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
    } else if (activeShape === 'angle') {
        const dW = b * scale, dH = h * scale, dT = t * scale;
        ctx.beginPath();
        ctx.moveTo(centerX - dW / 2, centerY - dH / 2);
        ctx.lineTo(centerX - dW / 2 + dT, centerY - dH / 2);
        ctx.lineTo(centerX - dW / 2 + dT, centerY + dH / 2 - dT);
        ctx.lineTo(centerX - dW / 2 + dW, centerY + dH / 2 - dT);
        ctx.lineTo(centerX - dW / 2 + dW, centerY + dH / 2);
        ctx.lineTo(centerX - dW / 2, centerY + dH / 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
    }

    const centroidY = ['tee', 'angle', 'psci'].includes(activeShape) 
        ? centerY + (h * scale) / 2 - (cb * scale) 
        : centerY;

    const centroidX = ['channel', 'angle'].includes(activeShape)
        ? centerX - (b * scale) / 2 + (zs * scale)
        : centerX;

    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.8;
    
    ctx.beginPath(); ctx.moveTo(25, centroidY); ctx.lineTo(W - 25, centroidY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(centroidX, 25); ctx.lineTo(centroidX, H - 25); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#d97706';
    ctx.beginPath(); ctx.arc(centroidX, centroidY, 5, 0, 2 * Math.PI); ctx.fill();

    // Swapped PNA to Centroid S notation
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('y - y', W - 40, centroidY - 8);
    ctx.fillText('z - z', centroidX + 8, 35);
    ctx.fillText('S', centroidX + 10, centroidY + 16);

    // Removed C_t and C_b from Angle & Tee, kept ONLY for PSCI
    if (activeShape === 'psci') {
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 11px monospace';
        const topY = centerY - (h * scale) / 2;
        const botY = centerY + (h * scale) / 2;
        ctx.fillText(`c_t = ${ct.toFixed(0)}`, 35, topY + 20);
        ctx.fillText(`c_b = ${cb.toFixed(0)}`, 35, botY - 15);
    }
}

addSafeListener(screenshotBtn, 'click', () => { window.print(); });

// Initial Load
updateLegendVisibility();
populateCatalogue();
updateCalculator();