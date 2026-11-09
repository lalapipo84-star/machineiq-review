(function(){
 'use strict';
 var media=window.matchMedia('(prefers-reduced-motion: reduce)'),observed=new Set(),played=new WeakSet(),revealed=new WeakSet(),pending=false;
 var animations=new Set(),easing='cubic-bezier(.22,.61,.36,1)';
 var waiting=new Map();
 var isTabs=document.body.classList.contains('dr-preview');
 var speed=isTabs?
   {stagger:80,card:250,line:450,area:410,bar:370,barStep:10,dot:150,dotLead:65,dotStep:14,chartLead:55,chartStep:45}:
   {stagger:100,card:300,line:550,area:500,bar:450,barStep:12,dot:180,dotLead:80,dotStep:20,chartLead:70,chartStep:60};
 var stagger=speed.stagger,cardDuration=speed.card,nextStart=0;
 // Period summary is one card; only the group cards below enter individually.
 var targets=isTabs?
   '#dashboardContent .dc-overview-row>.dc-card,#dashboardContent .dc-trends-grid>.dc-card,#dashboardContent #dcSummary,#dashboardContent .dc-company-list>.dc-company-tile':
   '#dashboardContent .dc-card,#dashboardContent .dc-company-list>.dc-company-tile';
 var charts='.dc-donut,.dwi-ring,svg.dc-chart,.dc-state-track';
 function ownedCharts(target){return Array.from(target.querySelectorAll(charts)).filter(function(node){return node.closest(targets)===target;});}
 function run(element,frames,options){
   if(media.matches||!element.animate)return;
   // Hold the first frame during the delay, then leave the original final style.
   var animation=element.animate(frames,Object.assign({duration:speed.line,easing:easing,fill:'backwards'},options));
   animations.add(animation);animation.finished.then(function(){animations.delete(animation);},function(){animations.delete(animation);});
 }
 function play(node,delay){
   if(media.matches||played.has(node))return;played.add(node);
   if(node.matches('.dc-donut,.dwi-ring')){run(node,[{'--dm-progress':'0'},{'--dm-progress':'1'}],{duration:speed.line,delay:delay});return;}
   if(node.matches('.dc-state-track')){run(node,[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:speed.bar,delay:delay});return;}
   node.querySelectorAll('path[stroke]:not([stroke-dasharray])').forEach(function(path){var length=path.getTotalLength();if(length>0)run(path,[{strokeDasharray:String(length),strokeDashoffset:String(length)},{strokeDasharray:String(length),strokeDashoffset:'0'}],{duration:speed.line,delay:delay});});
   node.querySelectorAll('path[fill^="url"]').forEach(function(path){run(path,[{opacity:0},{opacity:1}],{duration:speed.area,delay:delay});});
   node.querySelectorAll('g[data-chart-tip] rect:not([fill="transparent"])').forEach(function(bar,i){var box=bar.getBBox(),bottom=box.y+box.height;run(bar,[{transform:'translateY('+bottom+'px) scaleY(.02) translateY(-'+bottom+'px)',opacity:0},{transform:'none',opacity:getComputedStyle(bar).opacity}],{duration:speed.bar,delay:delay+i*speed.barStep});});
   node.querySelectorAll('circle').forEach(function(dot,i){run(dot,[{opacity:0},{opacity:1}],{duration:speed.dot,delay:delay+speed.dotLead+i*speed.dotStep});});
 }
 function reveal(target,delay){
   release(target);
   var firstReveal=!revealed.has(target);
   if(firstReveal){
     revealed.add(target);
     run(target,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:cardDuration,delay:delay});
   }
   ownedCharts(target).forEach(function(node,index){play(node,delay+speed.chartLead+index*speed.chartStep);});
 }
 function prepare(target){
   if(revealed.has(target)||waiting.has(target)||!target.animate)return;
   // Establish the first frame before paint so the finished UI does not flash.
   var hold=target.animate([{opacity:0,transform:'translateY(8px)'},{opacity:0,transform:'translateY(8px)'}],{duration:1,fill:'both'});
   hold.pause();hold.currentTime=0;hold.finished.catch(function(){});
   waiting.set(target,hold);animations.add(hold);
 }
 function release(target){var hold=waiting.get(target);if(hold){hold.cancel();animations.delete(hold);waiting.delete(target);}}
 var observer=new IntersectionObserver(function(entries){
   if(media.matches)return;
   var visible=entries.filter(function(entry){var r=entry.target.getBoundingClientRect();return entry.isIntersecting&&entry.target.isConnected&&r.width>0&&r.height>0;});
   // Follow the visible reading order rather than callback/source order.
   visible.sort(function(a,b){var ar=a.target.getBoundingClientRect(),br=b.target.getBoundingClientRect();return Math.abs(ar.top-br.top)>16?ar.top-br.top:ar.left-br.left;});
   var now=performance.now(),start=Math.max(now,nextStart);
   visible.forEach(function(entry){reveal(entry.target,start-now);observer.unobserve(entry.target);start+=stagger;});
   if(visible.length)nextStart=start;
 },{threshold:.14});
 function refresh(){
   if(pending||media.matches)return;pending=true;
   requestAnimationFrame(function(){
     pending=false;
     waiting.forEach(function(hold,node){if(!node.isConnected)release(node);});
     animations.forEach(function(animation){if(animation.effect&&animation.effect.target&&!animation.effect.target.isConnected)animation.cancel();});
     observed.forEach(function(node){if(!node.isConnected){observer.unobserve(node);release(node);observed.delete(node);}});
     document.querySelectorAll(targets).forEach(function(target){
       var chartNodes=ownedCharts(target),newChart=chartNodes.some(function(node){return !played.has(node);});
       if(!observed.has(target)||newChart){prepare(target);observed.add(target);observer.observe(target);}
     });
   });
 }
 function replay(){animations.forEach(function(animation){animation.cancel();});animations.clear();waiting.clear();observer.disconnect();observed=new Set();played=new WeakSet();revealed=new WeakSet();nextStart=0;refresh();}
 media.addEventListener('change',function(){if(media.matches){observer.disconnect();animations.forEach(function(animation){animation.cancel();});animations.clear();waiting.clear();}else replay();});
 window.MIQDashboardMotion={refresh:refresh,replay:replay};
 function ready(){var button=document.getElementById('dmReplay');if(button)button.addEventListener('click',replay);refresh();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
