import Plotly from 'plotly.js-dist';
import { ADI, setADIProperties } from '../ADI.js';
import { analyticSteadyState } from '../analyticSolution.js';
import { createRandomSources, checkForSteadyState, convertTo2D, calculateDifference} from '../helpers.js';


const width = 100;
const height = 100;
const diffusionCoefficient = 1.0;
const deltaX = 1.0;
const deltaT = 0.1;
const decayRate = 0.01;
const maxmode = 200; 
const sources = createRandomSources(width, height, 0.01);
 

// calculate numerical solution using ADI
setADIProperties(width, height, diffusionCoefficient, deltaX, deltaT, decayRate);
let steadyStateReached = false;
const adiSolution = new Float64Array(width * height).fill(0);
let previousADISolution = new Float64Array(width * height).fill(0);

while (!steadyStateReached) {
    ADI(adiSolution, sources, 20, true);
    steadyStateReached = checkForSteadyState(previousADISolution, adiSolution);
    previousADISolution.set(adiSolution);
}

// calculate analytic solution using eigenfunction expansion
const analyticSolution = analyticSteadyState(width,
     height, diffusionCoefficient, decayRate, deltaX, sources, maxmode);
    
// calculate difference between numerical and analytical solutions
const difference = calculateDifference(adiSolution, analyticSolution);
const logDifference = new Float64Array(difference.length);
for (let i = 0; i < difference.length; i++) {
    logDifference[i] = Math.log10(Math.abs(difference[i]) + 1e-20); // add small value to avoid log(0)
}









const numericalData = convertTo2D(adiSolution, width, height);
const analyticalData = convertTo2D(analyticSolution, width, height);
const differenceData = convertTo2D(difference, width, height);
const logDifferenceData = convertTo2D(logDifference, width, height);

// Create numerical solution heatmap
const numericalTrace = {
    z: numericalData,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'Concentration' },
};

const numericalLayout = {
    title: {
        text: 'Numerical Solution (ADI Method)',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Y Position' } },
    margin: { t: 100, b: 80, l: 80, r: 100 },
};
 
Plotly.newPlot('numerical-plot', [numericalTrace], numericalLayout, {responsive: true});

// Create analytical solution heatmap
const analyticalTrace = {
    z: analyticalData,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'Concentration' },
};

const analyticalLayout = {
    title: {
        text: 'Analytical Solution',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Y Position' } },
    margin: { t: 100, b: 80, l: 80, r: 100 },
};

Plotly.newPlot('analytic-plot', [analyticalTrace], analyticalLayout, {responsive: true});



// Create difference heatmap
const differenceTrace = {
    z: differenceData,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'Absolute Difference' },
}; 

const differenceLayout = {
    title: {
        text: 'Difference Between Numerical and Analytical Solutions',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Y Position' } },
    margin: { t: 100, b: 80, l: 80, r: 100 },
};

Plotly.newPlot('comparison-plot', [differenceTrace], differenceLayout, {responsive: true});

// Create log difference heatmap
const logDifferenceTrace = {
    z: logDifferenceData,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'Log10 Absolute Difference' },
};

const logDifferenceLayout = {
    title: {
        text: 'Logarithmic Difference Between Numerical and Analytical Solutions',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Y Position' } },
    margin: { t: 100, b: 80, l: 80, r: 100 },
};

Plotly.newPlot('log-comparison-plot', [logDifferenceTrace], logDifferenceLayout, {responsive: true});