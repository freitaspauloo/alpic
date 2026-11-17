import {setup,render} from './figma-dither.js';

// Background loading must not delay the interactive product demos.
(async()=>{

// Original Figma scene images and authored Dither shader. The existing image-
// texture adapter is used with the same Bayer / eight-level settings as Figma.
const assets=['alpine-peak.png','alpine-lift.png','alpine-lodge.png'];
const images=await Promise.all(assets.map(async name=>{const image=new Image();image.src=new URL('./assets/'+name,import.meta.url).href;await image.decode();return image}));
let device;
try{device=await(await navigator.gpu?.requestAdapter())?.requestDevice()}catch{}
const params={algorithm:'Bayer 16x16',monoColor:{r:1,g:1,b:1,a:1},contrast:1,levels:8,mono:false,brightness:100,pixelSize:8};
const scenes=[...document.querySelectorAll('.preview-scene')].map((scene,index)=>{
  const canvas=scene.querySelector('canvas'),source=document.createElement('canvas');
  const field={scene,index,canvas,source,image:images[index],visible:false,width:0,height:0,state:{}};
  canvas.dataset.source=assets[index];
  if(device){field.gpu=canvas.getContext('webgpu');field.gpu.configure({device,format:navigator.gpu.getPreferredCanvasFormat(),alphaMode:'premultiplied'});setup(device,{state:field.state})}
  else{field.output=canvas.getContext('2d');field.sample=document.createElement('canvas')}
  return field;
});
function bayer(x,y){let value=0;for(let n=1;n<=8;n*=2){const a=Math.floor(x/n)%2,b=Math.floor(y/n)%2;value=value*4+[[0,2],[3,1]][b][a]}return(value+.5)/256}
function draw(field){
  const {canvas,source,image,width,height}=field;if(!width||!height)return;
  const ctx=source.getContext('2d'),scale=Math.max(source.width/image.naturalWidth,source.height/image.naturalHeight);
  const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale,positions=[.45,.4,.65];
  ctx.clearRect(0,0,source.width,source.height);ctx.drawImage(image,(source.width-iw)*positions[field.index],(source.height-ih)*.5,iw,ih);
  const pixelSize=8*width/2944;
  if(device){
    device.queue.copyExternalImageToTexture({source},{texture:field.input,premultipliedAlpha:true},[source.width,source.height]);
    render(device,{state:field.state,input:field.input,output:field.gpu.getCurrentTexture(),params:{...params,pixelSize},renderScale:field.ratio});
  }else{
    const size=pixelSize*field.ratio,w=Math.ceil(source.width/size),h=Math.ceil(source.height/size),sample=field.sample;
    sample.width=w;sample.height=h;const small=sample.getContext('2d',{willReadFrequently:true});small.drawImage(source,0,0,w,h);
    const data=small.getImageData(0,0,w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4,t=bayer(x%16,y%16);for(let c=0;c<3;c++)data.data[i+c]=Math.max(0,Math.min(7,Math.round(data.data[i+c]/255*7+t-.5)))/7*255;
    }
    small.putImageData(data,0,0);field.output.clearRect(0,0,canvas.width,canvas.height);field.output.imageSmoothingEnabled=false;field.output.drawImage(sample,0,0,canvas.width,canvas.height);
  }
  canvas.dataset.rendered='true';
}
const resize=new ResizeObserver(entries=>entries.forEach(entry=>{
  const field=scenes.find(field=>field.scene===entry.target);field.width=field.scene.clientWidth;field.height=field.scene.clientHeight;field.ratio=Math.min(devicePixelRatio||1,1.5);
  field.canvas.width=field.source.width=Math.round(field.width*field.ratio);field.canvas.height=field.source.height=Math.round(field.height*field.ratio);
  field.input?.destroy();if(device)field.input=device.createTexture({size:[field.source.width,field.source.height],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
  draw(field);
}));
scenes.forEach(field=>resize.observe(field.scene));

})().catch(error=>console.error('Alpine scene backgrounds failed to load',error));
