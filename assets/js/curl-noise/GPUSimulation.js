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
        this.TEXTURE_SIZE = simulationParam.TEXTURE_SIZE;
        this.TEXTURE_HEIGHT = this.TEXTURE_SIZE;
        this.TEXTURE_WIDTH = this.TEXTURE_SIZE * 2;

        this.gpuCompute = new GPUComputationRenderer(this.TEXTURE_WIDTH, this.TEXTURE_HEIGHT, this.renderer);
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
        const textureArraySize = this.TEXTURE_WIDTH * this.TEXTURE_HEIGHT * 4;
        for (let i = 0; i < textureArraySize; i += 4) {
            const radius = (1 - Math.pow(Math.random(), 3)) * 1;
            const azimuth = Math.random() * Math.PI;
            const inclination = Math.random() * Math.PI * 2;

            this.dataPosition.image.data[i] = radius * Math.sin(azimuth) * Math.cos(inclination);
            this.dataPosition.image.data[i + 1] = radius * Math.cos(azimuth);
            this.dataPosition.image.data[i + 2] = radius * Math.sin(azimuth) * Math.sin(inclination);

            this.dataVelocity.image.data[i] = 0;
            this.dataVelocity.image.data[i + 1] = 0;
            this.dataVelocity.image.data[i + 2] = 0;
            this.dataVelocity.image.data[i + 3] = 1;
        }
    }

    _addVariables() {
        this.variableVelocity = this.gpuCompute.addVariable(
            'textureVelocity',
            shaderSimulationVelocity,
            this.dataVelocity
        );
        this.variablePosition = this.gpuCompute.addVariable(
            'texturePosition',
            shaderSimulationPosition,
            this.dataPosition
        );

        // Set uniforms used by the simulation shaders
        this.variablePosition.material.uniforms.delta = { value: 0 };

        this.variableVelocity.material.uniforms.PARTICLE_MASS = { value: simulationParam.PARTICLE_MASS };
        this.variableVelocity.material.uniforms.VELOCITY_TERMINAL = { value: simulationParam.VELOCITY_TERMINAL };
        this.variableVelocity.material.uniforms.CURL_RADIUS_MIN = { value: simulationParam.CURL_RADIUS_MIN };
        this.variableVelocity.material.uniforms.CURL_RADIUS_DELTA = { value: simulationParam.CURL_RADIUS_DELTA };
        this.variableVelocity.material.uniforms.CURL_NOISE_SPEEDUP = { value: simulationParam.CURL_NOISE_SPEEDUP };
        this.variableVelocity.material.uniforms.time = { value: 0.0 };

        const numSources = sources.length;
        this.variableVelocity.material.uniforms.NUM_SOURCES = { value: numSources };

        // Create arrays to hold source positions and weights for shader uniforms
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
        this.variableVelocity.material.uniforms.sourcePositions = { value: sourcePositionsArray };
        this.variableVelocity.material.uniforms.sourceWeights = { value: sourceWeightsArray };

        // Set impulse effect uniforms
        this.variableVelocity.material.uniforms.impulsePosition = { value: new THREE.Vector3(0, 0, 0) };
        this.variableVelocity.material.uniforms.impulseStrength = { value: 0.0 };

        // Set variable dependencies (so that each shader has access to both textures)
        this.gpuCompute.setVariableDependencies(this.variableVelocity, [this.variableVelocity, this.variablePosition]);
        this.gpuCompute.setVariableDependencies(this.variablePosition, [this.variableVelocity, this.variablePosition]);

        // Wrap textures to ensure seamless simulation
        this.variablePosition.wrapS = THREE.RepeatWrapping;
        this.variablePosition.wrapT = THREE.RepeatWrapping;
        this.variableVelocity.wrapS = THREE.RepeatWrapping;
        this.variableVelocity.wrapT = THREE.RepeatWrapping;
    }

    _handleMouseClick(event) {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        const impulseStrength = 10.0; // Adjust based on effect strength
    
        // Convert screen-space click to world-space
        const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
        vector.unproject(this.camera);  // Assuming `this.camera` exists
    
        // Update uniforms with impulse force
        this.variableVelocity.material.uniforms.impulsePosition.value.copy(vector);
        this.variableVelocity.material.uniforms.impulseStrength.value = impulseStrength;
    
        // Reset impulse effect after a short delay to avoid continuous perturbation
        setTimeout(() => {
            this.variableVelocity.material.uniforms.impulseStrength.value = 0.0;
        }, 100);
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

    getMaxFromTarget(target="velocity") {
        
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