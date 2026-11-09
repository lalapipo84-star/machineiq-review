const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.resolve(__dirname,'..'),shared=path.resolve(app,'../../final-implementation/fleet-customer-requested-260813');
const packaged=fs.existsSync(path.join(app,'data/fleet.generated.js'));
const fleetSource=fs.readFileSync(packaged?path.join(app,'data/fleet.generated.js'):path.join(shared,'_mock-data/generated/fleet.generated.js'),'utf8');
const ctx=vm.createContext({window:{},Date});vm.runInContext(fleetSource,ctx);vm.runInContext(fs.readFileSync(path.join(app,'web-contracts.generated.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(app,'model.js'),'utf8'),ctx);
assert.equal(ctx.window.CustomerWebContracts.lithium,ctx.window.MIQLithiumListModel,'One shared battery model, no stale second copy');
const M=ctx.window.CustomerPrototype,fleet=ctx.window.MIQ_MOCK_DATA.fleet,rows=M.buildVehicles(fleet);
for(const [g,key] of [[1.19,null],[1.2,'s3'],[1.79,'s3'],[1.8,'s4'],[2.49,'s4'],[2.5,'s5'],[8,'s5'],[null,null],[NaN,null]])assert.equal(M.shockLevel(g),key);
for(const [from,to,hours] of [[22,6,8],[8,18,10],[0,0,24],[23,23,24],[23,22,23]])assert.equal(M.chargeWindow(from,to).duration,hours);
for(const value of [null,'',undefined,true,-1,24,1.5,'bad'])assert.equal(M.chargeWindow(value,6),null);
for(const v of rows){
  const month=M.metrics(v,'2026-08-01','2026-08-31'),sum={s3:0,s4:0,s5:0};
  if(!month)continue;
  assert.equal(Object.values(month.shockBands).reduce((a,b)=>a+b,0),month.shock);
  const web=M.web.shocks([v],'m','2026-08-01','2026-08-31');
  for(const key of Object.keys(sum))sum[key]=web.series[key].reduce((a,b)=>a+b,0);
  assert.equal(JSON.stringify(sum),JSON.stringify(month.shockBands),'Use the web period series, not a separate mobile allocation');
  const current=M.metrics(v,M.dates('m')[0],M.TODAY);
  if(current)assert.equal(Object.values(current.shockBands).reduce((a,b)=>a+b,0),current.shock);
}
const harnessSource=fs.readFileSync(path.join(__dirname,'helpers/customer-mobile-harness.js'),'utf8');
const start=harnessSource.indexOf('function harness('),end=harnessSource.length;
const read=f=>fs.readFileSync(path.join(app,f),'utf8');
const harness=vm.runInNewContext('('+harnessSource.slice(start,end<0?undefined:end)+')',{vm,URL,URLSearchParams,M,fleet,read});
const h=harness('#detail?equipmentId=demo-equipment-01');
assert.match(h.html(),/<dt class="metric-label-with-help"><span>충격<\/span><button[^>]*shock-level-help-trigger/);
assert.equal((h.html().match(/id="shock-level-help-trigger"/g)||[]).length,1);
assert.equal((h.html().match(/class="source-note charge-feedback"/g)||[]).length,1);
assert.match(h.html(),/<div class="charge-save-row"><p class="source-note charge-feedback"/);
assert(h.html().includes('lithium-state-item is-danger'));assert(h.html().includes('전일 22:00 → 금일 06:00 · 8시간'));
assert(h.html().includes('충격 강도별 건수'));
const store=new Map();h.context.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const hour=(name,value)=>h.listeners.change({target:{dataset:{chargeHour:name},value:String(value),hasAttribute:()=>false}});
const enabled=on=>h.listeners.change({target:{dataset:{},checked:on,hasAttribute:k=>k==='data-charge-enabled'}});
hour('from',8);hour('to',18);assert(h.html().includes('금일 08:00 → 금일 18:00 · 10시간'));assert.equal(store.size,0);
h.click({},'data-save-charge');assert.equal(store.size,1);assert(h.html().includes('저장했습니다.'));
hour('to',8);assert(h.html().includes('24시간'));h.click({},'data-save-charge');
enabled(false);assert(h.html().includes('스마트 충전 꺼짐'));h.click({},'data-save-charge');
const saved=JSON.parse([...store.values()][0]);assert.equal(saved.on,false);
h.open('detail?equipmentId=demo-equipment-04');assert(h.html().includes('전일 22:00 → 금일 06:00'));
h.open('detail?equipmentId=demo-equipment-01');assert(h.html().includes('스마트 충전 꺼짐'),'Saved settings isolated per vehicle');
enabled(true);h.context.localStorage.setItem=()=>{throw Error('blocked');};h.click({},'data-save-charge');assert(h.html().includes('저장하지 못했습니다.'));
for(const id of ['demo-equipment-02','demo-equipment-03','demo-equipment-12']){
  const non=harness('#detail?equipmentId='+id);assert(!non.html().includes('data-save-charge'));assert(!non.html().includes('lithium-state-grid'));non.click({},'data-save-charge');
}
for(const soc of [null,NaN,-1,101]){const missing=harness('#detail?equipmentId=demo-equipment-01',{'demo-equipment-01':{soc}});assert(missing.html().includes('lithium-state-item is-unknown'));assert(missing.html().includes('data-save-charge disabled'));}
const chargeFault=harness('#detail?equipmentId=demo-equipment-07');assert(chargeFault.html().includes('이상'));assert(chargeFault.html().includes('주의'));assert(chargeFault.html().includes('마지막 수신'));
const outside=harness('#detail?equipmentId=demo-equipment-08&role=customer_staff');assert(!outside.html().includes('data-save-charge'));
const battery=harness('#battery?equipmentId=demo-equipment-01');assert(battery.html().includes('data-save-charge'));assert(battery.html().includes('리튬 배터리 상태'));
const lead=harness('#battery?equipmentId=demo-equipment-12');assert(lead.html().includes('충전 예약'));assert(!lead.html().includes('data-save-charge'));
const shock=harness('#shock?equipmentId=demo-equipment-04&period=m&from=2026-08-01&to=2026-08-31');for(const key of ['is-s3','is-s4','is-s5'])assert(shock.html().includes(key));
console.log('PASS: web battery states; unknown/stale data; lithium-only charge; on/off, overnight, 24h, save/failure, scope; shock thresholds and sum consistency.');
