import {test} from 'node:test';import assert from 'node:assert/strict';import {FlickGesture} from '../src/gesture.js';
const sample=(g,time,contact=true,y=0,closed=true)=>g.update({time,closed,contact,relative:[0,y,0]});
test('stable fist arms, forward thumb fires once and cooldown prevents repeat',()=>{const g=new FlickGesture();sample(g,0);sample(g,.25);assert.equal(g.state,'armed');assert.equal(sample(g,.27,false,.025),true);assert.equal(sample(g,.29,false,.05),false)});
test('open hand and slow release do not fire',()=>{const g=new FlickGesture();sample(g,0);sample(g,.25);assert.equal(sample(g,.27,false,.001),false);assert.equal(sample(g,.29,false,.06,false),false);assert.equal(g.state,'idle')});
test('tracking reset discards armed state',()=>{const g=new FlickGesture();sample(g,0);sample(g,.25);g.reset();assert.equal(sample(g,1,false,.2),false)});
