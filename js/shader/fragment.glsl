uniform float time;

varying vec2 vCoordinates;
varying vec3 vPos;
varying vec2 vUv;

uniform sampler2D mask;
uniform sampler2D t1;
uniform sampler2D t2;
uniform float move;

float PI=3.141592653589793238;

void main(){
	vec4 maskTexture=texture2D(mask,gl_PointCoord);
	vec2 myUV=vec2(vCoordinates.x/512.,vCoordinates.y/512.);
	vec4 tt1=texture2D(t1,myUV);
	vec4 tt2=texture2D(t2,myUV);
	
	vec4 final=mix(tt1,tt2,(0.,1.,fract(move)));
	
	float alpha=1.-clamp(0.,1.,abs(vPos.z/900.));
	
	gl_FragColor=final;
	gl_FragColor.a*=maskTexture.r*alpha;
}