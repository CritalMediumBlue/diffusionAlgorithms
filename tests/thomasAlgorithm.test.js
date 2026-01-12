import { thomasAlgorithm } from "../src/thomasAlgorithm";
import { describe, test, expect } from "vitest";

// Helper function to create diffusion-type tridiagonal system
const createDiagonals = (matrixSize, alpha) => {
    const lowerDiagonal = new Float64Array(matrixSize).fill(-alpha);
    const mainDiagonal = new Float64Array(matrixSize).fill(1 + 2 * alpha);
    const upperDiagonal = new Float64Array(matrixSize).fill(-alpha);

    // Apply boundary conditions
    lowerDiagonal[0] = 0;
    upperDiagonal[matrixSize - 1] = 0;
    mainDiagonal[0] = 1 + alpha;
    mainDiagonal[matrixSize - 1] = 1 + alpha;

    return { lowerDiagonal, mainDiagonal, upperDiagonal };
};

// Helper function to calculate right-hand side from known solution
const calculateRightHandSide = (lowerDiag, mainDiag, upperDiag, knownSolution, systemSize) => {
    const rightHandSide = new Float64Array(systemSize);

    // First row (boundary condition)
    rightHandSide[0] = mainDiag[0] * knownSolution[0] + upperDiag[0] * knownSolution[1];

    // Interior rows
    for (let i = 1; i < systemSize - 1; i++) {
        rightHandSide[i] =
            lowerDiag[i] * knownSolution[i - 1] +
            mainDiag[i] * knownSolution[i] +
            upperDiag[i] * knownSolution[i + 1];
    }

    // Last row (boundary condition)
    rightHandSide[systemSize - 1] =
        lowerDiag[systemSize - 1] * knownSolution[systemSize - 2] +
        mainDiag[systemSize - 1] * knownSolution[systemSize - 1];

    return rightHandSide;
};

describe("Thomas Algorithm", () => {
    const tolerance = 1e-9;

    describe("Cases that can be solved by hand", () => {
        test("solves an easy system", () => {
            // Arrange
            const systemSize = 5;
            const lowerDiagonal = [0, -1, -1, -1, -3];
            const mainDiagonal = [2, 2, 2, 2, 4];
            const upperDiagonal = [-1, -1, -1, -1, 0];
            const rightHandSide = [3, 1, 25, 8, 2];
            const expectedSolution = [23.25, 43.5, 62.75, 57.0, 43.25];

            const modUpperDiag = new Float64Array(systemSize);
            const modRightSide = new Float64Array(systemSize);
            const solutionArray = new Float64Array(systemSize);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                systemSize,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < systemSize; i++) {
                expect(Math.abs(solutionArray[i] - expectedSolution[i])).toBeLessThan(tolerance);
            }
        });

        test("solves an easy system with a small pivot", () => {
            // Arrange
            const systemSize = 5;
            const lowerDiagonal = [0, -1, -1, -1, -3];
            const mainDiagonal = [9.9e-11, 2, 2, 2, 4]; // 9.5e-11 is less than the tolerance of 1e-10
            const upperDiagonal = [-1, -1, -1, -1, 0];
            const rightHandSide = [-43.49999999769825, 1, 25, 8, 2];
            const expectedSolution = [23.25, 43.5, 62.75, 57.0, 43.25];

            const modUpperDiag = new Float64Array(systemSize);
            const modRightSide = new Float64Array(systemSize);
            const solutionArray = new Float64Array(systemSize);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                systemSize,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < systemSize; i++) {
                expect(Math.abs(solutionArray[i] - expectedSolution[i])).toBeLessThan(tolerance);
            }
        });

        test("solves an easy system with a small negative pivot", () => {
            // Arrange
            const systemSize = 5;
            const lowerDiagonal = [0, -1, -1, -1, -3];
            const mainDiagonal = [-9.99e-11, 2, 2, 2, 4]; // -9.99e-11 is less than the tolerance of 1e-10
            const upperDiagonal = [-1, -1, -1, -1, 0];
            const rightHandSide = [-43.50000000232267, 1, 25, 8, 2];
            const expectedSolution = [23.25, 43.5, 62.75, 57.0, 43.25];

            const modUpperDiag = new Float64Array(systemSize);
            const modRightSide = new Float64Array(systemSize);
            const solutionArray = new Float64Array(systemSize);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                systemSize,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < systemSize; i++) {
                expect(Math.abs(solutionArray[i] - expectedSolution[i])).toBeLessThan(tolerance);
            }
        });

        test("solves an easy system with a very small pivot", () => {
            // Arrange
            const systemSize = 5;
            const lowerDiagonal = [0, -1, -1, -1, -3];
            const mainDiagonal = [1e-12, 2, 2, 2, 4];
            const upperDiagonal = [-1, -1, -1, -1, 0];
            const rightHandSide = [-43.499999997675, 1, 25, 8, 2];
            const expectedSolution = [23.25, 43.5, 62.75, 57.0, 43.25];

            const modUpperDiag = new Float64Array(systemSize);
            const modRightSide = new Float64Array(systemSize);
            const solutionArray = new Float64Array(systemSize);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                systemSize,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < systemSize; i++) {
                expect(Math.abs(solutionArray[i] - expectedSolution[i])).toBeLessThan(tolerance);
            }
        });

        test("checks if the pivot is replaced by the value of the tolerance by comparing the solutions of 2 systems", () => {
            // Arrange
            const systemSize = 5;
            const lowerDiagonal1 = [0, -1, -1, -1, -3];
            const mainDiagonal1 = [1e-12, 2, 2, 2, 4]; // 1e-12 is less than the tolerance of 1e-10
            const upperDiagonal1 = [-1, -1, -1, -1, 0];
            const rightHandSide1 = [3.14159265, 42, 25, 8, 28];

            const modUpperDiag1 = new Float64Array(systemSize);
            const modRightSide1 = new Float64Array(systemSize);
            const solutionArray1 = new Float64Array(systemSize);

            const lowerDiagonal2 = [0, -1, -1, -1, -3];
            const mainDiagonal2 = [1e-10, 2, 2, 2, 4]; // the value of the tolerance is 1e-10
            const upperDiagonal2 = [-1, -1, -1, -1, 0];
            const rightHandSide2 = [3.14159265, 42, 25, 8, 28];

            const modUpperDiag2 = new Float64Array(systemSize);
            const modRightSide2 = new Float64Array(systemSize);
            const solutionArray2 = new Float64Array(systemSize);

            // Act
            thomasAlgorithm(
                lowerDiagonal1,
                mainDiagonal1,
                upperDiagonal1,
                rightHandSide1,
                systemSize,
                modUpperDiag1,
                modRightSide1,
                solutionArray1
            );

            thomasAlgorithm(
                lowerDiagonal2,
                mainDiagonal2,
                upperDiagonal2,
                rightHandSide2,
                systemSize,
                modUpperDiag2,
                modRightSide2,
                solutionArray2
            );

            // Assert
            for (let i = 0; i < systemSize; i++) {
                expect(Math.abs(solutionArray2[i] - solutionArray1[i])).toBeLessThan(tolerance);
            }
        });

        test("checks if the negative pivot is replaced by the negative value of the tolerance by comparing the solutions of 2 systems", () => {
            // Arrange
            const systemSize = 5;
            const lowerDiagonal1 = [0, -1, -1, -1, -3];
            const mainDiagonal1 = [-1.42e-11, 2, 2, 2, 4]; // 1.42e-11 is less than the tolerance of 1e-10
            const upperDiagonal1 = [-1, -1, -1, -1, 0];
            const rightHandSide1 = [3.14159265358979, 42, 1.5, 28, 2];

            const modUpperDiag1 = new Float64Array(systemSize);
            const modRightSide1 = new Float64Array(systemSize);
            const solutionArray1 = new Float64Array(systemSize);

            const lowerDiagonal2 = [0, -1, -1, -1, -3];
            const mainDiagonal2 = [-1e-10, 2, 2, 2, 4]; // the value of the tolerance is 1e-10
            const upperDiagonal2 = [-1, -1, -1, -1, 0];
            const rightHandSide2 = [3.14159265358979, 42, 1.5, 28, 2];

            const modUpperDiag2 = new Float64Array(systemSize);
            const modRightSide2 = new Float64Array(systemSize);
            const solutionArray2 = new Float64Array(systemSize);

            // Act
            thomasAlgorithm(
                lowerDiagonal1,
                mainDiagonal1,
                upperDiagonal1,
                rightHandSide1,
                systemSize,
                modUpperDiag1,
                modRightSide1,
                solutionArray1
            );

            thomasAlgorithm(
                lowerDiagonal2,
                mainDiagonal2,
                upperDiagonal2,
                rightHandSide2,
                systemSize,
                modUpperDiag2,
                modRightSide2,
                solutionArray2
            );

            // Assert
            for (let i = 0; i < systemSize; i++) {
                expect(Math.abs(solutionArray2[i] - solutionArray1[i])).toBeLessThan(tolerance);
            }
        });

        test("checks if the small denominator is replaced by the value of the tolerance", () => {
            // Arrange
            const systemSize = 5;
            const lowerDiagonal1 = [0, -1, -1, -1, -3];
            const mainDiagonal1 = [2, 2, 0.6666666666666666 + 1e-10 / 2, 2, 4];
            const upperDiagonal1 = [-1, -1, -1, -1, 0];
            const rightHandSide1 = [123, 456, 3.1415926535, 8, 42];

            const modUpperDiag1 = new Float64Array(systemSize);
            const modRightSide1 = new Float64Array(systemSize);
            const solutionArray1 = new Float64Array(systemSize);

            const lowerDiagonal2 = [0, -1, -1, -1, -3];
            const mainDiagonal2 = [2, 2, 0.6666666666666666 + 1e-10, 2, 4];
            const upperDiagonal2 = [-1, -1, -1, -1, 0];
            const rightHandSide2 = [123, 456, 3.1415926535, 8, 42];

            const modUpperDiag2 = new Float64Array(systemSize);
            const modRightSide2 = new Float64Array(systemSize);
            const solutionArray2 = new Float64Array(systemSize);

            // Act
            thomasAlgorithm(
                lowerDiagonal1,
                mainDiagonal1,
                upperDiagonal1,
                rightHandSide1,
                systemSize,
                modUpperDiag1,
                modRightSide1,
                solutionArray1
            );

            thomasAlgorithm(
                lowerDiagonal2,
                mainDiagonal2,
                upperDiagonal2,
                rightHandSide2,
                systemSize,
                modUpperDiag2,
                modRightSide2,
                solutionArray2
            );

            // Assert
            for (let i = 0; i < systemSize; i++) {
                expect(Math.abs(solutionArray2[i] - solutionArray1[i])).toBeLessThan(tolerance);
            }
        });
        test("checks if the negative small denominator is replaced by the negative value of the tolerance", () => {
            // Arrange
            const n = 5;
            const lowerDiagonal1 = [0, -1, -1, -1, -3];
            const mainDiagonal1 = [2, 2, 0.6666666666666666 - 1e-10 / 2, 2, 4];
            const upperDiagonal1 = [-1, -1, -1, -1, 0];
            const rightHandSide1 = [123, 456, 3.1415926535, 8, 42];

            const modUpperDiag1 = new Float64Array(n);
            const modRightSide1 = new Float64Array(n);
            const solutionArray1 = new Float64Array(n);

            const lowerDiagonal2 = [0, -1, -1, -1, -3];
            const mainDiagonal2 = [2, 2, 0.6666666666666666 - 1e-10, 2, 4];
            const upperDiagonal2 = [-1, -1, -1, -1, 0];
            const rightHandSide2 = [123, 456, 3.1415926535, 8, 42];

            const modUpperDiag2 = new Float64Array(n);
            const modRightSide2 = new Float64Array(n);
            const solutionArray2 = new Float64Array(n);

            // Act
            thomasAlgorithm(
                lowerDiagonal1,
                mainDiagonal1,
                upperDiagonal1,
                rightHandSide1,
                n,
                modUpperDiag1,
                modRightSide1,
                solutionArray1
            );

            thomasAlgorithm(
                lowerDiagonal2,
                mainDiagonal2,
                upperDiagonal2,
                rightHandSide2,
                n,
                modUpperDiag2,
                modRightSide2,
                solutionArray2
            );

            // Assert
            for (let i = 0; i < n; i++) {
                expect(Math.abs(solutionArray2[i] - solutionArray1[i])).toBeLessThan(tolerance);
            }
        });
    });

    describe("Diffusion-type systems", () => {
        test("solves a large diffusion system", () => {
            // Arrange
            const n = 100;
            const alpha = 1.0;
            const { lowerDiagonal, mainDiagonal, upperDiagonal } = createDiagonals(n, alpha);

            // Create known solution using sine wave
            const knownSolution = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                knownSolution[i] = Math.sin((i * 2 * Math.PI) / (n - 1));
            }

            const rightHandSide = calculateRightHandSide(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                knownSolution,
                n
            );
            const modUpperDiag = new Float64Array(n);
            const modRightSide = new Float64Array(n);
            const solutionArray = new Float64Array(n);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                n,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < n; i++) {
                expect(Math.abs(solutionArray[i] - knownSolution[i])).toBeLessThan(tolerance);
            }
        });

        test("solves a very large diffusion system", () => {
            // Arrange
            const n = 10000;
            const alpha = 3;
            const { lowerDiagonal, mainDiagonal, upperDiagonal } = createDiagonals(n, alpha);

            // Create known solution using sine wave with random component
            const knownSolution = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                knownSolution[i] = 1e6 * (Math.random() - 0.5);
            }

            const rightHandSide = calculateRightHandSide(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                knownSolution,
                n
            );
            const modUpperDiag = new Float64Array(n);
            const modRightSide = new Float64Array(n);
            const solutionArray = new Float64Array(n);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                n,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < n; i++) {
                expect(Math.abs(solutionArray[i] - knownSolution[i])).toBeLessThan(tolerance);
            }
        });

        test("solves a huge diffusion system with small alpha", () => {
            // Arrange
            const n = 100000;
            const alpha = 1e-10;
            const { lowerDiagonal, mainDiagonal, upperDiagonal } = createDiagonals(n, alpha);

            // Create known solution using sine wave with random component
            const knownSolution = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                knownSolution[i] =
                    1e6 * (Math.random() - 0.5) + Math.sin((i * 2 * Math.PI) / (n - 1));
            }

            const rightHandSide = calculateRightHandSide(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                knownSolution,
                n
            );
            const modUpperDiag = new Float64Array(n);
            const modRightSide = new Float64Array(n);
            const solutionArray = new Float64Array(n);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                n,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < n; i++) {
                expect(Math.abs(solutionArray[i] - knownSolution[i])).toBeLessThan(tolerance);
            }
        });
        test("solves a huge diffusion system with big alpha", () => {
            // Arrange
            const n = 100000;
            const alpha = 1e10;
            const { lowerDiagonal, mainDiagonal, upperDiagonal } = createDiagonals(n, alpha);

            // Create known solution using sine wave with random component
            const knownSolution = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                knownSolution[i] =
                    1e-9 * (Math.random() - 0.5 + Math.sin((i * 2 * Math.PI) / (n - 1)));
            }

            const rightHandSide = calculateRightHandSide(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                knownSolution,
                n
            );
            const modUpperDiag = new Float64Array(n);
            const modRightSide = new Float64Array(n);
            const solutionArray = new Float64Array(n);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                n,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < n; i++) {
                expect(Math.abs(solutionArray[i] - knownSolution[i])).toBeLessThan(tolerance);
            }
        });
        test("solves a huge diffusion system with huge alpha", () => {
            // Arrange
            const n = 100000;
            const alpha = 1e15;
            const { lowerDiagonal, mainDiagonal, upperDiagonal } = createDiagonals(n, alpha);

            // Create known solution using sine wave with random component
            const knownSolution = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                knownSolution[i] =
                    1e-9 * (Math.random() - 0.5 + Math.sin((i * 2 * Math.PI) / (n - 1)));
            }

            const rightHandSide = calculateRightHandSide(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                knownSolution,
                n
            );
            const modUpperDiag = new Float64Array(n);
            const modRightSide = new Float64Array(n);
            const solutionArray = new Float64Array(n);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                n,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < n; i++) {
                expect(Math.abs(solutionArray[i] - knownSolution[i])).toBeLessThan(tolerance);
            }
        });
        test("solves a huge diffusion system with tiny alpha", () => {
            // Arrange
            const n = 100000;
            const alpha = 1e-15;
            const { lowerDiagonal, mainDiagonal, upperDiagonal } = createDiagonals(n, alpha);

            // Create known solution using sine wave with random component
            const knownSolution = new Float64Array(n);
            for (let i = 0; i < n; i++) {
                knownSolution[i] =
                    1e6 * (Math.random() - 0.5 + Math.sin((i * 2 * Math.PI) / (n - 1)));
            }

            const rightHandSide = calculateRightHandSide(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                knownSolution,
                n
            );
            const modUpperDiag = new Float64Array(n);
            const modRightSide = new Float64Array(n);
            const solutionArray = new Float64Array(n);

            // Act
            thomasAlgorithm(
                lowerDiagonal,
                mainDiagonal,
                upperDiagonal,
                rightHandSide,
                n,
                modUpperDiag,
                modRightSide,
                solutionArray
            );

            // Assert
            for (let i = 0; i < n; i++) {
                expect(Math.abs(solutionArray[i] - knownSolution[i])).toBeLessThan(tolerance);
            }
        });
    });
});
