/* Design studio app: state, panels, interaction, products, budget, persistence, photos. */
import * as R from './data.js';
import * as X from './engine.js';
import * as L from './local.js';
import {shareLink,decodeDesign,hashCode} from './share.js';
const {THREE}=X;
const TI={b:0,m:1,h:2},RANK={must:0,nice:1,opt:2},LIM={must:0,nice:1,all:2};
const DRAFT_KEY='reno-studio-v3-draft';
const RG={open:'ק-סלון ופינת אוכל',hall:'ק-מבואה ומדרגות',mamad:'ק-ממד',service:'ק-שירות',balcony:'ק-מרפסת'};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=new Intl.NumberFormat('he-IL');
const ils=n=>'₪'+nf.format(Math.round(n));
const ilsK=n=>Math.abs(n)>=10000?'₪'+(n/1000).toFixed(n>=100000?0:1).replace(/\.0$/,'')+'K':ils(n);
const isMobile=()=>matchMedia('(max-width: 900px)').matches;
const ICON={
  panel:'<path d="M4 5h16v14H4z"/><path d="M15 5v14"/>',undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/>',redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h2"/>',
  camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',img:'<rect x="4" y="5" width="16" height="14" rx="1"/><circle cx="9" cy="10" r="1.6"/><path d="m20 16-5-5-7 8"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',
  layers:'<path d="m12 4 8 4-8 4-8-4z"/><path d="m4 12 8 4 8-4"/><path d="m4 16 8 4 8-4"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
const ic=(n,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

let S,P,sel=null,tab='edit',mode='view',cut=false,showLbl=true,pendingConfirm=null,versions=[],products={},db=null,assets=null,downloads=null,dbState='wait',msg='',prodView='board',prodFilter='all',editProd=null,photoUrl=null;
const hist=[],fut=[];

/* ---------- state ---------- */
function migrate(s){if(s.dims&&s.dims.DIND===undefined)s.dims.DIND=0;s.over=s.over||{};s.filter=s.filter||'nice';s.reservePct=s.reservePct||12;s.tier=s.tier||'m';s.dims=Object.assign({},R.DIMS,s.dims||{});s.kitchen=Object.assign({appl:{},applP:{}},s.kitchen||{});s.kitchen.applP=s.kitchen.applP||{};return s;}
let legacyDraft=false;
function loadDraft(){try{const t=localStorage.getItem(DRAFT_KEY);if(t){const o=JSON.parse(t);if(o.dims&&o.dims.DIND===undefined){legacyDraft=true;try{localStorage.setItem(DRAFT_KEY+'-old',t);}catch(e){}return null;}return migrate(o);}}catch(e){}return null;}
let draftT=null;function saveDraft(){clearTimeout(draftT);draftT=setTimeout(()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}},400);}
function snapshot(){hist.push(JSON.stringify(S));if(hist.length>50)hist.shift();fut.length=0;}
function commit(fn,level){snapshot();fn(S);after(level);}
function after(level){
  X.setStateRef(S);
  if(level==='arch'||level==='all'){P=X.buildArch(S,cut);buildLabels();}
  if(level==='items'||level==='all')X.buildItems(S,products);
  refreshHelper();renderTop();renderPanel();saveDraft();
}
function undo(){if(!hist.length)return;fut.push(JSON.stringify(S));S=JSON.parse(hist.pop());validateSel();after('all');}
function redo(){if(!fut.length)return;hist.push(JSON.stringify(S));S=JSON.parse(fut.pop());validateSel();after('all');}
function validateSel(){if(sel&&sel.kind==='item'&&!S.items.find(i=>i.id===sel.id))sel=null;}
const itemById=id=>S.items.find(i=>i.id===id);
const tierOf=k=>(S.over[k]&&S.over[k].t)||S.tier;
const tagOf=(k,def)=>(S.over[k]&&S.over[k].tag)||def;
const setOver=(k,f,v)=>{S.over[k]=Object.assign({},S.over[k]||{},{[f]:v});};
const prodOf=i=>i&&i.pid?products[i.pid]:null;
function dimsOf(i){const C=R.CAT[i.type],pr=prodOf(i);return {w:i.w||(pr&&pr.w?pr.w/100:C.w),d:i.d||(pr&&pr.d?pr.d/100:C.d),h:i.h||(pr&&pr.h?pr.h/100:(i.type==='tvSlats'?S.dims.H:R.DEF_H[i.type]||0))};}
function sizeMult(i){const C=R.CAT[i.type],m=R.PSCALE[i.type];if(!m||!(i.w||i.d||i.h))return 1;const D=dimsOf(i),h0=i.type==='tvSlats'?S.dims.H:(R.DEF_H[i.type]||1);
  return m==='area'?(D.w*D.h)/(C.w*h0):m==='floor'?(D.w*D.d)/(C.w*C.d):D.w/C.w;}
const finMult=i=>R.UPHOL.includes(i.type)&&i.fin?(R.FIN_MULT[i.fin]||1):1;
const photoSrc=p=>p?(p.img||(p.photoId?L.photoURL(p.photoId):null)):null;

/* ---------- budget ---------- */
const hoodKey=k=>k.cook==='island'||k.cookPos==='window'?'hoodI':'hoodW';
const winMax=(k,d)=>Math.max(.6,k.cook==='island'?d.KA-.85:d.KA-.12-(k.cookPos==='window'?.75:1.72));
function lines(){
  const L=[],d=S.dims,k=S.kitchen;
  const push=(grp,key,label,price,tag,ref,o={})=>L.push(Object.assign({grp,key,label,price:Math.round(price),tier:o.fixed?null:tierOf(key),tag:tagOf(key,tag),ref},o));
  const t=key=>TI[tierOf(key)];
  for(const id in S.rooms){const r=S.rooms[id],A=P.rooms[id].area;
    if(r.floor!=='keep'){const f=R.FLOORS[r.floor];push(RG[id],'floor:'+id,`ריצוף: ${f.n} · ${A.toFixed(1)} מ״ר`,A*(f.mat[t('floor:'+id)]+f.inst[t('floor:'+id)]),r.ftag||'must',{kind:'room',id});}
    if(r.paint){const pa=P.rooms[id].perim*d.H*.85+A;push(RG[id],'paint:'+id,`צבע קירות ותקרה · ${pa.toFixed(0)} מ״ר`,pa*R.PAINT[t('paint:'+id)],'must',{kind:'room',id});}}
  if(!k.keep){
    const fr=R.FRONTS[k.fronts]||R.FRONTS.polymer,cabM=(d.KA-.6)+d.KB+d.ISL+.6*2.2+d.KB*.7;
    push('ק-מטבח','kfront',`ארונות ${fr.n}${k.style&&k.style!=='flat'?' '+R.FRONT_STYLES[k.style]:''} · ${cabM.toFixed(1)} מ׳ רץ שקול`,cabM*fr.p*R.FRONT_MULT[tierOf('kfront')]*(R.STYLE_MULT[k.style||'flat']||1),'must',{kind:'kitchen'});
    const c=R.COUNTERS[k.counter]||R.COUNTERS.qWhite,cm=(d.KA-.6)+d.KB+d.ISL*1.9;
    push('ק-מטבח','kcounter',`משטח ${c.n} ${k.ctrThick||4} ס״מ · ${cm.toFixed(1)} מ׳ רץ שקול`,cm*c.p[t('kcounter')]*(R.THICK_MULT[k.ctrThick||4]||1),'must',{kind:'kitchen'});
    if(R.SPLASH_P[k.splash]){const sa=(d.KA-.6+d.KB)*.6;push('ק-מטבח','ksplash',`חיפוי קיר ${R.SPLASH[k.splash]} · ${sa.toFixed(1)} מ״ר`,sa*R.SPLASH_P[k.splash][t('ksplash')],'nice',{kind:'kitchen'});}
    R.APPL_SLOTS.forEach(([slot,akey])=>{if(slot==='hood'&&!k.hood)return;const ak=akey||(hoodKey(k)),pr=products[k.applP[slot]];
      if(pr)push('ק-מטבח','appl:'+slot,pr.name,pr.price,'must',{kind:'kitchen'},{fixed:1,prod:pr});
      else push('ק-מטבח','appl:'+slot,R.APPL[ak].n,R.APPL[ak].p[t('appl:'+slot)],'must',{kind:'kitchen'});});
    const W=R.KITCHEN_WORK,gk=k.cook==='island'?'gasIsl':'gasSide';
    push('ק-מטבח','kwork:window',W.window.n,W.window.p[t('kwork:window')],'must',{kind:'kitchen'});
    push('ק-מטבח','kwork:gas',W[gk].n,W[gk].p[t('kwork:gas')],'must',{kind:'kitchen'});
    push('ק-מטבח','kwork:install',W.install.n,W.install.p[t('kwork:install')],'must',{kind:'kitchen'});
    push('ק-מטבח','kwork:remove',W.remove.n,W.remove.p[t('kwork:remove')],'must',{kind:'kitchen'});
  }
  for(const s in R.SHUTTERS)if(S.shutters[s])push('תריסים חשמליים','shutter:'+s,R.SHUTTERS[s].n,R.SHUTTERS[s].p[t('shutter:'+s)],'must',{kind:'room',id:'open'});
  const st=S.stairs,T=.28,r=3/16,rl=Math.hypot(7*T,7*r)+Math.hypot(8*T,8*r)+.3;
  if(st.clad!=='keep')push(RG.hall,'clad',`חיפוי מדרגות: ${R.CLAD[st.clad].n} · 15 מדרגות ופודסט`,17*R.CLAD[st.clad].p[t('clad')],'nice',{kind:'stairs'});
  if(st.rail!=='keep')push(RG.hall,'rail',`מעקה: ${R.RAIL[st.rail].n} · ${rl.toFixed(1)} מ׳`,rl*R.RAIL[st.rail].p[t('rail')],'must',{kind:'stairs'});
  if(st.led)push(RG.hall,'led','תאורת לד בקיר המדרגות · 15 נקודות',15*R.LED_STEP[t('led')],'must',{kind:'stairs'});
  if(S.under.sol!=='open')push(RG.hall,'under',`מתחת למדרגות: ${R.UNDER[S.under.sol].n}`,R.UNDER[S.under.sol].p[t('under')],'nice',{kind:'under'});
  S.items.forEach(i=>{const C=R.CAT[i.type];if(!C)return;const rid=X.roomAt(P,i.x,i.z),grp=RG[rid]||'ריהוט',pr=prodOf(i);
    if(i.ex)push(grp,'item:'+i.id,C.n+' (קיים)',0,'must',{kind:'item',id:i.id},{fixed:1,existing:1});
    else if(pr)push(grp,'item:'+i.id,pr.name,pr.price,C.tag,{kind:'item',id:i.id},{fixed:1,prod:pr});
    else{const D=dimsOf(i),cust=i.w||i.d||i.h,lbl=C.n+(i.fin&&i.fin!=='fabric'&&R.UPHOL.includes(i.type)?' · '+R.FINISHES[i.fin]:'')+(cust?` · ${Math.round(D.w*100)}×${Math.round((C.wall?D.h:D.d)*100)}`:'');
      push(grp,'item:'+i.id,lbl,C.p[t('item:'+i.id)]*sizeMult(i)*finMult(i),C.tag,{kind:'item',id:i.id});}});
  for(const e in R.EXTRAS)if(S.extras[e])push('עלויות נלוות','extra:'+e,R.EXTRAS[e].n,R.EXTRAS[e].p[t('extra:'+e)],'must',{kind:'extras'});
  return L;
}
function totals(){const L=lines(),lim=LIM[S.filter];let sum=0;const by={must:0,nice:0,opt:0};L.forEach(l=>{by[l.tag]+=l.price;if(RANK[l.tag]<=lim)sum+=l.price;});const reserve=sum*S.reservePct/100,total=sum+reserve;return {L,sum,reserve,total,remain:R.TOTAL_BUDGET-total,by};}

/* ---------- 3D setup ---------- */
const cv=$('#cv'),viewer=$('#viewer');let gl=null;
try{gl=X.init(cv);}catch(e){viewer.insertAdjacentHTML('beforeend','<div class="nogl">הדפדפן לא מצליח להציג תלת-ממד. נסו ממחשב או מדפדפן אחר.</div>');}
const camera=gl?gl.camera:new THREE.PerspectiveCamera();
function setBg(){if(gl)X.setBackground(getComputedStyle(document.documentElement).getPropertyValue('--scene').trim()||'#E3E6E1');}
setBg();matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',setBg);
new MutationObserver(setBg).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
X.setOnModelReady(id=>{if(sel&&sel.kind==='item'&&sel.id===id)refreshHelper();});

/* camera */
const target=new THREE.Vector3();let rad=8,theta=0,phi=1.2,tw=null,curView='kitchen';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setFrom(pos,tgt){target.copy(tgt);const v=pos.clone().sub(tgt);rad=v.length();phi=Math.acos(clamp(v.y/rad,-1,1));theta=Math.atan2(v.x,v.z);}
function applyCam(){camera.position.set(target.x+rad*Math.sin(phi)*Math.sin(theta),target.y+rad*Math.cos(phi),target.z+rad*Math.sin(phi)*Math.cos(theta));camera.lookAt(target);}
function views(){const d=S.dims,p=P,OW=d.OW,OD=d.OD,DI=p.DI||0;return {
  kitchen:{n:'ק-מטבח',p:[1.2,1.6,OD-.4],t:[OW-1.8,1.05,DI+d.KA*.7]},window:{n:'קיר החלון',p:[p.isX0-.5,1.6,p.kwZ-.75],t:[OW,1.3,DI+d.KA*.5]},
  living:{n:'ק-סלון',p:[p.isX0-.9,1.55,OD-.5],t:[.3,1.0,2.8]},dining:{n:'פינת אוכל',p:[Math.max(1.5,p.dineX-4.2),1.6,Math.min(OD-.4,p.dineZ+3.6)],t:[p.dineX+.3,.85,p.dineZ-.2]},
  hall:{n:'ק-מבואה',p:[p.hx0+.45,1.55,p.hz1-.2],t:[OW-.45,1.1,p.zl1+.6]},under:{n:'מתחת למדרגות',p:[(p.xe+p.a0)/2-.4,1.45,p.hz1-.2],t:[(p.xe+p.a0)/2,1.0,p.hz0+.2]},
  mamad:{n:'ק-ממד',p:[p.mx1-.3,1.6,p.mz0+.3],t:[p.mx0+.9,.85,p.mz1-.5]},service:{n:'ק-שירות',p:[OW-.45,1.6,DI+d.KA+.55],t:[p.sx1-.1,1.0,(p.sz0+p.sz1)/2]},
  balcony:{n:'ק-מרפסת',p:[p.bx1-.35,1.65,p.bz1-.3],t:[p.bx0+1.4,.8,p.bz0+1.1]},top:{n:'מבט על',p:[OW/2,16,OD+6.5],t:[OW/2,0,1.6]}};}
function goTo(name,instant){const v=views()[name];if(!v)return;curView=name;const wantCut=name==='top';if(wantCut!==cut){cut=wantCut;P=X.buildArch(S,cut);buildLabels();syncTools();}
  const toP=new THREE.Vector3(...v.p),toT=new THREE.Vector3(...v.t);
  if(reduced||instant){setFrom(toP,toT);applyCam();}else tw={fp:camera.position.clone(),ft:target.clone(),tp:toP,tt:toT,t0:performance.now(),d:900};renderViews();}
function cancelTween(){if(tw){setFrom(camera.position.clone(),target.clone());tw=null;}}

/* labels */
const lblWrap=$('#labels');let lbls=[];
function buildLabels(){lblWrap.innerHTML='';lbls=[];const y=cut?1.5:2.35,p=P;
  const add=(t,x,z,yy)=>{const e=document.createElement('div');e.className='lbl3d';e.textContent=t;lblWrap.appendChild(e);lbls.push({e,v:new THREE.Vector3(x,yy||y,z)});};
  add('ק-סלון',2.3,3.4);add('ק-מטבח',S.dims.OW-1.4,(p.DI||0)+S.dims.KA*.55);add('פינת אוכל',p.dineX,p.dineZ);add('ק-מבואה',(p.hx0+p.a0)/2,(p.zl1+p.hz1)/2);add('מתחת למדרגות',(p.xe+p.a0)/2,p.zl1,1.2);
  add('ק-ממד',(p.mx0+p.mx1)/2,(p.mz0+p.mz1)/2);add('ק-שירות',(p.sx0+p.sx1)/2,(p.sz0+p.sz1)/2);add('ק-מרפסת',(p.bx0+p.bx1)/2,(p.bz0+p.bz1)/2);lblWrap.hidden=!showLbl;}

/* selection helper */
let helper=null,lifted=false;
function refreshHelper(){if(!gl)return;const sc=X.getScene();if(helper){sc.remove(helper);helper.geometry.dispose();helper=null;}
  X.reg.floors.forEach(f=>{const m=f.mesh.material;if(m.emissive)m.emissive.setRGB(0,0,0);});
  if(!sel)return;let obj=null;
  if(sel.kind==='item')obj=X.getItemsG()&&X.getItemsG().children.find(g=>g.userData.item===sel.id);
  else if(sel.kind==='kitchen')obj=X.reg.kitchen;else if(sel.kind==='stairs')obj=X.reg.stairs;else if(sel.kind==='under')obj=X.reg.under;
  else if(sel.kind==='room'){X.reg.floors.filter(f=>f.id===sel.id).forEach(f=>f.mesh.material.emissive.setRGB(.05,.09,.15));return;}
  if(obj){helper=new THREE.BoxHelper(obj,lifted?0xE07B39:0x2D74C4);helper.material.depthTest=false;helper.renderOrder=5;sc.add(helper);}}

/* picking + gestures */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function setNdc(e){const r=cv.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
function visibleChain(o){while(o){if(!o.visible)return false;o=o.parent;}return true;}
function pick(e){setNdc(e);const hits=ray.intersectObjects([X.getItemsG(),X.getArchG()].filter(Boolean),true);
  for(const h of hits){if(h.object.userData.nopick||h.object.userData.fake||!visibleChain(h.object))continue;let o=h.object;while(o&&!o.userData.sel)o=o.parent;if(o)return {sel:o.userData.sel,point:h.point};}return null;}
function planeHit(e,y){setNdc(e);const v=new THREE.Vector3();return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-(y||0)),v)?v:null;}
const ptrs=new Map();let g2=null,down=null,cand=null,drag=null,longT=null;
const LONG_MS=430;
function two(){const a=[...ptrs.values()];return {d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),mx:(a[0].x+a[1].x)/2,my:(a[0].y+a[1].y)/2};}
function cancelLong(){if(longT){clearTimeout(longT);longT=null;}}
function startDrag(vibrate){drag=Object.assign({},cand);snapshot();lifted=true;sel={kind:'item',id:drag.id};if(vibrate&&navigator.vibrate)try{navigator.vibrate(14);}catch(e){}refreshHelper();renderPanel();toast('גוררים את הפריט. משחררים כדי להניח',1600);}
function pan(dx,dy){const k=rad*.0016,rt=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrix,1);target.addScaledVector(rt,-dx*k).addScaledVector(up,dy*k);target.set(clamp(target.x,-3,15),clamp(target.y,0,3),clamp(target.z,-6,12));}
cv.addEventListener('pointerdown',e=>{if(X.photoActive())return;try{cv.setPointerCapture(e.pointerId);}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});cancelTween();
  if(ptrs.size===2){cancelLong();cand=null;if(drag)endDrag();const t=two();g2={d:t.d,mx:t.mx,my:t.my};down=null;return;}
  down={x:e.clientX,y:e.clientY,moved:false,type:e.pointerType};cand=null;
  if(mode==='edit'&&e.button===0&&!e.shiftKey){const h=pick(e);if(h&&h.sel.kind==='item'){const it=itemById(h.sel.id),fh=planeHit(e,it.y||0);if(it&&fh){cand={id:it.id,ox:fh.x-it.x,oz:fh.z-it.z,y:it.y||0};
    if(e.pointerType!=='mouse')longT=setTimeout(()=>{longT=null;if(down&&!down.moved)startDrag(true);},LONG_MS);}}}});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const pv=ptrs.get(e.pointerId),dx=e.clientX-pv.x,dy=e.clientY-pv.y;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2&&g2){const t=two();if(g2.d)rad=clamp(rad*g2.d/t.d,.6,24);pan(t.mx-g2.mx,t.my-g2.my);g2={d:t.d,mx:t.mx,my:t.my};return;}
  if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>(down.type==='mouse'?4:9))down.moved=true;
  if(!drag&&cand&&down&&down.moved&&down.type==='mouse')startDrag(false);
  if(drag){const fh=planeHit(e,drag.y);if(!fh)return;const it=itemById(drag.id),sn=v=>Math.round(v/.05)*.05;it.x=+sn(fh.x-drag.ox).toFixed(3);it.z=+sn(fh.z-drag.oz).toFixed(3);
    const g=X.getItemsG().children.find(c=>c.userData.item===drag.id);if(g)g.position.set(it.x,g.position.y,it.z);if(helper)helper.update();return;}
  if(down&&down.moved){cancelLong();cand=null;if(e.shiftKey||e.buttons===2)pan(dx,dy);else{theta-=dx*.006;phi=clamp(phi-dy*.006,.08,1.56);}}});
function endDrag(){drag=null;lifted=false;refreshHelper();renderTop();renderPanel();saveDraft();}
const endPtr=e=>{if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);if(ptrs.size<2)g2=null;cancelLong();
  if(drag){endDrag();down=null;cand=null;return;}
  if(down&&!down.moved&&e.type==='pointerup'&&ptrs.size===0){const h=pick(e);sel=h?h.sel:null;refreshHelper();if(sel){tab='edit';openSheet('mid');}renderPanel();}
  down=null;cand=null;};
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();cancelTween();rad=clamp(rad*Math.exp(e.deltaY*.001),.6,24);},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
  if(e.key==='Escape'){sel=null;refreshHelper();renderPanel();return;}
  if(mode!=='edit'||!sel||sel.kind!=='item')return;
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();delItem(sel.id);}else if(e.key==='q'||e.key==='Q'||e.key==='/')rotItem(sel.id,-15);else if(e.key==='e'||e.key==='E'||e.key==='ק')rotItem(sel.id,15);});
function rotItem(id,deg){commit(s=>{const i=s.items.find(x=>x.id===id);i.rot=+((i.rot||0)+deg*Math.PI/180).toFixed(4);},'items');}
function delItem(id){commit(s=>{s.items=s.items.filter(x=>x.id!==id);delete s.over['item:'+id];},'items');sel=null;refreshHelper();renderPanel();}

/* render loop */
const tmp=new THREE.Vector3();let sheetH=0;
function loop(now){
  if(gl&&!X.photoActive()){
    if(tw){const k=Math.min(1,(now-tw.t0)/tw.d),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;camera.position.lerpVectors(tw.fp,tw.tp,e);target.lerpVectors(tw.ft,tw.tt,e);camera.lookAt(target);if(k===1){setFrom(tw.tp,tw.tt);tw=null;}}else applyCam();
    X.cullWalls(camera,target,cut,false);gl.renderer.render(gl.scene,camera);
    if(showLbl){const W=viewer.clientWidth,H=viewer.clientHeight;lbls.forEach(({e,v})=>{tmp.copy(v).project(camera);const vis=tmp.z<1&&Math.abs(tmp.x)<1.02&&Math.abs(tmp.y)<1.02;e.hidden=!vis;if(vis)e.style.transform=`translate(${(tmp.x*.5+.5)*W}px,${(-tmp.y*.5+.5)*H}px) translate(-50%,-50%)`;});}
  }requestAnimationFrame(loop);}
function resize(){if(!gl)return;const w=viewer.clientWidth,h=viewer.clientHeight;gl.renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<.8?70:55;
  const off=isMobile()?Math.min(sheetH,h*.6)/2:0;if(off>1)camera.setViewOffset(w,h,0,off,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewer);

/* ---------- panel / sheet ---------- */
const panelEl=$('#panel'),body=$('#panelBody');let sheet='mid',panelOpen=true;
function openSheet(s){if(isMobile()){sheet=s==='mid'&&sheet==='max'?'max':s;applySheet();}else if(!panelOpen){panelOpen=true;applySheet();}}
function applySheet(){
  if(isMobile()){const vh=window.innerHeight;const h=sheet==='min'?68:sheet==='mid'?Math.round(vh*.5):Math.round(vh*.88);panelEl.style.height=h+'px';sheetH=h;document.body.dataset.sheet=sheet;}
  else{panelEl.style.height='';sheetH=0;document.body.dataset.panel=panelOpen?'open':'closed';}
  resize();}
window.addEventListener('resize',applySheet);
(()=>{const hd=$('#sheetHandle');let y0=null,h0=0;
  hd.addEventListener('pointerdown',e=>{try{hd.setPointerCapture(e.pointerId);}catch(_){}y0=e.clientY;h0=panelEl.getBoundingClientRect().height;panelEl.classList.add('dragging');});
  hd.addEventListener('pointermove',e=>{if(y0==null)return;const h=clamp(h0+(y0-e.clientY),68,window.innerHeight*.92);panelEl.style.height=h+'px';});
  const up=e=>{if(y0==null)return;panelEl.classList.remove('dragging');const h=panelEl.getBoundingClientRect().height,vh=window.innerHeight;const moved=Math.abs(e.clientY-y0)>6;y0=null;
    if(!moved){sheet=sheet==='min'?'mid':sheet==='mid'?'max':'min';}else{const c=[['min',68],['mid',vh*.5],['max',vh*.88]];sheet=c.reduce((a,b)=>Math.abs(b[1]-h)<Math.abs(a[1]-h)?b:a)[0];}applySheet();};
  hd.addEventListener('pointerup',up);hd.addEventListener('pointercancel',up);})();
$('#panelBtn').addEventListener('click',()=>{if(isMobile()){sheet=sheet==='min'?'mid':'min';}else panelOpen=!panelOpen;applySheet();});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.v;pendingConfirm=null;msg='';if(isMobile()&&sheet==='min'){sheet='mid';applySheet();}renderPanel();});
body.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});

/* ---------- UI helpers ---------- */
function seg(act,opts,cur,extra=''){return `<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" data-act="${act}" data-v="${v}" ${extra} aria-pressed="${v===cur}">${l}</button>`).join('')}</div>`;}
function chipBg(c){const h=X.hexOf(c);if(['oak','oak2','walnut','teak'].includes(c))return `repeating-linear-gradient(90deg,${h},${h} 3px,${X.shade(h,-.12)} 4px,${h} 6px)`;if(c==='rattan')return 'repeating-linear-gradient(45deg,#C8A273,#C8A273 3px,#B08A5A 4px,#C8A273 6px)';return h;}
function swatches(path,pal,cur,custom=true){return `<div class="sw">${pal.map(c=>`<button type="button" class="chip${c===cur?' on':''}" data-act="color" data-path="${path}" data-v="${c}" title="${esc(c)}" style="background:${chipBg(c)}" aria-label="צבע ${esc(c)}"></button>`).join('')}${custom?`<label class="cpick" title="צבע אחר"><input type="color" data-act="colorPick" data-path="${path}" value="${/^#/.test(cur)?cur:'#cccccc'}" aria-label="צבע אחר"></label>`:''}</div>`;}
function tierRow(key,arr){const t=tierOf(key);return `<div class="tiers">${R.TIERS.map(x=>`<button type="button" data-act="tier" data-key="${key}" data-v="${x}" aria-pressed="${x===t}"><span>${R.TIER_N[x]}</span><b>${arr?ils(arr[TI[x]]):''}</b></button>`).join('')}</div>`;}
function tagRow(key,def){return seg('tag',[['must','חובה'],['nice','רצוי'],['opt','אם יישאר']],tagOf(key,def),`data-key="${key}"`);}
function field(label,inner,hint){return `<div class="fld"><div class="fl"><span>${label}</span>${hint?`<span class="hint">${hint}</span>`:''}</div>${inner}</div>`;}
function select(act,opts,cur,attrs=''){return `<select data-act="${act}" ${attrs}>${opts.map(([v,l])=>`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(l)}</option>`).join('')}</select>`;}
function linesFor(pred){const L=lines().filter(pred);if(!L.length)return '';return `<table class="mini"><tbody>${L.map(l=>`<tr><td>${esc(l.label)}</td><td class="n">${ils(l.price)}</td></tr>`).join('')}<tr class="tot"><td>סה״כ</td><td class="n">${ils(L.reduce((a,l)=>a+l.price,0))}</td></tr></tbody></table>`;}
function prodThumb(p,cls='pt'){const src=photoSrc(p);return src?`<img class="${cls}" src="${esc(src)}" alt="" loading="lazy">`:`<div class="${cls} ph" style="background:${chipBg(p&&p.color||'#ddd')}">${ic('img',22)}</div>`;}
const linkBtn=p=>p&&/^https?:\/\//.test(p.url||'')?`<a class="lnkbtn" href="${esc(p.url)}" target="_blank" rel="noopener">${ic('link',15)} ${esc(p.store||'לאתר')}</a>`:'';
const catName=c=>(R.PRODUCT_CATS.find(x=>x[0]===c)||[c,c])[1];
let toastT=null;function toast(t,ms=2200){const f=$('#toast');f.textContent=t;f.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>f.hidden=true,ms);}

function renderPanel(){document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.v===tab));
  body.innerHTML=tab==='edit'?pEdit():tab==='add'?pAdd():tab==='products'?pProducts():tab==='budget'?pBudget():pMore();}
function head(title,sub,extra=''){return `<div class="ph"><div><p class="eyebrow">${sub||''}</p><h2>${esc(title)}</h2></div><button type="button" class="x" data-act="desel" aria-label="סגירה">${ic('x',16)}</button></div>${extra}`;}
function viewNote(){return mode==='view'?`<div class="note row"><span>מצב צפייה. כדי לשנות, עוברים לעריכה.</span><button type="button" data-act="mode" data-v="edit">${ic('edit',15)} עריכה</button></div>`:'';}
function pEdit(){
  if(!sel)return `<div class="empty"><h2>מה עושים כאן?</h2><p>לחיצה על פריט, רצפה, קיר, מטבח או מדרגות פותחת אותו כאן.</p>
    <ul class="howto"><li><b>צפייה</b> גרירה מסובבת את המבט, שתי אצבעות מזיזות ומקרבות. שום פריט לא זז.</li><li><b>עריכה</b> בטלפון: לחיצה ארוכה על פריט ואז גרירה. במחשב: גרירה רגילה.</li><li><b>צילום ריאליסטי</b> מחשב תמונה עם אור אמיתי מהמבט הנוכחי.</li></ul>
    <div class="quick">${[['kitchen','','ק-מטבח'],['stairs','','מדרגות ומעקה'],['under','','מתחת למדרגות'],['room','open','ריצוף וקירות בסלון'],['room','hall','ק-מבואה'],['room','mamad','ק-ממד'],['room','service','ק-שירות'],['room','balcony','ק-מרפסת']].map(([k,id,n])=>`<button type="button" data-act="sel" data-kind="${k}" data-id="${id}">${n}</button>`).join('')}</div></div>`;
  if(sel.kind==='item')return pItem(itemById(sel.id));if(sel.kind==='room')return pRoom(sel.id);if(sel.kind==='kitchen')return pKitchen();if(sel.kind==='stairs')return pStairs();if(sel.kind==='under')return pUnder();return '';}
function productPicker(cat,curPid,act,extra=''){
  const L=Object.values(products).filter(p=>p.cat===cat).sort((a,b)=>a.price-b.price);
  if(!L.length)return `<p class="hint">אין עדיין מוצרים בקטגוריה הזו. אפשר להוסיף בלשונית "מוצרים".</p>`;
  return `<div class="pick">${L.map(p=>`<button type="button" class="pcard${p.id===curPid?' on':''}" data-act="${act}" data-pid="${p.id}" ${extra}>${prodThumb(p)}<span class="pn">${esc(p.name)}</span><span class="pp">${ils(p.price)} · ${esc(p.store||'')}</span></button>`).join('')}</div>`;}
function pItem(i){if(!i)return '';const C=R.CAT[i.type],key='item:'+i.id,rid=X.roomAt(P,i.x,i.z),pr=prodOf(i),col=i.c||(pr&&pr.color)||C.c,ed=mode==='edit';
  let h=head(pr?pr.name:C.n,(RG[rid]||'מחוץ לחדרים')+(i.ex?' · פריט קיים':'')+(pr?' · '+C.n:''));
  if(pr)h+=`<div class="prodHero">${prodThumb(pr,'hero')}<div><b>${ils(pr.price)}</b>${pr.est?'<span class="hint">מידות משוערות</span>':''}${linkBtn(pr)}${!pr.photoId&&assets?`<button type="button" class="ghost" data-act="photoFor" data-pid="${pr.id}">${ic('img',15)} הוספת תמונה</button>`:''}</div></div>`;
  h+=viewNote();if(!ed)return h+(pr?'':`<p class="hint">פריט כללי. מחיר לפי רמה: ${ils(C.p[TI[tierOf(key)]])}.</p>`);
  h+=`<label class="tog"><input type="checkbox" data-act="ex" ${i.ex?'checked':''}> פריט קיים, נשאר (בלי עלות)</label>`;
  if(!i.ex&&!C.model){h+=field(pr?'מוצר אמיתי':'קישור למוצר אמיתי',productPicker(i.type,i.pid,'linkItem')+(pr?`<button type="button" class="ghost" data-act="unlink">ביטול הקישור</button>`:''),pr?'':'המחיר, המידות והצבע יילקחו מהמוצר');}
  if(!i.ex&&!pr){const mm=sizeMult(i)*finMult(i);h+=field('רמת מחיר',tierRow(key,C.p.map(v=>v*mm)));}
  if(!i.ex)h+=field('עדיפות',tagRow(key,C.tag));
  if(C.model&&C.model.chips)h+=field('גוון',`<div class="sw">${C.model.chips.map((c,ix)=>`<button type="button" class="chip${c===(i.c||C.c)?' on':''}" data-act="color" data-path="item:${i.id}" data-v="${c}" title="${esc(C.model.variants[ix])}" style="background:${c}"></button>`).join('')}</div>`);
  else if(C.pal&&C.pal.length>1)h+=field(pr?'צבע (עקיפת צבע המוצר)':'צבע / חומר',swatches('item:'+i.id,C.pal,col));
  {const D=dimsOf(i),cust=i.w||i.d||i.h,showD=!C.wall&&!['tableR','coffeeR','pouf'].includes(i.type)||C.hang,showH=!C.hang&&(!C.wall||i.type==='tvSlats'||C.model)&&i.type!=='rug',cm=v=>Math.round(v*100);
    const inp=(k,l,v)=>`<label>${l} <input type="number" min="1" max="1000" step="1" inputmode="numeric" data-act="dimI" data-k="${k}" value="${cm(v)}"></label>`;
    h+=field('מידות (ס״מ)',`<div class="row dimrow">${inp('w',C.hang||['tableR','coffeeR','pouf'].includes(i.type)?'קוטר':'רוחב',D.w)}${showD&&!C.hang?inp('d','עומק',D.d):''}${showH?inp('h','גובה',D.h):''}</div>${cust?`<button type="button" class="ghost" data-act="dimReset">חזרה למידה המקורית</button>`:''}`,
      R.PSCALE[i.type]&&!pr?'המחיר מתעדכן לפי המידה':(pr&&cust?'מידה שונה מהמוצר שנבחר':''));}
  if(R.UPHOL.includes(i.type)&&!C.model)h+=field('סוג ריפוד',select('fin',Object.entries(R.FINISHES),i.fin||'fabric'),pr?'':'משפיע על המראה ועל המחיר');
  if(C.y!=null&&!C.wall)h+=field('גובה הנחה',seg('elev',[['0','רצפה'],['0.4','שולחן סלון'],['0.775','שולחן אוכל'],['0.92','משטח']],String(i.y!=null?i.y:C.y)));
  h+=field('סיבוב',`<div class="btns"><button type="button" data-act="rot" data-v="-90">↶ 90°</button><button type="button" data-act="rot" data-v="-15">↶ 15°</button><button type="button" data-act="rot" data-v="15">15° ↷</button><button type="button" data-act="rot" data-v="90">90° ↷</button><label class="deg"><input type="number" step="1" data-act="rotDeg" value="${(((Math.round((i.rot||0)*180/Math.PI))%360)+360)%360}" aria-label="זווית במעלות">°</label></div>`);
  h+=field('מיקום (מ׳)',`<div class="row"><label>מערב-מזרח <input type="number" step="0.05" data-act="pos" data-axis="x" value="${i.x.toFixed(2)}"></label><label>צפון-דרום <input type="number" step="0.05" data-act="pos" data-axis="z" value="${i.z.toFixed(2)}"></label></div>`);
  h+=`<div class="btns end"><button type="button" data-act="dup">שכפול</button><button type="button" class="danger" data-act="del">מחיקה</button></div>`;return h;}
function pRoom(id){const r=S.rooms[id],pr=P.rooms[id],ed=mode==='edit';let h=head(pr.n,`${pr.area.toFixed(1)} מ״ר · היקף ${pr.perim.toFixed(1)} מ׳`)+viewNote();const t=TI[tierOf('floor:'+id)];
  if(!ed)return h+linesFor(l=>l.ref&&l.ref.kind==='room'&&l.ref.id===id);
  h+=field('ריצוף',select('floor',Object.entries(R.FLOORS).map(([k,f])=>[k,k==='keep'?f.n:`${f.n} · ${ils(f.mat[t]+f.inst[t])} למ״ר`]),r.floor,`data-room="${id}"`),'כולל פירוק, הנחה ומע״מ');
  if(r.floor!=='keep'){h+=field('רמת מחיר לריצוף',tierRow('floor:'+id,null));h+=field('עדיפות',tagRow('floor:'+id,r.ftag||'must'));}
  h+=field('צבע קירות',swatches('room:'+id,R.WALL_COLORS,r.wall));
  h+=`<label class="tog"><input type="checkbox" data-act="paint" data-room="${id}" ${r.paint?'checked':''}> לכלול צביעת קירות ותקרה בתקציב</label>`;
  if(id==='open')h+=field('תריסים חשמליים',Object.entries(R.SHUTTERS).map(([k,s])=>`<label class="tog"><input type="checkbox" data-act="shutter" data-k="${k}" ${S.shutters[k]?'checked':''}> ${s.n.replace('תריס חשמלי, ','')} · ${ils(s.p[TI[tierOf('shutter:'+k)]])}</label>`).join(''));
  return h+linesFor(l=>l.ref&&l.ref.kind==='room'&&l.ref.id===id);}
function pKitchen(){const k=S.kitchen,ed=mode==='edit';let h=head('ק-מטבח','ארונות, משטח, מכשירים וחלון')+viewNote();
  if(!ed)return h+linesFor(l=>l.grp==='ק-מטבח');
  h+=`<label class="tog"><input type="checkbox" data-act="kf" data-f="keep" ${k.keep?'checked':''}> המטבח הקיים, בלי שינוי</label>`;if(k.keep)return h;
  h+=field('מיקום הכיריים',seg('kf',[['side','על קיר החלון'],['island','באי']],k.cook,'data-f="cook"'));
  if(k.cook==='side')h+=field('איפה על קיר החלון',seg('kf',[['oven','ליד התנור'],['window','במרכז החלון']],k.cookPos||'oven','data-f="cookPos"'));
  h+=`<label class="tog"><input type="checkbox" data-act="kf" data-f="hood" ${k.hood?'checked':''}> קולט אדים מעל הכיריים${k.cook==='side'&&k.cookPos!=='window'?' (ארון קולט בקיר)':' (קולט תקרה)'}</label>`;
  if(!k.hood)h+=`<p class="hint">בלי קולט. בכיריים גז מומלץ לתכנן לפחות מאוורר או קולט נשלף.</p>`;
  {const mx=winMax(k,S.dims),wv=Math.min(+k.winW,mx);h+=field('רוחב החלון החדש',`<div class="row"><input type="range" min="0.6" max="${mx.toFixed(2)}" step="0.05" data-act="kf" data-f="winW" value="${wv}"><output>${wv.toFixed(2)} מ׳</output></div>`,k.cook==='side'&&k.cookPos!=='window'?'הכיריים ליד התנור מגבילות את רוחב החלון':'');}
  h+=`<h3>מידות המטבח</h3>`+[['DIND','עומק פינת האוכל',0,3.5],['KA','קיר החלון',1.8,4.2],['KB','קיר הכיור',1.5,4],['ISL','אורך האי',1.2,3],['ISW','רוחב האי',.8,1.5]].map(([dk,n,a,b])=>field(n,`<div class="row"><input type="range" min="${a}" max="${b}" step="0.05" data-act="dim" data-k="${dk}" value="${S.dims[dk]}"><output>${(+S.dims[dk]).toFixed(2)} מ׳</output></div>`)).join('');
  h+=`<h3>ארונות</h3>`+field('חומר חזיתות',select('kf',Object.entries(R.FRONTS).map(([v,f])=>[v,`${f.n} · ${ils(f.p)} למ׳`]),k.fronts,'data-f="fronts"'));
  h+=field('סגנון חזיתות',seg('kf',Object.entries(R.FRONT_STYLES),k.style||'flat','data-f="style"'),'מסגרת +15%, פסים +25%');
  h+=field('רמת פרזול וגימור',tierRow('kfront',null));
  [['base','ארונות תחתונים'],['upper','ארונות עליונים'],['island','אי'],['tower','ארון תנור גבוה']].forEach(([f,n])=>h+=field(n,swatches('k:'+f,R.CAB_COLORS,k[f])));
  h+=`<h3>משטח וחיפוי</h3>`+field('משטח',select('kf',Object.entries(R.COUNTERS).filter(([v])=>v!=='oldBeige').map(([v,c])=>[v,c.n]),k.counter,'data-f="counter"'));
  {const C0=R.COUNTERS[k.counter]||R.COUNTERS.qWhite;h+=field('גוון המשטח',swatches('k:ctrColor',[C0.c].concat(R.CTR_COLORS.filter(c=>c!==C0.c)),k.ctrColor||C0.c));}
  h+=field('עובי',seg('kf',[['2','2 ס״מ'],['4','4 ס״מ'],['6','6 ס״מ']],String(k.ctrThick||4),'data-f="ctrThick"'));
  h+=field('גימור',seg('kf',[['polish','מבריק'],['matte','מט']],k.ctrFinish||'polish','data-f="ctrFinish"'));
  h+=field('חיפוי קיר',seg('kf',Object.entries(R.SPLASH),k.splash||'ctr','data-f="splash"'));
  if(k.splash&&k.splash!=='ctr')h+=field('צבע החיפוי',swatches('k:splashC',R.SPLASH_COLORS,k.splashC||(k.splash==='zellige'?'#DCE3DD':'#F4F2EC')));
  if(R.SPLASH_P[k.splash])h+=field('רמת חיפוי',tierRow('ksplash',R.SPLASH_P[k.splash].map(v=>v*(S.dims.KA-.6+S.dims.KB)*.6)));
  h+=field('רמת משטח',tierRow('kcounter',(R.COUNTERS[k.counter]||R.COUNTERS.qWhite).p));
  h+=field('ידיות',select('kf',Object.entries(R.HANDLES),k.handle,'data-f="handle"'));
  h+=`<h3>מכשירים</h3>`+R.APPL_SLOTS.filter(([slot])=>slot!=='hood'||k.hood).map(([slot,akey,n])=>{const ak=akey||hoodKey(k),opts=Object.values(products).filter(p=>p.cat==='appl:'+slot).sort((a,b)=>a.price-b.price),pr=products[k.applP[slot]];
    return `<div class="appl"><div class="row sp"><b>${n}</b>${pr?linkBtn(pr):''}</div>${opts.length?select('applP',[['','לפי רמת מחיר, בלי דגם']].concat(opts.map(p=>[p.id,`${p.name} · ${ils(p.price)}`])),k.applP[slot]||'',`data-slot="${slot}"`):''}${pr?'':seg('tier',R.TIERS.map(x=>[x,ilsK(R.APPL[ak].p[TI[x]])]),tierOf('appl:'+slot),`data-key="appl:${slot}"`)}</div>`;}).join('');
  return h+linesFor(l=>l.grp==='ק-מטבח');}
function pStairs(){const st=S.stairs,ed=mode==='edit';let h=head('מדרגות ומעקה','ק-מבואה')+viewNote();if(!ed)return h+linesFor(l=>l.ref&&l.ref.kind==='stairs');
  h+=field('חיפוי מדרגות',select('st',Object.entries(R.CLAD).map(([v,c])=>[v,c.n]),st.clad,'data-f="clad"'));
  if(st.clad!=='keep')h+=field('רמת חיפוי',tierRow('clad',R.CLAD[st.clad].p.map(v=>v*17)));
  h+=field('מעקה',select('st',Object.entries(R.RAIL).map(([v,c])=>[v,c.n]),st.rail,'data-f="rail"'),'מאחז רציף לכל האורך');
  if(st.rail!=='keep')h+=field('רמת מעקה',tierRow('rail',null));
  h+=`<label class="tog"><input type="checkbox" data-act="st" data-f="led" ${st.led?'checked':''}> תאורת לד בקיר, בכל מדרגה</label>`;
  if(st.rail==='keep')h+=`<p class="note">המעקה הקיים מעץ עם עמודים מסובבים. למבוגרים עדיף מאחז רציף ויציב.</p>`;return h+linesFor(l=>l.ref&&l.ref.kind==='stairs');}
function pUnder(){const u=S.under,ed=mode==='edit';let h=head('מתחת למדרגות','היום: אחסון פתוח וקרש גיהוץ')+viewNote();if(!ed)return h+`<p>${R.UNDER[u.sol].n}</p>`;
  h+=`<div class="cards">${Object.entries(R.UNDER).map(([v,o])=>`<button type="button" class="card${v===u.sol?' on':''}" data-act="under" data-v="${v}"><b>${o.n}</b><span>${o.p[2]?ils(o.p[TI[tierOf('under')]]):'בלי עלות'}</span></button>`).join('')}</div>`;
  if(u.sol!=='open'&&u.sol!=='shelves')h+=field('צבע חזיתות',swatches('under',R.CAB_COLORS,u.c));if(u.sol!=='open')h+=field('רמת מחיר',tierRow('under',R.UNDER[u.sol].p));return h;}
function pAdd(){return `<p class="hint">הפריט נוסף במרכז המבט. במצב עריכה אפשר לגרור אותו למקום. מוצרים אמיתיים מוסיפים מלשונית "מוצרים".</p>`+
  `<h3>דגמים ריאליסטיים</h3><div class="addlist">${Object.entries(R.CAT).filter(([,c])=>c.model).map(([k,c])=>`<button type="button" data-act="add" data-v="${k}"><span>${c.n.replace(' (דגם ריאליסטי)','')}</span><b>${ilsK(c.p[0])}–${ilsK(c.p[2])}</b></button>`).join('')}</div>`+
  R.CAT_GROUPS.map(g=>`<h3>${g}</h3><div class="addlist">${Object.entries(R.CAT).filter(([,c])=>c.g===g&&!c.model).map(([k,c])=>`<button type="button" data-act="add" data-v="${k}"><span>${c.n}</span><b>${ilsK(c.p[0])}–${ilsK(c.p[2])}</b></button>`).join('')}</div>`).join('');}

/* products tab: board (in design) / library / new */
function usedProducts(){const m=new Map();S.items.forEach(i=>{const p=prodOf(i);if(p&&!i.ex){const e=m.get(p.id)||{p,n:0};e.n++;m.set(p.id,e);}});Object.values(S.kitchen.applP||{}).forEach(id=>{const p=products[id];if(p&&!S.kitchen.keep){const e=m.get(id)||{p,n:0};e.n++;m.set(id,e);}});return [...m.values()];}
function pProducts(){let h=seg('pview',[['board','לוח העיצוב'],['lib','ספריית מוצרים'],['new','מוצר חדש']],prodView);
  if(dbState==='none')h+=`<p class="note">ספריית המוצרים נטענת רק כשהעמוד פתוח ב-Claude.</p>`;
  if(prodView==='board'){const U=usedProducts(),tot=U.reduce((a,e)=>a+e.p.price*e.n,0),k=S.kitchen;
    const pal=[['ריצוף',X.floorHex('open',S.rooms.open.floor)],['קירות',S.rooms.open.wall],['ארונות',X.hexOf(k.base)],['אי',X.hexOf(k.island)],['ארון גבוה',X.hexOf(k.tower)],['משטח',(R.COUNTERS[k.counter]||R.COUNTERS.qWhite).c]];
    h+=`<div class="palette">${pal.map(([n,c])=>`<div><span style="background:${c}"></span><em>${n}</em></div>`).join('')}</div>`;
    h+=`<div class="row sp"><h3>${U.length} מוצרים בעיצוב</h3><b class="num">${ils(tot)}</b></div>`;
    h+=U.length?`<div class="board">${U.map(({p,n})=>`<div class="bcard">${prodThumb(p,'bimg')}<div class="bt"><b>${esc(p.name)}</b><span>${n>1?n+' × ':''}${ils(p.price)}</span><div class="row">${linkBtn(p)}${!p.photoId&&assets?`<button type="button" class="ghost" data-act="photoFor" data-pid="${p.id}">${ic('img',14)} תמונה</button>`:''}</div></div></div>`).join('')}</div>`:'<p class="hint">עוד אין מוצרים אמיתיים בעיצוב.</p>';
    const un=S.items.filter(i=>!i.ex&&!i.pid&&!R.CAT[i.type].model&&Object.values(products).some(p=>p.cat===i.type));
    if(un.length)h+=`<h3>פריטים כלליים שאפשר להחליף במוצר</h3><div class="addlist">${un.map(i=>`<button type="button" data-act="sel" data-kind="item" data-id="${i.id}"><span>${R.CAT[i.type].n}</span><b>${RG[X.roomAt(P,i.x,i.z)]||''}</b></button>`).join('')}</div>`;
    return h;}
  if(prodView==='lib'){const cats=[...new Set(Object.values(products).map(p=>p.cat))];
    h+=select('pfilter',[['all','כל הקטגוריות']].concat(R.PRODUCT_CATS.filter(([c])=>cats.includes(c))),prodFilter);
    const L=Object.values(products).filter(p=>prodFilter==='all'||p.cat===prodFilter).sort((a,b)=>(a.cat>b.cat?1:a.cat<b.cat?-1:a.price-b.price));
    const selIt=sel&&sel.kind==='item'?itemById(sel.id):null;
    h+=`<div class="plist">${L.map(p=>`<div class="prow">${prodThumb(p)}<div class="pi"><b>${esc(p.name)}</b><span>${catName(p.cat)} · ${ils(p.price)}${p.w?` · ${p.w}×${p.d||'?'} ס״מ`:''}${p.est?' (משוער)':''}</span><div class="row">${linkBtn(p)}
      ${mode==='edit'&&!p.cat.startsWith('appl:')&&R.CAT[p.cat]?`<button type="button" class="ghost" data-act="addProd" data-pid="${p.id}">${ic('plus',14)} להדמיה</button>`:''}
      ${mode==='edit'&&selIt&&selIt.type===p.cat?`<button type="button" class="ghost" data-act="linkItem" data-pid="${p.id}">החלפה בפריט הנבחר</button>`:''}
      ${assets?`<button type="button" class="ghost" data-act="photoFor" data-pid="${p.id}">${ic('img',14)} ${p.photoId?'החלפת תמונה':'תמונה'}</button>`:''}
      ${p.user?`<button type="button" class="ghost" data-act="editProd" data-pid="${p.id}">עריכה</button>`:''}</div></div></div>`).join('')||'<p class="hint">אין מוצרים להצגה.</p>'}</div>`;
    h+=`<p class="hint">המחירים נאספו ב-3.10.2026. לפני קנייה כדאי לבדוק באתר. מוצרים ותמונות שמוסיפים כאן נשמרים בדפדפן הזה. מוצר שמשתמשים בו בעיצוב עובר בקישור השיתוף, בלי התמונה.</p>`;return h;}
  const e=editProd?products[editProd]||{}:{};
  h+=`<form id="prodForm" class="pform" novalidate>
    ${field('קישור למוצר',`<input type="url" id="pfUrl" inputmode="url" placeholder="https://www.ikea.com/il/he/p/..." value="${esc(e.url||'')}">`)}
    ${field('שם המוצר',`<input type="text" id="pfName" maxlength="120" placeholder="ספה תלת-מושבית, בז׳ בהיר" value="${esc(e.name||'')}">`)}
    <div class="row">${field('חנות',`<input type="text" id="pfStore" maxlength="40" placeholder="איקאה" value="${esc(e.store||'')}">`)}${field('מחיר (₪)',`<input type="number" id="pfPrice" min="0" step="1" placeholder="2695" value="${esc(e.price||'')}">`)}</div>
    ${field('קטגוריה',select('pfCat',R.PRODUCT_CATS,e.cat||'sofa3','id="pfCat"'))}
    <div class="row">${field('רוחב (ס״מ)',`<input type="number" id="pfW" min="10" max="600" value="${esc(e.w||'')}">`)}${field('עומק (ס״מ)',`<input type="number" id="pfD" min="5" max="600" value="${esc(e.d||'')}">`)}</div>
    ${field('תמונה',`<input type="file" id="pfImg" accept="image/*">`,assets?'צילום מסך מהאתר מספיק':'העלאת תמונות לא זמינה בדפדפן הזה')}
    ${field('צבע להדמיה',`<input type="color" id="pfColor" value="${/^#/.test(e.color||'')?e.color:'#d8cfc0'}">`,'נלקח אוטומטית מהתמונה אם לא שיניתם')}
    <p class="err" id="pfErr" hidden></p>
    <div class="btns"><button type="submit" class="primary">${editProd?'שמירת שינויים':'הוספה לספרייה'}</button>${editProd?`<button type="button" data-act="cancelEdit">ביטול</button><button type="button" class="danger" data-act="delProd" data-pid="${editProd}">${pendingConfirm==='delProd'?'למחוק?':'מחיקה'}</button>`:''}</div></form>`;
  return h;}

function pBudget(){const T=totals(),lim=LIM[S.filter],groups={};T.L.forEach(l=>{if(l.existing)return;(groups[l.grp]=groups[l.grp]||[]).push(l);});const exCount=T.L.filter(l=>l.existing).length;
  let h=`<div class="bsum"><div><span class="eyebrow">קומת קרקע + רזרבה</span><b>${ils(T.total)}</b></div><div><span class="eyebrow">נשאר מתוך ${ilsK(R.TOTAL_BUDGET)}</span><b class="${T.remain<0?'neg':''}">${ils(T.remain)}</b></div></div>`;
  h+=`<p class="hint">היתרה מיועדת לקומה העליונה: ע-הורים, שני חדרי הרחצה והריצוף שם.</p>`;
  h+=field('מה נכנס לסכום',seg('filter',[['must','חובה'],['nice','חובה + רצוי'],['all','הכל']],S.filter));
  h+=field('רמת מחיר ברירת מחדל',seg('gtier',R.TIERS.map(x=>[x,R.TIER_N[x]]),S.tier),'למוצרים אמיתיים יש מחיר קבוע');
  h+=field('רזרבה לבלת״מים',`<div class="row"><input type="range" min="10" max="15" step="1" data-act="reserve" value="${S.reservePct}"><output>${S.reservePct}% · ${ils(T.reserve)}</output></div>`);
  h+=`<div class="tagsum"><span>חובה ${ilsK(T.by.must)}</span><span>רצוי ${ilsK(T.by.nice)}</span><span>אם יישאר ${ilsK(T.by.opt)}</span></div>`;
  ['ק-מטבח','ק-סלון ופינת אוכל','ק-מבואה ומדרגות','ק-ממד','ק-שירות','ק-מרפסת','תריסים חשמליים','עלויות נלוות','ריהוט'].filter(g=>groups[g]).forEach(g=>{const L=groups[g],st=L.filter(l=>RANK[l.tag]<=lim).reduce((a,l)=>a+l.price,0);
    h+=`<details class="grp"><summary><span>${g}</span><b>${ils(st)}</b></summary><table class="bl"><tbody>${L.map(l=>`<tr class="${RANK[l.tag]>lim?'out':''}"><td><button type="button" class="lnk" data-act="selRef" data-ref='${esc(JSON.stringify(l.ref))}'>${esc(l.label)}</button>${l.prod?`<span class="badge">מוצר אמיתי</span>`:''}<div class="lctl">${l.tier?`<select data-act="ltier" data-key="${l.key}" aria-label="רמה">${R.TIERS.map(x=>`<option value="${x}"${x===l.tier?' selected':''}>${R.TIER_N[x]}</option>`).join('')}</select>`:''}<select data-act="ltag" data-key="${l.key}" aria-label="עדיפות">${Object.entries(R.TAG_N).map(([v,n])=>`<option value="${v}"${v===l.tag?' selected':''}>${n}</option>`).join('')}</select></div></td><td class="n">${ils(l.price)}</td></tr>`).join('')}</tbody></table></details>`;});
  h+=`<h3>עלויות נלוות</h3>`+Object.entries(R.EXTRAS).map(([k,e])=>`<label class="tog"><input type="checkbox" data-act="extra" data-k="${k}" ${S.extras[k]?'checked':''}> ${e.n} · ${ils(e.p[TI[tierOf('extra:'+k)]])}</label>`).join('');
  if(exCount)h+=`<p class="hint">${exCount} פריטים מסומנים כקיימים ולא נספרים.</p>`;
  return h+`<p class="note">מחירי מוצרים אמיתיים הם מחירי האתר בזמן האיסוף. שאר המחירים הם טווחי שוק משוערים כולל מע״מ.</p>`;}
function pMore(){const d=S.dims,p=P;
  let h=`<h3>גרסאות</h3><div class="row"><input type="text" id="verName" maxlength="60" placeholder="למשל: אי ירוק, מעקה זכוכית" value="${esc(S.name||'')}" aria-label="שם הגרסה"><button type="button" class="primary" data-act="save">שמירה</button></div>`;
  h+=`<p class="hint">${dbState==='ok'?'הגרסאות נשמרות בדפדפן הזה. כדי להעביר עיצוב למישהו אחר: כפתור "שיתוף" למעלה.':dbState==='none'?'השמירה המשותפת לא זמינה בתצוגה הזו. הגרסאות יישמרו בדפדפן הזה בלבד.':'מתחבר…'}</p>`;if(msg)h+=`<p class="ok">${esc(msg)}</p>`;
  h+=`<div class="vlist">${versions.length?versions.map(v=>`<div class="vrow"><div><b>${esc(v.name||'ללא שם')}</b><span>${new Date(v.savedAt).toLocaleString('he-IL',{dateStyle:'short',timeStyle:'short'})} · ${v.total?ilsK(v.total):''}</span></div><div class="btns"><button type="button" data-act="load" data-id="${v.id}">${pendingConfirm==='load:'+v.id?'לאשר?':'טעינה'}</button><button type="button" class="danger" data-act="delv" data-id="${v.id}">${pendingConfirm==='delv:'+v.id?'למחוק?':'מחיקה'}</button></div></div>`).join(''):'<p class="hint">עוד אין גרסאות שמורות.</p>'}</div>`;
  h+=`<h3>נקודת התחלה</h3><div class="addlist">${[['mix','השילוב שלי, עם מוצרים אמיתיים'],['a','א׳ לבן חם ועץ'],['c','ג׳ ירוק מרווה'],['now','המצב היום']].map(([k,n])=>`<button type="button" data-act="preset" data-v="${k}"><span>${n}</span>${pendingConfirm==='preset:'+k?'<b class="warn">לחיצה נוספת מחליפה את העיצוב</b>':''}</button>`).join('')}</div>`;
  h+=`<h3>מידות</h3><p class="hint">כל המידות הערכה מהתמונות. מעדכנים מספר, והמודל, השטחים והמחירים מתעדכנים מיד.</p><div class="dims">${R.DIM_META.map(([k,l,hint])=>`<label><span>${l}${hint?`<em>${hint}</em>`:''}</span><input type="number" step="0.05" min="${k==='DIND'?0:0.5}" max="20" data-act="dim" data-k="${k}" value="${(+d[k]).toFixed(2)}"></label>`).join('')}</div>`;
  h+=`<table class="mini"><tbody>${Object.keys(p.rooms).map(id=>`<tr><td>${p.rooms[id].n}</td><td class="n">${p.rooms[id].area.toFixed(1)} מ״ר</td></tr>`).join('')}</tbody></table><button type="button" data-act="dimsReset">חזרה למידות המשוערות</button>`;
  h+=`<h3>שיתוף וקבצים</h3><div class="btns"><button type="button" class="primary" data-act="share">${ic('link',15)} העתקת קישור לעיצוב</button><button type="button" data-act="export">הורדת העיצוב כקובץ</button><button type="button" data-act="import">פתיחת קובץ עיצוב</button></div><p class="hint">מי שפותח את הקישור מקבל עותק משלו של העיצוב. השינויים שלו לא משנים את שלך.</p>`;
  h+=`<h3>קרדיטים</h3><p class="hint">דגמים ריאליסטיים: Khronos glTF Sample Assets. GlamVelvetSofa ו-SheenChair מאת Eric Chadwick עבור Wayfair (CC BY 4.0 / CC0). DiffuseTransmissionPlant ו-AnisotropyBarnLamp מאת Eric Chadwick (CC BY 4.0). GlassVaseFlowers (CC0). צילום ריאליסטי: three-gpu-pathtracer.</p>`;
  return h;}

/* ---------- panel events ---------- */
function setColor(path,v){const [kind,a]=path.split(':');
  if(kind==='item')commit(s=>{s.items.find(i=>i.id===a).c=v;},'items');else if(kind==='room')commit(s=>{s.rooms[a].wall=v;},'arch');else if(kind==='k')commit(s=>{s.kitchen[a]=v;},'arch');else if(kind==='under')commit(s=>{s.under.c=v;},'arch');}
function addItem(type,extra){const C=R.CAT[type],it=Object.assign({id:R.nid(),type,x:+target.x.toFixed(2),z:+target.z.toFixed(2),rot:0},extra||{});if(C.y!=null&&!C.wall&&it.y==null)it.y=C.y;
  commit(s=>{s.items.push(it);},'items');sel={kind:'item',id:it.id};tab='edit';refreshHelper();renderPanel();if(mode!=='edit')setMode('edit');toast('נוסף במרכז המבט');}
body.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.tagName==='SELECT'||(b.tagName==='INPUT'&&b.type!=='button'))return;const a=b.dataset.act,v=b.dataset.v;
  if(!['preset','load','delv','delProd'].includes(a))pendingConfirm=null;
  switch(a){
    case 'desel':sel=null;refreshHelper();renderPanel();break;
    case 'mode':setMode(v);break;
    case 'sel':sel={kind:b.dataset.kind,id:b.dataset.id||undefined};tab='edit';refreshHelper();renderPanel();flyTo(sel);break;
    case 'selRef':{const r=JSON.parse(b.dataset.ref);if(r.kind==='extras')break;sel=r;tab='edit';refreshHelper();renderPanel();flyTo(sel);break;}
    case 'tier':commit(()=>setOver(b.dataset.key,'t',v),'none');break;
    case 'tag':commit(()=>setOver(b.dataset.key,'tag',v),'none');break;
    case 'color':setColor(b.dataset.path,v);break;
    case 'rot':rotItem(sel.id,+v);break;
    case 'elev':commit(s=>{s.items.find(i=>i.id===sel.id).y=+v;},'items');break;
    case 'dup':{const i=itemById(sel.id),n=Object.assign({},i,{id:R.nid(),x:+(i.x+.4).toFixed(3),z:+(i.z+.4).toFixed(3)});commit(s=>{s.items.push(n);if(s.over['item:'+i.id])s.over['item:'+n.id]=Object.assign({},s.over['item:'+i.id]);},'items');sel={kind:'item',id:n.id};refreshHelper();renderPanel();break;}
    case 'del':delItem(sel.id);break;
    case 'linkItem':{const pid=b.dataset.pid,it=sel&&sel.kind==='item'?itemById(sel.id):null;if(!it)break;commit(s=>{const x=s.items.find(q=>q.id===it.id);x.pid=pid;delete x.c;delete x.w;delete x.d;delete x.h;},'items');toast('המוצר קושר לפריט');break;}
    case 'unlink':commit(s=>{delete s.items.find(q=>q.id===sel.id).pid;},'items');break;
    case 'kf':commit(s=>{const f=b.dataset.f;s.kitchen[f]=f==='ctrThick'?+v:v;if(f==='cook')s.kitchen.winW=v==='island'?2.3:1.55;},'arch');break;
    case 'dimReset':commit(s=>{const i=s.items.find(x=>x.id===sel.id);delete i.w;delete i.d;delete i.h;},'items');break;
    case 'under':commit(s=>{s.under.sol=v;},'arch');break;
    case 'add':addItem(v);break;
    case 'addProd':{const p=products[b.dataset.pid];if(p)addItem(p.cat,{pid:p.id});break;}
    case 'pview':prodView=v;editProd=null;renderPanel();break;
    case 'photoFor':pickPhoto(b.dataset.pid);break;
    case 'editProd':editProd=b.dataset.pid;prodView='new';renderPanel();break;
    case 'cancelEdit':editProd=null;prodView='lib';renderPanel();break;
    case 'delProd':if(pendingConfirm==='delProd'){pendingConfirm=null;deleteProduct(b.dataset.pid);}else{pendingConfirm='delProd';renderPanel();}break;
    case 'filter':commit(s=>{s.filter=v;},'none');break;
    case 'gtier':commit(s=>{s.tier=v;},'none');break;
    case 'dimsReset':commit(s=>{s.dims=Object.assign({},R.DIMS);},'all');break;
    case 'preset':if(pendingConfirm==='preset:'+v){pendingConfirm=null;snapshot();S=migrate(R.preset(v,S.dims));sel=null;after('all');goTo('kitchen');}else{pendingConfirm='preset:'+v;renderPanel();}break;
    case 'save':saveVersion();break;
    case 'load':if(pendingConfirm==='load:'+b.dataset.id){pendingConfirm=null;const vv=versions.find(x=>x.id===b.dataset.id);if(vv){snapshot();S=migrate(JSON.parse(vv.state));sel=null;after('all');msg='הגרסה נטענה';renderPanel();}}else{pendingConfirm='load:'+b.dataset.id;renderPanel();}break;
    case 'delv':if(pendingConfirm==='delv:'+b.dataset.id){pendingConfirm=null;deleteVersion(b.dataset.id);}else{pendingConfirm='delv:'+b.dataset.id;renderPanel();}break;
    case 'export':exportJSON();break;
    case 'share':doShare();break;
    case 'import':$('#importFile').value='';$('#importFile').click();break;
  }});
body.addEventListener('change',e=>{const el=e.target,a=el.dataset.act;if(!a)return;switch(a){
  case 'colorPick':setColor(el.dataset.path,el.value);break;
  case 'ex':commit(s=>{s.items.find(i=>i.id===sel.id).ex=el.checked?1:0;},'items');break;
  case 'dimI':{const v=+el.value;if(!(v>=1&&v<=1000))return;commit(s=>{s.items.find(i=>i.id===sel.id)[el.dataset.k]=+(v/100).toFixed(3);},'items');break;}
  case 'rotDeg':{const v=+el.value;if(!isFinite(v))return;commit(s=>{s.items.find(i=>i.id===sel.id).rot=+((((v%360)+360)%360)*Math.PI/180).toFixed(4);},'items');break;}
  case 'fin':commit(s=>{const i=s.items.find(x=>x.id===sel.id);if(el.value==='fabric')delete i.fin;else i.fin=el.value;},'items');break;
  case 'pos':commit(s=>{const i=s.items.find(x=>x.id===sel.id);i[el.dataset.axis]=+(+el.value).toFixed(3);},'items');break;
  case 'floor':commit(s=>{s.rooms[el.dataset.room].floor=el.value;},'arch');break;
  case 'paint':commit(s=>{s.rooms[el.dataset.room].paint=el.checked?1:0;},'none');break;
  case 'shutter':commit(s=>{s.shutters[el.dataset.k]=el.checked?1:0;},'none');break;
  case 'kf':commit(s=>{const f=el.dataset.f;s.kitchen[f]=el.type==='checkbox'?(el.checked?1:0):f==='winW'?+el.value:el.value;if(f==='counter')delete s.kitchen.ctrColor;if(f==='keep')Object.assign(s.kitchen,el.checked?{base:'#4B2A1F',upper:'#4B2A1F',tower:'#4B2A1F',island:'#3A2119',counter:'oldBeige',handle:'steel',cook:'under',winW:1.0}:{base:'#F1EEE8',upper:'#F1EEE8',tower:'oak',island:'#9DAB91',counter:'qWhite',handle:'black',cook:'side',winW:1.55});},'arch');break;
  case 'applP':commit(s=>{if(el.value)s.kitchen.applP[el.dataset.slot]=el.value;else delete s.kitchen.applP[el.dataset.slot];},'none');break;
  case 'st':commit(s=>{s.stairs[el.dataset.f]=el.type==='checkbox'?(el.checked?1:0):el.value;},'arch');break;
  case 'ltier':commit(()=>setOver(el.dataset.key,'t',el.value),'none');break;
  case 'ltag':commit(()=>setOver(el.dataset.key,'tag',el.value),'none');break;
  case 'extra':commit(s=>{s.extras[el.dataset.k]=el.checked?1:0;},'none');break;
  case 'reserve':commit(s=>{s.reservePct=+el.value;},'none');break;
  case 'pfilter':prodFilter=el.value;renderPanel();break;
  case 'dim':{const v=+el.value;if(!(v>0)&&!(el.dataset.k==='DIND'&&v===0))return;commit(s=>{s.dims[el.dataset.k]=v;},'all');break;}}});
body.addEventListener('input',e=>{const el=e.target;if(el.type==='range'){const o=el.parentElement.querySelector('output');if(o)o.textContent=el.dataset.act==='reserve'?el.value+'%':(+el.value).toFixed(2)+' מ׳';}});
body.addEventListener('submit',e=>{if(e.target.id==='prodForm'){e.preventDefault();submitProduct();}});
function flyTo(s){if(!s)return;const map={kitchen:'kitchen',stairs:'hall',under:'under'};if(map[s.kind])return goTo(map[s.kind]);if(s.kind==='room')return goTo({open:'living',hall:'hall',mamad:'mamad',service:'service',balcony:'balcony'}[s.id]||'kitchen');}

/* ---------- top bar ---------- */
function renderTop(){const T=totals();$('#budgetPill').innerHTML=`<span>נשאר</span><b class="${T.remain<0?'neg':''}">${ilsK(T.remain)}</b>`;$('#budgetPill').title=`קומת קרקע כולל רזרבה: ${ils(T.total)}`;$('#designName').textContent=S.name||'';}
function renderViews(){const V=views();$('#views').innerHTML=Object.entries(V).map(([k,v])=>`<button type="button" data-v="${k}" aria-pressed="${k===curView}">${v.n}</button>`).join('');}
$('#views').addEventListener('click',e=>{const b=e.target.closest('button');if(b)goTo(b.dataset.v);});
function setMode(m){mode=m;document.body.dataset.mode=m;const vt=document.querySelector('.modeTag .vt');if(vt)vt.textContent=m==='edit'?(isMobile()?'עריכה: לחיצה ארוכה על פריט, ואז גרירה':'עריכה: גוררים פריטים על הרצפה'):'צפייה: גרירה מסובבת, שתי אצבעות מקרבות';document.querySelectorAll('#modeSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===m));renderPanel();toast(m==='edit'?(isMobile()?'מצב עריכה: לחיצה ארוכה על פריט כדי לגרור':'מצב עריכה: גוררים פריטים על הרצפה'):'מצב צפייה: שום דבר לא זז');}
$('#modeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.v);});
function syncTools(){$('#cutBtn').setAttribute('aria-pressed',cut);$('#lblBtn').setAttribute('aria-pressed',showLbl);}
$('#cutBtn').addEventListener('click',()=>{cut=!cut;P=X.buildArch(S,cut);buildLabels();refreshHelper();syncTools();});
$('#lblBtn').addEventListener('click',()=>{showLbl=!showLbl;lblWrap.hidden=!showLbl;syncTools();});
$('#undoBtn').addEventListener('click',undo);$('#redoBtn').addEventListener('click',redo);
$('#budgetPill').addEventListener('click',()=>{tab='budget';openSheet('mid');renderPanel();});

/* ---------- realistic photo ---------- */
const pv=$('#photo');let pq='m',pl='day';
function photoUI(state,extra={}){pv.hidden=false;const box=pv.querySelector('.pbox');
  if(state==='setup')box.innerHTML=`<h2>צילום ריאליסטי</h2><p class="hint">המנוע מחשב איך האור מתפזר בחדר, מחזיר מהקירות ויוצר צללים רכים, מהמבט הנוכחי. ${isMobile()?'בטלפון זה איטי יותר, ועדיף מהמחשב.':'במחשב זה לוקח בין חצי דקה לכמה דקות.'}</p>
    ${field('איכות',seg('pq',[['l','מהיר'],['m','רגיל'],['h','גבוה']],pq))}${field('תאורה',seg('pl',[['day','יום'],['eve','ערב, תאורה דולקת']],pl))}
    <div class="btns"><button type="button" class="primary" data-pa="go">${ic('camera',16)} התחלה</button><button type="button" data-pa="close">ביטול</button></div>`;
  else if(state==='run')box.innerHTML=`<h2>${esc(extra.status||'מחשב…')}</h2><div class="bar"><span style="width:${extra.pct||0}%"></span></div><p class="hint num">${extra.text||''}</p><div class="btns"><button type="button" data-pa="stop">עצירה</button></div>`;
  else if(state==='done')box.innerHTML=`<h2>הצילום מוכן</h2><img class="shot" src="${extra.url}" alt="צילום ריאליסטי של ${esc(views()[curView]?views()[curView].n:'')}"><div class="btns"><button type="button" class="primary" data-pa="save">שמירת התמונה</button><button type="button" data-pa="again">צילום נוסף</button><button type="button" data-pa="close">סגירה</button></div>`;
  pv.classList.toggle('running',state==='run');}
$('#photoBtn').addEventListener('click',()=>{if(!gl)return;cancelTween();photoUI('setup');});
pv.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.act==='pq'){pq=b.dataset.v;photoUI('setup');return;}if(b.dataset.act==='pl'){pl=b.dataset.v;photoUI('setup');return;}
  const a=b.dataset.pa;if(a==='close'){pv.hidden=true;return;}if(a==='stop'){X.stopPhoto();return;}
  if(a==='again'){photoUI('setup');return;}
  if(a==='save'){await saveImage(photoUrl);return;}
  if(a==='go'){const N=(+new URLSearchParams(location.search).get('pt'))||{l:48,m:180,h:480}[pq];const hv=helper&&helper.visible;if(helper)helper.visible=false;lblWrap.hidden=true;
    photoUI('run',{status:'מכין…'});
    try{const url=await X.photo({target,samples:N,evening:pl==='eve',cut,onStatus:t=>photoUI('run',{status:t}),onProgress:(n,tot,sec)=>{const pct=Math.round(n/tot*100);if(n%2===0||n===tot)photoUI('run',{status:'מחשב אור…',pct,text:`${n} / ${tot} דגימות · ${Math.round(sec)} שניות${n>2?` · נשארו כ-${Math.max(1,Math.round(sec/n*(tot-n)))} שניות`:''}`});}});
      if(helper)helper.visible=hv;lblWrap.hidden=!showLbl;if(url){photoUrl=url;photoUI('done',{url});}else pv.hidden=true;}
    catch(err){if(helper)helper.visible=hv;lblWrap.hidden=!showLbl;photoUI('setup');toast('הצילום נכשל בדפדפן הזה. נסו מהמחשב.',3500);}}});
async function saveImage(url){if(!url)return;const blob=await (await fetch(url)).blob();const name=`הדמיה ${views()[curView]?views()[curView].n:''} ${S.name||''}.png`.replace(/\s+/g,' ');
  if(downloads){try{await downloads.save({filename:name,data:blob});toast('התמונה נשמרה');return;}catch(err){if(err&&err.code==='declined')return;}}toast('לשמירה: לחיצה ארוכה או ימנית על התמונה',3000);}

/* ---------- products: db + assets ---------- */
const fileInput=$('#hiddenFile');let photoTarget=null;
function pickPhoto(pid){if(!assets){toast('העלאת תמונות לא זמינה בדפדפן הזה');return;}photoTarget=pid;fileInput.value='';fileInput.click();}
fileInput.addEventListener('change',async()=>{const f=fileInput.files&&fileInput.files[0];if(!f||!photoTarget)return;const pid=photoTarget;photoTarget=null;
  try{toast('מעלה תמונה…',8000);const {blob,color}=await prepImage(f);const res=await assets.upload(blob);await db.collection('products').doc(pid).update({photoId:res.id,photoColor:color});toast('התמונה נשמרה');}
  catch(err){toast(err&&err.code==='quota_exceeded'?'אין מקום לתמונות נוספות':'העלאת התמונה נכשלה',3500);}});
async function prepImage(file){const bmp=await createImageBitmap(file);const sc=Math.min(1,900/Math.max(bmp.width,bmp.height));const c=document.createElement('canvas');c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);const g=c.getContext('2d');g.drawImage(bmp,0,0,c.width,c.height);
  const s=document.createElement('canvas');s.width=s.height=48;const sg=s.getContext('2d');sg.drawImage(bmp,bmp.width*.2,bmp.height*.2,bmp.width*.6,bmp.height*.6,0,0,48,48);const d=sg.getImageData(0,0,48,48).data;let r=0,gg=0,b=0,n=0;
  for(let i=0;i<d.length;i+=4){const L=(d[i]+d[i+1]+d[i+2])/3;if(L>238||L<12)continue;r+=d[i];gg+=d[i+1];b+=d[i+2];n++;}
  const color=n?'#'+[r/n,gg/n,b/n].map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''):null;
  const blob=await new Promise(res=>c.toBlob(res,'image/jpeg',.86));return {blob,color};}
async function submitProduct(){const err=$('#pfErr'),v=id=>($('#'+id).value||'').trim();const url=v('pfUrl'),name=v('pfName'),price=+v('pfPrice'),cat=$('#pfCat').value,w=+v('pfW')||null,d=+v('pfD')||null,store=v('pfStore');
  const bad=t=>{err.textContent=t;err.hidden=false;};err.hidden=true;
  if(!name)return bad('חסר שם מוצר.');if(url&&!/^https?:\/\//.test(url))return bad('הקישור צריך להתחיל ב-https://');if(!(price>=0)||!v('pfPrice'))return bad('חסר מחיר.');
  if(!db)return bad('שמירת מוצרים לא זמינה בדפדפן הזה.');
  const id=editProd||('u-'+Date.now().toString(36));const old=products[id]||{};let color=$('#pfColor').value,photoId=old.photoId||null;const f=$('#pfImg').files&&$('#pfImg').files[0];
  try{if(f){if(!assets)return bad('העלאת תמונות לא זמינה בדפדפן הזה.');const r=await prepImage(f);const up=await assets.upload(r.blob);photoId=up.id;if(r.color&&color==='#d8cfc0')color=r.color;}
    const doc={name,store,url,price,cat,w,d,color,photoId,user:1,updatedAt:Date.now()};
    await db.collection('products').doc(id).set(doc);editProd=null;prodView='lib';prodFilter=cat;toast('המוצר נשמר בספרייה');renderPanel();}
  catch(e2){bad('השמירה נכשלה. נסו שוב בעוד רגע.');}}
async function deleteProduct(pid){try{await db.collection('products').doc(pid).delete();editProd=null;prodView='lib';toast('המוצר נמחק');}catch(e){toast('המחיקה נכשלה');}renderPanel();}

/* ---------- versions ---------- */
const LS_VER='reno-studio-v3-versions';
function lsVersions(){try{return JSON.parse(localStorage.getItem(LS_VER)||'[]');}catch(e){return [];}}
async function saveVersion(){const name=($('#verName')&&$('#verName').value.trim())||S.name||'גרסה';S.name=name;const total=Math.round(totals().total),rec={name,savedAt:Date.now(),total,state:JSON.stringify(S)};
  if(db){try{await db.collection('designs').add(rec);msg='נשמר: '+name;}catch(err){msg=err&&err.code==='quota_exceeded'?'אין מקום לגרסאות נוספות. מחקו גרסה ישנה.':'השמירה נכשלה. נסו שוב.';}}
  else{const L=lsVersions();L.unshift(Object.assign({id:'l'+Date.now()},rec));try{localStorage.setItem(LS_VER,JSON.stringify(L.slice(0,30)));versions=L;msg='נשמר בדפדפן: '+name;}catch(e){msg='השמירה נכשלה';}}
  renderTop();saveDraft();renderPanel();}
async function deleteVersion(id){if(db){try{await db.collection('designs').doc(id).delete();}catch(e){msg='המחיקה נכשלה';}}else{versions=lsVersions().filter(v=>v.id!==id);try{localStorage.setItem(LS_VER,JSON.stringify(versions));}catch(e){}}renderPanel();}
async function exportJSON(){const data=JSON.stringify({name:S.name,exportedAt:new Date().toISOString(),total:Math.round(totals().total),state:S},null,1);
  if(downloads){try{await downloads.save({filename:`עיצוב קומת קרקע ${S.name||''}.json`,data});msg='הקובץ נשמר';}catch(err){if(!err||err.code!=='declined')msg='ההורדה לא זמינה כאן';}}else msg='ההורדה לא זמינה בתצוגה הזו';renderPanel();}
async function doShare(){
  try{const used=new Set(S.items.map(i=>i.pid).filter(Boolean).concat(Object.values(S.kitchen.applP||{})));
    const own=[...used].map(id=>products[id]).filter(p=>p&&p.user).map(p=>{const o=Object.assign({},p);delete o.photoId;return o;});
    const url=await shareLink({v:1,s:S,p:own});
    if(navigator.share&&isMobile()){try{await navigator.share({title:'סטודיו בית ההורים',text:S.name||'עיצוב',url});return;}catch(e){if(e&&e.name==='AbortError')return;}}
    await navigator.clipboard.writeText(url);toast('הקישור הועתק. מי שיפתח אותו יקבל עותק של העיצוב.',3500);}
  catch(e){toast('לא הצלחתי ליצור קישור',3000);}}
$('#shareBtn').addEventListener('click',doShare);
$('#importFile').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
  try{const o=JSON.parse(await f.text()),st=o.state||o;if(!st||!st.items||!st.kitchen)throw 0;snapshot();S=migrate(st);sel=null;after('all');toast('העיצוב נפתח מהקובץ');}
  catch(err){toast('הקובץ לא נראה כמו עיצוב מהסטודיו',3500);}});
async function connect(){
  const r=await L.init();downloads=r.downloads;assets=r.assets;db=r.db;
  dbState='ok';
  db.collection('designs').orderBy('savedAt','desc').limit(40).onSnapshot(s=>{versions=s.docs.map(d=>Object.assign({id:d.id},d.data()));if(tab==='more')renderPanel();},()=>{});
  let first=true;
  db.collection('products').limit(500).onSnapshot(s=>{const m={};s.docs.forEach(d=>{m[d.id]=Object.assign({id:d.id},d.data());});
    const changedShape=first||Object.keys(m).length!==Object.keys(products).length||Object.keys(m).some(k=>!products[k]||products[k].color!==m[k].color||products[k].w!==m[k].w||products[k].d!==m[k].d);
    products=m;first=false;if(changedShape)X.buildItems(S,products);refreshHelper();renderTop();if(tab!=='more')renderPanel();},()=>{});
}

/* ---------- boot ---------- */
async function boot(){
  let fromLink=null;const code=hashCode();
  if(code){try{const o=await decodeDesign(code);if(o&&o.s&&o.s.items)fromLink=o;}catch(e){}history.replaceState(null,'',location.pathname+location.search);}
  const draft=loadDraft();
  if(fromLink&&draft){try{const Lv=lsVersions();Lv.unshift({id:'l'+Date.now().toString(36),name:(draft.name||'טיוטה')+' (לפני פתיחת קישור)',savedAt:Date.now(),total:0,state:JSON.stringify(draft)});localStorage.setItem(LS_VER,JSON.stringify(Lv.slice(0,40)));}catch(e){}}
  S=fromLink?migrate(fromLink.s):(draft||migrate(R.preset('mix')));X.setStateRef(S);
  if(gl){P=X.buildArch(S,cut);X.buildItems(S,products);buildLabels();}else P=X.plan(S);
  document.body.dataset.mode=mode;applySheet();if(isMobile()){sheet='min';applySheet();}
  renderTop();renderViews();syncTools();renderPanel();resize();goTo('kitchen',true);requestAnimationFrame(loop);
  connect().then(()=>{if(fromLink)L.mergeProducts(fromLink.p);});
  if(fromLink){saveDraft();toast(draft?'נפתח עיצוב ששותף איתך. הטיוטה הקודמת שלך נשמרה בגרסאות.':'נפתח עיצוב ששותף איתך. השינויים שלך נשמרים רק אצלך.',5000);}
  else if(legacyDraft)setTimeout(()=>toast('המיפוי עודכן: פינת האוכל עברה למקומה האמיתי, בין המטבח לקיר המרפסת. העיצוב התחיל מחדש מ״השילוב שלי״.',5500),600);
}
boot();
window.__studio={proj:id=>{const it=itemById(id),v=new THREE.Vector3(it.x,.45,it.z).project(camera),r=cv.getBoundingClientRect();return [r.left+(v.x*.5+.5)*r.width,r.top+(-v.y*.5+.5)*r.height];},get S(){return S;},goTo,setSel:s=>{sel=s;tab='edit';openSheet('mid');refreshHelper();renderPanel();},setTab:t=>{tab=t;openSheet('mid');renderPanel();},setMode,commit:(fn,l)=>commit(fn,l||'all'),setProducts:m=>{products=m;X.buildItems(S,products);renderPanel();}};
