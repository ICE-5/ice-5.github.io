import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.137.5/build/three.module.js';

// Ensure the SimplexNoise library is loaded
if (typeof window.SimplexNoise === 'undefined') {
    throw new Error('SimplexNoise is not loaded. Please include simplex-noise.js before this script.');
}

const simplex = new window.SimplexNoise();

// SCENE SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000020); // Dark blue background

// CAMERA SETUP
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 100; // Distance from particles

// RENDERER SETUP
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// PARTICLE SYSTEM CONFIGURATION
const particleCount = 10000;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

// Generate particle positions, velocities, and colors
for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities[i * 3] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

    const color = new THREE.Color();
    color.setHSL(0.6 + 0.2 * (y / 200), 1.0, 0.5);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
}

particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// PARTICLE MATERIAL WITH SHADERS
const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: `
    attribute vec3 velocity;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 5.0 * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
    fragmentShader: `
    varying vec3 vColor;
    void main() {
      float strength = length(gl_PointCoord - vec2(0.5));
      if (strength > 0.5) discard;
      gl_FragColor = vec4(vColor, 1.0 - strength * 2.0);
    }
  `,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true
});

// CREATE PARTICLE SYSTEM
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

// ANIMATION LOOP
const clock = new THREE.Clock();
function animateParticles() {
    const elapsedTime = clock.getElapsedTime();

    const positions = particles.attributes.position.array;
    const velocities = particles.attributes.velocity.array;

    for (let i = 0; i < particleCount; i++) {
        const index = i * 3;

        const noiseX = simplex.noise3D(positions[index] * 0.02, elapsedTime * 0.1, 0);
        const noiseY = simplex.noise3D(positions[index + 1] * 0.02, elapsedTime * 0.1, 0);
        const noiseZ = simplex.noise3D(positions[index + 2] * 0.02, elapsedTime * 0.1, 0);

        velocities[index] += noiseX * 0.01;
        velocities[index + 1] += noiseY * 0.01;
        velocities[index + 2] += noiseZ * 0.01;

        positions[index] += velocities[index];
        positions[index + 1] += velocities[index + 1];
        positions[index + 2] += velocities[index + 2];

        if (positions[index] > 100 || positions[index] < -100) velocities[index] *= -1;
        if (positions[index + 1] > 100 || positions[index + 1] < -100) velocities[index + 1] *= -1;
        if (positions[index + 2] > 100 || positions[index + 2] < -100) velocities[index + 2] *= -1;
    }

    particles.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animateParticles);
}

animateParticles();