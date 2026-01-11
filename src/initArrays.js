// Utility functions for ADI method and diagonals generation

const generateDiagonals = (length, alpha, gamma) => {
    const lowerDiagonal = new Float64Array(length).fill(-alpha);
    const mainDiagonal = new Float64Array(length).fill(1 + 2 * alpha + gamma);
    const upperDiagonal = new Float64Array(length).fill(-alpha);
    const rightHandSide = new Float64Array(length);
    mainDiagonal[0] = 1 + alpha + gamma;
    mainDiagonal[length - 1] = 1 + alpha + gamma;
    lowerDiagonal[0] = 0;
    upperDiagonal[length - 1] = 0;
    return { lowerDiagonal, mainDiagonal, upperDiagonal, rightHandSide };
};

export const initADIArrays = (WIDTH, HEIGHT, DIFFUSION_RATE, deltaX, deltaT, decayRate) => {
    const modifiedUpperDiagonal1 = new Float64Array(WIDTH);
    const modifiedRightHandSide1 = new Float64Array(WIDTH);
    const solution1 = new Float64Array(WIDTH);
    const modifiedUpperDiagonal2 = new Float64Array(HEIGHT);
    const modifiedRightHandSide2 = new Float64Array(HEIGHT);
    const solution2 = new Float64Array(HEIGHT);
    const intermediateConcentration = new Float64Array(WIDTH * HEIGHT);
    const scaledSources = new Float64Array(WIDTH * HEIGHT);

    const alpha = (DIFFUSION_RATE * deltaT) / (2 * deltaX * deltaX);
    const gamma = (decayRate * deltaT) / 4;
    const {
        lowerDiagonal: a1,
        mainDiagonal: b1,
        upperDiagonal: c1,
        rightHandSide: d1,
    } = generateDiagonals(WIDTH, alpha, gamma);
    const {
        lowerDiagonal: a2,
        mainDiagonal: b2,
        upperDiagonal: c2,
        rightHandSide: d2,
    } = generateDiagonals(HEIGHT, alpha, gamma);
    const halfDeltaT = deltaT / 2;
    const oneMinus2AlphaMinusGamma = 1 - 2 * alpha - gamma;
    console.log("ADI arrays initialized");
    return {
        modifiedUpperDiagonal1,
        modifiedRightHandSide1,
        solution1,
        modifiedUpperDiagonal2,
        modifiedRightHandSide2,
        solution2,
        intermediateConcentration,
        a1,
        b1,
        c1,
        d1,
        a2,
        b2,
        c2,
        d2,
        alpha,
        halfDeltaT,
        oneMinus2AlphaMinusGamma,
        scaledSources,
        deltaT,
    };
};
