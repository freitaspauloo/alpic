import './prototype/templates.js';
import './prototype/editions.js';
import './prototype/spatial.js';
import './prototype/engine.js';
import {createHeroControls,loadStudioSettings} from './hero-controls.js?rev=erica5';
import {dashShuffleCanvas} from './dash-shuffle.js';

const stage=document.querySelector('.manifesto-stage');
const canvas=document.createElement('canvas'),surface=document.createElement('canvas');
canvas.className='manifesto-mountain';canvas.setAttribute('aria-hidden','true');stage.prepend(canvas);
const engine=window.Mountain,reduced=matchMedia('(prefers-reduced-motion: reduce)');
const preset=engine.presets.findIndex(preset=>preset.short==='Matterhorn');
const recipe={...engine.defaults(preset),height:100,width:92,density:38,detail:48,irregularity:18,lineColor:'#829b90',squareColor:'#829b90',lineOpacity:100,squareOpacity:100,stroke:1.05,squareStroke:1,dot:6,motion:!reduced.matches,speed:1,amplitude:48};
// Preserve the previous studio's styling and motion while upgrading the silhouette.
const storageKey='alpic-manifesto-studio-v2';
try{
  if(!localStorage.getItem(storageKey)){
    const previous=JSON.parse(localStorage.getItem('alpic-manifesto-studio-v1'));
    if(previous){
      previous.graph={...previous.graph,preset,height:100,width:92,density:38,detail:48,irregularity:18,seed:recipe.seed,offsets:{}};
      localStorage.setItem(storageKey,JSON.stringify(previous));
    }
  }
}catch{}
let configuration,visible=false,frame=0,elapsed=0,last=0,lastPaint=0;
const publishedBackground=await loadStudioSettings('background');
const controls=createHeroControls(stage,recipe,state=>{configuration=state;apply();sync()},{pixels:true,graphOnly:true,idPrefix:'manifesto',storageKey,graphDefaults:recipe,opacity:14,published:publishedBackground,settingsId:'background'});
configuration=controls.state;
function apply(){canvas.style.opacity=(configuration.opacity??14)/100}
const horn=[[-1,.025],[-.8,.10],[-.62,.25],[-.43,.35],[-.29,.59],[-.08,1],[.06,.90],[.2,.64],[.35,.49],[.55,.27],[.76,.12],[1,.025]];
const rasterStudy={density:78,detail:70,dot:4.6,irregularity:18,erosion:10,sizeVariation:70,height:94,width:94,amplitude:14,seed:17003+2*347};
function hash(a,b=0,seed=1){const x=Math.sin(a*127.1+b*311.7+seed*74.7)*43758.5453;return x-Math.floor(x)}
function roof(x){for(let i=1;i<horn.length;i++){const [a,ay]=horn[i-1],[b,by]=horn[i];if(x>=a&&x<=b)return ay+(by-ay)*(x-a)/(b-a)}return .025}
function alpineRaster(){
  const s=rasterStudy,points=[],clamp=n=>Math.max(0,Math.min(1,n)),seed=s.seed;
  const cols=Math.round(32+s.density*.82),rows=Math.round(16+s.detail*.40),erosion=s.erosion/100;
  const field=(x,y)=>{const top=roof(x),spine=-.07+.33*(1-y),snow=Math.exp(-(top-y)*18),fold=.5+.5*Math.sin(x*17+y*9+Math.sin(y*12)*.6);return clamp(.16+(x<spine?.40:.08)+snow*.35+Math.exp(-Math.abs(x-spine)*22)*.26+fold*s.detail/360)};
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    let x=-1+2*col/cols,y=.025+row/rows;
    const jitter=s.irregularity/100;x+=(hash(col,row,seed+1)-.5)*.022*jitter*.35;y+=(hash(col,row,seed+2)-.5)*.016*jitter*.35;
    const top=roof(x);if(y>top||x<-1||x>1||y<.015)continue;
    const f=field(x,y);if(hash(col,row,seed+3)>(.15+f*.88)*(1-erosion*.7))continue;
    points.push({x,y,size:.35+f*.9});
  }
  horn.forEach(([x,y])=>points.push({x,y,size:.72}));
  return points;
}
const rasterPoints=alpineRaster();
function draw(){
  if(!canvas.width||!canvas.height)return;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,s=rasterStudy,motion=configuration.graph.motion&&!reduced.matches;
  const l={cx:w*.5,base:h*.86,sx:w*.46*s.width/100,sy:h*.72*s.height/100},scale=w/1000,phase=elapsed/12*Math.PI*2,k=motion?1+Math.sin(phase)*.018*(s.amplitude/25):1;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#829b90';
  for(const p of rasterPoints){const size=s.dot*(1+(p.size-1)*s.sizeVariation/100)*scale;ctx.fillRect(l.cx+p.x*l.sx*k-size/2,l.base-p.y*l.sy*k-size/2,size,size)}
  canvas.dataset.animationTime=elapsed.toFixed(3);
}
function tick(now){
  frame=0;if(!visible||document.hidden||!configuration.graph.motion)return;
  if(last)elapsed+=Math.min((now-last)/1000,.1);last=now;
  if(now-lastPaint>80){draw();lastPaint=now}
  frame=requestAnimationFrame(tick);
}
function sync(){
  if(frame)cancelAnimationFrame(frame);frame=0;last=0;draw();
  if(visible&&!document.hidden&&configuration.graph.motion)frame=requestAnimationFrame(tick);
}
new ResizeObserver(()=>{
  const ratio=Math.min(devicePixelRatio||1,1.5);
  canvas.width=surface.width=Math.round(canvas.clientWidth*ratio);canvas.height=surface.height=Math.round(canvas.clientHeight*ratio);draw();
}).observe(canvas);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()}).observe(stage);
document.addEventListener('visibilitychange',sync);
reduced.addEventListener('change',()=>{if(reduced.matches&&configuration.graph.motion)controls.pause.click()});
apply();
