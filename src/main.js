import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {coin,COIN_RADIUS,COIN_MODEL_URL} from './coin.js';
import {FlickGesture} from './gesture.js';
import {Lightning,LIGHTNING_LIFETIME} from './lightning.js';
import './style.css';
const $=s=>document.querySelector(s),status=s=>$('#status').textContent=s;
const renderer=new T.WebGLRenderer({canvas:$('#scene'),antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');renderer.setClearColor(0x050c14,1);
const scene=new T.Scene();const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();scene.fog=new T.FogExp2(0x050c14,.035);const camera=new T.PerspectiveCamera(45,innerWidth/innerHeight,.01,100);camera.position.set(0,1.5,3.4);
scene.add(new T.HemisphereLight(0xb9e7ff,0x142c44,3));for(const [x,z,c]of [[2,2,0xc6edff],[-2,-1,0x159dff]]){const l=new T.DirectionalLight(c,5);l.position.set(x,4,z);scene.add(l)}
const grid=new T.GridHelper(80,80,0x164059,0x102330);grid.position.y=-.1;scene.add(grid);
$('#enter').disabled=true;$('#demo').disabled=true;$('#support').textContent='正在加载双面硬币模型…';
let coinTemplate;
try{coinTemplate=await coin();$('#demo').disabled=false}catch(error){$('#support').textContent='硬币模型加载失败，请刷新重试：'+error.message;throw error}
const chargeGeometry=new T.BufferGeometry().setFromPoints(Array.from({length:64},()=>new T.Vector3()));const chargeMaterial=new T.LineBasicMaterial({color:0x58caff,transparent:true,opacity:.8,blending:T.AdditiveBlending});coinTemplate.add(new T.Line(chargeGeometry,chargeMaterial));
const preview=coinTemplate.clone(true);preview.scale.setScalar(35);preview.position.set(.3,1.5,0);preview.rotation.set(.2,-.5,.12);scene.add(preview);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.5,0);controls.enablePan=false;controls.minDistance=1;controls.maxDistance=6;controls.enableDamping=true;
const ring=new T.Mesh(new T.TorusGeometry(.84,.0015,6,100),new T.MeshBasicMaterial({color:0x2b6985}));ring.position.copy(preview.position);scene.add(ring);
const targets=[];for(let i=0;i<5;i++){const target=new T.Mesh(new T.TorusGeometry(.24,.008,6,48),new T.MeshBasicMaterial({color:0x267ca2}));target.position.set((i-2)*1.2,1.4,-5-Math.abs(i-2));scene.add(target);targets.push(target)}
const particles=[];let shots=0,last=0,session=null,turn=0;
function shoot(origin,direction){
  if(particles.length>=8){const oldest=particles.shift();scene.remove(oldest.mesh);oldest.trail.dispose()}
  const mesh=coinTemplate.clone(true);mesh.position.copy(origin);mesh.children.at(-1).visible=false;scene.add(mesh);
  const trail=new Lightning(scene,origin,direction);
  particles.push({mesh,trail,origin:origin.clone(),velocity:direction.clone().normalize().multiplyScalar(22),age:0});
  $('#shots').textContent=String(++shots).padStart(3,'0');status('已发射 · 扣回拇指重新装填');
}
function demo(){if(session)return;shoot(preview.position.clone(),new T.Vector3(-.4,.2,-1));turn+=Math.PI*2}$('#demo').onclick=demo;window.addEventListener('keydown',e=>{if(e.code==='Space'&& !['INPUT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();demo()}});$('#flip').onclick=()=>turn+=Math.PI;
const handStates=new Map(),jointGeo=new T.SphereGeometry(1,6,4),jointMat=new T.MeshBasicMaterial({color:0x79d7ff});
function getState(source){if(!handStates.has(source)){const held=coinTemplate.clone(true);held.visible=false;scene.add(held);const dots=new T.InstancedMesh(jointGeo,jointMat,25);dots.instanceMatrix.setUsage(T.DynamicDrawUsage);dots.frustumCulled=false;scene.add(dots);handStates.set(source,{gesture:new FlickGesture(),held,dots})}return handStates.get(source)}
function clearHands(){for(const s of handStates.values()){scene.remove(s.held,s.dots);s.dots.dispose()}handStates.clear()}
function updateHands(frame,time){const reference=renderer.xr.getReferenceSpace();const active=new Set();for(const source of session.inputSources){if(!source.hand)continue;active.add(source);const state=getState(source),j={};let n=0;const matrix=new T.Matrix4();for(const [name,joint]of source.hand){const pose=frame.getJointPose(joint,reference);if(pose){const p=pose.transform.position;j[name]=new T.Vector3(p.x,p.y,p.z);matrix.makeScale(pose.radius||.006,pose.radius||.006,pose.radius||.006);matrix.setPosition(j[name]);state.dots.setMatrixAt(n++,matrix)}}state.dots.count=n;state.dots.instanceMatrix.needsUpdate=true;
const keys=['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip','index-finger-phalanx-intermediate','index-finger-phalanx-proximal','pinky-finger-phalanx-proximal','middle-finger-phalanx-proximal','middle-finger-tip','ring-finger-tip','pinky-finger-tip'];if(keys.some(k=>!j[k])){state.held.visible=false;state.gesture.reset();continue}
const wrist=j.wrist,thumb=j['thumb-tip'],middle=j['middle-finger-phalanx-proximal'];const scale=middle.distanceTo(wrist);if(scale<.025){state.gesture.reset();state.held.visible=false;continue}
const forward=middle.clone().sub(wrist).normalize(),side=j['index-finger-phalanx-proximal'].clone().sub(j['pinky-finger-phalanx-proximal']).normalize(),normal=new T.Vector3().crossVectors(side,forward).normalize();side.crossVectors(forward,normal).normalize();
const rel=thumb.clone().sub(wrist),radial=rel.dot(side)/scale;
const proximal=j['thumb-phalanx-proximal'],distal=j['thumb-phalanx-distal'];
const thumbBase=distal.clone().sub(proximal).normalize(),thumbEnd=thumb.clone().sub(distal).normalize();
const distance=thumb.distanceTo(j['index-finger-phalanx-intermediate'])/scale;
const relaxed=['middle','ring','pinky'].filter(f=>j[f+'-finger-tip'].distanceTo(wrist)<scale*1.9).length>=2;
const sensitivity=Number($('#sensitivity').value);
const thumbUp=thumbBase.dot(thumbEnd)>.7&&thumb.clone().sub(proximal).normalize().dot(side)>.35&&distance>(.65+sensitivity*.15);
const loadPose=relaxed&&distance<.72&&!thumbUp;
const fired=state.gesture.update({time,loadPose,thumbUp,radial});
// Coin stands on its rim, one radius above the thumb, as in the reference pose.
state.held.position.copy(thumb).addScaledVector(side,COIN_RADIUS+.002);
const coinX=new T.Vector3().crossVectors(side,forward).normalize();
state.held.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(coinX,side,forward));
state.held.visible=state.gesture.state==='armed';
if(fired)shoot(state.held.position,forward);
if(state.held.visible)status('硬币就绪 · 竖起拇指发射');
}

for(const [source,s]of handStates){if(!active.has(source)){s.held.visible=false;s.dots.count=0;s.gesture.reset()}}}
async function enter(mode){let next;$('#enter').disabled=true;$('#ar').disabled=true;try{next=await navigator.xr.requestSession(mode,{requiredFeatures:['hand-tracking'],optionalFeatures:['local-floor']});session=next;next.addEventListener('end',()=>{session=null;clearHands();preview.visible=ring.visible=grid.visible=true;renderer.setClearColor(0x050c14,1);scene.fog=new T.FogExp2(0x050c14,.035);$('main').style.display='';$('#enter').disabled=false;$('#ar').disabled=false;status('实验已结束')},{once:true});await renderer.xr.setSession(next);preview.visible=ring.visible=false;grid.visible=mode!=='immersive-ar';renderer.setClearColor(0x050c14,mode==='immersive-ar'?0:1);scene.fog=mode==='immersive-ar'?null:new T.FogExp2(0x050c14,.035);$('main').style.display='none'}catch(e){if(next)await next.end().catch(()=>{});session=null;$('#support').textContent=`无法进入：${e.message}。请启用并允许手部追踪。`;$('#enter').disabled=false;$('#ar').disabled=false}}
$('#enter').onclick=()=>enter('immersive-vr');$('#ar').onclick=()=>enter('immersive-ar');
async function check(){if(!isSecureContext||!navigator.xr){$('#enter').disabled=true;$('#support').textContent='桌面可预览；头显请通过 HTTPS 打开并启用手部追踪。';return}try{const vr=await navigator.xr.isSessionSupported('immersive-vr'),ar=await navigator.xr.isSessionSupported('immersive-ar');$('#enter').disabled=!vr;$('#ar').hidden=!ar;$('#support').textContent=vr?'已检测到 WebXR · 进入后请允许手部追踪':'当前浏览器不支持沉浸模式，可使用桌面预览'}catch(e){$('#support').textContent=e.message}}check();
renderer.setAnimationLoop((ms,frame)=>{const time=ms/1000,dt=Math.min(time-last,.04);last=time;const charge=chargeGeometry.attributes.position;for(let k=0;k<charge.count;k++){const angle=k/(charge.count-1)*Math.PI*2;const radius=COIN_RADIUS+.003+(Math.random()-.5)*.003;charge.setXYZ(k,Math.cos(angle)*radius,Math.sin(angle)*radius,.002+(Math.random()-.5)*.002)}charge.needsUpdate=true;chargeGeometry.computeBoundingSphere();if(frame&&session)updateHands(frame,time);else{controls.update();preview.rotation.y+=((turn-.5)-preview.rotation.y)*.06;preview.position.y=1.5+Math.sin(time)*.025;ring.rotation.z=time*.05}for(let i=particles.length-1;i>=0;i--){
  const p=particles[i];p.age+=dt;p.mesh.position.copy(p.origin).addScaledVector(p.velocity,p.age);p.mesh.rotation.x+=dt*26;p.mesh.visible=p.age<18/22;p.trail.update(p.age);
  for(const target of targets){if(target.position.distanceTo(p.mesh.position)<.35)target.material.color.setHex(0xc8f6ff)}
  if(p.age>LIGHTNING_LIFETIME){scene.remove(p.mesh);p.trail.dispose();particles.splice(i,1)}
}
renderer.render(scene,camera)});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
const download=document.createElement('a');download.textContent='硬币 GLB';download.href=COIN_MODEL_URL;download.download='railgun-coin.glb';download.style.cssText='font-size:10px;color:#779dad;margin-left:12px';$('footer').append(download);
