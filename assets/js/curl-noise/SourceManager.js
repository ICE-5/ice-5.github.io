import * as THREE from 'three';
import { toScreenPosition } from './utils.js';
import { sources, simulationParam } from './config.js';

export class SourceManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.sources = sources;
        this._createLabelContainer();
        this.addSources();
        this.addEdges();
    }

    _createLabelContainer() {
        // Create a container for all the text labels.
        this.labelContainer = document.createElement('div');
        this.labelContainer.style.zIndex = '10';
        this.labelContainer.style.position = 'fixed';
        this.labelContainer.style.top = '0';
        this.labelContainer.style.left = '0';
        this.labelContainer.style.pointerEvents = 'none';
        this.labelContainer.style.width = '100vw';
        this.labelContainer.style.height = '100vh';
        this.labelContainer.style.overflow = 'hidden';

        document.body.appendChild(this.labelContainer);
        this._createLabels();
        this._injectStyles();
    }

    _createLabels() {
        // Create a DOM element (e.g. a <div>) for each source.
        this.sources.forEach((source) => {
            const label = document.createElement('div');
            label.innerHTML = `<strong>Gravity Source ${source.id}</strong><br>Coord: (${source.position.x.toFixed(2)}, ${source.position.y.toFixed(2)}, ${source.position.z.toFixed(2)})<br>Weight: ${source.weight}`;
            label.className = 'source-label';
            label.style.position = 'absolute';
            this.labelContainer.appendChild(label);
            source.label = label;
        });
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .source-label {
                position: absolute;
                color: #ffffff85;
                font-family: monospace;
                font-size: 9px;
                line-height: 1.15;
                z-index: 10;
                pointer-events: none;
                white-space: nowrap;
                width: 100px;
                max-width: 200px;
                text-align: left;
            }
            `;
        document.head.appendChild(style);
    }

    addSources() {
        // Create a sphere at each source location.
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        this.sources.forEach((source) => {
            const radius = source.weight * simulationParam.SOURCE_RADIUS;
            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(source.position);
            this.scene.add(sphere);
        });
    }

    addEdges() {
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
        const edgeGeometry = new THREE.BufferGeometry();
        const edgePositions = [];

        // Define edges (pairs of source indices)
        const edges = [
            [0, 1], [0, 2], [0, 3], [0, 4],
            [1, 2], [1, 3], [1, 4],
            [2, 3], [2, 4],
            [3, 4]
        ];
        edges.forEach(([start, end]) => {
            edgePositions.push(
                this.sources[start].position.x, this.sources[start].position.y, this.sources[start].position.z,
                this.sources[end].position.x, this.sources[end].position.y, this.sources[end].position.z
            );
        });
        edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
        const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        this.scene.add(edgeLines);
    }

    updateLabelPositions() {
        // For each source, compute the screen position (using your utility function)
        // and update the corresponding label's position in the DOM.
        this.sources.forEach((source) => {
            const extendedPosition = source.position.clone().multiplyScalar(simulationParam.SOURCE_EDGE_EXT);
            const screenPosition = toScreenPosition(extendedPosition, this.camera);
            source.label.style.transform = `translate(${screenPosition.x}px, ${screenPosition.y}px)`;
        });
    }
}