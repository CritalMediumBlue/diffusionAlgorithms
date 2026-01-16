import {CrankNicolson, setCNProperties} from "../src/CrankNicolson.js";
import {ADI, setADIProperties} from "../src/ADI.js";
import {calculateDifference} from "../src/helpers.js";
import {expect, test} from "vitest";
import {plot1DComparison, plotDifference, plot2DHeatmap} from "./plotHelper.js";

const length = 1200;
const height = 3;

const testCases = [
    { diffusionCoefficient: 2, decayRate: 0.0000001, deltaX: 1.0, totalTime: 20 },
    { diffusionCoefficient: 2, decayRate: 0.0000001, deltaX: 1.0, totalTime: 200 },
    { diffusionCoefficient: 2, decayRate: 0.0000001, deltaX: 1.0, totalTime: 400 },
    { diffusionCoefficient: 2, decayRate: 0.0000001, deltaX: 1.0, totalTime: 800},
    { diffusionCoefficient: 2, decayRate: 0.0000001, deltaX: 1.0, totalTime: 1500 },
    { diffusionCoefficient: 2, decayRate: 0.0000001, deltaX: 1.0, totalTime: 3000 },
];

testCases.forEach(({ diffusionCoefficient, decayRate, deltaX, totalTime }) => {
    test(`Crank-Nicolson vs ADI: D=${diffusionCoefficient}, k=${decayRate}, dx=${deltaX}, totalTime=${totalTime}`, () => {
     
        const deltaT = 0.1;
        const totalIterations = Math.floor(totalTime / deltaT);

        // Create fresh copies of sources for each test
        const sources1D = new Float64Array(length).fill(0);
        const sources2D = new Float64Array(length * height).fill(0);
        sources1D[Math.floor(length / 2)] = 1.5; // point source in the center
        for (let i = 0; i < height; i++) {
            sources2D[i * length + Math.floor(length / 2)] = 1.5;
        }

        const numericalSolutionUsingADI = new Float64Array(length * height).fill(0);
        const numericalSolutionUsingCrankNicolson = new Float64Array(length).fill(0);

         for (let i = 0; i < length; i++) {
            numericalSolutionUsingCrankNicolson[i] = 0.5 + Math.sin((i / length) * Math.PI * 7) / 2; // same initial condition
            for (let j = 0; j < height; j++) {
                numericalSolutionUsingADI[i + j * length] = 0.5 + Math.sin((i / length) * Math.PI * 7) / 2;
            }
        } 

        setADIProperties(length, height, diffusionCoefficient, deltaX, deltaT, decayRate);
        ADI(numericalSolutionUsingADI, sources2D, totalIterations, true);

        setCNProperties(length, diffusionCoefficient, deltaX, deltaT, decayRate);
        CrankNicolson(
            numericalSolutionUsingCrankNicolson,
            sources1D,
            totalIterations,
            true
        );
        const differences = calculateDifference(
            numericalSolutionUsingADI.slice(length, 2 * length),
            numericalSolutionUsingCrankNicolson
        );

         plot1DComparison(numericalSolutionUsingADI.slice(length, 2 * length), numericalSolutionUsingCrankNicolson, sources1D, `1D_${diffusionCoefficient}_${decayRate}_${deltaX}_${totalTime}_CN_comparison`);
        plotDifference(differences, `1D_${diffusionCoefficient}_${decayRate}_${deltaX}_${totalTime}_difference_CN`);
                plot2DHeatmap(numericalSolutionUsingADI, length, height, `2D_${diffusionCoefficient}_${decayRate}_${deltaX}_${totalTime}_ADI`);
                plot2DHeatmap(numericalSolutionUsingCrankNicolson, length, 1, `2D_${diffusionCoefficient}_${decayRate}_${deltaX}_${totalTime}_CrankNicolson`);

        for (let i = 0; i < length; i++) {
            const valueADI = numericalSolutionUsingADI[i + length]; // middle row
            const valueCrankNicolson = numericalSolutionUsingCrankNicolson[i];
            expect(valueCrankNicolson).toBeCloseTo(valueADI, 2);
        }

    });
});

        


    