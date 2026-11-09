// Standalone, read-only local preview. No build step or dependency installation.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
  const fail=code=>{res.writeHead(code);res.end();};
  if(!['GET','HEAD'].includes(req.method))return fail(405);
  try{
    const raw=decodeURIComponent(req.url.split('?')[0]);
    if(raw==='/'){res.writeHead(302,{Location:'./login.html'});return res.end();}
    if(raw.includes('\\')||raw.split('/').some(p=>p.startsWith('.')))return fail(403);
    const file=fs.realpathSync(path.resolve(root,'.'+raw)),type=mime[path.extname(file)];
    if(!file.startsWith(root+path.sep)||!type)return fail(403);
    const info=fs.statSync(file);if(!info.isFile())return fail(404);
    res.writeHead(200,{'Content-Type':type,'Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
  }catch{fail(404);}
});
if(require.main===module){
  const port=Number(process.argv[2]||8806);
  server.listen(port,'127.0.0.1',()=>console.log(`MACHINE IQ mobile: http://localhost:${port}/login.html`));
  server.on('error',e=>{console.error(e.message);process.exitCode=1;});
}
module.exports=server;
