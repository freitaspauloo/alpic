/* Volume VIII — machine-vision mountains. A dithered mountain sits on the
   pixel lattice; detections, tracks and readings are drawn over it. */
(() => {
  'use strict';
  const D=window.AlpicDither,TAU=Math.PI*2;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t,ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
  const pad=(n,size=2)=>String(n).padStart(size,'0');
  const LIME='#e2ffc6',ICE='#89f0ec',BERRY='#ff3b76',WHITE='#f4faf9',INK='#051413',FONT='"IBM Plex Mono",ui-monospace,monospace';
  const WORDS=['Summit','Ridge','Snow','Cloud','Light','Stone','Air','North','Ascent','Silence','Cold','Heaven'];
  const JOINTS=['summit','neck','hip','l_shoulder','l_elbow','l_wrist','l_hip','l_knee','l_ankle','r_shoulder','r_elbow','r_wrist','r_hip','r_knee','r_ankle'];

  const list=[
    ['Dense Detections','DNS','dense','photo','scan',['#4fa9a2',ICE,WHITE,LIME],'A scanline summit under a swarm of small detections. The larger boxes run rules out to the frame.','DENSE DETECTION',{density:86,detail:70,cols:[120,1.4],dot:10,irregularity:24,contrast:1.3}],
    ['Peak Detector','PKD','peaks','range','bayer',['#c9ced3',LIME,WHITE,ICE],'Every summit gets a box, a class and a confidence score.','OBJECT DETECTION',{dot:8.4}],
    ['Survey Graph','SRV','survey','photo','grain',['#646a70',WHITE,WHITE,ICE],'Measured points across the face, joined by fine lines and marked with their readings.','MEASUREMENT GRAPH',{density:84}],
    ['Class Map','CLS','classes','photo','bayer',['#a2a7ac',LIME,BERRY,ICE],'Three classes, three colours: skyline, snow and rock.','MULTI-CLASS',{density:84,detail:60}],
    ['Ridge Tracker','TRK','tracks','twins','grain',['#646a70',LIME,WHITE,ICE],'Tracked climbers move along the skyline, each with an ID and a dashed route.','OBJECT TRACKING',{cols:[56,.72],detail:40}],
    ['Keypoints','KPT','keypoints','photo','grain',['#8a9096',BERRY,WHITE,ICE],'Feature points settle on every edge of a grainy photograph. Two frames close in on the summit.','FEATURE POINTS',{density:84,irregularity:60,detail:60}],
    ['Vanishing Lines','VNS','vanish','photo','grain',['#d5d8db',BERRY,WHITE,ICE],'Stamps, words and red lines that all run to one corner of the frame.','PERSPECTIVE LINES',{density:84,contrast:1.5}],
    ['Mesh Tracker','MSH','mesh','photo','bayer',['#5f656b',BERRY,WHITE,ICE],'Glowing nodes hold onto the mountain and a red mesh joins them.','POINT MESH',{density:84,detail:60}],
    ['Segments','SEG','segments','massif','bayer',['#8a9096',LIME,BERRY,ICE],'Translucent regions seen through a camera viewfinder, still recording.','REGION FILLS',{dot:8.4}],
    ['Optical Flow','FLW','flow','horn','grain',['#565c62',ICE,BERRY,LIME],'Short vectors show where the surface would move: downhill, on both faces.','OPTICAL FLOW',{cols:[56,.72],detail:50}],
    ['Ridge Pose','POS','pose','spire','block',['#565c62',LIME,BERRY,ICE],'A pose skeleton fitted to the mountain, from the summit down to both feet.','POSE ESTIMATION',{cols:[24,.44],density:40,dot:10,contrast:2,irregularity:8,erosion:6}],
    ['Edge Pass','EDG','edges','photo','bayer',[WHITE,ICE,LIME,BERRY],'Only the edges of the photograph survive, measured against a pixel ruler.','EDGE DETECTION',{density:90}],
    ['Target Lock','LCK','lock','horn','bayer',['#8a9096',LIME,BERRY,ICE],'A reticle holds the summit while the readouts keep counting.','TARGET LOCK',{dot:8.4}],
    ['Anchor Grid','ANC','anchors','range','bayer',['#70767c',LIME,ICE,BERRY],'The detector’s grid, its anchor boxes, and the one box that wins.','ANCHOR BOXES',{dot:8.4,detail:50}],
    ['Scanpath','GZE','gaze','photo','halftone',['#8a9096',WHITE,BERRY,ICE],'Where the eye lands, in order, over a map of what stands out.','GAZE MAP',{cols:[40,.5],density:60,dot:9.2,sizeVariation:100}]
  ];
  list.forEach(([name,code,vision,source,mode,[squareColor,lineColor,highlightColor,third],description,technique,extra],i)=>window.AlpicTemplates.push({
    name,short:name,code,vision,source,mode,massif:source==='photo'?'horn':source,family:'Vision',category:'Vision',description,technique,third,
    density:extra.density??80,detail:extra.detail??55,dot:extra.dot??8.6,
    points:[[-1,.025],[0,1],[1,.025]],ridge:3,connections:[],height:100,width:100,cols:extra.cols||(source==='photo'?[84,1]:[48,.6]),fps:12,
    backlit:false,contrast:extra.contrast||1,exposure:extra.exposure||1,gamma:extra.gamma||1,sun:null,scale:1,irregularity:extra.irregularity??12,erosion:extra.erosion??12,sizeVariation:extra.sizeVariation??0,
    nodeStyle:'solid',stroke:1,lineStyle:'solid',lineOpacity:100,squareOpacity:100,squareColor,lineColor,highlightColor,
    seed:31013+i*577,motionStyle:source==='photo'?'drift':'light',amplitude:extra.amplitude??30,detailLabel:'Detections'
  }));

  const plate=window.AlpicPlate,tones=Uint8Array.from(atob(plate.data),c=>c.charCodeAt(0));
  // The lattice shows this window of the photograph: [left, right, top].
  const CROP=[.07,.93,.15],TAPS=[[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]];
  const exposed=(u,v)=>tones[clamp(Math.floor(mix(CROP[2],1,v)*plate.height),0,plate.height-1)*plate.width+clamp(Math.floor(mix(CROP[0],CROP[1],u)*plate.width),0,plate.width-1)];
  function photograph(s,p,hash){
    const {cols,rows}=D.grid(s,p),seed=s.seed??1,wide=s.width/100,tall=s.height/100,kernel=D.kernels[p.mode],blend=p.mode==='halftone'?0:s.irregularity/100*.7,erosion=(s.erosion||0)/100,points=[];
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const x=(c+.5)/cols*2-1,y=(r+.5)/rows,ux=x/wide,uy=y/tall;
      if(Math.abs(ux)>=1||uy>=1)continue;
      let sum=0,hits=0;
      for(const [dx,dy] of TAPS){const tone=exposed((ux+1)/2+dx/cols/wide,1-uy+dy/rows/tall);if(tone){sum+=tone;hits++}}
      if(hits<2)continue;
      const fade=ease(0,.14,1-Math.abs(ux))*ease(0,.05+erosion*.6,uy+.04*(hash(c,5,seed)-.5)),lift=Math.pow((sum/hits-1)/254,p.gamma)*fade;
      if(lift<.02)continue;
      points.push({x,y,size:1,threshold:mix(kernel(c,r),hash(c,r,seed+3),blend),bearing:-1,gain:0,lift,pin:false,jitter:hash(c,r,seed+11)});
    }
    return{points};
  }

  // Reads the finished lattice the way a detector would: skyline, summits,
  // strong edges, and the boxes that fit around them.
  function survey(points,s,p,hash){
    const {cols,rows}=D.grid(s,p),seed=s.seed??1,tone=new Float32Array(cols*rows).fill(-1),cellOf=q=>Math.floor(q.y*rows)*cols+Math.floor((q.x+1)/2*cols);
    for(const q of points)tone[cellOf(q)]=clamp(D.tone(q));
    const at=(c,r)=>c<0||r<0||c>=cols||r>=rows?-1:tone[r*cols+c];
    const roof=Array.from({length:cols},(_,c)=>{let r=rows;while(r>0&&tone[(r-1)*cols+c]<0)r--;return r});
    const edges=new Float32Array(cols*rows);
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const self=tone[r*cols+c];if(self<0)continue;
      const near=(i,j)=>{const t=at(i,j);return t<0?self*.4:t};
      edges[r*cols+c]=Math.hypot(near(c+1,r)-near(c-1,r),near(c,r+1)-near(c,r-1));
    }
    const edge=(c,r)=>c<0||r<0||c>=cols||r>=rows?0:edges[r*cols+c];
    const rank=i=>edges[i]*(.7+.6*hash(i,1,seed)),ranked=[...edges.keys()].filter(i=>edges[i]>.08&&i>=cols*Math.round(rows*.06)).sort((a,b)=>rank(b)-rank(a));
    const strong=ranked.length?edges[ranked[Math.floor(ranked.length*.08)]]:1,memo=new Map();
    const corners=(count,gap)=>{
      const key=count+':'+gap;
      if(!memo.has(key)){
        const kept=[];
        for(const i of ranked){if(kept.length>=count)break;const c=i%cols,r=(i-c)/cols;if(kept.every(k=>Math.abs(k.c-c)>=gap||Math.abs(k.r-r)>=gap))kept.push({c,r})}
        memo.set(key,kept);
      }
      return memo.get(key);
    };
    const peaks=[],reach=Math.max(2,Math.round(cols/16));
    for(let c=1;c<cols-1;c++){
      const top=roof[c];if(top<rows*.25)continue;
      let summit=true;for(let k=-reach;k<=reach;k++){const other=roof[c+k]??0;if(other>top||other===top&&k<0)summit=false}
      if(!summit)continue;
      const saddle=side=>{let low=top;for(let k=c+side;k>=0&&k<cols;k+=side){if(roof[k]>top)return low;low=Math.min(low,roof[k])}return 0};
      const prominence=top-Math.max(saddle(-1),saddle(1));
      if(prominence>=rows*.07)peaks.push({c,top,prominence});
    }
    peaks.sort((a,b)=>b.top-a.top);
    const hull=(peak,drop=clamp(peak.prominence,rows*.16,rows*.42))=>{
      const floor=Math.max(0,Math.round(peak.top-drop));let c0=peak.c,c1=peak.c;
      while(c0>0&&roof[c0-1]>floor&&roof[c0-1]<=peak.top)c0--;
      while(c1<cols-1&&roof[c1+1]>floor&&roof[c1+1]<=peak.top)c1++;
      return{c0,c1:c1+1,r0:floor,r1:peak.top};
    };
    const wrap=(c,r,wide,tall)=>{
      const from=Math.max(0,Math.round(c-wide/2)),to=Math.min(cols,from+wide),low=Math.max(0,Math.round(r-tall/2)),high=Math.min(rows,low+tall);
      let c0=to,c1=from,r0=high,r1=low;
      for(let j=low;j<high;j++)for(let i=from;i<to;i++)if(tone[j*cols+i]>=0){c0=Math.min(c0,i);c1=Math.max(c1,i+1);r0=Math.min(r0,j);r1=Math.max(r1,j+1)}
      return c1-c0<2||r1-r0<2?null:{c0,c1,r0,r1};
    };
    const mean=b=>{let sum=0,count=0;for(let j=b.r0;j<b.r1;j++)for(let i=b.c0;i<b.c1;i++){const t=at(i,j);if(t>=0){sum+=t;count++}}return count?sum/count:0};
    const kind=b=>peaks.some(k=>k.c>=b.c0&&k.c<b.c1&&k.top>b.r0&&k.top<=b.r1)?'peak':roof.slice(Math.max(0,b.c0),Math.max(0,b.c1)).some(top=>top>b.r0&&top<=b.r1)?'ridge':mean(b)>.6?'snow':mean(b)<.46?'rock':b.r1<rows*.3?'scree':'face';
    return{cols,rows,at,roof,edge,edges,strong,peaks,corners,hull,wrap,kind,cellOf,hash};
  }

  // Each study draws through the same small toolkit, in lattice cells, so the
  // canvas and the SVG export stay identical.
  function view(field,s,p,pen,l,w,time,thumbnail){
    const {cols,rows,hash}=field,u=w/1000,left=l.cx-l.sx,seed=s.seed??1,opacity=s.lineOpacity/100;
    const moving=s.motion&&!thumbnail,turn=moving?time/12%1:0,tick=Math.floor(turn*72),amount=moving?(s.amplitude??30)/100:0;
    const X=c=>left+c*l.cell,Y=r=>l.base-r*l.cell;
    const weight=(k=1)=>Math.max(1,Math.round(k*s.stroke*u*(thumbnail?1.6:1))),crisp=(n,width)=>Math.round(n)+(width%2?.5:0);
    const dashes=o=>o.dash?o.dash.map(n=>n*u):s.lineStyle==='dashed'?[5*u,4*u]:s.lineStyle==='dotted'?[1.2*u,3*u]:null;
    const stroke=(o,width)=>({color:o.color||s.lineColor,width,alpha:(o.alpha??1)*opacity,dash:dashes(o),offset:(o.offset||0)*u});
    const rand=(i,salt=0)=>hash(i,salt,seed),now=(i,salt=0,hold=1)=>hash(i,salt+31+Math.floor(tick/hold)*.618,seed+7);
    const line=(c0,r0,c1,r1,o={})=>{const width=weight(o.weight),upright=c0===c1,level=r0===r1;pen.line(upright?crisp(X(c0),width):X(c0),level?crisp(Y(r0),width):Y(r0),upright?crisp(X(c1),width):X(c1),level?crisp(Y(r1),width):Y(r1),stroke(o,width))};
    const trace=(cells,o={})=>pen.path(cells.map(([c,r])=>[X(c),Y(r)]),stroke(o,weight(o.weight)));
    const text=(c,r,string,o={})=>pen.text(X(c)+(o.dx||0)*u,Y(r)+(o.dy||0)*u,string,{color:o.color||s.lineColor,size:(o.size||8)*u,alpha:(o.alpha??1)*opacity,align:o.align,weight:o.bold?500:400});
    const box=(b,o={})=>{
      const width=weight(o.weight??1.4),color=o.color||s.lineColor,x=o.bare?Math.round(X(b.c0)):crisp(X(b.c0),width),y=o.bare?Math.round(Y(b.r1)):crisp(Y(b.r1),width);
      pen.rect(x,y,Math.round(X(b.c1))-Math.round(X(b.c0)),Math.round(Y(b.r0))-Math.round(Y(b.r1)),{...stroke(o,width),color:o.bare?null:color,fill:o.fill?color:null,fillAlpha:(o.fill||0)*opacity});
      if(!o.label)return;
      const size=(o.size||8)*u,edge=x-width/2,top=y-width/2;
      if(o.tab){const inset=size*.5,high=Math.round(size*1.6);pen.rect(edge,top-high,o.label.length*size*.6+inset*2,high,{fill:color,fillAlpha:opacity});pen.text(edge+inset,top-high*.3,o.label,{color:INK,size,weight:500})}
      else pen.text(edge,top-size*.55,o.label,{color,size,alpha:opacity,weight:400});
    };
    const note=(c,r,string,o={})=>{
      const size=(o.size||7)*u,inset=size*.7,wide=Math.round(string.length*size*.6+inset*2),high=Math.round(size*2),x=Math.round(X(c)+(o.dx||0)*u-(o.flip?wide:0)),y=Math.round(Y(r)+(o.dy||0)*u);
      if(o.fill)pen.rect(x,y,wide,high,{fill:o.fill,fillAlpha:opacity});
      if(o.boxed)pen.rect(x+.5,y+.5,wide,high,stroke(o,weight(.5)));
      pen.text(x+inset,y+high*.68,string,{color:o.color||s.lineColor,size,alpha:(o.alpha??1)*opacity,weight:o.bold?500:400});
    };
    const radius=(n,o)=>o.cells?n*l.cell:n*u;
    const ring=(c,r,n,o={})=>pen.circle(X(c),Y(r),radius(n,o),stroke(o,weight(o.weight)));
    const disc=(c,r,n,o={})=>pen.circle(X(c),Y(r),radius(n,o),{fill:o.color||s.lineColor,fillAlpha:(o.alpha??1)*opacity});
    const glow=(c,r,n,o={})=>[[4.2,.07],[2.3,.18],[1,1]].forEach(([grow,alpha])=>disc(c,r,n*grow,{...o,alpha}));
    const pixel=(c,r,n,o={})=>{const side=Math.max(1,Math.round(n*u));pen.rect(Math.round(X(c)-side/2),Math.round(Y(r)-side/2),side,side,{fill:o.color||s.lineColor,fillAlpha:(o.alpha??1)*opacity})};
    const brackets=(b,reach,o)=>[[b.c0,b.r0,1,1],[b.c1,b.r0,-1,1],[b.c0,b.r1,1,-1],[b.c1,b.r1,-1,-1]].forEach(([c,r,i,j])=>trace([[c+i*reach,r],[c,r],[c,r+j*reach]],o));
    const conf=(i,floor=.5)=>Math.min(.99,floor+(1-floor)*rand(i,9)+(amount?(now(i,9,2)-.5)*.06:0)).toFixed(2);
    const nudge=(b,i)=>{if(!amount||now(i,5,4)>amount*.7)return b;const dc=now(i,6,4)<.5?-1:1,dr=now(i,7,4)<.5?0:1;return{c0:b.c0+dc,c1:b.c1+dc,r0:b.r0+dr,r1:b.r1+dr}};
    const links=(nodes,near,far=0)=>{
      const seen=new Set(),pairs=[],join=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;if(a!==b&&!seen.has(key)){seen.add(key);pairs.push([a,b])}};
      nodes.forEach((a,i)=>{
        nodes.map((b,j)=>[(a.c-b.c)**2+(a.r-b.r)**2,j]).sort((m,n)=>m[0]-n[0]).slice(1,near+1).forEach(([,j])=>join(i,j));
        for(let n=0;n<far;n++)join(i,Math.floor(rand(i,40+n)*nodes.length));
      });
      return pairs;
    };
    const ridge=c=>field.roof[clamp(Math.floor(c),0,cols-1)];
    return{...field,a:s.lineColor,b:s.highlightColor,c:p.third,detail:s.detail/100,turn,tick,amount,frame:{c0:-3,c1:cols+3,r0:-2,r1:rows+4},rand,now,line,trace,text,box,note,ring,disc,glow,pixel,brackets,conf,nudge,links,ridge};
  }

  const studies={
    dense(v){
      const {cols,rows,frame}=v,marks=v.corners(Math.round(30+v.detail*210),Math.max(2,Math.round(cols/64)));
      marks.forEach((k,i)=>{
        if(v.now(i,1,4)<v.amount*.5)return;
        const wide=1+Math.floor(v.rand(i,2)**2*cols/24),tall=1+Math.floor(v.rand(i,3)**2*cols/30),c0=k.c-(wide>>1),r0=k.r-(tall>>1),b={c0,c1:c0+wide,r0,r1:r0+tall};
        v.box(b,{weight:.5,alpha:.45+.55*v.rand(i,4),label:v.rand(i,5)<.5?(v.rand(i,6)<.5?v.conf(i,.2):v.kind(b)):'',size:5});
      });
      const large=[...v.peaks.slice(0,2).map(k=>v.hull(k)),...v.corners(4,Math.round(cols/5)).map((k,i)=>v.wrap(k.c,k.r,Math.round(cols*(.1+.1*v.rand(i,7))),Math.round(rows*(.18+.16*v.rand(i,8)))))].filter(Boolean);
      large.forEach((b,i)=>{
        const at=v.nudge(b,i+500),rule={color:v.b,weight:.5,alpha:.7};
        v.box(at,{color:v.b,weight:1,label:`${v.kind(b)} ${v.conf(i+500)}`,size:6.5});
        v.line(at.c1,at.r0,frame.c1,at.r0,rule);v.line(at.c1,at.r1,at.c1,frame.r1,rule);
      });
    },
    peaks(v){
      const {cols,rows}=v,style={weight:2,tab:true,size:8.5};
      v.corners(Math.round(v.detail*8),Math.round(cols/6)).forEach((k,i)=>{
        const b=v.wrap(k.c,k.r,Math.round(cols*(.08+.08*v.rand(i,1))),Math.round(rows*(.16+.14*v.rand(i,2))));
        if(b&&v.kind(b)!=='peak')v.box(v.nudge(b,i+40),{...style,label:`${v.kind(b)} ${v.conf(i+40,.35)}`});
      });
      v.peaks.slice(0,1+Math.round(v.detail*5)).reverse().forEach((k,i,all)=>v.box(v.nudge(v.hull(k),i),{...style,label:`${i===all.length-1?'summit':'peak'} ${v.conf(i,.75)}`}));
    },
    survey(v){
      const {cols,rows,frame}=v,top=v.peaks[0]||{c:cols>>1,top:rows},nodes=v.corners(Math.round(7+v.detail*14),Math.round(cols/8)),faint={weight:.5,alpha:.3},level=top.top-rows*.22;
      [.16,.27].forEach(k=>v.ring(top.c+.5,level,k*cols,{...faint,cells:true}));
      v.line(frame.c0,level,frame.c1,level,faint);v.line(top.c+.5,frame.r0,top.c+.5,frame.r1,faint);
      const pairs=v.links(nodes,2),degree=nodes.map((_,i)=>pairs.filter(pair=>pair.includes(i)).length),hubs=nodes.map((_,i)=>i).sort((a,b)=>degree[b]-degree[a]).slice(0,2);
      pairs.forEach(([a,b])=>v.line(nodes[a].c+.5,nodes[a].r+.5,nodes[b].c+.5,nodes[b].r+.5,{weight:.7,alpha:.9}));
      nodes.forEach((k,i)=>{
        const c=k.c+.5,r=k.r+.5;
        if(hubs.includes(i)){v.disc(c,r,2.8);v.text(c,r,String(Math.round(11+v.rand(i,3)*88)),{size:17,bold:true,dx:7,dy:-6});return}
        v.ring(c,r,3.4,{weight:.8});
        v.note(c,r,((v.rand(i,1)-.3)*140+(v.amount?v.now(i,2,3)*.03:0)).toFixed(4),{boxed:true,size:6.5,dx:k.c>cols*.78?-7:7,dy:-20,flip:k.c>cols*.78});
      });
    },
    classes(v){
      const {cols,rows}=v,tint={peak:v.a,ridge:v.a,snow:v.c,face:v.c,rock:v.b,scree:v.b};
      const found=[...v.peaks.slice(0,3).map(k=>v.hull(k)),...v.corners(Math.round(4+v.detail*16),Math.round(cols/9)).map((k,i)=>v.wrap(k.c,k.r,Math.round(cols*(.05+.1*v.rand(i,1))),Math.round(rows*(.1+.18*v.rand(i,2)))))].filter(Boolean);
      found.forEach((b,i)=>{const kind=v.kind(b);v.box(v.nudge(b,i),{color:tint[kind],weight:1.6,label:kind,tab:true,size:7.5})});
    },
    tracks(v){
      const {rows}=v;
      for(let i=0,count=Math.round(3+v.detail*8);i<count;i++){
        const home=.14+.72*v.rand(i,1),reach=.07+.09*v.rand(i,2),phase=v.rand(i,3)*TAU,at=turn=>(home+reach*Math.sin(turn*TAU+phase))*v.cols;
        const c=at(v.turn),top=v.ridge(c),route=[];
        if(top<rows*.12)continue;
        for(let past=Math.floor((home-reach)*v.cols);past<=(home+reach)*v.cols;past++)route.push([past+.5,(v.ridge(past-1)+v.ridge(past)+v.ridge(past+1))/3+1.8]);
        v.trace(route,{weight:.8,alpha:.8,dash:[3,3]});
        const wide=3+Math.round(v.rand(i,4)*2),tall=wide+2+Math.round(v.rand(i,5)*2),c0=Math.round(c-wide/2);
        v.box({c0:Math.floor(c),c1:Math.floor(c)+1,r0:top,r1:top+2},{bare:true,fill:1,color:v.b});
        v.box({c0,c1:c0+wide,r0:top-1,r1:top-1+tall},{weight:1,label:`${i%4?'climber':'guide'} ${pad(i+1)}`,size:6});
      }
    },
    keypoints(v){
      const {cols,rows}=v,top=v.peaks[0]||{c:cols>>1,top:rows};
      v.corners(Math.round(40+v.detail*200),Math.max(2,Math.round(cols/60))).forEach((k,i)=>{if(v.now(i,1,2)>=v.amount*.4)v.pixel(k.c+.5,k.r+.5,2.6+3.4*v.rand(i,2)**2)});
      const inner={c0:Math.round(top.c-cols*.05),c1:Math.round(top.c+cols*.06),r0:Math.round(top.top-rows*.2),r1:top.top+1},outer={c0:Math.round(top.c-cols*.2),c1:Math.round(top.c+cols*.23),r0:Math.max(1,Math.round(top.top-rows*.74)),r1:top.top+3};
      [[inner.c0,inner.r1,outer.c0,outer.r1],[inner.c1,inner.r1,outer.c1,outer.r1],[inner.c0,inner.r0,outer.c0,outer.r0],[inner.c1,inner.r0,outer.c1,outer.r0]].forEach(ray=>v.line(...ray,{color:v.b,weight:.5,alpha:.7}));
      v.box(outer,{color:v.b,weight:.8});v.box(inner,{color:v.b,weight:.8});
    },
    vanish(v){
      const {cols,frame}=v,marks=v.corners(Math.round(6+v.detail*16),Math.round(cols/11));
      let word=0;
      marks.forEach(k=>v.line(k.c+.5,k.r+.5,frame.c1,frame.r1,{weight:.7,alpha:.85}));
      marks.forEach((k,i)=>{
        const roll=v.rand(i,1),wide=Math.round(cols*(.015+.045*v.rand(i,2))),tall=Math.round(cols*(.008+.02*v.rand(i,3))),block={c0:k.c,c1:k.c+wide,r0:k.r-tall+1,r1:k.r+1};
        if(roll<.4)v.note(k.c+.5,k.r+.5,WORDS[word++%WORDS.length],{color:v.b,fill:v.a,size:7+4*v.rand(i,5),dy:-8,bold:true});
        else if(roll<.75){if(v.now(i,4,6)>=v.amount*.5)v.box(block,{bare:true,fill:1})}
        else v.box({...block,c1:block.c1+wide,r1:block.r1+tall},{weight:.8});
      });
      v.pixel(frame.c1,frame.r1,5);
    },
    mesh(v){
      const nodes=v.corners(Math.round(12+v.detail*44),Math.round(v.cols/18));
      v.links(nodes,4,1).forEach(([a,b],i)=>{if(v.now(i,1,3)>=v.amount*.4)v.line(nodes[a].c+.5,nodes[a].r+.5,nodes[b].c+.5,nodes[b].r+.5,{alpha:.8})});
      nodes.forEach((k,i)=>v.glow(k.c+.5,k.r+.5,(1.9+1.5*v.rand(i,2))*(1+v.amount*.6*Math.sin(v.turn*TAU*3+i))));
    },
    segments(v){
      const {cols,rows}=v,inset=cols*.02,chrome={color:WHITE,weight:1.4};
      const regions=[...v.peaks.slice(0,2).map(k=>[v.hull(k),'peak',v.a]),...v.corners(Math.round(3+v.detail*9),Math.round(cols/7)).map((k,i)=>{
        const b=v.wrap(k.c,k.r,Math.round(cols*(.1+.1*v.rand(i,1))),Math.round(rows*(.16+.16*v.rand(i,2))));
        return b&&(b.r0+b.r1>rows*.9?[b,'snow',v.c]:[b,'rock',v.b]);
      })].filter(Boolean);
      regions.forEach(([b,kind,color],i)=>v.box(v.nudge(b,i),{color,weight:1,fill:.3,label:kind,size:6}));
      const finder={c0:Math.round(cols*.12),c1:Math.round(cols*.88),r0:-Math.round(rows*.1),r1:Math.round(rows*1.05)},mid=cols/2,level=rows/2;
      v.brackets(finder,cols*.03,chrome);
      v.line(mid-inset,level,mid+inset,level,{color:WHITE,weight:.8});v.line(mid,level-inset,mid,level+inset,{color:WHITE,weight:.8});
      if(!v.amount||v.tick%8<5)v.disc(finder.c1-inset,finder.r1-inset*1.5,3.4,{color:BERRY});
      v.text(finder.c1-inset,finder.r1-inset*1.5,'REC',{color:WHITE,size:8,bold:true,align:'right',dx:-8,dy:3});
      v.text(finder.c1-inset,finder.r0+inset,`00:00:${pad(Math.floor(v.turn*12))}:${pad(Math.floor(v.turn*288)%24)}`,{color:WHITE,size:7,align:'right'});
      v.text(finder.c0+inset,finder.r0+inset,'F8  1/500  ISO 200',{color:WHITE,size:7});
    },
    flow(v){
      const {cols,rows}=v,step=Math.max(2,Math.round(cols/(16+v.detail*30)));
      for(let r=step>>1;r<rows;r+=step)for(let c=step>>1;c<cols;c+=step){
        if(v.at(c,r)<0)continue;
        const rise=(v.roof[Math.min(cols-1,c+step)]-v.roof[Math.max(0,c-step)])/(2*step);
        const angle=Math.atan2(-Math.abs(rise),rise>0?-1:1)+(v.rand(c,r)-.5)*.45+v.amount*1.1*Math.sin(v.turn*TAU+c*.19+r*.23),reach=step*(.5+.55*clamp(v.edge(c,r)/v.strong));
        const dc=Math.cos(angle)*reach,dr=Math.sin(angle)*reach,color=dc<0?v.a:v.b;
        v.line(c+.5,r+.5,c+.5+dc,r+.5+dr,{color,weight:1.1});v.pixel(c+.5+dc,r+.5+dr,2.6,{color});
      }
    },
    pose(v){
      const {cols}=v,top=v.peaks[0];if(!top)return;
      const mid=top.c+.5,high=top.top,skyline=(side,share)=>{let c=top.c;while(c>0&&c<cols-1&&v.roof[c]>high*share)c+=side;return[c+.5-side*1.5,high*share]};
      const limb=side=>[skyline(side,.72),skyline(side,.46),skyline(side,.2),[mid+side*cols*.07,high*.33],[mid+side*cols*.13,high*.17],[mid+side*cols*.18,1]];
      const joints=[[mid,high-1],[mid,high*.8],[mid,high*.4],...limb(-1),...limb(1)].map(([c,r],i)=>[c+(v.now(i,1,3)-.5)*v.amount*2,r+(v.now(i,2,3)-.5)*v.amount*2]);
      const bone=(color,...chain)=>v.trace(chain.map(i=>joints[i]),{color,weight:2});
      bone(v.c,1,3,4,5);bone(v.c,2,6,7,8);bone(v.b,1,9,10,11);bone(v.b,2,12,13,14);bone(v.a,0,1,2);
      joints.forEach(([c,r],i)=>{
        const color=i<3?v.a:i<9?v.c:v.b,leftward=i>=3&&i<9;
        v.disc(c,r,3.4,{color});v.ring(c,r,6,{color,weight:.6,alpha:.6});
        v.text(c,r,JOINTS[i],{color:WHITE,size:5.8,dx:leftward?-10:10,dy:2,align:leftward?'right':'left'});
      });
    },
    edges(v){
      const {cols,rows,frame}=v,top=v.peaks[0]||{c:cols>>1,top:rows,prominence:rows},c=top.c+.5,r=top.top-.5,cross={color:v.b,weight:.5,dash:[4,4]},tick={weight:.5,alpha:.8};
      for(let i=0;i<=cols;i+=4){const major=i%16===0;v.line(i,frame.r0,i,frame.r0-(major?1.8:.9),tick);if(major)v.text(i,frame.r0-1.8,pad(i,3),{size:5.4,dy:9,align:'center',alpha:.8})}
      for(let j=0;j<=rows;j+=4){const major=j%16===0;v.line(frame.c1,j,frame.c1+(major?1.8:.9),j,tick);if(major)v.text(frame.c1+1.8,j,pad(j,3),{size:5.4,dx:5,dy:2,alpha:.8})}
      v.line(c-cols*.2,r,frame.c1,r,cross);v.line(c,frame.r0,c,rows+3,cross);
      v.ring(c,r,4.5,{color:v.b});
      v.note(c,r,`x ${pad(top.c,3)}  y ${pad(top.top,3)}`,{color:v.b,boxed:true,size:6.5,dx:10,dy:-26});
      v.box(v.hull(top,rows*.5),{weight:1,dash:[6,4],label:'roi',size:6.5});
    },
    lock(v){
      const {cols,rows}=v,top=v.peaks[0];if(!top)return;
      const c=top.c+.5,r=top.top-2,unit=cols/100,beat=v.amount*Math.sin(v.turn*TAU*4),elbow=[c+unit*10,r+unit*7];
      v.ring(c,r,unit*2.6,{cells:true,weight:1.2});
      v.ring(c,r,unit*(5.6+beat*.5),{cells:true,dash:[9,6],offset:v.turn*210});
      v.ring(c,r,unit*9,{cells:true,weight:.5,alpha:.5});
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([i,j])=>v.line(c+i*unit*3.6,r+j*unit*3.6,c+i*unit*11,r+j*unit*11,{weight:.8}));
      v.brackets(v.nudge(v.hull(top,rows*.34),1),unit*3,{color:v.b,weight:1.6});
      v.trace([[c+unit*4,r+unit*4],elbow,[elbow[0]+unit*4,elbow[1]]],{weight:.6});
      ['SUMMIT LOCK','ALT 4478 M',`RNG ${(12.4+(v.amount?v.now(1,3,2)*.3:0)).toFixed(2)} KM`,`CONF ${v.conf(1,.92)}`].forEach((string,i)=>v.text(elbow[0]+unit*5,elbow[1],string,{color:i?v.a:v.b,size:i?6.5:8,bold:!i,dy:3+i*11}));
    },
    anchors(v){
      const {cols}=v,across=2*Math.round(4+v.detail*4),size=cols/across,down=across/2,faint={weight:.5,alpha:.25};
      for(let i=0;i<=across;i++)v.line(i*size,0,i*size,down*size,faint);
      for(let j=0;j<=down;j++)v.line(0,j*size,cols,j*size,faint);
      for(let j=0;j<down;j++)for(let i=0;i<across;i++)if(v.at(Math.floor((i+.5)*size),Math.floor((j+.5)*size))>=0)v.pixel((i+.5)*size,(j+.5)*size,2.4,{alpha:.8});
      v.peaks.slice(0,3).forEach((k,n)=>{
        const i=Math.floor(k.c/size),j=Math.floor((k.top-1)/size),c=(i+.5)*size,r=(j+.5)*size;
        v.box({c0:i*size,c1:(i+1)*size,r0:j*size,r1:(j+1)*size},{bare:true,fill:.3,color:v.b});
        [[1,2.2],[1.7,1.7],[2.6,1.1]].forEach(([wide,tall],m)=>{if(v.now(n*3+m,1,5)>=v.amount*.6)v.box({c0:c-wide*size/2,c1:c+wide*size/2,r0:r-tall*size/2,r1:r+tall*size/2},{color:v.b,weight:.6,alpha:.7,dash:[3,3]})});
        v.box(v.nudge(v.hull(k),n),{weight:2,label:`peak ${v.conf(n,.8)}`,tab:true,size:8});
      });
    },
    gaze(v){
      const {cols,rows}=v,size=Math.max(3,Math.round(cols/28));
      const blocks=[];
      for(let r=0;r<rows;r+=size)for(let c=0;c<cols;c+=size){let heat=0;for(let j=0;j<size;j++)for(let i=0;i<size;i++)heat+=v.edge(c+i,r+j);blocks.push([c,r,heat])}
      const hottest=Math.max(...blocks.map(block=>block[2]));
      blocks.forEach(([c,r,heat])=>{if(heat>hottest*.45)v.box({c0:c,c1:c+size,r0:r,r1:r+size},{bare:true,fill:(heat/hottest-.45)*1.1,color:v.b})});
      const stops=v.corners(Math.round(4+v.detail*10),Math.round(cols/7)).map(k=>[k.c+.5,k.r+.5]);
      v.trace(stops,{weight:.8,alpha:.9});
      stops.forEach(([c,r],i)=>{
        const radius=(5+13*v.rand(i,1))*(1+.25*v.amount*Math.sin(v.turn*TAU*2+i*1.7));
        v.disc(c,r,radius,{alpha:.12});v.ring(c,r,radius);v.disc(c,r,6.5,{color:INK,alpha:.85});v.text(c,r,String(i+1),{size:7,align:'center',dy:2.6,bold:true});
      });
    }
  };

  function build(s,p,hash){
    const study=p.source==='photo'?photograph(s,p,hash):D.build(s,p,hash),field=survey(study.points,s,p,hash),still={...s,motion:false};
    // The edge pass keeps a pixel only where the photograph changes tone.
    const points=p.vision!=='edges'?study.points:study.points.filter(q=>{const change=field.edges[field.cellOf(q)]/field.strong;q.lift=clamp(change*.8);q.pin=change>.75;return change>.2});
    let marks=0;const tally=()=>{marks++},counter={line:tally,path:tally,rect:tally,circle:tally,text:tally};
    studies[p.vision](view(field,still,p,counter,D.layout(1000,500,still),1000,0,false));
    return{points,active:D.frame({points},still,1000,500,0).active,overlay:{field,marks}};
  }

  const brush=ctx=>{
    const stroke=o=>{ctx.globalAlpha=o.alpha??1;ctx.strokeStyle=o.color;ctx.lineWidth=o.width;ctx.setLineDash(o.dash||[]);ctx.lineDashOffset=o.offset||0};
    return{
      line(x0,y0,x1,y1,o){stroke(o);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()},
      path(points,o){stroke(o);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()},
      rect(x,y,w,h,o){if(o.fill){ctx.globalAlpha=o.fillAlpha??1;ctx.fillStyle=o.fill;ctx.fillRect(x,y,w,h)}if(o.color){stroke(o);ctx.strokeRect(x,y,w,h)}},
      circle(x,y,r,o){ctx.beginPath();ctx.arc(x,y,r,0,TAU);if(o.fill){ctx.globalAlpha=o.fillAlpha??1;ctx.fillStyle=o.fill;ctx.fill()}if(o.color){stroke(o);ctx.stroke()}},
      text(x,y,string,o){
        ctx.globalAlpha=o.alpha??1;ctx.fillStyle=o.color;
        // Lettering too small to read is drawn as a bar of the same length.
        if(o.size<5){const wide=string.length*o.size*.6;ctx.globalAlpha*=.75;ctx.fillRect(x-(o.align==='center'?wide/2:o.align==='right'?wide:0),y-o.size*.7,wide,o.size*.62);return}
        ctx.font=`${o.weight||400} ${o.size}px ${FONT}`;ctx.textAlign=o.align||'left';ctx.textBaseline='alphabetic';ctx.fillText(string,x,y);
      }
    };
  };
  const scribe=out=>{
    const f=n=>Number(n.toFixed(2)),faded=(name,alpha=1)=>alpha<1?` ${name}="${f(alpha)}"`:'';
    const stroke=o=>`fill="none" stroke="${o.color}" stroke-width="${f(o.width)}"${faded('stroke-opacity',o.alpha)}${o.dash?` stroke-dasharray="${o.dash.map(f).join(' ')}"`:''}`;
    return{
      line(x0,y0,x1,y1,o){out.push(`<path d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" ${stroke(o)}/>`)},
      path(points,o){out.push(`<path d="${points.map(([x,y],i)=>(i?'L':'M')+f(x)+' '+f(y)).join('')}" ${stroke(o)}/>`)},
      rect(x,y,w,h,o){const at=`x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"`;if(o.fill)out.push(`<rect ${at} fill="${o.fill}"${faded('fill-opacity',o.fillAlpha)}/>`);if(o.color)out.push(`<rect ${at} ${stroke(o)}/>`)},
      circle(x,y,r,o){const at=`cx="${f(x)}" cy="${f(y)}" r="${f(r)}"`;if(o.fill)out.push(`<circle ${at} fill="${o.fill}"${faded('fill-opacity',o.fillAlpha)}/>`);if(o.color)out.push(`<circle ${at} ${stroke(o)}/>`)},
      text(x,y,string,o){out.push(`<text x="${f(x)}" y="${f(y)}" font-size="${f(o.size)}" font-weight="${o.weight||400}" fill="${o.color}"${faded('fill-opacity',o.alpha)}${o.align==='center'?' text-anchor="middle"':o.align==='right'?' text-anchor="end"':''}>${string}</text>`)}
    };
  };
  function paint(ctx,overlay,s,l,w,time,thumbnail){
    ctx.save();ctx.lineJoin='miter';ctx.lineCap='butt';
    studies[window.AlpicTemplates[s.preset].vision](view(overlay.field,s,window.AlpicTemplates[s.preset],brush(ctx),l,w,time,thumbnail));
    ctx.restore();
  }
  function svg(overlay,s,l,w){
    const out=[];studies[window.AlpicTemplates[s.preset].vision](view(overlay.field,{...s,motion:false},window.AlpicTemplates[s.preset],scribe(out),l,w,0,false));
    return `<g font-family='${FONT}'>${out.join('')}</g>`;
  }
  window.AlpicTemplates.push({
    name:'Silver Print',short:'Silver Print',code:'SLV',mode:'bayer',massif:'horn',family:'Dither',category:'Field',photo:true,
    description:'A photograph of the mountain, broken down into pixels. Bright snow prints larger.',technique:'PHOTO DITHER',
    points:[[-1,.025],[0,1],[1,.025]],ridge:3,connections:[],height:100,width:100,cols:[72,.9],fps:12,density:84,detail:40,dot:9,
    backlit:false,contrast:1.15,exposure:1,gamma:1,sun:null,scale:1,irregularity:8,erosion:10,sizeVariation:100,
    nodeStyle:'solid',stroke:0,lineStyle:'solid',lineOpacity:0,squareOpacity:100,lineColor:'#c8c8c8',squareColor:'#f4f4f4',
    seed:44017,motionStyle:'drift',amplitude:24,detailLabel:'Surface detail'
  });
  window.AlpicVision={build,paint,svg};
})();
