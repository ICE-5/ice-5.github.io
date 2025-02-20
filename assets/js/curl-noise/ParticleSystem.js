import * as THREE from 'three';
import shaderPointFragment from './shaders/pointFragment.glsl';
import shaderPointVertex from './shaders/pointVertex.glsl';
import { simulationParam } from './config';
import { texture } from 'three/tsl';
import { init } from 'tocbot';

export class ParticleSystem {
    constructor(textureWidth, textureHeight) {
        this.textureWidth = textureWidth;
        this.textureHeight = textureHeight;
        this.initRadius = simulationParam.INIT_RADIUS;
        this.initFromZero = simulationParam.INIT_FROM_ZERO;
        this.points = this._createPoints();
    }

    _createEmptyTexture() {
        const size = this.textureWidth * this.textureHeight;
        const data = new Float32Array(size * 4).fill(0);

        const texture = new THREE.DataTexture(
            data, this.textureWidth, this.textureHeight, THREE.RGBAFormat, THREE.FloatType
        );
        texture.needsUpdate = false;
        return texture;
    }

    _createRandomTexture() {
        const size = this.textureWidth * this.textureHeight;
        const data = new Float32Array(size * 4).fill(0);

        for (let i = 0; i < size; i++) {
            data[i * 4] = (Math.random() - 0.5) * this.initRadius * 2;
            data[i * 4 + 1] = (Math.random() - 0.5) * this.initRadius * 2;
            data[i * 4 + 2] = (Math.random() - 0.5) * this.initRadius * 2;
        }

        const texture = new THREE.DataTexture(
            data, this.textureWidth, this.textureHeight, THREE.RGBAFormat, THREE.FloatType
        );
        texture.needsUpdate = false;
        return texture;
    }

    _createPoints() {
        const pointsCount = this.textureWidth * this.textureHeight;
        const vertices = new Float32Array(pointsCount * 3).fill(0);
        const references = new Float32Array(pointsCount * 2);

        // Compute UV coordinates for each particle (to sample the simulation texture)
        for (let i = 0; i < pointsCount; i++) {
            references[i * 2] = (i % this.textureWidth) / this.textureWidth;
            references[i * 2 + 1] = Math.floor(i / this.textureWidth) / this.textureHeight;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));

        const initialPositionTexture = null;
        if (!this.initFromZero) {
            const initialPositionTexture = this._createRandomTexture();
        } 

        const material = new THREE.ShaderMaterial({
            uniforms: {
                texturePosition: { value: initialPositionTexture },
                textureVelocity: { value: null },
                maxForce: { value: simulationParam.MAX_FORCE },
            },
            fragmentShader: shaderPointFragment,
            vertexShader: shaderPointVertex,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        this.material = material;
        return new THREE.Points(geometry, material);
    }

    updateTexture(positionTexture, velocityTexture) {
        this.material.uniforms.texturePosition.value = positionTexture;
        this.material.uniforms.textureVelocity.value = velocityTexture;
    }
}