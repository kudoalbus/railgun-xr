import {Quaternion,Vector3} from 'three';

export const sessionOptions={optionalFeatures:['hand-tracking','local-floor']};
export function controllerAim(source,frame,reference){
  // Do not reinterpret hand select/pinch or gaze events as trigger shots.
  if(source.hand||source.targetRayMode!=='tracked-pointer'||!source.gamepad||!frame||!reference)return null;
  const pose=frame.getPose(source.targetRaySpace,reference);
  if(!pose)return null;
  const p=pose.transform.position,q=pose.transform.orientation;
  const rotation=new Quaternion(q.x,q.y,q.z,q.w);
  const direction=new Vector3(0,0,-1).applyQuaternion(rotation).normalize();
  return {origin:new Vector3(p.x,p.y,p.z).addScaledVector(direction,.08),direction,rotation};
}
