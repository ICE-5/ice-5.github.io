import * as THREE from 'three';
import { toScreenPosition, customGlobalTransform } from './utils.js';
import { simulationParam } from './config.js';

export class SourceManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.sources = [];
        this._createLabelContainer();
    }

    _createLabelContainer() {
        // Create a container for all the text labels.
        this.labelContainer = document.createElement('div');
        this.labelContainer.style.position = 'absolute';
        this.labelContainer.style.top = '0';
        this.labelContainer.style.left = '0';
        this.labelContainer.style.pointerEvents = 'none';

        document.body.appendChild(this.labelContainer);
        // this._createLabels();
        this._injectStyles();
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .source-label {
                position: absolute;
                color: #ffffff;
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

    _createLabel(source) {
        // Create a DOM element (e.g. a <div>) for each source.
        const label = document.createElement('div');
        label.innerHTML = `<strong>Global Max Pooling</strong><br>Coord: (${source.x.toFixed(2)}, ${source.y.toFixed(2)})<br>Temperature: ${source.z.toFixed(2)}`;
        label.className = 'source-label';
        label.style.position = 'absolute';
        this.labelContainer.appendChild(label);
        source.label = label;
    }

    clearSources() {
        this.sources.forEach(source => {
            if (source.label && source.label.parentNode) {
                source.label.parentNode.removeChild(source.label);
            }
            // if (source.mesh) {
            //     this.scene.remove(source.mesh);
            // }
            if (source.edgeLine) {
                this.scene.remove(source.edgeLine);
            }
        });

        this.sources = [];
    }

    addSource(source) {
        this.clearSources();

        // Create a sphere mesh for source
        // const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        // const radius = source.z * simulationParam.SOURCE_RADIUS;
        // const geometry = new THREE.SphereGeometry(radius, 16, 16);
        // const sphere = new THREE.Mesh(geometry, material);
        // sphere.position.copy(source);
        // customGlobalTransform(sphere);
        // this.scene.add(sphere);
        // source.mesh = sphere;

        // Create an edge line for source
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        const edgeStart = source.clone();
        const edgeEnd = new THREE.Vector3(source.x, source.y, 0);
        customGlobalTransform(edgeStart);
        customGlobalTransform(edgeEnd);
        const edgeGeometry = new THREE.BufferGeometry().setFromPoints([edgeStart, edgeEnd]);
        const edgeLine = new THREE.Line(edgeGeometry, edgeMaterial);
        this.scene.add(edgeLine);
        source.edgeLine = edgeLine;

        // Create a label for source
        this._createLabel(source);

        // Store the source
        this.sources.push(source);
    }

    updateLabelPosition(source) {
        if (!source.label) return;
        const position = new THREE.Vector3(source.x, source.y, source.z * simulationParam.SOURCE_EDGE_EXT);
        customGlobalTransform(position);
        const screenPosition = toScreenPosition(position, this.camera);
        source.label.style.transform = `translate(${screenPosition.x}px, ${screenPosition.y}px)`;
    }
}