// Customer-mobile dormant login preview only. These exact .invalid accounts and
// fixed test passwords are not operational credentials or an authentication API.
(function(root){
  'use strict';
  const accounts=Object.freeze([
    {identifier:'dormant.owner@example.invalid',state:'dormant',delivery:'sent'},
    {identifier:'dormant.staff@example.invalid',state:'dormant',delivery:'sent'},
    {identifier:'dormant.failure@example.invalid',state:'dormant',delivery:'failed'},
    {identifier:'dormant.limited@example.invalid',state:'dormant',delivery:'rateLimited'},
    {identifier:'suspended.customer@example.invalid',state:'suspended'},
    {identifier:'withdrawn.customer@example.invalid',state:'withdrawn'},
    {identifier:'locked.customer@example.invalid',state:'locked'}
  ].map(account=>Object.freeze(account)));
  const messages=Object.freeze({
    suspended:'사용 중지된 계정입니다. 관리자에게 문의해 주세요.',
    withdrawn:'탈퇴한 계정입니다. 관리자에게 문의해 주세요.',
    locked:'잠긴 계정입니다. 관리자에게 문의해 주세요.'
  });
  const normalize=value=>typeof value==='string'?value.trim().toLowerCase():'';
  const find=identifier=>accounts.find(account=>account.identifier===normalize(identifier));
  const maskedEmail=identifier=>{
    const [name,domain]=identifier.split('@');
    return name.slice(0,2)+'***@'+domain;
  };
  function createPreview({now=Date.now,schedule=fn=>setTimeout(fn,900)}={}){
    let version=0,issued=null,inFlight=null;
    // Fixed values exist solely in this local preview. The 24-hour expiry is a
    // scenario value, not a confirmed server policy. No credential is persisted.
    const initialTestPassword='password12!@';
    const temporaryTestPassword='DormantPreview14!';
    const previewLifetime=24*60*60*1000;
    function invalidate(){version+=1;issued=null;inFlight=null;}
    function inspect(identifier,password){
      const account=find(identifier);
      if(!account)return null;
      if(account.state!=='dormant')return {kind:'blocked',state:account.state,message:messages[account.state]};
      if(issued&&issued.expiresAt<=now())issued=null;
      if(issued?.identifier===account.identifier&&password===temporaryTestPassword)return {kind:'temporary'};
      if(password===initialTestPassword)return {kind:'dormant',maskedEmail:maskedEmail(account.identifier)};
      return {kind:'invalid'};
    }
    function request(identifier){
      const account=find(identifier);
      // Non-dormant and unknown identifiers never start the delivery simulator.
      if(!account||account.state!=='dormant')return Promise.resolve({kind:'failed'});
      if(inFlight?.identifier===account.identifier)return inFlight.promise;
      if(inFlight)invalidate();
      issued=null;
      const pending={identifier:account.identifier,version,promise:null};
      let resolve;
      pending.promise=new Promise(done=>{resolve=done;});
      inFlight=pending;
      const complete=()=>{
        if(pending.version!==version){resolve({kind:'stale'});return;}
        if(inFlight===pending)inFlight=null;
        if(account.delivery==='sent')issued={identifier:account.identifier,expiresAt:now()+previewLifetime};
        resolve({kind:account.delivery});
      };
      try{schedule(complete);}
      catch{
        if(pending.version!==version){resolve({kind:'stale'});return pending.promise;}
        if(inFlight===pending)inFlight=null;
        resolve({kind:'failed'});
      }
      return pending.promise;
    }
    function finishChange(identifier){
      if(!issued||issued.identifier!==normalize(identifier))return false;
      const valid=issued.expiresAt>now();
      invalidate();
      return valid;
    }
    return Object.freeze({inspect,request,invalidate,finishChange,clear:invalidate});
  }
  const api=Object.freeze({createPreview,accounts});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CustomerDormantLogin=api;
})(typeof window==='undefined'?globalThis:window);
