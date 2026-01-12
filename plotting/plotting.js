import Plotly from 'plotly.js-dist';
import { ADI, setADIProperties } from '../src/ADI.js';
import { analyticSteadyState } from '../src/analyticSolution.js';
import {efectiveInfluence} from '../src/effective.js';
import { createRandomSources, checkForSteadyState, convertTo2D, calculateDifference} from '../src/helpers.js';


const width = 100;
const height = 100;
const diffusionCoefficient = 1.0;
const deltaX = 1.0;
const deltaT = 0.1;
const decayRate = 0.01;
const maxmode = 200; 
const sources = createRandomSources(width, height, 0.02);
 

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
const averageResult = new Float64Array(width * height).fill(0);

for (let i = 0; i < width * height; i++) {
    averageResult[i] = (adiSolution[i] + analyticSolution[i]) / 2;
}




// calculate effective solutions for different lambda values

const lambdaValues = [6.4, 6.6, 6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0]; // it seems that around 6.3 the best fit is achieved
const scaleValues = [98, 98.5, 99, 99.5, 100, 100.5, 101, 101.5, 102];

const effectiveSolution = efectiveInfluence(width, height, sources, 7.2, 99);

const differenceEffectiveAnalytic = calculateDifference(effectiveSolution, analyticSolution);
const logDifferenceEffectiveAnalytic = new Float64Array(differenceEffectiveAnalytic.length);
for (let i = 0; i < differenceEffectiveAnalytic.length; i++) {
    logDifferenceEffectiveAnalytic[i] = Math.log10(Math.abs(differenceEffectiveAnalytic[i]) + 1e-20); // add small value to avoid log(0)
}


//compare all lambda values and all scale values by calculating the rms error
const allRmsErrors = new Float64Array(lambdaValues.length * scaleValues.length);
for (let i = 0; i < lambdaValues.length; i++) {
    for (let j = 0; j < scaleValues.length; j++) {
        const effectiveSolution = efectiveInfluence(width, height, sources, lambdaValues[i], scaleValues[j]);
        let sumSquares = 0;
        for (let k = 0; k < effectiveSolution.length; k++) {
            //if (sources[k] !== 0) continue; // skip source locations
            const diff = averageResult[k] - effectiveSolution[k];
            sumSquares += diff * diff;
        }
        allRmsErrors[i * scaleValues.length + j] = Math.sqrt(sumSquares / effectiveSolution.length);
        console.log(`i=${i} of ${lambdaValues.length}, j=${j} of ${scaleValues.length} completed`);
    }
}




const numericalData = convertTo2D(adiSolution, width, height);
const analyticalData = convertTo2D(analyticSolution, width, height);
const differenceData = convertTo2D(difference, width, height);
const logDifferenceData = convertTo2D(logDifference, width, height);
const effectiveData = convertTo2D(effectiveSolution, width, height);
const differenceEffectiveAnalyticData = convertTo2D(differenceEffectiveAnalytic, width, height);
const logDifferenceEffectiveAnalyticData = convertTo2D(logDifferenceEffectiveAnalytic, width, height);
const rmsErrorsData = convertTo2D(allRmsErrors, scaleValues.length, lambdaValues.length);


// plot the rms errors heatmap
const rmsErrorTrace = {
    z: rmsErrorsData,
    x: scaleValues,
    y: lambdaValues,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: { title: 'RMS Error' },
};

const rmsErrorLayout = {
    title: {
        text: 'RMS Error for Different Lambda and Scale Values',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'Scale Values' } },
    yaxis: { title: { text: 'Lambda Values' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

Plotly.newPlot('rms-error-plot', [rmsErrorTrace], rmsErrorLayout, {responsive: true});


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
    margin: { t: 30, b: 80, l: 80, r: 50 },
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
    margin: { t: 30, b: 80, l: 80, r: 50 },
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
    margin: { t: 30, b: 80, l: 80, r: 50 },
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
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

Plotly.newPlot('log-comparison-plot', [logDifferenceTrace], logDifferenceLayout, {responsive: true});


// Create effective solution heatmaps
    const effectiveTrace = {
        z: effectiveData,
        type: 'heatmap',
        colorscale: 'Viridis',
        colorbar: { title: 'Concentration' },
    };

    const effectiveLayout = {
        title: {
            text: `Eff. Solution (λ=7.2, Scale=99)`,
            font: { size: 20 }
        },
        xaxis: { title: { text: 'X Position' } },
        yaxis: { title: { text: 'Y Position' } },
        margin: { t: 30, b: 80, l: 80, r: 50 },
    };

    Plotly.newPlot(`effective-plot`, [effectiveTrace], effectiveLayout, {responsive: true});



    const differenceEffectiveAnalyticTrace = {
        z: differenceEffectiveAnalyticData,
        type: 'heatmap',
        colorscale: 'Viridis',
        colorbar: { title: 'Absolute Difference' },
    };

    const differenceEffectiveAnalyticLayout = {
        title: {
            text: `Diff Between Effective (λ=7.2) and Analytic Solutions`,
            font: { size: 20 }
        },
        xaxis: { title: { text: 'X Position' } },
        yaxis: { title: { text: 'Y Position' } },
        margin: { t: 30, b: 80, l: 80, r: 50 },
    };

    Plotly.newPlot(`difference-effective-analytic-plot`, [differenceEffectiveAnalyticTrace], differenceEffectiveAnalyticLayout, {responsive: true});

    const logDifferenceEffectiveAnalyticTrace = {
        z: logDifferenceEffectiveAnalyticData,
        type: 'heatmap',
        colorscale: 'Viridis',
        colorbar: { title: 'Log10 Absolute Difference' },
    };

    const logDifferenceEffectiveAnalyticLayout = {
        title: {
            text: `Log Diff Between Effective (λ=7.2) and Analytic Solutions`,
            font: { size: 20 }
        },
        xaxis: { title: { text: 'X Position' } },
        yaxis: { title: { text: 'Y Position' } },
        margin: { t: 30, b: 80, l: 80, r: 50 },
    };

    Plotly.newPlot(`log-difference-effective-analytic-plot`, [logDifferenceEffectiveAnalyticTrace], logDifferenceEffectiveAnalyticLayout, {responsive: true});  
