import './preview-data-fields.js';
// Illustrative product data from the Figma section; these previews never call a backend.
const section=document.querySelector('.agent-readiness');
const pixels=section.querySelector('.traffic-pixels');
const heights=[2,3,2,4,3,4,3,5,4,5,4,6,5,6,5,7,6,8,7,8,7,9,8,10,9,11,10,12,11,12,12,13,13];
function drawTraffic(period){
  const fragment=document.createDocumentFragment();
  heights.forEach((height,index)=>{
    const column=document.createElement('span');column.className='traffic-column';
    const count=period==='7'?Math.max(2,height-3+(index%3)):height;
    for(let y=0;y<count;y++)column.append(document.createElement('i'));
    fragment.append(column);
  });pixels.replaceChildren(fragment);
  section.querySelector('[data-visits]').textContent=period==='7'?'7.4k':'28.6k';
  section.querySelector('[data-completed]').textContent=period==='7'?'89%':'86%';
  section.querySelector('[data-growth]').textContent=period==='7'?'+22%':'+41%';
  section.querySelector('[data-growth-label]').textContent=period==='7'?'vs last week':'vs last month';
  section.querySelector('.traffic-preview').setAttribute('aria-label',`Illustrative traffic for the last ${period} days: ${period==='7'?'7.4 thousand visits, 89 percent tasks completed':'28.6 thousand visits, 86 percent tasks completed'}`);
}
section.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{
  section.querySelectorAll('[data-period]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  drawTraffic(button.dataset.period);
}));
drawTraffic('30');
const patterns=['pfppppfpppfpww','ppppffppppppww','pfpfpfpfppppww','pppfpppffpppww'];
const matrix=section.querySelector('.test-matrix');
['Claude','ChatGPT','Cursor','Codex'].forEach((agent,row)=>{
  const line=document.createElement('div');line.className='test-row';
  const label=document.createElement('span');label.textContent=agent;
  const squares=document.createElement('span');squares.className='test-squares';squares.setAttribute('aria-hidden','true');
  [...patterns[row]].forEach(state=>{const square=document.createElement('i');square.className='test-square'+(state==='f'?' fail':state==='w'?' pending':'');square.dataset.result=state;squares.append(square)});
  line.append(label,squares);matrix.append(line);
});
const run=section.querySelector('[data-run-demo]'),status=section.querySelector('[data-run-status]');
let running=false;
run.addEventListener('click',async()=>{
  if(running)return;running=true;run.disabled=true;run.textContent='Running…';status.textContent='Running 56 demo checks';
  const squares=[...matrix.querySelectorAll('.test-square')];squares.forEach(square=>square.className='test-square pending');
  for(let index=0;index<squares.length;index++){
    const square=squares[index];square.className='test-square running';
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await new Promise(resolve=>setTimeout(resolve,28));
    square.className='test-square'+(square.dataset.result==='f'?' fail':'');
  }
  const failed=squares.filter(square=>square.dataset.result==='f').length;status.textContent=`Demo complete · ${squares.length-failed} passed / ${failed} failed`;run.disabled=false;run.textContent='Run again';running=false;
});
const fix=section.querySelector('[data-apply-fix]');
fix.addEventListener('click',()=>{
  const fixed=fix.getAttribute('aria-pressed')!=='true';fix.setAttribute('aria-pressed',String(fixed));
  section.querySelector('.trace-error').classList.toggle('is-fixed',fixed);
  section.querySelector('[data-trace-message]').textContent=fixed?'Created the project':'No API key in the docs';
  fix.querySelector('b').textContent=fixed?'DONE':'FIX';
  fix.querySelector('span').textContent=fixed?'Demo fixed · reset preview':'Add API key step to /docs';
  section.querySelector('[data-fix-status]').textContent=fixed?'Demo fix applied. The agent created the project.':'Demo reset. The docs never mention an API key.';
});
