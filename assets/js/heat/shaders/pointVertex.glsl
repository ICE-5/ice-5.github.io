uniform sampler2D texturePosition;
attribute vec2 reference;
varying float vTemperature;

void main() {
    vec4 posTemp = texture2D(texturePosition, reference);
    vec3 pos = posTemp.xyz;
    vTemperature = posTemp.z;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 5.0;
}