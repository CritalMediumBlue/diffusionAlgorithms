import { ADI, setADIProperties } from "./ADI.js";
import {analiticSteadyState} from "./analiticSolution.js";
import { describe, test, expect } from "vitest";

function checkForSteadyState(previousConcentration, currentConcentration, tolerance = 1e-10) {
    for (let i = 0; i < previousConcentration.length; i++) {
        if (Math.abs(currentConcentration[i] - previousConcentration[i]) > tolerance) {
            return false;
        }
    }
    console.log("Steady state reached.");
    return true;
}

function generateRandomSources(width, height) {
    const totalCells = width * height;
    const sources = new Float64Array(totalCells).fill(0);
    sources[Math.floor(totalCells /2)] = 1.0; // Ensure at least one source in the center
    
    return sources;
}

const sourcesTestCases = [
    { description: "Few sources and sinks", numSources: 1 }
];

describe("Compute just the (n=0, m=0) contribution and check it against expectations", () => {
    const DIFFUSION_RATE = 1; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const WIDTH = 50;
    const HEIGHT = 50;
    const DECAY_RATE = 1; // per second //this will never be zero
    const maxMode = 0;

    test.each(sourcesTestCases)(
        "$description",
        ({  numSources }) => {

            // Arrange
            const sources = generateRandomSources(WIDTH, HEIGHT, numSources);

            // Act 
            const analyticalSolution = analiticSteadyState(
                WIDTH,
                HEIGHT,
                DIFFUSION_RATE,
                DECAY_RATE,
                deltaX,
                sources,
                maxMode 
            );



            //Assert

            const expectedEigenfunctionValue = 1;
            const totalSourceStrength = sources.reduce((acc, val) => acc + val, 0);
            const expectedQ_00 = totalSourceStrength / (WIDTH * deltaX * HEIGHT * deltaX);
            const expectedK_00 = DECAY_RATE;
            const expectedAmplitude = expectedQ_00 / expectedK_00;
            const expectedConcentrationValue = expectedAmplitude * expectedEigenfunctionValue;

            for (let i = 0; i < WIDTH * HEIGHT; i++) {
                expect(analyticalSolution[i]).toBeCloseTo(expectedConcentrationValue, 14);
            }

        }
    );
});

describe("Analytic vs Numerical Steady-State Solution", () => {
    const DIFFUSION_RATE = 5; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const WIDTH = 100;
    const HEIGHT = 60;
    const DECAY_RATE = 1; // per second //this will never be zero
    const deltaT = 0.1; // seconds
    const maxMode = 200;

    test.each(sourcesTestCases)(
        "$description",
        ({  numSources }) => {

            // Arrange
            const sources = generateRandomSources(WIDTH, HEIGHT, numSources);
            const initialConcentration = new Float64Array(WIDTH * HEIGHT).fill(0);
            setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT, DECAY_RATE);

            // Act 
            const analyticalSolution = analiticSteadyState(
                WIDTH,
                HEIGHT,
                DIFFUSION_RATE,
                DECAY_RATE,
                deltaX,
                sources,
                maxMode 
            );

            let numericalSolution = initialConcentration.slice();
            let steadyStateReached = false;

            while (!steadyStateReached) {
                const previousConcentration = numericalSolution.slice();
                numericalSolution = ADI(numericalSolution, sources, 50, true);
                steadyStateReached = checkForSteadyState(previousConcentration, numericalSolution);
            }

            //Assert

            for (let i = 0; i < WIDTH * HEIGHT; i++) {
                expect(numericalSolution[i]).toBeCloseTo(analyticalSolution[i], 2);
            }

        }
    );
});

