const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const read=file=>fs.readFileSync(path.join(app,file),'utf8');
class Clock extends Date {constructor(...args){super(...(args.length?args:['2026-09-20T09:37:00+09:00']));}static now(){return new Date('2026-09-20T09:37:00+09:00').getTime();}}
const ctx=vm.createContext({window:{},Date:Clock,Intl});
for(const file of ['data/fleet.generated.js','web-contracts.generated.js','demo-data.generated.js','model.js'])vm.runInContext(read(file),ctx);
const M=ctx.window.CustomerPrototype,rows=M.buildVehicles(ctx.window.MIQ_MOCK_DATA.fleet);
const apiContext={module:{exports:{}},URLSearchParams};
vm.runInNewContext(read('home-view.js'),apiContext);
const api=apiContext.module.exports;
assert(read('index.html').includes('data-dashboard-mode="main"'));
const entry=read('index.html');
function versionedAsset(file){
  const refs=[...entry.matchAll(/(?:src|href)="([^"?#]+)\?v=([^"]+)"/g)].filter(m=>m[1]==='./'+file);
  assert.equal(refs.length,1,'One active '+file);
  assert(/^\d{8}-(?:r\d+|\d+)(?:[-\w]*)$/.test(refs[0][2]),'Versioned '+file);
}
for(const file of ['owner-dashboard-preview.css','home-view.js','model.js','web-contracts.generated.js'])versionedAsset(file);
const release=JSON.parse(read('release.json')).revision.replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1$2$3');
assert(read('index.html').includes('customer.js?v='+release));
assert(read('index.html').includes('customer.css?v='+release));
assert(!read('index.html').includes('owner-dashboard-preview.js'));
if(fs.existsSync(path.join(app,'dashboard-backup-20260919.html')))assert(read('dashboard-backup-20260919.html').includes('./archive/dashboard-20260919/customer.js'));
for(const name of ['auth.js','auth.css','signup-example.js','review.html','owner-dashboard-preview.js','group-cards-preview.js','group-cards-preview.css','lithium-status-model.js'])assert(!fs.existsSync(path.join(app,name)),'No retired source in active delivery: '+name);
for(const role of ['customer_owner','customer_staff']){
  const data=api.build(M,rows,role),scoped=M.scope(rows,{role}),counts=M.counts(scoped);
  for(const key of ['total','running','error','due','soon'])assert.equal(data.all[key],counts[key],role+' '+key);
  const html=api.render(M,data,'work','main');
  assert(!html.includes('프로토타입 데이터'));
  assert.equal((html.match(/class="od-issue[ "']/g)||[]).length,3);
  assert.equal(data.trend.length,7);
  for(const day of data.trend){
    const report=M.efficiencyPerformance(scoped,day.day,day.day,{period:'d'});
    assert.equal(day.work,report.work);assert.equal(day.idle,report.idle);
  }
  if(role==='customer_staff'){
    assert(data.groups.every(g=>g.group===M.assignedGroup(role)));
    assert(!/내 그룹 작업 현황|od-groups|data-owner-sort/.test(html));
    assert(/class="dashboard-panel od-today"[\s\S]*?<\/section>\s*<section class="dashboard-panel od-trend">/.test(html));
  }else assert(html.includes('그룹별 운영 비교'));
}
assert.equal(M.fleetState(null).available,false);
assert.equal(M.fleetState({vehicles:[]}).available,true);
assert.equal(M.supplySummary([{supplies:null}]).due,null);
assert.equal(M.supplySummary([{supplies:[]}]).due,0);
assert.equal(M.supplyItems({equipmentId:'missing',supplies:[null]})[0].key,'unknown');
assert(read('customer.js').includes('data-retry-data'));
assert(read('customer.js').includes("['maintenance','수리이력','clipboard-check']"));
const manifest=JSON.parse(read('manifest.json'));
assert.equal(fs.existsSync(path.join(app,'map-config.local.js')),manifest.mapMode==='embedded-google');
assert(read('owner-dashboard-preview.css').includes('button.od-text-link:hover:not(:active):not(:disabled) { background:transparent; border-color:transparent; color:var(--linq-color-brand); }'));
console.log('PASS public dashboard: adopted main, owner/staff data scope, seven-day report parity, backup, removed footer, text-only hover, explicit map configuration policy.');
