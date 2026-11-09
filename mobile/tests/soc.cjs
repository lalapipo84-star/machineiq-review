const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(app,'customer.js'),'utf8');
const declaration=source.match(/const socLevel = ([^\n]+);/)[1];
const level=vm.runInNewContext('('+declaration+')');
const battery=vm.runInNewContext('('+source.match(/const batteryIcon = ([^\n]+);/)[1]+')',{socLevel:level,icon:name=>'<i data-lucide="'+name+'"></i>'});
for(const type of ['리튬','납산'])for(const [soc,expected] of [[0,'low'],[29.99,'low'],[30,'medium'],[59.99,'medium'],[60,'high'],[100,'high']]){
  assert.equal(level({type,soc}),expected);
  const svg=battery({type,soc});assert(svg.includes('data-soc-level="'+expected+'"'));
  assert(svg.includes('class="battery-soc-fill" x="4" y="9" width="12" height="6"'),'Constant interior size at every SOC');
  assert(!svg.includes('%')&&!svg.includes('style='),'No percent-proportional fill');
}
for(const type of ['리튬','납산'])for(const soc of [null,undefined,NaN,-1,101,'80'])assert.equal(level({type,soc}),'');
for(const type of ['엔진','수소'])assert.equal(battery({type,soc:80}),'<i data-lucide="battery"></i>');
const fleetPath=fs.existsSync(path.join(app,'data/fleet.generated.js'))?path.join(app,'data/fleet.generated.js'):path.resolve(app,'../../final-implementation/fleet-customer-requested-260813/_mock-data/generated/fleet.generated.js');
const c=vm.createContext({window:{},Date});vm.runInContext(fs.readFileSync(fleetPath,'utf8'),c);vm.runInContext(fs.readFileSync(path.join(app,'web-contracts.generated.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(app,'model.js'),'utf8'),c);
const lead=c.window.CustomerPrototype.buildVehicles(c.window.MIQ_MOCK_DATA.fleet).find(v=>v.equipmentNumber==='FBA18_DEMO_CS02');
assert.equal(lead.type,'납산');assert.equal(lead.soc,46);assert.equal(level(lead),'medium');assert(battery(lead).includes('width="12" height="6"'));
assert(source.includes('${batteryIcon(v)}<strong>${value}</strong>'),'Plain numeric text in summary');
assert(!source.includes('socAttributes')&&!source.includes('battery-soc-value'));
const css=fs.readFileSync(path.join(app,'customer.css'),'utf8');
for(const [band,color] of [['high','#37b24d'],['medium','#f59f00'],['low','var(--linq-color-danger)']])assert(css.includes('.battery-soc-icon[data-soc-level="'+band+'"] .battery-soc-fill { fill:'+color+'; }'));
assert(!css.includes('battery-soc-value'));
console.log('PASS: lithium and lead-acid fixed interior color bands; FBA18_DEMO_CS02 46% medium; neutral numbers; invalid values unchanged.');
