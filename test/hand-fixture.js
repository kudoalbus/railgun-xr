import {Vector3} from 'three';
export function sampleHand(curled=false){
  const j={wrist:new Vector3()};
  [[.025,.018,0],[.04,.037,0],[.06,.055,0],[.075,.065,0]].forEach((p,i)=>j[['thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'][i]]=new Vector3(...p));
  ['index','middle','ring','pinky'].forEach((f,i)=>{
    const x=[.026,.009,-.009,-.027][i],y=[.069,.079,.075,.061][i],length=[.068,.073,.067,.054][i];
    ['proximal','intermediate','distal','tip'].forEach((part,k)=>{
      const along=curled?[0,.38,.15,-.12][k]:[0,.45,.76,1][k];
      j[`${f}-finger-${part==='tip'?'tip':'phalanx-'+part}`]=new Vector3(x,y+length*along,curled?[0,.012,.033,.038][k]:0);
    });
  });return j;
}
