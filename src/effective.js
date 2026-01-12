const localInfluenceOfSources = (x,y,sources,width, height, lambda) => { //for a single bacteria located at x,y.
    // Precompute non-zero source locations
    if (sources.length !== width * height) {
        throw new Error("Sources array length does not match grid dimensions.");
    }
    const activeSourceIndices = [];
    for (let idx = 0; idx < sources.length; idx++) {
        if (sources[idx] !== 0) activeSourceIndices.push(idx);
    }
    let sum = 0;
    for (const idx of activeSourceIndices) {
        const i = idx % width;
        const j = Math.floor(idx / width);
        const dx = (i + 0.5) - x;
        const dy = (j + 0.5) - y;
        const eucledianDistance = Math.sqrt(dx * dx + dy * dy);
        sum += sources[idx] * Math.exp(- eucledianDistance / lambda);
    }
    return sum;
}

const localInfluenceOfAllCells = (x,y,width, height, lambda) => { //for a single bacteria located at x,y.
    let sum = 0;
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const dx = (i + 0.5) - x;
            const dy = (j + 0.5) - y;
            const eucledianDistance = Math.sqrt(dx * dx + dy * dy);
            sum += Math.exp(- eucledianDistance / lambda);
                }
    }
    return sum;
}


export const efectiveInfluence = (width, height, sources, lambda, scale) => {
    const effectiveInfluenceArray = new Float64Array(width * height).fill(0);
    
    // Precompute active sources once
    const activeSources = [];
    for (let idx = 0; idx < sources.length; idx++) {
        if (sources[idx] !== 0) {
            activeSources.push({
                idx,
                x: (idx % width) + 0.5,
                y: Math.floor(idx / width) + 0.5,
                strength: sources[idx]
            });
        }
    }
    
    // Distance cutoff: beyond 5*lambda, exp(-5) ≈ 0.007 (negligible)
    const cutoffDistance = lambda * 5;
    const cutoffDistanceSq = cutoffDistance * cutoffDistance;
    
    // For each target cell
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const targetX = i + 0.5;
            const targetY = j + 0.5;
            
            let localInfluence = 0;
            let totalInfluence = 0;
            
            // Single pass through all cells
            for (let jj = 0; jj < height; jj++) {
                for (let ii = 0; ii < width; ii++) {
                    const cellX = ii + 0.5;
                    const cellY = jj + 0.5;
                    const dx = cellX - targetX;
                    const dy = cellY - targetY;
                    const distSq = dx * dx + dy * dy;
                    
                    // Apply distance cutoff
                    if (distSq > cutoffDistanceSq) continue;
                    
                    const distance = Math.sqrt(distSq);
                    const influence = Math.exp(-distance / lambda);
                    
                    totalInfluence += influence;
                    
                    // Check if this cell is a source
                    const cellIdx = jj * width + ii;
                    if (sources[cellIdx] !== 0) {
                        localInfluence += sources[cellIdx] * influence;
                    }
                }
            }
            
            const idx = j * width + i;
            effectiveInfluenceArray[idx] = totalInfluence > 0 ? 
                scale * localInfluence / totalInfluence : 0;
        }
    }
    
    return effectiveInfluenceArray;
}

