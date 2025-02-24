import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { simulationParam } from './config';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();

        // Create camera
        const aspect = window.innerWidth / window.innerHeight;
        const size = 10; // Orthographic size
        this.camera = new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 0.1, 100);
        this.camera.position.set(10, 10, 10);
        // this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0.5, 0);

        // this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.updateCamera(window.innerWidth, window.innerHeight);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // TODO: Remove this
        document.body.appendChild(this.renderer.domElement);

        // Create orbit controls for the camera
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.5;
        this.controls.enableZoom = true;
    }

    onResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    updateCamera(width, height) {
        const aspect = width / height;
        this.camera.left = -aspect;
        this.camera.right = aspect;
        this.camera.top = 1;
        this.camera.bottom = -1;
        this.camera.updateProjectionMatrix();
    }

    addGridHelper() {
        // Create a grid helper
        const gridSize = simulationParam.GRID_LENGTH;  // Adjust to match your simulation grid
        const gridDivisions = simulationParam.GRID_SIZE;  // Number of grid lines
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x1a1a1a, 0x1a1a1a);
        gridHelper.position.y -= 0.5;
        this.scene.add(gridHelper);
    }
}