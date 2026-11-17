export function dashPhase(index,time,speed,amount,cycle){
  const seed=((index*0.61803398875)%1),phase=time*speed/12;
  return -cycle*(phase+seed+(amount/100)*Math.sin(Math.PI*2*(phase+seed)));
}
// Render the original edges individually through the prototype's renderer.
// Only dash phase changes; node positions and connectivity are preserved.
export function dashShuffleCanvas(canvas,time,settings,dashLength,dashGap){
  const ctx=canvas.getContext('2d'),scale=canvas.width/1000,dash=[dashLength*scale,dashGap*scale];let start,index=0;
  const proxy=new Proxy(ctx,{
    get(target,key){
      if(key==='moveTo')return(x,y)=>{start={x,y}};
      if(key==='lineTo')return(x,y)=>{target.beginPath();target.moveTo(start.x,start.y);target.lineTo(x,y);target.lineDashOffset=dashPhase(index++,time,settings.speed,settings.amplitude,dash[0]+dash[1]);target.stroke()};
      if(key==='stroke')return()=>{};
      if(key==='setLineDash')return values=>target.setLineDash(values.length?dash:[]);
      const value=target[key];return typeof value==='function'?value.bind(target):value;
    },set(target,key,value){target[key]=value;return true}
  });
  return{width:canvas.width,height:canvas.height,getContext:()=>proxy};
}
