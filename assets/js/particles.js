/**
 * Particle Simulation
 * 
 * This code is based on the original work by Tim Severien, available at:
 * https://codepen.io/timseverien/pen/EmJNOR
 * 
 * Modifications and optimizations may have been made for integration into this project.
 * All credits for the foundational implementation go to Tim Severien.
 * 
 * Author: Yuning Wu
 * Date: 2025.1
 */

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Define sources of pull force
const sources = [
    {
        position: new THREE.Vector3(0.0, 0.0, 0.0), 
        weight: 1.2, 
        id: "0",
        text: "", 
        href: '#',
        link: null
    },
    {
        position: new THREE.Vector3(1.447, 0.916, 0.259), 
        weight: 1.0, 
        id: "1",
        text: "AI+ROBOTICS RESEARCHER", 
        href: "/index.html",
        link: null
    },
    {
        position: new THREE.Vector3(0.046, -1.437, 0.966), 
        weight: 1.0, 
        id: "2",
        text: "ARCHITECT OF SPACES AND SYSTEMS", 
        href: "/portfolio.html",
        link: null
    },
    {
        position: new THREE.Vector3(-1.375, 0.953, 0.448), 
        weight: 1.0, 
        id: "3",
        text: "CREATIVE TECHNOLOGIST", 
        href: '#',
        link: null
    },
    {
        position: new THREE.Vector3(-0.118, -0.432, -1.673), 
        weight: 1.0, 
        id: "4",
        text: "EXPLORER OF FUNDAMENTAL, ELEGANT INTELLIGENCE", 
        href: '#',
        link: null
    },
];

const sourcePositions = new Float32Array(sources.length * 3);
const sourceWeights = new Float32Array(sources.length);

sources.forEach((source, index) => {
    sourcePositions[index * 3] = source.position.x;
    sourcePositions[index * 3 + 1] = source.position.y;
    sourcePositions[index * 3 + 2] = source.position.z;
    sourceWeights[index] = source.weight;
});

// Extension factor for edges
const EDGE_EXTENSION = 1.15;

// Add links on top of the canvas for each source
function toScreenPosition(position, camera) {
    const vector = position.clone().project(camera); // Convert to normalized device coordinates (NDC)
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;   // Convert to screen space
    const y = (1 - vector.y * 0.5 - 0.5) * window.innerHeight;
    return { x, y };
}

function updateLinkPositions() {
    sources.forEach((source) => {
        const extendedPosition = source.position.clone().multiplyScalar(EDGE_EXTENSION)
        const screenPosition = toScreenPosition(extendedPosition, camera);
        source.link.style.transform = `translate(${screenPosition.x}px, ${screenPosition.y}px)`;
    });
}

const linkContainer = document.createElement('a');
linkContainer.style.position = 'absolute';
linkContainer.style.top = '0';
linkContainer.style.left = '0';
linkContainer.style.pointerEvents = 'none'; // Let clicks pass through to the canvas
document.body.appendChild(linkContainer);

sources.forEach((source) => {
    const link = document.createElement('a');
    link.innerText = `${source.text}`;
    link.href = `${source.href}`;
    link.className = 'source-link';
    link.style.position = 'absolute';
    linkContainer.appendChild(link);

    // Store the link reference for updating position later
    source.link = link;
});

const style = document.createElement('style');
style.innerHTML = `
    .source-link {
        position: absolute;
        color: #ffffff;
        text-decoration: none;
        font-weight: bold;
        z-index: 10;
        pointer-events: auto;
    }

    .source-link:hover {
        text-decoration: underline;
    }
`;
document.head.appendChild(style);



// Shader for Simplex Noise
// From: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83#simplex-noise
const shaderPartialSimplexNoise = `
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        float n_ = 1.0/7.0; 
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
    }`;

// Shader for Curl Noise
// From: https://github.com/cabbibo/glsl-curl-noise
const shaderPartialCurlNoise = `
    ${shaderPartialSimplexNoise}

    vec3 snoiseVec3( vec3 x ){
        float s  = snoise(vec3( x ));
        float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
        float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
        vec3 c = vec3( s , s1 , s2 );
        return c;
    }

    vec3 curlNoise( vec3 p ){
        const float e = .1;
        vec3 dx = vec3( e   , 0.0 , 0.0 );
        vec3 dy = vec3( 0.0 , e   , 0.0 );
        vec3 dz = vec3( 0.0 , 0.0 , e   );

        vec3 p_x0 = snoiseVec3( p - dx );
        vec3 p_x1 = snoiseVec3( p + dx );
        vec3 p_y0 = snoiseVec3( p - dy );
        vec3 p_y1 = snoiseVec3( p + dy );
        vec3 p_z0 = snoiseVec3( p - dz );
        vec3 p_z1 = snoiseVec3( p + dz );

        float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
        float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
        float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

        const float divisor = 1.0 / ( 2.0 * e );
        return normalize( vec3( x , y , z ) * divisor );
    }`

// Shader for updating particle positions
const shaderSimulationPosition = `
    uniform float delta;

    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 position = texture2D(texturePosition, uv).xyz;
        vec3 velocity = texture2D(textureVelocity, uv).xyz;

        gl_FragColor = vec4(position + velocity * delta, 1.0);
    }`;

// Shader for updating particle velocities
// const shaderSimulationVelocity = `
//     ${shaderPartialCurlNoise}

//     const float CENTER_MASS = 1.0;
//     const float PARTICLE_MASS = 1.0;
//     const float VELOCITY_TERMINAL = 0.01;
//     const float CURL_RADIUS = 0.5;

//     void main() {
//         vec2 uv = gl_FragCoord.xy / resolution.xy;
//         vec3 position = texture2D(texturePosition, uv).xyz;
//         vec3 velocity = texture2D(textureVelocity, uv).xyz;

//         float distance = length(position);

//         float curlForce = min(distance, CURL_RADIUS) / CURL_RADIUS;
//         vec3 curlVelocity = curlNoise(position) - velocity;

//         float pullForce = abs((CENTER_MASS * PARTICLE_MASS) / (distance * distance));
//         vec3 pull = min(pullForce, VELOCITY_TERMINAL) * -normalize(position);

//         vec3 newVelocity = velocity + curlVelocity * curlForce + pull * 16.0;

//         gl_FragColor = vec4(newVelocity, 1.0);
//     }`;

const shaderSimulationVelocity = `
    ${shaderPartialCurlNoise}

    const float CENTER_MASS = 1.0;
    const float PARTICLE_MASS = 1.0;
    const float VELOCITY_TERMINAL = 0.01;
    const float CURL_RADIUS = 0.5;

    // Define pull force sources
    const int NUM_SOURCES = 5;
    const vec3 sources[NUM_SOURCES] = vec3[](
        vec3(0.0, 0.0, 0.0),
        vec3(1.447, 0.916, 0.259),
        vec3(0.046, -1.437, 0.966),
        vec3(-1.375, 0.953, 0.448),
        vec3(-0.118, -0.432, -1.673)
    );
    const float weights[NUM_SOURCES] = float[](
        1.2,
        1.0,
        1.0,
        1.0,
        1.0
    );

    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 position = texture2D(texturePosition, uv).xyz;
        vec3 velocity = texture2D(textureVelocity, uv).xyz;

        float curlForce = min(length(position), CURL_RADIUS) / CURL_RADIUS;
        vec3 curlVelocity = curlNoise(position) - velocity;

        // Calculate cumulative pull force from all sources
        vec3 totalPull = vec3(0.0);
        for (int i = 0; i < NUM_SOURCES; i++) {
            vec3 direction = sources[i] - position;
            float distance = length(direction);
            float pullForce = abs((weights[i] * PARTICLE_MASS) / (distance * distance));
            totalPull += min(pullForce, VELOCITY_TERMINAL) * normalize(direction);
        }

        vec3 newVelocity = velocity + curlVelocity * curlForce + totalPull * 7.0;
        
        gl_FragColor = vec4(newVelocity, 1.0);
    }`;


// const shaderSimulationVelocity = `
//     ${shaderPartialCurlNoise}

//     const int NUM_SOURCES = ${NUM_SOURCES};

//     const float CENTER_MASS = 1.0;
//     const float PARTICLE_MASS = 1.0;
//     const float VELOCITY_TERMINAL = 0.01;
//     const float CURL_RADIUS = 0.5;

//     uniform vec3 sources[NUM_SOURCES];
//     uniform float weights[NUM_SOURCES];

//     void main() {
//         vec2 uv = gl_FragCoord.xy / resolution.xy;
//         vec3 position = texture2D(texturePosition, uv).xyz;
//         vec3 velocity = texture2D(textureVelocity, uv).xyz;

//         float distance = length(position);

//         float curlForce = min(distance, CURL_RADIUS) / CURL_RADIUS;
//         vec3 curlVelocity = curlNoise(position) - velocity;

//         // Calculate cumulative pull force from all sources
//         vec3 totalPull = vec3(0.0);
//         for (int i = 0; i < NUM_SOURCES; i++) {
//             vec3 direction = sources[i] - position;
//             float distance = length(direction);
//             float pullForce = abs((weights[i] * PARTICLE_MASS) / (distance * distance));
//             totalPull += min(pullForce, VELOCITY_TERMINAL) * normalize(direction);
//         }

//         vec3 newVelocity = velocity + curlVelocity * curlForce + totalPull * 16.0;

//         gl_FragColor = vec4(newVelocity, 1.0);
//     }`;

// Shader for rendering particles
// gl_FragColor = vec4(1.0, 0.15, 0.05, 0.5);
const shaderPointFragment = `
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 0.1);
    }`;

// Vertex shader for particles
const shaderPointVertex = `
    attribute vec2 reference;
    uniform sampler2D texturePosition;

    void main() {
        vec3 position = texture2D(texturePosition, reference).xyz;

        ${THREE.ShaderChunk.begin_vertex}
        ${THREE.ShaderChunk.project_vertex}

        gl_PointSize = 4.0 * (1.0 / -mvPosition.z);
    }`;

// Constants for texture size
const TEXTURE_SIZE = 512;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE * 2;

let previousFrame = Date.now() / 1000;

// Camera setup
const cameraFar = Math.pow(2, 16);
const camera = new THREE.PerspectiveCamera(45, 1, 0.001, cameraFar);
// camera.position.z = 8;
camera.position.z = 5.5;

// Scene and renderer setup
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);

// Orbit controls for camera
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.autoRotate = true;

// Particle system setup
const particles = ((points) => {
    const vertices = new Float32Array(points * 3).fill(0);
    const references = new Float32Array(points * 2);

    for (let i = 0; i < references.length; i += 2) {
        const indexVertex = i / 2;
        references[i] = (indexVertex % TEXTURE_WIDTH) / TEXTURE_WIDTH;
        references[i + 1] = Math.floor(indexVertex / TEXTURE_WIDTH) / TEXTURE_HEIGHT;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            texturePosition: { value: null },
        },
        fragmentShader: shaderPointFragment,
        vertexShader: shaderPointVertex,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
    });

    return new THREE.Points(geometry, material);
})(TEXTURE_WIDTH * TEXTURE_HEIGHT);

scene.add(particles);



// Draw sources and edges
const sourceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 }); // White color for the spheres

sources.forEach((source) => {
    const sourceRadius = 0.05 * source.weight * 0.25; // Radius proportional to weight
    const sphereGeometry = new THREE.SphereGeometry(sourceRadius, 16, 16); // Sphere geometry
    const sphere = new THREE.Mesh(sphereGeometry, sourceMaterial);
    sphere.position.copy(source.position); // Set position of the sphere
    scene.add(sphere);
});

const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }); // White color for edges
const edgeGeometry = new THREE.BufferGeometry();
const edgePositions = [];

// Define the edges of the simplex (pairs of vertices by index)
const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [1, 3], [1, 4],
    [2, 3], [2, 4],
    [3, 4]
];

// Add edge positions to the geometry
edges.forEach(([start, end]) => {
    edgePositions.push(
        sources[start].position.x, sources[start].position.y, sources[start].position.z,
        sources[end].position.x, sources[end].position.y, sources[end].position.z
    );
});

// Add edge extensions to the geometry
// sources.forEach((source) => {
//     edgePositions.push(
//         source.position.x, source.position.y, source.position.z,
//         source.position.x * EDGE_EXTENSION, source.position.y * EDGE_EXTENSION, source.position.z * EDGE_EXTENSION
//     );
// });

edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
scene.add(edgeLines);


// GPU computation renderer setup
const gpuComputationRenderer = new GPUComputationRenderer(TEXTURE_WIDTH, TEXTURE_HEIGHT, renderer);

const dataPosition = gpuComputationRenderer.createTexture();
const dataVelocity = gpuComputationRenderer.createTexture();
const textureArraySize = TEXTURE_WIDTH * TEXTURE_HEIGHT * 4;

// Initialize particle positions and velocities
for (let i = 0; i < textureArraySize; i += 4) {
    const radius = (1 - Math.pow(Math.random(), 3)) * 1;
    const azimuth = Math.random() * Math.PI;
    const inclination = Math.random() * Math.PI * 2;

    dataPosition.image.data[i] = radius * Math.sin(azimuth) * Math.cos(inclination);
    dataPosition.image.data[i + 1] = radius * Math.cos(azimuth);
    dataPosition.image.data[i + 2] = radius * Math.sin(azimuth) * Math.sin(inclination);

    dataVelocity.image.data[i] = 0;
    dataVelocity.image.data[i + 1] = 0;
    dataVelocity.image.data[i + 2] = 0;
    dataVelocity.image.data[i + 3] = 1;
}

// Add variables to GPU computation renderer
const variableVelocity = gpuComputationRenderer.addVariable('textureVelocity', shaderSimulationVelocity, dataVelocity);
const variablePosition = gpuComputationRenderer.addVariable('texturePosition', shaderSimulationPosition, dataPosition);

variablePosition.material.uniforms.delta = { value: 0 };

gpuComputationRenderer.setVariableDependencies(variableVelocity, [variableVelocity, variablePosition]);
gpuComputationRenderer.setVariableDependencies(variablePosition, [variableVelocity, variablePosition]);

variablePosition.wrapS = THREE.RepeatWrapping;
variablePosition.wrapT = THREE.RepeatWrapping;
variableVelocity.wrapS = THREE.RepeatWrapping;
variableVelocity.wrapT = THREE.RepeatWrapping;

const gpuComputationRendererError = gpuComputationRenderer.init();

if (gpuComputationRendererError) {
    console.error('ERROR', gpuComputationRendererError);
}

// Resize function to handle window resizing
const resize = (width = window.innerWidth, height = window.innerHeight) => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
};

// Render function to update the scene
const render = (delta) => {
    gpuComputationRenderer.compute();
    variablePosition.material.uniforms.delta.value = Math.min(delta, 0.5);
    particles.material.uniforms.texturePosition.value = gpuComputationRenderer.getCurrentRenderTarget(variablePosition).texture;
    renderer.render(scene, camera);
};

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);

    const now = Date.now() / 1000;
    const delta = now - previousFrame;
    previousFrame = now;

    // Update GPU computation renderer
    render(delta);

    // Update link positions
    updateLinkPositions();

    // Update orbit controls
    controls.update();
};

// Initialize and start the animation
document.body.appendChild(renderer.domElement);
window.addEventListener('resize', () => resize());
resize();
animate();

