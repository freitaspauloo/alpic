const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const context={window:{}};
for(const file of ['layer-transforms.js','dash-shuffle.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'dist',file),'utf8').replaceAll('export function','function'),context);
const {imageMatrix,transformPoint,placeGraphPoint,dashPhase,dashShuffleCanvas}=context;
const frame={left:100,top:50,width:400,height:300},origin={x:300,y:350};
const base=imageMatrix(frame,{},1000,600);
assert.deepEqual({...transformPoint({x:125,y:75},base)},{x:125,y:75},'Default image positioning is unchanged');
const image=imageMatrix(frame,{imageScale:200,imageOffsetX:10,imageOffsetY:-5},1000,600);
assert.deepEqual({...transformPoint(origin,image)},{x:400,y:320},'Scaling stays anchored at the mountain base, with independent image translation');
const input={x:350,y:300},placement={imageMatrix:image,scaleX:100,scaleY:100,rotation:0,offsetX:0,offsetY:0};
assert.deepEqual({...placeGraphPoint(input,origin,placement,1000,600)},{...transformPoint(input,image)},'Linked graph vertices follow the exact image matrix');
assert.deepEqual({...placeGraphPoint(input,origin,{...placement,imageMatrix:null},1000,600)},input,'An unlinked graph is independent of image placement');
const rotated=placeGraphPoint({x:310,y:350},origin,{scaleX:100,scaleY:100,rotation:90,offsetX:0,offsetY:0},1000,600);
assert(Math.abs(rotated.x-300)<1e-9&&Math.abs(rotated.y-360)<1e-9,'Graph rotation uses its own base pivot');
for(const speed of [.1,1,3]){const a=dashPhase(3,0,speed,70,12),b=dashPhase(3,12/speed,speed,70,12);assert(Math.abs((b-a)+12)<1e-8,'Dash shuffle loops seamlessly modulo its dash cycle')}
assert.notEqual(dashPhase(0,1,1,18,12),dashPhase(1,1,1,18,12),'Connections have different dash phases');
for(const file of ['templates.js','editions.js','spatial.js','engine.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'dist/prototype',file),'utf8'),context);
const recipe={...context.window.Mountain.defaults(20),motion:false,dot:0,lineStyle:'dashed'};
const graph={points:[{x:0,y:0},{x:1,y:1},{x:-1,y:.5}],edges:[[0,1],[0,2]],primary:[],active:[]};
function render(time){const strokes=[],raw={setLineDash(d){this.dash=d},beginPath(){},moveTo(x,y){this.start=[x,y]},lineTo(x,y){this.end=[x,y]},stroke(){strokes.push({start:this.start,end:this.end,offset:this.lineDashOffset,dash:this.dash})}},ctx=new Proxy(raw,{get:(o,k)=>k in o?o[k]:()=>{}}),canvas={width:1000,height:600,getContext:()=>ctx};context.window.Mountain.render(dashShuffleCanvas(canvas,time,recipe,9,7),recipe,{graph,transparent:true});return strokes}
const a=render(0),b=render(1);
assert.equal(a.length,2);assert.deepEqual(a.map(s=>[s.start,s.end]),b.map(s=>[s.start,s.end]),'Dash shuffle preserves junction and edge geometry');
assert(a.every((s,i)=>s.offset!==b[i].offset),'Every connection keeps animating');assert.deepEqual([...a[0].dash],[9,7],'Dash length and gap controls reach the renderer');
console.log('Verified: independent and linked positioning, image/base scaling, graph rotation, and continuous dash shuffle without geometry changes.');
