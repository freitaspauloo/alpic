(() => {
  'use strict';
  const $=id=>document.getElementById(id),{presets,defaults:baseDefaults,shape,layout,render,svg}=Mountain,canvas=$('mountain'),viewport=$('viewport');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaults=i=>({...baseDefaults(i),motion:!reducedMotion}),lattice=p=>['Dither','Vision'].includes(p.family);
  const limits={height:[25,100],width:[30,100],yaw:[-180,180],pitch:[5,75],depth:[10,180],detail:[0,100],density:[10,100],irregularity:[0,100],erosion:[0,80],stroke:[.1,6],lineOpacity:[0,100],interiorOpacity:[0,100],dot:[0,30],sizeVariation:[0,100],squareStroke:[.25,4],squareOpacity:[0,100],highlight:[0,100],speed:[.1,3],amplitude:[0,100]};
  const colors=['lineColor','squareColor','background','highlightColor'];
  const choices={lineStyle:['solid','dashed','dotted'],nodeStyle:['solid','outline','mixed'],motionStyle:['orbit','light','drift','breathe','wave']};
  const movement={orbit:'Orbit — slowly turn the wireframe',light:'Light — the sun crosses the faces',drift:'Drift — each junction wanders',breathe:'Breathe — the drawing expands',wave:'Wave — a ripple across the mountain'};
  const pixelMovement={drift:'Drift — pixels twinkle in place',breathe:'Breathe — the exposure rises and falls',wave:'Wave — a scan climbs the mountain'};
  let state=defaults(62),recipes={},graph,screen,dirty=true,time=0,start=performance.now(),lastFrame=0,drag=null,saveTimer,toastTimer,editKey=null,activeFilter='Vision';
  let undo=[],redo=[];
  function validate(data){
    if(!data||!Number.isInteger(data.preset)||!presets[data.preset])throw Error('Invalid preset');
    const s=defaults(data.preset);
    for(const [key,[min,max]] of Object.entries(limits))if(Number.isFinite(data[key]))s[key]=Math.max(min,Math.min(max,data[key]));
    for(const key of colors)if(/^#[0-9a-f]{6}$/i.test(data[key]))s[key]=data[key];
    // Recipes exported by the first edition remain usable.
    if(!data.lineColor&&/^#[0-9a-f]{6}$/i.test(data.accent))s.lineColor=data.accent;
    for(const [key,values] of Object.entries(choices))if(values.includes(data[key]))s[key]=data[key];
    if(presets[s.preset].family==='Spatial')s.motionStyle='orbit';else if(s.motionStyle==='orbit')s.motionStyle='breathe';
    if(!lattice(presets[s.preset])&&s.motionStyle==='light')s.motionStyle='breathe';
    if(typeof data.motion==='boolean')s.motion=reducedMotion?false:data.motion;
    if(Number.isFinite(data.seed))s.seed=Math.max(0,Math.min(1e6,Math.round(data.seed)));
    const count=shape(s).points.length;
    if(data.offsets&&typeof data.offsets==='object')for(const [key,value] of Object.entries(data.offsets)){
      const i=Number(key);if(Number.isInteger(i)&&i>=0&&i<count&&Array.isArray(value)&&[2,3].includes(value.length)&&value.every(Number.isFinite))s.offsets[i]=value.map(v=>Math.max(-1,Math.min(1,v)));
    }
    return s;
  }
  try{
    const saved=JSON.parse(localStorage.getItem('alpic-studio-v4'));
    if(saved){state=validate(saved.current);for(const [key,value] of Object.entries(saved.recipes||{})){try{const recipe=validate(value);recipes[recipe.preset]=recipe}catch{}}}
    else{const old=JSON.parse(localStorage.getItem('alpic-studio-v3')||localStorage.getItem('alpic-lines-v2'));if(old)for(const value of [old.current,...Object.values(old.recipes||{})]){try{const recipe=validate(value);if(recipe.lineColor.toLowerCase()==='#c1ff00')recipe.lineColor='#d7d9dc';recipes[recipe.preset]=recipe}catch{}}}
  }catch{}
  function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{recipes[state.preset]=structuredClone(state);localStorage.setItem('alpic-studio-v4',JSON.stringify({current:state,recipes}))}catch{}},200)}
  function notify(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000)}
  function checkpoint(){const serialized=JSON.stringify(state);if(undo[undo.length-1]!==serialized){undo.push(serialized);if(undo.length>40)undo.shift()}redo=[];updateHistory()}
  function updateHistory(){$('undo').disabled=!undo.length;$('redo').disabled=!redo.length}
  function invalidate(){graph=shape(state);$('graph-info').textContent=`${graph.active.length} SQUARES · ${graph.overlay?graph.overlay.marks+' MARKS':graph.edges.length+' LINES'}`;dirty=true;persist()}
  function sync(){
    for(const key of Object.keys(limits)){
      const input=$(key);if(!input)continue;input.value=state[key];input.style.setProperty('--progress',`${(state[key]-input.min)/(input.max-input.min)*100}%`);
      const value=state[key];$(key+'-out').textContent=['stroke','dot','squareStroke'].includes(key)?Number(value.toFixed(2))+' px':key==='speed'?Number(value.toFixed(1))+'×':['yaw','pitch'].includes(key)?Math.round(value)+'°':Math.round(value)+'%';
    }
    for(const key of colors){$(key).value=state[key];if(document.activeElement!==$(key+'-hex'))$(key+'-hex').value=state[key]}
    for(const key of Object.keys(choices))$(key).value=state[key];
    $('motion').checked=state.motion;$('motion-preview').setAttribute('aria-pressed',String(state.motion));$('motion-preview').setAttribute('aria-label',state.motion?'Pause animation':'Play animation');$('motion-icon').textContent=state.motion?'Ⅱ':'▷';$('motion-status').textContent=state.motion?'Motion on':'Motion off';
    viewport.style.background=state.background;
    $('interior-setting').hidden=presets[state.preset].mode!=='alpine';
    document.querySelectorAll('.preset').forEach((b,i)=>{b.classList.toggle('active',i===state.preset);b.setAttribute('aria-pressed',String(i===state.preset))});
    const p=presets[state.preset];$('stage-name').textContent=p.name;$('stage-description').textContent=p.description;$('stage-number').textContent=String(state.preset+1).padStart(2,'0')+' — '+presets.length;$('terrain-code').textContent=p.code+'_'+String(state.preset+1).padStart(3,'0');
    $('stage-technique').textContent=p.technique||`${p.category.toUpperCase()} STUDY`;
    $('erosion-setting').hidden=$('variation-setting').hidden=!['Editions','Data','Dither','Vision'].includes(p.family);
    const spatial=p.family==='Spatial',dither=lattice(p);$('spatial-setting').hidden=!spatial;
    $('shape-intro').textContent=spatial?'Rotate the view. Shape the volume. Drag the drawing to explore its depth.':'Build up the detail. Keep the mountain in the picture.';
    $('shape-note').textContent=spatial?'Drag anywhere on the artwork to rotate and tilt. Density adds subdivisions; Connections adds cross braces.':'Density and detail shape each study differently. Drag a square to add your own touch.';
    document.querySelector('.drag-hint').textContent=spatial?'↔  DRAG TO ROTATE & TILT':dither?'↖  DRAG A PIXEL TO MOVE IT':'↖  DRAG A SQUARE TO RESHAPE';
    document.querySelectorAll('#motionStyle option').forEach(option=>{option.hidden=option.disabled=spatial?option.value!=='orbit':option.value==='orbit'||option.value==='light'&&!dither;option.textContent=dither&&pixelMovement[option.value]||movement[option.value]});
    $('detail-label').textContent=p.detailLabel||'Connections';
    $('lines-intro').textContent=p.family==='Vision'?'Lines draw the detections over the mountain. The second annotation color is the highlight color, under Squares.':['halftone','particles','orbit','bloom','powder','raster','lidar','bands','archive','dissolve'].includes(p.mode)||dither?'This study is made of squares. Use Shape and Squares to tune its texture; set its background below.':'Fine threads, bold paths, or a quieter trace.';
    canvas.setAttribute('aria-label',`${p.name}. ${spatial?'A 3D wireframe. Drag to rotate and tilt, or use the view sliders.':'A flat 2D '+p.category.toLowerCase()+' drawing with square connectors. Drag a square to reshape.'} Animation ${state.motion?'on':'off'}.`);
    $('seed-value').textContent=state.seed;updateHistory();
  }
  const range=(key,label,min,max,step=1)=>`<label class="slider-label" for="${key}"><span id="${key}-label">${label}</span><output id="${key}-out"></output></label><input type="range" id="${key}" min="${min}" max="${max}" step="${step}">`;
  const color=(key,label)=>`<div class="color-control"><label for="${key}">${label}</label><div class="color-picker"><input id="${key}" type="color" aria-label="${label}"><input id="${key}-hex" class="hex-input" type="text" maxlength="7" spellcheck="false" aria-label="${label} hex value"></div></div>`;
  const select=(key,label,options)=>`<label class="field-label" for="${key}">${label}</label><select id="${key}">${options.map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select>`;
  const panels={
    shape:`<p class="panel-intro" id="shape-intro">Build up the detail. Keep the mountain in the picture.</p><div id="spatial-setting">${range('yaw','Rotation',-180,180)}${range('pitch','Viewing elevation',5,75)}${range('depth','Depth',10,180)}</div>${range('height','Peak height',25,100)}${range('width','Mountain width',30,100)}${range('density','Point density',10,100)}${range('detail','Connections',0,100)}${range('irregularity','Irregularity',0,100)}<div id="erosion-setting">${range('erosion','Dissolve',0,80)}<p class="settings-note" style="margin:-12px 0 22px">Open up the texture by removing marks, without fading their opacity.</p></div><button class="small-button" id="regenerate">New arrangement <span>↻ &nbsp; <span id="seed-value"></span></span></button><p class="settings-note" id="shape-note">Density and detail shape each study differently. Drag a square to add your own touch.</p>`,
    lines:`<p class="panel-intro" id="lines-intro">Fine threads, bold paths, or a quieter trace.</p>${range('stroke','Line weight',.1,6,.05)}${range('lineOpacity','Line opacity',0,100)}<div id="interior-setting">${range('interiorOpacity','Interior line opacity',0,100)}<p class="settings-note" style="margin:-12px 0 22px">100% matches the overall line opacity. Lower it to soften the inner connections.</p></div>${color('lineColor','Line color')}${select('lineStyle','Line style',[['solid','Solid'],['dashed','Dashed'],['dotted','Dotted']])}${color('background','Background')}<p class="settings-note">Line and square colors are independent. Transparent exports remove the background.</p>`,
    squares:`<p class="panel-intro">Give every junction its own character.</p>${range('dot','Square size',0,30,.1)}<div id="variation-setting">${range('sizeVariation','Size variation',0,100)}<p class="settings-note" style="margin:-12px 0 22px">0% makes every square equal. 100% reveals the study’s full texture.</p></div>${range('squareStroke','Square border weight',.25,4,.25)}${range('squareOpacity','Square opacity',0,100)}${select('nodeStyle','Square style',[['solid','Filled'],['outline','Hollow'],['mixed','Mixed']])}${color('squareColor','Square color')}${range('highlight','Highlighted squares',0,100)}${color('highlightColor','Highlight color')}<p class="settings-note">Set square size to zero for a pure line drawing. Hollow squares stay transparent in SVG and PNG exports.</p>`,
    motion:`<p class="panel-intro">A small movement can change the whole feeling.</p><label class="toggle-row" for="motion"><span>Enable animation</span><input type="checkbox" id="motion"><span class="switch"></span></label>${select('motionStyle','Movement',choices.motionStyle.map(value=>[value,movement[value]]))}${range('speed','Motion speed',.1,3,.1)}${range('amplitude','Motion amount',0,100)}<p class="settings-note">Every movement loops seamlessly. Pause freezes the drawing for editing. Choose Animated SVG at export to take the movement with you.</p><p class="settings-note">Motion starts off when your device requests reduced motion.</p>`
  };
  for(const [name,content] of Object.entries(panels)){const panel=document.createElement('div');panel.id='panel-'+name;panel.className='settings-panel';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','tab-'+name);panel.hidden=name!=='shape';panel.innerHTML=content;$('settings-body').append(panel)}
  function showPanel(name,focus=false){document.querySelectorAll('[data-panel]').forEach(b=>{const active=b.dataset.panel===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active&&focus)b.focus()});document.querySelectorAll('.settings-panel').forEach(p=>p.hidden=p.id!=='panel-'+name);$('settings-body').scrollTop=0}
  document.querySelectorAll('[data-panel]').forEach((b,i)=>{b.addEventListener('click',()=>showPanel(b.dataset.panel));b.addEventListener('keydown',e=>{const names=Object.keys(panels);if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;showPanel(names[n],true)}})});
  function selectPreset(index){checkpoint();recipes[state.preset]=structuredClone(state);state=recipes[index]?structuredClone(recipes[index]):defaults(index);time=0;start=performance.now();sync();invalidate()}
  presets.forEach((p,i)=>{
    const b=document.createElement('button');b.className='preset';b.dataset.category=p.category;b.dataset.family=p.family||'';b.setAttribute('aria-label',`Template ${i+1}: ${p.name}`);b.title=`${p.family||p.category} / ${p.name}`;
    const thumb=document.createElement('canvas'),sharp=lattice(p)?2:1;thumb.width=280*sharp;thumb.height=152*sharp;thumb.setAttribute('aria-hidden','true');const recipe=defaults(i);render(thumb,{...recipe,motion:false},{thumbnail:true,background:'#101012'});
    const info=document.createElement('div');info.className='preset-info';const number=document.createElement('span');number.className='mono';number.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.className='preset-name';name.textContent=p.short;info.append(number,name);b.append(thumb,info);
    if(i>=28){const badge=document.createElement('span');badge.className='preset-badge';badge.textContent=p.technique;b.append(badge)}
    b.addEventListener('click',()=>selectPreset(i));$('presets').append(b);
  });
  const matchesFilter=p=>activeFilter==='All'||(['Alpine','Editions','Spatial','Data','Dither','Vision'].includes(activeFilter)?p.family===activeFilter:p.category===activeFilter);
  function filterStudies(name){activeFilter=name;$('presets').dataset.view=name;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});document.querySelectorAll('.preset').forEach((b,i)=>b.hidden=!matchesFilter(presets[i]))}
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>filterStudies(b.dataset.filter)));
  filterStudies('Vision');
  $('explore-new').addEventListener('click',()=>{filterStudies('Vision');selectPreset(62);$('viewport').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'center'})});
  function beginEdit(key){if(editKey!==key){checkpoint();editKey=key}}
  for(const key of Object.keys(limits)){
    $(key).addEventListener('input',()=>{beginEdit(key);if(key==='speed')start=performance.now()-time/Number($(key).value)*1000;state[key]=Number($(key).value);if(['density','detail','irregularity','erosion'].includes(key))state.offsets={};sync();invalidate()});
    $(key).addEventListener('change',()=>editKey=null);$(key).addEventListener('blur',()=>editKey=null);
  }
  for(const key of colors){
    $(key).addEventListener('input',()=>{beginEdit(key);state[key]=$(key).value;sync();invalidate()});$(key).addEventListener('change',()=>editKey=null);
    $(key+'-hex').addEventListener('input',()=>{const value=$(key+'-hex').value.trim();if(/^#[0-9a-f]{6}$/i.test(value)){beginEdit(key+'-hex');state[key]=value.toLowerCase();sync();invalidate()}});
    $(key+'-hex').addEventListener('blur',()=>editKey=null);
    $(key+'-hex').addEventListener('change',()=>{let value=$(key+'-hex').value.trim();if(!value.startsWith('#'))value='#'+value;if(/^#[0-9a-f]{3}$/i.test(value))value='#'+[...value.slice(1)].map(c=>c+c).join('');if(/^#[0-9a-f]{6}$/i.test(value)){if(value.toLowerCase()!==state[key])checkpoint();state[key]=value.toLowerCase();invalidate()}else notify('Use a hex color, such as #B4B4BE.');$(key+'-hex').value=state[key];sync()});
  }
  for(const key of Object.keys(choices))$(key).addEventListener('change',()=>{checkpoint();state[key]=$(key).value;sync();invalidate()});
  function freeze(){
    if(!state.motion)return;
    if(presets[state.preset].family==='Spatial'){
      if(state.motionStyle==='orbit'){state.yaw=((AlpicSpatial.angle(state,time)*180/Math.PI+540)%360)-180}
      else{const current=shape(state);current.base.forEach((p,i)=>{const at=AlpicSpatial.position(current.points[i],state,time,i);state.offsets[i]=[at.x-p.x,at.y-p.y,at.z-p.z]})}
      state.motion=false;time=0;return;
    }
    if(lattice(presets[state.preset])){state.motion=false;time=0;return}
    const current=shape(state),frame=Mountain.project(current.points,state,1000,1000,time),l=layout(1000,1000,state);
    current.base.forEach((p,i)=>{state.offsets[i]=[(frame[i].x-l.cx)/l.sx-p.x,(l.base-frame[i].y)/l.sy-p.y]});state.motion=false;time=0;
  }
  function setMotion(value){checkpoint();if(value){state.motion=true;time=0;start=performance.now()}else freeze();sync();invalidate()}
  $('motion').addEventListener('change',()=>setMotion($('motion').checked));$('motion-preview').addEventListener('click',()=>setMotion(!state.motion));
  $('regenerate').addEventListener('click',()=>{checkpoint();state.seed=Math.floor(Math.random()*1e6);state.offsets={};sync();invalidate();notify('A new arrangement. Same mountain.')});
  $('reset').addEventListener('click',()=>{checkpoint();state=defaults(state.preset);time=0;start=performance.now();sync();invalidate();notify('Study restored to its starting point.')});
  $('randomize').addEventListener('click',()=>{const candidates=presets.map((p,i)=>({p,i})).filter(({p,i})=>i!==state.preset&&matchesFilter(p));if(!candidates.length)return;const i=candidates[Math.floor(Math.random()*candidates.length)].i;selectPreset(i);state.seed=Math.floor(Math.random()*1e6);state.offsets={};sync();invalidate();notify('A different perspective.')});
  function travel(from,to){if(!from.length)return;to.push(JSON.stringify(state));state=validate(JSON.parse(from.pop()));time=0;start=performance.now();sync();invalidate()}
  $('undo').addEventListener('click',()=>travel(undo,redo));$('redo').addEventListener('click',()=>travel(redo,undo));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')viewport.classList.remove('expanded');if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();e.shiftKey?travel(redo,undo):travel(undo,redo)}});
  $('fullscreen').addEventListener('click',async()=>{if(document.fullscreenElement){await document.exitFullscreen();return}if(viewport.classList.contains('expanded')){viewport.classList.remove('expanded');return}try{await viewport.requestFullscreen()}catch{viewport.classList.add('expanded')}});
  const pointerPoint=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height,ratio:canvas.width/r.width}};
  function nearest(e){if(!screen||state.dot===0)return -1;const at=pointerPoint(e);let best=-1,distance=Math.max(12,state.dot)*at.ratio;for(const i of screen.graph.active){const p=screen.points[i],d=Math.hypot(p.x-at.x,p.y-at.y);if(d<distance){best=i;distance=d}}return best}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(presets[state.preset].family==='Spatial'){checkpoint();freeze();drag={camera:true,x:e.clientX,y:e.clientY,yaw:state.yaw,pitch:state.pitch};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';sync();invalidate();return}const index=nearest(e);if(index<0)return;checkpoint();freeze();graph=shape(state);const at=pointerPoint(e);drag={index,x:at.x,y:at.y,offset:[...(state.offsets[index]||[0,0])]};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';sync();invalidate()});
  canvas.addEventListener('pointermove',e=>{
    if(!drag){canvas.style.cursor=presets[state.preset].family==='Spatial'||nearest(e)>=0?'grab':'default';return}
    if(drag.camera){state.yaw=((drag.yaw+(e.clientX-drag.x)*.35+540)%360)-180;state.pitch=Math.max(5,Math.min(75,drag.pitch+(e.clientY-drag.y)*.2));sync();invalidate();return}
    const at=pointerPoint(e),l=layout(canvas.width,canvas.height,state),base=graph.base[drag.index];
    const minX=(canvas.width*.04-l.cx)/l.sx-base.x,maxX=(canvas.width*.96-l.cx)/l.sx-base.x,minY=(l.base-canvas.height*.9)/l.sy-base.y,maxY=(l.base-canvas.height*.16)/l.sy-base.y;
    state.offsets[drag.index]=[Math.max(minX,Math.min(maxX,drag.offset[0]+(at.x-drag.x)/l.sx)),Math.max(minY,Math.min(maxY,drag.offset[1]-(at.y-drag.y)/l.sy))];invalidate();
  });
  const endDrag=()=>{drag=null;canvas.style.cursor='default'};['pointerup','pointercancel','lostpointercapture'].forEach(e=>canvas.addEventListener(e,endDrag));
  new ResizeObserver(()=>{const r=viewport.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);dirty=true}).observe(viewport);
  function frame(t){requestAnimationFrame(frame);if(document.hidden||t-lastFrame<33)return;if(state.motion){time=(t-start)/1000*state.speed;dirty=true}if(!dirty)return;lastFrame=t;screen=render(canvas,state,{time,graph});dirty=false}
  sync();invalidate();requestAnimationFrame(frame);
  document.fonts?.ready.then(()=>{dirty=true});
  $('about').addEventListener('click',()=>$('about-dialog').showModal());$('export').addEventListener('click',()=>$('export-dialog').showModal());
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
  $('format').addEventListener('change',()=>{$('image-options').hidden=$('format').value==='json';$('size').previousElementSibling.textContent=$('format').value==='png'?'Export size':'Artboard size'});
  function download(blob,filename){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
  $('download').addEventListener('click',async()=>{
    const format=$('format').value,button=$('download'),filename=`alpic-${presets[state.preset].short.toLowerCase().replace(/\s+/g,'-')}`;button.disabled=true;button.textContent='Preparing your drawing…';
    await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,20)));
    try{
      if(format==='json')download(new Blob([JSON.stringify({version:6,application:'ALPIC LINES',...state},null,2)],{type:'application/json'}),filename+'.json');
      else{
        const w=Number($('size').value),h=Math.round(w*2/3),options={transparent:$('transparent').checked,animated:format==='animated'};
        if(format==='svg'||format==='animated')download(new Blob([svg(state,w,h,options)],{type:'image/svg+xml'}),filename+(format==='animated'?'-animated':'')+'.svg');
        else{const out=document.createElement('canvas');out.width=w;out.height=h;render(out,{...state,motion:false},options);const blob=await new Promise(resolve=>out.toBlob(resolve,'image/png'));if(!blob)throw Error('Encoding failed');download(blob,filename+'.png')}
      }
      $('export-dialog').close();notify('Your mountain is ready. Make something great.');
    }catch(error){notify('Could not export. Please try a smaller size.');console.error(error)}finally{button.disabled=false;button.innerHTML='Download mountain <span>↓</span>'}
  });
  const importInput=document.createElement('input');importInput.type='file';importInput.accept='.json,application/json';importInput.hidden=true;document.body.append(importInput);$('import-settings').addEventListener('click',()=>importInput.click());
  importInput.addEventListener('change',async()=>{try{const data=JSON.parse(await importInput.files[0].text());if(data.application!=='ALPIC LINES')throw Error('Wrong application');const restored=validate(data);checkpoint();state=restored;time=0;start=performance.now();sync();invalidate();$('export-dialog').close();notify('Your study, just where you left it.')}catch{notify('Choose a valid ALPIC settings file.')}finally{importInput.value=''}});
})();
