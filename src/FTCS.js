const WIDTH = 100; // Width of the grid
const HEIGHT = 60; // Height of the grid

export const FTCS = (concentrationData, sources, deltaX, deltaT, DIFFUSION_RATE, timeLapse) => {
    const n = WIDTH * HEIGHT;

    const maxDeltaT = (0.03 * deltaX * deltaX) / (4 * DIFFUSION_RATE); // Time step based on stability condition

    const totalNumberOfIterations = Math.round(timeLapse / maxDeltaT); // Number of iterations required to cover the time lapse
    const currentConcentrationData = new Float64Array(concentrationData);
    const newConcentrationData = new Float64Array(n);

    for (let iteration = 0; iteration < totalNumberOfIterations; iteration++) {
        for (let j = 0; j < HEIGHT; j++) {
            for (let i = 0; i < WIDTH; i++) {
                const idx = j * WIDTH + i;

                // Handle x-direction terms with proper Neumann boundary conditions
                let right =
                    i >= WIDTH - 1
                        ? currentConcentrationData[idx]
                        : currentConcentrationData[j * WIDTH + (i + 1)];
                let left =
                    i <= 0
                        ? currentConcentrationData[idx]
                        : currentConcentrationData[j * WIDTH + (i - 1)];

                // Handle y-direction terms with proper Neumann boundary conditions
                let bottom =
                    j <= 0
                        ? currentConcentrationData[idx]
                        : currentConcentrationData[(j - 1) * WIDTH + i];
                let top =
                    j >= HEIGHT - 1
                        ? currentConcentrationData[idx]
                        : currentConcentrationData[(j + 1) * WIDTH + i];

                newConcentrationData[idx] =
                    currentConcentrationData[idx] +
                    ((DIFFUSION_RATE * maxDeltaT) / (deltaX * deltaX)) *
                        (left + right + bottom + top - 4 * currentConcentrationData[idx]) +
                    sources[idx] * maxDeltaT;
                if (newConcentrationData[idx] < 0) {
                    newConcentrationData[idx] = 0; // Ensure concentration doesn't go negative
                    console.warn("Concentration went negative at FTCS");
                }
            }
        }

        for (let idx = 0; idx < n; idx++) {
            currentConcentrationData[idx] = newConcentrationData[idx];
        }
    }

    return currentConcentrationData;
};
