import { ADI, setADIProperties } from "./ADI.js";
import { describe, test, expect } from "vitest";

const testWindow = 5; // seconds
const deltaT = 0.05; // seconds
const numOfTimeLapses = Math.round(testWindow / deltaT); // number of time lapses to test
const timeLapses = Array.from({ length: numOfTimeLapses }, (_, i) => (i + 1) * deltaT);

function eigenFunction(m, n, WIDTH, HEIGHT, deltaX) {
    const Lx = WIDTH * deltaX;
    const Ly = HEIGHT * deltaX;
    const concentrationField = new Float64Array(WIDTH * HEIGHT);
    const nPi_Lx = (Math.PI * n) / Lx;
    const mPi_Ly = (Math.PI * m) / Ly;

    for (let j = 0; j < HEIGHT; j++) {
        for (let i = 0; i < WIDTH; i++) {
            const x = (i + 0.5) * deltaX;
            const y = (j + 0.5) * deltaX;
            concentrationField[j * WIDTH + i] = Math.cos(nPi_Lx * x) * Math.cos(mPi_Ly * y); // Cosine eigenfunctions for Neumann (reflective) BCs
        }
    }
    return concentrationField;
}

function eigenValue(m, n, WIDTH, HEIGHT, deltaX) {
    const Lx = WIDTH * deltaX;
    const Ly = HEIGHT * deltaX;
    return Math.PI * Math.PI * ((n * n) / (Lx * Lx) + (m * m) / (Ly * Ly));
}

function exponentialDecayInTime(eigenvalue, time, diffusionRate, decayRate = 0) {
    return Math.exp(-(diffusionRate * eigenvalue  + decayRate ) * time);
}

function analyticalSolution(initialConcentration, expTerm) {
    const length = initialConcentration.length;
    const result = new Float64Array(length);
    for (let idx = 0; idx < length; idx++) {
        result[idx] = initialConcentration[idx] * expTerm; //when initial condition is an eigenfunction, the solution is a simple multiplication
    }
    return result; 
}

describe("Without sources or sinks, zero mode numbers", () => {
    const DIFFUSION_RATE = 1; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const RMSTolerance = 1e-3;
    const MaxErrTolerance = 2e-3;
    const WIDTH = 100;
    const HEIGHT = 60;

    test.each(timeLapses)(
        "%s sec - ADI matches analytical solution",
        (timeLapse) => {
            // Arrange
            const sources = new Float64Array(WIDTH * HEIGHT).fill(0); // No sources or sinks
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
            const m = 0;
            const n = 0;
            const iterations = Math.round(timeLapse / deltaT);
            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);
            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE);
            const analytical = analyticalSolution(initial, expTerm);

            // Act

            const resultADI = ADI(initial, sources, iterations, true);

            // Assert L2 norm (root mean square error) and Max Error
            let sumSquaredErrors = 0;
            let maxError = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const error = resultADI[idx] - analytical[idx];
                    sumSquaredErrors += error * error;
                    if (Math.abs(error) > maxError) {
                        maxError = Math.abs(error);
                    }
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            

            expect(rmsError).toBeLessThan(RMSTolerance);
            expect(maxError).toBeLessThan(MaxErrTolerance);
        }
    );
});


describe("Without sources or sinks, low mode numbers", () => {
    const DIFFUSION_RATE = 1; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const RMSTolerance = 1e-3;
    const MaxErrTolerance = 2e-3;
    const WIDTH = 100;
    const HEIGHT = 60;

    test.each(timeLapses)(
        "%s sec - ADI matches analytical solution",
        (timeLapse) => {
            // Arrange
            const sources = new Float64Array(WIDTH * HEIGHT).fill(0); // No sources or sinks
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
            const m = 3;
            const n = 3;
            const iterations = Math.round(timeLapse / deltaT);
            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);
            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE);
            const analytical = analyticalSolution(initial, expTerm);

            // Act

            const resultADI = ADI(initial, sources, iterations, true);

            // Assert L2 norm (root mean square error) and Max Error
            let sumSquaredErrors = 0;
            let maxError = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const error = resultADI[idx] - analytical[idx];
                    sumSquaredErrors += error * error;
                    if (Math.abs(error) > maxError) {
                        maxError = Math.abs(error);
                    }
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            

            expect(rmsError).toBeLessThan(RMSTolerance);
            expect(maxError).toBeLessThan(MaxErrTolerance);
        }
    );
});

describe("Without sources or sinks, higher mode numbers", () => {
    const DIFFUSION_RATE = 1; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const RMSTolerance = 1e-3;
    const MaxErrTolerance = 2e-3;
    const WIDTH = 100;
    const HEIGHT = 60;
        test.each(timeLapses)(
        "%s sec - ADI matches analytical solution with higher mode numbers",
        (timeLapse) => {
            // Arrange
            const sources = new Float64Array(WIDTH * HEIGHT).fill(0); // No sources or sinks
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
            const m = 5;
            const n = 5;
            const iterations = Math.round(timeLapse / deltaT);
            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);
            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE);
            const analytical = analyticalSolution(initial, expTerm);

            // Act

            const resultADI = ADI(initial, sources, iterations, true);

            // Assert L2 norm (root mean square error) and max error
            let sumSquaredErrors = 0;
            let maxError = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const error = resultADI[idx] - analytical[idx];
                    sumSquaredErrors += error * error;
                    if (Math.abs(error) > maxError) {
                        maxError = Math.abs(error);
                    }
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            

            expect(rmsError).toBeLessThan(RMSTolerance);
            expect(maxError).toBeLessThan(MaxErrTolerance);
        }
    );
});


describe("Without sources or sinks, high diffusion rate", () => {
    const DIFFUSION_RATE = 100; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const RMSTolerance = 1e-3;
    const MaxErrTolerance = 2e-3;
    const WIDTH = 100;
    const HEIGHT = 60;
        test.each(timeLapses)(
        "%s sec - ADI matches analytical solution with higher mode numbers",
        (timeLapse) => {
            // Arrange
            const sources = new Float64Array(WIDTH * HEIGHT).fill(0); // No sources or sinks
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
            const m = 5;
            const n = 5;
            const iterations = Math.round(timeLapse / deltaT);
            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);
            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE);
            const analytical = analyticalSolution(initial, expTerm);

            // Act

            const resultADI = ADI(initial, sources, iterations, true);

            // Assert L2 norm (root mean square error) and max error
            let sumSquaredErrors = 0;
            let maxError = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const error = resultADI[idx] - analytical[idx];
                    sumSquaredErrors += error * error;
                    if (Math.abs(error) > maxError) {
                        maxError = Math.abs(error);
                    }
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            

            expect(rmsError).toBeLessThan(RMSTolerance);
            expect(maxError).toBeLessThan(MaxErrTolerance);
        }
    );
});

describe("Conservation of mass", () => {
    const DIFFUSION_RATE = 100; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const WIDTH = 100;
    const HEIGHT = 60;
        test.each(timeLapses)(
        "%s sec - ADI matches analytical solution with higher mode numbers",
        (timeLapse) => {
            // Arrange
            const sources = new Float64Array(WIDTH * HEIGHT).fill(0); // No sources or sinks
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
            const m = 5;
            const n = 5;
            const iterations = Math.round(timeLapse / deltaT);
            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);
            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE);
            const analytical = analyticalSolution(initial, expTerm);

            // Act

            const resultADI = ADI(initial, sources, iterations, true);

            // Assert
            let massSum = 0;
            let analyticalMassSum = 0; 
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    massSum += resultADI[idx];
                    analyticalMassSum += analytical[idx];
                }
            }

            expect(massSum).toBeCloseTo(0, 10); // should be zero for cosine functions with non-zero mode numbers
            expect(analyticalMassSum).toBeCloseTo(0, 10); // should be zero for cosine functions with non-zero mode numbers
        }
    );
});


describe("Without sources or sinks, with decay rate", () => {
    const DIFFUSION_RATE = 1; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const RMSTolerance = 1e-3;
    const MaxErrTolerance = 2e-3;
    const WIDTH = 100;
    const HEIGHT = 60;
    const DECAY_RATE = 1; // per second
        test.each(timeLapses)(
        "%s sec - ADI matches analytical solution with higher mode numbers",
        (timeLapse) => {
            // Arrange
            const sources = new Float64Array(WIDTH * HEIGHT).fill(0); // No sources or sinks
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT, DECAY_RATE);
            const m = 5;
            const n = 5;
            const iterations = Math.round(timeLapse / deltaT);
            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);
            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE, DECAY_RATE);
            const analytical = analyticalSolution(initial, expTerm);

            // Act

            const resultADI = ADI(initial, sources, iterations, true);

            // Assert L2 norm (root mean square error) and max error
            let sumSquaredErrors = 0;
            let maxError = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const error = resultADI[idx] - analytical[idx];
                    sumSquaredErrors += error * error;
                    if (Math.abs(error) > maxError) {
                        maxError = Math.abs(error);
                    }
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            

            expect(rmsError).toBeLessThan(RMSTolerance);
            expect(maxError).toBeLessThan(MaxErrTolerance);
        }
    );
});

describe("Without sources or sinks, with high decay rate and low diffusion", () => {
    const DIFFUSION_RATE = 0.01; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const RMSTolerance = 1e-3;
    const MaxErrTolerance = 2e-3;
    const WIDTH = 100;
    const HEIGHT = 60;
    const DECAY_RATE = 10; // per second
        test.each(timeLapses)(
        "%s sec - ADI matches analytical solution with higher mode numbers",
        (timeLapse) => {
            // Arrange
            const sources = new Float64Array(WIDTH * HEIGHT).fill(0); // No sources or sinks
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT, DECAY_RATE);
            const m = 5;
            const n = 5;
            const iterations = Math.round(timeLapse / deltaT);
            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);
            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE, DECAY_RATE);
            const analytical = analyticalSolution(initial, expTerm);

            // Act

            const resultADI = ADI(initial, sources, iterations, true);

            // Assert L2 norm (root mean square error) and max error
            let sumSquaredErrors = 0;
            let maxError = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const error = resultADI[idx] - analytical[idx];
                    sumSquaredErrors += error * error;
                    if (Math.abs(error) > maxError) {
                        maxError = Math.abs(error);
                    }
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            

            expect(rmsError).toBeLessThan(RMSTolerance);
            expect(maxError).toBeLessThan(MaxErrTolerance);
        }
    );
});