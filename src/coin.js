import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export const COIN_DIAMETER=.036;
export const COIN_RADIUS=COIN_DIAMETER/2;
export const COIN_MODEL_URL=new URL('./coin-model.glb',import.meta.url).href;

// The supplied prop contains two separate relief shells laid side by side.
export function assembleCoin(source){
  const coin=new T.Group();coin.name='Double-sided arcade coin, 36mm';
  for(const [name,back] of [['mskcoincrown_0',false],['mskcoincrown001_1',true]]){
    const original=source.getObjectByName(name);
    if(!original)throw new Error('硬币模型缺少正面或反面');
    const shell=original.clone(true);
    const bounds=new T.Box3().setFromObject(shell),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const centered=new T.Group();centered.add(shell);centered.position.set(-center.x,-bounds.min.y,-center.z);
    const plane=new T.Group();plane.add(centered);plane.rotation.x=Math.PI/2;
    const face=new T.Group();face.name=back?'reverse':'obverse';face.add(plane);face.rotation.y=back?Math.PI:0;
    face.scale.setScalar(COIN_DIAMETER/Math.max(size.x,size.z));coin.add(face);
  }
  const metal=new T.MeshStandardMaterial({color:0xbac4ce,metalness:.82,roughness:.3});
  coin.traverse(object=>{if(object.isMesh){object.material=metal;object.castShadow=false;object.receiveShadow=false}});
  return coin;
}
export async function coin(){const gltf=await new GLTFLoader().loadAsync(COIN_MODEL_URL);return assembleCoin(gltf.scene)}
