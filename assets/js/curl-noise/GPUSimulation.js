import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import shaderSimulationPosition from './shaders/simulationPosition.glsl';
import shaderSimulationVelocity from './shaders/simulationVelocity.glsl';
import { sources, simulationParam } from './config';

export class GPUSimulation {
    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;

        // Texture dimensions determine the number of particles.
        this.textureSize = simulationParam.TEXTURE_SIZE;
        this.particleCount = this.textureSize * this.textureSize;

        this.gpuCompute = new GPUComputationRenderer(this.textureSize, this.textureSize, this.renderer);
        this.dataPosition = this.gpuCompute.createTexture();
        this.dataVelocity = this.gpuCompute.createTexture();

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
        for (let i = 0; i < textureArraySize; i += 4) {

            // Randomize the initial position of each particle
            // const radius = (1 - Math.pow(Math.random(), 3)) * 1;
            // const azimuth = Math.random() * Math.PI;
            // const inclination = Math.random() * Math.PI * 2;

            // this.dataPosition.image.data[i] = radius * Math.sin(azimuth) * Math.cos(inclination);
            // this.dataPosition.image.data[i + 1] = radius * Math.cos(azimuth);
            // this.dataPosition.image.data[i + 2] = radius * Math.sin(azimuth) * Math.sin(inclination);

            // Randomize from afar
            const scale = 5.0;
            this.dataPosition.image.data[i] = (Math.random() * 2 - 1) * scale;
            this.dataPosition.image.data[i + 1] = (Math.random() * 2 - 1) * scale;
            this.dataPosition.image.data[i + 2] = (Math.random() * 2 - 1) * scale;
            this.dataPosition.image.data[i + 3] = 1;

            this.dataVelocity.image.data[i] = 0;
            this.dataVelocity.image.data[i + 1] = 0;
            this.dataVelocity.image.data[i + 2] = 0;
            this.dataVelocity.image.data[i + 3] = 1;
        }
    }

    _addVariables() {
        // Add GPU compute variables
        this.variableVelocity = this.gpuCompute.addVariable('textureVelocity', shaderSimulationVelocity, this.dataVelocity);
        this.variablePosition = this.gpuCompute.addVariable('texturePosition', shaderSimulationPosition, this.dataPosition);

        // Initialize position uniforms
        this.variablePosition.material.uniforms.delta = { value: 0 };

        // Prepare source arrays for shader uniforms
        const numSources = sources.length;
        const MAX_SOURCES = simulationParam.MAX_SOURCES;
        const sourcePositionsArray = new Float32Array(MAX_SOURCES * 3).fill(0);
        const sourceWeightsArray = new Float32Array(MAX_SOURCES).fill(0);

        for (let i = 0; i < numSources; i++) {
            const pos = sources[i].position;
            sourcePositionsArray[i * 3 + 0] = pos.x;
            sourcePositionsArray[i * 3 + 1] = pos.y;
            sourcePositionsArray[i * 3 + 2] = pos.z;
            sourceWeightsArray[i] = sources[i].weight;
        }

        // Populate source arrays
        sources.forEach((source, index) => {
            const { position: pos, weight } = source;
            sourcePositionsArray.set([pos.x, pos.y, pos.z], index * 3);
            sourceWeightsArray[index] = weight;
        });

        // Configure velocity uniforms
        const velocityUniforms = this.variableVelocity.material.uniforms;
        Object.assign(velocityUniforms, {
            sourcePositions: { value: sourcePositionsArray },
            sourceWeights: { value: sourceWeightsArray },
            impulsePosition: { value: new THREE.Vector3(0, 0, 0) },
            impulseStrength: { value: 0.0 },
            ...this._getSimulationParams(),
            numSources: { value: numSources },
            time: { value: 0.0 },
            impulsePosition: { value: new THREE.Vector3(0, 0, 0) },
            impulseStrength: { value: 0.0 },
        });

        // Set variable dependencies (so that each shader has access to both textures)
        this.gpuCompute.setVariableDependencies(this.variableVelocity, [this.variableVelocity, this.variablePosition]);
        this.gpuCompute.setVariableDependencies(this.variablePosition, [this.variableVelocity, this.variablePosition]);

        // Wrap textures to ensure seamless simulation
        this.variablePosition.wrapS = THREE.RepeatWrapping;
        this.variablePosition.wrapT = THREE.RepeatWrapping;
        this.variableVelocity.wrapS = THREE.RepeatWrapping;
        this.variableVelocity.wrapT = THREE.RepeatWrapping;

    }

    _getSimulationParams() {
        const {
            PARTICLE_MASS,
            VELOCITY_TERMINAL,
            CURL_RADIUS_MIN,
            CURL_RADIUS_DELTA,
            CURL_NOISE_SPEEDUP,
        } = simulationParam;

        return {
            PARTICLE_MASS: { value: PARTICLE_MASS },
            VELOCITY_TERMINAL: { value: VELOCITY_TERMINAL },
            CURL_RADIUS_MIN: { value: CURL_RADIUS_MIN },
            CURL_RADIUS_DELTA: { value: CURL_RADIUS_DELTA },
            CURL_NOISE_SPEEDUP: { value: CURL_NOISE_SPEEDUP },
        };
    }

    compute(delta) {
        // Limit delta so that the simulation doesn’t “explode”
        this.variablePosition.material.uniforms.delta.value = Math.min(delta, 0.5);
        this.variableVelocity.material.uniforms.time.value += delta;
        this.gpuCompute.compute();
    }

    getPositionTexture() {
        return this.gpuCompute.getCurrentRenderTarget(this.variablePosition).texture;
    }

    getVelocityTexture() {
        return this.gpuCompute.getCurrentRenderTarget(this.variableVelocity).texture;
    }

    getMaxFromTarget(target = "velocity") {

        let rt;
        if (target === "velocity") {
            rt = this.gpuCompute.getCurrentRenderTarget(this.variableVelocity);
        }
        else if (target === "position") {
            rt = this.gpuCompute.getCurrentRenderTarget(this.variablePosition);
        }
        else {
            console.error("Invalid target");
            return;
        }
        const width = rt.width;
        const height = rt.height;
        const size = width * height * 4;
        const buffer = new Float32Array(size);
        this.renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);

        let max = 0;
        for (let i = 0; i < size; i += 4) {
            const x = buffer[i];
            const y = buffer[i + 1];
            const z = buffer[i + 2];
            const magnitude = Math.sqrt(x * x + y * y + z * z);
            max = Math.max(max, magnitude);
        }
        return max;
    }
}