/* Volume VI: ten deterministic data elevations. Squares carry the texture;
   every point and line remains editable and exportable through Mountain. */
(() => {
  const profiles={
    summit:[[-1,.025],[-.85,.10],[-.70,.20],[-.57,.33],[-.46,.30],[-.32,.54],[-.19,.66],[-.06,1],[.08,.84],[.22,.59],[.36,.47],[.48,.57],[.62,.32],[.8,.15],[1,.025]],
    horn:[[-1,.025],[-.8,.10],[-.62,.25],[-.43,.35],[-.29,.59],[-.08,1],[.06,.90],[.2,.64],[.35,.49],[.55,.27],[.76,.12],[1,.025]],
    twins:[[-1,.025],[-.82,.18],[-.66,.40],[-.46,.89],[-.31,.76],[-.12,.42],[.02,.37],[.2,.69],[.34,1],[.49,.72],[.67,.39],[.83,.14],[1,.025]]
  };
  const studies=[
    ['Powder Signal','Powder','PDR','powder','summit',68,62,3.8,'A crisp summit dissolving into a field of square samples.','SQUARE SAMPLING'],
    ['Contour Packets','Packets','PKT','packets','summit',63,72,2.7,'Broken contour threads carry packets across the mountain.','PACKET CONTOURS'],
    ['Alpine Raster','Raster','RST','raster','horn',78,70,4.6,'An ordered square raster reveals the bright face of a peak.','FACET RASTER'],
    ['Ridge Telemetry','Telemetry','TLM','telemetry','summit',46,48,4.5,'Sparse square stations connected along a measured elevation.','RIDGE TELEMETRY'],
    ['LiDAR Snow','LiDAR','LDR','lidar','horn',84,76,2.5,'Fine vertical samples trace a sharp, snow-covered summit.','COLUMN SAMPLING'],
    ['Glacial Circuit','Circuit','CRC','circuit','horn',49,57,3.6,'Stepped paths and square junctions climb an alpine face.','STEPPED CIRCUITS'],
    ['Snowpack Bands','Snowpack','SNB','bands','summit',73,65,3.4,'Alternating bands of data settle into a mountain silhouette.','STRATIFIED DATA'],
    ['Facet Archive','Archive','ARC','archive','horn',68,80,5.1,'Small blocks of samples describe folds, snow and shadow.','BLOCK ARCHIVE'],
    ['Summit Pulse','Pulse','PLS','pulse','summit',59,64,3.1,'A skyline of square pulses, with a clean alpine crown.','PULSE COLUMNS'],
    ['Dissolve Range','Dissolve','DSV','dissolve','twins',77,68,3.4,'Two summits emerge from a softly eroded square field.','DISSOLVING RANGE']
  ];
  studies.forEach(([name,short,code,mode,profile,density,detail,dot,description,technique],i)=>window.AlpicTemplates.push({
    name,short,code,mode,profile,family:'Data',category:'Field',density,detail,dot,description,technique,
    points:profiles[profile],ridge:profiles[profile].length,connections:[],height:94,width:94,
    irregularity:18,erosion:10,sizeVariation:70,nodeStyle:'solid',stroke:.55,lineStyle:'solid',lineOpacity:100,squareOpacity:100,
    lineColor:'#a9afb8',squareColor:'#d3d7dc',seed:17003+i*347,motionStyle:'breathe',amplitude:14,
    detailLabel:['packets','circuit'].includes(mode)?'Contour layers':'Surface detail'
  }));
  function build(s,p,hash){
    const points=[],edges=[],active=[],edgeKeys=new Set();
    const clamp=n=>Math.max(0,Math.min(1,n)),seed=s.seed;
    const roof=x=>{for(let i=1;i<p.points.length;i++){const [a,ay]=p.points[i-1],[b,by]=p.points[i];if(x>=a&&x<=b)return ay+(by-ay)*(x-a)/(b-a)}return .025};
    const add=(x,y,size=1)=>{const i=points.length;points.push({x,y,size});active.push(i);return i};
    const edge=(a,b)=>{if(a<0||b<0||a===b)return;const key=a<b?a+':'+b:b+':'+a;if(!edgeKeys.has(key)){edgeKeys.add(key);edges.push([a,b])}};
    const cols=Math.round(32+s.density*.82),rows=Math.round(16+s.detail*.40),erosion=(s.erosion||0)/100;
    const field=(x,y)=>{
      const top=roof(x),spine=-.07+.33*(1-y),snow=Math.exp(-(top-y)*18);
      const fold=.5+.5*Math.sin(x*17+y*9+Math.sin(y*12)*.6);
      return clamp(.16+(x<spine?.40:.08)+snow*.35+Math.exp(-Math.abs(x-spine)*22)*.26+fold*s.detail/360);
    };
    if(['packets','circuit'].includes(p.mode)){
      const layers=Math.round(9+s.detail*.31),samples=Math.round(36+s.density*.75);
      for(let row=0;row<layers;row++){
        let last=-1;
        const t=(row+1)/layers;
        for(let col=0;col<=samples;col++){
          const x=-1+2*col/samples,top=roof(x);
          let y=.025+(top-.025)*t;
          y+=Math.sin(x*15+row*.6)*.018*s.irregularity/50*Math.sin(t*Math.PI);
          y=Math.min(top,Math.max(.025,y));
          if(hash(col,row,seed)<erosion*.6|| (p.mode==='packets'&&(col+row*3)%13>9)){last=-1;continue}
          const index=add(x,y,.55+field(x,y)*.6);
          if(last>=0){
            if(p.mode==='circuit'){
              const corner=add(x,Math.min(roof(x),points[last].y),.45);edge(last,corner);edge(corner,index);
            }else edge(last,index);
          }last=index;
        }
      }
    }else{
      const table=new Map();
      for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
        let x=-1+2*col/cols,y=.025+row/rows;
        const jitter=s.irregularity/100;
        const scatter=['powder','dissolve'].includes(p.mode)?1:.35;x+=(hash(col,row,seed+1)-.5)*.022*jitter*scatter;y+=(hash(col,row,seed+2)-.5)*.016*jitter*scatter;
        const top=roof(x);if(y>top||x<-1||x>1||y<.015)continue;
        const f=field(x,y),r=hash(col,row,seed+3);let keep=1,size=.55+f*.65;
        if(p.mode==='powder'){keep=.25+f*.62;size=.45+hash(col,row,seed+4)*.65}
        if(p.mode==='raster'){keep=.15+f*.88;size=.35+f*.9}
        if(p.mode==='telemetry'){keep=(((col+row)%3===0)?.64:.04)+Math.exp(-(top-y)*30)*.4;size=.65+f*.5}
        if(p.mode==='lidar'){keep=(col%3===0?.92:.18)*(.45+f*.65);size=.35+f*.5}
        if(p.mode==='bands'){keep=(row%5<2?.88:.15)*(.4+f*.7);size=.5+f*.7}
        if(p.mode==='archive'){const block=hash(Math.floor(col/3),Math.floor(row/3),seed+4);keep=block<.32?.13:.9;size=.35+f*.95}
        if(p.mode==='pulse'){keep=(col%3===0||row%6===0)?.96:.05;size=.45+f*.6}
        if(p.mode==='dissolve'){keep=(.2+f*.8)*(.35+y*.7);size=.4+f*.85}
        if(r>keep*(1-erosion*.7))continue;
        const index=add(x,y,size);table.set(col+':'+row,index);
        if(p.mode==='telemetry'){
          for(const [dc,dr]of [[-3,0],[0,-3],[-3,-3]])if(hash(col+dc,row+dr,seed+5)<.25+s.detail/160)edge(table.get((col+dc)+':'+(row+dr))??-1,index);
        }
        if(p.mode==='pulse'&&row%6!==0&&hash(col,row,seed+6)<s.detail/120)edge(table.get(col+':'+(row-1))??-1,index);
      }
      // Retain a readable crown even at the sparsest control settings.
      for(let i=0;i<p.points.length;i++){const [x,y]=p.points[i];add(x,y,.72)}
    }
    return {points,edges,active};
  }
  window.AlpicData={build};
})();
