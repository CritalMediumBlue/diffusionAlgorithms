/**
 * Numerical tolerance for pivot detection to prevent division by zero.
 * MATLAB and other solver documentation recommend tolerances around 1e-10.
 * @constant {number}
 */
const tolerance = 1e-10;

/**
 * Solves a tridiagonal system of linear equations using the Thomas algorithm.
 *
 * The Thomas algorithm is a specialized form of Gaussian elimination for tridiagonal matrices
 * that runs in O(n) time complexity. It's particularly useful for solving systems arising from
 * finite difference discretizations of differential equations, such as diffusion equations.
 *
 * The algorithm solves systems of the form:
 * ```
 * [b₀ c₀  0  0 ...] [x₀]   [d₀]
 * [a₁ b₁ c₁  0 ...] [x₁]   [d₁]
 * [ 0 a₂ b₂ c₂ ...] [x₂] = [d₂]
 * [ 0  0 a₃ b₃ ...] [x₃]   [d₃]
 * [...            ] [..]   [..]
 * ```
 *
 * @param {Float64Array|Array<number>} lowerDiagonal - Lower diagonal elements (a₁, a₂, ..., aₙ₋₁).
 *                                        First element (index 0) is ignored as it doesn't exist.
 * @param {Float64Array|Array<number>} mainDiagonal - Main diagonal elements (b₀, b₁, ..., bₙ₋₁).
 * @param {Float64Array|Array<number>} upperDiagonal - Upper diagonal elements (c₀, c₁, ..., cₙ₋₂).
 *                                        Last element (index n-1) is ignored as it doesn't exist.
 * @param {Float64Array|Array<number>} rightHandSide - Right-hand side vector (d₀, d₁, ..., dₙ₋₁).
 * @param {number} n - Size of the system (number of equations/unknowns).
 * @param {Float64Array|Array<number>} modifiedUpperDiagonal - Pre-allocated array to store modified upper diagonal
 *                                                during forward elimination. Must have length n.
 * @param {Float64Array|Array<number>} modifiedRightHandSide - Pre-allocated array to store modified right-hand side
 *                                                during forward elimination. Must have length n.
 * @param {Float64Array|Array<number>} solution - Pre-allocated array where the solution vector will be stored.
 *                                   Must have length n. Contains (x₀, x₁, ..., xₙ₋₁) after execution.
 *
 * @returns {void} The function modifies the `solution` array in-place.
 *
 * @note The algorithm handles near-singular matrices by replacing pivots smaller than
 * 1e-10 with the tolerance value to prevent division by zero. For truly singular matrices,
 * results may be numerically unstable.
 *
 * @complexity Time: O(n), Space: O(1) additional (uses pre-allocated arrays)
 *
 * @example
 * // Solve a simple 3x3 tridiagonal system
 * const n = 3;
 * const lower = [0, 1, 1];          // First element unused
 * const main = [2, 2, 2];
 * const upper = [1, 1, 0];          // Last element unused
 * const rhs = [3, 4, 3];
 * 
 * // Pre-allocate working arrays
 * const modUpper = new Float64Array(n);
 * const modRHS = new Float64Array(n);
 * const solution = new Float64Array(n);
 * 
 * thomasAlgorithm(lower, main, upper, rhs, n, modUpper, modRHS, solution);
 * console.log(solution); // [1, 1, 1]
 *
 * @see {@link ADI} Uses this algorithm for implicit solving
 * @see {@link initADIArrays} Pre-allocates working arrays
 *
 * @reference Thomas, L. H. (1949). Elliptic problems in linear difference equations 
 * over a network. Watson Sci. Comput. Lab. Rept., Columbia University, New York.
 */
export function thomasAlgorithm(
    lowerDiagonal,
    mainDiagonal,
    upperDiagonal,
    rightHandSide,
    n,
    modifiedUpperDiagonal,
    modifiedRightHandSide,
    solution
) {
    // =====================================================================
    // FORWARD ELIMINATION PHASE
    // =====================================================================
    // Transform the tridiagonal matrix to upper triangular form by eliminating
    // the lower diagonal elements. This modifies the upper diagonal and RHS.

    // Handle the first row (i = 0)
    // Check for near-zero pivot to prevent numerical instability
    let pivot = mainDiagonal[0];
    if (Math.abs(pivot) < tolerance) {
        // Replace near-zero pivot with tolerance to avoid division by zero
        pivot = pivot >= 0 ? tolerance : -tolerance;
    }
    const invPivot = 1.0 / pivot;

    // Normalize first row: divide upper diagonal and RHS by pivot
    modifiedUpperDiagonal[0] = upperDiagonal[0] * invPivot;
    modifiedRightHandSide[0] = rightHandSide[0] * invPivot;

    // Process remaining rows (i = 1 to n-1)
    for (let i = 1; i < n; i++) {
        const l_i = lowerDiagonal[i]; // Lower diagonal element at row i
        const u_prime_prev = modifiedUpperDiagonal[i - 1]; // Modified upper diagonal from previous row
        const d_prime_prev = modifiedRightHandSide[i - 1]; // Modified RHS from previous row

        // Calculate the new diagonal element after eliminating lower diagonal
        // This is: b_i - a_i * c'_{i-1}
        let currentDenominator = mainDiagonal[i] - l_i * u_prime_prev;

        // Check for near-zero denominator to prevent numerical instability
        if (Math.abs(currentDenominator) < tolerance) {
            // Replace near-zero denominator with tolerance to avoid division by zero
            currentDenominator = currentDenominator >= 0 ? tolerance : -tolerance;
        }
        const invDenominator = 1.0 / currentDenominator;

        // Update modified arrays for current row
        // Modified upper diagonal: c_i / (b_i - a_i * c'_{i-1})
        modifiedUpperDiagonal[i] = upperDiagonal[i] * invDenominator;
        // Modified RHS: (d_i - a_i * d'_{i-1}) / (b_i - a_i * c'_{i-1})
        modifiedRightHandSide[i] = (rightHandSide[i] - l_i * d_prime_prev) * invDenominator;
    }

    // =====================================================================
    // BACKWARD SUBSTITUTION PHASE
    // =====================================================================
    // Solve the upper triangular system by working backwards from the last equation.

    // Last equation is already solved: x_{n-1} = d'_{n-1}
    solution[n - 1] = modifiedRightHandSide[n - 1];

    // Solve remaining equations working backwards
    for (let i = n - 2; i >= 0; i--) {
        // x_i = d'_i - c'_i * x_{i+1}
        solution[i] = modifiedRightHandSide[i] - modifiedUpperDiagonal[i] * solution[i + 1];
    }
}
