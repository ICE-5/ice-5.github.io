varying vec2 vReference;

uniform sampler2D textureVelocity;
uniform float maxForce;
uniform float alpha;  // Smoothing factor (0.01 ~ 0.1 recommended)
uniform float prevMu; // Pass from the previous frame
uniform float time;

const float tau = 5.0;  // Exponential growth speed
const float omega = 0.5; // Oscillation speed

void main() {
    vec3 velocity = texture2D(textureVelocity, vReference).xyz;
    float forceStrength = length(velocity);

    // k osciliation
    float expGrowth = 1.0 - exp(-time / tau);
    float oscillation = 0.5 + 0.5 * sin(omega * time);

    float k_min = 1.25;
    float k_max = 2.0;
    float k = k_min + (k_max - k_min) * expGrowth * oscillation;

    // float k = 1.75;

    float mu = alpha * forceStrength + (1.0 - alpha) * prevMu;
    // float normalizedStrength = 1.0 / (1.0 + exp(-k * (forceStrength - mu)));

    float normalizedStrength = clamp(log(1.0 + forceStrength) / log(1.0 + maxForce), 0.0, 1.0);

    vec3 colorB = vec3(0.07, 0.4, 0.58);
    vec3 colorA = vec3(0.59, 0.07, 0.35);

    vec3 particleColor = mix(colorA, colorB, normalizedStrength);

    gl_FragColor = vec4(particleColor, 0.15 * normalizedStrength);
}