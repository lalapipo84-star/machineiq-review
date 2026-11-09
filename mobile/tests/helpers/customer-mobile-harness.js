// Shared isolated-DOM test harness. Loaded in a VM with explicit model, fleet and read dependencies.
function harness(hash='',vehicleOverrides={},model=M) {
  const nodes=new Map(),listeners={},windowEvents={};let current=new URL('http://localhost:8806/customer/mobile-prototype/index.html'+hash);
  const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{hidden:false,innerHTML:'',textContent:'',dataset:{},classList:{values:new Set(),toggle(k,on){const add=on??!this.values.has(k);if(add)this.values.add(k);else this.values.delete(k);return add;},remove(k){this.values.delete(k);},contains(k){return this.values.has(k);}},showModal(){this.open=true;},close(){this.open=false;listeners.close?.({target:this});},setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];},focus(){},hasAttribute(k){return k in this;}});return nodes.get(selector);};
  const nav=['home','summary','services','reports','settings'].map(route=>Object.assign(node('nav:'+route),{dataset:{route}}));
  const location={get pathname(){return current.pathname;},get hash(){return current.hash;},get search(){return current.search;},replace(value){current=new URL(value,current);}};
  const sessionValues=new Map([['linq-customer-prototype-authenticated-role','customer_owner'],['linq-customer-prototype-pending-signup','preserved'],['unrelated-key','preserved']]);
  const history={pushState(a,b,value){current=new URL(value,current);},replaceState(a,b,value){current=new URL(value,current);},back(){}};
  const runtimeModel={...model,buildVehicles:data=>model.buildVehicles(data).map(v=>({...v,...vehicleOverrides[v.equipmentId]}))};
  const mapCalls=[];
  const context=vm.createContext({URLSearchParams,FormData:class {constructor(form){this.values=form.values;}get(key){return this.values[key];}},location,history,sessionStorage:{getItem:key=>sessionValues.get(key)||null,removeItem:key=>sessionValues.delete(key)},document:{querySelector:node,querySelectorAll:s=>s==='.bottom-nav [data-route]'?nav:[],addEventListener(k,fn){listeners[k]=fn;}},window:{location,CustomerPrototype:runtimeModel,CustomerLocationMap:{open:v=>mapCalls.push(['open',v]),openFleet:(vehicles,options)=>mapCalls.push(['fleet',vehicles,options]),focus:id=>mapCalls.push(['focus',id]),close:()=>mapCalls.push(['close']),resize:()=>mapCalls.push(['resize'])},MIQ_MOCK_DATA:{fleet},lucide:{createIcons(){}},scrollTo(){},addEventListener(k,fn){windowEvents[k]=fn;}}});
  context.window.MIQLithiumListModel=runtimeModel.web?.lithium;
  const screenSource=read('customer.js');
  if(screenSource.includes('window.CustomerHomeView'))vm.runInContext(read('home-view.js'),context);
  if(screenSource.includes('window.CustomerQueryControls'))vm.runInContext(read('query-controls.js'),context);
  vm.runInContext(screenSource,context);
  const click=(dataset,attr)=>listeners.click({target:{closest:()=>({dataset,hasAttribute:k=>k===attr})}});
  return {node,click,context,mapCalls,html:()=>node('#main').innerHTML,url:()=>current.toString(),open(hash){current=new URL('#'+hash,current);windowEvents.popstate();},listeners};
}
