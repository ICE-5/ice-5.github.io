/**
 * Particles Lab: Fluidity vs. Stability: Shaping Dynamic Macrostructure Within Diffusive Flows
 * 
 * Part of this code is based on the original work by Tim Severien, available at:
 * https://codepen.io/timseverien/pen/EmJNOR
 * 
 * Significant features and refactoring have been made by me, including:
 * - Features such as gravity, damping, forces, gradients, pertubation, etc.
 * - Project structure and modularity
 * - GLSL shader optimization
 * - Code refactoring
 * - Performance improvements
 * - Bug fixes
 * 
 * Author: Yuning Wu
 * Date: 2025.1
 */

import { SceneManager } from './SceneManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { GPUSimulation } from './GPUSimulation.js';
import { SourceManager } from './SourceManager.js';

export class StableCurlNoiseSimulation {
    constructor() {
        // Scene setup (renderer, camera, controls, etc.)
        this.sceneManager = new SceneManager();

        // GPU simulation
        this.simulation = new GPUSimulation(this.sceneManager.renderer, this.sceneManager.camera);

        // Particle system
        this.particleSystem = new ParticleSystem();
        this.sceneManager.scene.add(this.particleSystem.points);

        // Sources (spheres, edges, and DOM links)
        this.sourceManager = new SourceManager(this.sceneManager.camera, this.sceneManager.scene);

        // Window resizing
        window.addEventListener('resize', () => this.onResize());
        this.onResize();

        this.previousFrame = Date.now() / 1000;
        this.animate();
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.sceneManager.onResize(width, height);
        this.sourceManager.updateLabelPositions();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = Date.now() / 1000;;
        const delta = now - this.previousFrame;
        this.previousFrame = now;

        // Update the simulation and refresh the particle system texture
        this.simulation.compute(delta);
        this.particleSystem.updateTexture(this.simulation.getPositionTexture(), this.simulation.getVelocityTexture());

        // Update DOM link positions (for the overlaid source links)
        this.sourceManager.updateLabelPositions();

        // Update orbit controls and render the scene
        this.sceneManager.controls.update();
        this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    }
}

// Begin the simulation
new StableCurlNoiseSimulation();