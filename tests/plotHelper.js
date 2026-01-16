import fs from 'fs';
import path from 'path';

// Store accumulated plots
let accumulatedPlots = [];

/**
 * Add a plot to the collection
 */
function addPlot(data, layout, title) {
    
    accumulatedPlots.push({ data, layout, title });
}

/**
 * Generate a single HTML file with all accumulated plots
 */
export function generateAllPlots(filename = 'test-plots', outputDir = 'test-plots') {


    const dir = path.resolve(outputDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Generate plot divs and scripts
    const plotDivs = accumulatedPlots.map((_, idx) => 
        `<div id="plot${idx}" style="margin-bottom: 40px;"></div>`
    ).join('\n        ');

    const plotScripts = accumulatedPlots.map((plot, idx) => `
        // ${plot.title}
        Plotly.newPlot('plot${idx}', ${JSON.stringify(plot.data)}, ${JSON.stringify(plot.layout)});
    `).join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Plots</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        #plot-container > div {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <h1>Diffusion Algorithm Test Results</h1>
    <div id="plot-container">
        ${plotDivs}
    </div>
    <script>
        ${plotScripts}
    </script>
</body>
</html>
`;

    const filepath = path.join(dir, `${filename}.html`);
    fs.writeFileSync(filepath, html);
    console.log(`\n📊 All plots saved to: ${filepath}`);
    console.log(`   Generated ${accumulatedPlots.length} plots\n`);
    
    // Clear accumulated plots
    accumulatedPlots = [];
}

/**
 * Legacy function for backward compatibility
 */
export function generatePlot(data, layout, filename, outputDir = 'test-plots') {
    addPlot(data, layout, filename);
}

/**
 * Create a 1D line plot comparing two solutions
 */
export function plot1DComparison(numerical, analytical, sources, title = 'Comparison') {
    const x = Array.from({ length: numerical.length }, (_, i) => i);
    
    const data = [
        {
            x,
            y: Array.from(numerical),
            mode: 'lines',
            name: 'Numerical (ADI)',
            line: { color: 'blue', width: 2 }
        },
        {
            x,
            y: Array.from(analytical),
            mode: 'lines',
            name: 'Analytical',
            line: { color: 'red', width: 2, dash: 'dash' }
        }
    ];

    // Add source markers if provided
    if (sources) {
        const sourceIndices = [];
        const sourceValues = [];
        for (let i = 0; i < sources.length; i++) {
            if (sources[i] > 0) {
                sourceIndices.push(i);
                sourceValues.push(Math.max(...numerical) * 1.1);
            }
        }
        if (sourceIndices.length > 0) {
            data.push({
                x: sourceIndices,
                y: sourceValues,
                mode: 'markers',
                name: 'Sources',
                marker: { color: 'green', size: 8, symbol: 'triangle-down' }
            });
        }
    }

    const layout = {
        title,
        xaxis: { title: 'Position' },
        yaxis: { title: 'Concentration' },
        showlegend: true
    };

    generatePlot(data, layout, title.replace(/\s+/g, '_'));
}

/**
 * Create a difference plot
 */
export function plotDifference(differences, title = 'Difference') {
    const x = Array.from({ length: differences.length }, (_, i) => i);
    
    const data = [{
        x,
        y: Array.from(differences),
        mode: 'lines',
        name: 'Numerical - Analytical',
        line: { color: 'purple', width: 2 }
    }];

    const layout = {
        title,
        xaxis: { title: 'Position' },
        yaxis: { title: 'Difference' },
        showlegend: true
    };

    generatePlot(data, layout, title.replace(/\s+/g, '_'));
}

/**
 * Create a 2D heatmap
 */
export function plot2DHeatmap(data2D, width, height, title = 'Heatmap') {
    // Convert 1D array to 2D for Plotly
    const z = [];
    for (let j = height - 1; j >= 0; j--) {
        const row = [];
        for (let i = 0; i < width; i++) {
            row.push(data2D[j * width + i]);
        }
        z.push(row);
    }

    const plotData = [{
        z,
        type: 'heatmap',
        colorscale: 'Viridis'
    }];

    const layout = {
        title,
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' }
    };

    generatePlot(plotData, layout, title.replace(/\s+/g, '_'));
}
