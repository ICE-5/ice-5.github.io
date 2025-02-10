/**
 * Particle Simulation: Stable Curl Noise Flow
 * 
 * This code is based on the original work by Tim Severien, available at:
 * https://codepen.io/timseverien/pen/EmJNOR
 * 
 * Significant modifications and optimizations may have been made by me, including:
 * - Additional features such as gravity, damping, forces, gradients, pertubation, etc.
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
        // Set up the scene (renderer, camera, controls, etc.)
        this.sceneManager = new SceneManager();

        // Set up the simulation (GPUComputationRenderer and simulation textures)
        this.simulation = new GPUSimulation(this.sceneManager.renderer);

        // Create the particle system; note that the simulation textures determine the total particle count.
        this.particleSystem = new ParticleSystem(
            this.simulation.TEXTURE_WIDTH,
            this.simulation.TEXTURE_HEIGHT
        );
        this.sceneManager.scene.add(this.particleSystem.points);

        // Create the sources (spheres, edges, and DOM links)
        this.sourceManager = new SourceManager(this.sceneManager.camera, this.sceneManager.scene);
        this.sourceManager.addSources();
        this.sourceManager.addEdges();

        // Append the renderer’s DOM element
        document.body.appendChild(this.sceneManager.renderer.domElement);

        // Set up window resizing
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

        const now = Date.now() / 1000;
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

        // DEBUG: Log the velocity
        // console.log(this.simulation.getMaxFromTarget("velocity"));
    }
}

// Begin the simulation
new StableCurlNoiseSimulation();