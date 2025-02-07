varying vec2 vReference;

uniform sampler2D textureVelocity;
uniform float maxForce;

void main() {
    vec3 velocity = texture2D(textureVelocity, vReference).xyz;
    float forceStrength = length(velocity);
    float normalizedForce = clamp(log(1.0 + forceStrength) / log(1.0 + maxForce), 0.0, 1.0);

    vec3 colorA = vec3(0.7961, 0.1843, 0.502); // Orange
    vec3 colorB = vec3(0.0863, 0.502, 0.7451); // White

    vec3 particleColor = mix(colorA, colorB, normalizedForce);

    gl_FragColor = vec4(particleColor, 0.15);
}