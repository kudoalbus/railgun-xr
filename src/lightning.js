import * as T from 'three';
export const LIGHTNING_LIFETIME=4.6;
const SEGMENTS=160,axis=new T.Vector3(0,1,0),cylinder=new T.CylinderGeometry(1,1,1,12,1,true);
const layers=[{color:0x1263ff,radius:6,opacity:.12},{color:0x20caff,radius:2.6,opacity:.38},{color:0xddffff,radius:1,opacity:.95}];
// World-space tubes render consistently in both XR eyes, without line-width limits.
export class Lightning {
  constructor(scene,origin,direction){
    this.scene=scene;this.origin=origin.clone();this.direction=direction.clone().normalize();this.seed=Math.random()*100;this.tick=-1;
    const helper=Math.abs(this.direction.y)>.9?new T.Vector3(1,0,0):axis;
    this.side=new T.Vector3().crossVectors(this.direction,helper).normalize();this.up=new T.Vector3().crossVectors(this.side,this.direction).normalize();
    this.meshes=layers.map(layer=>{const material=new T.ShaderMaterial({uniforms:{tint:{value:new T.Color(layer.color)},alpha:{value:layer.opacity},softness:{value:layer.radius>1?2.5:0}},vertexShader: `varying vec3 n;varying vec3 view;void main(){vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.);n=normalize(normalMatrix*mat3(instanceMatrix)*normal);view=-p.xyz;gl_Position=projectionMatrix*p;}`,fragmentShader: `uniform vec3 tint;uniform float alpha;uniform float softness;varying vec3 n;varying vec3 view;void main(){float facing=abs(dot(normalize(n),normalize(view)));gl_FragColor=vec4(tint,alpha*pow(max(.001,facing),softness));
#include <colorspace_fragment>
}`,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});const mesh=new T.InstancedMesh(cylinder,material,SEGMENTS);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);return mesh});
    this.object=new T.Object3D();this.delta=new T.Vector3();
  }
  point(distance,x=0,y=0){return this.origin.clone().addScaledVector(this.direction,distance).addScaledVector(this.side,x).addScaledVector(this.up,y)}
  update(age){
    const fade=Math.pow(Math.max(0,1-Math.max(0,age-.65)/(LIGHTNING_LIFETIME-.65)),1.35);
    this.meshes.forEach((mesh,i)=>mesh.material.uniforms.alpha.value=layers[i].opacity*fade*(.9+.1*Math.sin(age*39)));
    const tick=Math.floor(age*24);if(tick===this.tick)return;this.tick=tick;
    const phase=tick*.63+this.seed,length=Math.min(18,age*22),segments=[];
    const wave=(i,k)=>Math.sin(i*2.37+phase*k)*.6+Math.sin(i*5.11-phase*.8)*.4;
    const trunk=[];
    for(let i=0;i<=32;i++){const f=i/32,spread=Math.sin(f*Math.PI)*.28;trunk.push(this.point(length*f,spread*wave(i,1),spread*wave(i+9,.7)))}
    for(let i=1;i<trunk.length;i++)segments.push([trunk[i-1],trunk[i],.026*(1-i/55)]);
    for(let b=0;b<10;b++){
      const start=trunk[3+b*2],angle=b*2.4+this.seed,spread=(.5+.65*Math.sin(b+1)**2)*Math.min(1,age*5);let prev=start;
      for(let k=1;k<=8;k++){const f=k/8;const point=start.clone().addScaledVector(this.direction,(b%2?1:-.25)*f*length*.22).addScaledVector(this.side,Math.cos(angle)*f*spread+wave(k+b,1)*.1*f).addScaledVector(this.up,Math.sin(angle)*f*spread+wave(k+b+3,.8)*.12*f);segments.push([prev,point,.012*(1-f*.8)]);if(k===5){const tip=point.clone().addScaledVector(this.side,Math.sin(angle)*.35).addScaledVector(this.up,Math.cos(angle)*.35);segments.push([point,tip,.004])}prev=point}
    }
    if(age<.45){for(let i=0;i<14;i++){const a=i*Math.PI*2/14,r=.45*Math.sin(Math.min(1,age/.45)*Math.PI);segments.push([this.origin,this.point(.12,Math.cos(a)*r,Math.sin(a)*r),.025*(1-age/.45)])}}
    for(let i=0;i<segments.length;i++){
      const [from,to,radius]=segments[i];this.delta.subVectors(to,from);this.object.position.copy(from).add(to).multiplyScalar(.5);this.object.quaternion.setFromUnitVectors(axis,this.delta.clone().normalize());
      for(let layer=0;layer<3;layer++){this.object.scale.set(radius*layers[layer].radius,Math.max(.0001,this.delta.length()),radius*layers[layer].radius);this.object.updateMatrix();this.meshes[layer].setMatrixAt(i,this.object.matrix)}
    }
    this.meshes.forEach(mesh=>{mesh.count=segments.length;mesh.instanceMatrix.needsUpdate=true});
  }
  dispose(){for(const mesh of this.meshes){this.scene.remove(mesh);mesh.material.dispose();mesh.dispose()}}
}
