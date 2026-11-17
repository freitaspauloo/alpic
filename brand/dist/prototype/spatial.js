/* True 3D vertex geometry, projected as editable vector wireframes. */
(() => {
  'use strict';
  const studies=[
    {name:'Summit Blocks',short:'Summit Blocks',code:'SBK',mode:'blocks',density:16,detail:0,irregularity:0,dot:2,stroke:.8,yaw:-32,pitch:25,height:90,width:93,description:'Open architectural volumes step up to a single summit.',technique:'ISOMETRIC VOLUMES'},
    {name:'Suspended Ascent',short:'Suspended',code:'SUS',mode:'suspended',density:16,detail:0,irregularity:0,dot:1.5,stroke:.9,yaw:-34,pitch:24,height:88,width:90,lineStyle:'dotted',description:'A few floating frames. Light, air, and a slow change of perspective.',technique:'SUSPENDED CUBE FRAMES'},
    {name:'Wireframe Massif',short:'Wire Massif',code:'WFM',mode:'terrain',density:51,detail:18,irregularity:22,dot:1.5,stroke:.6,yaw:-28,pitch:23,height:92,width:96,description:'A snow-shaped surface, drawn entirely in crossing lines.',technique:'SPATIAL TERRAIN GRID'},
    {name:'Crystal Ridge',short:'Crystal',code:'CRY',mode:'crystal',density:20,detail:25,irregularity:14,dot:3,stroke:.75,yaw:-24,pitch:19,height:95,width:96,description:'Angular peaks with open facets and square vertices.',technique:'FACETED WIREFRAME'},
    {name:'Contour Volume',short:'Volume',code:'CTV',mode:'sections',density:61,detail:38,irregularity:16,dot:1.2,stroke:.65,yaw:-32,pitch:23,height:92,width:98,description:'Fine elevation sections reveal a mountain from every angle.',technique:'SPATIAL CONTOUR SECTIONS'},
    {name:'Cubic Range',short:'Cubic Range',code:'CBR',mode:'cubic',density:23,detail:0,irregularity:12,dot:1.8,stroke:.7,yaw:-35,pitch:26,height:85,width:94,description:'A mountain range translated into a small city of wire cubes.',technique:'STEPPED VOXEL LANDSCAPE'}
  ];
  studies.forEach((p,i)=>window.AlpicTemplates.push({family:'Spatial',category:'Spatial',lineOpacity:100,squareOpacity:100,lineColor:'#d8d9dc',squareColor:'#f0f0f2',nodeStyle:'solid',motionStyle:'orbit',amplitude:22,depth:100,seed:13101+i*197,...p}));
  function build(s,p,hash){
    const points=[],edges=[],active=[],keys=new Map(),edgeKeys=new Set(),density=s.density/100,detail=s.detail/100;
    const add=(x,y,z,mark=true)=>{const key=[x,y,z].map(n=>n.toFixed(6)).join(':');if(keys.has(key))return keys.get(key);const i=points.length;points.push({x,y,z});keys.set(key,i);if(mark)active.push(i);return i};
    const edge=(a,b)=>{if(a===b)return;const key=a<b?a+':'+b:b+':'+a;if(edgeKeys.has(key))return;edgeKeys.add(key);edges.push([a,b])};
    const line=(a,b,samples=1,mark=false)=>{let last=a;const A=points[a],B=points[b];for(let i=1;i<samples;i++){const t=i/samples,index=add(A.x+(B.x-A.x)*t,A.y+(B.y-A.y)*t,A.z+(B.z-A.z)*t,mark);edge(last,index);last=index}edge(last,b)};
    function box(x,y,z,w,h,d){
      const v=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,1,-1],[1,1,-1],[1,1,1],[-1,1,1]].map(([a,b,c])=>add(x+a*w/2,y+b*h,z+c*d/2));
      for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])edge(v[a],v[b]);
      const levels=Math.floor(density*5);
      for(let j=1;j<=levels;j++){const t=j/(levels+1),ring=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>add(x+a*w/2,y+h*t,z+b*d/2,s.density>70));for(let i=0;i<4;i++)edge(ring[i],ring[(i+1)%4])}
      if(detail>.1)for(let i=0;i<4;i++)if(hash(i,points.length,s.seed)<detail)edge(v[i],v[4+(i+1)%4]);
    }
    const elevation=(x,z)=>{
      const a=1.65*Math.exp(-((x+.15)**2*3.8+(z-.08)**2*5)),b=.88*Math.exp(-((x-.64)**2*13+(z+.23)**2*9)),c=.65*Math.exp(-((x+.7)**2*10+(z+.2)**2*14));
      const h=Math.max(a,b,c),rough=(Math.sin(x*17+z*7)+.5*Math.sin(z*22-x*6))*s.irregularity*.00065;
      return Math.max(.015,h+rough*h);
    };
    if(p.mode==='blocks'){
      const spread=s.irregularity*.002;
      box(-.18,0,.18,.83,1.85,.82);box(-.99-spread,0,.13,.68,.69,.74);box(.61+spread,0,.35,.69,1.13,.78);box(.28,0,-.65-spread,.72,.44,.65);
    }else if(p.mode==='suspended'){
      const gap=.12+s.irregularity*.002;
      box(-.17,.85+gap,.15,.88,1.02,.8);box(.64,.3,.28,.67,.8,.66);box(-.73,.05,-.24,.65,.67,.62);box(.13,-.13,-.68,.72,.52,.68);
    }else if(p.mode==='terrain'){
      const n=Math.round(9+density*25),grid=[];
      for(let j=0;j<=n;j++){grid[j]=[];for(let i=0;i<=n;i++){const x=-1.15+2.3*i/n,z=-.83+1.66*j/n,index=add(x,elevation(x,z),z,(i+j)%3===0);grid[j][i]=index;if(i)edge(index,grid[j][i-1]);if(j)edge(index,grid[j-1][i]);if(i&&j&&hash(i,j,s.seed)<detail)edge(index,grid[j-1][i-1])}}
    }else if(p.mode==='sections'){
      const rows=Math.round(7+density*27),cols=Math.round(36+density*32),grid=[];
      for(let j=0;j<=rows;j++){grid[j]=[];for(let i=0;i<=cols;i++){const x=-1.15+2.3*i/cols,z=-.83+1.66*j/rows,index=add(x,elevation(x,z),z,i===0||i===cols);grid[j][i]=index;if(i)edge(index,grid[j][i-1]);if(j&&i%Math.max(2,Math.round(18-detail*15))===0)edge(index,grid[j-1][i])}}
    }else if(p.mode==='crystal'){
      const mountain=(x,z,r,h,n)=>{
        const ring=[],middle=[],samples=1+Math.floor(density*5);
        for(let i=0;i<n;i++){const a=i/n*Math.PI*2,delta=(hash(i,n,s.seed)-.5)*s.irregularity*.0015;ring.push(add(x+Math.cos(a)*r,.015,z+Math.sin(a)*r*.7));middle.push(add(x+Math.cos(a+.09)*r*.55,.42*h+delta,z+Math.sin(a+.09)*r*.43))}
        const top=add(x-.08,h,z+.04);
        for(let i=0;i<n;i++){const j=(i+1)%n;line(ring[i],ring[j],samples);line(ring[i],middle[i],samples,true);line(middle[i],middle[j],samples);line(middle[i],top,samples,true);if(hash(i,n,s.seed+1)<detail)line(ring[i],middle[j],samples)}
      };
      mountain(-.2,.1,.85,1.85,6);mountain(.81,.15,.49,1.03,5);mountain(-.96,-.04,.42,.64,5);
    }else if(p.mode==='cubic'){
      const n=3+Math.floor(density*6),cell=2/n;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){
        const x=-1+cell*(i+.5),z=-.75+cell*(j+.5)*.75,h=elevation(x,z);
        if(h<.12)continue;
        const height=Math.max(.18,Math.round(h/.28)*.28),gap=.025+s.irregularity*.0005;
        box(x,0,z,cell-gap,height,cell*.75-gap);
      }
    }
    return{points,edges,active};
  }
  function position(p,s,time,i){
    let{x,y,z}=p;const phase=time/12*Math.PI*2,amp=(s.amplitude??25)/25;
    if(s.motion){
      if(s.motionStyle==='breathe'){const k=1+Math.sin(phase)*.018*amp;x*=k;y*=k;z*=k}
      else if(s.motionStyle==='wave')y+=Math.sin(phase+x*4)*.035*amp;
      else if(s.motionStyle==='drift'){const h=(n)=>n-Math.floor(n),ax=(h(Math.sin(i*127.1+(s.seed||1)*74.7)*43758.5453)-.5)*.055*amp,ay=(h(Math.sin(i*311.7+(s.seed||1)*19.3)*43758.5453)-.5)*.042*amp,wander=Math.sin(phase*.45+i*.2);x+=(Math.sin(phase+i*1.73)-Math.sin(i*1.73))*.009*amp+ax*wander;y+=(Math.cos(phase+i*2.13)-Math.cos(i*2.13))*.01*amp+ay*wander}
    }
    return{x,y,z};
  }
  function angle(s,time){return (s.yaw??-32)*Math.PI/180+(s.motion&&s.motionStyle==='orbit'?Math.sin(time/12*Math.PI*2)*.22*(s.amplitude??25)/25:0)}
  function project(points,s,w,h,time=0,thumbnail=false){
    const state=thumbnail?{...s,motion:false}:s,angleY=angle(state,time),pitch=(s.pitch??25)*Math.PI/180;
    const view=p=>{
      let{x,y,z}=p;x*=s.width/90;y*=s.height/85;z*=(s.depth??100)/100;
      const rx=x*Math.cos(angleY)+z*Math.sin(angleY),rz=-x*Math.sin(angleY)+z*Math.cos(angleY),ry=y*Math.cos(pitch)-rz*Math.sin(pitch);
      return{x:rx,y:ry};
    };
    const unanimated=points.map(view),xs=unanimated.map(p=>p.x),ys=unanimated.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const scale=Math.min(w*.29,h*.32,w*.70/(maxX-minX||1),h*.70/(maxY-minY||1)),cx=w*.53-(maxX+minX)/2*scale,base=h*.55+(maxY+minY)/2*scale;
    return points.map((p,i)=>{const q=view(position(p,state,time,i));return{x:cx+q.x*scale,y:base-q.y*scale}});
  }
  window.AlpicSpatial={build,project,position,angle};
})();
