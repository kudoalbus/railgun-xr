// Positions are transformed into a palm-relative basis before velocity estimation.
export class FlickGesture {
  constructor(){this.reset()}
  reset(){this.state='idle';this.since=0;this.previous=null;this.cooldown=0}
  update({time,closed,contact,relative,threshold=.5}){
    const previous=this.previous;this.previous={time,relative};
    if(time<this.cooldown)return false;
    if(this.state==='idle'){if(closed&&contact){this.state='holding';this.since=time}}
    else if(this.state==='holding'){if(!closed||!contact)this.state='idle';else if(time-this.since>.22)this.state='armed'}
    else if(this.state==='armed'){
      const dt=previous?time-previous.time:0;
      const velocity=dt>.005&&dt<.1?(relative[1]-previous.relative[1])/dt:0;
      if(closed&&!contact&&velocity>threshold){this.state='idle';this.cooldown=time+.65;return true}
      if(!closed){this.state='idle'}
    }
    return false;
  }
}
