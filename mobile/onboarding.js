// Customer-mobile local onboarding only. No authentication/API or password storage.
(function(root){
  'use strict';
  const key='linq-customer-onboarding-v1';
  function create(storage){
    function read(){try{const data=JSON.parse(storage.getItem(key)||'null');return data&&data.profile&&['customer_owner','customer_staff'].includes(data.profile.role)&&typeof data.profile.userId==='string'?data:null;}catch{return null;}}
    function write(data){try{storage.setItem(key,JSON.stringify(data));return true;}catch{return false;}}
    const copy=value=>value?JSON.parse(JSON.stringify(value)):null;
    const serial=value=>String(value??'').trim().toUpperCase();
    return {
      current(){const data=read();return data?.active?copy(data.profile):null;},
      requests(){const data=read();return data?.active&&Array.isArray(data.requests)?copy(data.requests):[];},
      register(values){
        const profile={};for(const field of ['userId','email','name','company'])profile[field]=String(values[field]||'').trim();
        profile.role=values.role;profile.approvedVehicleCount=0;
        if(!['customer_owner','customer_staff'].includes(profile.role)||!profile.userId||!profile.company)return false;
        return write({profile,active:true,requests:[]});
      },
      login(identifier){const data=read();if(!data)return null;const id=String(identifier).trim().toLowerCase();data.active=[data.profile.userId,data.profile.email].some(value=>String(value||'').toLowerCase()===id);if(!write(data))return false;return data.active?copy(data.profile):null;},
      logout(){const data=read();return !data||write({...data,active:false});},
      requiresVehicle(){return this.current()?.approvedVehicleCount===0;},
      addRequest(record){
        const data=read();
        if(!data?.active||data.profile.role!=='customer_owner'||!record||typeof record!=='object'||Array.isArray(record)||typeof record.vehicle!=='string')return false;
        const vehicle=serial(record.vehicle),requests=Array.isArray(data.requests)?data.requests:[];
        // Keep legacy records intact. All retained statuses block the same serial;
        // rejection/reapplication policy and concurrent requests remain server work.
        if(!vehicle||requests.some(item=>serial(item?.vehicle)===vehicle))return false;
        const request={
          id:String(record.id??''),vehicle,model:String(record.model??''),dealer:String(record.dealer??''),
          ...(record.dealerId===undefined?{}:{dealerId:String(record.dealerId??'')}),
          role:data.profile.role,status:'REQ',requestedBy:data.profile.name,
          registeredAt:String(record.registeredAt??''),processedAt:'',processedBy:'',
          company:data.profile.company,reasonType:'',reason:''
        };
        return write({...data,requests:[request,...requests]});
      }
    };
  }
  if(typeof module==='object'&&module.exports)module.exports={create,key};
  if(root.document)root.CustomerOnboarding=create({getItem:name=>root.sessionStorage.getItem(name),setItem:(name,value)=>root.sessionStorage.setItem(name,value)});
})(typeof window==='undefined'?globalThis:window);
