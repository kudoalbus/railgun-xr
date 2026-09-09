import * as T from 'three';

const fingers = [
  ['thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],
  ...['index','middle','ring','pinky'].map(f=>['proximal','intermediate','distal','tip'].map(p=>`${f}-finger-${p==='tip'?'tip':'phalanx-'+p}`))
];
const up=new T.Vector3(0,1,0);

// A continuous outline around the finger edges and palm, not the joint skeleton.
export function handContour(j,radii={}){
  if(!j.wrist || fingers.flat().some(k=>!j[k]))return [];
  const forward=j['middle-finger-phalanx-proximal'].clone().sub(j.wrist);
  const side=j['index-finger-phalanx-proximal'].clone().sub(j['pinky-finger-phalanx-proximal']);
  const width=side.length(),normal=new T.Vector3().crossVectors(side,forward);
  if(width<.02||normal.lengthSq()<1e-10)return [];
  normal.normalize();side.normalize();forward.normalize();
  const points=[j.wrist.clone().addScaledVector(side,width*.42)];
  for(let f=0;f<fingers.length;f++){
    const names=fingers[f],centers=names.map(k=>j[k]);
    const edges=centers.map((p,i)=>{
      const tangent=centers[Math.min(i+1,3)].clone().sub(centers[Math.max(i-1,0)]).normalize();
      const lateral=new T.Vector3().crossVectors(tangent,normal);
      if(lateral.lengthSq()<.01)lateral.copy(side);else lateral.normalize();
      if(lateral.dot(side)<0)lateral.negate();
      const radius=T.MathUtils.clamp(radii[names[i]]||.008,.004,.014);
      return {p,lateral,tangent,radius};
    });
    points.push(...edges.map(e=>e.p.clone().addScaledVector(e.lateral,e.radius)));
    const tip=edges[3];
    for(let s=1;s<=6;s++){
      const a=s*Math.PI/6;
      points.push(tip.p.clone().addScaledVector(tip.lateral,Math.cos(a)*tip.radius).addScaledVector(tip.tangent,Math.sin(a)*tip.radius));
    }
    points.push(...edges.slice(0,3).reverse().map(e=>e.p.clone().addScaledVector(e.lateral,-e.radius)));
    if(f<4)points.push(centers[0].clone().lerp(j[fingers[f+1][0]],.5).addScaledVector(forward,-width*.12));
  }
  points.push(j.wrist.clone().addScaledVector(side,-width*.42),points[0].clone());
  return points;
}

export class HandOutline{
  constructor(scene){
    this.geometry=new T.CylinderGeometry(1,1,1,5,1,false);
    this.material=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
    this.mesh=new T.InstancedMesh(this.geometry,this.material,512);
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;
    this.scene=scene;scene.add(this.mesh);
    this.matrix=new T.Matrix4();this.rotation=new T.Quaternion();this.scale=new T.Vector3();
  }
  update(j,radii){
    const contour=handContour(j,radii);
    const points=contour.length?new T.CatmullRomCurve3(contour.slice(0,-1),true,'centripetal').getPoints(220):[];
    let count=0,distance=0;
    const period=.007,dash=.0043;
    for(let i=1;i<points.length;i++){
      const start=points[i-1],delta=points[i].clone().sub(start),length=delta.length();
      if(length<1e-7)continue;
      delta.divideScalar(length);this.rotation.setFromUnitVectors(up,delta);
      for(let at=0;at<length-1e-7;){
        const phase=(distance+at)%period,on=phase<dash;
        const step=Math.min(length-at,(on?dash:period)-phase+1e-8);
        if(on&&step>1e-6&&count<512){
          this.scale.set(.00065,step,.00065);
          this.matrix.compose(start.clone().addScaledVector(delta,at+step*.5),this.rotation,this.scale);
          this.mesh.setMatrixAt(count++,this.matrix);
        }
        at+=step;
      }
      distance+=length;
    }
    this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;
  }
  hide(){this.mesh.count=0}
  dispose(){this.scene.remove(this.mesh);this.mesh.dispose();this.geometry.dispose();this.material.dispose()}
}
