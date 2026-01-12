
export const createRandomSources = (width, height, probability) => {
const sources = new Float64Array(width * height);
for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
        const idx = j * width + i;
        sources[idx] = Math.random() < probability ? 1.0 : 0.0;
    }
}
return sources;
}

export const checkForSteadyState = (prev, current, tolerance = 1e-5) => {
    let maxDiff = 0;
    for (let i = 0; i < prev.length; i++) {
        const diff = Math.abs(current[i] - prev[i]);
        if (diff > maxDiff) {
            maxDiff = diff;
        }
    }
    return maxDiff < tolerance;
};

// Convert 1D arrays to 2D matrices for Plotly
export const convertTo2D = (array, width, height) => {
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


// Compute and display difference
export const calculateDifference = (grid1, grid2) => {
    const difference = new Float64Array(grid1.length);
    for (let i = 0; i < grid1.length; i++) {
        difference[i] = Math.abs(grid1[i] - grid2[i]);
    }
    return difference;
};



