import { ADI, setADIProperties } from "../src/ADI.js";
import { analyticSteadyState } from "../src/analyticSolution.js";
import { describe, test, expect } from "vitest";
import { checkForSteadyState, createRandomSources, calculateDifference} from "../src/helpers.js";

const TestCases = [
                     { diffusionCoefficient: 5.0, deltaX: 1.73, width: 50, height: 50, decayRate: 0.01, deltaT: 2.0 },
                     { diffusionCoefficient: 5.0, deltaX: 0.175, width: 50, height: 50, decayRate: 0.01, deltaT: 2.0 },
                     { diffusionCoefficient: 5.0, deltaX: 1.0, width: 50, height: 50, decayRate: 0.01, deltaT: 2.0 },
                     { diffusionCoefficient: 1.0, deltaX: 1.0, width: 50, height: 50, decayRate: 0.01, deltaT: 2.0 },
                    { diffusionCoefficient: 1.0, deltaX: 1.0, width: 100, height: 72, decayRate: 0.01, deltaT: 2.0 },
                    { diffusionCoefficient: 0.8, deltaX: 1.0, width: 80, height: 50, decayRate: 0.01, deltaT: 1.5 },
                    { diffusionCoefficient: 0.8, deltaX: 1.0, width: 80, height: 50, decayRate: 0.01, deltaT: 2.0 },
                    { diffusionCoefficient: 80, deltaX: 1.0, width: 80, height: 50, decayRate: 0.001, deltaT: 0.1 },

    
];

describe("Analytic vs Numerical Steady-State Solution with Varying Dimensions", () => {
    test.each(TestCases)("Diffusion: $diffusionCoefficient, deltaX: $deltaX, Width: $width, Height: $height, Decay: $decayRate, deltaT: $deltaT", ({ diffusionCoefficient, deltaX, width: WIDTH, height: HEIGHT, decayRate, deltaT }) => {
        // Arrange
        const sources = createRandomSources(WIDTH, HEIGHT, 0.02);
        sources[Math.floor(HEIGHT/2) * WIDTH + Math.floor(WIDTH/2)] = 1.0; // ensure at least one source in the center
        const initialConcentration = new Float64Array(WIDTH * HEIGHT).fill(0);
        setADIProperties(WIDTH, HEIGHT, diffusionCoefficient, deltaX, deltaT, decayRate);
        const maxMode = 200;  

        // Act
        const analyticalSolution = analyticSteadyState(
            WIDTH,
            HEIGHT,
            diffusionCoefficient,
            decayRate,
            deltaX,
            sources,
            maxMode
        );

        const numericalSolution = initialConcentration.slice();
        let steadyStateReached = false;

        while (!steadyStateReached) {
            const previousConcentration = numericalSolution.slice();
            ADI(numericalSolution, sources, 100, true);
            steadyStateReached = checkForSteadyState(previousConcentration, numericalSolution, 1e-7);
        }

        //Assert
        const maximumValueAnalytic = Math.max(...analyticalSolution);
        const maximumValueNumerical = Math.max(...numericalSolution);
        const minimumValueAnalytic = Math.min(...analyticalSolution);
        const minimumValueNumerical = Math.min(...numericalSolution);

        // Check that the max and min values are close
        //expect(maximumValueNumerical).toBeCloseTo(maximumValueAnalytic, 0); // gibbs phenomenon on analytic solution can cause larger discrepancies at sources. Do not expect higher precision here
        //expect(minimumValueNumerical).toBeCloseTo(minimumValueAnalytic, 2);

        const avMax = (maximumValueAnalytic + maximumValueNumerical) / 2;
        const avMin = (minimumValueAnalytic + minimumValueNumerical) / 2;
        const span = avMax - avMin;

        const differences = calculateDifference(numericalSolution, analyticalSolution);

        let maxRelError = 0;
        let sumSquaredErrors = 0;
        let countNonSource = 0;

        for (let i = 0; i < WIDTH * HEIGHT; i++) {
            if (sources[i] === 0) { // only check locations without sources
                const diff = differences[i];
                const relError = diff / span;
                sumSquaredErrors += diff * diff;
                countNonSource++;
                if (relError > maxRelError) {
                    maxRelError = relError;
                }
            }
        }

        const rmsError = Math.sqrt(sumSquaredErrors / countNonSource);
        expect(maxRelError).toBeLessThan(3e-2);
        expect(rmsError).toBeLessThan(5e-3);
    });
});
