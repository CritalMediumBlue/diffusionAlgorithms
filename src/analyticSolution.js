// Analytic steady-state solution for 2D diffusion equation with constant sources and constant decay rate
function eigenFunction(n, m, WIDTH, HEIGHT, deltaX) {
    const concentrationField = new Float64Array(WIDTH * HEIGHT);

    for (let j = 0; j < HEIGHT; j++) {
        for (let i = 0; i < WIDTH; i++) {
            const x = (i + 0.5) * deltaX;
            const y = (j + 0.5) * deltaX;
            concentrationField[j * WIDTH + i] = eigenFunctionAtLocation(
                n,
                m,
                x,
                y,
                WIDTH,
                HEIGHT,
                deltaX
            );
        }
    }
    return concentrationField;
}

function eigenFunctionAtLocation(n, m, x, y, WIDTH, HEIGHT, deltaX) {
    const Lx = WIDTH * deltaX;
    const Ly = HEIGHT * deltaX;
    const nPi_Lx = (Math.PI * n) / Lx;
    const mPi_Ly = (Math.PI * m) / Ly;
    return Math.cos(nPi_Lx * x) * Math.cos(mPi_Ly * y); // Cosine eigenfunctions for Neumann (reflective) BCs
}

function eigenValue(n, m, WIDTH, HEIGHT, deltaX) {
    const Lx = WIDTH * deltaX;
    const Ly = HEIGHT * deltaX;
    return Math.PI * Math.PI * ((n * n) / (Lx * Lx) + (m * m) / (Ly * Ly));
}

function k_mn(diffusionRate, eigenvalue, decayRate) {
    return diffusionRate * eigenvalue + decayRate;
}

function constantSourceTerm(n, m, WIDTH, HEIGHT, deltaX, sources, activeSourceIndices = null) {
    const e_n = n === 0 ? 1 / 2 : 1;
    const e_m = m === 0 ? 1 / 2 : 1;
    const Lx = WIDTH * deltaX;
    const Ly = HEIGHT * deltaX;
    const coefficient = (4 * e_n * e_m) / (Lx * Ly);
    let sum = 0;

    for (const idx of activeSourceIndices) {
        const i = idx % WIDTH;
        const j = Math.floor(idx / WIDTH);
        const x = (i + 0.5) * deltaX;
        const y = (j + 0.5) * deltaX;
        sum += sources[idx] * eigenFunctionAtLocation(n, m, x, y, WIDTH, HEIGHT, deltaX); //sources[idx] represents the total rate injected into that cell
    }

    return coefficient * sum;
}

export const analiticSteadyState = (
    WIDTH,
    HEIGHT,
    DIFFUSION_RATE,
    DECAY_RATE,
    deltaX,
    sources, // sources representing rate per cell (not per unit area)
    maxMode
) => {
    const steadyStateConcentration = new Float64Array(WIDTH * HEIGHT).fill(0);

    // Precompute non-zero source locations
    const activeSourceIndices = [];
    for (let idx = 0; idx < sources.length; idx++) {
        if (sources[idx] !== 0) activeSourceIndices.push(idx);
    }

    for (let m = 0; m <= maxMode; m++) {
        for (let n = 0; n <= maxMode; n++) {
            const eigenvalue = eigenValue(n, m, WIDTH, HEIGHT, deltaX);
            const K_mn = k_mn(DIFFUSION_RATE, eigenvalue, DECAY_RATE);
            const Q_mn = constantSourceTerm(
                n,
                m,
                WIDTH,
                HEIGHT,
                deltaX,
                sources,
                activeSourceIndices
            );
            const amplitude = Q_mn / K_mn;

            const eigenFunc = eigenFunction(n, m, WIDTH, HEIGHT, deltaX);

            for (let idx = 0; idx < WIDTH * HEIGHT; idx++) {
                steadyStateConcentration[idx] += amplitude * eigenFunc[idx];
            }
        }
    }

    return steadyStateConcentration;
};
