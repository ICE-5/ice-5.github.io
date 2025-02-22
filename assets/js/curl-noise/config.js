import * as THREE from 'three';

export const sources = [
    {
        position: new THREE.Vector3(0.0, 0.0, 0.0),
        weight: 1.8,
        id: "0",
    },
    {
        position: new THREE.Vector3(1.447, 0.916, 0.259),
        weight: 1.2,
        id: "1",
    },
    {
        position: new THREE.Vector3(0.046, -1.437, 0.966),
        weight: 0.8,
        id: "2",
    },
    {
        position: new THREE.Vector3(-1.375, 0.953, 0.448),
        weight: 0.9,
        id: "3",
    },
    {
        position: new THREE.Vector3(-0.118, -0.432, -1.673),
        weight: 1.1,
        id: "4",
    }
];

export const simulationParam = {
    TEXTURE_SIZE: 512,
    PARTICLE_MASS: 1.0,
    VELOCITY_TERMINAL: 0.01,
    CURL_RADIUS_MIN: 0.55,
    CURL_RADIUS_DELTA: 0.2,
    CURL_NOISE_SPEEDUP: 0.35,
    MAX_SOURCES: 10,
    SOURCE_EDGE_EXT: 1.15,
    SOURCE_RADIUS: 0.02,
    MAX_FORCE: 2.0,
};