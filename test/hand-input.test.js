import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Matrix4,Quaternion,Scene,Vector3} from 'three';
import {HandOutline,handContour} from '../src/hand-outline.js';
import {controllerAim,sessionOptions} from '../src/xr-input.js';
import {sampleHand} from './hand-fixture.js';

test('white hand perimeter works for both hands, curled fingers and missing tracking',()=>{
  const scene=new Scene(),outline=new HandOutline(scene),matrix=new Matrix4();
  for(const curled of [false,true])for(const mirror of [1,-1]){
    const joints=sampleHand(curled);for(const p of Object.values(joints))p.x*=mirror;
    const points=handContour(joints);assert.ok(points.length>60);assert.ok(points[0].equals(points.at(-1)));
    outline.update(joints);assert.ok(outline.mesh.count>70&&outline.mesh.count<512);
    assert.equal(outline.material.color.getHex(),0xffffff);
    for(let i=0;i<outline.mesh.count;i++){outline.mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite))}
  }
  const joints=sampleHand();delete joints['thumb-tip'];outline.update(joints);assert.equal(outline.mesh.count,0);
  outline.dispose();assert.equal(scene.children.length,0);
});

test('hand outline follows 6DOF rotation and translation',()=>{
  const joints=sampleHand(),before=handContour(joints),rotation=new Quaternion().setFromAxisAngle(new Vector3(1,1,0).normalize(),1.2),offset=new Vector3(1,2,-3);
  for(const p of Object.values(joints))p.applyQuaternion(rotation).add(offset);
  const after=handContour(joints);before.forEach((p,i)=>assert.ok(p.applyQuaternion(rotation).add(offset).distanceTo(after[i])<1e-8));
});

test('controller fallback uses tracked aim, ignores gaze/pinch and tracking loss',()=>{
  assert.ok(sessionOptions.optionalFeatures.includes('hand-tracking'));assert.equal(sessionOptions.requiredFeatures,undefined);
  const source={targetRayMode:'tracked-pointer',gamepad:{},targetRaySpace:{}},reference={};
  const frame={getPose:()=>({transform:{position:{x:1,y:2,z:3},orientation:{x:0,y:1,z:0,w:0}}})};
  const aim=controllerAim(source,frame,reference);assert.ok(aim.direction.distanceTo(new Vector3(0,0,1))<1e-8);assert.ok(aim.origin.distanceTo(new Vector3(1,2,3.08))<1e-8);
  assert.equal(controllerAim({...source,hand:{}},frame,reference),null);
  assert.equal(controllerAim({...source,targetRayMode:'gaze'},frame,reference),null);
  assert.equal(controllerAim(source,{getPose:()=>null},reference),null);
});
