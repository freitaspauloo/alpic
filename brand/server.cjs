const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'dist');
const settingsFile=path.join(root,'studio-settings.json');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json; charset=utf-8'};
const ids=new Set(['mountain','background','dither']);

function readBody(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    let size=0;
    req.on('data',chunk=>{size+=chunk.length;if(size>1_000_000){reject(new Error('too large'));req.destroy();return}chunks.push(chunk)});
    req.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error',reject);
  });
}

function readSettings(){
  try{return JSON.parse(fs.readFileSync(settingsFile,'utf8'))}catch{return {}}
}

function saveSettings(id,state){
  const current=readSettings();
  current[id]={savedAt:new Date().toISOString(),state};
  fs.writeFileSync(settingsFile,JSON.stringify(current,null,2)+'\n');
  return current[id];
}

http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='POST'&&url.pathname==='/studio-settings'){
    try{
      const body=JSON.parse(await readBody(req));
      if(!ids.has(body.id)||!body.state||typeof body.state!=='object'){res.writeHead(400);res.end('Bad settings');return}
      const saved=saveSettings(body.id,body.state);
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
      res.end(JSON.stringify(saved));
    }catch{res.writeHead(400);res.end('Bad settings')}
    return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return}
  let pathname=decodeURIComponent(url.pathname);
  if(pathname==='/mountain')pathname='/mountain/';
  if(pathname.endsWith('/'))pathname+='index.html';
  const filename=path.resolve(root,'.'+pathname);
  if(!filename.startsWith(root+path.sep)&&filename!==root){res.writeHead(403);res.end();return}
  fs.readFile(filename,(error,data)=>{
    if(error){res.writeHead(404);res.end('Not found');return}
    res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(4174,'127.0.0.1',()=>console.log('Alpic landing preview: http://127.0.0.1:4174'));
