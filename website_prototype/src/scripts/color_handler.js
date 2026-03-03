document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('color-switch-button');
    const reset = document.getElementById("color-reset-button");
    const ctrlz = document.getElementById("last-color-button");
    const root = document.documentElement;

    const initialValues = new Map();
    const styles = getComputedStyle(root);
    Array.from(styles).filter(p => p.startsWith('--') && !p.startsWith('--ol')).forEach(prop => {
        let val = styles.getPropertyValue(prop).trim();
        if (val.includes('oklch')) initialValues.set(prop, val);
    });

    // Récupération de l'état complet
    let currentRotation = parseFloat(localStorage.getItem('prototype-hue-rotation')) || 0;
    let stepDegrees = parseFloat(localStorage.getItem('prototype-hue-step')) || 18;
    // Mode : 'pure' (objectif) ou 'boost' (adaptatif)
    let mode = localStorage.getItem('prototype-mode') || 'boost';

    const updateColors = () => {
        let progress = currentRotation / 360;
        let visualOffset = (progress + 0.1 * Math.sin(2 * Math.PI * progress)) * 360;

        initialValues.forEach((baseValue, propName) => {
            const match = baseValue.match(/oklch\(([^,\s/]+)[\s,]+([^,\s/]+)[\s,]+([^,\s/)]+)/);
            if (match) {
                let [full, l, c, hBase] = match;
                let hNumeric = parseFloat(hBase);
                let lNumeric = parseFloat(l);
                let newHue = (hNumeric + visualOffset) % 360;

                let finalL = lNumeric;

                // Application du boost seulement si le mode n'est pas "objectif" (pure)
                if (mode === 'boost') {
                    let distToYellow = Math.abs(((newHue - 95 + 180) % 360) - 180);
                    let lBoostBase = distToYellow < 60 ? Math.cos(distToYellow * Math.PI / 120) * 0.20 : 0;
                    let adaptiveBoost = lBoostBase * (1 - lNumeric);
                    finalL = Math.min(0.98, lNumeric + adaptiveBoost);
                }

                root.style.setProperty(propName, `oklch(${finalL.toFixed(3)} ${c} ${newHue.toFixed(2)}deg)`);

                if (propName === "--main-bg-color") {
                    console.log(`%c Mode: ${mode.toUpperCase()} | Hue: ${newHue.toFixed(0)}°`,
                        `color: oklch(${finalL} ${c} ${newHue}deg); font-weight: bold; background: #222; padding: 2px;`);
                }
            }
        });
    };

    if (!btn) return;
    if (currentRotation > 0) updateColors();

    btn.addEventListener('click', () => {
        if (currentRotation === 0) {
            // Demande du pourcentage
            let pInput = prompt("Pourcentage de saut (ex: 5 pour 18°)", "5");
            let percent = parseFloat(pInput) || 5;
            stepDegrees = (percent / 100) * 360;

            // Demande du mode
            let mInput = prompt("Mode de rendu ? \n1: Adaptatif (Boost luminance) \n2: Objectif (OKLCH pur)", "1");
            mode = (mInput === "2") ? "pure" : "boost";

            localStorage.setItem('prototype-hue-step', stepDegrees);
            localStorage.setItem('prototype-mode', mode);
        }

        currentRotation += stepDegrees;

        if (currentRotation >= 360) {
            alert(`Tour complet fini en mode ${mode} !`);
            resetState();
        } else {
            localStorage.setItem('prototype-hue-rotation', currentRotation);
            updateColors();
        }
    });

    const resetState = () => {
        currentRotation = 0;
        root.removeAttribute('style');
        localStorage.clear(); // Nettoie tout pour le prochain prompt
    };

    ctrlz.addEventListener('click', () => {
        currentRotation = Math.max(0, currentRotation - stepDegrees);
        localStorage.setItem('prototype-hue-rotation', currentRotation);
        updateColors();
    });

    reset.addEventListener('click', resetState);
});