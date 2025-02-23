varying float vTemperature;

vec3 heatColor(float t) {
    // Normalize temperature (assuming 0 to 1 range, adjust if needed)
    float temp = clamp(t, 0.0, 1.0);
    return mix(vec3(0.07, 0.4, 0.58), vec3(0.59, 0.07, 0.35), temp); // Blue to red
}

void main() {
    // Circular point shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    if (length(coord) > 0.5) discard;
    
    gl_FragColor = vec4(heatColor(vTemperature), 1.0);
}