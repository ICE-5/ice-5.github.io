#pragma glslify:curlNoise=require('./curlNoise.glsl')

uniform vec3 sourcePositions[10];
uniform float sourceWeights[10];

uniform int NUM_SOURCES;
uniform float PARTICLE_MASS;
uniform float VELOCITY_TERMINAL;
uniform float CURL_RADIUS_MIN;
uniform float CURL_RADIUS_DELTA;
uniform float CURL_NOISE_SPEEDUP;
uniform float time;

uniform vec3 impulsePosition;
uniform float impulseStrength;

void main(){
    vec2 uv=gl_FragCoord.xy/resolution.xy;
    vec3 position=texture2D(texturePosition,uv).xyz;
    vec3 velocity=texture2D(textureVelocity,uv).xyz;
    
    float curlRadius=CURL_RADIUS_MIN+CURL_RADIUS_DELTA*(sin(time*CURL_NOISE_SPEEDUP)+1.);
    float curlForce=min(length(position),curlRadius)/curlRadius;
    vec3 curlVelocity=curlNoise(position)-velocity;
    
    vec3 totalPull=vec3(0.);
    for(int i=0;i<NUM_SOURCES;i++){
        vec3 direction=sourcePositions[i]-position;
        float distance=length(direction);
        float pullForce=abs((sourceWeights[i]*PARTICLE_MASS)/(distance*distance));
        totalPull+=min(pullForce,VELOCITY_TERMINAL)*normalize(direction);
    }
    
    vec3 impulseDirection=impulsePosition-position;
    float impulseDistance=length(impulseDirection)+.0001;
    vec3 impulseForce=impulseStrength*normalize(impulseDirection)/(impulseDistance*impulseDistance);
    
    vec3 newVelocity=velocity+curlVelocity*curlForce+totalPull*8.+impulseForce*.5;
    gl_FragColor=vec4(newVelocity,1.);
}