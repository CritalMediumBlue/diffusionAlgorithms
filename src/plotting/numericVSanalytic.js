import Plotly from 'plotly.js-dist';
import { ADI, setADIProperties } from '../ADI.js';
import { analiticSteadyState } from '../analyticSolution.js';


const width = 100;
const height = 100;
const diffusionCoefficient = 1.0;
const deltaX = 1.0;
const deltaT = 0.1;
const decayRate = 0.01;

setADIProperties(width, height, diffusionCoefficient, deltaX, deltaT, decayRate);
const sources = new Float64Array(width * height);

sources[Math.floor(height / 2) * width + Math.floor(width / 2)] = 1
const maxmode = width / 2

const checkForSteadyState = (prev, current, tolerance = 1e-6) => {
    let maxDiff = 0;
    for (let i = 0; i < prev.length; i++) {
        const diff = Math.abs(current[i] - prev[i]);
        if (diff > maxDiff) {
            maxDiff = diff;
        }
    }
    return maxDiff < tolerance;
};

let steadyStateReached = false;

const adiSolution = new Float64Array(width * height).fill(0);
let previousADISolution = new Float64Array(width * height).fill(0);

while (!steadyStateReached) {
    ADI(adiSolution, sources, 20, true);
    steadyStateReached = checkForSteadyState(previousADISolution, adiSolution);
    previousADISolution.set(adiSolution);
}


const analyticSolution = analiticSteadyState(width,
     height, diffusionCoefficient, decayRate, deltaX, sources, maxmode);
    
//plot both solutions using plotly.js


// Convert 1D arrays to 2D matrices for Plotly
const convertTo2D = (array, width, height) => {
    const matrix = [];
    for (let j = 0; j < height; j++) {
        const row = [];
        for (let i = 0; i < width; i++) {
            row.push(array[j * width + i]);
        }
        matrix.push(row);
    }
    return matrix;
};

const numericalData = convertTo2D(adiSolution, width, height);
const analyticalData = convertTo2D(analyticSolution, width, height);

// Create numerical solution heatmap
const numericalTrace = {
    z: numericalData,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'Concentration' },
};

const numericalLayout = {
    title: 'Numerical Solution (ADI Method)',
    xaxis: { title: 'X Position' },
    yaxis: { title: 'Y Position' },
};
 
Plotly.newPlot('numerical-plot', [numericalTrace], numericalLayout);

// Create analytical solution heatmap
const analyticalTrace = {
    z: analyticalData,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'Concentration' },
};

const analyticalLayout = {
    title: 'Analytical Solution',
    xaxis: { title: 'X Position' },
    yaxis: { title: 'Y Position' },
};

Plotly.newPlot('analytic-plot', [analyticalTrace], analyticalLayout);

// Compute and display difference
const differenceData = numericalData.map((row, j) =>
    row.map((val, i) => Math.log(Math.abs(val - analyticalData[j][i])))
);

// Create difference heatmap
const differenceTrace = {
    z: differenceData,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'Absolute Difference' },
}; 

const differenceLayout = {
    title: 'Difference Between Numerical and Analytical Solutions',
    xaxis: { title: 'X Position' },
    yaxis: { title: 'Y Position' },
};

Plotly.newPlot('comparison-plot', [differenceTrace], differenceLayout);