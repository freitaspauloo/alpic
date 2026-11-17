/* Volume VII — ordered-dither mountains. Every mark sits on one strict pixel
   lattice; light decides which pixels are on, and motion only re-lights them. */
(() => {
  'use strict';
  const TAU=Math.PI*2,RAD=Math.PI/180;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t,ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
  const BAYER8=[0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
  const BAYER2=[0,2,3,1],LINES=[.2,.58,1.1];
  const fract=n=>n-Math.floor(n);
  const kernels={
    bayer:(c,r)=>(BAYER8[(r&7)*8+(c&7)]+.5)/64,
    grain:(c,r)=>fract(52.9829189*fract(.06711056*c+.00583715*r)),
    scan:(c,r)=>LINES[r%3],
    block:(c,r)=>(BAYER2[(r&1)*2+(c&1)]+.5)/4,
    halftone:()=>.07
  };
  // Facet bearings in degrees: a sun at SUN lights the left faces and leaves
  // the right faces in shadow; spurs hang one opposite wedge on each face.
  const SUN=158,SWING=150,LIT=150,SHADE=30,LIT_SPUR=122,SHADE_SPUR=58;
  const lambert=degrees=>Math.pow(.5+.5*Math.cos(degrees*RAD),1.5);

  // Peaks are listed back to front: [summit x, summit y, left foot, right foot,
  // left power, right power, ridge lean, spurs[[start, side, slope, spread]]].
  const massifs={
    horn:[
      [.40,.60,-.10,.98,1.4,1.45,.22,[[.7,-1,.5,.2]]],
      [-.06,1,-.82,.70,1.9,1.7,.30,[[.84,-1,.50,.20],[.60,1,.46,.20],[.50,-1,.95,.30],[.30,1,1.1,.34]]],
      [-.56,.37,-1,-.10,1.25,1.15,.34,[[.62,1,.6,.26]]],
      [.58,.30,.14,1,1.2,1.3,.30,[[.6,-1,.7,.3]]]
    ],
    spire:[
      [-.05,1,-.80,.88,1.85,1.6,.30,[[.84,-1,.50,.20],[.60,1,.46,.20]]],
      [-.56,.37,-1,-.10,1.25,1.15,.34,[[.62,1,.6,.26]]],
      [.58,.30,.14,1,1.2,1.3,.30,[[.6,-1,.7,.3]]]
    ],
    massif:[
      [.20,1,-.46,.96,1.7,1.5,.26,[[.82,-1,.56,.22],[.58,1,.5,.2],[.44,-1,1.0,.3]]],
      [-.44,.76,-.98,.12,1.5,1.7,.28,[[.74,-1,.6,.22],[.5,1,.5,.2]]],
      [.70,.44,.30,1,1.2,1.2,.26,[[.6,-1,.6,.26]]],
      [-.08,.40,-.62,.44,1.3,1.25,.34,[[.62,1,.6,.26],[.5,-1,.8,.3]]]
    ],
    range:[
      [-.12,1,-.68,.50,1.8,1.6,.24,[[.82,-1,.5,.2],[.56,1,.44,.18],[.4,-1,.9,.3]]],
      [.46,.78,.00,.98,1.5,1.5,.22,[[.74,-1,.56,.22],[.5,1,.5,.2]]],
      [-.62,.56,-1,-.14,1.3,1.4,.26,[[.7,-1,.6,.24],[.5,1,.5,.2]]],
      [.16,.40,-.34,.64,1.2,1.2,.30,[[.6,1,.6,.28]]],
      [-.34,.30,-.80,.08,1.15,1.2,.30,[[.6,-1,.7,.3]]]
    ],
    twins:[
      [.30,1,-.30,.94,1.75,1.55,.24,[[.82,-1,.5,.2],[.56,1,.46,.2]]],
      [-.32,.84,-.94,.26,1.5,1.75,.26,[[.78,-1,.56,.22],[.52,1,.5,.2]]],
      [.02,.36,-.46,.52,1.2,1.2,.30,[[.6,1,.6,.28]]]
    ]
  };
  const studies=[
    ['Ordered Horn','Ordered Horn','ORD','bayer','horn',80,62,8.4,'One summit, lit from the left. An 8 × 8 ordered matrix turns every facet into a clean tone.','ORDERED DITHER',{}],
    ['Grain Massif','Grain Massif','GRN','grain','massif',100,70,10,'A solid massif in fine film grain. The pixels touch, so the faces read as light.','FINE GRAIN',{cols:[56,.72]}],
    ['Scanline Range','Scanline Range','SCN','scan','range',86,56,8.8,'Three peaks drawn in horizontal lines that thicken where the snow catches the sun.','SCANLINE',{irregularity:0}],
    ['Halftone Twins','Halftone Twins','HLF','halftone','twins',58,60,9.2,'Every cell holds a square; its size carries the light, like print seen up close.','HALFTONE',{cols:[36,.5],sizeVariation:100,fps:16}],
    ['Pixel Icon','Pixel Icon','ICN','block','spire',40,40,10,'The whole mountain in a few hundred chunky pixels and five flat tones.','LOW-RES',{cols:[24,.44],erosion:6,irregularity:8,contrast:2}],
    ['Backlit Ridge','Backlit Ridge','BKL','bayer','massif',88,58,8.4,'The sun sits behind the range: a dark silhouette against a dithered glow.','BACKLIT',{backlit:true,scale:.68,erosion:8,sun:[.2,.92,.21]}]
  ];
  studies.forEach(([name,short,code,mode,massif,density,detail,dot,description,technique,extra],i)=>window.AlpicTemplates.push({
    name,short,code,mode,massif,family:'Dither',category:'Field',density,detail,dot,description,technique,
    points:[[-1,.025],[0,1],[1,.025]],ridge:3,connections:[],height:100,width:100,cols:extra.cols||[48,.6],fps:extra.fps||12,
    backlit:!!extra.backlit,contrast:extra.contrast||1,exposure:extra.exposure||1,sun:extra.sun||null,scale:extra.scale||1,irregularity:extra.irregularity??12,erosion:extra.erosion??12,sizeVariation:extra.sizeVariation??0,
    nodeStyle:'solid',stroke:.55,lineStyle:'solid',lineOpacity:100,squareOpacity:100,lineColor:'#a9afb8',squareColor:'#e2e5e9',
    seed:23011+i*419,motionStyle:'light',amplitude:40,detailLabel:'Surface detail'
  }));

  const grid=(s,p)=>{const cols=2*Math.round((p.cols[0]+s.density*p.cols[1])/2);return{cols,rows:cols/2}};
  function layout(w,h,s,thumbnail=false){
    const g=grid(s,window.AlpicTemplates[s.preset]),raw=Math.min(w*(thumbnail?.88:.84)/g.cols,h*(thumbnail?.72:.62)/g.rows),cell=raw>=2?Math.floor(raw):raw;
    return{cx:Math.round(w*.5),base:Math.round(h*(thumbnail?.86:.8)),sx:cell*g.cols/2,sy:cell*g.rows,cell};
  }

  function build(s,p,hash){
    if(p.photo&&window.AlpicPlate){
      const plate=window.AlpicPlate,tones=Uint8Array.from(atob(plate.data),c=>c.charCodeAt(0)),crop=[.07,.93,.15];
      const sample=(u,v)=>tones[clamp(Math.floor(mix(crop[2],1,v)*plate.height),0,plate.height-1)*plate.width+clamp(Math.floor(mix(crop[0],crop[1],u)*plate.width),0,plate.width-1)];
      const {cols,rows}=grid(s,p),seed=s.seed??1,wide=s.width/100,tall=s.height/100,kernel=kernels[p.mode],blend=s.irregularity/100*.7,erosion=(s.erosion||0)/100,points=[];
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const x=(c+.5)/cols*2-1,y=(r+.5)/rows,ux=x/wide,uy=y/tall;
        if(Math.abs(ux)>=1||uy>=1)continue;
        let sum=0,hits=0;
        for(const [dx,dy] of [[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]]){const tone=sample((ux+1)/2+dx/cols/wide,1-uy+dy/rows/tall);if(tone){sum+=tone;hits++}}
        if(hits<2)continue;
        const lift=Math.pow((sum/hits-1)/254,p.gamma||1)*ease(0,.14,1-Math.abs(ux))*ease(0,.05+erosion*.6,uy);
        if(lift<.02)continue;
        points.push({x,y,size:1,threshold:mix(kernel(c,r),hash(c,r,seed+3),blend),bearing:-1,gain:0,lift,pin:false,jitter:hash(c,r,seed+11)});
      }
      const still=moment({...s,motion:false},p,0),active=[];
      points.forEach((point,i)=>{if(level(point,still)>0)active.push(i)});
      return{points,edges:[],active};
    }
    const {cols,rows}=grid(s,p),seed=s.seed??1,wide=s.width/100,tall=s.height/100*p.scale;
    const rough=.04+s.irregularity*.0012,detail=s.detail/100,erosion=(s.erosion||0)/100,cellX=2/cols/wide,cellY=1/rows/tall;
    const noise=(x,salt)=>{const i=Math.floor(x),f=x-i;return mix(hash(i,salt,seed),hash(i+1,salt,seed),f*f*(3-2*f))*2-1};
    const fbm=(x,salt)=>noise(x,salt)*.6+noise(x*2.3+7,salt)*.28+noise(x*5.1+3,salt)*.12;
    const cloud=(x,y,salt)=>{const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,a=u*u*(3-2*u),b=v*v*(3-2*v);return mix(mix(hash(i,j,seed+salt),hash(i+1,j,seed+salt),a),mix(hash(i,j+1,seed+salt),hash(i+1,j+1,seed+salt),a),b)};
    const peaks=massifs[p.massif].map(([x,y,left,right,powerLeft,powerRight,lean,spurs])=>({x,y,left,right,powerLeft,powerRight,lean,spurs:spurs.slice(0,Math.round(detail*spurs.length))}));
    const roof=(i,x)=>{
      const k=peaks[i];if(x<=k.left||x>=k.right)return 0;
      const t=x<k.x?(x-k.left)/(k.x-k.left):(k.right-x)/(k.right-k.x);
      return k.y*Math.pow(t,x<k.x?k.powerLeft:k.powerRight)*(1+rough*4*t*(1-t)*fbm(x*7+i*13.7,i+2));
    };
    const covered=(x,y)=>peaks.some((_,i)=>y<=roof(i,x));
    const glow=(x,y)=>{if(!p.sun)return 0;const d=Math.hypot((x-p.sun[0])*wide,(y-p.sun[1])*tall)-p.sun[2];return d<=0?1:.82*Math.exp(-d/.1)};
    const facet=(x,y)=>{
      let owner=-1;for(let i=peaks.length-1;i>=0;i--)if(y<=roof(i,x)){owner=i;break}
      if(owner<0)return null;
      for(let i=owner+1;i<peaks.length;i++){const front=roof(i,x);if(front>cellY&&y-front<cellY*1.6)return null}
      const k=peaks[owner],drop=k.y-y,ridge=k.x+k.lean*drop+.05*Math.sin(drop*9+owner*2.1)*drop;
      let bearing=x<ridge?LIT:SHADE,crest=ridge;
      k.spurs.forEach(([start,side,slope,spread],n)=>{
        const from=k.y*start;if(y>=from)return;
        const fall=from-y,edge=ridge+side*slope*fall,gully=ridge+side*(slope-spread)*fall;
        if(side<0?x>edge&&x<gully:x<edge&&x>gully){bearing=(side<0?SHADE_SPUR:LIT_SPUR)+(n%2?7:-6);crest=edge}
        else if(side<0&&x<=edge)crest=edge;
      });
      const lit=bearing>90,away=Math.abs(x-ridge);
      const outline=!covered(x,y+cellY)||!covered(x-cellX,y)||!covered(x+cellX,y);
      const brow=outline||y>roof(owner,x)-cellY||y>roof(owner,x-cellX)||y>roof(owner,x+cellX);
      let gain=.9*(lit?mix(1.06,.6,ease(.1,.7,away)):1),lift=lit?.07:.16+.12*ease(0,.45,away);
      if(lit&&crest>x&&crest-x<cellX*1.2)lift+=.3;
      if(!lit&&x>=crest&&x-crest<cellX*1.2)gain*=.4;
      if(k.y>.6&&y>k.y*.68+.045*fbm(x*11,9))lift+=lit?.3:.24;
      if(p.mode!=='scan')gain*=1+(cloud((x-ridge)*15+owner*5,y*5,3)-.5)*detail*.4;
      const ground=mix(.05,1,ease(0,.1+erosion*.6,y+.03*fbm(x*9,5)));
      if(p.backlit){
        if(outline)return glow(x,y+cellY)>.5?null:{bearing,gain:0,lift:0,pin:true};
        const dusk=1-glow(x,y);
        return{bearing,gain:gain*.3*ground*dusk,lift:lift*.35*ground*dusk,pin:false};
      }
      return{bearing,gain:gain*ground,lift:lift*ground,pin:outline||brow&&lit};
    };
    const points=[],active=[],kernel=kernels[p.mode],blend=p.mode==='halftone'?0:s.irregularity/100*.7;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const x=(c+.5)/cols*2-1,y=(r+.5)/rows,ux=x/wide,uy=y/tall;
      if(Math.abs(ux)>=1)continue;
      let mark=facet(ux,uy);
      if(!mark&&p.backlit&&!covered(ux,uy)){const halo=glow(ux,uy);if(halo>.04)mark={bearing:-1,gain:0,lift:halo,pin:false}}
      if(!mark||mark.gain+mark.lift<.02&&!mark.pin)continue;
      const threshold=mix(kernel(c,r),hash(c,r,seed+3),blend);
      points.push({x,y,size:1,threshold,bearing:mark.bearing,gain:mark.gain,lift:mark.lift,pin:mark.pin&&p.mode!=='halftone',jitter:hash(c,r,seed+11)});
    }
    const still=moment({...s,motion:false},p,0);
    points.forEach((point,i)=>{if(level(point,still)>0)active.push(i)});
    return{points,edges:[],active};
  }

  function moment(s,p,time){
    const steps=p.fps*12,turn=s.motion?Math.round(time/12*steps)/steps:0;
    return{style:s.motionStyle,contrast:p.contrast,exposure:p.exposure,phase:turn*TAU,turn:fract(turn),amount:s.motion?(s.amplitude??40)/100:0,vary:(s.sizeVariation??0)/100};
  }
  function level(point,m){
    const lag=point.x*1.1,sweep=m.style==='light'?m.amount*(Math.cos(lag)-Math.cos(m.phase-lag))*.5:0;
    let tone=point.bearing<0?point.lift*(1+sweep*1.6):point.lift+point.gain*lambert(point.bearing-SUN+sweep*SWING),threshold=point.threshold;
    if(m.style==='breathe')tone*=1+m.amount*.8*Math.sin(m.phase);
    else if(m.style==='wave'&&point.bearing>=0){const d=(point.y-(-.2+1.45*m.turn))/.07,band=Math.exp(-d*d)*Math.min(1,m.amount*2.2);tone=mix(tone,1-tone,band)}
    else if(m.style==='drift'){const rate=1+Math.floor(point.jitter*3),offset=point.jitter*TAU;threshold+=m.amount*.3*(Math.sin(m.phase*rate+offset)-Math.sin(offset))}
    tone=(tone*m.exposure-.5)*m.contrast+.5;
    if(!point.pin&&tone<=threshold)return 0;
    return mix(1,clamp(Math.sqrt(Math.max(tone,.05))*1.05),m.vary);
  }
  function frame(graph,s,w,h,time=0,thumbnail=false){
    const p=window.AlpicTemplates[s.preset],l=layout(w,h,s,thumbnail),m=moment(s,p,thumbnail?0:time),snap=l.cell>=2,unit=l.cell*clamp(s.dot/10);
    const size=new Float32Array(graph.points.length),active=[];
    graph.points.forEach((point,i)=>{const k=level(point,m);if(k<=0)return;size[i]=snap?Math.max(1,Math.round(unit*k)):unit*k;active.push(i)});
    return{size,active,snap};
  }
  const steps=s=>window.AlpicTemplates[s.preset].fps*12;
  const tone=point=>point.bearing<0?point.lift:point.lift+point.gain*lambert(point.bearing-SUN);
  window.AlpicDither={build,layout,frame,steps,grid,kernels,tone};
})();
