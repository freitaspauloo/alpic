import {setup,render} from './figma-dither.js';
import {createHeroControls,loadStudioSettings} from './hero-controls.js?rev=erica5';
import {createMountainFit} from './mountain-fit.js';
import {imageMatrix,placeGraphPoint} from './layer-transforms.js';
import {dashShuffleCanvas} from './dash-shuffle.js';
import './prototype/templates.js';
import './prototype/editions.js';
import './prototype/spatial.js';
import './prototype/engine.js';
const prototypeRecipe=await (await fetch(new URL('./prototype/grand-alpine.json',import.meta.url))).json();
let prototypeGraph=window.Mountain.shape(prototypeRecipe);

// Original Figma compute shader, with an image-texture adapter rather than a
// dependency on the experimental HTML-in-Canvas capture API.
const params={algorithm:'Bayer 16x16',monoColor:{r:1,g:1,b:1,a:1},contrast:1,levels:3,mono:false,brightness:100,pixelSize:6};
const TAU=Math.PI*2,hero=document.querySelector('.hero-art'),image=hero.querySelector('.mountain-source');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let device;
try{device=await (await navigator.gpu?.requestAdapter())?.requestDevice()}catch{}
const bayer=(x,y)=>{let value=0;for(let n=1;n<=8;n*=2){const a=Math.floor(x/n)%2,b=Math.floor(y/n)%2;value=value*4+[[0,2],[3,1]][b][a]}return(value+.5)/256};

class DitherSurface{
  constructor(canvas,cell){this.canvas=canvas;this.cell=cell;this.source=document.createElement('canvas');this.ctx=this.source.getContext('2d');this.state={};
    if(device){this.gpu=canvas.getContext('webgpu');this.gpu.configure({device,format:navigator.gpu.getPreferredCanvasFormat(),alphaMode:'premultiplied'});setup(device,{state:this.state})}
    else{this.output=canvas.getContext('2d');this.small=document.createElement('canvas');this.smallCtx=this.small.getContext('2d',{willReadFrequently:true})}
  }
  resize(w,h,ratio){this.ratio=ratio;this.canvas.width=this.source.width=w;this.canvas.height=this.source.height=h;
    this.input?.destroy();if(device)this.input=device.createTexture({size:[w,h],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
  }
  present(){
    const pixelSize=this.cell*this.designScale*this.ratio;
    if(device){device.queue.copyExternalImageToTexture({source:this.source},{texture:this.input,premultipliedAlpha:true},[this.source.width,this.source.height]);render(device,{state:this.state,input:this.input,output:this.gpu.getCurrentTexture(),params:{...params,pixelSize:this.cell*this.designScale},renderScale:this.ratio})}
    else{
      const w=Math.ceil(this.source.width/pixelSize),h=Math.ceil(this.source.height/pixelSize);this.small.width=w;this.small.height=h;this.smallCtx.drawImage(this.source,0,0,w,h);const data=this.smallCtx.getImageData(0,0,w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,t=bayer(x%16,y%16),levels=params.levels-1;for(let c=0;c<3;c++){const value=Math.max(0,Math.min(1,(data.data[i+c]/255-.5)*params.contrast+.5+(params.brightness-100)/200));data.data[i+c]=Math.max(0,Math.min(levels,Math.round(value*levels+t-.5)))/levels*255}}
      this.smallCtx.putImageData(data,0,0);this.output.clearRect(0,0,this.canvas.width,this.canvas.height);this.output.imageSmoothingEnabled=false;this.output.drawImage(this.small,0,0,this.canvas.width,this.canvas.height);
    }
  }
}

await image.decode();
let fitMountain=createMountainFit(image);let mountainFrame;
const foreground=document.createElement('canvas');foreground.className='mountain-source animated-source';foreground.setAttribute('aria-hidden','true');image.after(foreground);
const background=document.createElement('canvas');background.className='animated-background';background.setAttribute('aria-hidden','true');hero.prepend(background);
const network=document.createElement('canvas');network.className='animated-network';network.setAttribute('aria-hidden','true');hero.append(network);
const toggle=document.createElement('button');toggle.className='art-motion';toggle.type='button';
const front=new DitherSurface(foreground,6),back=new DitherSurface(background,8);
let width=0,height=0,ratio=1,time=0,last=0,visible=true,playing=!reduced.matches,pointer={x:0,y:0},target={x:0,y:0},arrangedAt=0;
const publishedMountain=await loadStudioSettings('mountain');
const controls=createHeroControls(hero,prototypeRecipe,state=>{configuration=state;syncTraces();prototypeGraph=window.Mountain.shape(state.graph);controls.updateCount(prototypeGraph);const plate=state.plate||'DITHER',texture=!!state.texture,key=plate+':'+texture;if(key===appliedPlate)resize();else if(plates[plateIndex][0]===plate){textureTouched=true;textureOn=texture;syncTexture();appliedPlate=key;resize()}else restorePlate()},{published:publishedMountain,settingsId:'mountain'});
let configuration=controls.state;prototypeGraph=window.Mountain.shape(configuration.graph);controls.updateCount(prototypeGraph);
controls.pause.addEventListener('click',()=>toggle.click());
function syncToggle(){toggle.textContent=playing?'Ⅱ PAUSE MOTION':'▷ PLAY MOTION';toggle.setAttribute('aria-label',playing?'Pause mountain animation':'Play mountain animation');toggle.setAttribute('aria-pressed',String(playing));controls.pause.textContent=playing?'Ⅱ Pause Motion':'▷ Play Motion';controls.pause.setAttribute('aria-label',playing?'Pause mountain animation':'Play mountain animation');controls.pause.setAttribute('aria-pressed',String(playing))}
toggle.addEventListener('click',()=>{playing=!playing;syncToggle();draw(time)});reduced.addEventListener('change',()=>{playing=!reduced.matches;syncToggle();draw(time)});syncToggle();
hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();target={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5}});hero.addEventListener('pointerleave',()=>target={x:0,y:0});
function cover(c,img,w,h){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight),iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;c.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih)}
function resize(){const r=hero.getBoundingClientRect(),f=image.getBoundingClientRect();width=r.width;height=r.height;ratio=Math.min(devicePixelRatio||1,1.5);front.designScale=back.designScale=width/1759;
  Object.assign(params,{levels:configuration.levels,brightness:configuration.brightness,contrast:configuration.contrast});front.cell=configuration.pixelSize;
  front.resize(Math.round(f.width*ratio),Math.round(f.height*ratio),ratio);back.resize(Math.round(width*ratio),Math.round(height*ratio),ratio);const plateW=Math.round(width*ratio),plateH=Math.round(height*ratio);network.width=plateW;network.height=plateH;if(squareCanvas.width!==plateW||squareCanvas.height!==plateH){squareCanvas.width=plateW;squareCanvas.height=plateH;squareGrid=null}squareStep=-1;paintSquare();
  mountainFrame={left:(f.left-r.left)*ratio,top:(f.top-r.top)*ratio,width:front.source.width,height:front.source.height,ratio,scaleX:configuration.scaleX*configuration.graphScale/100,scaleY:configuration.scaleY*configuration.graphScale/100,rotation:configuration.graphRotation,offsetX:configuration.offsetX,offsetY:configuration.offsetY};
  const imageScale=configuration.imageScale/100,angle=configuration.imageRotation;
  const placed='translate('+(width*configuration.imageOffsetX/100)+'px,'+(height*configuration.imageOffsetY/100)+'px) rotate('+angle+'deg) scale('+(imageScale*configuration.imageWidth/100)+','+(imageScale*configuration.imageHeight/100)+')';
  foreground.style.transformOrigin=image.style.transformOrigin='50% 100%';foreground.style.transform=image.style.transform=placed;
  mountainFrame.imageMatrix=configuration.followImage?imageMatrix(mountainFrame,configuration,network.width,network.height):null;
  paintBackground();draw(time);
}
function paintBackground(){
  const c=back.ctx;c.clearRect(0,0,back.source.width,back.source.height);
  if(!textureOn||!liveImage.naturalWidth){back.present();return}
  c.save();c.globalAlpha=configuration.backgroundOpacity/100;const sw=width*3.131*ratio,sh=height*3.195*ratio;c.drawImage(liveImage,-width*1.085*ratio+sw*.0243,-height*1.497*ratio,sw*.9513,sh*.943);c.restore();back.present();
}
const squareCanvas=document.createElement('canvas');squareCanvas.className='square-plate';squareCanvas.setAttribute('aria-hidden','true');hero.append(squareCanvas);
const squareSource=new Image();let squareFit,squarePeak=.2;
function measurePeak(){const w=480,h=Math.max(1,Math.round(squareSource.naturalHeight/squareSource.naturalWidth*w)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(squareSource,0,0,w,h);const data=g.getImageData(0,0,w,h).data;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=128)return y/h;return .2}
squareSource.onload=()=>{squarePeak=measurePeak();squareFit=createMountainFit(squareSource);squareGrid=null;squareStep=-1;if(width){paintSquare();draw(time)}};squareSource.src='assets/hero-mountains/photo.png';
const BAYER8=[0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
const bayer8=(c,r)=>(BAYER8[(r&7)*8+(c&7)]+.5)/64;
const squareTone=name=>getComputedStyle(document.documentElement).getPropertyValue('--alpic-'+name).trim();
const squareRamp=['midnight-950','midnight-700','midnight-300','ice','berry-600','berry-500','berry-50','white'].map(squareTone);
const silverRamp=['#161616','#3c3c3c','#6a6a6a','#9a9a9a','#c8c8c8','#e8e8e8','#f7f7f7'];
const squareScatter=(c,r)=>{const f=n=>n-Math.floor(n);return f(52.9829189*f(.06711056*c+.00583715*r))};
let squareGrid,squareStep=-1,squareMixed=-1,squareSat=-1;
function saturateColor(color,amount){const hex=color.trim(),n=parseInt(hex.slice(hex[0]==='#'?1:0),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255,y=.2126*r+.7152*g+.0722*b,mix=c=>Math.max(0,Math.min(255,Math.round(y+(c-y)*amount)));return `rgb(${mix(r)},${mix(g)},${mix(b)})`}
function squareField(){
  const unit=Math.max(1,Math.round((configuration.pixelSize||6)*ratio)),cols=Math.ceil(squareCanvas.width/unit),rows=Math.ceil(squareCanvas.height/unit);
  const lift=configuration.scaleY*(configuration.graphScale||100)/10000;
  if(squareGrid&&squareGrid.cols===cols&&squareGrid.rows===rows&&squareGrid.unit===unit&&squareGrid.lift===lift)return squareGrid;
  const scale=cols/squareSource.naturalWidth*1.08,dw=squareSource.naturalWidth*scale,dh=squareSource.naturalHeight*scale,x=(cols-dw)*.5;
  let y=rows-dh+dh*.06;
  const node=Math.max(8,(configuration.graph.dot||6)*lift*squareCanvas.width/1000);
  const rise=Math.min(squareCanvas.height*.2,Math.max(0,lift-1)*(1-squarePeak)*dh*unit);
  const peakPx=(y+squarePeak*dh)*unit;
  if(peakPx<rise+node*1.5)y+=(rise+node*1.5-peakPx)/unit;
  const probe=document.createElement('canvas');probe.width=cols;probe.height=rows;
  const reader=probe.getContext('2d',{willReadFrequently:true});
  reader.drawImage(squareSource,x,y,dw,dh);
  const data=reader.getImageData(0,0,cols,rows).data;
  const lights=[];for(let i=0;i<data.length;i+=4)if(data[i+3]>=128)lights.push((.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255);
  lights.sort((a,b)=>a-b);
  const at=share=>lights[Math.floor((lights.length-1)*share)]??.5;
  squareStep=-1;
  return squareGrid={cols,rows,unit,lift,data,low:at(.05),middle:at(.5),high:at(.95),left:x*unit,top:y*unit,width:dw*unit,height:dh*unit};
}
function squareMountainFrame(){
  const field=squareField();
  return {left:field.left,top:field.top,width:field.width,height:field.height,ratio,scaleX:configuration.scaleX*configuration.graphScale/100,scaleY:configuration.scaleY*configuration.graphScale/100,rotation:configuration.graphRotation,offsetX:configuration.offsetX,offsetY:configuration.offsetY,imageMatrix:null};
}
function paintSquare(){
  if(!hero.classList.contains('square-mountain')||!squareSource.naturalWidth||!squareCanvas.width)return;
  const {cols,rows,unit,data,low,middle,high}=squareField();
  const turn=(time+9)%18/18,step=playing?Math.round((1-Math.cos(turn*TAU))/2*60):60,mixed=configuration.mixed?1:0,sat=(configuration.saturation??100)/100;
  if(step===squareStep&&mixed===squareMixed&&sat===squareSat)return;
  squareStep=step;squareMixed=mixed;squareSat=sat;
  const density=.1+.9*step/60,ctx=squareCanvas.getContext('2d'),ramp=(hero.classList.contains('silver-mountain')?silverRamp:squareRamp).map(color=>saturateColor(color,sat)),top=ramp.length-1;
  ctx.clearRect(0,0,squareCanvas.width,squareCanvas.height);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const i=(r*cols+c)*4;if(data[i+3]<128||squareScatter(c,r)>=density)continue;
    const light=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/255;
    const balanced=light<middle?.05+.45*(light-low)/Math.max(.01,middle-low):.5+.45*(light-middle)/Math.max(.01,high-middle);
    let level=balanced*top,band=Math.floor(level);if(level-band>bayer8(c,r))band++;
    const span=mixed?Math.max(1,Math.round(unit*(.4+light*1.8))):unit;
    ctx.fillStyle=ramp[Math.min(band,top)];ctx.fillRect(c*unit+(unit-span)/2,r*unit+(unit-span)/2,span,span);
  }
}
function paintTraces(t){
  const graphCtx=network.getContext('2d');graphCtx.lineDashOffset=0;
  if(!configuration.traces){graphCtx.clearRect(0,0,network.width,network.height);return}
  const square=hero.classList.contains('square-mountain');
  if(!mountainFrame||(square&&!squareFit))return;
  const shuffle=configuration.graph.motionStyle==='dash-shuffle',graphSettings={...configuration.graph,motion:shuffle?false:configuration.graph.motion};
  let displayGraph;
  if(configuration.fitToMountain){displayGraph=(square?squareFit:fitMountain)(prototypeGraph,graphSettings,t,network.width,network.height,mountainFrame,pointer,square?0:configuration.imageMotion)}
  else{
    const l=window.Mountain.layout(network.width,network.height,graphSettings),points=window.Mountain.project(prototypeGraph.points,graphSettings,network.width,network.height,t*graphSettings.speed);
    displayGraph={...prototypeGraph,points:points.map(point=>{const p=placeGraphPoint(point,{x:network.width*.5,y:network.height*.8},mountainFrame,network.width,network.height);return{x:(p.x-l.cx)/l.sx,y:(l.base-p.y)/l.sy}})};
  }
  const graphFactor=configuration.graphScale/100,style={...graphSettings,motion:false,lineStyle:shuffle?'dashed':graphSettings.lineStyle,dot:graphSettings.dot*graphFactor,stroke:graphSettings.stroke*graphFactor,squareStroke:graphSettings.squareStroke*graphFactor};
  const canvas=shuffle?dashShuffleCanvas(network,t,style,configuration.dashLength,configuration.dashGap):network;
  window.Mountain.render(canvas,style,{transparent:true,graph:displayGraph});graphCtx.lineDashOffset=0;
}
function draw(t){
  if(!width)return;
  const square=hero.classList.contains('square-mountain');if(square){paintSquare();if(squareFit&&squareStep>=0)mountainFrame=squareMountainFrame()}
  if(!hero.classList.contains('plate-mode')){const phase=t/18*TAU,w=front.source.width,h=front.source.height,c=front.ctx;c.clearRect(0,0,w,h);
  // Coherent deformation of the actual mountain raster. The dithering stage
  // runs after deformation, so the artwork moves through a stable pixel grid.
  const motion=configuration.imageMotion/35;
  const source=image,scale=Math.max(w/source.naturalWidth,h/source.naturalHeight),iw=source.naturalWidth*scale,ih=source.naturalHeight*scale,ox=(w-iw)/2,oy=(h-ih)/2;
  for(let y=0;y<h;y+=3){const v=y/h,weight=Math.sin(Math.PI*v),dx=(Math.sin(phase+v*5)*2.8+pointer.x*4)*ratio*weight*motion,dy=Math.sin(phase+v*3)*1.4*ratio*weight*motion;const sy=(y-oy)/scale,sy1=Math.max(0,sy),sh=Math.min(source.naturalHeight-sy1,(3+Math.max(0,-sy)*scale)/scale);if(sh>0)c.drawImage(source,0,sy1,source.naturalWidth,sh,ox+dx,y+dy,iw,3.5)}
  front.present();}
  paintTraces(t);
}
new ResizeObserver(resize).observe(hero);new IntersectionObserver(([entry])=>{visible=entry.isIntersecting},{rootMargin:'100px'}).observe(hero);
function frame(now){requestAnimationFrame(frame);const delta=Math.min(100,now-last);if(delta<1000/24)return;last=now;if(!playing||!visible||document.hidden)return;time+=delta/1000;pointer.x+=(target.x-pointer.x)*.035;pointer.y+=(target.y-pointer.y)*.035;draw(time)}
const plates=[['SQUARES','square'],['SILVER','silver'],['EVEREST','assets/hero-mountains/everest.png'],['DITHER','assets/hero-mountains/dither.png'],['PHOTO','assets/hero-mountains/photo.png'],['IRIDESCENT','assets/hero-mountains/iridescent.png'],['SCANLINE','assets/hero-mountains/scanline.png'],['LINES','assets/hero-mountains/lines.png'],['BLOCKS','assets/hero-mountains/blocks.png'],['PIXELS','assets/hero-mountains/pixels.png'],['GLITCH','assets/hero-mountains/glitch.png'],['ANAGLYPH','assets/hero-mountains/anaglyph.png'],['LIVE',null]];
const liveImage=new Image();liveImage.src='assets/everest11.png';
let plateIndex=0,textureOn=false,textureTouched=false,appliedPlate='';
const plateLabel=hero.querySelector('[data-plate-label]');
const textureButton=document.createElement('button');textureButton.type='button';textureButton.className='hero-texture-toggle';textureButton.textContent='TEXTURE';
const traceButton=document.createElement('button');traceButton.type='button';traceButton.className='hero-texture-toggle';traceButton.textContent='TRACE';
const plateSwitch=hero.querySelector('.hero-plate-switch');plateSwitch.append(traceButton);plateSwitch.append(textureButton);
function syncTraces(){const on=!!configuration.traces;hero.classList.toggle('traces-off',!on);traceButton.setAttribute('aria-pressed',String(on));traceButton.setAttribute('aria-label',on?'Hide the trace':'Show the trace')}
function syncTexture(){hero.classList.toggle('texture-off',!textureOn);hero.classList.toggle('texture-on',textureOn);textureButton.setAttribute('aria-pressed',String(textureOn));textureButton.setAttribute('aria-label',textureOn?'Hide background texture':'Show background texture')}
function rememberPlate(){configuration.plate=plates[plateIndex][0];configuration.texture=textureOn;appliedPlate=configuration.plate+':'+textureOn;controls.refresh()}
async function showPlate(index){plateIndex=(index+plates.length)%plates.length;const plate=plates[plateIndex],silver=plate[1]==='silver',square=plate[1]==='square'||silver,live=!plate[1];plateLabel.textContent=plate[0];hero.classList.toggle('square-mountain',square);hero.classList.toggle('silver-mountain',silver);hero.classList.toggle('plate-mode',square||!live);hero.classList.toggle('final-mountain',plate[0]==='EVEREST');if(!square){image.src=live?'assets/everest11.png':plate[1];await image.decode();if(live)await liveImage.decode();fitMountain=createMountainFit(image)}if(!textureTouched)textureOn=live;syncTexture();rememberPlate();resize()}
async function restorePlate(){const index=Math.max(0,plates.findIndex(plate=>plate[0]===(configuration.plate||'DITHER')));if(typeof configuration.texture==='boolean'){textureTouched=true;textureOn=configuration.texture}await showPlate(index)}
textureButton.addEventListener('click',()=>{textureTouched=true;controls.setTexture(!configuration.texture)});
traceButton.addEventListener('click',()=>controls.setTraces(!configuration.traces));
syncTraces();
hero.querySelectorAll('[data-plate-step]').forEach(button=>button.addEventListener('click',()=>showPlate(plateIndex+Number(button.getAttribute('data-plate-step')))));
await restorePlate();if(device)await device.queue.onSubmittedWorkDone();hero.dataset.animation='ready';hero.dataset.renderer=device?'original-figma-webgpu':'bayer16-canvas';hero.dataset.prototype='21';hero.dataset.graphPoints=String(prototypeGraph.active.length);hero.dataset.graphEdges=String(prototypeGraph.edges.length);requestAnimationFrame(frame);
