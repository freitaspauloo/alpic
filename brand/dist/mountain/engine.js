/* A 2D graph renderer shared by the playground and its static/animated exports. */
(() => {
  'use strict';
  const presets=window.AlpicTemplates,TAU=Math.PI*2;
  const hash=(a,b=0,seed=1)=>{const x=Math.sin(a*127.1+b*311.7+seed*74.7)*43758.5453;return x-Math.floor(x)};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const lattice=p=>p.family==='Dither'||p.family==='Vision';
  const defaults=preset=>{
    const p=presets[preset],detailed=p.mode!=='outline';
    return {preset,height:p.height,width:p.width,detail:p.detail,density:p.density??50,irregularity:p.irregularity??0,seed:p.seed??317,
      stroke:p.stroke??1.1,lineColor:p.lineColor??(p.family==='Alpine'?'#b3b8c0':detailed?'#999da3':'#d7d9dc'),lineOpacity:p.lineOpacity??85,interiorOpacity:100,lineStyle:p.lineStyle??'solid',
      dot:p.dot??5,squareColor:p.squareColor??'#d0d2d6',squareOpacity:p.squareOpacity??95,squareStroke:p.squareStroke??1,nodeStyle:p.nodeStyle??'solid',highlight:p.highlight??0,highlightColor:p.highlightColor??'#f2f2f3',sizeVariation:p.sizeVariation??0,erosion:p.erosion??0,
      background:'#080809',motion:true,speed:1,amplitude:p.amplitude??25,motionStyle:p.motionStyle??'drift',yaw:p.yaw??-32,pitch:p.pitch??25,depth:p.depth??100,offsets:{}};
  };
  function silhouette(p,x){
    const ridge=p.points.slice(0,p.ridge);
    for(let i=1;i<ridge.length;i++){const [a,ay]=ridge[i-1],[b,by]=ridge[i];if(x>=a&&x<=b)return ay+(by-ay)*(x-a)/(b-a)}return 0;
  }
  // Bowyer-Watson triangulates a flat point set. Only its edges are drawn.
  function triangulate(input){
    const n=input.length,pts=[...input,{x:-20,y:-20},{x:20,y:-20},{x:0,y:20}];
    const triangle=(a,b,c)=>{
      const A=pts[a],B=pts[b],C=pts[c],d=2*(A.x*(B.y-C.y)+B.x*(C.y-A.y)+C.x*(A.y-B.y));if(Math.abs(d)<1e-10)return null;
      const aa=A.x*A.x+A.y*A.y,bb=B.x*B.x+B.y*B.y,cc=C.x*C.x+C.y*C.y;
      const x=(aa*(B.y-C.y)+bb*(C.y-A.y)+cc*(A.y-B.y))/d,y=(aa*(C.x-B.x)+bb*(A.x-C.x)+cc*(B.x-A.x))/d;
      return{a,b,c,x,y,r:(x-A.x)**2+(y-A.y)**2};
    };
    let triangles=[triangle(n,n+1,n+2)];
    for(let i=0;i<n;i++){
      const p=pts[i],bad=new Set(triangles.filter(t=>(p.x-t.x)**2+(p.y-t.y)**2<t.r+1e-9)),boundary=new Map();
      for(const t of bad)for(const [a,b] of [[t.a,t.b],[t.b,t.c],[t.c,t.a]]){const key=a<b?a+':'+b:b+':'+a,prior=boundary.get(key);boundary.set(key,{a,b,count:(prior?.count||0)+1})}
      triangles=triangles.filter(t=>!bad.has(t));for(const {a,b,count} of boundary.values())if(count===1){const t=triangle(a,b,i);if(t)triangles.push(t)}
    }
    const edges=new Map();for(const t of triangles)if(t.a<n&&t.b<n&&t.c<n)for(const [a,b] of [[t.a,t.b],[t.b,t.c],[t.c,t.a]]){const key=a<b?a+':'+b:b+':'+a;edges.set(key,[a,b])}return[...edges.values()];
  }
  let cacheKey='',cached;
  function shape(s){
    const p=presets[s.preset],dither=lattice(p);
    const key=JSON.stringify([s.preset,s.detail,s.density,s.irregularity,s.erosion,s.seed,s.offsets,dither?[s.height,s.width]:0]);if(key===cacheKey)return cached;
    const mode=p.mode,seed=s.seed??317,points=[],edges=[],markSet=new Set(),edgeSet=new Set(),primaryKeys=new Set();
    const add=(x,y,marker=true)=>{const i=points.length;points.push({x,y});if(marker)markSet.add(i);return i};
    const edge=(a,b)=>{if(a===b)return;const id=a<b?a+':'+b:b+':'+a;if(edgeSet.has(id))return;edgeSet.add(id);edges.push([a,b])};
    let overlay;
    if(dither){
      const study=(p.family==='Vision'?window.AlpicVision:window.AlpicDither).build(s,p,hash);points.push(...study.points);study.active.forEach(i=>markSet.add(i));overlay=study.overlay;
    }else if(p.family==='Data'){
      const study=window.AlpicData.build(s,p,hash);points.push(...study.points);edges.push(...study.edges);study.active.forEach(i=>markSet.add(i));
    }else if(p.family==='Spatial'){
      const study=window.AlpicSpatial.build(s,p,hash);points.push(...study.points);edges.push(...study.edges);study.active.forEach(i=>markSet.add(i));
    }else if(p.family==='Editions'){
      const study=window.AlpicEditions.build(s,p,hash);points.push(...study.points);edges.push(...study.edges);study.active.forEach(i=>markSet.add(i));
    }else if(mode==='alpine'){
      const unique=(x,y)=>{const found=points.findIndex(p=>(p.x-x)**2+(p.y-y)**2<1e-10);return found<0?add(x,y):found};
      const primary=(a,b)=>{edge(a,b);primaryKeys.add(a<b?a+':'+b:b+':'+a)};
      const chain=(coords,spacing=.16)=>{
        let first=-1,last=-1;
        for(let k=0;k<coords.length;k++){
          const [x,y]=coords[k];if(k===0){last=first=unique(x,y);continue}
          const [ax,ay]=coords[k-1],steps=Math.max(1,Math.ceil(Math.hypot(x-ax,y-ay)/spacing));
          for(let j=1;j<=steps;j++){const t=j/steps,index=unique(ax+(x-ax)*t,ay+(y-ay)*t);primary(last,index);last=index}
        }return{first,last};
      };
      chain(p.points,.16);
      chain([[1,.025],[.72,.018],[.42,.029],[.08,.016],[-.25,.027],[-.61,.019],[-1,.025]],.19);
      p.spines.forEach(spine=>chain(spine,.19));
      const inside=(x,y)=>y>=.014&&y<=silhouette(p,x)+1e-6;
      const target=Math.round(17+s.density*1.2),minSpacing=.07-s.density*.00022;
      let accepted=0;
      for(let attempt=0;accepted<target&&attempt<target*100;attempt++){
        let x=p.distribution==='cloud'?hash(attempt,1,seed)*2-1:((attempt*.754877666+seed*.0031)%1)*2-1;
        let y=p.distribution==='cloud'?hash(attempt,2,seed):(attempt*.569840296+seed*.0017)%1;
        x+=(hash(attempt,4,seed)-.5)*s.irregularity*.0011;y+=(hash(attempt,5,seed)-.5)*s.irregularity*.0011;
        if(!inside(x,y)||y<.045||y>silhouette(p,x)-.025)continue;
        if(points.some(p=>(p.x-x)**2+(p.y-y)**2<minSpacing*minSpacing))continue;
        add(x,y);accepted++;
      }
      const candidates=triangulate(points).filter(([a,b])=>[.12,.25,.5,.75,.88].every(t=>inside(points[a].x+(points[b].x-points[a].x)*t,points[a].y+(points[b].y-points[a].y)*t)));
      const parent=points.map((_,i)=>i),root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i},join=(a,b)=>{const ra=root(a),rb=root(b);if(ra===rb)return false;parent[ra]=rb;return true};
      edges.forEach(([a,b])=>join(a,b));
      candidates.sort(([a,b],[c,d])=>((points[a].x-points[b].x)**2+(points[a].y-points[b].y)**2)-((points[c].x-points[d].x)**2+(points[c].y-points[d].y)**2));
      for(const [a,b] of candidates)if(join(a,b))edge(a,b);
      for(const [a,b] of candidates)if(hash(Math.min(a,b),Math.max(a,b),seed)<s.detail/100)edge(a,b);
    }else if(mode==='outline'){
      p.points.forEach(([x,y],i)=>add(x+(hash(i,0,seed)-.5)*s.irregularity*.002,y+(hash(i,1,seed)-.5)*s.irregularity*.002,false));
      const base=[];for(let i=0;i<p.ridge-1;i++)base.push([i,i+1]);base.push(...p.connections.slice(0,Math.round(p.connections.length*s.detail/100)));
      const steps=Math.max(0,Math.floor((s.density-30)/22));
      for(const [a,b] of base){markSet.add(a);markSet.add(b);let last=a;for(let n=1;n<=steps;n++){const t=n/(steps+1),pa=points[a],pb=points[b],i=add(pa.x+(pb.x-pa.x)*t,pa.y+(pb.y-pa.y)*t);edge(last,i);last=i}edge(last,b)}
    }else if(['network','scatter'].includes(mode)){
      if(mode==='network'){
        const cols=Math.round(8+s.density/7),rows=Math.round(cols*.7),jitter=s.irregularity/100;
        for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
          const x=-1+i*2/cols,y=.04+j/rows;if(y>silhouette(p,x)-.015)continue;
          add(x+(hash(i,j,seed)-.5)*2/cols*jitter,y+(hash(j,i,seed)-.5)/rows*jitter);
        }
        p.points.slice(0,p.ridge).forEach(([x,y])=>add(x,y));
      }else{
        const total=Math.round(18+s.density*1.15);let attempts=0;
        while(points.length<total&&attempts<total*30){const x=hash(attempts,1,seed)*2-1,y=hash(attempts,2,seed);attempts++;if(y<silhouette(p,x)&&y>.025)add(x,y)}
        p.points.slice(0,p.ridge).forEach(([x,y])=>add(x,y));
      }
      // Nearest-neighbor connections keep the graphic legible; occasional long
      // links bring in the overlapping network structure of the references.
      const degree=1+Math.floor(s.detail/30);
      points.forEach((a,i)=>{const near=points.map((b,j)=>({j,d:(a.x-b.x)**2+(a.y-b.y)**2})).filter(b=>b.j!==i).sort((a,b)=>a.d-b.d);near.slice(0,degree).forEach(({j})=>edge(i,j));if(s.detail>20&&hash(i,7,seed)<s.detail/110){const diagonal=near[Math.min(near.length-1,degree+1+Math.floor(hash(i,8,seed)*3))];if(diagonal)edge(i,diagonal.j)}if(s.detail>25&&hash(i,3,seed)<s.detail/400){const j=Math.floor(hash(i,4,seed)*points.length);edge(i,j)}});
      // Join isolated clusters with the nearest link, without filling any faces.
      const reached=new Set([0]);while(reached.size<points.length){for(const [a,b] of edges){if(reached.has(a))reached.add(b);if(reached.has(b))reached.add(a)}let best=null;for(const a of reached)for(let b=0;b<points.length;b++)if(!reached.has(b)){const d=(points[a].x-points[b].x)**2+(points[a].y-points[b].y)**2;if(!best||d<best.d)best={a,b,d}}if(!best)break;edge(best.a,best.b);reached.add(best.b)}
    }else if(['pixel','binary'].includes(mode)){
      const cols=Math.round(18+s.density*.48),rows=Math.round(cols*.58),jitter=s.irregularity*.0009;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const x=-1+i*2/cols,y=.035+j/rows,rand=hash(i,j,seed);
        if(y>silhouette(p,x)||rand<(mode==='binary'?.13:.05))continue;
        const index=add(x+(rand-.5)*jitter,y+(hash(j,i,seed)-.5)*jitter);
        if(mode==='pixel'&&s.detail>0&&index>0&&hash(i,j,seed+1)<s.detail/250&&Math.abs(points[index-1].y-y)<.02)edge(index-1,index);
      }
    }else if(mode==='rays'){
      const root=add(-.03,.025),count=Math.round(15+s.density*.85);
      for(let i=0;i<count;i++){
        const x=-1+i*2/(count-1),y=silhouette(p,x)+(hash(i,0,seed)-.5)*s.irregularity*.002;
        const end=add(x,y);edge(root,end);
        if(hash(i,1,seed)<s.detail/100){const t=.35+hash(i,2,seed)*.5;add(-.03+(x+.03)*t,.025+(y-.025)*t)}
      }
    }else if(mode==='hatch'){
      const cols=Math.round(15+s.density*.42),rows=Math.round(7+s.density*.17);
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
        const x=-1+i*2/(cols-1),y=.03+j/rows,r=hash(i,j,seed);
        if(y>silhouette(p,x)||r<s.irregularity/220)continue;
        const length=(.008+r*.044)*(1+s.detail/100),a=add(x,y,false),b=add(x,Math.min(y+length,silhouette(p,x)),false);edge(a,b);
        if(r>.86){markSet.add(a);markSet.add(b)}
      }
    }else if(mode==='weave'){
      const rows=Math.round(5+s.density*.19),cols=Math.round(10+s.detail*.35);
      for(let j=0;j<rows;j++){let last=-1;for(let i=0;i<cols;i++){
        const x=-1+i*2/(cols-1),y=.03+j/rows;if(y>silhouette(p,x)){last=-1;continue}
        const index=add(x,y+Math.sin(x*8+j*.7)*s.irregularity*.0008);if(last>=0)edge(last,index);last=index;
      }}
    }
    const base=points.map(p=>({...p}));
    points.forEach((p,i)=>{const o=s.offsets?.[i];if(o){p.x+=o[0];p.y+=o[1];if(p.z!==undefined)p.z+=o[2]||0}});
    const primary=edges.map(([a,b],i)=>primaryKeys.has(a<b?a+':'+b:b+':'+a)?i:-1).filter(i=>i>=0);
    cached={points,edges,active:[...markSet],base,primary,overlay};cacheKey=key;return cached;
  }
  function layout(w,h,s,thumbnail=false){
    if(lattice(presets[s.preset]))return window.AlpicDither.layout(w,h,s,thumbnail);
    if(presets[s.preset].mode==='orbit'){const sy=h*.83*s.height/100;return{cx:w*.5,base:h*.5+sy*.5,sx:Math.min(w*.43,sy*.5)*s.width/76,sy}}
    const edition=presets[s.preset].family==='Editions';
    return{cx:w*.5,base:h*(edition?(thumbnail?.87:.84):(thumbnail?.83:.8)),sx:w*.43*s.width/100,sy:h*(edition?(thumbnail?.73:.70):(thumbnail?.68:.64))*s.height/100};
  }
  function project(points,s,w,h,time=0,thumbnail=false){
    if(presets[s.preset].family==='Spatial')return window.AlpicSpatial.project(points,s,w,h,time,thumbnail);
    const l=layout(w,h,s,thumbnail),phase=time/12*TAU,amp=(s.amplitude??25)/25,still=lattice(presets[s.preset]);
    return points.map((p,i)=>{
      let x=p.x,y=p.y;
      if(s.motion&&!thumbnail&&!still){
        if(s.motionStyle==='breathe'){const k=1+Math.sin(phase)*.018*amp;x*=k;y*=k}
        else if(s.motionStyle==='wave'){y+=Math.sin(phase+x*4)*.018*amp; x+=Math.sin(phase+y*3)*.005*amp}
        else{x+=(Math.sin(phase+i*1.73)-Math.sin(i*1.73))*.009*amp;y+=(Math.cos(phase+i*2.13)-Math.cos(i*2.13))*.01*amp}
      }
      return{x:l.cx+x*l.sx,y:l.base-y*l.sy};
    });
  }
  const isHollow=(s,i)=>s.nodeStyle==='outline'||(s.nodeStyle==='mixed'&&hash(i,5,s.seed)<.6);
  const isHighlight=(s,i)=>hash(i,6,s.seed)<s.highlight/100;
  const markSize=(s,p)=>s.dot*(1+((p.size??1)-1)*(s.sizeVariation??0)/100);
  function render(canvas,s,options={}){
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,thumbnail=options.thumbnail,graph=options.graph||shape(s),points=project(graph.points,s,w,h,options.time||0,thumbnail),scale=thumbnail&&presets[s.preset].family!=='Editions'?.55:w/1000;
    ctx.clearRect(0,0,w,h);if(!options.transparent){ctx.fillStyle=options.background||s.background;ctx.fillRect(0,0,w,h)}
    ctx.strokeStyle=s.lineColor;ctx.lineWidth=Math.max(thumbnail?.45:.15,s.stroke*scale);ctx.lineCap=s.lineStyle==='dotted'?'round':'butt';ctx.lineJoin='miter';ctx.globalAlpha=s.lineOpacity/100;
    ctx.setLineDash(s.lineStyle==='dashed'?[6*scale,6*scale]:s.lineStyle==='dotted'?[.4*scale,4*scale]:[]);
    const primarySet=new Set(graph.primary||[]),alpine=primarySet.size>0;
    ctx.globalAlpha=s.lineOpacity/100*(alpine?(s.interiorOpacity??100)/100:1);ctx.beginPath();graph.edges.forEach(([a,b],i)=>{if(primarySet.has(i))return;ctx.moveTo(points[a].x,points[a].y);ctx.lineTo(points[b].x,points[b].y)});ctx.stroke();
    if(alpine){ctx.globalAlpha=s.lineOpacity/100;ctx.lineWidth=s.stroke*scale*1.4;ctx.beginPath();for(const i of primarySet){const [a,b]=graph.edges[i];ctx.moveTo(points[a].x,points[a].y);ctx.lineTo(points[b].x,points[b].y)}ctx.stroke()}
    ctx.setLineDash([]);
    // Dither studies light a different set of lattice pixels every frame and
    // snap them to whole device pixels, so the grid never swims.
    const lit=lattice(presets[s.preset])?window.AlpicDither.frame(graph,s,w,h,options.time||0,thumbnail):null,active=lit?lit.active:graph.active;
    const sizeOf=i=>lit?lit.size[i]:markSize(s,graph.points[i])*scale,corner=(at,size)=>lit?.snap?Math.round(at-size/2):at-size/2;
    if(s.dot>0){
      // Knock out lines before painting any node borders, so overlapping hollow
      // squares behave identically in Canvas and the SVG mask.
      ctx.globalAlpha=1;
      for(const i of active)if(isHollow(s,i)){const size=sizeOf(i),p=points[i],x=corner(p.x,size),y=corner(p.y,size);if(options.transparent)ctx.clearRect(x,y,size,size);else{ctx.fillStyle=s.background;ctx.fillRect(x,y,size,size)}}
      for(const i of active){
        const size=sizeOf(i),p=points[i],x=corner(p.x,size),y=corner(p.y,size),hollow=isHollow(s,i),highlight=isHighlight(s,i);
        ctx.globalAlpha=highlight?1:s.squareOpacity/100;ctx.strokeStyle=ctx.fillStyle=highlight?s.highlightColor:s.squareColor;ctx.lineWidth=s.squareStroke*scale;
        if(hollow)ctx.strokeRect(x,y,size,size);else ctx.fillRect(x,y,size,size);
      }
    }
    if(graph.overlay)window.AlpicVision.paint(ctx,graph.overlay,s,layout(w,h,s,thumbnail),w,options.time||0,thumbnail);
    ctx.globalAlpha=1;return{graph:lit?{...graph,active}:graph,points};
  }
  function svg(s,w=2400,h=1600,options={}){
    const graph=shape(s),animated=!!options.animated,ss={...s,motion:animated},f=n=>Number(n.toFixed(3));
    const times=animated?[0,1.5,3,4.5,6,7.5,9,10.5,12]:[0],frames=times.map(t=>project(graph.points,ss,w,h,t));
    const duration=f(12/(s.speed||1));
    const anim=(attr,values)=>`<animate attributeName="${attr}" values="${values.join(';')}" dur="${duration}s" repeatCount="indefinite" calcMode="linear"/>`;
    const pathAt=(frame,a,b)=>`M${f(frame[a].x)} ${f(frame[a].y)}L${f(frame[b].x)} ${f(frame[b].y)}`;
    const primarySet=new Set(graph.primary||[]),alpine=primarySet.size>0;
    const paths=graph.edges.map(([a,b],i)=>`<path d="${pathAt(frames[0],a,b)}" ${alpine?(primarySet.has(i)?`stroke-width="${f(s.stroke*w/1000*1.4)}"`:`opacity="${(s.interiorOpacity??100)/100}"`):''}>${animated?anim('d',frames.map(frame=>pathAt(frame,a,b))):''}</path>`).join('');
    const rect=(i,attrs='',animate=true)=>{const size=markSize(s,graph.points[i])*w/1000;return `<rect x="${f(frames[0][i].x-size/2)}" y="${f(frames[0][i].y-size/2)}" width="${f(size)}" height="${f(size)}" ${attrs}>${animated&&animate?anim('x',frames.map(frame=>f(frame[i].x-size/2)))+anim('y',frames.map(frame=>f(frame[i].y-size/2))):''}</rect>`};
    const dither=lattice(presets[s.preset]);
    // A dither loop is exported as discrete steps: pixels switch or resize on
    // the lattice instead of sliding between keyframes.
    const pixels=()=>{
      const count=animated?window.AlpicDither.steps(s):1,shots=Array.from({length:count},(_,n)=>window.AlpicDither.frame(graph,ss,w,h,n*12/count));
      const discrete=(attr,seq)=>{const keep=seq.map((v,n)=>n===0||v!==seq[n-1]?n:-1).filter(n=>n>=0);return keep.length<2?'':`<animate attributeName="${attr}" values="${keep.map(n=>seq[n]).join(';')}" keyTimes="${keep.map(n=>Number((n/count).toFixed(4))).join(';')}" dur="${duration}s" repeatCount="indefinite" calcMode="discrete"/>`};
      const corner=(at,size)=>shots[0].snap?Math.round(at-size/2):f(at-size/2);
      return graph.points.map((_,i)=>{
        const sizes=shots.map(shot=>f(shot.size[i])),largest=Math.max(...sizes);if(!largest)return '';
        const highlight=isHighlight(s,i),color=highlight?s.highlightColor:s.squareColor,opacity=highlight?1:s.squareOpacity/100,at=frames[0][i],resizes=new Set(sizes.filter(Boolean)).size>1;
        const motion=resizes?discrete('x',sizes.map(n=>corner(at.x,n)))+discrete('y',sizes.map(n=>corner(at.y,n)))+discrete('width',sizes)+discrete('height',sizes):discrete('opacity',sizes.map(n=>n?opacity:0));
        const first=resizes?sizes[0]:largest;
        return `<rect x="${corner(at.x,first)}" y="${corner(at.y,first)}" width="${first}" height="${first}" fill="${isHollow(s,i)?'none':color}" stroke="${isHollow(s,i)?color:'none'}" stroke-width="${f(s.squareStroke*w/1000)}" opacity="${resizes||sizes[0]?opacity:0}">${motion}</rect>`;
      }).join('');
    };
    const hollow=s.dot>0&&!dither?graph.active.filter(i=>isHollow(s,i)):[];
    const mask=hollow.length?`<defs><mask id="junctions" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="white"/>${hollow.map(i=>rect(i,'fill="black"')).join('')}</mask></defs>`:'';
    const nodes=s.dot<=0?'':dither?pixels():graph.active.map(i=>{
      const highlight=isHighlight(s,i),color=highlight?s.highlightColor:s.squareColor,opacity=highlight?1:s.squareOpacity/100;
      return rect(i,`fill="${isHollow(s,i)?'none':color}" stroke="${isHollow(s,i)?color:'none'}" stroke-width="${f(s.squareStroke*w/1000)}" opacity="${opacity}"`);
    }).join('');
    const dash=s.lineStyle==='dashed'?`stroke-dasharray="${f(w*.006)} ${f(w*.006)}"`:s.lineStyle==='dotted'?`stroke-dasharray="${f(w*.0004)} ${f(w*.004)}" stroke-linecap="round"`:'';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${presets[s.preset].name} — ALPIC</title>${options.transparent?'':`<rect width="${w}" height="${h}" fill="${s.background}"/>`}${mask}<g fill="none" stroke="${s.lineColor}" opacity="${s.lineOpacity/100}" stroke-width="${f(s.stroke*w/1000)}" ${dash} ${hollow.length?'mask="url(#junctions)"':''}>${paths}</g><g>${nodes}</g>${graph.overlay?window.AlpicVision.svg(graph.overlay,s,layout(w,h,s),w):''}</svg>`;
  }
  window.Mountain={presets,defaults,shape,layout,project,render,svg,hash};
})();
