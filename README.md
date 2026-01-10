# Diffusion Solvers

High-performance JavaScript library for solving 2D diffusion equations using numerical methods (ADI and FTCS).

## Installation

```bash
npm install diffusion-solvers
```

## Quick Start

```javascript
import { ADI, setADIProperties } from 'diffusion-solvers';

// Setup grid
const WIDTH = 100, HEIGHT = 60;
setADIProperties(WIDTH, HEIGHT, 30, 1.0, 0.1);

// Initial condition
const initial = new Float64Array(WIDTH * HEIGHT);
const sources = new Float64Array(WIDTH * HEIGHT).fill(0);

// Solve diffusion equation
const result = ADI(initial, sources, 0.1, 5.0);
```

## API

### ADI Method (Recommended)

```javascript
setADIProperties(width, height, diffusionCoefficient, deltaX, deltaT);
const result = ADI(concentrationData, sources, deltaT, timeLapse);
```

**Unconditionally stable** - Use larger time steps for better performance.

### FTCS Method

```javascript
import { FTCS } from 'diffusion-solvers';
const result = FTCS(concentrationData, sources, deltaX, deltaT, diffusionRate, timeLapse);
```

**Stability limited** - Requires small time steps (automatically adjusted).

## Equation

Solves: $\frac{\partial C}{\partial t} = D \nabla^2 C + S$

With Neumann boundary conditions (no-flux at boundaries).

## Grid Indexing

Concentrations stored as flattened 1D array:
```javascript
// Access position (i, j): array[j * WIDTH + i]
const value = result[y * WIDTH + x];
```

## Scripts

```bash
npm test              # Run tests
npm run lint          # Check code
npm run format        # Format code
npm run docs          # Generate documentation
```

## License

MIT

## References

- Peaceman & Rachford (1955). *J. Soc. Ind. Appl. Math.*, 3(1), 28-41.
- Thomas (1949). *Watson Sci. Comput. Lab. Rept., Columbia University*.