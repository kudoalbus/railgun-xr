// Pose transition, not speed. Other fingers may relax after loading.
export class FlickGesture {
  constructor(){this.reset()}
  reset(){this.state='idle';this.since=0;this.upSince=null;this.cooldown=0;this.lastTime=null;this.loadedRadial=0}
  update({time,loadPose,thumbUp,radial=0}){
    if(this.lastTime!==null&&(time-this.lastTime>.15||time<this.lastTime))this.reset();
    this.lastTime=time;
    if(time<this.cooldown)return false;
    if(this.state==='idle'){if(loadPose&&!thumbUp){this.state='holding';this.since=time}}
    else if(this.state==='holding'){if(!loadPose||thumbUp)this.state='idle';else if(time-this.since>=.18){this.state='armed';this.loadedRadial=radial}}
    else if(this.state==='armed'){
      if(thumbUp&&radial-this.loadedRadial>.18){
        this.upSince??=time;
        if(time-this.upSince>=.045){this.state='idle';this.cooldown=time+.6;this.upSince=null;return true}
      }else this.upSince=null;
    }
    return false;
  }
}
