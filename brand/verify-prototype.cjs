const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const files=['templates.js','editions.js','spatial.js','engine.js'];
const original={window:{}},landing={window:{}};
for(const file of files){
  const source=fs.readFileSync(path.join(__dirname,'../mountain-playground/dist',file),'utf8');
  const copy=fs.readFileSync(path.join(__dirname,'dist/prototype',file),'utf8');
  // The studio engine has since gained Data presets; compare its Grand Alpine
  // behavior below while retaining byte equality for the shared preset libraries.
  if(file!=='engine.js')assert.equal(copy,source,`${file} must stay identical to the local prototype`);
  vm.runInNewContext(source,original);vm.runInNewContext(copy,landing);
}
const recipe=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/prototype/grand-alpine.json'),'utf8'));
assert.equal(recipe.preset,20,'Preset 21 is zero-indexed as 20');
const a=original.window.Mountain,b=landing.window.Mountain,ga=a.shape(recipe),gb=b.shape(recipe);
assert.equal(JSON.stringify(ga),JSON.stringify(gb),'The exact points, connections, and primary ridges are preserved');
assert.equal(gb.active.length,86);assert.equal(gb.edges.length,174);
for(const time of [0,3,6,9,12])assert.equal(JSON.stringify(a.project(ga.points,recipe,1759,856,time)),JSON.stringify(b.project(gb.points,recipe,1759,856,time)),'Every animation sample matches the prototype');
console.log('Verified: preset 21, 86 squares, 174 lines; shared preset libraries, Grand Alpine geometry, and motion match the local prototype exactly.');
