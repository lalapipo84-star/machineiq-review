/* Company-based dashboard selection. The caller supplies only its permitted companies. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MIQDashboardCompanies=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var fields=['vehicleCount','connected','disconnected','running','idle','fault','replacementNeeded','replacementSoon'];
  function text(value){return value==null?'':String(value).trim();}
  function normalized(value){return text(value).normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g,'');}
  function number(value){var result=Number(value);return Number.isFinite(result)&&result>0?result:0;}
  function rate(row){return number(row.connected)?Math.round(number(row.running)/number(row.connected)*100):0;}
  function unique(companies){
    var rows=[],seen=new Set();
    (Array.isArray(companies)?companies:[]).forEach(function(company){
      if(!company||!text(company.companyId))return;
      var id=text(company.companyId);
      if(seen.has(id))return;
      seen.add(id);rows.push(Object.assign({},company,{companyId:id}));
    });
    return rows;
  }
  function compareText(left,right){return text(left).localeCompare(text(right),'ko',{numeric:true,sensitivity:'base'});}
  function compareCompanies(left,right){return compareText(left.companyName,right.companyName)||compareText(left.companyId,right.companyId);}
  function select(companies,filters){
    filters=filters||{};
    var companyId=text(filters.companyId);
    return unique(companies).filter(function(row){
      return !companyId||row.companyId===companyId;
    }).sort(compareCompanies);
  }
  function suggest(companies,query){
    query=normalized(query);
    if(Array.from(query).length<2)return [];
    return unique(companies).filter(function(row){
      var name=normalized(row.companyName).replace(/^(?:(?:\(주\))|주식회사)+/,'');
      return name.indexOf(query)===0;
    }).sort(compareCompanies);
  }
  function pages(rows,page,size){
    rows=Array.isArray(rows)?rows:[];
    size=Math.floor(Number(size));if(!Number.isFinite(size)||size<1)size=15;
    var total=rows.length,pageCount=Math.ceil(total/size);
    page=Math.floor(Number(page));if(!Number.isFinite(page)||page<1)page=1;
    page=Math.min(page,Math.max(1,pageCount));
    var start=(page-1)*size;
    return {rows:rows.slice(start,start+size),total:total,page:page,pageCount:pageCount,from:total?start+1:0,to:Math.min(start+size,total)};
  }
  function totals(rows){
    var companies=unique(rows),result={companyCount:companies.length};
    fields.forEach(function(field){result[field]=companies.reduce(function(sum,row){return sum+number(row[field]);},0);});
    result.rate=rate(result);
    return result;
  }
  return {select:select,suggest:suggest,pages:pages,totals:totals};
});
