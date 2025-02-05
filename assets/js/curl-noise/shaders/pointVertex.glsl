attribute vec2 reference;
uniform sampler2D texturePosition;

void main(){
    vec3 position=texture2D(texturePosition,reference).xyz;
    
    // Three.js shader chunks are automatically injected when using ShaderMaterial.
    #include <begin_vertex>
    #include <project_vertex>
    
    gl_PointSize=4.0*(1.0/-mvPosition.z);
}