attribute vec2 reference;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
varying vec2 vReference;

void main(){
    vec3 position=texture2D(texturePosition,reference).xyz;
    vec3 velocity=texture2D(textureVelocity,reference).xyz;
    float force=length(velocity);

    vReference=reference;
    
    #include <begin_vertex>
    #include <project_vertex>
    
    // gl_PointSize=(1./-mvPosition.z)*5.;
    gl_PointSize=50.*pow(force, 3.0)/pow(mvPosition.z, 2.0);
}