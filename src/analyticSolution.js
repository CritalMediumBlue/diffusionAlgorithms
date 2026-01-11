

function constantSourceTermOptimized(n, m, Lx, Ly, sources, activeSourceIndices, cosX, cosY, WIDTH) {
    const e_n = n === 0 ? 0.5 : 1;
    const e_m = m === 0 ? 0.5 : 1;
    const coefficient = (4 * e_n * e_m) / (Lx * Ly);
    let sum = 0;

    for (const idx of activeSourceIndices) {
        const i = idx % WIDTH;
        const j = Math.floor(idx / WIDTH);
        sum += sources[idx] * cosX[n][i] * cosY[m][j];
    }

    return coefficient * sum;
}

export const analyticSteadyState = (
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

    // Early return if no sources
    if (activeSourceIndices.length === 0) {
        return steadyStateConcentration;
    }

    const Lx = WIDTH * deltaX;
    const Ly = HEIGHT * deltaX;
    const piSquared = Math.PI * Math.PI;
    const LxSquared = Lx * Lx;
    const LySquared = Ly * Ly;
    const invLxSquared = 1 / LxSquared;
    const invLySquared = 1 / LySquared;

    // Precompute all x and y coordinates
    const xCoords = new Float64Array(WIDTH);
    const yCoords = new Float64Array(HEIGHT);
    for (let i = 0; i < WIDTH; i++) xCoords[i] = (i + 0.5) * deltaX;
    for (let j = 0; j < HEIGHT; j++) yCoords[j] = (j + 0.5) * deltaX;

    // Precompute cosine values for all modes and positions
    const cosX = Array(maxMode + 1);
    const cosY = Array(maxMode + 1);

    for (let n = 0; n <= maxMode; n++) {
        const nPi_Lx = (Math.PI * n) / Lx;
        cosX[n] = new Float64Array(WIDTH);
        for (let i = 0; i < WIDTH; i++) {
            cosX[n][i] = Math.cos(nPi_Lx * xCoords[i]);
        }
    }

    for (let m = 0; m <= maxMode; m++) {
        const mPi_Ly = (Math.PI * m) / Ly;
        cosY[m] = new Float64Array(HEIGHT);
        for (let j = 0; j < HEIGHT; j++) {
            cosY[m][j] = Math.cos(mPi_Ly * yCoords[j]);
        }
    }

    // Precompute squared mode numbers
    const nSquared = new Float64Array(maxMode + 1);
    const mSquared = new Float64Array(maxMode + 1);
    for (let n = 0; n <= maxMode; n++) nSquared[n] = n * n;
    for (let m = 0; m <= maxMode; m++) mSquared[m] = m * m;

    // Compute steady-state solution
    for (let m = 0; m <= maxMode; m++) {
        for (let n = 0; n <= maxMode; n++) {
            const eigenvalue = piSquared * (nSquared[n] * invLxSquared + mSquared[m] * invLySquared);
            const K_mn = DIFFUSION_RATE * eigenvalue + DECAY_RATE;
            const Q_mn = constantSourceTermOptimized(
                n,
                m,
                Lx,
                Ly,
                sources,
                activeSourceIndices,
                cosX,
                cosY,
                WIDTH
            );
            const amplitude = Q_mn / K_mn;

            // Skip modes with negligible contribution
            if (Math.abs(amplitude) < 1e-15) continue;

            // Compute and accumulate eigenfunction values directly
            for (let j = 0; j < HEIGHT; j++) {
                const cosYval = cosY[m][j];
                for (let i = 0; i < WIDTH; i++) {
                    steadyStateConcentration[j * WIDTH + i] += amplitude * cosX[n][i] * cosYval;
                }
            }
        }
    }

    return steadyStateConcentration;
};
