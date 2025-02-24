import * as THREE from 'three';

export function toScreenPosition(position, camera) {
    const vector = position.clone().project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (1 - (vector.y * 0.5 + 0.5)) * window.innerHeight;
    return { x, y };
}

export function customGlobalTransform(input) {
    if (input instanceof THREE.Vector3) {
        input.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2); // Rotate 90° around X
        input.y -= 0.5;
    } else if (input instanceof THREE.Object3D) {
        input.rotation.x = -Math.PI / 2;
        input.position.y -= 0.5;
    } else {
        console.error("Input must be either THREE.Vector3 or THREE.Object3D");
    }
}