/* ══════════════ планета: посёлок телами (plnOverOld, пункт 1, 22.10) ══════════════
   Посёлок был наклейкой поверх кадра (settleDraw 12t → settleDrawBody 12tb, ремёсла 12tc, мачта 12td,
   табличка 17d, ставни 11g, дверь уезда 11l). Теперь это тела на земле движка, и правила 12tb те же:

   1. Мерило — человек (1.75 м): изба — два с половиной роста, сарай — три, печь — полтора.
   2. Место ровное: полка срезана в склон (срез земли — plnOwnFlat 21pig), спереди бордюр из камня,
      задний ряд — на ступени в 0.9 м выше.
   3. У ремесла своё тело: поле — гряды и пугало; запруда — насыпь с водой и щитом; печь — купол
      с топкой; камнерезка — козлы и штабель плит; кузня — навес, горн и наковальня; перегонка —
      бак со змеевиком и бочки.
   4. Стена — из того, из чего её сложили: сруб брёвнами, доска рейкой, саман с балками наружу,
      камень с угловыми камнями, лист с рёбрами; кровля — солома, черепица рядами, тёс, лист (sdMat).
   5. Быт важнее архитектуры: поленница, крыльцо, сенцы, очаг посреди улицы, плетень, люди за делом.

   Порядок, род, ряд и зеркало дворов — из settlePlan (12tb): тот же план держит ходьбу (стена M210,
   автомат, перевал), и посёлок не переставляется оттого, что его нарисовали иначе. План дома — housePlan,
   материал — sdMat мира. Свет: окна тёплые ночью (запись 1), огонь очага, печи и горна дрожит
   (запись 2), лампа очага — одна из двух своих ламп кадра (21pig). Дым — клубы записями, только когда
   посёлок сыт (mood ≥ 34), как было. Ставни (11g): закрыты — доска поперёк, огня в окне нет. Уезд
   (11l): на планете ядра у сарая — дверь в четыре метра, створка уходит по шуму, со светом — три окна,
   с третьего уровня — подъёмник с четырьмя кроватками. Люди часов (11h) остались в 12t: это не посёлок,
   а один прохожий в затмение. */
const SET_V={z:10.5,man:1.75,front:-1.1,back:3.9,lift:.9,street:-4.4,fence:-6.3};
let SET_SPILL=null;
const SET_WIN=[1,.6,.28];   /* окно посёлка — тёплый янтарь лучины, не белый свет станции */   /* сетка отсветов окон, пока строится посёлок (plnSetMesh) */
const SET={it:null,gen:-1,L:null,puff:null,at:null};

/* до первого дара записи нет, но люди здесь уже есть: та же болванка, что у 12t */
function plnSetRec(p){return settleAt(G.sx,G.sy)||{seed:hashi(G.sx,G.sy,(p&&p.idx|0)+0x5E77),built:[],mood:20,stage:1};}
/* раскладка в метрах: порядок, род, ряд и зеркало — из settlePlan, размеры — в людях; дальний ряд
   в 2D был мельче на четверть ради глубины — здесь глубину даёт объектив, и мельчить его незачем */
function plnSetLay(S,tr,p){
  const P=settlePlan(S,tr,p);if(!P||!P.yards.length)return null;
  const V=SET_V,mine=typeof settleMine==="function"&&settleMine(S),out=[];
  let x=0,last=0;
  for(const y of P.yards){
    const K=SD_KIND[y.kind]||SD_KIND.dwell,k=y.back?y.k/.74:y.k;
    const w=V.man*K.w*k,h=V.man*K.h*k,gap=mine?1.6:1.1+y.r*1.3;
    out.push({kind:y.kind,back:y.back,flip:y.flip,r:y.r,k,w,h,x:x+w/2,wx:y.wx});
    x+=w+gap;last=gap;
  }
  const span=x-last;
  for(const q of out){q.x-=span/2;q.z=q.back?V.back:V.front;q.y=q.back?V.lift:0;}
  return {P,yards:out,span,mine};
}
/* место: середина посёлка (settleSpotX), полка на высоте по правилу двора дома (21pig plnOwnHomeAt):
   не ниже низа земли под дворами, не ниже гребня перед ними минус метр */
function plnSetAt(L,tr,p){
  if(!OWN.on||!p||typeof settleCanLive!=="function"||!settleCanLive(p))return null;
  const bx=settleSpotX(p,tr);if(bx==null)return null;
  const S=plnSetRec(p),Y=plnSetLay(S,tr,p);if(!Y)return null;
  const key=Y.P.key;
  if(SET.at&&SET.at.key===key&&SET.at.L===L)return Object.assign(SET.at,{S,Y,P:Y.P});
  const x=bx/PLN_M,z=SET_V.z,hw=Y.span/2+3;
  const hs=[];let crest=-1e9;const f0=L.flat;L.flat=null;
  try{
    for(let dx=-hw;dx<=hw+.01;dx+=hw/6)for(const dz of [-5,-2,1,4,7])hs.push(plnLandRibAt(L,x+dx,z+dz));
    for(let zz=2;zz<=z-6;zz+=2)for(let dx=-hw;dx<=hw+.01;dx+=hw/3)crest=Math.max(crest,plnLandRibAt(L,x+dx,zz));
  }finally{L.flat=f0;}
  /* посёлок длиной в полсотни метров: правило двора (низ земли, гребень минус метр) поднимало полку
     насыпью в десять метров. Полку срезают по склону — уровень на сорока процентах земли под дворами:
     выше — срез, ниже — подсыпка; гребень перед посёлком прячет не больше полутора метров (за дюной
     в три метра от изб оставались одни крыши) */
  hs.sort((a,b)=>a-b);
  const lo=hs[0],y=Math.max(hs[Math.floor(hs.length*.4)]-.1,crest-1.5);
  return (SET.at={key,L,x,y,z,lo,S,Y,P:Y.P,bx});
}
/* срез под полкой и площадка для расчистки трав: зовут plnOwnFlat и plnOwnPads (21pig) */
function plnSetFlat(L){
  const tr=L&&L.tr,p=tr&&tr.p,A=tr&&p?plnSetAt(L,tr,p):null;
  return A?[[A.x,A.z+1.2,A.Y.span/2+5.5,8.2,A.y-.06]]:null;
}
function plnSetPad(tr,p){
  if(!OWN.on||typeof settleCanLive!=="function"||!settleCanLive(p))return null;
  const bx=settleSpotX(p,tr);if(bx==null)return null;
  const Y=plnSetLay(plnSetRec(p),tr,p);
  /* расчистка — от двух метров перед линией плетня до задних дворов; ближе к линии хода не тянуть: трава
     игры (21pia) выходит из-под площадки вперёд, и вся она легла бы на саму линию */
  return Y?[bx/PLN_M,11.5,Y.span/2+5,9.5,9]:null;
}
/* то, от чего зависит вид посёлка, кроме плана: сыт ли, дозор, ставни, уезд, чей дом */
function plnSetState(S,p){
  const nobody=typeof hoursNobody==="function"&&hoursNobody(p);
  const sh=typeof lightsDepthHere==="function"&&lightsDepthHere()?(lightsShut()?2:1):0;
  const core=typeof countyIsCore==="function"&&countyIsCore(p),lvl=core&&G.surf?countyLevel(G.surf):0;
  const H=typeof houseOf==="function"?houseOf(G.sys):null;
  const st={warm:S.mood>=34,guard:(S.stage|0)>=2&&!nobody,mine:typeof settleMine==="function"&&settleMine(S),
    shut:sh,core,lvl,lit:lvl>=2,lift:lvl>=3,H};
  st.key=[st.warm,st.guard,st.mine,sh,core,Math.min(lvl,3),H?H.id+H.col:"-"].join(",");
  return st;
}

/* ── краски ── */
function plnSetPal(p){
  const q=sdPal(p),c=v=>plnRgb(v);
  /* дерево и стена — тёплые: местный тон мира (зелёный, синий) в 2D держался подсветкой, а под солнцем
     движка давал холодно-тёмный, почти чёрно-синий сруб в полдень. Лицо на свету берёт тёплый ключ,
     тень холодит свет сцены сама */
  return {wall:plnMix3(c(q.wall),plnHex("#d09660"),.62),roof:c(q.roof),wood:plnMix3(c(q.wood),plnHex("#cc8040"),.88),
    stone:c(q.stone),earth:c(q.earth)};
}
/* пятнистая краска по месту: тон дерева, камня, земли не ровной заливкой */
function plnSetMott(base,amt,f,sd){
  return (a,b,c)=>{const p=Array.isArray(b)?b:c,v=plnNoise(p[0]*f+sd*.17,p[1]*f+p[2]*f*.8,sd);
    return plnMul(base,1+amt*v);};
}
function plnSetWallTone(base,hp){
  const t=hp.wallTint;return plnMix3(base,t>0?[.6,.47,.29]:[.07,.07,.055],Math.abs(t));
}
function plnSetRoofTone(base,hp){
  const t=hp.roofTint;return plnMix3(base,t>0?[.3,.23,.12]:[.03,.035,.04],Math.abs(t));
}

/* ── человек на месте: стоит, гнётся к грядке, поднял молот; шест — дозорному ── */
function plnSetFig(K,m,c,col,pose,sd){
  const MAN=PLN_MAT.man,skin=[.42,.3,.22],cl=plnMix3(col,[.05,.05,.06],.3),r=rng(sd);
  const [x,y,z]=c,s=.94+r()*.12,bend=pose==="bend"?.55:0;
  for(const d of [-1,1])K.rod([x+d*.1,y+.02,z],[x+d*.1,y+.88*s,z+bend*.1],.075,cl,{sides:6});
  const hip=[x,y+.9*s,z],sh=[x,y+(1.42-bend*.3)*s,z-bend*.45];
  plnBlob(m,{c:[(hip[0]+sh[0])/2,(hip[1]+sh[1])/2+.02,(hip[2]+sh[2])/2],r:[.2*s,.33*s,.13*s],sub:2,box:.7,pitch:bend*.9,col,mat:MAN});
  plnBlob(m,{c:[sh[0],sh[1]+.2*s,sh[2]-.03],r:[.11,.13,.11],sub:2,col:skin,mat:MAN});
  plnBlob(m,{c:[sh[0],sh[1]+.29*s,sh[2]-.02],r:[.13,.06,.13],sub:1,col:cl,mat:MAN});   /* шапка */
  const arm=(d,e)=>K.rod([sh[0]+d*.2,sh[1]-.04,sh[2]],e,.055,col,{sides:5});
  if(pose==="raise"){arm(1,[sh[0]+.28,sh[1]+.42,sh[2]-.12]);arm(-1,[sh[0]-.2,sh[1]-.45,sh[2]-.25]);
    K.rod([sh[0]+.28,sh[1]+.38,sh[2]-.12],[sh[0]+.3,sh[1]+.75,sh[2]+.1],.03,plnMix3(skin,[.1,.08,.06],.5),{sides:4});
    K.box([sh[0]+.31,sh[1]+.8,sh[2]+.12],[.07,.06,.13],[.12,.12,.13],{box:.3});}
  else if(pose==="bend"){arm(1,[sh[0]+.18,sh[1]-.55,sh[2]-.35]);arm(-1,[sh[0]-.16,sh[1]-.5,sh[2]-.3]);}
  else{arm(1,[sh[0]+.26,sh[1]-.62,sh[2]]);arm(-1,[sh[0]-.26,sh[1]-.62,sh[2]]);}
  if(pose==="guard"){K.rod([x+.32,y,z-.05],[x+.32,y+2.3,z-.05],.03,plnMix3(col,[.2,.16,.1],.5),{sides:5});}
}

/* ── изба и сарай ──
   изба: конёк вдоль улицы, скат к объективу, дверь и окно по плану; сарай — торцом к улице, ворота
   в торце; уезд меняет ворота сарая на дверь в четыре метра (door — створка отдельной сеткой) */
function plnSetHouse(K,m,lm,q,hp,M,C,st,sd,o){
  const MAN=PLN_MAT.man,barn=q.kind==="barn",fx=hp.flip?1:-1;
  const w=q.w,d=barn?w*1.05:Math.max(3.2,w*.8),h=q.h,wh=Math.max(2.1,h*hp.wallH),rise=Math.max(1.1,h-wh);
  const cx=q.x,cz=q.z,y0=q.y,fz=cz-d/2;
  const wall=plnSetWallTone(C.wall,hp),wood=plnMix3(C.wood,[0,0,0],hp.age),roof=plnSetRoofTone(C.roof,hp);
  const wk=M.wall,rk=M.roof,stone=plnSetMott(C.stone,.22,1.4,sd+1);
  /* цоколь из камня: без него стена обрывалась о землю */
  K.box([cx,y0+.12,cz],[w/2+.14,.2,d/2+.14],stone,{box:.25});
  /* стена: сердцевина и то, из чего она сложена */
  const core=wk==="log"?plnMix3(wood,[0,0,0],.12):wall;
  K.box([cx,y0+wh/2+.1,cz],[w/2-(wk==="log"?.06:0),wh/2,d/2-(wk==="log"?.06:0)],plnSetMott(core,.12,.9,sd+2),{box:wk==="adobe"?.32:.14});
  if(wk==="log"){
    const lw=plnSetMott(plnMix3(wood,wall,.25),.2,2.2,sd+3),n=Math.floor((wh-.1)/.27);
    for(let i=0;i<n;i++){const y=y0+.3+i*.27,e=.28;
      K.rod([cx-w/2-e,y,fz],[cx+w/2+e,y,fz],.14,lw,{sides:7});
      K.rod([cx-w/2-e,y,fz+d],[cx+w/2+e,y,fz+d],.14,lw,{sides:7});
      for(const s of [-1,1])K.rod([cx+s*w/2,y+.135,fz-e],[cx+s*w/2,y+.135,fz+d+e],.14,lw,{sides:7});}
  }else if(wk==="plank"){
    for(let x=cx-w/2+.25;x<cx+w/2;x+=.5)K.rod([x,y0+.3,fz-.04],[x,y0+wh+.05,fz-.04],.035,plnMix3(wood,[0,0,0],.3),{sides:4,flat:.4});
  }else if(wk==="stone"){
    const r=rng(sd+7);
    for(const s of [-1,1])for(let y=y0+.45,i=0;y<y0+wh;y+=.42,i++){
      plnBlob(m,{c:[cx+s*(w/2-(i&1?.15:.25)),y,fz+.05],r:[i&1?.36:.24,.18,.24],sub:2,box:.4,bump:.1,seed:sd+i*3+(s>0?50:0),col:plnMul(C.stone,.9+r()*.25),mat:MAN});}
    for(let i=0;i<6;i++)plnBlob(m,{c:[cx+(r()-.5)*w*.8,y0+.5+r()*(wh-.8),fz-.02],r:[.22+r()*.15,.12+r()*.06,.06],sub:1,box:.5,col:plnMul(C.stone,.8+r()*.3),mat:MAN});
  }else if(wk==="adobe"){
    /* балки кровли наружу — саман узнают по ним */
    for(let x=cx-w/2+.4;x<cx+w/2-.2;x+=.7)K.rod([x,y0+wh-.15,fz+.3],[x,y0+wh-.15,fz-.35],.07,plnMix3(wood,[0,0,0],.2),{sides:5});
  }else if(wk==="plate"){
    for(let x=cx-w/2+.3;x<cx+w/2;x+=.6)K.rod([x,y0+.3,fz-.03],[x,y0+wh,fz-.03],.03,plnMix3(wall,[0,0,0],.35),{sides:4});
  }
  /* кровля: два ската толщиной — плиты, повёрнутые по уклону; торцы — фронтоны */
  const th=rk==="thatch"?.34:rk==="plate"?.08:.15,ov=rk==="thatch"?.5:.35;
  const rcol=rk==="thatch"?plnSetMott(plnMix3(roof,[.42,.33,.16],.45),.28,3,sd+11):plnSetMott(roof,.15,1.2,sd+11);
  const top=y0+wh+.1;
  if(!barn){
    const a=Math.atan2(rise,d/2),run=d/2+ov,L2=run/Math.cos(a)+.12,sn=Math.sin(a),cs=Math.cos(a);
    for(const s of [-1,1]){const yc=top+rise-(run/2)*Math.tan(a);
      K.box([cx,yc+cs*th/2,cz+s*(run/2+sn*th/2)],[w/2+ov*.7,th/2,L2/2],rcol,{box:.18,pitch:s*a,seed:sd+12+s});
      if(rk==="tile")for(let k=1;k<6;k++){const t=k/6,zz=cz+s*run*t,yy=top+rise-run*t*Math.tan(a)+th*.55;
        K.rod([cx-w/2-ov*.6,yy,zz],[cx+w/2+ov*.6,yy,zz],.055,plnMix3(roof,[0,0,0],.25),{sides:5});}
      if(rk==="plank"||rk==="plate")for(let x=cx-w/2;x<=cx+w/2+.01;x+=rk==="plate"?.35:.6){const z1=cz+s*run,y1=top+rise-run*Math.tan(a)+th*.6;
        K.rod([x,top+rise+th*.6,cz],[x,y1,z1],.025,plnMix3(roof,[0,0,0],.3),{sides:4,cap:false});}
    }
    /* фронтоны и конёк */
    for(const s of [-1,1]){const x=cx+s*(w/2+.02),n=[s,0,0];
      plnCard(m,[x,top,fz],[x,top,fz+d],[x,top+rise,cz],[x,top+rise,cz],n,plnMix3(wk==="log"?wood:wall,[0,0,0],.12),MAN,null,0,0);}
    K.rod([cx-w/2-ov*.7,top+rise+th*.55,cz],[cx+w/2+ov*.7,top+rise+th*.55,cz],rk==="thatch"?.13:.07,plnMix3(roof,[0,0,0],.35),{sides:6});
  }else{
    const a=Math.atan2(rise,w/2),run=w/2+ov,L2=run/Math.cos(a)+.12;
    for(const s of [-1,1])K.box([cx+s*run/2,top+rise-(run/2)*Math.tan(a)+Math.cos(a)*th/2,cz],[L2/2,th/2,d/2+ov*.7],rcol,{box:.18,lean:-s*a,seed:sd+14+s});
    for(const zz of [fz-.02,fz+d+.02])plnCard(m,[cx-w/2,top,zz],[cx-w/2+.001,top,zz],[cx,top+rise,zz],[cx+w/2,top,zz],[0,0,zz<cz?-1:1],plnMix3(wk==="log"?wood:wall,[0,0,0],.1),MAN,null,0,0);
  }
  /* дверь, окна, крыльцо, сенцы, поленница, труба */
  const win=(x,y,ww,hh)=>{
    K.box([x,y,fz-.05],[ww+.07,hh+.07,.04],plnMix3(wood,[0,0,0],.35),{box:.2});
    if(st.shut===2){K.box([x,y,fz-.1],[ww+.12,hh+.1,.03],plnMix3(wood,[0,0,0],.15),{box:.2});
      K.rod([x-ww-.12,y,fz-.14],[x+ww+.12,y,fz-.14],.03,plnMix3(wood,[.6,.5,.4],.3),{sides:4});return;}
    K.glass([x,y,fz-.09],ww,hh,SET_WIN,1.15);
    /* отсвет окна на земле перед домом — карточка свечения, ночью (запись 4); не лампа: бюджет ламп 91qe */
    const sp=SET_SPILL;if(sp){const g=y0+.09,z0=fz-.12,z1=fz-3,a=ww*1.3,b=ww*3.2;
      plnCard(sp,[x-a,g,z0],[x+a,g,z0],[x+b,g,z1],[x-b,g,z1],[0,1,0],SET_WIN,PLN_MAT.glow,null,.7,1);}
    if(st.shut===1)for(const s of [-1,1])K.box([x+s*(ww*1.5+.08),y,fz-.1],[ww*.5,hh+.06,.025],plnMix3(wood,[0,0,0],.12),{box:.2});
  };
  if(barn&&o.county){
    /* дверь в четыре метра: косяки и перемычка — камень, в проёме глубина, створка — сеткой door */
    const H4=4,Wd=2.6,jw=.5,sc=plnSetMott(plnMix3(C.stone,[.5,.5,.48],.3),.2,1.1,sd+31);
    K.box([cx-Wd/2-jw/2,y0+H4/2+.1,fz-.08],[jw/2,H4/2+.1,.3],sc,{box:.2});
    K.box([cx+Wd/2+jw/2,y0+H4/2+.1,fz-.08],[jw/2,H4/2+.1,.3],sc,{box:.2});
    K.box([cx,y0+H4+.45,fz-.1],[Wd/2+jw+.15,.3,.34],sc,{box:.2});
    K.box([cx,y0+H4/2+.1,fz+.12],[Wd/2,H4/2,.05],st.lit?[.32,.18,.08]:[.012,.012,.015],{box:.1});
    if(st.lit){K.pane(null,[cx,y0+H4*.35,fz+.06],Wd/2,H4*.35,[1,.78,.5],1.1);
      for(let i=0;i<3;i++)win(cx-Wd/2-jw-.9-i*1.3,y0+wh*.62,.3,.3);}
    o.door={w:Wd,m:plnMesh(1<<10)};
    const dm=o.door.m,dw=plnSetMott(plnMix3(C.wood,[.33,.29,.24],.4),.18,1.6,sd+33);
    plnBlob(dm,{c:[cx,y0+H4/2+.1,fz-.02],r:[Wd/2,H4/2,.08],sub:2,box:.15,col:dw,mat:MAN});
    for(const t of [.22,.74])plnBlob(dm,{c:[cx,y0+.1+H4*(1-t),fz-.11],r:[Wd/2,.06,.025],sub:1,box:.2,col:[.12,.13,.14],mat:MAN});
    for(let x=cx-Wd/2+.4;x<cx+Wd/2;x+=.45)plnBlob(dm,{c:[x,y0+H4/2+.1,fz-.1],r:[.012,H4/2,.012],sub:1,box:.3,col:plnMul(C.wood,.5),mat:MAN});
    o.wall={x:cx,y:y0+wh*.6,z:fz,w,flip:hp.flip};
    if(st.lift){const lx=cx+w/2+1.4,ly=y0+H4+1.4;
      for(const s of [-1,1])K.rod([lx+s*1.3,y0,fz-.4],[lx+s*1.3,ly+.4,fz-.4],.05,[.4,.42,.44],{sides:5});
      K.box([lx,ly,fz-.4],[1.4,.12,.55],[.11,.12,.14],{box:.2});
      for(let i=0;i<4;i++)K.box([lx-1.05+i*.7,ly+.2,fz-.45],[.26,.07,.35],[.62,.55,.4],{box:.3});}
    return;
  }
  if(barn){
    const gw=w*.42,gh=Math.min(wh*.8,h*.6);
    K.box([cx,y0+gh/2+.1,fz-.06],[gw/2,gh/2,.05],plnMix3(wood,[0,0,0],.3),{box:.12});
    K.rod([cx,y0+.1,fz-.12],[cx,y0+gh+.1,fz-.12],.03,plnMix3(wood,[0,0,0],.5),{sides:4});
    for(const s of [-1,1])K.rod([cx+s*gw*.48,y0+.15,fz-.12],[cx+s*.08,y0+gh,fz-.12],.04,plnMix3(wood,[.5,.4,.3],.2),{sides:4});
    plnBlob(m,{c:[cx+fx*gw*.7,y0+.2,fz-.5],r:[.55,.35,.45],sub:2,bump:.35,seed:sd+40,col:plnSetMott([.5,.42,.2],.3,4,sd+41),mat:PLN_MAT.grass});
    K.rod([cx-fx*(gw*.62),y0+.05,fz-.25],[cx-fx*(gw*.62+.15),y0+1.6,fz-.25],.025,wood,{sides:4});
    o.wall={x:cx,y:y0+wh*.55,z:fz,w,flip:hp.flip};
    return;
  }
  const dx=cx-fx*w*.19,dWin=cx+fx*w*.2;
  K.box([dx,y0+1.08,fz-.07],[.49,1.02,.06],plnMix3(wood,[0,0,0],.4),{box:.15});
  K.box([dx,y0+1.03,fz-.1],[.42,.95,.03],plnSetMott(plnMix3(wood,[0,0,0],.1),.2,3,sd+21),{box:.15});
  if(st.shut!==2)K.pane(null,[dx,y0+.1,fz-.13],.38,.03,OWN_WIN.lamp,1);
  win(dWin,y0+wh*.6,.48,.4);
  if(hp.variant===3)win(dx-fx*1.35,y0+wh*.6,.36,.34);
  if(hp.variant===1){
    K.box([dx,y0+.12,fz-.75],[.85,.1,.62],plnMix3(wood,[0,0,0],.2),{box:.2});
    for(const s of [-1,1])K.rod([dx+s*.78,y0+.2,fz-1.25],[dx+s*.78,y0+2.35,fz-1.25],.05,wood,{sides:5});
    K.box([dx,y0+2.42,fz-.72],[.98,.07,.68],rcol,{box:.2,pitch:-.18});
  }
  if(hp.variant===2){
    const aw=w*.36,ah=wh*.66,ax=cx-fx*(w/2+aw/2-.05);
    K.box([ax,y0+ah/2+.1,cz+.2],[aw/2,ah/2,d*.38],plnSetMott(plnMix3(core,[0,0,0],.12),.12,.9,sd+5),{box:.15});
    K.box([ax,y0+ah+.22,cz+.1],[aw/2+.25,th/2,d*.42],rcol,{box:.3,lean:fx*.3});
  }
  /* поленница у стены: торцами к объективу */
  {const px=cx+hp.pile*(w/2+.55),r=rng(sd+8);
   for(let row=0;row<4;row++)for(let i=0;i<4-(row>>1);i++){const lx=px+(i-1.5+(row&1)*.5)*.22,ly=y0+.12+row*.2;
     const tone=plnMul(C.wood,.6+r()*.25);
     plnTube(m,{path:[[lx,ly,fz+.1],[lx,ly,fz+1.1]],rad:.1,sides:6,cap:true,col:(t)=>t<.05||t>.95?plnMix3(C.wood,[.62,.5,.34],.5):tone,mat:MAN});}}
  /* труба — на скате за коньком: дым отсюда */
  /* стоит на поверхности ската (у крупного дома уезда труба прежнего размера тонула в кровле, и дым шёл
     сквозь скат) и выходит над коньком на полметра; толщина — по дому */
  {const kk=clamp(q.k,.8,2.4),chx=cx+fx*w*.22,chz=cz+.35*kk,ry=top+rise-(chz-cz)*rise/(d/2)+th,y1=top+rise+.55*kk,y0c=ry-.3;
   K.box([chx,(y0c+y1)/2,chz],[.24*kk,(y1-y0c)/2,.24*kk],stone,{box:.25});
   K.box([chx,y1+.05,chz],[.3*kk,.07*kk,.3*kk],plnMul(C.stone,.6),{box:.2});
   o.smoke.push([chx,y1+.2,chz,.75*Math.sqrt(kk)]);}
  o.wall={x:cx,y:y0+wh*.6,z:fz,w,flip:hp.flip,door:dx};
}

/* ── ремёсла: у каждого своё тело (12tc) ── */
function plnSetCraft(K,m,fm,q,C,st,sd,o){
  const MAN=PLN_MAT.man,GLOW=PLN_MAT.glow,cx=q.x,cz=q.z,y0=q.y,w=q.w,h=q.h,r=rng(sd);
  const wood=C.wood,stone=plnSetMott(C.stone,.22,1.4,sd+1),earth=plnSetMott(plnMix3(C.earth,[.08,.06,.04],.35),.25,1.2,sd+2);
  const fire=(c,rr,g)=>{plnBlob(fm,{c,r:rr,sub:2,bump:.3,seed:sd+9,col:[1,.55,.2],mat:GLOW,glow:g||2.2,x:1});};
  const cloth=plnMix3(C.wood,[.25,.22,.2],.5);
  if(q.kind==="field"){
    for(let i=0;i<4;i++){const z=cz-1.4+i*.85;
      plnBlob(m,{c:[cx,y0+.05,z],r:[w/2,.18,.28],sub:2,box:.6,bump:.12,seed:sd+i,col:earth,mat:PLN_MAT.rock});
      for(let x=cx-w/2+.3;x<cx+w/2-.2;x+=.45+r()*.2)plnBlob(m,{c:[x,y0+.28+r()*.08,z],r:[.16,.2+r()*.12,.16],sub:1,bump:.4,seed:sd+i*31+Math.round(x*7),col:plnMix3(PLN_PAL.grassMid,PLN_PAL.dry,r()*.4),mat:PLN_MAT.leaf,wind:.3});}
    /* пугало */
    const px=cx+(q.flip?-1:1)*w*.3,pz=cz+.2;
    K.rod([px,y0,pz],[px,y0+2.1,pz],.045,wood,{sides:5});
    K.rod([px-.65,y0+1.6,pz],[px+.65,y0+1.6,pz],.035,wood,{sides:5});
    plnBlob(m,{c:[px,y0+2.12,pz],r:[.17,.19,.17],sub:2,bump:.3,seed:sd+50,col:[.52,.43,.22],mat:PLN_MAT.grass});
    plnCard(m,[px-.45,y0+1.62,pz-.05],[px-.4,y0+.9,pz-.05],[px+.38,y0+.95,pz-.05],[px+.45,y0+1.62,pz-.05],[0,0,-1],cloth,PLN_MAT.leaf,[0,1,1,0],0,0);
    plnSetFig(K,m,[cx-(q.flip?-1:1)*w*.15,y0,cz-1.9],plnMix3(cloth,[.3,.25,.15],.3),"bend",sd+60);
    return;
  }
  if(q.kind==="weir"){
    /* насыпь вдоль улицы, за ней вода; щит в проране */
    plnBlob(m,{c:[cx,y0+.15,cz-.9],r:[w/2+.3,.6,.7],sub:3,box:.7,bump:.15,seed:sd,col:earth,mat:PLN_MAT.rock});
    K.box([cx,y0+.42,cz+.6],[w/2-.2,.06,1.1],[.035,.06,.075],{box:.6});
    for(let i=0;i<7;i++)plnBlob(m,{c:[cx-w/2+i*w/6,y0+.55,cz-.35],r:[.25,.16,.2],sub:1,box:.5,seed:sd+i,col:plnMul(C.stone,.8+r()*.3),mat:MAN});
    const gx=cx+(q.flip?-1:1)*w*.18;
    for(const s of [-1,1])K.rod([gx+s*.45,y0-.1,cz-1.55],[gx+s*.45,y0+1.25,cz-1.55],.07,wood,{sides:5});
    K.box([gx,y0+.45,cz-1.55],[.42,.45,.05],plnMix3(wood,[0,0,0],.25),{box:.2});
    K.rod([gx-.5,y0+1.2,cz-1.55],[gx+.5,y0+1.2,cz-1.55],.05,wood,{sides:5});
    return;
  }
  if(q.kind==="kiln"){
    const kr=Math.max(1.1,w*.42),kh=Math.max(1.4,h*.85),sk=plnSetMott(plnMix3(C.stone,C.earth,.4),.2,1.6,sd+3);
    plnBlob(m,{c:[cx,y0,cz],r:[kr,kh,kr*.9],sub:3,bump:.05,seed:sd+4,cut:0,col:sk,mat:MAN});
    K.box([cx,y0+.42,cz-kr*.86],[.38,.42,.12],[.015,.012,.01],{box:.5});
    K.box([cx,y0+.92,cz-kr*.9],[.52,.08,.14],plnMul(C.stone,.65),{box:.3});
    fire([cx,y0+.3,cz-kr*.8],[.28,.22,.08],2.4);
    K.rod([cx+kr*.3,y0+kh*.8,cz+.2],[cx+kr*.3,y0+kh+.45,cz+.2],.16,plnMul(C.stone,.7),{sides:7});
    o.smoke.push([cx+kr*.3,y0+kh+.5,cz+.2,.8]);o.fire.push([cx,y0+.4,cz-kr-.4]);
    for(let i=0;i<3;i++)for(let j=0;j<3-i;j++)K.box([cx+kr+.5+j*.32+i*.16,y0+.1+i*.16,cz-.6],[.14,.07,.3],plnMix3(C.earth,[.55,.25,.15],.4),{box:.3});
    return;
  }
  if(q.kind==="cut"){
    for(const s of [-1,1]){const tx=cx+s*w*.22;
      for(const d of [-1,1])K.rod([tx+d*.35,y0,cz-.4],[tx,y0+.95,cz-.4],.04,wood,{sides:4});
      K.rod([tx-.1,y0+.95,cz-.4],[tx+.1,y0+.95,cz-.4],.05,wood,{sides:4});}
    K.box([cx,y0+1.02,cz-.4],[w*.3,.07,.5],plnMix3(C.stone,[.9,.9,.88],.25),{box:.15});
    for(let i=0;i<5;i++)K.box([cx+(q.flip?-1:1)*(w*.45)+(r()-.5)*.08,y0+.09+i*.15,cz+.6],[.55,.07,.4],plnMul(C.stone,.85+r()*.25),{box:.15});
    plnBlob(m,{c:[cx-(q.flip?-1:1)*w*.42,y0+.3,cz+.4],r:[.42,.32,.35],sub:2,box:.4,bump:.12,seed:sd+5,col:stone,mat:MAN});
    plnSetFig(K,m,[cx+(q.flip?1:-1)*.3,y0,cz-1.2],plnMix3(cloth,[.4,.4,.42],.4),"bend",sd+61);
    return;
  }
  if(q.kind==="forge"){
    /* навес на четырёх столбах, горн с огнём, наковальня, бочка; кузнец с молотом */
    const hw=w*.45,hd=1.5,ph=Math.max(2.3,h*.85);
    for(const sx of [-1,1])for(const sz of [-1,1])K.rod([cx+sx*hw,y0,cz+sz*hd],[cx+sx*hw,y0+ph,cz+sz*hd],.07,wood,{sides:5});
    K.box([cx,y0+ph+.12,cz+.1],[hw+.4,.1,hd+.45],plnSetMott(C.roof,.15,1.2,sd+6),{box:.2,pitch:.12});
    const hx=cx+(q.flip?1:-1)*hw*.5;
    K.box([hx,y0+.45,cz+.5],[.55,.45,.5],stone,{box:.3});
    fire([hx,y0+.95,cz+.45],[.32,.16,.3],2.6);
    K.rod([hx,y0+1.4,cz+.6],[hx,y0+ph+1.1,cz+.6],.17,plnMul(C.stone,.6),{sides:7});
    o.smoke.push([hx,y0+ph+1.15,cz+.6,.9]);o.fire.push([hx,y0+1.2,cz-.5]);
    const ax=cx-(q.flip?1:-1)*hw*.3,steelD=[.06,.065,.07];
    K.box([ax,y0+.35,cz-.3],[.16,.35,.16],plnMix3(wood,[0,0,0],.3),{box:.3});
    K.box([ax,y0+.75,cz-.3],[.3,.08,.11],steelD,{box:.25});
    plnBlob(m,{c:[ax+.38,y0+.77,cz-.3],r:[.14,.05,.06],sub:1,col:steelD,mat:MAN});
    plnBlob(m,{c:[ax+(q.flip?-1:1)*.8,y0+.38,cz+.2],r:[.28,.38,.28],sub:2,box:.7,col:plnMul(C.wood,.7),mat:MAN});
    plnSetFig(K,m,[ax-(q.flip?1:-1)*.65,y0,cz-.7],[.2,.16,.13],"raise",sd+62);
    return;
  }
  if(q.kind==="still"){
    const copper=plnSetMott([.42,.2,.09],.15,2,sd+7);
    plnBlob(m,{c:[cx-w*.15,y0+1.05,cz],r:[.62,.95,.62],sub:3,box:.7,col:copper,mat:MAN});
    K.box([cx-w*.15,y0+.18,cz],[.7,.18,.7],stone,{box:.3});
    fire([cx-w*.15,y0+.22,cz-.55],[.3,.12,.1],2.2);o.fire.push([cx-w*.15,y0+.4,cz-1.1]);
    const path=[];for(let k=0;k<=36;k++){const a=k/36*TAU*3;path.push([cx+w*.25+Math.cos(a)*.32,y0+1.5-k*.03,cz+Math.sin(a)*.32]);}
    plnTube(m,{path:[[cx-w*.15,y0+2,cz],[cx+w*.05,y0+2.05,cz],[cx+w*.25+.32,y0+1.55,cz]],rad:.04,sides:5,col:copper,mat:MAN});
    plnTube(m,{path,rad:.035,sides:5,col:copper,mat:MAN});
    for(let i=0;i<3;i++){const bx=cx+w*.35-i*.62,bz=cz-1.1;
      plnBlob(m,{c:[bx,y0+.42,bz],r:[.27,.42,.27],sub:2,box:.75,col:plnMul(C.wood,.75),mat:MAN});
      for(const t of [.15,.7])plnTube(m,{path:plnBez([bx+.28,y0+t,bz],[bx,y0+t,bz-.3],[bx-.28,y0+t,bz],6),rad:.015,sides:3,col:[.1,.1,.11],mat:MAN});}
    o.smoke.push([cx-w*.15,y0+2.1,cz,.5]);
    return;
  }
}

/* ── сборка посёлка: раз на план и состояние ── */
function plnSetMesh(L,A,sd,st,p){
  const C=plnSetPal(p),M=sdMat(p),m=plnMesh(1<<15),lm=plnMesh(1<<11),fm=plnMesh(1<<11),gm=plnMesh(1<<10),K=plnOwnKit(m,lm),MAN=PLN_MAT.man;
  SET_SPILL=gm;
  const Y=A.Y,hw=Y.span/2,V=SET_V,P=A.P,o={smoke:[],fire:[],door:null,walls:[]};
  const earth=plnSetMott(plnMix3(C.earth,PLN_PAL.soil,.3),.2,.5,sd+1),stone=plnSetMott(C.stone,.25,1.3,sd+2);
  /* полка — сама земля мира, срезанная ровно (plnOwnFlat): плита утоптанной земли поверх читалась плоской
     рыжей лужей с резким краем. По переднему краю — низкая сухая кладка: камни разного размера, местами
     в два ряда, с прорехами */
  {const r=rng(sd+5);let x=-hw-4;
   while(x<hw+4){const L2=.3+r()*.35;
     if(Math.abs(x)>1.8&&r()>.06){plnBlob(m,{c:[x+L2,.05+r()*.06,V.fence-.7+(r()-.5)*.2],r:[L2,.2+r()*.12,.26+r()*.08],sub:1,box:.5,bump:.15,seed:sd+Math.round(x*13),col:plnMul(C.stone,.9+r()*.3),mat:MAN,yaw:(r()-.5)*.3});
       if(r()<.35)plnBlob(m,{c:[x+L2*.8,.42,V.fence-.65],r:[L2*.6,.15,.2],sub:1,box:.5,bump:.15,seed:sd+Math.round(x*17),col:plnMul(C.stone,.85+r()*.3),mat:MAN});}
     x+=L2*2+.04;}}
  /* ступень заднего ряда: земля на 0.9 м с каменной стенкой */
  const backs=Y.yards.filter(q=>q.back);
  if(backs.length){
    const bx0=Math.min(...backs.map(q=>q.x-q.w/2))-1.2,bx1=Math.max(...backs.map(q=>q.x+q.w/2))+1.2,bz=V.back-2.4;
    plnBlob(m,{c:[(bx0+bx1)/2,V.lift-.3,V.back+1.2],r:[(bx1-bx0)/2+.6,.32,3.8],sub:3,box:.45,seed:sd+6,col:plnSetMott(plnMix3(C.earth,C.stone,.5),.2,.6,sd+6),mat:PLN_MAT.rock,bump:.08});
    const r=rng(sd+7);
    for(let x=bx0;x<bx1;x+=.55+r()*.2)for(let k=0;k<2;k++)
      plnBlob(m,{c:[x+(k?.27:0),.22+k*.38,bz+k*.05],r:[.3+r()*.08,.2,.22],sub:1,box:.45,bump:.1,seed:sd+Math.round(x*11)+k,col:plnMul(C.stone,.75+r()*.3),mat:MAN});
  }
  /* дворы */
  let marked=false;
  Y.yards.forEach((q,i)=>{
    const s2=hashi(P.seed|0,Math.round(q.wx),0x5E8+i);
    if(q.kind==="dwell"||q.kind==="barn"){
      const hp=housePlan(P.seed+Math.round(q.wx),null,{barn:q.kind==="barn"});
      const county=st.core&&q.kind==="barn"&&!o.door,oo={smoke:[],county,door:null,wall:null};
      /* дом строится в начале координат и ставится с поворотом до ±14°: строго в лоб скат читался
         подушкой, а с поворотом видно и скат, и фронтон. Дверь уезда — без поворота: створка едет вдоль стены */
      const hm=plnMesh(1<<13),hl=plnMesh(1<<9),hk=plnOwnKit(hm,hl),yaw=county?0:(q.r-.5)*(q.back?.3:.5)*(q.flip?-1:1);
      plnSetHouse(hk,hm,hl,Object.assign({},q,{x:0,z:0}),hp,M,C,st,s2,oo);
      if(!q.back&&!marked&&oo.wall&&st.H){marked=true;plnSetMark(hk,hm,oo.wall,st.H,C);}
      plnMeshAdd(m,hm,[q.x,0,q.z],yaw,1);plnMeshAdd(lm,hl,[q.x,0,q.z],yaw,1);
      const c=Math.cos(yaw),sn=Math.sin(yaw);
      for(const v of oo.smoke)o.smoke.push([v[0]*c+v[2]*sn+q.x,v[1],-v[0]*sn+v[2]*c+q.z,v[3]]);
      if(oo.door){const dm=plnMesh(1<<10);plnMeshAdd(dm,oo.door.m,[q.x,0,q.z],0,1);o.door={w:oo.door.w,m:dm};}
    }else plnSetCraft(K,m,fm,q,C,st,s2,o);
  });
  /* очаг посреди улицы: кольцо камней, поленья, огонь — когда сыты */
  {const z=V.street,r=rng(sd+9);
   for(let i=0;i<9;i++){const a=i/9*TAU;plnBlob(m,{c:[Math.cos(a)*.62,.08,z+Math.sin(a)*.5],r:[.2,.15,.17],sub:1,box:.5,bump:.15,seed:sd+70+i,col:plnMul(C.stone,.7+r()*.3),mat:MAN});}
   for(let i=0;i<3;i++){const a=i/3*TAU+.4;K.rod([Math.cos(a)*.42,.08,z+Math.sin(a)*.34],[Math.cos(a)*.05,.3,z+Math.sin(a)*.04],.06,plnMul(C.wood,.45),{sides:5});}
   if(st.warm){plnBlob(fm,{c:[0,.42,z],r:[.24,.36,.22],sub:2,bump:.35,seed:sd+80,col:[1,.5,.18],mat:PLN_MAT.glow,glow:2.6,x:1});
     o.smoke.push([0,1.2,z,1.1,10]);}
   else plnBlob(m,{c:[0,.1,z],r:[.32,.06,.27],sub:1,bump:.2,seed:sd+81,col:[.1,.095,.09],mat:MAN});}
  /* плетень по переднему краю полки, с проходом к очагу */
  {const z=V.fence,wood=plnMix3(C.wood,[0,0,0],.15);let prev=null;
   for(let x=-hw-2.5;x<=hw+2.5;x+=1.7){
     if(Math.abs(x)<2.2){prev=null;continue;}
     K.rod([x,-.1,z],[x,1.05,z],.05,wood,{sides:5});
     if(prev!=null)for(const h of [.42,.82])K.rod([prev,h,z],[x,h+.03,z],.03,plnMix3(wood,[.4,.34,.25],.15),{sides:4,cap:false});
     prev=x;}}
  /* дозорные у краёв улицы — со второй ступени, если днём здесь вообще кто-то стоит */
  if(st.guard)for(const s of [-1,1])plnSetFig(K,m,[s*(hw+1.9),0,V.street+.3],[.12,.13,.15],"guard",sd+90+s);
  /* мачта с вымпелом дома — выше любой крыши */
  {const px=hw+3,pz=V.street+1.2,ph=8;
   K.rod([px,-.2,pz],[px,ph,pz],.08,plnMix3(C.wood,[.16,.14,.1],.3),{sides:6});
   const col=st.H?plnRgb(houseRGB(st.H)):plnRgb([226,120,70]),fy=ph-.6;
   plnCard(m,[px,fy-.45,pz],[px,fy+.45,pz],[px+1.7,fy+.28,pz],[px+1.7,fy-.2,pz],[0,0,-1],col,PLN_MAT.leaf,[0,0,1,1],0,0);
   plnCard(m,[px+1.7,fy-.2,pz],[px+1.7,fy+.28,pz],[px,fy+.45,pz],[px,fy-.45,pz],[0,0,1],col,PLN_MAT.leaf,[1,1,0,0],0,0);}
  /* мачта под рукой (M198): у начала улицы, вымпел маленький и ровный — метка, не праздник */
  if(st.mine){const px=-hw-1.6,pz=V.street+.4,ph=4.5,col=plnMix3(C.roof,[.65,.47,.2],.5);
    K.rod([px,-.2,pz],[px,ph,pz],.06,plnMix3(C.wood,[.16,.14,.1],.25),{sides:6});
    plnCard(m,[px,ph-.8,pz],[px,ph-.05,pz],[px+1.5,ph-.3,pz],[px+1.5,ph-.55,pz],[0,0,-1],col,PLN_MAT.leaf,[0,0,.4,.4],0,0);
    plnCard(m,[px+1.5,ph-.55,pz],[px+1.5,ph-.3,pz],[px,ph-.05,pz],[px,ph-.8,pz],[0,0,1],col,PLN_MAT.leaf,[.4,.4,0,0],0,0);}
  const blots=Y.yards.map(q=>[q.x,q.z,q.w*.62,.35]);
  SET_SPILL=null;
  return {body:m,light:lm,fire:fm,spill:gm,door:o.door,smoke:o.smoke,fires:o.fire,blots,hw,lampAt:st.warm?{hearth:[0,1,V.street]}:{}};
}
/* знак дома — доска у двери первого жилого двора переднего ряда (17d, M326): снаружи от двери,
   на уровне головы; краска выцвела, но цвет дома цел */
function plnSetMark(K,m,W,H,C){
  const dx=W.door!=null?W.door:W.x,side=W.flip?1:-1,px=dx+side*(.49+.45),py=W.y,z=W.z-.08;
  const ink=plnMix3(plnRgb(houseRGB(H)),[.03,.035,.04],.22),s=.13;
  K.box([px,py,z],[.2,.24,.03],plnMix3(C.wood,[0,0,0],.28),{box:.2});
  const zz=z-.05;
  if(H.id==="lask")for(const d of [-1,1])plnBlob(m,{c:[px+d*s*.55,py,zz],r:[s*.5,s*.5,.015],sub:1,col:ink,mat:PLN_MAT.man});
  else if(H.id==="kova")plnCard(m,[px-s,py+s*.6,zz],[px+s,py+s*.6,zz],[px+s*.6,py-s*.6,zz],[px-s*.6,py-s*.6,zz],[0,0,-1],ink,PLN_MAT.man,null,0,0);
  else if(H.id==="vest"){K.rod([px,py-s,zz],[px,py+s*.4,zz],.018,ink,{sides:4});
    plnTube(m,{path:plnBez([px-s*.65,py+s*.15,zz],[px,py+s*1.05,zz],[px+s*.65,py+s*.15,zz],8),rad:.018,sides:4,col:ink,mat:PLN_MAT.man});}
  else if(H.id==="kryl")plnCard(m,[px-s,py,zz],[px,py+s*.5,zz],[px+s,py,zz],[px,py-s*.2,zz],[0,0,-1],ink,PLN_MAT.man,null,0,0);
}

/* дым труб записями: s = [x, y, z, сила, клубов] от места pos; зовёт и Жестянка (21piia).
   Тонкая струя, не столб облаков: клуб мал у трубы, растёт и редеет кверху — запись-вуаль (режим 3)
   несёт долю непрозрачности, проход вуали (21pe) смешивает её с тем, что за дымом (у трубы ≈ .4, верхний клуб ≤ .2).
   Клубы идут неровно: у каждого своя скорость, сдвиг и рост — ровная цепочка шаров читалась бусами.
   Ночью у трубы дым подсвечен очагом (тёплый, светлее неба), выше почти невидим */
function plnSetSmoke(F,sa,inst,smoke,pos,t,nk){
  const wd=WIND||0,cap=sa.length>>4;let n=0;
  for(let j=0;j<smoke.length;j++){const s=smoke[j];
    for(let i=0,ni=Math.round((s[4]||7)*2.6);i<ni&&n<cap;i++){const u=plnHash(i,j,71),v=plnHash(i,j,72),w2=plnHash(i,j,73);
      const ph=(t*.055*(.8+.4*u)/(.6+s[3]*.4)+v)%1,hh=ph*5.6*s[3];
      const sc=s[3]*(.24+ph*1.3)*(.8+.4*w2)*plnSmooth(0,.06,ph);
      const al=(.42-.1*w2)*Math.pow(1-ph,1.5)*(1-.4*nk),lo=nk*(1-plnSmooth(0,.3,ph));
      const g=.86*(1-.75*nk)+.1*w2,c=[g+lo*.5,g+lo*.26,g+lo*.08];
      plnRec(sa,n++,[pos[0]+s[0]+wd*hh*.8+(u-.5)*.22*ph*s[3],pos[1]+s[1]+hh,pos[2]+s[2]+ph*.5+(w2-.5)*.25],Math.max(.002,sc),i*1.7+j,1,0,c,3,[al,0,0]);}}
  plnInstSet(inst,sa,n);
  if(n)F.batches.push({geo:plnSetPuff(),inst,first:0,count:n,kind:PLN_KIND.veil,to:PLN_TO.main});
}
/* клуб дыма: одна сетка на все трубы, записи несут место, рост и тон */
function plnSetPuff(){
  if(SET.puff&&SET.puff.gen===PLN_GPU.gen)return SET.puff;
  const C=PLN_MARK_COL,m=plnMesh(256);
  plnBlob(m,{c:[0,0,0],r:[.5,.4,.5],sub:2,bump:.18,seed:5,col:plnMix3([.7,.69,.67],C.warm,.06),mat:PLN_MAT.glow,glow:.85,x:1});
  return (SET.puff=plnGeo(plnMeshDone(m)));
}
function plnSetFree(){
  const it=SET.it;if(!it)return;
  for(const k of ["geo","light","fire","door","spill"])if(it[k])plnGeoFree(it[k]);
  if(it.inst)plnInstFree(it.inst);if(it.sinst)plnInstFree(it.sinst);
  SET.it=null;
}
/* lim — бюджет кадра захода (21pz): посёлок строится последним из своих вещей */
function plnSetStep(L,S){
  if(SET.gen!==PLN_GPU.gen||SET.L!==L){plnSetFree();SET.gen=PLN_GPU.gen;SET.L=L;SET.at=null;}
  const A=plnSetAt(L,S.tr,S.p);
  if(!A){plnSetFree();return true;}
  const st=plnSetState(A.S,S.p),key=A.P.key+"|"+st.key;
  if(SET.it&&SET.it.key===key){SET.it.A=A;return true;}
  plnSetFree();
  const sd=hashi(A.S.seed|0,0x5E7,3),M=plnSetMesh(L,A,sd,st,S.p),g=x=>x&&x.nv?plnGeo(plnMeshDone(x)):null;
  const it={A,key,st,sd,geo:g(M.body),light:g(M.light),fire:g(M.fire),door:M.door?g(M.door.m):null,spill:g(M.spill),doorW:M.door?M.door.w:0,
    smoke:M.smoke,fires:M.fires,blots:M.blots,hw:M.hw,lampAt:M.lampAt,a:new Float32Array(16*5),sa:new Float32Array(16*160),inst:null,sinst:null};
  for(let i=0;i<5;i++)plnRec(it.a,i,[A.x,A.y,A.z],1,0,1,sd%97,i?[1,1,1]:null);
  it.inst=plnInst(it.a,5,5);it.sinst=plnInst(null,0,160);
  SET.it=it;return true;
}
/* в кадр: тела, свет окон, дрожь огня, створка уезда по шуму, дым; лампа очага — в общий выбор своих ламп */
function plnSetFrame(F,S,ex,V,nk,want){
  const it=SET.it;if(!it)return;
  const A=it.A,pos=[A.x,A.y,A.z];
  if(Math.abs(A.x-ex)>V.hw*(1+A.z/V.D)+it.hw+12)return;
  const t=F.t,Bk=PLN_KIND.body,TO=PLN_TO.all,LIT=PLN_TO.lit;
  const warm=.12+.6*nk,fl=.86+.1*Math.sin(t*7.3)+.06*Math.sin(t*13.1+1.7),fk=(.6+.6*nk)*fl;
  plnRec(it.a,1,pos,1,0,1,0,[warm,warm,warm]);
  plnRec(it.a,2,pos,1,0,1,0,[fk,fk,fk]);
  if(it.door){const sf=G.surf,lvl=sf?countyLevel(sf):0,op=lvl>=1?clamp(((sf.noise||0)-COUNTY_LVL[0])/40,0,1):0;
    plnRec(it.a,3,[A.x+op*(it.doorW+.4),A.y,A.z+op*.12],1,0,1,0,null);}
  const sp=clamp((nk-.1)*1.6,0,1)*.9;
  plnRec(it.a,4,pos,1,0,1,0,[sp,sp,sp]);
  plnInstSet(it.inst,it.a,5);
  if(it.geo)F.batches.push({geo:it.geo,inst:it.inst,first:0,count:1,kind:Bk,to:TO});
  if(it.light)F.batches.push({geo:it.light,inst:it.inst,first:1,count:1,kind:Bk,to:LIT});
  if(it.fire)F.batches.push({geo:it.fire,inst:it.inst,first:2,count:1,kind:Bk,to:LIT});
  if(it.door)F.batches.push({geo:it.door,inst:it.inst,first:3,count:1,kind:Bk,to:TO});
  if(it.spill&&sp>0)F.batches.push({geo:it.spill,inst:it.inst,first:4,count:1,kind:Bk,to:PLN_TO.main});
  /* дым — только у сытого посёлка: клубы растут, сносятся ветром и тают в вышине */
  if(it.st.warm&&it.smoke.length)plnSetSmoke(F,it.sa,it.sinst,it.smoke,pos,t,nk);
  if(nk>.05&&it.lampAt.hearth){const h=it.lampAt.hearth;
    want.push({o:.9,l:{p:[A.x+h[0],A.y+h[1],A.z+h[2]],r:9,c:[1,.62,.32],k:2.2*nk*fl}});}
  const b=F.blobs;let n=b[0]|0;
  for(const q of it.blots){if(n>=64)break;b.set([A.x+q[0],A.z+q[1],q[2],q[3]],4+n*4);n++;}
  b[0]=n;
}
