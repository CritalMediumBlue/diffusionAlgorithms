import { ADI, setADIProperties } from "./ADI.js";
import { describe, test, expect } from "vitest";


const testWindow = 4; // seconds
const deltaT = 0.1; // seconds
const intervals = Math.round(testWindow / deltaT);
const timeLapses = new Float64Array(intervals);

for (let i = 0; i < intervals; i++) {
    timeLapses[i] =  (i + 1) * deltaT;
    console.log(`Time lapse added for testing: ${timeLapses[i]} seconds`);
} 

function generateRandomSourcesAndSinks(width, height, numberOfSourceSinkPairs, maxAccumulation) {
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
            const sourceStrength =  Math.random();
            sources[sourceIndex] += sourceStrength;
            sources[sinkIndex] -= sourceStrength;
            remainingPairs--;
        }
    }

    return sources;
}

function eigenFunction(m, n, WIDTH, HEIGHT, deltaX) {
    const Lx = WIDTH * deltaX;   
    const Ly = HEIGHT * deltaX;  
    const concentrationField = new Float64Array(WIDTH * HEIGHT);
    
    for (let j = 0; j < HEIGHT; j++) {
        for (let i = 0; i < WIDTH; i++) {
            const x = (i + 0.5) * deltaX;
            const y = (j + 0.5) * deltaX;
            // Cosine eigenfunctions for Neumann (reflective) BCs
            concentrationField[j * WIDTH + i] =  
                Math.cos((n * Math.PI * x) / Lx) * 
                Math.cos((m * Math.PI * y) / Ly);
        }
    }
    return concentrationField;
}

function eigenValue(m, n, WIDTH, HEIGHT, deltaX) {
    const Lx = WIDTH * deltaX;   
    const Ly = HEIGHT * deltaX;  
    return Math.PI * Math.PI * ((n * n) / (Lx * Lx) + (m * m) / (Ly * Ly));
}

function exponentialDecayInTime(eigenvalue, time, diffusionRate) {
    return Math.exp(-diffusionRate * eigenvalue * time);
}

function analyticalSolution(initialConcentration, expTerm){
    const length = initialConcentration.length;
    const result = new Float64Array(length);
    for (let idx = 0; idx < length; idx++) {
        result[idx] = initialConcentration[idx] * expTerm; //when initial condition is an eigenfunction, the solution is a simple multiplication
    }
    return result;
}
 



describe("ADI method vs Analytical solution without sources and sinks", () => {
    const DIFFUSION_RATE = 10; // micrometer^2 / second
    const deltaX = 1; // micrometers
    const tolerance = 1e-3;
    const WIDTH = 100;
    const HEIGHT = 100;
    const NUM_PAIRS = 0;
    const maxSourceStrength = 0;
    const sources = generateRandomSourcesAndSinks(WIDTH, HEIGHT, NUM_PAIRS, maxSourceStrength); 
    setADIProperties(WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT);

    test.each(timeLapses)(
        "%s sec - ADI matches analytical solution (m=3, n=3, amplitude=1)",
        (timeLapse) => {
            // Arrange
            const m = 3;
            const n = 3;

            const iterations = timeLapse / deltaT;

            const initial = eigenFunction(m, n, WIDTH, HEIGHT, deltaX);
            
            const eigenvalue = eigenValue(m, n, WIDTH, HEIGHT, deltaX);

            const expTerm = exponentialDecayInTime(eigenvalue, timeLapse, DIFFUSION_RATE);

            const analytical = analyticalSolution(initial, expTerm);


            // Act


            const resultADI = ADI(initial, sources, iterations);


            // Assert L2 norm (root mean square error)
            let sumSquaredErrors = 0;
            for (let j = 0; j < HEIGHT; j++) {
                for (let i = 0; i < WIDTH; i++) {
                    const idx = j * WIDTH + i;
                    const error = resultADI[idx] - analytical[idx];
                    sumSquaredErrors += error * error;
                }
            }
            const rmsError = Math.sqrt(sumSquaredErrors / (WIDTH * HEIGHT));

            expect(rmsError).toBeLessThan(tolerance);
        }
    );

    
});
