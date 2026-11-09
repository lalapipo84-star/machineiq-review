const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(app,file),'utf8');
class Clock extends Date{constructor(...args){super(...(args.length?args:['2026-09-30T18:10:00+09:00']));}static now(){return new Date('2026-09-30T18:10:00+09:00').getTime();}}
const context=vm.createContext({window:{},Date:Clock,Intl});
for(const file of ['web-contracts.generated.js','model.js'])vm.runInContext(read(file),context);
const M=context.window.CustomerPrototype,fleet=context.window.MIQ_MOCK_DATA.fleet,rows=M.buildVehicles(fleet);
const harnessSource=fs.readFileSync(path.join(__dirname,'helpers/customer-mobile-harness.js'),'utf8');
const harness=vm.runInNewContext('('+harnessSource.slice(harnessSource.indexOf('function harness('))+')',{vm,URL,URLSearchParams,M,fleet,read});
let checks=0;
for(const role of ['customer_owner','customer_staff']){
  const screen=harness('#summary?role='+role),beforeUrl=screen.url(),beforeHtml=screen.html();
  const buttons=[...beforeHtml.matchAll(/<button\b[^>]*class="summary-map-button"[^>]*data-map="[^"]+"[^>]*>/g)];
  const ids=buttons.map(([tag])=>tag.match(/data-map="([^"]+)"/)[1]);
  assert(ids.length>0);assert.equal(ids.length,new Set(ids).size);
  let depth=0;for(const tag of beforeHtml.match(/<\/?button\b[^>]*>/g)||[]){if(tag.startsWith('</'))depth--;else{assert.equal(depth,0,'No nested map/detail buttons');depth++;}}assert.equal(depth,0);
  for(const [tag] of buttons){
    const id=tag.match(/data-map="([^"]+)"/)[1],v=rows.find(v=>v.equipmentId===id);
    assert(v);assert(M.scope(rows,{role}).some(row=>row.equipmentId===id));
    assert(!tag.includes(' disabled'),'Every icon responds, including missing-position feedback');
    screen.click({map:id},'data-map');
    assert.equal(screen.url(),beforeUrl,'Map must not navigate/change filters');
    assert.equal(screen.html(),beforeHtml,'Summary must not rerender');
    if(v.position){
      assert.equal(screen.node('#location-dialog').open,true);
      assert.equal(screen.node('#location-dialog-title').textContent,v.equipmentNumber);
      const latest=screen.mapCalls.filter(([kind])=>kind==='open').at(-1)[1];
      assert.equal(latest.equipmentNumber,v.equipmentNumber);assert.equal(latest.lat,v.position.lat);assert.equal(latest.lng,v.position.lng);
      screen.click({},'data-close-map');assert.equal(screen.node('#location-dialog').open,false);
    }else {
      assert.equal(screen.node('#location-dialog').open,true);
      assert.equal(screen.node('#location-dialog-address').textContent,'위치 정보 없음');
      assert(screen.node('#location-map-status-text').textContent.includes('좌표가 수신되지'));
      assert.equal(screen.node('#location-map').hidden,true);assert.equal(screen.node('#location-map-expand').hidden,true);
      screen.click({},'data-close-map');
    }
    checks++;
  }
  const positioned=rows.find(v=>ids.includes(v.equipmentId)&&v.position);
  assert(positioned);
  const missing=screen.mapCalls.filter(([kind])=>kind==='open').length;
  screen.click({map:'outside-company-vehicle'},'data-map');assert.equal(screen.mapCalls.filter(([kind])=>kind==='open').length,missing);
  const other=rows.find(v=>ids.includes(v.equipmentId)&&v.equipmentId!==positioned.equipmentId);
  const filtered=harness('#summary?role='+role+'&listVehicle='+other.equipmentId);
  filtered.click({map:positioned.equipmentId},'data-map');assert(!filtered.node('#location-dialog').open,'No map outside current list selection');
  const invalid=harness('#summary?role='+role,{[positioned.equipmentId]:{position:{lat:91,lng:127}}});
  invalid.click({map:positioned.equipmentId},'data-map');assert(invalid.node('#location-dialog').open,'Invalid coordinates show explicit feedback');assert(!invalid.mapCalls.some(([kind])=>kind==='open'),'Invalid coordinates never reach map provider');
  let restored=null;
  const trigger={dataset:{map:positioned.equipmentId},hasAttribute:key=>key==='data-map',isConnected:true,focus:options=>{restored=options;}};
  screen.listeners.click({target:{closest:()=>trigger}});screen.click({},'data-close-map');assert.equal(restored?.preventScroll,true);
  screen.click({vehicle:positioned.equipmentId});assert(screen.url().includes('#detail?'),'Existing vehicle title/detail action remains');
}
const css=read('customer.css');assert(css.includes('gap:2px; height:24px'));assert(css.includes('width:44px; height:44px'));assert(css.includes('width:20px; height:20px'));
console.log('PASS HTML summary map: '+checks+' authorized cards; independent icon, direct per-vehicle popup, missing/invalid position, filtered/out-of-scope IDs, unchanged route/filter/results, close focus and detail navigation.');
