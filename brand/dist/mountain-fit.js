import {placeGraphPoint} from './layer-transforms.js';
// Keep preset 21's topology and native renderer, but register its vertices to
// the actual transparent mountain silhouette rather than an unrelated box.
export function createMountainFit(image){
  const sample=document.createElement('canvas');sample.width=1040;sample.height=Math.round(image.naturalHeight/image.naturalWidth*sample.width);
  const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,sample.width,sample.height);
  const pixels=ctx.getImageData(0,0,sample.width,sample.height).data,roof=new Float32Array(sample.width).fill(sample.height);
  let left=sample.width-1,right=0,bottom=0,peakX=0,peakY=sample.height;
  // Dither marks peak around alpha 178, so a visible pixel counts as the silhouette.
  for(let x=0;x<sample.width;x++)for(let y=0;y<sample.height;y++)if(pixels[(y*sample.width+x)*4+3]>=128){roof[x]=Math.min(roof[x],y);left=Math.min(left,x);right=Math.max(right,x);bottom=Math.max(bottom,y);if(y<peakY){peakY=y;peakX=x}}
  if(right<left){left=0;right=sample.width-1;bottom=sample.height-1;peakX=sample.width>>1;peakY=Math.round(sample.height*.28);roof.fill(peakY)}
  const p=window.Mountain.presets[20],modelPeak=p.points.reduce((a,b)=>b[1]>a[1]?b:a)[0];
  const modelRoof=x=>{for(let i=1;i<p.ridge;i++){const[a,ay]=p.points[i-1],[b,by]=p.points[i];if(x>=a&&x<=b)return ay+(by-ay)*(x-a)/(b-a)}return .025};
  return function map(graph,settings,time,w,h,frame,pointer,imageMotion){
    const canonical={...settings,width:100,height:100},l=window.Mountain.layout(1000,1000,canonical),positions=window.Mountain.project(graph.points,canonical,1000,1000,time*settings.speed),outputLayout=window.Mountain.layout(w,h,settings);
    const sourceScale=Math.max(frame.width/image.naturalWidth,frame.height/image.naturalHeight),sx=image.naturalWidth/sample.width*sourceScale,sy=image.naturalHeight/sample.height*sourceScale;
    const ox=(frame.width-image.naturalWidth*sourceScale)/2,oy=(frame.height-image.naturalHeight*sourceScale)/2;
    const baseline=frame.top+oy+bottom*sy,center=frame.left+ox+peakX*sx,phase=time/18*Math.PI*2;
    return{...graph,points:positions.map(q=>{
      let x=(q.x-l.cx)/l.sx,y=(l.base-q.y)/l.sy;x=Math.max(-1,Math.min(1,x*settings.width/100));
      const px=x<=modelPeak?left+(peakX-left)*(x+1)/(modelPeak+1):peakX+(right-peakX)*(x-modelPeak)/(1-modelPeak),column=Math.max(left,Math.min(right,Math.round(px)));
      const fraction=Math.max(0,Math.min(1,(y-.025)/Math.max(.001,modelRoof(x)-.025)))*settings.height/100;
      const py=bottom-fraction*(bottom-Math.min(bottom,roof[column])),v=(oy+py*sy)/frame.height,weight=Math.sin(Math.PI*v),amount=imageMotion/35;
      let targetX=frame.left+ox+px*sx+(Math.sin(phase+v*5)*2.8+pointer.x*4)*frame.ratio*weight*amount;
      let targetY=frame.top+oy+py*sy+Math.sin(phase+v*3)*1.4*frame.ratio*weight*amount;
      const placed=placeGraphPoint({x:targetX,y:targetY},{x:center,y:baseline},frame,w,h);targetX=placed.x;targetY=placed.y;
      return{x:(targetX-outputLayout.cx)/outputLayout.sx,y:(outputLayout.base-targetY)/outputLayout.sy};
    })};
  };
}
