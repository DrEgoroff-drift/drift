/* ══════════════ формы рельефа на видеокарте (G15) ══════════════
   Тело формы печётся раз на свет — день, сторона звезды, доля тени гребня — с ветром
   и часами на нуле (GPU-холст 08ca) и кладётся в слой стоящего (21e2): оттуда
   падающая тень и свет мира, как у построек. Ветер гнёт форму от подножия:
   выпечка ложится полосами, верхние уходят дальше нижних. Кроны — поворотом всей
   формы (так их качал 2D), деревья и вайи — изгибом, остальное стоит одной полосой. */
const DECO_BK=new WeakMap();
const DECO_ROT={canopy:1,crownround:1,twincanopy:1};
const DECO_BEND={frond:1,drytree:1,podtree:1,shoretree:1,lavatree:1};
/* одна форма в ctx, начало в подножии — общий путь 2D и выпечки */
function decoPaint(A){
  const d=A.d,fn=DECO_FN[d.k];            // семьи биомов (21bb-deco-biomes, M352) — по таблице
  if(fn)fn(A);
  else if(d.k==="druse")decoDruse(A);
  else if(d.k==="shard")decoShard(A);
  else if(d.k==="slab")decoSlab(A);
  else if(d.k==="truss")decoTruss(A);
  else if(d.k==="wall")decoWall(A);
  else if(d.k==="column")decoColumn(A);
  else if(d.k==="canopy")decoCanopy(A);
  else if(d.k==="frond")decoFrond(A);
}
/* середина полного холста относительно подножия: без getImageData —
   обрезка по альфе была 2D-хитчем; запас VRAM терпим, форма как у poiBake */
function bakeFoot(cn,w,h,top,bot){
  return cn?{cn,w,h,cx:0,cy:(bot-top)/2}:null;
}
function decoBake(d,tr,p,s){
  const key=p.seed+"|"+DPR+"|"+SCK+"|d"+dayKq(p)+"|a"+sunAzQ(p)+"|s"+s+"|"+(tr.mat?1:0);
  const o=DECO_BK.get(d);if(o&&o.key===key)return o.B;
  const hgt=d.h,hw=Math.ceil(hgt*.95+30),top=Math.ceil(hgt*2.7+24),bot=14;
  const gy=groundAt(tr,d.x),w=d.h*.42*d.sc,ww=hw*2,hh=top+bot,t0=G.t,w0=WIND;
  const cn=gpuBake(ww,hh,g=>{
    g.translate(hw,top);
    groundClip(g,tr,d.x,gy,hw,top,10);    /* форма стоит НА земле; запас 10 px — подножию */
    G.t=0;WIND=0;POI_SEED=d.seed;POI_MAT=null;
    DECO_LIT=1-((typeof CAST_LIVE==="number")?CAST_LIVE:.5)*s;
    try{if(d.flip)g.scale(-1,1);decoPaint({d,pal:p.T.pal,p,tr,w,hgt,ox:d.x,oy:gy});}
    finally{G.t=t0;WIND=w0;DECO_LIT=1;}
  });
  const B=bakeFoot(cn,ww,hh,top,bot);
  DECO_BK.set(d,{key,B});return B;
}
/* насколько ушёл верх формы от ветра, px в мире: та же формула, что качала крону */
function decoSway(d){
  if(!DECO_ROT[d.k]&&!DECO_BEND[d.k])return 0;
  const a=WIND*.02*(.7+.3*Math.sin(G.t*.02+d.seed%97))*d.h*(DECO_BEND[d.k]?1.2:1);
  return d.flip&&DECO_ROT[d.k]?-a:a;
}
function decoGpu(tr,camx,camy,p,vis){
  if(typeof GPU==="undefined"||!GPU.ok||!GPU.on||!GPU.enc||typeof SUN_DIR!=="object")return false;
  if(!GPU.overPass&&!standPass())return false;
  const o=lifeHere(0,0),K=o.s,live=(typeof castLive==="function"),sh=[],R=[];
  for(const q of vis){
    const s=live?castLive(tr,q.d.x):0;
    /* контактная тень — от прямого света: в падающей тени её нечем отбросить */
    if(s<=.97)sh.push(poiShadowRect(q.x-q.w*.45,q.y+2,Math.max(6,q.w*1.5),Math.max(2.6,q.hgt*.055),.72*(1-s),o));
    const B=decoBake(q.d,tr,p,Math.round(s*8)/8);if(!B)continue;
    const sw=decoSway(q.d),n=sw&&Math.abs(sw)>.3?8:1,lin=!!DECO_ROT[q.d.k],y0=B.cy-B.h/2,L=[];
    for(let j=0;j<n;j++){
      const v0=j/n,v1=(j+1)/n,ym=y0+(v0+v1)/2*B.h,u=clamp(-ym/q.hgt,0,1.4),dx=sw*(lin?u:u*u);
      L.push({x:o.x+(q.x+B.cx+dx)*K,y:o.y+(q.y+ym)*K,w:B.w*K,h:B.h/n*K,v0,v1});
    }
    R.push([B.cn,L]);
  }
  standAdd((pass,bl,layer)=>{
    if(!layer&&sh.length)gpuImage(pass,poiShadowTex(),sh);
    for(const [cn,L] of R)gpuImage(pass,cn,L,{blend:bl});
  });
  return true;
}
