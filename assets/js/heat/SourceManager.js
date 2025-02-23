export class SourceManager {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.particleCount = gridSize * gridSize;
    }

    getInitialTemperatures() {
        const temperatures = new Float32Array(this.particleCount).fill(0.0);

        // Define heat sources
        temperatures[this.gridSize * 32 + 32] = 1.0; // Center
        temperatures[this.gridSize * 16 + 16] = 1.0; // Top-left-ish
        temperatures[this.gridSize * 48 + 48] = 1.0; // Bottom-right-ish

        return temperatures;
    }
}