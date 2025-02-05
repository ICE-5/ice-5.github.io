attribute vec2 reference;
uniform sampler2D texturePosition;

void main(){
    vec3 position=texture2D(texturePosition,reference).xyz;
    
    #include <begin_vertex>
    #include <project_vertex>
    
    gl_PointSize=(1./-mvPosition.z)*5.;
}