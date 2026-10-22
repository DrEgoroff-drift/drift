new Promise(res=>{const SEL=["#prompt","#console",".pads",".rail",".vitals",".locus"],roots=SEL.map(s=>[s,document.querySelector(s)]).filter(x=>x[1]);
const nm=el=>{if(!el)return "?";if(el.nodeType===3)el=el.parentNode;return (el.tagName||"").toLowerCase()+(el.id?"#"+el.id:"")+(el.className&&typeof el.className==="string"?"."+el.className.trim().split(/\s+/).slice(0,2).join("."):"");};
const rootOf=el=>{for(const [s,r] of roots)if(r===el||r.contains(el))return s;return null;};
const tab={},first={},keep=[];let dirty=0,frames=0;
const mo=new MutationObserver(L=>{for(const m of L){const k=rootOf(m.target)+" · "+nm(m.target)+" · "+m.type+(m.attributeName?"/"+m.attributeName:"");tab[k]=(tab[k]||0)+1;}});
for(const [s,r] of roots)mo.observe(r,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["class"]});
const pads=document.querySelector(".pads");if(pads)mo.observe(pads,{attributes:true,attributeFilter:["style"]});
const st=()=>(new Error().stack||"").split("\n").slice(3,7).map(l=>l.trim().replace(/^at /,"").replace(/ \(.*:(\d+):\d+\)$/," :$1")).join(" < ");
const hook=(obj,prop,op,get)=>{const d=Object.getOwnPropertyDescriptor(obj,prop);if(!d)return;keep.push([obj,prop,d]);
  if(d.set)Object.defineProperty(obj,prop,Object.assign({},d,{set(v){const r=rootOf(this);if(r){const k=r+" · "+nm(this)+" · "+op;if(!first[k])first[k]=st();}return d.set.call(this,v);}}));
  else if(typeof d.value==="function")Object.defineProperty(obj,prop,Object.assign({},d,{value:function(){const t=get?get(this):this,r=rootOf(t);if(r){const k=r+" · "+nm(t)+" · "+op;if(!first[k])first[k]=st();}return d.value.apply(this,arguments);}}));};
hook(Node.prototype,"textContent","textContent");hook(Element.prototype,"innerHTML","innerHTML");hook(Element.prototype,"className","className");
hook(HTMLElement.prototype,"innerText","innerText");hook(CharacterData.prototype,"data","data");hook(Node.prototype,"nodeValue","nodeValue");
for(const f of ["appendChild","removeChild","insertBefore","replaceChild"])hook(Node.prototype,f,f);
for(const f of ["append","prepend","replaceChildren","remove","setAttribute","removeAttribute","toggleAttribute"])hook(Element.prototype,f,f);
for(const f of ["add","remove","toggle","replace"])hook(DOMTokenList.prototype,f,"classList."+f,t=>t.__el||null);
/* classList не знает своего элемента — пометим при чтении */
const cl=Object.getOwnPropertyDescriptor(Element.prototype,"classList");keep.push([Element.prototype,"classList",cl]);
Object.defineProperty(Element.prototype,"classList",Object.assign({},cl,{get(){const l=cl.get.call(this);l.__el=this;return l;}}));
const rd=globalThis.rectsDirty;globalThis.rectsDirty=function(){dirty++;return rd.apply(this,arguments);};
const fb=globalThis.frameBody;globalThis.frameBody=function(){frames++;return fb.apply(this,arguments);};
keys.right=true;
setTimeout(()=>{keys.right=false;mo.disconnect();for(const [o,p,d] of keep)Object.defineProperty(o,p,d);globalThis.rectsDirty=rd;globalThis.frameBody=fb;
  const S=5;res({mode:G.mode,frames,dirtyPerSec:+(dirty/S).toFixed(1),framesPerSec:+(frames/S).toFixed(0),
    table:Object.entries(tab).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>(v/S).toFixed(1)+"/с  "+k),
    firstStacks:Object.entries(first).slice(0,12).map(([k,v])=>k+"  ←  "+v)});},5000);})
