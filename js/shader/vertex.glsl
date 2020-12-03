varying vec2 vUv;
varying vec3 vPos;
varying vec2 vCoordinates;

attribute vec3 aCoordinates;
attribute float aDirection;
attribute float aOffset;
attribute float aPress;
attribute float aSpeed;

uniform float move;
uniform vec2 mouse;
uniform float mousePressed;
uniform float time;
uniform float transition;

void main(){
  vUv=uv;
  
  // POOF
  vec3 pos=position;
  pos.x+=sin(move*aSpeed)*3.;
  pos.y+=sin(move*aSpeed)*3.;
  pos.z=mod(position.z+move*200.*aSpeed+aOffset,2000.)-1000.;
  
  // NOT POOF
  vec3 stable=position;
  float dist=distance(stable.xy,mouse);
  float area=1.-smoothstep(0.,500.,dist);
  
  // some physics, i guess
  stable.x+=50.*sin(.1*time*aPress)*aDirection*area*mousePressed;
  stable.y+=50.*sin(.1*time*aPress)*aDirection*area*mousePressed;
  stable.z+=200.*cos(.1*time*aPress)*aDirection*area*mousePressed;
  
  // and finally
  pos=mix(pos,stable,transition);
  
  vec4 mvPosition=modelViewMatrix*vec4(pos,1.);
  
  gl_PointSize=4000.*(1./-mvPosition.z);
  gl_Position=projectionMatrix*mvPosition;
  vCoordinates=aCoordinates.xy;
  vPos=pos;
}