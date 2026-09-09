import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {assembleCoin,COIN_DIAMETER} from '../src/coin.js';
import {Lightning,LIGHTNING_LIFETIME} from '../src/lightning.js';
test('supplied GLB assembles into two opposing 36mm faces',async()=>{
 const bytes=await fs.readFile(new URL('../src/coin-model.glb',import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const model=assembleCoin(gltf.scene);model.updateMatrixWorld(true);
 const size=new T.Box3().setFromObject(model).getSize(new T.Vector3());
 assert.ok(Math.abs(Math.max(size.x,size.y)-COIN_DIAMETER)<.00001);assert.ok(size.z<.005);
 const front=new T.Box3().setFromObject(model.children[0]);const back=new T.Box3().setFromObject(model.children[1]);
 assert.ok(front.max.z>.001&&front.min.z>-.00001);assert.ok(back.min.z<-.001&&back.max.z<.00001);
});
test('main and branch glow geometry fades completely at 2.5 seconds',()=>{
 const scene=new T.Scene();const arc=new Lightning(scene,new T.Vector3(),new T.Vector3(0,0,-1));
 for(const age of [.01,.5,1.5,2.5]){arc.update(age);for(const mesh of arc.meshes){assert.ok(mesh.count<=160&&mesh.count>=122);assert.ok([...mesh.instanceMatrix.array].every(Number.isFinite));}}
 assert.equal(LIGHTNING_LIFETIME,2.5);assert.ok(arc.meshes.every(m=>m.material.uniforms.alpha.value===0));arc.dispose();assert.equal(scene.children.length,0);
});
