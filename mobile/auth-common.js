// Shared customer-mobile form policy. Local UI validation, not server authentication.
(function(root){
  'use strict';
  const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const password=/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
  const username=/^(?=.*[A-Za-z0-9])[A-Za-z0-9._-]{6,}$/;
  // Non-production recovery fixtures only. Persist a nonsecret scenario marker,
  // never a temporary/new password. This is not client-side authentication.
  const recoveryIdentifiers=new Set(['fleet.admin@sejong-log.co.kr','recovery.owner@example.invalid','recovery.staff@example.invalid']);
  const normalize=value=>typeof value==='string'?value.trim().toLowerCase():'';
  const recoveryPassword='RecoveryPreview14!';
  const recoveryPreview=Object.freeze({
    issue(identifier,now=Date.now()){
      identifier=normalize(identifier);
      return recoveryIdentifiers.has(identifier)&&Number.isFinite(now)?{password:recoveryPassword,marker:{fixture:'customer-recovery-preview-v1',identifier,expiresAt:now+24*60*60*1000}}:null;
    },
    matches(marker,identifier,password,now=Date.now()){
      return Boolean(marker?.fixture==='customer-recovery-preview-v1'&&recoveryIdentifiers.has(marker.identifier)&&marker.identifier===normalize(identifier)&&Number.isFinite(marker.expiresAt)&&marker.expiresAt>now&&password===recoveryPassword);
    }
  });
  const api=Object.freeze({
    email,password,recoveryPreview,
    userId:value=>email.test(value)||username.test(value),
    role:search=>new URLSearchParams(search).get('role')==='customer_staff'?'customer_staff':'customer_owner',
    key:name=>'linq-customer-prototype-'+name
  });
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CustomerAuthCommon=api;
})(typeof window==='undefined'?globalThis:window);
