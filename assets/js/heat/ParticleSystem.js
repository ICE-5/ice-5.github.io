import * as THREE from 'three';
import shaderPointFragment from './shaders/pointFragment.glsl';
import shaderPointVertex from './shaders/pointVertex.glsl';
import { simulationParam } from './config';


export class ParticleSystem {
    constructor() {
        this.textureSize = simulationParam.GRID_SIZE;
        this.particleCount = this.textureSize * this.textureSize;
        this.points = this._createPoints();
    }

    _createPoints() {
        const geometry = new THREE.InstancedBufferGeometry();

        // Dummy position attribute (dummy position of prefab)
        const vertices = new Float32Array([0, 0, 0]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        // Reference attribute (per-instance) for texture lookup coordinates
        const references = new Float32Array(this.particleCount * 2);
        for (let i = 0; i < this.particleCount; i++) {
            references[i * 2] = (i % this.textureSize) / this.textureSize;
            references[i * 2 + 1] = Math.floor(i / this.textureSize) / this.textureSize;
        }
        geometry.setAttribute('reference', new THREE.InstancedBufferAttribute(references, 2, false));
        geometry.instanceCount = this.particleCount;

        const material = new THREE.ShaderMaterial({
            vertexShader: shaderPointVertex,
            fragmentShader: shaderPointFragment,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                texturePosition: { value: null },
            }
        });
        this.material = material;

        return new THREE.Points(geometry, material);
    }

    updateTexture(positionTexture) {
        this.material.uniforms.texturePosition.value = positionTexture;
    }
}