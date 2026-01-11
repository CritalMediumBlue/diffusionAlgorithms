import { ADI, setADIProperties } from "./ADI.js";
import { analyticSteadyState } from "./analyticSolution.js";
import { describe, test, expect } from "vitest";
import { checkForSteadyState, createRandomSources} from "./helpers.js";

const sourcesTestCases = [{ description: "infrequent sources", probability: 0.0003 },
                            { description: "moderate sources", probability: 0.002 },
                            { description: "frequent sources", probability: 0.01 },
                            { description: "very frequent sources", probability: 0.02 },
                            { description: "dense sources", probability: 0.05 }
];

describe("Analytic vs Numerical Steady-State Solution", () => {
    const DIFFUSION_RATE = 5; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const WIDTH = 100;
    const HEIGHT = 100;
    const DECAY_RATE = 0.01; 
    const deltaT = 0.1; // seconds 
    const maxMode = 800;  

    test.each(sourcesTestCases)("$description", ({ probability }) => {
        // Arrange
        const sources = createRandomSources(WIDTH, HEIGHT, probability);
        sources[Math.floor(HEIGHT/2) * WIDTH + Math.floor(WIDTH/2)] = 1.0; // ensure at least one source in the center
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
            steadyStateReached = checkForSteadyState(previousConcentration, numericalSolution, 1e-10);
        }

        //Assert
        const maximumValueAnalytic = Math.max(...analyticalSolution);
        const maximumValueNumerical = Math.max(...numericalSolution);
        const minimumValueAnalytic = Math.min(...analyticalSolution);
        const minimumValueNumerical = Math.min(...numericalSolution);

        // Check that the max and min values are close
        expect(maximumValueNumerical).toBeCloseTo(maximumValueAnalytic, 0); // gibbs phenomenon on analytic solution can cause larger discrepancies at sources. Do not expect higher precision here
        expect(minimumValueNumerical).toBeCloseTo(minimumValueAnalytic, 2);

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
        expect(rmsError).toBeLessThan(2e-3);
    });
});
