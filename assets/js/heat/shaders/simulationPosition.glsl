uniform float delta;
uniform float diffusionRate;
uniform float coolingRate;
uniform float gridSpacing;
uniform int textureSize;
uniform sampler2D texturePosition;

uniform vec2 sourcePosition;
uniform float sourceWeight;

varying vec2 vUv;

void main() {
    vec4 current = texture2D(texturePosition, vUv);
    vec2 pos = current.xy; // Preserve x, y positions
    float temp = current.z; // Current temperature

    if (sourcePosition.x >= 0. && sourcePosition.y >= 0.) {
        if (distance(vUv, sourcePosition) < 0.03) {
            temp = sourceWeight;
        }
    }
    
    // Texture step size
    vec2 texelSize = vec2(1.0 / float(textureSize));
    
    // Sample neighbors for Laplacian (5-point stencil)
    float left = texture2D(texturePosition, vUv - vec2(texelSize.x, 0.0)).z;
    float right = texture2D(texturePosition, vUv + vec2(texelSize.x, 0.0)).z;
    float up = texture2D(texturePosition, vUv + vec2(0.0, texelSize.y)).z;
    float down = texture2D(texturePosition, vUv - vec2(0.0, texelSize.y)).z;
    
    // Boundary conditions (reflective)
    if (vUv.x <= texelSize.x) left = temp;
    if (vUv.x >= 1.0 - texelSize.x) right = temp;
    if (vUv.y <= texelSize.y) down = temp;
    if (vUv.y >= 1.0 - texelSize.y) up = temp;
    
    // Laplacian operator: ∇²T = (T_left + T_right + T_up + T_down - 4*T_center) / h²
    float dx2 = gridSpacing * gridSpacing;
    float laplacian = (left + right + up + down - 4.0 * temp) / dx2;
    
    // Heat equation: dT/dt = α * ∇²T - β * T (diffusion - cooling)
    float newTemp = temp + delta * (diffusionRate * laplacian - coolingRate * temp);
    newTemp = max(newTemp, 0.0); // Prevent negative temperatures
    
    // TODO: Add heat sources here via uniform or SourceManager integration
    
    gl_FragColor = vec4(pos, newTemp, 1.0);
}