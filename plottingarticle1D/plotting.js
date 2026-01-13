import Plotly from 'plotly.js-dist';
import { ADI, setADIProperties } from '../src/ADI.js';
import { analyticSteadyState } from '../src/analyticSolution.js';
import {efectiveInfluence} from '../src/effective.js';
import { createRandomSources, checkForSteadyState, convertTo2D, calculateDifference} from '../src/helpers.js';


const width = 100;
const height = 3;
const diffusionCoefficient = 1.0;
const deltaX = 1.0;
const deltaT = 0.1;
const uptakeRate = 0.01

const decayRate =  uptakeRate / diffusionCoefficient; 
const maxmode = 200; 
const sources = new Float64Array(width * height).fill(0);

for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
        const idx = i * width + j;
        if (j === 0 ){
            sources[idx] = 1;
        }
    }
}

const effective1DInfluence = (width, height) => {
    const solution = new Float64Array(width*height).fill(0);
    const c_o = 1.0/(Math.sqrt(diffusionCoefficient * uptakeRate))
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const x = (i + 0.5)*deltaX;
            solution[j * width + i] = c_o * Math.exp(- Math.sqrt(uptakeRate / diffusionCoefficient) * x);
        }
    }
    return solution;
}
 

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

/* const lambdaValues = [6.4, 6.6, 6.8, 7.0, 7.2, 7.4, 7.6, 7.8, 8.0]; // it seems that around 6.3 the best fit is achieved
const scaleValues = [98, 98.5, 99, 99.5, 100, 100.5, 101, 101.5, 102]; */
let scaleValues = new Float64Array(9);
let lambdaValues = new Float64Array(9);

const lambdaStart = 9.75;
const lambdaEnd = 10.25;
const scaleStart = 99.5;
const scaleEnd = 100.5;

for (let i = 0; i <= 8; i++) {
    lambdaValues[i] = lambdaStart + i * ( (lambdaEnd - lambdaStart) / 8 );
}
for (let i = 0; i <= 8; i++) {
    scaleValues[i] = scaleStart + i * ( (scaleEnd - scaleStart) / 8 );
}

const lambda = 10.0625;
const scale = 99.875;
//const effectiveSolution = efectiveInfluence(width, height, sources, lambda, scale);
const effectiveSolution = effective1DInfluence(width, height);

const differenceEffectiveAnalytic = calculateDifference(effectiveSolution, analyticSolution);
const diffEffAnalyIgnoringSources = differenceEffectiveAnalytic.slice();
for (let i = 0; i < differenceEffectiveAnalytic.length; i++) {
    if (sources[i] !== 0) 
    {
        diffEffAnalyIgnoringSources[i] =  1e-3; 
    }
}
const logDifferenceEffectiveAnalytic = new Float64Array(diffEffAnalyIgnoringSources.length);
for (let i = 0; i < diffEffAnalyIgnoringSources.length; i++) {
    logDifferenceEffectiveAnalytic[i] = Math.log10(Math.abs(diffEffAnalyIgnoringSources[i]) + 1e-20); // add small value to avoid log(0)
}


//compare all lambda values and all scale values by calculating the rms error
const allRmsErrors = new Float64Array(lambdaValues.length * scaleValues.length);
for (let i = 0; i < lambdaValues.length; i++) {
    for (let j = 0; j < scaleValues.length; j++) {
        const effectiveSolution = efectiveInfluence(width, height, sources, lambdaValues[i], scaleValues[j]);
        let sumSquares = 0;
        const differences = calculateDifference(averageResult, effectiveSolution);
        for (let k = 0; k < differences.length; k++) {
            sumSquares += differences[k] * differences[k];
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
const differenceEffectiveAnalyticIgnoringSourcesData = convertTo2D(diffEffAnalyIgnoringSources, width, height);
const logDifferenceEffectiveAnalyticData = convertTo2D(logDifferenceEffectiveAnalytic, width, height);
const rmsErrorsData = convertTo2D(allRmsErrors, scaleValues.length, lambdaValues.length);

//plot difference with analytical ignoring sources

const differenceIgnoringSourcesTrace = {
    x: Array.from({length: differenceEffectiveAnalyticIgnoringSourcesData[1].length}, (_, i) => i),
    y: differenceEffectiveAnalyticIgnoringSourcesData[1],
    type: 'scatter',
    mode: 'lines',
};

const differenceIgnoringSourcesLayout = {
    title: {
        text: `Diff Between Effective and Analytic Solutions Ignoring Sources`,
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Absolute Difference' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

Plotly.newPlot(`difference-ignoring-sources-plot`, [differenceIgnoringSourcesTrace], differenceIgnoringSourcesLayout, {responsive: true});

// Create numerical solution heatmap
const numericalTrace = {
    x: Array.from({length: numericalData[0].length}, (_, i) => i),
    y: numericalData[1],
    type: 'scatter',
    mode: 'lines',
};

const numericalLayout = {
    title: {
        text: 'Numerical Solution (ADI Method)',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Concentration' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};
 
Plotly.newPlot('numerical-plot', [numericalTrace], numericalLayout, {responsive: true});

// Create analytical solution heatmap
const analyticalTrace = {
    x: Array.from({length: analyticalData[1].length}, (_, i) => i),
    y: analyticalData[1],
    type: 'scatter',
    mode: 'lines',
};

const analyticalLayout = {
    title: {
        text: 'Analytical Solution (truncated eigenfunction expansion)',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Concentration' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

Plotly.newPlot('analytic-plot', [analyticalTrace], analyticalLayout, {responsive: true});



// Create difference line plot
const differenceTrace = {
    x: Array.from({length: differenceData[1].length}, (_, i) => i),
    y: differenceData[1],
    type: 'scatter',
    mode: 'lines',
}; 

const differenceLayout = {
    title: {
        text: 'Difference Between ADI and Analytical Solution',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Absolute Difference' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

Plotly.newPlot('comparison-plot', [differenceTrace], differenceLayout, {responsive: true});

// Create log difference line plot
const logDifferenceTrace = {
    x: Array.from({length: logDifferenceData[1].length}, (_, i) => i),
    y: logDifferenceData[1],
    type: 'scatter',
    mode: 'lines',
};

const logDifferenceLayout = {
    title: {
        text: 'Logarithmic Diff Between ADI and Analytical Solution',
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Log10 Absolute Difference' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

Plotly.newPlot('log-comparison-plot', [logDifferenceTrace], logDifferenceLayout, {responsive: true});


// Create effective solution line plot
const effectiveTrace = {
    x: Array.from({length: effectiveData[1].length}, (_, i) => i),
    y: effectiveData[1],
    type: 'scatter',
    mode: 'lines',
};

const effectiveLayout = {
    title: {
        text: `Eff. Solution (λ=${lambda}, Scale=${scale})`,
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Concentration' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

    Plotly.newPlot(`effective-plot`, [effectiveTrace], effectiveLayout, {responsive: true});



const differenceEffectiveAnalyticTrace = {
    x: Array.from({length: differenceEffectiveAnalyticData[1].length}, (_, i) => i),
    y: differenceEffectiveAnalyticData[1],
    type: 'scatter',
    mode: 'lines',
};

const differenceEffectiveAnalyticLayout = {
    title: {
        text: `Diff Between Effective and Analytic Solution`,
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Absolute Difference' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};

    Plotly.newPlot(`difference-effective-analytic-plot`, [differenceEffectiveAnalyticTrace], differenceEffectiveAnalyticLayout, {responsive: true});

const logDifferenceEffectiveAnalyticTrace = {
    x: Array.from({length: logDifferenceEffectiveAnalyticData[1].length}, (_, i) => i),
    y: logDifferenceEffectiveAnalyticData[1],
    type: 'scatter',
    mode: 'lines',
};

const logDifferenceEffectiveAnalyticLayout = {
    title: {
        text: `Log Diff Between Effective and Analytic Solutions`,
        font: { size: 20 }
    },
    xaxis: { title: { text: 'X Position' } },
    yaxis: { title: { text: 'Log10 Absolute Difference' } },
    margin: { t: 30, b: 80, l: 80, r: 50 },
};
    Plotly.newPlot(`log-difference-effective-analytic-plot`, [logDifferenceEffectiveAnalyticTrace], logDifferenceEffectiveAnalyticLayout, {responsive: true});  
