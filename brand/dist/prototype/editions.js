/* Volume IV: flat elevations, etched contours and square halftone fields.
   Tone comes from mark size and spacing. Every visible mark uses its chosen opacity. */
(() => {
  'use strict';
  const profiles={
    spire:[[-1,.018],[-.89,.065],[-.78,.12],[-.68,.22],[-.59,.19],[-.48,.37],[-.39,.34],[-.29,.56],[-.22,.52],[-.13,.78],[-.065,.73],[.005,1],[.09,.82],[.16,.85],[.24,.61],[.33,.55],[.41,.62],[.49,.4],[.59,.33],[.66,.36],[.79,.14],[.9,.08],[1,.018]],
    horn:[[-1,.018],[-.83,.09],[-.7,.16],[-.54,.31],[-.43,.3],[-.29,.54],[-.19,.72],[-.09,1],[.035,.9],[.17,.64],[.29,.53],[.39,.31],[.49,.33],[.66,.14],[.81,.07],[1,.018]],
    range:[[-1,.018],[-.88,.12],[-.76,.4],[-.68,.32],[-.55,.7],[-.45,.59],[-.31,.83],[-.21,.65],[-.03,1],[.08,.8],[.19,.57],[.31,.77],[.43,.5],[.55,.64],[.67,.36],[.77,.27],[.86,.11],[1,.018]],
    twin:[[-1,.018],[-.86,.12],[-.72,.3],[-.59,.49],[-.43,.95],[-.34,.82],[-.2,.48],[-.08,.34],[.05,.49],[.2,.91],[.28,1],[.41,.65],[.5,.59],[.63,.31],[.77,.16],[1,.018]],
    massif:[[-1,.018],[-.84,.12],[-.7,.3],[-.58,.34],[-.46,.58],[-.32,.67],[-.19,.87],[-.07,.89],[.05,1],[.15,.91],[.24,.94],[.37,.69],[.48,.64],[.58,.37],[.7,.32],[.84,.12],[1,.018]]
  };
  const studies=[
    {name:'Snowline Engraving',short:'Snowline',code:'SNW',mode:'contours',profile:'spire',category:'Signal',density:78,detail:74,irregularity:26,stroke:.55,dot:1.6,height:94,width:94,erosion:0,description:'Fine contour threads gather into a sharp, snow-cut summit.',detailLabel:'Contour layers',technique:'CONTOUR ENGRAVING'},
    {name:'Silver Halftone',short:'Silver',code:'SLV',mode:'halftone',profile:'horn',category:'Field',density:79,detail:68,irregularity:8,stroke:.4,dot:4.4,height:94,width:87,erosion:12,description:'A mountain sculpted by square size, light, and empty space.',detailLabel:'Surface contrast',technique:'SQUARE HALFTONE'},
    {name:'Summit Framework',short:'Framework',code:'FRM',mode:'framework',profile:'horn',category:'Network',density:42,detail:44,irregularity:22,stroke:.65,dot:8,nodeStyle:'outline',sizeVariation:0,height:95,width:85,erosion:0,description:'Open square junctions. Clear ridges. Room for every connection.',detailLabel:'Cross connections',technique:'OPEN SQUARE NETWORK'},
    {name:'Faultline',short:'Faultline',code:'FLT',mode:'fault',profile:'spire',category:'Signal',density:76,detail:65,irregularity:30,stroke:.7,dot:1.8,height:95,width:89,erosion:8,description:'A jagged silhouette built from fine vertical fractures.',detailLabel:'Strata depth',technique:'VERTICAL ETCHING'},
    {name:'White Massif',short:'Massif',code:'WHT',mode:'halftone',variant:'snow',profile:'massif',category:'Field',density:92,detail:85,irregularity:12,stroke:.4,dot:4,height:83,width:96,erosion:17,description:'A bright snow face dissolves into an open field of pixels.',detailLabel:'Surface contrast',technique:'DITHERED SNOWFIELD'},
    {name:'Midnight Survey',short:'Midnight',code:'MID',mode:'particles',profile:'spire',category:'Field',density:84,detail:76,irregularity:34,stroke:.3,dot:2.2,height:95,width:95,erosion:10,description:'Thousands of tiny square samples trace the mountain’s folds.',detailLabel:'Ridge definition',technique:'SQUARE POINT FIELD'},
    {name:'The High Pass',short:'High Pass',code:'HPS',mode:'framework',variant:'range',profile:'range',category:'Network',density:62,detail:62,irregularity:44,stroke:.5,dot:4.5,nodeStyle:'mixed',sizeVariation:18,height:83,width:98,erosion:0,description:'A longer alpine traverse, drawn as a measured network.',detailLabel:'Cross connections',technique:'RIDGELINE NETWORK'},
    {name:'Frequency Range',short:'Frequency',code:'FRQ',mode:'frequency',profile:'range',category:'Signal',density:82,detail:72,irregularity:35,stroke:.8,dot:1.5,height:84,width:97,erosion:12,description:'Broken horizontal signals resolve into a mountain range.',detailLabel:'Signal length',technique:'HORIZONTAL SCAN'},
    {name:'Glacial Mosaic',short:'Mosaic',code:'MSC',mode:'halftone',variant:'mosaic',profile:'twin',category:'Field',density:57,detail:78,irregularity:0,stroke:.5,dot:7,height:85,width:95,erosion:6,description:'Two peaks, quiet shadows, and a precise grid of square marks.',detailLabel:'Surface contrast',technique:'MODULAR SQUARE FIELD'},
    {name:'Alpine Echo',short:'Echo',code:'ECH',mode:'contours',variant:'echo',profile:'twin',category:'Signal',density:65,detail:52,irregularity:20,stroke:.65,dot:1.8,height:88,width:96,erosion:2,description:'Parallel elevations flow through a deep, open saddle.',detailLabel:'Contour layers',technique:'LAYERED ELEVATION'},
    {name:'Orbital Snow',short:'Orbit',code:'ORB',mode:'orbit',profile:'massif',category:'Field',density:78,detail:58,irregularity:20,stroke:.4,dot:3.4,height:95,width:76,erosion:18,description:'A broken ring of square pixels, with a quiet center.',detailLabel:'Ring breadth',technique:'ORBITAL PIXEL FIELD'},
    {name:'Signal Bloom',short:'Bloom',code:'BLM',mode:'bloom',profile:'range',category:'Field',density:78,detail:58,irregularity:20,stroke:.4,dot:5.2,height:77,width:98,erosion:20,description:'An alpine signal drifts into a soft, expansive pixel field.',detailLabel:'Field breadth',technique:'DIFFUSED SQUARE FIELD'}
  ];
  studies.forEach((p,i)=>window.AlpicTemplates.push({family:'Editions',nodeStyle:'solid',lineOpacity:100,squareOpacity:100,lineColor:'#c5c7cb',squareColor:'#e0e1e3',sizeVariation:100,motionStyle:'breathe',amplitude:10,seed:8101+i*211,...p,points:profiles[p.profile],ridge:profiles[p.profile].length,connections:[]}));

  function build(s,p,hash){
    const points=[],edges=[],active=[],primary=[],seed=s.seed,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),erosion=(s.erosion??p.erosion??0)/100;
    const add=(x,y,mark=false,size=1)=>{const i=points.length;points.push({x,y,size});if(mark)active.push(i);return i};
    const edge=(a,b)=>{if(a!==b)edges.push([a,b])};
    const roof=x=>{for(let i=1;i<p.points.length;i++){const [a,ay]=p.points[i-1],[b,by]=p.points[i];if(x>=a&&x<=b)return ay+(by-ay)*(x-a)/(b-a)}return .018};
    const ridge=(x,t)=>{
      const r=roof(x),fold=(Math.sin(x*17+t*5)+.38*Math.sin(x*39-t*8))*.027*s.irregularity/40;
      return .018+(r-.018)*Math.pow(t,.88)+fold*Math.sin(Math.PI*t)*Math.min(1,r*4);
    };
    const facet=(x,y)=>{
      const h=roof(x),ridgeX=(p.profile==='horn'?-.09:0)+.32*(1-y)+Math.sin(y*10)*.025;
      const snow=Math.exp(-Math.abs(h-y)*16),spine=Math.exp(-Math.abs(x-ridgeX)*22),fold=.5+.5*Math.sin(x*17+y*7+Math.sin(y*14)*.35);
      const light=x<ridgeX?.73:.23;
      const detail=s.detail/100;
      return clamp(.14+light*.52+snow*.48+spine*.37+(fold-.5)*.35*detail);
    };
    if(p.mode==='contours'){
      const rows=Math.round(10+s.detail*.35),cols=Math.round(55+s.density*.9);
      for(let j=0;j<rows;j++){
        const t=(j+1)/rows;
        let last=-1;
        for(let i=0;i<=cols;i++){
          const x=-1+i*2/cols,y=ridge(x,t),cut=erosion*.65*(.35+.65*(1-t));
          if(hash(i,j,seed)<cut){last=-1;continue}
          const mark=hash(i,j,seed+8)>.97&&j>2,index=add(x,y,mark,.6+hash(i,j,seed+2)*.5);
          if(last>=0)edge(last,index);last=index;
        }
      }
    }else if(p.mode==='particles'){
      const rows=Math.round(20+s.detail*.48),cols=Math.round(60+s.density*1.45);
      for(let j=0;j<rows;j++)for(let i=0;i<=cols;i++){
        const x=-1+i*2/cols+(hash(i,j,seed)-.5)*.006*s.irregularity/30,t=(j+.5)/rows,y=ridge(x,t);
        if(hash(i,j,seed+1)<erosion*.6)continue;
        const f=facet(x,y),size=.25+f*.62+hash(i,j,seed+2)*.35;
        add(x,y+(hash(i,j,seed+3)-.5)*.009,true,size);
      }
    }else if(p.mode==='halftone'){
      const cols=Math.round(35+s.density*.82),rows=Math.round(cols*.48),contrast=.55+s.detail/100;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const x=-1+i*2/cols,y=.018+j/rows,top=roof(x);if(y>top)continue;
        let f=facet(x,y);
        if(p.variant==='snow')f=clamp(f+.14+Math.sin(x*24+y*11)*.12);
        if(p.variant==='mosaic')f=clamp(f*.9+Math.sin(Math.floor(i/3)+Math.floor(j/3)*2)*.1);
        const r=hash(i,j,seed),falloff=Math.pow(clamp(y/top),.3),keep=1-erosion*(1.5-f)-.12*(1-falloff);
        if(r>keep)continue;
        const size=clamp(Math.pow(f,contrast)*1.22,.12,1.18);
        const jitter=s.irregularity/100*.6;
        add(x+(hash(i,j,seed+1)-.5)*2/cols*jitter,y+(hash(i,j,seed+2)-.5)/rows*jitter,true,size);
      }
    }else if(p.mode==='framework'){
      const cols=Math.round(7+s.density*.12),rows=Math.round(5+s.density*.055),grid=new Map(),jitter=s.irregularity/100;
      const inside=(a,b)=>[.25,.5,.75].every(t=>{const x=points[a].x+(points[b].x-points[a].x)*t,y=points[a].y+(points[b].y-points[a].y)*t;return y<roof(x)+.005});
      for(let j=0;j<rows;j++)for(let i=0;i<=cols;i++){
        let x=-1+i*2/cols,y=.025+j/rows;
        if(y>roof(x)-.025)continue;
        x+=(hash(i,j,seed)-.5)*.10*jitter;y=clamp(y+(hash(i,j,seed+1)-.5)*.10*jitter,.02,Math.max(.02,roof(x)-.015));
        const index=add(x,y,true,.65+hash(i,j,seed+3)*.5);grid.set(i+':'+j,index);
        for(const [a,b] of [[i-1,j],[i,j-1]]){const prev=grid.get(a+':'+b);if(prev!==undefined&&inside(prev,index))edge(prev,index)}
        if(hash(i,j,seed+2)<s.detail/100*(1-erosion)){const prev=grid.get((i-1)+':'+(j-1));if(prev!==undefined&&inside(prev,index))edge(prev,index)}
      }
      const count=points.length;let last=-1;
      for(const [x,y] of p.points){const index=add(x,y,true,.8);if(last>=0)edge(last,index);last=index;
        const near=points.slice(0,count).map((q,i)=>({i,d:(x-q.x)**2+(y-q.y)**2})).sort((a,b)=>a.d-b.d);
        for(const q of near.slice(0,1+Math.floor(s.detail/55)))if(inside(index,q.i))edge(index,q.i);
      }
      // Keep the sparse framework in one piece even at minimum connection count.
      const parents=points.map((_,i)=>i),root=i=>{while(parents[i]!==i)i=parents[i];return i},join=(a,b)=>{const x=root(a),y=root(b);if(x===y)return false;parents[x]=y;return true};
      edges.forEach(([a,b])=>join(a,b));
      const candidates=[];for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++)if(root(a)!==root(b)&&inside(a,b))candidates.push({a,b,d:(points[a].x-points[b].x)**2+(points[a].y-points[b].y)**2});
      candidates.sort((a,b)=>a.d-b.d);for(const {a,b} of candidates)if(join(a,b))edge(a,b);
    }else if(p.mode==='fault'){
      const cols=Math.round(45+s.density*1.2),rows=Math.round(8+s.detail*.2);
      for(let i=0;i<=cols;i++){
        const x=-1+2*i/cols,top=roof(x);
        for(let j=0;j<rows;j++){
          const t=j/rows,r=hash(i,j,seed);if(r<erosion)continue;
          const start=.018+(top-.018)*t,span=(top-.018)/rows*(.65+(r-.5)*1.2*s.irregularity/100);
          if(top<.03)continue;
          const a=add(x,start,r>.975,.7),b=add(x,Math.min(top,start+span),false);edge(a,b);
        }
      }
    }else if(p.mode==='frequency'){
      const rows=Math.round(15+s.density*.6),cols=Math.round(22+s.density*.5);
      for(let j=0;j<=rows;j++)for(let i=0;i<cols;i++){
        const x=-1+2*i/cols,y=.02+j/rows,r=hash(i,j,seed);
        if(y>roof(x)||r<erosion)continue;
        const length=2/cols*(.16+.7*facet(x,y))*(.4+s.detail/100)*(1+(r-.5)*s.irregularity/100);
        const end=Math.min(1,x+length);if(y>roof(end))continue;
        const a=add(x,y,r>.985,.8),b=add(end,y,false);edge(a,b);
      }
    }else if(p.mode==='orbit'){
      const cols=Math.round(40+s.density*.62),rows=cols,thickness=.12+s.detail*.0022;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const x=-1+2*i/cols,y=j/rows,dx=x,dy=(y-.5)*2,radius=Math.hypot(dx,dy),a=Math.atan2(dy,dx),wobble=.035*Math.sin(a*5)+.025*Math.sin(a*9);
        const ring=Math.exp(-(((radius-(.72+wobble))/thickness)**2)*2.6),breaks=.55+.45*Math.sin(a*3+1),value=ring*(.48+.52*breaks),r=hash(i,j,seed);
        if(r>value*(1-erosion*.7)||radius>1)continue;
        const size=.18+Math.pow(value,.7)*.9+(r>.5?.15:0),jit=s.irregularity/100*.007;
        add(x+(r-.5)*jit,y+(hash(i,j,seed+1)-.5)*jit,true,size);
      }
    }else if(p.mode==='bloom'){
      const cols=Math.round(40+s.density*.8),rows=Math.round(cols*.52),breadth=.12+s.detail*.002;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const x=-1+2*i/cols,y=j/rows,center=.32+.15*Math.sin(x*3.8)+.14*Math.sin(x*7.2+.6),distance=Math.abs(y-center);
        const envelope=Math.pow(Math.max(0,1-x*x),.6),field=Math.exp(-((distance/breadth)**2)*1.6)*envelope;
        const grain=hash(i,j,seed);if(grain>field*(1-erosion*.7))continue;
        const size=.15+Math.pow(field,.6)*(.55+.45*hash(i,j,seed+1));
        add(x+(hash(i,j,seed+2)-.5)*.007*s.irregularity/30,y,true,size);
      }
    }
    return{points,edges,active,primary};
  }
  window.AlpicEditions={build};
})();
