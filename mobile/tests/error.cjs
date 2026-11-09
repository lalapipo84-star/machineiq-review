const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(app,'customer.js'),'utf8');
const catalogSource=fs.readFileSync(path.join(app,'error-documents.js'),'utf8');
const fleetPath=fs.existsSync(path.join(app,'data/fleet.generated.js'))?path.join(app,'data/fleet.generated.js'):path.resolve(app,'../../final-implementation/fleet-customer-requested-260813/_mock-data/generated/fleet.generated.js');
const ctx=vm.createContext({window:{},Date});
vm.runInContext(fs.readFileSync(fleetPath,'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(app,'web-contracts.generated.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(app,'model.js'),'utf8'),ctx);
vm.runInContext(catalogSource,ctx);
const M=ctx.window.CustomerPrototype,fleet=ctx.window.MIQ_MOCK_DATA.fleet;
const rows=M.buildVehicles(fleet),records=M.serviceRecords(rows,{kind:'error',from:M.dates('m')[0],to:M.TODAY});
const yesterday=M.web.common.dates.format(M.web.common.dates.yesterday(new Date()));
// Yesterday's records belong to the previous month on its first day; the selected month excludes them.
const expectedRows=M.web.demo.create(rows,yesterday).error.concat(M.web.demo.create(rows,M.TODAY).error.filter(r=>r.dateTime<M.SNAPSHOT))
  .filter(r=>r.date>=M.dates('m')[0]&&r.date<=M.TODAY);
assert.equal(records.length,expectedRows.length);assert(records.every(r=>r.code&&r.description));assert(records.some(r=>r.code==='DEMO-LI-01'));
const reference=ctx.window.CustomerErrorDocuments.p0003;
const bytes=Buffer.from(reference.base64,'base64');assert(bytes.subarray(0,5).toString()==='%PDF-');assert(bytes.subarray(-8).toString().includes('%%EOF'));
const rawHarness=fs.readFileSync(path.join(__dirname,'helpers/customer-mobile-harness.js'),'utf8');
const start=rawHarness.indexOf('function harness('),end=rawHarness.length;
const read=f=>f==='customer.js'?catalogSource+'\n'+source:fs.readFileSync(path.join(app,f),'utf8');
const harness=vm.runInNewContext('('+rawHarness.slice(start,end<0?undefined:end)+')',{vm,URL,URLSearchParams,M,fleet,read});
const h=harness('#services?service=error');
assert.equal((h.html().match(/data-error-record=/g)||[]).length,records.length);
assert.equal((h.html().match(/class="error-pdf-download"/g)||[]).length,records.length);
assert.equal((h.html().match(/class="error-pdf-missing"/g)||[]).length,0);
const catalog=ctx.window.CustomerErrorDocuments;
assert.equal(Object.keys(catalog).length,10);
for(const record of M.serviceHistory(rows).filter(r=>r.kind==='error')){
  const pdf=catalog[record.pdfKey||record.code.toLowerCase()];
  assert(pdf,'Missing PDF for '+record.code);assert.equal(pdf.code,record.code);
  const data=Buffer.from(pdf.base64,'base64');assert.equal(data.subarray(0,5).toString(),'%PDF-');
  assert(data.subarray(-8).toString().includes('%%EOF'));assert(pdf.filename.endsWith('.pdf'));
}
assert(!h.html().includes('data-kind="error"'),'No error row detail navigation');
assert(!h.html().includes('data-lucide="chevron-right"'),'No detail chevrons in error tab');
const historical=harness('#services?service=error&servicePeriod=c&serviceFrom=2026-07-01&serviceTo=2026-07-31');
assert(historical.html().includes('download="'+reference.filename+'"'));assert(historical.html().includes('data:application/pdf;base64,'+reference.base64));assert(!historical.html().includes('시연 자료'));
assert(h.html().includes('SPN'));assert(h.html().includes('FMI'));
for(const role of ['customer_owner','customer_staff']){
  const scoped=harness('#services?service=error&role='+role);
  const allowed=M.scope(rows,{role});
  const expected=M.serviceRecords(allowed,{kind:'error',from:M.dates('m')[0],to:M.dates('m')[1]});
  assert.equal((scoped.html().match(/data-error-record=/g)||[]).length,expected.length);
  const old=harness('#error?equipmentId=demo-equipment-01&role='+role);
  assert(old.url().includes('#services?')&&old.url().includes('service=error'));
  assert(!old.html().includes('data-screen-id="LQ-SVC-004"'));
}
const outside=harness('#error?equipmentId=not-accessible');
assert(outside.html().includes('해당 내역이 없습니다.'));assert(!outside.html().includes('error-pdf-download'));
const inbox=harness('#notifications');
const push=M.pushHistory(M.scope(rows,{role:'customer_owner',group:''})).find(e=>M.pushPresentation(e).view==='error');
inbox.click({notificationEntry:push.id});assert(inbox.url().includes('#services?'));
assert(inbox.url().includes('serviceEquipmentId='+push.equipmentId));
assert(inbox.url().includes('serviceFrom='+push.pushDatetime.slice(0,10)));
assert(inbox.url().includes('returnView=notifications'));
const maint=harness('#services?service=maintenance');assert(maint.html().includes('data-kind="maintenance"'));
// Missing/malformed registered documents must never produce a download icon.
const documentFunction=source.slice(source.indexOf('  function errorDocument('),source.indexOf('  function errorRow('));
const lookup=vm.runInNewContext('('+documentFunction+')',{window:{CustomerErrorDocuments:{good:reference,bad:{...reference,base64:'bad'},wrong:{...reference,code:'OTHER'}}}});
for(const pdfKey of [null,'missing','bad','wrong','toString'])assert.equal(lookup({pdfKey,code:'P0003'}),null);
assert(lookup({pdfKey:'good',code:'P0003'}));
const fallback=vm.runInNewContext('('+documentFunction+')',{window:{CustomerErrorDocuments:catalog}});
assert(fallback({code:'A7',pdfKey:null}));assert(fallback({code:'DEMO-LI-01'}));
assert.equal(fallback({code:'UNKNOWN'}),null);assert.equal(fallback({code:'toString'}),null);
assert.equal(fallback({code:'P0003',pdfKey:'missing'}),null);
console.log('PASS: error list only; PDF existence/code validation; offline PDF bytes; no detail route; notification scope/date; roles and maintenance preserved.');
