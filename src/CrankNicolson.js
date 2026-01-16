import { thomasAlgorithm } from "./thomasAlgorithm.js";

// Module-level variables for Crank-Nicolson
let LENGTH;
let lowerDiagonal, mainDiagonal, upperDiagonal;
let modifiedUpper, modifiedRHS, solution;
let u, uNext;
let lambda, beta, halfLambda, centerCoeff;
let dt;

/**
 * Initialize properties for Crank-Nicolson method
 * @param {number} length - Number of grid points
 * @param {number} diffusionCoefficient - Diffusion coefficient (alpha)
 * @param {number} deltaX - Spatial step size
 * @param {number} deltaT - Time step size
 * @param {number} decayRate - Decay rate constant (k)
 */
export const setCNProperties = (
    length,
    diffusionCoefficient,
    deltaX,
    deltaT,
    decayRate = 0
) => {
    LENGTH = length;
    dt = deltaT;

    // Calculate coefficients
    lambda = (diffusionCoefficient * deltaT) / (deltaX * deltaX);
    beta = (decayRate * deltaT) / 2.0;
    halfLambda = 0.5 * lambda;
    centerCoeff = 1.0 + lambda + beta;

    // Tridiagonal coefficients for A (left-hand side)
    lowerDiagonal = new Float64Array(LENGTH);
    mainDiagonal = new Float64Array(LENGTH);
    upperDiagonal = new Float64Array(LENGTH);

    // Interior coefficients
    for (let i = 1; i < LENGTH - 1; i++) {
        lowerDiagonal[i] = -halfLambda;
        mainDiagonal[i] = centerCoeff;
        upperDiagonal[i] = -halfLambda;
    }

    // Neumann (reflective) boundaries using centered differences with ghost cells
    // u_{-1} = u_1 and u_n = u_{n-2} for zero flux
    // Left boundary i = 0: stencil becomes (1+λ+β)u_0 - λu_1
    lowerDiagonal[0] = 0.0;
    mainDiagonal[0] = centerCoeff;
    upperDiagonal[0] = -lambda;

    // Right boundary i = LENGTH-1: stencil becomes -λu_{n-2} + (1+λ+β)u_{n-1}
    lowerDiagonal[LENGTH - 1] = -lambda;
    mainDiagonal[LENGTH - 1] = centerCoeff;
    upperDiagonal[LENGTH - 1] = 0.0;

    // Work arrays for Thomas algorithm
    modifiedUpper = new Float64Array(LENGTH);
    modifiedRHS = new Float64Array(LENGTH);
    solution = new Float64Array(LENGTH);

    // Solution arrays
    u = new Float64Array(LENGTH);
    uNext = new Float64Array(LENGTH);
};

/**
 * Solve 1D diffusion equation using Crank-Nicolson method
 * @param {Float64Array} concentrationData - Initial concentration values
 * @param {Float64Array} sources - Source terms
 * @param {number} totalNumberOfIterations - Number of time steps
 * @param {boolean} allowNegativeValues - Whether to allow negative concentrations
 */
export const CrankNicolson = (
    concentrationData,
    sources,
    totalNumberOfIterations,
    allowNegativeValues = false
) => {
  

    // Copy initial condition
    for (let i = 0; i < LENGTH; i++) {
        u[i] = concentrationData[i];
    }

    // Time-stepping loop
    for (let step = 0; step < totalNumberOfIterations; step++) {
        // Build right-hand side d = B*u^n + dt*S, with Neumann BC via mirroring.
        const d = modifiedRHS;

        // Left boundary i = 0, using ghost cell u_{-1} = u_1 for zero flux
        // B coefficients: (λ/2) u_{i-1}^n + (1 - λ - β) u_i^n + (λ/2) u_{i+1}^n
        // Substituting u_{-1} = u_1: (λ/2) u_1 + (1 - λ - β) u_0 + (λ/2) u_1
        {
            const i = 0;
            const u_im1 = u[1];       // ghost cell: u_{-1} = u_1
            const u_i   = u[0];
            const u_ip1 = u[1];

            const rhsVal =
                halfLambda * u_im1 +
                (1.0 - lambda - beta) * u_i +
                halfLambda * u_ip1 +
                dt * sources[i];

            d[i] = rhsVal;
        }

        // Interior points 1..LENGTH-2
        for (let i = 1; i < LENGTH - 1; i++) {
            const u_im1 = u[i - 1];
            const u_i   = u[i];
            const u_ip1 = u[i + 1];

            const rhsVal =
                halfLambda * u_im1 +
                (1.0 - lambda - beta) * u_i +
                halfLambda * u_ip1 +
                dt * sources[i];

            d[i] = rhsVal;
        }

        // Right boundary i = LENGTH-1, using ghost cell u_n = u_{n-2} for zero flux
        // Substituting u_n = u_{n-2}: (λ/2) u_{n-2} + (1 - λ - β) u_{n-1} + (λ/2) u_{n-2}
        {
            const i = LENGTH - 1;
            const u_im1 = u[LENGTH - 2];
            const u_i   = u[LENGTH - 1];
            const u_ip1 = u[LENGTH - 2];   // ghost cell: u_n = u_{n-2}

            const rhsVal =
                halfLambda * u_im1 +
                (1.0 - lambda - beta) * u_i +
                halfLambda * u_ip1 +
                dt * sources[i];

            d[i] = rhsVal;
        }

        // Solve A u^{n+1} = d
        thomasAlgorithm(
            lowerDiagonal,
            mainDiagonal,
            upperDiagonal,
            d,
            LENGTH,
            modifiedUpper,
            modifiedRHS,
            solution
        );

        // Copy solution and optionally check for negativity
        let hasNegative = false;
        for (let i = 0; i < LENGTH; i++) {
            uNext[i] = solution[i];
            if (!allowNegativeValues && uNext[i] < 0) {
                hasNegative = true;
            }
        }

        if (hasNegative && !allowNegativeValues) {
            throw new Error(
                "Negative concentrations encountered in CrankNicolson step " + step
            );
        }

        // Swap u and uNext without reallocating
        const tmp = u;
        u = uNext;
        uNext = tmp;
    }

    // Copy result back to concentrationData
    for (let i = 0; i < LENGTH; i++) {
        concentrationData[i] = u[i];
    }
};
