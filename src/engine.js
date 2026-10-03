/* 3D engine: plan, materials, architecture, furniture, real models, path-traced photos. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import * as R from './data.js';

export { THREE };
let renderer, scene, camera, maxAniso=4, pmrem, skyDay, skyNight, envDay, sun, hemi;
const texCache={};
const WOODHEX={oak:'#C9A77C',oak2:'#B07F50',walnut:'#7A5638',teak:'#9A6A3E'};
export const hexOf=c=>WOODHEX[c]||(c==='rattan'?'#C8A273':c);
export function shade(hex,a){const c=new THREE.Color(hexOf(hex));c.lerp(new THREE.Color(a<0?0x000000:0xffffff),Math.abs(a));return '#'+c.getHexString();}
function seeded(s){return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function tex(cv,rx=1,ry=1,srgb=true){const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAniso;t._cached=1;return t;}
const cached=(k,fn)=>texCache[k]||(texCache[k]=fn());

/* ---------- textures ---------- */
function woodTex(hex){return cached('wood'+hex,()=>{const [c,g]=canvas(256,1024),r=seeded(parseInt(hex.slice(1,5),16)+7);g.fillStyle=hex;g.fillRect(0,0,256,1024);
  for(let i=0;i<160;i++){const x=r()*256;g.strokeStyle=r()>.5?shade(hex,-.22):shade(hex,.12);g.globalAlpha=.12+r()*.3;g.lineWidth=.5+r()*2.4;g.beginPath();g.moveTo(x,0);for(let y=0;y<=1024;y+=32)g.lineTo(x+Math.sin(y*.008+i)*5*r(),y);g.stroke();}
  for(let i=0;i<6;i++){const x=r()*256,y=r()*1024;g.globalAlpha=.25;g.strokeStyle=shade(hex,-.3);g.beginPath();g.ellipse(x,y,3+r()*5,12+r()*20,0,0,6.28);g.stroke();}
  g.globalAlpha=1;return tex(c);});}
function noiseNormal(key,scale,fn){return cached(key,()=>{const N=256,[c,g]=canvas(N,N),r=seeded(scale*97|0),h=new Float32Array(N*N);fn(h,N,r);const im=g.createImageData(N,N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,dx=h[y*N+((x+1)%N)]-h[y*N+((x-1+N)%N)],dy=h[((y+1)%N)*N+x]-h[((y-1+N)%N)*N+x];const nx=-dx*scale,ny=-dy*scale,nz=1,l=Math.hypot(nx,ny,nz);im.data[i*4]=(nx/l*.5+.5)*255;im.data[i*4+1]=(ny/l*.5+.5)*255;im.data[i*4+2]=(nz/l*.5+.5)*255;im.data[i*4+3]=255;}
  g.putImageData(im,0,0);return tex(c,4,4,false);});}
const fabricNormal=()=>noiseNormal('fabN',2.5,(h,N,r)=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)h[y*N+x]=r()*.6+((x%4<2)^(y%4<2)?.4:0);});
const plasterNormal=()=>noiseNormal('plN',1.2,(h,N,r)=>{const t=new Float32Array(N*N);for(let i=0;i<N*N;i++)t[i]=r();for(let y=0;y<N;y++)for(let x=0;x<N;x++){let s=0;for(let k=-2;k<=2;k++)s+=t[y*N+((x+k+N)%N)]+t[((y+k+N)%N)*N+x];h[y*N+x]=s/10;}});
function stoneTex(){return cached('stone',()=>{const [c,g]=canvas(512,512),r=seeded(9);g.fillStyle='#C8B9A0';g.fillRect(0,0,512,512);const bh=64;for(let row=0;row<8;row++){const off=(row%2)*64;for(let x=-128;x<512;x+=128){const v=(r()-.5)*26;g.fillStyle=`rgb(${214+v|0},${202+v|0},${178+v|0})`;g.fillRect(x+off+2,row*bh+2,124,bh-4);
  for(let k=0;k<180;k++){g.fillStyle=`rgba(${r()>.5?255:120},${r()>.5?250:110},${r()>.5?240:95},${r()*.18})`;g.fillRect(x+off+2+r()*120,row*bh+2+r()*(bh-6),2+r()*4,2+r()*3);}}}return tex(c,2,2);});}
function veinTex(hex,v){return cached('vein'+hex+v,()=>{const [c,g]=canvas(1024,1024),r=seeded(5);g.fillStyle=hex;g.fillRect(0,0,1024,1024);const n=v===2?12:v?7:0;
  for(let i=0;i<n;i++){g.strokeStyle=`rgba(105,102,108,${(v===2?.2:.1)+r()*.14})`;g.lineWidth=1+r()*(v===2?6:3);g.beginPath();g.moveTo(r()*1024,0);g.bezierCurveTo(r()*1024,340,r()*1024,680,r()*1024,1024);g.stroke();}
  for(let i=0;i<3000;i++){g.fillStyle=`rgba(120,115,105,${r()*.09})`;g.fillRect(r()*1024,r()*1024,1.6,1.6);}return tex(c);});}
function tileTex(kind,hex){return cached('tile'+kind+hex,()=>{const S=512,[c,g]=canvas(S,S),r=seeded(kind==='zellige'?21:13);g.fillStyle=shade(hex,-.14);g.fillRect(0,0,S,S);
  if(kind==='subway'){const tw=S/4,th=S/8;for(let row=0;row<8;row++){const off=(row%2)*tw/2;for(let x=-tw;x<S+tw;x+=tw){g.fillStyle=shade(hex,(r()-.5)*.05);g.fillRect(x+off+2,row*th+2,tw-4,th-4);}}}
  else{const n=6,t=S/n;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const v=(r()-.5)*.24;g.fillStyle=v<0?shade(hex,v):shade(hex,v*.6);g.fillRect(x*t+2,y*t+2,t-4,t-4);const gr=g.createRadialGradient(x*t+t*r(),y*t+t*r(),2,x*t+t/2,y*t+t/2,t*.8);gr.addColorStop(0,'rgba(255,255,255,.14)');gr.addColorStop(1,'rgba(0,0,0,.07)');g.fillStyle=gr;g.fillRect(x*t+2,y*t+2,t-4,t-4);}}
  return tex(c);});}
function ctrTex(C,hex){
  if(C.wood)return woodTex(hex);
  if(C.speck)return cached('gran'+hex,()=>{const [c,g]=canvas(1024,1024),r=seeded(17);g.fillStyle=hex;g.fillRect(0,0,1024,1024);for(let i=0;i<26000;i++){const t=r();g.fillStyle=t<.45?shade(hex,-.5):t<.8?shade(hex,.35):(t<.93?'#8a7f74':'#e8e2d8');g.globalAlpha=.3+r()*.6;const z=.8+r()*3.2;g.fillRect(r()*1024,r()*1024,z,z*(.6+r()*.6));}g.globalAlpha=1;return tex(c);});
  if(C.cloud)return cached('conc'+hex,()=>{const [c,g]=canvas(1024,1024),r=seeded(23);g.fillStyle=hex;g.fillRect(0,0,1024,1024);for(let i=0;i<120;i++){const x=r()*1024,y=r()*1024,rad=40+r()*220,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,r()>.5?'rgba(80,75,70,.08)':'rgba(255,255,255,.08)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}for(let i=0;i<4000;i++){g.fillStyle=`rgba(90,85,78,${r()*.12})`;g.fillRect(r()*1024,r()*1024,1.4,1.4);}return tex(c);});
  return veinTex(hex,C.vein);
}
const FLOOR_TEX={
  keep_open:{base:'#D6CFC1',grout:'#C2BAAA',tw:.4,tl:.4,speck:['#9C9381','#857C6C','#ECE7DD','#B4A486','#6F6A60'],density:14000,big:1,rough:.28},
  keep_hall:'keep_open',keep_service:'keep_open',
  keep_mamad:{base:'#DCD6CC',plank:1,tw:.2,tl:1.2,grout:'#C9C2B6',rough:.5},
  keep_balcony:{base:'#B5704F',grout:'#8C5038',tw:.4,tl:.4,vary:.1,rough:.6},
  p60x120:{base:'#E2D9CA',grout:'#D0C6B4',tw:.6,tl:1.2,cloud:1,rough:.45},
  p80x80:{base:'#EBE5D9',grout:'#DCD3C4',tw:.8,tl:.8,speck:['#C7BDAB','#B3A994','#D8CDBA','#A3AE96','#BFA88A'],density:5200,rough:.42},
  p120:{base:'#CBC6BD',grout:'#BDB7AD',tw:1.2,tl:1.2,cloud:1,dark:1,rough:.42},
  wood:{base:'#C9A77C',plank:1,tw:.2,tl:1.2,grout:'#9E8160',rough:.5},
  spc:{base:'#D2C2A6',plank:1,tw:.2,tl:1.2,grout:'#B5A68C',rough:.5},
  outdoor:{base:'#CFC6B8',grout:'#B8AE9E',tw:.6,tl:.6,speck:['#A9A091','#BDB4A5','#DDD5C8'],density:3500,rough:.7}
};
function floorDef(room,key){let k=key==='keep'?'keep_'+room:key;let d=FLOOR_TEX[k];if(typeof d==='string')d=FLOOR_TEX[d];return d||FLOOR_TEX.p60x120;}
export const floorHex=(room,key)=>floorDef(room,key).base;
function floorTex(room,key){const def=floorDef(room,key);return cached('fl'+def.base+def.tw+def.tl+(def.plank||0),()=>{
  const S=1024,m=2.4,px=S/m,[c,g]=canvas(S,S),r=seeded(11);g.fillStyle=def.base;g.fillRect(0,0,S,S);
  if(def.cloud){for(let i=0;i<90;i++){const x=r()*S,y=r()*S,rad=40+r()*160;const gr=g.createRadialGradient(x,y,0,x,y,rad);const dk=r()>.5;gr.addColorStop(0,dk?`rgba(110,100,85,${def.dark?.1:.06})`:'rgba(255,255,255,.08)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}
    for(let i=0;i<14;i++){g.strokeStyle='rgba(150,140,125,.08)';g.lineWidth=1+r()*2;g.beginPath();g.moveTo(r()*S,r()*S);g.bezierCurveTo(r()*S,r()*S,r()*S,r()*S,r()*S,r()*S);g.stroke();}}
  if(def.plank){for(let x=0;x<m-1e-6;x+=def.tw){const off=r()*def.tl;for(let y=-off;y<m;y+=def.tl){const v=(r()-.5)*.14;g.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v})`;g.fillRect(x*px,y*px,def.tw*px,def.tl*px);
      for(let k=0;k<9;k++){g.strokeStyle=r()>.5?shade(def.base,-.18):shade(def.base,.1);g.globalAlpha=.25;g.lineWidth=1+r()*1.5;g.beginPath();const lx=x*px+r()*def.tw*px;g.moveTo(lx,y*px);g.lineTo(lx+(r()-.5)*6,(y+def.tl)*px);g.stroke();}
      g.globalAlpha=1;g.fillStyle=def.grout;g.fillRect(x*px,y*px,def.tw*px,1.6);}g.fillStyle=def.grout;g.fillRect(x*px,0,1.6,S);}}
  else{for(let x=0;x<m-1e-6;x+=def.tw)for(let y=0;y<m-1e-6;y+=def.tl){const v=(r()-.5)*(def.vary||.06);g.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v*.8})`;g.fillRect(x*px,y*px,def.tw*px,def.tl*px);}
    if(def.speck){for(let i=0;i<def.density;i++){g.fillStyle=def.speck[(r()*def.speck.length)|0];g.globalAlpha=.3+r()*.55;const s=def.big?1+r()*5.5:.6+r()*1.8;g.beginPath();g.ellipse(r()*S,r()*S,s,s*(.55+r()*.45),r()*3,0,6.283);g.fill();}g.globalAlpha=1;}
    g.strokeStyle=def.grout;g.lineWidth=2;g.beginPath();for(let x=0;x<=m+1e-6;x+=def.tw){g.moveTo(x*px,0);g.lineTo(x*px,S);}for(let y=0;y<=m+1e-6;y+=def.tl){g.moveTo(0,y*px);g.lineTo(S,y*px);}g.stroke();}
  return tex(c);});}
function shadowTex(){return cached('shadow',()=>{const [c,g]=canvas(128,128);const gr=g.createRadialGradient(64,64,6,64,64,64);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(.6,'rgba(0,0,0,.22)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t._cached=1;return t;});}

/* ---------- materials (cached per build) ---------- */
let MC=new Map();
const memo=(k,fn)=>{if(!MC.has(k))MC.set(k,fn());return MC.get(k);};
export function M(hex,rough=.7,metal=0,extra){const k='M'+hex+rough+metal+(extra?JSON.stringify(extra):'');return memo(k,()=>new THREE.MeshStandardMaterial(Object.assign({color:new THREE.Color(hexOf(hex)),roughness:rough,metalness:metal},extra||{})));}
function mat(c,rough=.6){
  if(WOODHEX[c]) return memo('W'+c,()=>new THREE.MeshStandardMaterial({map:woodTex(WOODHEX[c]),roughness:.52}));
  if(c==='rattan') return memo('rattan',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#C8A273'),roughness:.9,normalMap:fabricNormal(),normalScale:new THREE.Vector2(.8,.8)}));
  return memo('P'+c+rough,()=>new THREE.MeshStandardMaterial({color:new THREE.Color(c),roughness:rough}));
}
let FIN='fabric';
const FIN_P={fabric:{r:.92,ns:.35,sh:.5,shr:.75},boucle:{r:1,ns:1.2,sh:.3,shr:.9,nm:1},velvet:{r:.72,ns:.1,sh:1,shr:.32},leather:{r:.42,ns:.06,sh:0,shr:1,cc:.25},linen:{r:.96,ns:.6,sh:.2,shr:.9}};
const boucleNormal=()=>noiseNormal('bouN',3.5,(h,N,r)=>{for(let k=0;k<2400;k++){const cx=r()*N,cy=r()*N,rad=1.5+r()*2.5;for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){const dd=Math.hypot(x,y);if(dd<rad){const ix=(((cx+x)|0)%N+N)%N,iy=(((cy+y)|0)%N+N)%N;h[iy*N+ix]=Math.max(h[iy*N+ix],Math.cos(dd/rad*1.57));}}}});
function fabric(c){
  if(c==='rattan'||WOODHEX[c]) return mat(c);
  const f=FIN_P[FIN]||FIN_P.fabric;
  return memo('F'+c+FIN,()=>new THREE.MeshPhysicalMaterial({color:new THREE.Color(c),roughness:f.r,normalMap:f.nm?boucleNormal():fabricNormal(),normalScale:new THREE.Vector2(f.ns,f.ns),sheen:f.sh,sheenRoughness:f.shr,sheenColor:new THREE.Color(shade(c,FIN==='velvet'?.35:.25)),clearcoat:f.cc||0,clearcoatRoughness:.55}));
}
function wallMat(hex){return memo('WALL'+hex,()=>new THREE.MeshStandardMaterial({color:new THREE.Color(hex),roughness:.95,normalMap:plasterNormal(),normalScale:new THREE.Vector2(.08,.08)}));}
const glassMats=new Set();
function glassMat(){return memo('glass',()=>{const m=new THREE.MeshPhysicalMaterial({color:new THREE.Color('#e3eef2'),roughness:.03,metalness:0,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide,ior:1.5,thickness:.006});glassMats.add(m);return m;});}
const emissive=(c='#fff3d6',i=1.4)=>memo('E'+c+i,()=>new THREE.MeshStandardMaterial({color:new THREE.Color(c),emissive:new THREE.Color(c),emissiveIntensity:i}));

/* ---------- geometry helpers ---------- */
function box(par,x0,x1,y0,y1,z0,z1,m,o={}){
  const w=Math.max(Math.abs(x1-x0),.002),h=Math.max(Math.abs(y1-y0),.002),d=Math.max(Math.abs(z1-z0),.002);
  let geo; if(o.r){const r=Math.min(o.r,Math.min(w,h,d)/2-.0005);geo=new RoundedBoxGeometry(w,h,d,o.seg||3,Math.max(r,.0005));} else geo=new THREE.BoxGeometry(w,h,d);
  const me=new THREE.Mesh(geo,m);me.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);me.castShadow=o.cast!==false;me.receiveShadow=true;if(o.nopick)me.userData.nopick=1;if(o.fake)me.userData.fake=1;par.add(me);return me;
}
const rbox=(par,x0,x1,y0,y1,z0,z1,m,r=.03,o={})=>box(par,x0,x1,y0,y1,z0,z1,m,Object.assign({r},o));
function cyl(par,r0,r1,h,x,y,z,m,o={}){const me=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,o.seg||32,1,!!o.open),m);me.position.set(x,y+h/2,z);me.castShadow=o.cast!==false;me.receiveShadow=true;par.add(me);return me;}
function sphere(par,r,x,y,z,m,o={}){const me=new THREE.Mesh(new THREE.SphereGeometry(r,o.ws||28,o.hs||18,0,Math.PI*2,0,o.half?Math.PI/2:Math.PI),m);me.position.set(x,y,z);me.castShadow=o.cast!==false;me.receiveShadow=true;par.add(me);return me;}
function tube(par,a,b,r,m){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),L=A.distanceTo(B);const me=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,12),m);me.position.copy(A).add(B).multiplyScalar(.5);me.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());me.castShadow=true;par.add(me);return me;}
function quad(par,pts,m,o={}){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([].concat(pts[0],pts[1],pts[2],pts[0],pts[2],pts[3]),3));g.computeVertexNormals();const me=new THREE.Mesh(g,m);me.castShadow=o.cast!==false;me.receiveShadow=true;par.add(me);return me;}
function panelXY(par,pts,z,depth,m){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);const me=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),m);me.position.z=z;me.castShadow=true;me.receiveShadow=true;par.add(me);return me;}
function contact(par,w,d){const m=memo('contact',()=>new THREE.MeshBasicMaterial({map:shadowTex(),transparent:true,depthWrite:false,opacity:.5}));const me=new THREE.Mesh(new THREE.PlaneGeometry(w*1.25,d*1.25),m);me.rotation.x=-Math.PI/2;me.position.y=.003;me.userData.nopick=1;me.userData.fake=1;me.renderOrder=1;par.add(me);return me;}

/* ---------- sky ---------- */
function makeSky(night){
  const W=512,H=256,d=new Float32Array(W*H*4);
  for(let y=0;y<H;y++){const el=(.5-(y+.5)/H)*Math.PI;for(let x=0;x<W;x++){let c;
    if(el>0){const t=Math.pow(1-el/(Math.PI/2),2.6);c=[.38+.6*t,.55+.45*t,.92+.12*t];}
    else{const t=Math.min(1,-el*3);c=[.58-.2*t,.6-.2*t,.55-.2*t];}
    const k=night?.025:1.0,i=(y*W+x)*4;d[i]=c[0]*k;d[i+1]=c[1]*k*(night?1.1:1);d[i+2]=c[2]*k*(night?1.6:1);d[i+3]=1;}}
  const t=new THREE.DataTexture(d,W,H,THREE.RGBAFormat,THREE.FloatType);t.mapping=THREE.EquirectangularReflectionMapping;t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;
}

/* ---------- plan ---------- */
export function plan(S){
  const d=S.dims,p=R.plan0(d),OW=d.OW,OD=d.OD,STW=d.STW,T=.28,r=3.0/16;
  Object.assign(p,{T,r,a0:OW-STW,zl1:p.hz0+STW});p.zb=p.zl1+7*T;p.xe=p.a0-8*T;
  p.rooms={open:{n:'ק-סלון + ק-מטבח',rects:[[0,0,OW,p.kwZ],[0,p.kwZ,p.hx0,OD]]},hall:{n:'ק-מבואה',rects:[[p.hx0,p.hz0,OW,p.hz1]]},mamad:{n:'ק-ממד',rects:[[p.mx0,p.mz0,p.mx1,p.mz1]]},service:{n:'ק-שירות',rects:[[p.sx0,p.sz0,p.sx1,p.sz1]]},balcony:{n:'ק-מרפסת',rects:[[p.bx0,p.bz0,p.bx1,p.bz1]]}};
  for(const k in p.rooms)p.rooms[k].area=p.rooms[k].rects.reduce((a,[x0,z0,x1,z1])=>a+(x1-x0)*(z1-z0),0);
  p.rooms.hall.area-=STW*(STW+7*T);
  p.rooms.open.perim=2*(OW+OD);p.rooms.hall.perim=2*((OW-p.hx0)+d.HALLD)+STW*3;p.rooms.mamad.perim=2*(d.MMDW+d.MMDD);p.rooms.service.perim=2*(d.SRVW+d.SRVD);p.rooms.balcony.perim=2*(d.BALW+d.BALD);
  const k=S.kitchen;let w0,w1,y0=.98,y1=2.3;
  if(k.cook==='side'){w1=d.KA-.12;const mid=k.cookPos==='window';w0=Math.max(mid?.75:1.72,w1-k.winW);if(mid)y0=1.1;}
  else if(k.cook==='island'){const c=(.75+d.KA-.1)/2,ww=Math.min(k.winW,d.KA-.85);w0=c-ww/2;w1=c+ww/2;}
  else{const c=(.6+d.KA)/2+.05;w0=c-k.winW/2;w1=c+k.winW/2;y0=1.15;y1=2.05;}
  const DI=p.DI||0;p.kwinL={z0:w0,z1:w1,y0,y1};w0+=DI;w1+=DI;
  p.kwin={z0:w0,z1:w1,y0,y1};
  const W=[],mxc=(p.mx0+p.mx1)/2;
  W.push({ax:'x',b:[-.2,0],s:[-.2,OW+.2],room:'open',ext:1,out:[0,-1],stoneN:1,ops:[{s:[d.DOORX,d.DOORX+d.DOORW],y:[0,2.2],k:'slider'},{s:[d.DWINX,d.DWINX+d.DWINW],y:[.75,2.2],k:'win'}]});
  W.push({ax:'z',b:[-.2,0],s:[-.2,OD+.2],room:'open',ext:1,out:[-1,0],ops:[]});
  W.push({ax:'z',b:[OW,OW+.2],s:[-.2,p.hz1+.2],room:'open',ext:1,out:[1,0],ops:[{s:[w0,w1],y:[y0,y1],k:'win'},{s:[DI+d.KA+.15,DI+d.KA+.95],y:[0,2.1],k:'door'}]});
  W.push({ax:'x',b:[p.kwZ,p.kwZ+.2],s:[p.hx0,OW],room:'open',ext:0,ops:[]});
  W.push({ax:'x',b:[OD,OD+.2],s:[-.2,p.hx0],room:'open',ext:0,ops:[]});
  W.push({ax:'z',b:[p.hx0-.2,p.hx0],s:[OD,Math.max(p.hz1,p.mz1)+.2],room:'hall',ext:0,ops:[{s:[p.mz0+.3,Math.min(p.mz0+1.15,p.mz1-.1)],y:[0,2.05],k:'steel'}]});
  W.push({ax:'x',b:[p.hz1,p.hz1+.2],s:[p.hx0-.2,OW+.2],room:'hall',ext:1,out:[0,1],ops:[{s:[p.hx0+1.0,p.hx0+2.0],y:[0,2.15],k:'entry'}]});
  W.push({ax:'x',b:[p.mz1,p.mz1+.3],s:[p.mx0-.3,p.hx0],room:'mamad',ext:1,out:[0,1],ops:[{s:[mxc-.55,mxc+.55],y:[1.0,2.0],k:'win'}]});
  W.push({ax:'z',b:[p.mx0-.3,p.mx0],s:[OD,p.mz1+.3],room:'mamad',ext:1,out:[-1,0],ops:[]});
  W.push({ax:'x',b:[p.sz0-.2,p.sz0],s:[OW+.2,p.sx1+.2],room:'service',ext:1,out:[0,-1],ops:[]});
  W.push({ax:'x',b:[p.sz1,p.sz1+.2],s:[OW+.2,p.sx1+.2],room:'service',ext:1,out:[0,1],ops:[]});
  W.push({ax:'z',b:[p.sx1,p.sx1+.2],s:[p.sz0-.2,p.sz1+.2],room:'service',ext:1,out:[1,0],ops:[{s:[p.sz0+.45,p.sz0+1.25],y:[0,2.1],k:'glassdoor'}]});
  W.push({ax:'z',b:[p.bx1,p.bx1+.2],s:[p.bz0-.1,p.bz1],room:'balcony',ext:1,out:[1,0],stone:1,ops:[{s:[p.bz0+.3,p.bz1-.3],y:[2.0,2.5],k:'win'}]});
  W.push({ax:'x',b:[p.bz0-.08,p.bz0],s:[p.bx0-.08,p.bx1],room:'balcony',ext:1,out:[0,-1],glaze:1,ops:[]});
  W.push({ax:'z',b:[p.bx0-.08,p.bx0],s:[p.bz0,p.bz1],room:'balcony',ext:1,out:[-1,0],glaze:1,ops:[]});
  p.walls=W;return p;
}
export function roomAt(p,x,z){for(const k in p.rooms)for(const [x0,z0,x1,z1] of p.rooms[k].rects)if(x>=x0-.05&&x<=x1+.05&&z>=z0-.05&&z<=z1+.05)return k;return null;}

/* ---------- architecture ---------- */
export const reg={walls:[],floors:[],ceil:null,kitchen:null,stairs:null,under:null,p:null,photoLights:null};
function buildWall(par,w,S,cut,H){
  const g=new THREE.Group();par.add(g);const sel={kind:'room',id:w.room},room=S.rooms[w.room]||{};
  const wm=w.stone?memo('stoneM',()=>new THREE.MeshStandardMaterial({map:stoneTex(),roughness:.92})):wallMat(room.wall||'#F4F2EE');
  const top=cut?Math.min(1.15,H):H, frameM=M('#ECEBE6',.4,.1), skirt=M(shade(room.wall||'#F4F2EE',-.04),.6), bm=(w.b[0]+w.b[1])/2;
  const put=(me)=>{if(me)me.userData.sel=sel;return me;};
  const seg=(a0,a1,y0,y1,m)=>{y1=Math.min(y1,top);if(a1-a0<1e-3||y1-y0<1e-3)return;put(w.ax==='x'?box(g,a0,a1,y0,y1,w.b[0],w.b[1],m,{cast:false}):box(g,w.b[0],w.b[1],y0,y1,a0,a1,m,{cast:false}));
    if(y0===0&&!w.stone){const t=.012;[w.b[0]-t,w.b[1]].forEach(b0=>put(w.ax==='x'?box(g,a0,a1,0,.08,b0,b0+t,skirt,{cast:false}):box(g,b0,b0+t,0,.08,a0,a1,skirt,{cast:false})));}};
  const fr=(a0,a1,y0,y1,m=frameM,t=.045)=>{y1=Math.min(y1,top);if(y1<=y0)return null;return put(w.ax==='x'?box(g,a0,a1,y0,y1,bm-t,bm+t,m,{cast:false}):box(g,bm-t,bm+t,y0,y1,a0,a1,m,{cast:false}));};
  if(w.glaze){
    const alu=M('#EDEBE6',.35,.25),cur=memo('curtain',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#F3EEE2'),roughness:1,transparent:true,opacity:.82,side:THREE.DoubleSide}));
    const n=Math.max(2,Math.round((w.s[1]-w.s[0])/1.2)),st=(w.s[1]-w.s[0])/n,hh=Math.min(2.6,top);
    for(let i=0;i<=n;i++){const a=w.s[0]+i*st;fr(a-.03,a+.03,0,hh,alu);}
    fr(w.s[0],w.s[1],0,.06,alu);if(!cut){fr(w.s[0],w.s[1],2.0,2.06,alu);fr(w.s[0],w.s[1],2.55,2.6,alu);}
    const gp=fr(w.s[0],w.s[1],.06,hh,glassMat(),.004);if(gp)gp.userData.nopick=1;
    if(!cut)for(let i=0;i<n;i++){if(i%3===1)continue;const a=w.s[0]+i*st;
      for(let f=0;f<5;f++){const fa=a+.05+f*(st*.5/5),fb=fa+st*.5/5-.01,dz=f%2?.03:0;put(w.ax==='x'?box(g,fa,fb,.02,2.0,w.b[1]+.05+dz,w.b[1]+.065+dz,cur,{cast:false}):box(g,w.b[1]+.05+dz,w.b[1]+.065+dz,.02,2.0,fa,fb,cur,{cast:false}));}}
  }else{
    let c0=w.s[0];
    [...w.ops].sort((a,b)=>a.s[0]-b.s[0]).forEach(o=>{
      seg(c0,o.s[0],0,top,wm);seg(o.s[0],o.s[1],0,o.y[0],wm);seg(o.s[0],o.s[1],o.y[1],top,wm);
      const f=.05;fr(o.s[0],o.s[0]+f,o.y[0],o.y[1]);fr(o.s[1]-f,o.s[1],o.y[0],o.y[1]);if(o.y[1]<=top)fr(o.s[0],o.s[1],o.y[1]-f,o.y[1]);if(o.y[0]>0){fr(o.s[0],o.s[1],o.y[0],o.y[0]+f);
        if(o.y[0]<top){const sill=M('#E9E5DD',.35);put(w.ax==='x'?box(g,o.s[0]-.03,o.s[1]+.03,o.y[0]-.02,o.y[0],w.b[0]-.04,w.b[1]+.04,sill,{cast:false}):box(g,w.b[0]-.04,w.b[1]+.04,o.y[0]-.02,o.y[0],o.s[0]-.03,o.s[1]+.03,sill,{cast:false}));}}
      if(o.k==='slider'||(o.k==='win'&&o.s[1]-o.s[0]>1.5)){const m=(o.s[0]+o.s[1])/2;fr(m-.03,m+.03,o.y[0],o.y[1]);}
      if(o.k==='win'||o.k==='slider'||o.k==='glassdoor'){const gp=fr(o.s[0]+.04,o.s[1]-.04,o.y[0]+.04,o.y[1]-.04,glassMat(),.004);if(gp)gp.userData.nopick=1;}
      if(o.k==='entry'&&!cut){const dm=memo('door',()=>new THREE.MeshStandardMaterial({map:woodTex('#6B4A33'),roughness:.45}));if(w.ax==='x'){put(box(g,o.s[0]+.05,o.s[1]-.05,0,Math.min(o.y[1]-.05,top),bm-.03,bm+.03,dm));put(box(g,o.s[0]+.12,o.s[0]+.14,.95,1.15,bm-.07,bm-.03,M('#A9ADB1',.25,.9)));}}
      c0=o.s[1];
    });
    seg(c0,w.s[1],0,top,wm);
    if(w.stoneN){const sm=memo('stoneM',()=>new THREE.MeshStandardMaterial({map:stoneTex(),roughness:.92})),pb=reg.p;
      const sp=(a,b,y0,y1)=>{a=Math.max(a,pb.bx0);b=Math.min(b,pb.bx1);y1=Math.min(y1,top);if(b-a<.01||y1-y0<.01)return;const me=box(g,a,b,y0,y1,-.23,-.2,sm,{cast:false});me.userData.sel={kind:'room',id:'balcony'};};
      let c2=pb.bx0;[...w.ops].sort((a,b)=>a.s[0]-b.s[0]).forEach(o=>{sp(c2,o.s[0],0,top);sp(o.s[0],o.s[1],0,o.y[0]);sp(o.s[0],o.s[1],o.y[1],top);c2=o.s[1];});sp(c2,pb.bx1,0,top);}
  }
  const [x0,z0,x1,z1]=w.ax==='x'?[w.s[0],w.b[0],w.s[1],w.b[1]]:[w.b[0],w.s[0],w.b[1],w.s[1]];
  reg.walls.push({g,rect:[x0,z0,x1,z1],ext:w.ext,out:w.out,mid:[(x0+x1)/2,(z0+z1)/2]});
}
function buildFloors(par,p,S){
  for(const id in p.rooms){const fl=S.rooms[id]?S.rooms[id].floor:'keep',def=floorDef(id,fl);
    p.rooms[id].rects.forEach(([x0,z0,x1,z1])=>{const w=x1-x0,d=z1-z0,t=floorTex(id,fl).clone();t.needsUpdate=true;t._cached=0;t.repeat.set(w/2.4,d/2.4);
      const me=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshPhysicalMaterial({map:t,roughness:def.rough,clearcoat:def.plank?0:.25,clearcoatRoughness:.35}));
      me.rotation.x=-Math.PI/2;me.position.set(x0+w/2,0,z0+d/2);me.receiveShadow=true;me.userData.sel={kind:'room',id};par.add(me);reg.floors.push({id,mesh:me});});}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(80,80),M('#B9BDB0',.95));ground.rotation.x=-Math.PI/2;ground.position.set(5,-.02,3);ground.receiveShadow=true;ground.userData.nopick=1;par.add(ground);
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(p.bx1-p.bx0+10,9),M('#6F8C5A',.95));grass.rotation.x=-Math.PI/2;grass.position.set((p.bx0+p.bx1)/2,-.01,p.bz0-4.6);grass.receiveShadow=true;grass.userData.nopick=1;par.add(grass);
  const lf=M('#5E7B4A',.95),tr=M('#6b5640',.9),r=seeded(4);
  for(let i=0;i<9;i++){const x=p.bx0-3+r()*(p.bx1-p.bx0+6),z=p.bz0-3-r()*5,h=2.5+r()*2.5;const t=cyl(par,.12,.16,h*.5,x,0,z,tr);t.userData.nopick=1;const s=sphere(par,.9+r()*.9,x,h*.6+.6,z,lf,{ws:14,hs:10});s.userData.nopick=1;}
  const hedge=M('#56703F',.95);[[p.bx0-1.5,p.bz0-1.2,p.bx1+1.5,p.bz0-.6]].forEach(([a,b,c,d])=>{const h=box(par,a,c,0,1.1,b,d,hedge,{r:.2});h.userData.nopick=1;});
}

/* kitchen */
const HANDLE_M={brass:()=>M('#B8955A',.3,.9),gold:()=>M('#C9A55C',.38,1),black:()=>M('#1E1E1E',.45,.4),long:()=>M('#1E1E1E',.45,.4),steel:()=>M('#A9ADB1',.25,.9)};
function fronts(par,o,sel){
  const seam=M(shade(hexOf(o.fin),-.45),.85),hm=o.handle&&o.handle!=='none'?HANDLE_M[o.handle]():null;
  const bx=(s0,s1,y0,y1,dep,m,r)=>{const a0=o.at,a1=o.at+o.dir*dep,lo=Math.min(a0,a1),hi=Math.max(a0,a1);const me=o.ax==='x'?box(par,lo,hi,y0,y1,s0,s1,m,{cast:false,r}):box(par,s0,s1,y0,y1,lo,hi,m,{cast:false,r});me.userData.sel=sel;};
  const n=Math.max(1,Math.round((o.s1-o.s0)/o.colW)),w=(o.s1-o.s0)/n;
  for(let i=1;i<n;i++){const s=o.s0+i*w;bx(s-.002,s+.002,o.y0,o.y1,.002,seam);}
  const rows=o.rows||[];rows.forEach(y=>bx(o.s0+.003,o.s1-.003,y-.002,y+.002,.002,seam));
  const bands=[o.y0,...rows,o.y1],fm=o.fin?mat(o.fin,.55):null;
  if(o.style==='shaker'&&fm)for(let i=0;i<n;i++){const a=o.s0+i*w+.004,b=a+w-.008;for(let k=0;k<bands.length-1;k++){const y0=bands[k]+.004,y1=bands[k+1]-.004,f=Math.min(.06,(y1-y0)*.22);if(y1-y0<.08)continue;
    bx(a,a+f,y0,y1,.008,fm);bx(b-f,b,y0,y1,.008,fm);bx(a+f,b-f,y0,y0+f,.008,fm);bx(a+f,b-f,y1-f,y1,.008,fm);}}
  if(o.style==='fluted'&&fm)for(let i=0;i<n;i++){const a=o.s0+i*w+.012,b=a+w-.024;for(let s=a;s+.02<=b;s+=.034)bx(s,s+.02,o.y0+.01,o.y1-.01,.007,fm,.003);}
  if(!hm)return;
  for(let i=0;i<n;i++){const c=o.s0+(i+.5)*w,L=o.handle==='long'?w*.8:Math.min(.32,w*.55);
    if(o.kind==='door')bx(c-L/2,c+L/2,o.y0+.045,o.y0+.06,.022,hm,.006);
    else for(let b=0;b<bands.length-1;b++){const y=bands[b+1]-.055;bx(c-L/2,c+L/2,y-.007,y+.007,.024,hm,.006);}}
}
function cooktop(par,cx,cz,y,sel){
  const a=box(par,cx-.26,cx+.26,y,y+.008,cz-.44,cz+.44,M('#101214',.06,.1),{cast:false,r:.003});a.userData.sel=sel;
  const bm=M('#2f3235',.35,.8),cap=M('#16181a',.4,.5);
  [[-.12,-.28,.05],[.12,-.28,.045],[0,0,.075],[-.12,.28,.045],[.12,.28,.05]].forEach(([x,z,r])=>{cyl(par,r,r,.018,cx+x,y+.008,cz+z,bm,{cast:false,seg:24}).userData.sel=sel;cyl(par,r*.6,r*.6,.012,cx+x,y+.026,cz+z,cap,{cast:false,seg:20}).userData.sel=sel;
    for(let k=0;k<4;k++){const an=k*Math.PI/2+.785;box(par,cx+x+Math.cos(an)*r*.6,cx+x+Math.cos(an)*r*1.5,y+.03,y+.04,cz+z+Math.sin(an)*r*.6-.006,cz+z+Math.sin(an)*r*.6+.006,cap,{cast:false}).userData.sel=sel;}});
}
function buildKitchen(par,p,S){
  const g=new THREE.Group();par.add(g);reg.kitchen=g;
  const d=S.dims,k=S.kitchen,sel={kind:'kitchen'},OW=d.OW,KA=d.KA,KB=d.KB,kz=p.kwZ,H=d.H;
  const C=R.COUNTERS[k.counter]||R.COUNTERS.qWhite;
  const baseM=mat(k.base,.55),upperM=mat(k.upper,.55),towerM=mat(k.tower,.55),islandM=mat(k.island,.55);
  const cc=k.keep?C.c:(k.ctrColor||C.c),matte=k.ctrFinish==='matte'||C.wood,T1=.88+(k.keep?4:(k.ctrThick||4))/100,st=k.keep?'flat':(k.style||'flat');
  const ctrM=memo('ctr'+k.counter+cc+matte,()=>new THREE.MeshPhysicalMaterial({map:ctrTex(C,cc),roughness:matte?.55:.16,clearcoat:matte?0:.45,clearcoatRoughness:.15}));
  const spk=k.keep?'keep':(k.splash||'ctr'),spC=k.splashC||(spk==='zellige'?'#DCE3DD':spk==='paint'?(S.rooms.open.wall||'#F4F2EE'):'#F4F2EC');
  const splashM=k.keep?M('#E7E0CF',.4):spk==='ctr'?ctrM:spk==='paint'?wallMat(spC):null;
  const SPL=(x0,x1,y0,y1,z0,z1)=>{let m=splashM;if(!m){const L=Math.max(Math.abs(x1-x0),Math.abs(z1-z0)),Hh=Math.abs(y1-y0);
      m=memo('spl'+spk+spC+L.toFixed(2)+Hh.toFixed(2),()=>{const t=tileTex(spk,spC).clone();t.needsUpdate=true;t._cached=0;t.repeat.set(L/.6,Hh/.6);return new THREE.MeshPhysicalMaterial({map:t,roughness:spk==='zellige'?.12:.3,clearcoat:spk==='zellige'?.6:.2,clearcoatRoughness:.2});});}
    return B(x0,x1,y0,y1,z0,z1,m,{cast:false});};
  const plinth=M(shade(k.base,-.35),.8),led=emissive('#fff1d2',2),steel=M('#B4B8BC',.22,.95);
  const gA=new THREE.Group();gA.position.z=p.DI||0;g.add(gA);let tg=gA;
  const B=(...a)=>{const me=box(tg,...a);me.userData.sel=sel;return me;};
  const r=k.keep?0:.006;
  B(OW-.6,OW,0,2.25,0,.6,towerM,{r});
  fronts(tg,{ax:'x',at:OW-.6,dir:-1,s0:0,s1:.6,y0:.06,y1:2.25,colW:.6,rows:[.96,1.62],fin:k.tower,style:st},sel);
  B(OW-.615,OW-.6,1.0,1.58,.04,.56,M('#141618',.08,.3),{cast:false});B(OW-.616,OW-.6,1.06,1.44,.1,.5,M('#050506',.02,.1),{cast:false});B(OW-.66,OW-.62,1.53,1.548,.08,.52,steel,{cast:false,r:.006});
  B(OW-.58,OW,.1,.88,.6,KA,baseM,{r});B(OW-.52,OW,0,.1,.6,KA,plinth);
  fronts(tg,{ax:'x',at:OW-.58,dir:-1,s0:.6,s1:KA,y0:.1,y1:.88,colW:.6,rows:[.36,.62],handle:k.handle,fin:k.base,style:st},sel);
  B(OW-.62,OW,.88,T1,.6,KA,ctrM,{r:.004});
  const w=p.kwinL;
  [[.6,w.z0],[w.z1,KA]].forEach(([a,b])=>{if(b-a>.01)SPL(OW-.015,OW,T1,1.5,a,b);});
  if(w.y0>T1+.01)SPL(OW-.015,OW,T1,w.y0,w.z0,w.z1);
  if(k.cook==='under')cooktop(tg,OW-.3,(w.z0+w.z1)/2,T1,sel);
  if(k.cook==='side'){const mid=k.cookPos==='window',cz=mid?(w.z0+w.z1)/2:1.13;cooktop(tg,OW-.3,cz,T1,sel);
    if(k.hood&&mid){B(OW-.62,OW-.1,H-.28,H-.14,cz-.45,cz+.45,M('#E9E7E2',.3,.4),{r:.01});B(OW-.58,OW-.14,H-.286,H-.28,cz-.4,cz+.4,led,{cast:false});}
    else if(k.hood){SPL(OW-.015,OW,1.5,1.62,.6,Math.min(w.z0,1.62));B(OW-.55,OW,1.62,H,cz-.48,cz+.48,wallMat(S.rooms.open.wall||'#F4F2EE'),{r:.01});B(OW-.53,OW-.02,1.614,1.62,cz-.44,cz+.44,led,{cast:false});}}
  if(k.cook==='under'||k.keep){B(OW-.35,OW,1.5,2.25,w.z1+.1,KA,upperM);fronts(tg,{ax:'x',at:OW-.35,dir:-1,s0:w.z1+.1,s1:KA,y0:1.5,y1:2.25,colW:.45,handle:k.handle,kind:'door',fin:k.upper,style:st},sel);}
  tg=g;
  const bx0=OW-.6-KB,bx1=OW-.6;
  B(bx0,bx1,.1,.88,kz-.58,kz,baseM,{r});B(bx0,bx1,0,.1,kz-.52,kz,plinth);
  fronts(g,{ax:'z',at:kz-.58,dir:-1,s0:bx0,s1:bx1,y0:.1,y1:.88,colW:.6,rows:[.36,.62],handle:k.handle,fin:k.base,style:st},sel);
  B(bx0,bx1,.88,T1,kz-.62,kz,ctrM,{r:.004});
  const sxc=bx0+KB*.52;B(sxc-.38,sxc+.38,(T1-.015),(T1+.001),kz-.5,kz-.1,M('#3a3c3e',.25,.85),{cast:false});
  cyl(g,.02,.024,.36,sxc,T1,kz-.07,steel).userData.sel=sel;tube(g,[sxc,1.27,kz-.07],[sxc,1.27,kz-.3],.016,steel).userData.sel=sel;cyl(g,.018,.018,.08,sxc,1.19,kz-.3,steel).userData.sel=sel;
  SPL(bx0,bx1,T1,1.49,kz-.015,kz);
  B(bx0,bx1,1.5,2.25,kz-.35,kz,upperM,{r});
  fronts(g,{ax:'z',at:kz-.35,dir:-1,s0:bx0,s1:bx1,y0:1.5,y1:2.25,colW:.5,handle:k.handle,kind:'door',fin:k.upper,style:st},sel);
  if(!k.keep)B(bx0+.05,bx1-.05,1.485,1.5,kz-.32,kz-.28,led,{cast:false});
  B(bx0-.73,bx0-.02,0,1.85,kz-.65,kz,M('#232527',.25,.55),{r:.02});B(bx0-.75,bx0-.73,.9,1.5,kz-.55,kz-.53,steel,{cast:false});
  const z0=p.isZc-d.ISL/2,z1=p.isZc+d.ISL/2;
  B(p.isX0+.33,p.isX1-.05,.1,.88,z0+.08,z1-.08,islandM,{r});B(p.isX0+.38,p.isX1-.1,0,.1,z0+.12,z1-.12,plinth);
  fronts(g,{ax:'x',at:p.isX1-.05,dir:1,s0:z0+.08,s1:z1-.08,y0:.1,y1:.88,colW:.5,rows:[.36,.62],handle:k.handle,fin:k.island,style:st},sel);
  B(p.isX0,p.isX1,.88,T1,z0,z1,ctrM,{r:.006});
  if(k.cook==='island'){const cx=(p.isX0+.33+p.isX1)/2;cooktop(g,cx,p.isZc,T1,sel);
    if(k.hood)B(cx-.45,cx+.45,H-.28,H-.14,p.isZc-.55,p.isZc+.55,M('#E9E7E2',.3,.4),{r:.01});if(k.hood)B(cx-.4,cx+.4,H-.286,H-.28,p.isZc-.5,p.isZc+.5,led,{cast:false});}
}

/* stairs + under-stairs */
function buildStairs(par,p,S){
  const g=new THREE.Group();par.add(g);reg.stairs=g;
  const d=S.dims,st=S.stairs,sel={kind:'stairs'},OW=d.OW,STW=d.STW,T=p.T,r=p.r,hz0=p.hz0,a0=p.a0,zl1=p.zl1,zb=p.zb,xe=p.xe;
  const stoneM=memo('stairStone',()=>new THREE.MeshPhysicalMaterial({color:new THREE.Color('#E4DCCB'),map:floorTex('hall','p80x80'),roughness:.3,clearcoat:.3}));
  const hallFloor=S.rooms.hall.floor;
  const tread=st.clad==='oak'?mat('oak'):st.clad==='porc'?memo('porcT'+hallFloor,()=>new THREE.MeshStandardMaterial({map:floorTex('hall',hallFloor==='keep'?'p60x120':hallFloor),roughness:.45})):st.clad==='micro'?M('#CFC8BD',.75):stoneM;
  const riser=st.clad==='oak'?M('#F1EEE8',.6):tread, plaster=wallMat(S.rooms.hall.wall||'#F4F2EE');
  const B=(a,b,c,dd,e,f,m,o)=>{const me=box(g,a,b,c,dd,e,f,m,o);me.userData.sel=sel;return me;};
  for(let i=0;i<7;i++){const z1=zb-i*T,z0=z1-T,top=(i+1)*r;B(a0,OW,0,top-.035,z0,z1,riser);B(a0-.02,OW,top-.035,top,z0,z1+.025,tread,{r:.006});}
  B(a0,OW,0,8*r-.035,hz0,zl1,riser);B(a0-.02,OW,8*r-.035,8*r,hz0,zl1+.02,tread,{r:.006});
  for(let j=0;j<8;j++){const x1=a0-j*T,x0=x1-T,top=(9+j)*r;B(x0,x1,top-.2,top-.035,hz0,zl1,riser);B(x0,x1+.025,top-.035,top,hz0,zl1+.02,tread,{r:.006});}
  const L=Math.hypot(8*T,8*r),ang=Math.atan2(8*r,8*T);
  const sof=new THREE.Mesh(new THREE.BoxGeometry(L,.03,STW),plaster);sof.position.set((a0+xe)/2,(8*r-.22+16*r-.22)/2,(hz0+zl1)/2);sof.rotation.z=-ang;sof.castShadow=true;sof.receiveShadow=true;sof.userData.sel=sel;g.add(sof);
  const sm=memo('stringer',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#F1EEE8'),roughness:.85,side:THREE.DoubleSide}));quad(g,[[a0,8*r-.24,zl1+.001],[xe,16*r-.24,zl1+.001],[xe,16*r-.2,zl1+.001],[a0,8*r-.2,zl1+.001]],sm).userData.sel=sel;
  const P1=[[a0+.03,r+.02,zb],[a0+.03,8*r,zl1]],P2=[[a0,8*r,zl1-.03],[xe,16*r,zl1-.03]],rail=st.rail,hr=.9;
  const railM=rail==='keep'?mat('oak'):rail==='white'?M('#F1F0EC',.4,.2):rail==='glass'?M('#B9BDC1',.25,.9):M('#1F1F1F',.4,.4);
  const handM=rail==='keep'||rail==='woodm'?mat('oak'):railM;
  [P1,P2].forEach(([A,Bp])=>{const n=Math.max(2,Math.round(Math.hypot(Bp[0]-A[0],Bp[2]-A[2])/(rail==='keep'?.14:.11))),up=(P,h)=>[P[0],P[1]+h,P[2]];
    tube(g,up(A,hr),up(Bp,hr),rail==='keep'?.032:.02,handM).userData.sel=sel;
    if(rail==='glass'){const gm=memo('railGlass',()=>{const m=new THREE.MeshPhysicalMaterial({color:new THREE.Color('#e6f0f2'),roughness:.03,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide,ior:1.5,thickness:.01});glassMats.add(m);return m;});quad(g,[up(A,.06),up(Bp,.06),up(Bp,hr-.04),up(A,hr-.04)],gm,{cast:false}).userData.sel=sel;
      [0,.5,1].forEach(t=>{const P=A.map((v,i)=>v+(Bp[i]-v)*t);tube(g,up(P,0),up(P,hr),.012,railM).userData.sel=sel;});}
    else{for(let i=0;i<=n;i++){const t=i/n,P=A.map((v,ii)=>v+(Bp[ii]-v)*t);tube(g,up(P,0),up(P,hr),rail==='keep'?.02:.008,railM).userData.sel=sel;}if(rail!=='keep')tube(g,up(A,.08),up(Bp,.08),.008,railM).userData.sel=sel;}});
  if(rail==='keep')B(a0-.04,a0+.1,0,1.05,zb-.12,zb+.02,mat('oak'));
  if(st.led){const lm=emissive('#fff0cc',3);
    for(let i=0;i<7;i++){const top=(i+1)*r,zc=zb-(i+.5)*T;B(OW-.006,OW,top+.18,top+.23,zc-.06,zc+.06,lm,{cast:false});}
    for(let j=0;j<8;j++){const top=(9+j)*r,xc=a0-(j+.5)*T;B(xc-.06,xc+.06,top+.18,top+.23,hz0,hz0+.006,lm,{cast:false});}}
  const u=new THREE.Group();g.add(u);reg.under=u;const usel={kind:'under'};
  const hs=x=>Math.min(d.H,(8*r-.24)+(a0-x)/(8*T)*8*r);
  const U=(a,b,c,dd,e,f,m,o)=>{const me=box(u,a,b,c,dd,e,f,m,o);me.userData.sel=usel;return me;};
  const sol=S.under.sol,uc=S.under.c||'#F1EEE8';
  const panels=(x0,x1,m,handle)=>{const n=Math.max(1,Math.round((x1-x0)/.5)),w=(x1-x0)/n;for(let i=0;i<n;i++){const s0=x0+i*w+.003,s1=x0+(i+1)*w-.003;panelXY(u,[[s0,.02],[s1,.02],[s1,hs(s1)-.03],[s0,hs(s0)-.03]],zl1-.02,.02,m).userData.sel=usel;
      if(handle){const hm=M('#1E1E1E',.45,.4),hx=i%2?s0+.05:s1-.05;U(hx-.008,hx+.008,handle==='tall'?.5:.85,handle==='tall'?Math.min(1.6,hs(hx)-.15):1.05,zl1,zl1+.022,hm,{cast:false});}}
    U(x0,x1,0,.02,hz0,zl1,M(shade(uc,-.3),.8),{cast:false});};
  if(sol==='cabinet')panels(xe+.04,a0,mat(uc,.5),'short');
  else if(sol==='pantry')panels(xe+.04,a0,mat(uc,.5),'tall');
  else if(sol==='laundry'){panels(a0-1.05,a0,mat(uc,.5),'short');const sm2=mat(uc==='#F1EEE8'?'oak':uc);[1.0,1.5,2.0].forEach(y=>{if(hs(a0-1.15)>y+.1)U(xe+.06,a0-1.08,y,y+.025,hz0+.02,zl1-.05,sm2);});
    U(xe+.12,xe+.16,.05,1.35,zl1-.35,zl1-.31,M('#9AA1A6',.4,.6));U(xe+.1,xe+1.2,.86,.89,zl1-.4,zl1-.05,M('#EDE8DE',.9),{r:.01});U(xe+.06,a0-1.08,2.2,2.215,hz0+.05,hz0+.08,emissive(),{cast:false});}
  else if(sol==='shelves'){const sm2=mat('oak');[.45,.9,1.35,1.8].forEach(y=>{const xs=xe+.06;let x1=a0-.05;while(x1>xs&&hs(x1)<y+.25)x1-=.05;if(x1>xs+.2)U(xs,x1,y,y+.025,hz0+.02,zl1-.08,sm2);});
    [[.2],[.6],[1.0]].forEach(([a],i)=>U(xe+.15+i*.5,xe+.55+i*.5,a-.18,a,hz0+.1,zl1-.15,M('#C8B79A',.95),{r:.02}));}
  else{const cb=M('#7A5638',.6);U(xe+.35,xe+1.15,0,.85,hz0+.05,hz0+.5,cb);[[.1,.3,'#8a6c9a'],[.35,.6,'#5f7f5f'],[.62,.8,'#c9b07a']].forEach(([a,b,c])=>U(xe+.4+a,xe+.4+b,.85,1.1,hz0+.1,hz0+.4,M(c,.9),{r:.01}));U(xe+1.3,xe+2.0,0,.6,hz0+.1,hz0+.6,M('#3A3D40',.6));}
}
function buildCeilings(par,p,S){
  const g=new THREE.Group();par.add(g);g.visible=false;reg.ceil=g;const H=S.dims.H,cm=memo('ceil',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#F7F6F2'),roughness:.95}));
  const add=(x0,z0,x1,z1)=>{if(x1-x0<.05||z1-z0<.05)return;const me=box(g,x0,x1,H,H+.2,z0,z1,cm,{cast:false});me.userData.nopick=1;};
  add(-.2,-.2,S.dims.OW+.2,p.kwZ+.2);add(-.2,p.kwZ,p.hx0,S.dims.OD+.2);
  add(p.hx0-.2,p.hz0,p.xe,p.zl1);add(p.hx0-.2,p.zl1,S.dims.OW+.2,p.hz1+.2);
  p.rooms.mamad.rects.concat(p.rooms.service.rects).forEach(([a,b,c,d])=>add(a-.3,b-.2,c+.3,d+.3));
  const bal=new THREE.Mesh(new THREE.BoxGeometry(p.bx1-p.bx0,.06,p.bz1-p.bz0),memo('balRoof',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#F2F1EC'),roughness:.5,transparent:true,opacity:.55})));bal.position.set((p.bx0+p.bx1)/2,2.65,(p.bz0+p.bz1)/2);bal.userData.nopick=1;g.add(bal);
}

/* ---------- furniture ---------- */
function sofaB(g,w,d,col,seats,bh,o={}){
  const m=fabric(col),cush=fabric(col==='rattan'?'#EEE7DA':shade(col,.05)),legM=o.legs||M('#2A2724',.45,.3);
  const W=w/2,D=d/2,rr=.05;
  rbox(g,-W+.02,W-.02,.14,.4,-D+.02,D-.02,m,.04);rbox(g,-W+.05,W-.05,.38,bh,D-.22,D,m,.06);
  rbox(g,-W,-W+.18,.14,.62,-D,D,m,.07);rbox(g,W-.18,W,.14,.62,-D,D,m,.07);
  const cw=(w-.36)/seats;
  for(let i=0;i<seats;i++){const x0=-W+.18+i*cw;rbox(g,x0+.006,x0+cw-.006,.38,.53,-D+.03,D-.2,cush,rr);rbox(g,x0+.01,x0+cw-.01,.5,bh-.02,D-.36,D-.18,cush,.07);}
  [[-W+.06,-D+.06],[W-.06,-D+.06],[-W+.06,D-.06],[W-.06,D-.06]].forEach(([a,b])=>cyl(g,.018,.014,.14,a,0,b,legM,{seg:12}));
}
function chairB(g,col,high,arm){
  const m=fabric(col),legM=WOODHEX[col]?mat(col):(col==='rattan'?M('#B08A5A',.75):mat('oak'));
  rbox(g,-.22,.22,.43,.5,-.22,.2,m,.025);rbox(g,-.21,.21,.5,high?1.02:.86,.15,.21,m,.025);
  [[-.19,-.19],[.19,-.19],[-.19,.18],[.19,.18]].forEach(([a,b])=>cyl(g,.017,.014,.43,a,0,b,legM,{seg:10}));
  if(arm){rbox(g,-.25,-.2,.6,.645,-.22,.2,legM,.012);rbox(g,.2,.25,.6,.645,-.22,.2,legM,.012);}
}
function pendantB(g,type,col,H,lights,w){
  const warm=emissive('#fff2d8',2.4),cord=M('#222',.6);let yb=1.72,top=yb;
  if(type==='pRattan'){const r=(w||.48)/2;const rm=memo('ratt'+col,()=>new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:.95,side:THREE.DoubleSide,normalMap:fabricNormal(),normalScale:new THREE.Vector2(1.2,1.2)}));sphere(g,r,0,yb,0,rm,{half:1,ws:36});sphere(g,.045,0,yb+.04,0,warm,{cast:false});top=yb+r;}
  else if(type==='pDrum'){yb=1.6;const r=(w||.64)/2;cyl(g,r,r,.26,0,yb,0,memo('drum'+col,()=>new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:.95,side:THREE.DoubleSide,emissive:new THREE.Color('#ffe9c8'),emissiveIntensity:.35})),{open:true,seg:40});sphere(g,.045,0,yb+.12,0,warm,{cast:false});top=yb+.26;}
  else if(type==='pGlobe'){yb=1.65;const r=(w||.35)/2;sphere(g,r,0,yb+r,0,memo('opal',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#fbf7ee'),emissive:new THREE.Color('#fff1d8'),emissiveIntensity:1.2,roughness:.25})),{cast:false});box(g,-.04,.04,yb+2*r-.02,yb+2*r+.05,-.04,.04,M('#B8955A',.3,.9),{r:.01});top=yb+2*r+.05;}
  else if(type==='pLinear'){yb=1.75;box(g,-.7,.7,yb,yb+.05,-.04,.04,mat(col),{r:.01});box(g,-.66,.66,yb-.004,yb,-.025,.025,warm,{cast:false});top=yb+.05;tube(g,[-.55,top,0],[-.55,H,0],.004,cord);tube(g,[.55,top,0],[.55,H,0],.004,cord);}
  else{yb=1.6;cyl(g,.065,.065,.3,0,yb,0,memo('glassP',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#ffffff'),emissive:new THREE.Color('#fff6e6'),emissiveIntensity:1.1,roughness:.2})),{cast:false});top=yb+.3;}
  if(type!=='pLinear')cyl(g,.004,.004,H-top,0,top,0,cord,{cast:false,seg:6});
  if(lights.n<8){const L=new THREE.PointLight(0xffdcae,2.2,0,2);L.position.set(0,yb-.12,0);L.userData.lamp=1;g.add(L);lights.n++;}
}
const loader=new GLTFLoader(),modelCache={};
function loadModel(file){if(!modelCache[file])modelCache[file]=loader.loadAsync('/models/'+file).then(gl=>{gl.scene.traverse(o=>{if(o.isLight)o.visible=false;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return gl;});return modelCache[file];}
async function applyVariant(gl,root,name){const ext=gl.userData.gltfExtensions&&gl.userData.gltfExtensions.KHR_materials_variants;if(!ext||!name)return;const idx=ext.variants.findIndex(v=>v.name===name);if(idx<0)return;const jobs=[];
  root.traverse(o=>{const mx=o.userData.gltfExtensions&&o.userData.gltfExtensions.KHR_materials_variants;if(!o.isMesh||!mx)return;const mp=mx.mappings.find(m=>m.variants.includes(idx));if(mp)jobs.push(gl.parser.getDependency('material',mp.material).then(m=>{o.material=m;gl.parser.assignFinalMaterial(o);}));});await Promise.all(jobs);}
let onModelReady=()=>{};export const setOnModelReady=f=>{onModelReady=f;};
function modelItem(g,it,C,w){const custom=it.w||it.d||it.h;
  loadModel(C.model.file).then(async gl=>{if(!g.parent)return;const inst=gl.scene.clone(true);
    if(C.model.variants){const vi=C.model.chips?C.model.chips.indexOf(it.c||C.c):-1;await applyVariant(gl,inst,C.model.variants[vi>=0?vi:0]);}
    const b=new THREE.Box3().setFromObject(inst),sz=b.getSize(new THREE.Vector3()),ct=b.getCenter(new THREE.Vector3());
    const u=C.model.fixedSize?1:(w/sz.x),sx=custom&&it.w?it.w/sz.x:u,sy=custom&&it.h?it.h/sz.y:u,sz2=custom&&it.d?it.d/sz.z:u;inst.scale.set(sx,sy,sz2);inst.position.set(-ct.x*sx,-b.min.y*sy,-ct.z*sz2);
    const wrap=new THREE.Group();wrap.add(inst);wrap.rotation.y=Math.PI;if(C.wall){wrap.position.z=0;inst.position.z=-b.min.z*sz2;inst.position.y=-b.min.y*sy;}
    g.add(wrap);g.traverse(o=>{if(o.isMesh&&!o.userData.nopick)o.userData.sel={kind:'item',id:it.id};});onModelReady(it.id);
  }).catch(()=>{});
}
function fitSize(g,it,C){
  if(!(it.w||it.d||it.h))return;const b=new THREE.Box3().setFromObject(g);if(b.isEmpty())return;const s=b.getSize(new THREE.Vector3());
  const f=v=>Math.abs(v-1)<.01?1:v,sx=it.w&&s.x>.01?f(it.w/s.x):1,sz=it.d&&s.z>.01&&!C.wall?f(it.d/s.z):1,sy=it.h&&!C.hang&&b.min.y<.06&&b.max.y>.01?f(it.h/b.max.y):1;
  g.scale.set(sx,sy,sz);
}
export function buildItem(it,H,lights,prod){
  const C=R.CAT[it.type],g0=new THREE.Group(),g=new THREE.Group();g0.add(g);FIN=it.fin||'fabric';
  const w=it.w||(prod&&prod.w?prod.w/100:C.w),d=it.d||(prod&&prod.d?prod.d/100:C.d),col=it.c||(prod&&prod.color)||C.c,HS=it.type==='tvSlats'&&it.h?it.h:H;
  if(C.model){modelItem(g0,it,C,w);}
  else switch(it.type){
    case 'sofa3':sofaB(g,w,d,col,w>2.2?3:2,.82);break;
    case 'outSofa':sofaB(g,w,d,col,2,.78,{legs:mat('teak')});break;
    case 'sofaBed':sofaB(g,w,d,col,w>1.6?3:2,.84);break;
    case 'armchair':sofaB(g,w,d,col,1,.92,{legs:col==='rattan'?mat('oak'):undefined});break;
    case 'recliner':sofaB(g,w,d,col,1,1.0);break;
    case 'sofaL':{const g1=new THREE.Group();sofaB(g1,w,.98,col,3,.82);g1.position.z=d/2-.49;g.add(g1);const m=fabric(col),zA=-d/2,zB=d/2-.96;rbox(g,w/2-.9,w/2,.14,.4,zA,zB,m,.04);rbox(g,w/2-.88,w/2-.17,.38,.53,zA+.02,zB,fabric(shade(col,.05)),.05);rbox(g,w/2-.18,w/2,.14,.62,zA,zB,m,.07);break;}
    case 'pouf':{const m=fabric(col);const p=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2*.96,.42,40),m);p.position.y=.21;p.castShadow=p.receiveShadow=true;g.add(p);const t=new THREE.Mesh(new THREE.TorusGeometry(w/2-.03,.03,12,40),m);t.rotation.x=Math.PI/2;t.position.y=.41;g.add(t);break;}
    case 'coffeeR':{const m=mat(col);cyl(g,w/2,w/2,.035,0,.37,0,m,{seg:48});cyl(g,w*.3,w*.34,.37,0,0,0,m,{seg:40});break;}
    case 'coffeeS':{const m=mat(col);rbox(g,-w/2,w/2,.36,.4,-d/2,d/2,m,.008);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(g,a*(w/2-.06)-.022,a*(w/2-.06)+.022,0,.36,b*(d/2-.06)-.022,b*(d/2-.06)+.022,m));break;}
    case 'rug':{const m=memo('rug'+col,()=>new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:1,normalMap:fabricNormal(),normalScale:new THREE.Vector2(.9,.9)}));rbox(g,-w/2,w/2,0,.012,-d/2,d/2,m,.005,{cast:false});break;}
    case 'tvUnit':{const m=mat(col,.5);rbox(g,-w/2,w/2,.24,.6,-d/2,d/2,m,.006);const s=M(shade(col,-.4),.8);for(let i=1;i<4;i++){const x=-w/2+i*w/4;box(g,x-.002,x+.002,.25,.59,-d/2-.002,-d/2,s,{cast:false});}break;}
    case 'tvSlats':{const m=mat(col),dk=M(shade(col,-.55),.9);box(g,-w/2,w/2,0,HS,0,.012,dk,{cast:false});for(let x=-w/2+.02;x<w/2-.02;x+=.06)box(g,x,x+.04,0,HS,-.03,.012,m,{cast:false});break;}
    case 'tv':rbox(g,-w/2,w/2,.95,1.78,-.03,.03,M('#0e0f11',.15,.3),.006);box(g,-w/2+.01,w/2-.01,.96,1.77,-.032,-.03,M('#0a0c10',.03,.2),{cast:false});break;
    case 'sideboard':case 'console':{const m=mat(col,.5),hh=prod&&prod.h&&it.type==='console'?prod.h/100:(it.type==='console'?.8:.78);rbox(g,-w/2,w/2,.1,hh,-d/2,d/2,m,.005);const s=M(shade(col,-.4),.8),n=Math.max(1,Math.round(w/.45));for(let i=1;i<n;i++){const x=-w/2+i*w/n;box(g,x-.002,x+.002,.11,hh-.01,-d/2-.002,-d/2,s,{cast:false});}
      if(hh>1)for(let y=.1+(hh-.1)/3;y<hh-.05;y+=(hh-.1)/3)box(g,-w/2+.01,w/2-.01,y-.002,y+.002,-d/2-.002,-d/2,s,{cast:false});
      const lm=M('#2A2724',.45,.4);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>cyl(g,.012,.012,.1,a*(w/2-.05),0,b*(d/2-.04),lm,{seg:8}));break;}
    case 'shelf':{const m=mat(col);box(g,-w/2,-w/2+.025,0,1.9,-d/2,d/2,m);box(g,w/2-.025,w/2,0,1.9,-d/2,d/2,m);[0,.45,.9,1.35,1.875].forEach(y=>box(g,-w/2,w/2,y,y+.025,-d/2,d/2,m));rbox(g,-w/2+.1,-w/2+.35,.475,.75,-d/2+.05,d/2-.05,M('#C8B79A',.9),.02);rbox(g,.05,.3,.925,1.1,-.05,.1,M('#7A8796',.8),.01);break;}
    case 'floorLamp':{const m=M(hexOf(col),.4,.5);cyl(g,.16,.16,.025,0,0,0,m);cyl(g,.012,.012,1.45,0,.025,0,m);cyl(g,.17,.2,.28,0,1.42,0,memo('lshade',()=>new THREE.MeshStandardMaterial({color:new THREE.Color('#F3EDE2'),emissive:new THREE.Color('#ffe9c8'),emissiveIntensity:.6,side:THREE.DoubleSide})),{open:true,cast:false});if(lights.n<8){const L=new THREE.PointLight(0xffdcae,1.6,0,2);L.position.set(0,1.45,0);L.userData.lamp=1;g.add(L);lights.n++;}break;}
    case 'planter':{cyl(g,.26,.22,.55,0,0,0,M(col,.8));cyl(g,.03,.05,1.0,0,.5,0,M('#6b5640',.9));const lm=M('#8A9A6E',.95);[[0,1.75,0,.42],[.25,1.55,.1,.3],[-.22,1.6,-.1,.32],[.05,2.0,.05,.28]].forEach(([x,y,z,r])=>sphere(g,r,x,y,z,lm,{ws:16,hs:12}));break;}
    case 'tableR':{const m=mat(col,.5);cyl(g,w/2,w/2,.035,0,.74,0,m,{seg:56});cyl(g,.07,.09,.69,0,.05,0,m);cyl(g,.32,.32,.05,0,0,0,m,{seg:40});break;}
    case 'tableS':case 'outTable':case 'desk':{const m=mat(col,.5),hh=.74;rbox(g,-w/2,w/2,hh,hh+.04,-d/2,d/2,m,.006);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(g,a*(w/2-.07)-.03,a*(w/2-.07)+.03,0,hh,b*(d/2-.07)-.03,b*(d/2-.07)+.03,m));
      if(it.type==='outTable')for(let x=-w/2+.06;x<w/2;x+=.12)box(g,x,x+.008,hh+.04,hh+.042,-d/2,d/2,M(shade(col,-.4),.9),{cast:false});break;}
    case 'chair':chairB(g,col,!!it.ex&&hexOf(col)==='#2E1B14');break;
    case 'outChair':chairB(g,col,true,true);break;
    case 'deskChair':{const m=fabric(col),k=M('#2A2724',.45,.4);rbox(g,-.24,.24,.45,.52,-.24,.22,m,.03);rbox(g,-.22,.22,.55,1.0,.18,.24,m,.03);cyl(g,.025,.025,.42,0,.03,0,k);for(let a=0;a<5;a++){const an=a*1.2566;tube(g,[0,.04,0],[Math.sin(an)*.28,.03,Math.cos(an)*.28],.015,k);}break;}
    case 'stool':{const m=fabric(col),chrome=!!it.ex,leg=chrome?M('#C9CDD1',.2,.95):(WOODHEX[col]?mat(col):mat('oak'));
      if(chrome){cyl(g,.2,.2,.06,0,.66,0,m);rbox(g,-.17,.17,.72,.95,.15,.19,m,.02);cyl(g,.025,.025,.66,0,0,0,leg);cyl(g,.2,.2,.02,0,0,0,leg);}
      else{const seat=WOODHEX[col]||col==='rattan'?mat(col):m;rbox(g,-.19,.19,.62,.66,-.19,.19,seat,.02);rbox(g,-.17,.17,.74,.86,.16,.19,seat,.015);[[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]].forEach(([a,b])=>cyl(g,.016,.014,.62,a,0,b,leg,{seg:10}));[[-.15,.15]].forEach(()=>{tube(g,[-.15,.25,-.15],[.15,.25,-.15],.01,leg);tube(g,[-.15,.62,.15],[-.15,.86,.17],.01,leg);tube(g,[.15,.62,.15],[.15,.86,.17],.01,leg);});}break;}
    case 'pRattan':case 'pDrum':case 'pGlobe':case 'pLinear':case 'pGlass':pendantB(g,it.type,col,H,lights,prod&&prod.w?prod.w/100:null);break;
    case 'mirror':{const round=prod&&/עגול/.test(prod.name||'');if(round){const r=w/2;const fm=new THREE.Mesh(new THREE.TorusGeometry(r-.012,.012,10,64),M(hexOf(col),.35,.5));fm.position.set(0,1.5,-.015);g.add(fm);const mm=new THREE.Mesh(new THREE.CircleGeometry(r-.015,64),M('#dfe5e8',.02,1));mm.position.set(0,1.5,-.012);mm.rotation.y=Math.PI;g.add(mm);}
      else{box(g,-w/2,w/2,1.0,2.0,-.03,0,M(hexOf(col),.35,.5));box(g,-w/2+.03,w/2-.03,1.03,1.97,-.034,-.03,M('#dfe5e8',.02,1),{cast:false});}break;}
    case 'bench':{const m=mat(col);rbox(g,-w/2,w/2,.42,.46,-d/2,d/2,m,.008);box(g,-w/2,-w/2+.04,0,.42,-d/2,d/2,m);box(g,w/2-.04,w/2,0,.42,-d/2,d/2,m);box(g,-w/2+.04,w/2-.04,.12,.14,-d/2+.04,d/2-.04,m);break;}
    case 'bed':{const m=fabric(col);rbox(g,-w/2,w/2,.1,.35,-d/2,d/2-.08,M('#D9D2C6',.9),.02);rbox(g,-w/2+.02,w/2-.02,.35,.58,-d/2+.02,d/2-.1,M('#F7F5F0',.95),.05);rbox(g,-w/2,w/2,.1,1.1,d/2-.08,d/2,m,.03);[-1,1].forEach(s=>{if(w>1.1||s<0)rbox(g,s*w/4-.3,s*w/4+.3,.58,.72,d/2-.45,d/2-.12,M('#FFFFFF',.95),.05);});rbox(g,-w/2+.01,w/2-.01,.57,.63,-d/2+.01,.2,fabric(shade(col,.1)),.03);break;}
    case 'wardrobe':{const m=mat(col,.5);rbox(g,-w/2,w/2,0,2.2,-d/2,d/2,m,.005);const s=M(shade(col,-.4),.8),hm=M('#1E1E1E',.45,.4),n=Math.max(1,Math.round(w/.5));for(let i=1;i<n;i++){const x=-w/2+i*w/n;box(g,x-.002,x+.002,.05,2.15,-d/2-.002,-d/2,s,{cast:false});}for(let i=0;i<n;i++){const x=-w/2+(i+.5)*w/n+(i%2?-1:1)*(w/n/2-.06);box(g,x-.008,x+.008,.9,1.3,-d/2-.022,-d/2,hm,{cast:false});}break;}
    case 'dryRack':{const m=M(hexOf(col),.4,.3);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(g,a*(w/2-.015)-.015,a*(w/2-.015)+.015,0,.95,b*(d/2-.015)-.015,b*(d/2-.015)+.015,m));for(let z=-d/2;z<=d/2+1e-6;z+=d/6)box(g,-w/2,w/2,.93,.95,z-.006,z+.006,m);box(g,-w/2+.2,w/2-.5,.5,.93,-.02,.02,fabric('#7A8796'),{cast:false});break;}
    case 'fridge':rbox(g,-w/2,w/2,0,1.85,-d/2,d/2,M(hexOf(col),.25,.4),.02);box(g,-.003,.003,.02,1.83,-d/2-.002,-d/2,M('#9a9a9a',.6),{cast:false});break;
    case 'washer':{rbox(g,-w/2,w/2,0,.85,-d/2,d/2,M(hexOf(col),.3,.1),.02);const door=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.03,36),M('#2b3138',.06,.3));door.rotation.x=Math.PI/2;door.position.set(0,.45,-d/2-.01);g.add(door);break;}
    case 'laundryCab':{const m=mat(col,.5);rbox(g,-w/2,w/2,0,2.2,-d/2,d/2,m,.005);const s=M(shade(col,-.4),.8);box(g,-.002,.002,.05,2.15,-d/2-.002,-d/2,s,{cast:false});box(g,-w/2,w/2,1.1-.002,1.1+.002,-d/2-.002,-d/2,s,{cast:false});break;}
    case 'sShelf':{const m=mat(col);[0,.5,1.0,1.5].forEach(y=>box(g,-w/2,w/2,y+.3,y+.325,-d/2,d/2,m));box(g,-w/2,-w/2+.02,.3,1.85,-d/2,d/2,m);box(g,w/2-.02,w/2,.3,1.85,-d/2,d/2,m);break;}
    default:rbox(g,-w/2,w/2,0,.5,-d/2,d/2,M('#cccccc'),.02);
  }
  if(!C.model)fitSize(g,it,C);FIN='fabric';
  if(!C.hang&&!C.wall&&it.type!=='rug'&&!(C.y||it.y))contact(g0,w,d);
  g0.traverse(o=>{if(o.isMesh&&!o.userData.nopick)o.userData.sel={kind:'item',id:it.id};});
  g0.position.set(it.x,it.y!=null?it.y:(C.y&&C.wall?C.y:0),it.z);g0.rotation.y=it.rot||0;g0.userData.item=it.id;
  return g0;
}

/* ---------- scene ---------- */
let archG=null,itemsG=null;
export function init(cv){
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
  const mobile=matchMedia('(max-width: 900px)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.75:2));
  renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  maxAniso=renderer.capabilities.getMaxAnisotropy();
  RectAreaLightUniformsLib.init();
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(55,1,.05,150);
  skyDay=makeSky(false);skyNight=makeSky(true);
  pmrem=new THREE.PMREMGenerator(renderer);envDay=pmrem.fromEquirectangular(skyDay).texture;
  scene.environment=envDay;scene.environmentIntensity=.7;
  hemi=new THREE.HemisphereLight(0xffffff,0xd8d0c2,.35);scene.add(hemi);
  sun=new THREE.DirectionalLight(0xfff0dc,3.2);sun.position.set(-3,11,9);sun.target.position.set(6,0,3);
  sun.castShadow=true;sun.shadow.mapSize.set(mobile?2048:4096,mobile?2048:4096);Object.assign(sun.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:40});sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;sun.shadow.radius=3;
  scene.add(sun,sun.target);
  return {renderer,scene,camera};
}
export function setBackground(css){scene.background=new THREE.Color(css);}
function disposeGroup(gr){if(!gr)return;gr.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.remove(gr);}
export function buildArch(S,cut){
  disposeGroup(archG);MC=new Map();glassMats.clear();
  archG=new THREE.Group();scene.add(archG);reg.walls=[];reg.floors=[];
  const p=plan(S);reg.p=p;buildFloors(archG,p,S);p.walls.forEach(w=>buildWall(archG,w,S,cut,S.dims.H));
  buildKitchen(archG,p,S);buildStairs(archG,p,S);buildCeilings(archG,p,S);
  if(!cut){const H=S.dims.H,cm=M('#F7F6F2',.95);[[p.hx0-.2,p.hz0,p.xe,p.zl1],[p.hx0-.2,p.zl1,S.dims.OW,p.hz1+.2]].forEach(([x0,z0,x1,z1])=>{if(x1-x0>.05&&z1-z0>.05)box(archG,x0,x1,H,H+.22,z0,z1,cm,{cast:false,nopick:1});});}
  return p;
}
export function buildItems(S,products){
  disposeGroup(itemsG);itemsG=new THREE.Group();scene.add(itemsG);const lights={n:0};
  S.items.forEach(it=>{if(!R.CAT[it.type])return;itemsG.add(buildItem(it,S.dims.H,lights,it.pid&&products?products[it.pid]:null));});
  return itemsG;
}
export const getItemsG=()=>itemsG, getArchG=()=>archG, getScene=()=>scene, getCamera=()=>camera, getRenderer=()=>renderer;

/* wall culling for the current camera */
function segRect(ax,az,bx,bz,[x0,z0,x1,z1]){let t0=0,t1=1;const dx=bx-ax,dz=bz-az;for(const [p,q] of [[-dx,ax-x0],[dx,x1-ax],[-dz,az-z0],[dz,z1-az]]){if(Math.abs(p)<1e-9){if(q<0)return false;}else{const t=q/p;if(p<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}}return t0<=t1;}
export function cullWalls(cam,target,cut,photo){
  const c=cam.position,high=c.y>4.6;
  reg.walls.forEach(w=>{let hide=false;if(!high&&!cut){const [x0,z0,x1,z1]=w.rect;
      if(segRect(c.x,c.z,c.x+(target.x-c.x)*.82,c.z+(target.z-c.z)*.82,[x0-.02,z0-.02,x1+.02,z1+.02]))hide=true;
      else if(!photo&&w.ext&&w.out&&((c.x-w.mid[0])*w.out[0]+(c.z-w.mid[1])*w.out[1])>.15)hide=true;}
    w.g.visible=!hide;});
}

/* ---------- path-traced photo ---------- */
let photoState=null;
export async function photo(opts){
  const {target,samples,evening,onProgress,onStatus,cut}=opts;
  onStatus('טוען את מנוע הצילום…');
  const mod=await import('three-gpu-pathtracer');const {WebGLPathTracer}=mod;const {FullScreenQuad:FSQ}=await import('three/addons/postprocessing/Pass.js');
  const mobile=matchMedia('(max-width: 900px)').matches;
  const saved={env:scene.environment,bg:scene.background,ei:scene.environmentIntensity,sun:sun.intensity,sunVis:sun.visible,hemi:hemi.intensity,exp:renderer.toneMappingExposure,glass:[],fake:[],lamps:[],ceil:reg.ceil.visible};
  saved.emis=[];const seenM=new Set();
  scene.traverse(o=>{if(o.isMesh)[].concat(o.material).forEach(m=>{if(m&&m.emissive&&m.emissiveIntensity>0&&!seenM.has(m)){seenM.add(m);saved.emis.push([m,m.emissiveIntensity]);m.emissiveIntensity*=evening?.5:.08;}});
    if(o.userData.fake&&o.visible){saved.fake.push(o);o.visible=false;}if(o.isPointLight&&o.userData.lamp){saved.lamps.push([o,o.intensity]);o.intensity=0;}});
  glassMats.forEach(m=>{saved.glass.push([m,m.transmission,m.opacity,m.transparent]);m.transmission=1;m.opacity=1;m.transparent=false;});
  reg.ceil.visible=camera.position.y<S_H()&&!cut;
  cullWalls(camera,target,cut,true);
  scene.environment=evening?skyNight:skyDay;scene.background=scene.environment;scene.environmentIntensity=evening?1:1.0;
  sun.visible=!evening;hemi.intensity=0;
  const extra=[],p=reg.p,OW=S_OW(),H=S_H();
  const spots=[[2.4,3.2],[p.dineX,p.dineZ],[OW-1.7,(p.DI||0)+2.3],[(p.hx0+p.a0)/2,(p.zl1+p.hz1)/2],[(p.mx0+p.mx1)/2,(p.mz0+p.mz1)/2],[(p.sx0+p.sx1)/2,(p.sz0+p.sz1)/2]];
  const dm=new THREE.MeshStandardMaterial({color:0xffffff,emissive:new THREE.Color('#fff1dc'),emissiveIntensity:evening?8:4});
  const ceilM=memo('ceil',()=>null);if(ceilM){saved.ceilE=[ceilM.emissive.getHex(),ceilM.emissiveIntensity];ceilM.emissive.set(evening?'#ffdcae':'#fff6ea');ceilM.emissiveIntensity=evening?.3:.45;}

  renderer.toneMappingExposure=evening?1.3:1.1;
  onStatus('מכין את הסצנה…');
  await new Promise(r=>setTimeout(r,60));
  const pt=new WebGLPathTracer(renderer);
  pt.tiles.set(mobile?3:2,mobile?3:2);pt.renderScale=mobile?.6:1;pt.bounces=6;pt.transmissiveBounces=6;pt.filterGlossyFactor=.5;pt.minSamples=1;pt.fadeDuration=0;pt.renderDelay=0;pt.dynamicLowRes=false;
  pt.setScene(scene,camera);
  photoState={pt,saved,extra,stop:false};
  onStatus('מחשב אור…');
  return await new Promise(resolve=>{
    const t0=performance.now();
    const step=()=>{if(!photoState||photoState.stop){finish();resolve(null);return;}
      pt.renderSample();onProgress(pt.samples,samples,(performance.now()-t0)/1000);
      if(pt.samples>=samples){let url;try{url=denoise(pt,mod,FSQ,opts.denoise!==false);}catch(e){url=renderer.domElement.toDataURL('image/png');}finish();resolve(url);return;}
      requestAnimationFrame(step);};
    requestAnimationFrame(step);
  });
}
function denoise(pt,mod,FSQ,on){
  if(!on)return renderer.domElement.toDataURL('image/png');
  const q=new FSQ(new mod.DenoiseMaterial({map:pt.target.texture,blending:THREE.CustomBlending,premultipliedAlpha:renderer.getContextAttributes().premultipliedAlpha}));
  if(q.material.uniforms){q.material.uniforms.sigma.value=4;q.material.uniforms.threshold.value=.035;q.material.uniforms.kSigma.value=1;}
  renderer.setRenderTarget(null);const ac=renderer.autoClear;renderer.autoClear=false;q.render(renderer);renderer.autoClear=ac;
  const url=renderer.domElement.toDataURL('image/png');q.material.dispose();q.dispose();return url;
}
export function stopPhoto(){if(photoState)photoState.stop=true;}
function finish(){if(!photoState)return;const {pt,saved,extra}=photoState;try{pt.dispose();}catch(e){}
  extra.forEach(l=>{scene.remove(l);if(l.geometry)l.geometry.dispose();});(saved.emis||[]).forEach(([m,i])=>m.emissiveIntensity=i);{const cm=MC.get('ceil');if(cm&&saved.ceilE){cm.emissive.setHex(saved.ceilE[0]);cm.emissiveIntensity=saved.ceilE[1];}}saved.fake.forEach(o=>o.visible=true);saved.lamps.forEach(([o,i])=>o.intensity=i);saved.glass.forEach(([m,t,o,tr])=>{m.transmission=t;m.opacity=o;m.transparent=tr;});
  scene.environment=saved.env;scene.background=saved.bg;scene.environmentIntensity=saved.ei;sun.intensity=saved.sun;sun.visible=saved.sunVis;hemi.intensity=saved.hemi;renderer.toneMappingExposure=saved.exp;reg.ceil.visible=saved.ceil;
  photoState=null;}
export const photoActive=()=>!!photoState;
let _S=null;export const setStateRef=s=>{_S=s;};const S_H=()=>_S?_S.dims.H:2.7,S_OW=()=>_S?_S.dims.OW:11;
