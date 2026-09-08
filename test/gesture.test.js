import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FlickGesture} from '../src/gesture.js';
const step=(g,time,loadPose=false,thumbUp=false,radial=0)=>g.update({time,loadPose,thumbUp,radial});
function arm(g,start=0){for(let i=0;i<=12;i++)step(g,start+i*.02,true);assert.equal(g.state,'armed')}
test('loaded pose then thumbs up fires with other fingers relaxed',()=>{const g=new FlickGesture();arm(g);assert.equal(step(g,.26,false,true,.4),false);assert.equal(step(g,.32,false,true,.4),true);assert.equal(step(g,.34,false,true,.4),false)});
test('slow deliberate thumb extension also fires',()=>{const g=new FlickGesture();arm(g);for(let i=13;i<60;i++)step(g,i*.02,false,false,(i-13)*.008);step(g,1.2,false,true,.4);assert.equal(step(g,1.26,false,true,.4),true)});
test('thumbs up without loading and wrist movement alone do not fire',()=>{const g=new FlickGesture();for(let i=0;i<80;i++)assert.equal(step(g,i*.02,false,true,.5),false);g.reset();arm(g);for(let i=13;i<40;i++)assert.equal(step(g,i*.02,false,false,0),false)});
test('one frame thumb noise is rejected and reloading is required',()=>{const g=new FlickGesture();arm(g);step(g,.26,false,true,.4);step(g,.28,false,false,.1);assert.equal(step(g,.3,false,true,.4),false);assert.equal(step(g,.36,false,true,.4),true);for(let i=19;i<70;i++)assert.equal(step(g,i*.02,false,true,.4),false);arm(g,1.4)});
test('tracking reset or interrupted frame sequence cancels loaded coin',()=>{const g=new FlickGesture();arm(g);assert.equal(step(g,.7,false,true,.5),false);assert.equal(g.state,'idle');arm(g,1);g.reset();assert.equal(step(g,2,false,true,.5),false)});
