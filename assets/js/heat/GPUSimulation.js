import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import shaderSimulationPosition from './shaders/simulationPosition.glsl';
import { simulationParam } from './config';
import { SourceManager } from './SourceManager';

export class GPUSimulation {
    constructor(renderer, camera, scene) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;

        this.textureSize = simulationParam.GRID_SIZE;
        this.particleCount = this.textureSize * this.textureSize;

        this.gridLength = simulationParam.GRID_LENGTH;
        this.gridSpacing = this.gridLength / this.textureSize;

        this.frameCounter = 0;

        
        this.sourceManager = new SourceManager(this.camera, this.scene);
        this.sourceMax = null;
        this.sourcePosition = new THREE.Vector2(-1.0, -1.0);
        this.sourceWeight = 0.;

        this.gpuCompute = new GPUComputationRenderer(this.textureSize, this.textureSize, this.renderer);

        this._initTextures();
        this._addVariables();

        const error = this.gpuCompute.init();
        if (error) {
            console.error('GPUComputationRenderer error:', error);
        }

        window.addEventListener("click", (event) => this._handleMouseClick(event));
    }

    _initTextures() {
        const textureArraySize = this.particleCount * 4;
        const data = new Float32Array(textureArraySize);

        for (let i = 0; i < this.particleCount; i++) {
            const x = (i % this.textureSize) / this.textureSize;
            const y = Math.floor(i / this.textureSize) / this.textureSize;
            const worldX = (x - 0.5) * this.gridLength;
            const worldY = (y - 0.5) * this.gridLength;
            const worldZ = Math.random();

            const index = i * 4;
            data[index] = worldX;
            data[index + 1] = worldY;
            data[index + 2] = worldZ;
            data[index + 3] = 1;
        }

        this.dataPosition = new THREE.DataTexture(
            data,
            this.textureSize,
            this.textureSize,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        this.dataPosition.needsUpdate = true;
    }

    _addVariables() {
        this.variablePosition = this.gpuCompute.addVariable(
            'texturePosition',
            shaderSimulationPosition,
            this.dataPosition
        );

        // Default vertex shader for GPUComputationRenderer
        this.variablePosition.material.vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        this.variablePosition.material.uniforms = {
            delta: { value: 0 },
            diffusionRate: { value: simulationParam.DIFFUSION_RATE },
            coolingRate: { value: simulationParam.COOLING_RATE },
            gridSpacing: { value: this.gridSpacing },
            textureSize: { value: this.textureSize },
            sourcePosition: { value: this.sourcePosition },
            sourceWeight: { value: this.sourceWeight }
        };
    }

    compute(delta) {
        this.variablePosition.material.uniforms.delta.value = Math.min(delta, 0.5);

        this.frameCounter++;
        this.sourcePosition.set(-1.0, -1.0);
        this.sourceWeight = 0.;

        if (this.frameCounter % 2 === 0) {
            this._addRandomSource(0.25);
        } else {
            this._addRandomSource(-0.25)
        }

        if (this.frameCounter % (simulationParam.INTERVAL * 10) === 0) {
            this.getMaxTemperature();
            this.frameCounter = 0;
        }

        if (this.sourceMax) {
            this.sourceManager.updateLabelPosition(this.sourceMax);
        }

        this.variablePosition.material.uniforms.sourcePosition.value.copy(this.sourcePosition);
        this.variablePosition.material.uniforms.sourceWeight.value = this.sourceWeight;

        this.gpuCompute.compute();
    }

    getPositionTexture() {
        return this.gpuCompute.getCurrentRenderTarget(this.variablePosition).texture;
    }

    getMaxTemperature() {
        const rt = this.gpuCompute.getCurrentRenderTarget(this.variablePosition);
        const width = rt.width;
        const height = rt.height;
        const size = width * height * 4;
        const buffer = new Float32Array(size);
        this.renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);

        let maxTemp = -Infinity;
        let maxIndex = -1;

        for (let i = 0; i < size; i += 4) {
            const temp = buffer[i + 2];
            if (temp > maxTemp) {
                maxTemp = temp;
                maxIndex = i;
            }
        }

        if (maxIndex !== -1) {
            let x = (maxIndex / 4) % this.textureSize / this.textureSize;
            let y = Math.floor((maxIndex / 4) / this.textureSize) / this.textureSize;
            this.sourcePosition.set(x, y);
            this.sourceWeight = Math.max(maxTemp * simulationParam.SOURCE_AMPLIFY, 1.0)
            console.log(`Max temperature: ${maxTemp} at (${x}, ${y})`);

            // Calculate the world position of the source
            const worldX = (x - 0.5) * this.gridLength;
            const worldY = (y - 0.5) * this.gridLength;
            this.sourceMax = new THREE.Vector3(worldX, worldY, maxTemp);
            this.sourceManager.addSource(this.sourceMax);
        } else {
            console.error("Max temperature not found");
        }
    }

    getTemperature(x, y) {
        const rt = this.gpuCompute.getCurrentRenderTarget(this.variablePosition);
        const width = rt.width;
        const height = rt.height;
        const buffer = new Float32Array(width * height * 4);
        this.renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);

        const ix = Math.floor(x * this.textureSize);
        const iy = Math.floor(y * this.textureSize);
        const index = (iy * this.textureSize + ix) * 4;

        const temperature = buffer[index + 2];
        return temperature;
    }

    _addRandomSource(offset = 0.0) {
        const x = Math.random();
        const y = Math.random();
        this.sourcePosition.set(x, y);
        const weight = this.getTemperature(x, y);
        this.sourceWeight = weight + offset;
    }


    _handleMouseClick(event) {
        // TODO: Placeholder for adding heat sources
        console.log("Click detected, add heat source here");
    }
}