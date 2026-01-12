import { ADI, setADIProperties } from "../src/ADI.js";
import { analyticSteadyState } from "../src/analyticSolution.js";
import { describe, test, expect } from "vitest";
import { checkForSteadyState, createRandomSources} from "../src/helpers.js";

const sourcesTestCases = [{ description: "very weak sources", strength: 0.001 },
                            { description: " strong sources", strength: 5.0 },
];

describe("Analytic vs Numerical Steady-State Solution", () => {
    const DIFFUSION_RATE = 1; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const WIDTH = 100;
    const HEIGHT = 100;
    const DECAY_RATE = 0.01; 
    const deltaT = 10.0; // seconds 
    const maxMode = 200;  

    test.each(sourcesTestCases)("$description", ({ strength }) => {
        // Arrange
        const sources = createRandomSources(WIDTH, HEIGHT, 0.01);
        for (let i = 0; i < sources.length; i++) {
            sources[i] *= strength;
        }
        sources[Math.floor(HEIGHT/2) * WIDTH + Math.floor(WIDTH/2)] = strength; // ensure at least one source in the center
        const initialConcentration = new Float64Array(WIDTH * HEIGHT).fill(0);
        setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT, DECAY_RATE);

        // Act
        const analyticalSolution = analyticSteadyState(
            WIDTH,
            HEIGHT,
            DIFFUSION_RATE,
            DECAY_RATE,
            deltaX,
            sources,
            maxMode
        );

        const numericalSolution = initialConcentration.slice();
        let steadyStateReached = false;

        while (!steadyStateReached) {
            const previousConcentration = numericalSolution.slice();
            ADI(numericalSolution, sources, 100, true);
            steadyStateReached = checkForSteadyState(previousConcentration, numericalSolution, 1e-6);
        }

        //Assert
        const maximumValueAnalytic = Math.max(...analyticalSolution);
        const maximumValueNumerical = Math.max(...numericalSolution);
        const minimumValueAnalytic = Math.min(...analyticalSolution);
        const minimumValueNumerical = Math.min(...numericalSolution);

        // Check that the max and min values are close
        expect(minimumValueNumerical).toBeCloseTo(minimumValueAnalytic, 0);

        const avMax = (maximumValueAnalytic + maximumValueNumerical) / 2;
        const avMin = (minimumValueAnalytic + minimumValueNumerical) / 2;
        const span = avMax - avMin;

        let maxRelError = 0;
        let sumSquaredErrors = 0;

        for (let i = 0; i < WIDTH * HEIGHT; i++) {
            if (sources[i] === 0 ) { // only check locations without sources to avoid gibbs phenomenon issues
            const diff = Math.abs(numericalSolution[i] - analyticalSolution[i]);
            const relError = diff / span;
            sumSquaredErrors += diff * diff;
            if (relError > maxRelError) {
                maxRelError = relError;
            }
            
            }
        }
        const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));
        expect(maxRelError).toBeLessThan(2e-2);
        expect(rmsError).toBeLessThan(2e-2);
    });
});
