import { ADI, setADIProperties } from "./extracellular/ADI.js";
import { describe, test, expect } from "vitest";

const DIFFUSION_RATE = 30; // micrometer^2 / second
const deltaX = 1; // micrometers
const deltaT = 0.1; // seconds

const timeLapses = [];
const testWindow = 4; // seconds
const intervals = Math.round(testWindow / deltaT);
const minTimeLapse = 0; // seconds

for (let i = 0; i <= intervals; i++) {
    timeLapses.push(minTimeLapse + i * deltaT);
}

function generateSourcesAndSinks(width, height, numberOfSourceSinkPairs, maxAccumulation = 5) {
    const totalCells = width * height;
    const sources = new Float64Array(totalCells).fill(0);
    let remainingPairs = numberOfSourceSinkPairs;

    while (remainingPairs > 0) {
        const sourceIndex = Math.floor(Math.random() * totalCells);
        const sinkIndex = Math.floor(Math.random() * totalCells);
        if (
            Math.abs(sources[sourceIndex]) < maxAccumulation &&
            Math.abs(sources[sinkIndex]) < maxAccumulation
        ) {
            const sourceStrength = maxAccumulation * Math.random();
            sources[sourceIndex] += sourceStrength;
            sources[sinkIndex] -= sourceStrength;
            remainingPairs--;
        }
    }

    return sources;
}

describe("ADI method vs Analytical solutions to waves ", () => {
    const tolerance = 1e-2;
    const WIDTH = 100;
    const HEIGHT = 60;
    const NUM_PAIRS = 0;
    const maxSourceStrength = 0;
    const sources = generateSourcesAndSinks(WIDTH, HEIGHT, NUM_PAIRS, maxSourceStrength);

    test.each(timeLapses)(
        "%s sec - ADI matches analytical solution (m=3, n=3, amplitude=1)",
        (timeLapse) => {
            // Arrange
            const m = 3;
            const n = 3;

            const initialConcentration = (x, y) =>
                Math.cos((m * Math.PI * x) / WIDTH) * Math.cos((n * Math.PI * y) / HEIGHT);
            const expTerm = (t) =>
                Math.exp(
                    -DIFFUSION_RATE *
                        Math.PI *
                        Math.PI *
                        ((m * m) / (WIDTH * WIDTH) + (n * n) / (HEIGHT * HEIGHT)) *
                        t
                );
            const analyticalSolution = (x, y, t) => initialConcentration(x, y) * expTerm(t);

            const initial = new Float64Array(WIDTH * HEIGHT);
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    initial[j * WIDTH + i] = initialConcentration(i, j);
                }
            }

            // Act
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
            const resultADI = ADI(initial, sources, deltaT, timeLapse);

            // Assert L2 norm (root mean square error)
            let sumSquaredErrors = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const analyticalValue = analyticalSolution(i, j, timeLapse);
                    const error = resultADI[idx] - analyticalValue;
                    sumSquaredErrors += error * error;
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            expect(rmsError).toBeLessThan(tolerance);
        }
    );

    test.each(timeLapses)(
        "%s sec - ADI matches analytical solution (m=6, n=6, amplitude=0.5)",
        (timeLapse) => {
            // Arrange
            const m = 6;
            const n = 6;
            const initialConcentration = (x, y) =>
                (Math.cos((m * Math.PI * x) / WIDTH) * Math.cos((n * Math.PI * y) / HEIGHT)) / 2;
            const expTerm = (t) =>
                Math.exp(
                    -DIFFUSION_RATE *
                        Math.PI *
                        Math.PI *
                        ((m * m) / (WIDTH * WIDTH) + (n * n) / (HEIGHT * HEIGHT)) *
                        t
                );
            const analyticalSolution = (x, y, t) => initialConcentration(x, y) * expTerm(t);

            const initial = new Float64Array(WIDTH * HEIGHT);
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    initial[j * WIDTH + i] = initialConcentration(i, j);
                }
            }

            // Act
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
            const resultADI = ADI(initial, sources, deltaT, timeLapse);

            // Assert L2 norm (root mean square error)
            let sumSquaredErrors = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const analyticalValue = analyticalSolution(i, j, timeLapse);
                    const error = resultADI[idx] - analyticalValue;
                    sumSquaredErrors += error * error;
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            expect(rmsError).toBeLessThan(tolerance);
        }
    );
});

describe("ADI method vs Analytical solutions to Gaussian initial condition", () => {
    const tolerance = 1;
    const WIDTH = 100;
    const HEIGHT = 100;
    const DIFFUSION_RATE = 1.0; // Make sure this matches your ADI implementation
    const deltaX = 1.0;
    const deltaT = 0.1; // Ensure stability condition is met

    // Trapezoidal rule integration
    function integrate(f, a, b, numPoints = 1000) {
        const h = (b - a) / numPoints;
        let sum = 0.5 * (f(a) + f(b));
        for (let i = 1; i < numPoints; i++) {
            sum += f(a + i * h);
        }
        return h * sum;
    }

    // Compute I_k integral for Fourier coefficients
    function computeIk(alpha, L, k, numPoints = 1000) {
        const pi = Math.PI;
        const integrand = (u) =>
            Math.exp(-alpha * Math.pow(u - L / 2, 2)) * Math.cos((k * pi * u) / L);
        return integrate(integrand, 0, L, numPoints);
    }

    // Precompute Fourier coefficients for efficiency
    function precomputeCoefficients(alpha, WIDTH, HEIGHT, maxTerms) {
        const coefficients = [];
        for (let n = 0; n < maxTerms; n++) {
            coefficients[n] = [];
            for (let m = 0; m < maxTerms; m++) {
                const epsilon_n = n === 0 ? 1 : 2;
                const epsilon_m = m === 0 ? 1 : 2;
                const I_n = computeIk(alpha, WIDTH, n, 1000);
                const I_m = computeIk(alpha, HEIGHT, m, 1000);
                coefficients[n][m] = (epsilon_n * epsilon_m * I_n * I_m) / (WIDTH * HEIGHT);
            }
        }
        return coefficients;
    }

    // Analytical solution using precomputed coefficients
    function analyticalSolution(x, y, t, coefficients, maxTerms) {
        let sum = 0;
        const pi = Math.PI;

        for (let n = 0; n < maxTerms; n++) {
            for (let m = 0; m < maxTerms; m++) {
                const lambda_nm =
                    pi *
                    pi *
                    DIFFUSION_RATE *
                    ((n * n) / (WIDTH * WIDTH) + (m * m) / (HEIGHT * HEIGHT));
                const timeDecay = Math.exp(-lambda_nm * t);
                const spatialPart =
                    Math.cos((n * pi * x) / WIDTH) * Math.cos((m * pi * y) / HEIGHT);
                sum += coefficients[n][m] * timeDecay * spatialPart;
            }
        }
        return sum;
    }

    test.each([
        { time: 0.5, description: "0.5 seconds" },
        { time: 1.0, description: "1.0 seconds" },
        { time: 2.0, description: "2.0 seconds" },
    ])("$description - ADI matches analytical solution", ({ time }) => {
        // Test parameters
        const alpha = 0.05; // Gaussian sharpness parameter
        const maxTerms = 15; // Number of Fourier terms (increase for better accuracy)

        // Initial condition: Gaussian centered in domain
        const initialCondition = (x, y) =>
            Math.exp(-alpha * ((x - WIDTH / 2) ** 2 + (y - HEIGHT / 2) ** 2));

        // Precompute Fourier coefficients once
        console.log(`Precomputing Fourier coefficients for ${maxTerms} terms...`);
        const coefficients = precomputeCoefficients(alpha, WIDTH, HEIGHT, maxTerms);
        console.log(`Coefficients computed successfully`);

        // Setup initial grid
        const initial = new Float64Array(WIDTH * HEIGHT);
        for (let j = 0; j < HEIGHT; j++) {
            for (let i = 0; i < WIDTH; i++) {
                initial[j * WIDTH + i] = initialCondition(i, j);
            }
        }

        // No sources for this test
        const sources = new Float64Array(WIDTH * HEIGHT).fill(0);

        // Run ADI solver
        console.log(`Running ADI solver for time ${time}s...`);
        setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);
        const resultADI = ADI(initial, sources, deltaT, time);
        console.log(`ADI solver completed`);

        // Compare with analytical solution
        let sumSquaredErrors = 0;
        let maxError = 0;
        let totalMass_numerical = 0;
        let totalMass_analytical = 0;

        console.log(`Computing analytical solution and errors...`);
        for (let j = 0; j < HEIGHT; j++) {
            for (let i = 0; i < WIDTH; i++) {
                const idx = j * WIDTH + i;
                const analyticalValue = analyticalSolution(i, j, time, coefficients, maxTerms);
                const numericalValue = resultADI[idx];

                const error = Math.abs(numericalValue - analyticalValue);
                sumSquaredErrors += error * error;
                maxError = Math.max(maxError, error);

                totalMass_numerical += numericalValue;
                totalMass_analytical += analyticalValue;
            }
        }

        const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));
        const relativeMassError =
            Math.abs(totalMass_numerical - totalMass_analytical) / totalMass_analytical;

        // Log detailed results
        console.log(`\n=== Results for time ${time}s ===`);
        console.log(`RMS Error: ${rmsError.toExponential(3)}`);
        console.log(`Max Error: ${maxError.toExponential(3)}`);
        console.log(`Mass Conservation Error: ${(relativeMassError * 100).toFixed(3)}%`);
        console.log(`Analytical Total Mass: ${totalMass_analytical.toFixed(6)}`);
        console.log(`Numerical Total Mass: ${totalMass_numerical.toFixed(6)}`);
        console.log(`================================\n`);

        // Main assertion
        expect(rmsError).toBeLessThan(tolerance);

        // Additional checks for robustness
        expect(relativeMassError).toBeLessThan(0.05); // Mass should be conserved within 5%
        expect(maxError).toBeLessThan(tolerance * 10); // Max error shouldn't be too large
        expect(totalMass_numerical).toBeGreaterThan(0); // Ensure we have positive mass
        expect(totalMass_analytical).toBeGreaterThan(0); // Ensure analytical solution is valid
    });

    // Test for mass conservation over time
    test("Mass conservation over time", () => {
        const alpha = 0.1;
        const initialCondition = (x, y) =>
            Math.exp(-alpha * ((x - WIDTH / 2) ** 2 + (y - HEIGHT / 2) ** 2));

        // Calculate initial total mass
        let initialMass = 0;
        const initial = new Float64Array(WIDTH * HEIGHT);
        for (let j = 0; j < HEIGHT; j++) {
            for (let i = 0; i < WIDTH; i++) {
                const value = initialCondition(i, j);
                initial[j * WIDTH + i] = value;
                initialMass += value;
            }
        }

        console.log(`Initial mass: ${initialMass.toFixed(6)}`);

        const sources = new Float64Array(WIDTH * HEIGHT).fill(0);

        // Test mass conservation at different times
        const times = [0.1, 0.5, 1.0, 2.0];
        times.forEach((time) => {
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);

            const result = ADI(initial, sources, deltaT, time);
            let finalMass = 0;
            for (let i = 0; i < result.length; i++) {
                finalMass += result[i];
            }

            const massError = Math.abs(finalMass - initialMass) / initialMass;
            console.log(
                `Time ${time}s: Mass = ${finalMass.toFixed(6)}, Error = ${(massError * 100).toFixed(3)}%`
            );

            expect(massError).toBeLessThan(0.01); // Mass should be conserved within 1%
        });
    });

    // Test convergence with increasing Fourier terms
    test("Analytical solution convergence with increasing terms", () => {
        const alpha = 0.05;
        const time = 1.0;
        const testPoint = { x: WIDTH / 2, y: HEIGHT / 2 }; // Center point

        const termsList = [5, 10, 15, 20];
        let previousValue = null;

        termsList.forEach((maxTerms) => {
            const coefficients = precomputeCoefficients(alpha, WIDTH, HEIGHT, maxTerms);
            const value = analyticalSolution(
                testPoint.x,
                testPoint.y,
                time,
                coefficients,
                maxTerms
            );

            console.log(`Terms: ${maxTerms}, Value at center: ${value.toExponential(6)}`);

            if (previousValue !== null) {
                const convergenceRate = Math.abs(value - previousValue) / Math.abs(previousValue);
                console.log(`Convergence rate: ${(convergenceRate * 100).toFixed(3)}%`);
                expect(convergenceRate).toBeLessThan(0.1); // Should converge as we add more terms
            }

            previousValue = value;
            expect(value).toBeGreaterThan(0); // Should be positive at center
        });
    });

    // Test different Gaussian widths
    test("Different Gaussian widths produce valid solutions", () => {
        const alphas = [0.01, 0.05, 0.1, 0.2]; // Different sharpnesses
        const time = 0.5;
        const maxTerms = 12;

        alphas.forEach((alpha) => {
            console.log(`\nTesting alpha = ${alpha}`);

            const initialCondition = (x, y) =>
                Math.exp(-alpha * ((x - WIDTH / 2) ** 2 + (y - HEIGHT / 2) ** 2));

            // Setup initial grid
            const initial = new Float64Array(WIDTH * HEIGHT);
            let initialMass = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const value = initialCondition(i, j);
                    initial[j * WIDTH + i] = value;
                    initialMass += value;
                }
            }

            console.log(`Initial mass for alpha=${alpha}: ${initialMass.toFixed(6)}`);

            // Compute coefficients
            const coefficients = precomputeCoefficients(alpha, WIDTH, HEIGHT, maxTerms);

            // Test analytical solution at center
            const centerValue = analyticalSolution(
                WIDTH / 2,
                HEIGHT / 2,
                time,
                coefficients,
                maxTerms
            );
            console.log(`Center value at t=${time}s: ${centerValue.toExponential(6)}`);

            expect(centerValue).toBeGreaterThan(0);
            expect(centerValue).toBeLessThan(initialCondition(WIDTH / 2, HEIGHT / 2));
        });
    });
});
