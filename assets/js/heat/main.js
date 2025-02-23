import { ParticleSystem } from './ParticleSystem.js';
import { GPUSimulation } from './GPUSimulation.js';
// import { SourceManager } from './SourceManager.js';
import { SceneManager } from './SceneManager.js';
import { simulationParam } from './config.js';


export class Heat {
    constructor() {
        // Scene setup (renderer, camera, controls, etc.)
        this.sceneManager = new SceneManager();

        // GPGPU setup
        this.simulation = new GPUSimulation(this.sceneManager.renderer, this.sceneManager.camera);

        // Particle system
        this.particleSystem = new ParticleSystem();
        this.sceneManager.scene.add(this.particleSystem.points);
        // Z-axis positive up
        this.particleSystem.points.rotation.x = -Math.PI / 2;
        // Move all points up by 1.0
        this.particleSystem.points.position.y -= 0.5;

        // TODO: Source manager


        // Window resizing
        window.addEventListener('resize', () => this.onResize());
        this.onResize();

        // Animation loop
        this.previousFrame = Date.now() / 1000;
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // delta ~ 0.016
        // const now = Date.now() / 1000;
        // const delta = now - this.previousFrame;
        // this.previousFrame = now;

        const delta = simulationParam.DELTA;
        this.simulation.compute(delta);
        this.particleSystem.updateTexture(this.simulation.getPositionTexture());

        // Update orbit controls and render the scene
        this.sceneManager.controls.update();
        this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.sceneManager.onResize(w, h);
        this.sceneManager.updateCamera(w, h);
    }
}

new Heat();
