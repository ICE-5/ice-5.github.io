import * as THREE from 'three';
import shaderPointFragment from './shaders/pointFragment.glsl';
import shaderPointVertex from './shaders/pointVertex.glsl';
import { simulationParam } from './config';

export class ParticleSystem {
    constructor(textureWidth, textureHeight) {
        this.textureWidth = textureWidth;
        this.textureHeight = textureHeight;
        this.points = this._createPoints();
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

        const material = new THREE.ShaderMaterial({
            uniforms: {
                texturePosition: { value: null },
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