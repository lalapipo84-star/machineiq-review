const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const manifest=JSON.parse(read('manifest.json'));
for(const item of manifest.files){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,item.path))).digest('hex'),item.sha256,item.path);
  if(item.path.endsWith('.js'))new vm.Script(read(item.path),{filename:item.path});
  if(!/\.(html|css)$/.test(item.path))continue;
  const refs=item.path.endsWith('.html')?Array.from(read(item.path).matchAll(/(?:href|src)="([^"]+)"/g),m=>m[1]):Array.from(read(item.path).matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g),m=>m[1]);
  for(const ref of refs){
    if(/^(https?:|#|data:|mailto:)/.test(ref))continue;
    const target=path.resolve(path.dirname(path.join(root,item.path)),ref.split(/[?#]/)[0]);
    assert(target.startsWith(root+path.sep),'Dependency leaves mobile: '+ref);
    assert(fs.existsSync(target),'Missing dependency: '+ref);
  }
}
const ctx=vm.createContext({window:{},Date});
vm.runInContext(read('data/fleet.generated.js'),ctx);vm.runInContext(read('web-contracts.generated.js'),ctx);vm.runInContext(read('model.js'),ctx);
const M=ctx.window.CustomerPrototype,rows=M.buildVehicles(ctx.window.MIQ_MOCK_DATA.fleet);
assert.equal(rows.length,13,'Current customer demo fleet');
for(const role of Object.keys(M.ROLE_LABELS)){
  const scoped=M.scope(rows,{role}),messages=M.pushHistory(scoped);
  assert(messages.every(m=>scoped.some(v=>v.equipmentId===m.equipmentId)));
  assert(M.counts(scoped).total===scoped.length);
}
assert(read('signup.html').includes('name="signupRole"'));
assert(read('index.html').includes('data-screen-id="LQ-SVC-003-P02"'));
const withMap=manifest.mapMode==='embedded-google';
assert(!manifest.files.some(item=>/\.env(?:\.|$)/.test(item.path)));
assert.equal(fs.existsSync(path.join(root,'map-config.local.js')),withMap,'Only explicit map-enabled builds may contain a browser key');
if(withMap){
  assert.equal(manifest.containsBrowserMapKey,true);
  const configContext={window:{}};vm.runInNewContext(read('map-config.local.js'),configContext);
  const config=configContext.window.CustomerMapConfig;
  assert.deepEqual(Object.keys(config).sort(),['apiKey','mapId']);
  assert(/^AIza[\w-]{35}$/.test(config.apiKey));assert(/^[-\w]+$/.test(config.mapId));
  assert(read('location-map.js').includes('maps.googleapis.com/maps/api/js'));
  assert(read('README.md').includes('docs/map-setup.md'));
}else assert(!read('location-map.js').includes('maps.googleapis.com/maps/api/js'));
for(const item of manifest.files.filter(item=>/\.(?:js|cjs|html|css|json|md)$/.test(item.path))){
  const content=read(item.path);
  assert(!/gh[pousr]_[\w]{25,}|-{5}BEGIN.*PRIVATE KEY/.test(content),'No server credentials in delivery');
  if(item.path!=='map-config.local.js')assert(!/AIza[\w-]{25,}/.test(content),'Browser key confined to explicit config: '+item.path);
}
assert(read('customer.js').includes('data-logout')&&read('customer.js').includes('data-notification-category'));
assert(!read('customer.js').includes('localhost:'));
for(const file of ['index.html','customer.js','signup.html','signup.js']) {
  assert(!/miqlocation:|installMachineIQLocation|QR 검색|getUserMedia|BarcodeDetector/.test(read(file)), 'QR test must remain APK-only: '+file);
}
assert(!manifest.files.some(item=>/location-ui\.js|QrScanActivity|zxing/i.test(item.path)), 'No native QR implementation in HTML delivery');
const server=require('../serve.cjs');
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const start=await fetch(base+'/',{redirect:'manual'});assert.equal(start.status,302);assert.equal(start.headers.get('location'),'./login.html');
    for(const file of ['login.html','index.html','signup.html','find-password.html','customer.js','assets/local-fonts.css','shared/bobcat-machine-iq.svg','data/fleet.generated.js'])assert.equal((await fetch(base+'/'+file)).status,200,file);
    assert.equal((await fetch(base+'/map-config.local.js')).status,withMap?200:404);
    assert.equal((await fetch(base+'/manifest.json')).status,403);
    assert.equal((await fetch(base+'/login.html',{method:'POST'})).status,405);
    console.log('PASS: packaged checksums, syntax, all local assets, vehicle scopes and local HTTP routes.');
  }finally{server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
