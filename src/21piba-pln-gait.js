/* ══════════════ планета: походка и земные анатомии зверей (M625) ══════════════
   Пять земных силуэтов игры (BEAST_SHAPES: капсула, длинный, грузный, стоячий, членистый)
   были одной капсулой на палках (M611). Здесь у каждого своя анатомия и общий закон ноги:
   бедро → колено → стопа, колено решается по двум звеньям (2-bone IK) в сторону подсказки
   bend — у зверя назад (локоть, скакательный сустав), у ящерицы и насекомого вверх и наружу.
   Шаг: стопа в опоре (duty) идёт по земле назад от +s до −s, в махе — вперёд дугой с
   подъёмом. Четвероногий идёт рысью (диагонали в фазе), шестиногий — треножником, двуногий —
   попеременно, прыгун — скоком (пары в фазе). Книжка хода — шесть кадров круга (21pib).
   Позы сверх хода: стоит, пасётся (голова к земле), злой (присел, голова вперёд, пасть,
   загривок, глаза горят), оглушён (лежит на боку, ноги поджаты). Тело в мерке «радиус = 1»,
   лицом в +x, земля y=0; запись масштабирует (plnBeastR). */
const PLN_GAIT={duty:.6,lift:.22};
const PLN_BEAST_IDS=new WeakMap();let PLN_BEAST_NID=0;
/* номер вида для ключа книжки: по самому объекту вида, а не по его месту в списке планеты —
   стенд подсовывает виды, которых в списке нет */
function plnBeastSpId(sp){
  if(!sp||typeof sp!=="object")return 0;
  let id=PLN_BEAST_IDS.get(sp);
  if(id==null){id=++PLN_BEAST_NID;PLN_BEAST_IDS.set(sp,id);}
  return id;
}
/* стопа по фазе шага u: опора — назад по земле, мах — вперёд дугой. Отдаёт [dx,dy] */
function plnStride(u,s,lift){
  u=((u%1)+1)%1;const d=PLN_GAIT.duty;
  if(u<d){const v=u/d;return [s-2*s*v,0];}
  const v=(u-d)/(1-d),w=v*v*(3-2*v);
  return [-s+2*s*w,lift*Math.sin(Math.PI*v)];
}
/* фаза ноги: i — пара (0 передняя), s — сторона. Рысь и треножник: диагонали в фазе; скок — пары в фазе */
function plnLegPhase(i,s,hop){return hop?(i%2)*.5:(((i+(s>0?1:0))%2)*.5);}
/* нога: бедро H → стопа F двумя звеньями по len/2, колено K в сторону bend. Если стопа дальше
   длины — нога тянется. Отдаёт колено */
function plnLeg(m,H,F,len,bend,r0,r1,col,mat){
  const d=plnSub(F,H),L=Math.max(1e-4,plnLen(d)),l=Math.max(len,L*1.02)/2,dir=plnMul(d,1/L);
  const h=Math.sqrt(Math.max(0,l*l-L*L/4));
  let pp=plnSub(bend,plnMul(dir,plnDot(bend,dir)));
  const pl=plnLen(pp);pp=pl>1e-4?plnMul(pp,1/pl):[0,0,1];
  const K=plnAdd(plnAdd(H,plnMul(dir,L/2)),plnMul(pp,h));
  plnTube(m,{path:[H,K,F],rad:t=>lerp(r0,r1,t),sides:5,col,mat,cap:true});
  return K;
}
/* стопа: плоская подушка вперёд от щиколотки */
function plnFoot(m,F,fw,r,col,mat){
  plnBlob(m,{c:[F[0]+fw*.5,F[1]+r*.45,F[2]],r:[fw,r*.45,r*.8],sub:1,box:.7,col,mat});
}
/* ноги парами: hips — бёдра одной стороны (z>0), зеркалятся. o: u фаза, s полшага, lift, len, bend,
   out (стопа наружу от бедра), r0 r1, foot (длина стопы). Поза: walk — шаг; stand/graze — стопы
   под бедром, одна чуть вперёд; hostile — расставлены; stun — поджаты */
function plnLegs(m,hips,o,col,mat,pose,hop){
  const out=o.out||0;
  hips.forEach((H0,i)=>{
    for(const s of [-1,1]){
      const H=[H0[0],H0[1],s*H0[2]];
      let F;
      if(pose==="walk"){const q=plnStride(o.u+plnLegPhase(i,s,hop),o.s,o.lift);F=[H[0]+q[0],q[1],s*(H0[2]+out)];}
      else if(pose==="stun")F=[H[0]+o.len*.45,H[1]-o.len*.4,s*(H0[2]+out)];
      else{const sp=pose==="hostile"?.25:.08;F=[H[0]+(i%2?-sp:sp)*(s>0?1:.6),0,s*(H0[2]+out+(pose==="hostile"?.12:0))];}
      plnLeg(m,H,F,o.len,o.bend,o.r0,o.r1,col,mat);
      if(o.foot)plnFoot(m,F,o.foot,o.r1*1.6,col,mat);
    }
  });
}
/* оглушён: тело на бок — крен вокруг оси тела, потом вниз до земли */
function plnBeastLay(m,roll){
  plnBeastTilt(m,0,roll==null?1.35:roll,0);
  let lo=1e9;for(let i=0;i<m.nv;i++)lo=Math.min(lo,m.v[i*PLN_VS+1]);
  const dy=.03-lo;for(let i=0;i<m.nv;i++)m.v[i*PLN_VS+1]+=dy;
}
/* пасть злого: нижняя челюсть опущена, два клыка */
function plnBeastJaw(m,P,hx,hy,hz,hs){
  plnBlob(m,{c:[hx+hs*.65,hy-hs*.6,hz],r:[hs*.45,hs*.14,hs*.32],sub:1,box:.7,lean:-.4,col:P.col(.85),mat:P.B});
  for(const s of [-1,1])plnBlob(m,{c:[hx+hs*.95,hy-hs*.42,hz+s*hs*.18],r:[.035,.07,.035],sub:0,col:[.95,.92,.85],mat:P.B});
}

/* ── капсула: коренастый четвероногий (барсук, кабан); прыгун сидит на больших задних ── */
function plnBeastCapsule(m,b,P){
  const {col,skin,B,bx,by,bz,hs,hop,hostile,graze,sw,t2,u}=P;
  const cy=hostile?.82:1.0,lean=hop?.42:(hostile?-.1:-.05);
  const np=Math.max(1,Math.round((b.legs||4)/2)),hipY=cy-by*.4,len=hipY+.06,hips=[];
  for(let i=0;i<np;i++)hips.push([np>1?lerp(bx*.55,-bx*.6,i/(np-1)):-bx*.2,hipY,bz*.45]);
  if(hop){
    plnLegs(m,[[-bx*.35,cy-by*.2,bz*.5]],{u,s:.3,lift:.3,len:cy+.2,bend:[-1,0,0],r0:.17,r1:.08,foot:.3},col(.72),B,P.pose,true);
    for(const s of [-1,1]){
      plnTube(m,{path:[[bx*.55,cy+by*.1,s*bz*.4],[bx*.75,cy-by*.25,s*bz*.45],[bx*.65,cy-by*.5,s*bz*.4]],rad:t=>lerp(.07,.04,t),sides:4,col:col(.72),mat:B,cap:true});
      plnBlob(m,{c:[-bx*.3,cy-by*.1,s*bz*.55],r:[bx*.45,by*.45,bz*.3],sub:1,col:skin(.78,1.0),mat:B});   /* бёдра */
    }
  }else plnLegs(m,hips,{u,s:.28*bx,lift:PLN_GAIT.lift,len,bend:[-1,0,0],r0:.13,r1:.08,foot:.16},col(.72),B,P.pose,false);
  plnBlob(m,{c:[0,cy,0],r:[bx,by*.78,bz*.85],sub:2,box:.84,bump:.12,bumpF:1.8,seed:P.sd,lean,col:skin(.8,1.1),mat:B,glow:P.gl});
  plnBlob(m,{c:[bx*.45,cy+by*.18,0],r:[bx*.5,by*.45,bz*.75],sub:1,box:.85,col:skin(.84,1.08),mat:B});   /* плечи */
  if(b.crest||hostile)for(let i=0;i<4;i++)plnBlob(m,{c:[bx*(.3-i*.28),cy+by*(.85-i*.04),0],r:[.16,hostile?.32:.24,.05],sub:1,box:.55,lean:.3,col:col(1.25),mat:B});
  /* шея и голова: морда вперёд; пасётся — к земле; злой — вперёд и ниже */
  const hx=bx*.9+hs*.5,hy=graze?hs*.75:(hostile?cy-by*.05:cy+by*.42);
  plnTube(m,{path:[[bx*.75,cy+by*.25,0],[lerp(bx*.75,hx,.5),lerp(cy+by*.25,hy,.55),0],[hx-hs*.3,hy,0]],rad:t=>lerp(.3*by,.22*hs+.1,t),sides:6,col:col(.8),mat:B});
  plnBlob(m,{c:[hx,hy,0],r:[hs,hs*.85,hs*.8],sub:2,bump:.06,seed:P.sd+3,col:skin(.8,1.1),mat:B,glow:P.gl});
  plnBlob(m,{c:[hx+hs*.75,hy-hs*.25,0],r:[hs*.5,hs*.38,hs*.42],sub:1,col:col(.95),mat:B});   /* морда */
  plnBlob(m,{c:[hx+hs*1.2,hy-hs*.2,0],r:[hs*.12,hs*.1,hs*.12],sub:0,col:col(.3),mat:B});   /* нос */
  if(hostile)plnBeastJaw(m,P,hx,hy,0,hs);
  if(b.ears)for(const s of [-1,1])plnBlob(m,{c:[hx-hs*.15,hy+hs*.85,s*hs*.5],r:[.1,.3,.14],sub:1,pitch:-s*.45,lean:hostile?-.6:.1,col:col(.8),mat:B});
  P.eyes([hx+hs*.55,hy+hs*.15,0],hs*.2,hs*.6);
  if(b.tail){const wag=sw*Math.sin(t2)*.3;plnTube(m,{path:plnBez([-bx*.95,cy+by*.1,0],[-bx*1.45,cy+by*.6+wag,wag*.4],[-bx*1.75,cy+by*.3,wag],5),rad:t=>lerp(.11,.035,t),sides:5,col:col(.7),mat:B,cap:true});}
}
/* ── длинный: ящерица, ласка — низкое тело трубой, на ходу гнётся в бок, лапы враскоряку, длинный хвост ── */
function plnBeastLong(m,b,P){
  const {col,skin,B,bx,by,bz,hs,hostile,graze,sw,t2,u}=P;
  const cy=hostile?.5:.6,sway=sw*.18,path=[];
  for(let i=0;i<=6;i++){const t=i/6;path.push([lerp(-bx*1.0,bx*1.05,t),cy+by*.05*Math.sin(Math.PI*t),sway*Math.sin(t2+t*3.2)]);}
  plnTube(m,{path,rad:t=>by*.55*(.55+.45*Math.sin(Math.PI*Math.pow(t,.8))),sides:8,
    col:(t,a,p)=>plnMul(P.c,lerp(.8,1.1,plnSmooth(cy-by*.5,cy+by*.5,p[1]))*(b.spots&&plnNoise(p[0]*3+1.3,p[2]*5,P.sd)>.45?1.4:1)),mat:B,glow:P.gl});
  const hipY=cy-by*.15;
  plnLegs(m,[[bx*.6,hipY,bz*.55],[-bx*.55,hipY,bz*.55]],{u,s:.22*bx,lift:.14,len:hipY+.22,bend:[0,1,0],out:.35,r0:.09,r1:.05,foot:.12},col(.6),B,P.pose,false);
  const hx=bx*1.05+hs*.7,hy=graze?hs*.55:(hostile?cy-.05:cy+.12),sz=sway*Math.sin(t2+3.4);
  plnBlob(m,{c:[hx,hy,sz],r:[hs*1.1,hs*.62,hs*.7],sub:2,box:.9,col:skin(.8,1.1),mat:B,glow:P.gl});
  plnBlob(m,{c:[hx+hs*1.05,hy-hs*.1,sz],r:[hs*.12,hs*.08,hs*.14],sub:0,col:col(.3),mat:B});
  if(hostile)plnBlob(m,{c:[hx+hs*.55,hy-hs*.45,sz],r:[hs*.6,hs*.12,hs*.4],sub:1,box:.7,lean:-.35,col:col(.85),mat:B});
  P.eyes([hx+hs*.35,hy+hs*.25,sz],hs*.16,hs*.62);
  if(b.crest)plnBlob(m,{c:[0,cy+by*.5,0],r:[bx*.6,by*.45,.04],sub:1,box:.6,col:col(1.3),mat:B});   /* гребень-парус */
  const tl=b.tail?2.3:1.2,sw2=sway*1.6;
  plnTube(m,{path:plnBez([-bx*.95,cy,sw2*.3],[-bx*(1+tl*.3),cy-.08,sw2*Math.sin(t2+1)],[-bx*(1+tl*.6),cy-.2,sw2*1.5*Math.sin(t2+2)],6),rad:t=>lerp(by*.3,.02,t),sides:5,col:col(.75),mat:B,cap:true});
}
/* ── грузный: медведь, кабан-гора — круглое тело на колоннах, горб плеч, большая низкая голова ── */
function plnBeastStout(m,b,P){
  const {col,skin,B,bx,by,bz,hs,hostile,graze,sw,t2,u}=P;
  const cy=hostile?1.0:1.15,roll=sw*Math.sin(t2)*.06,hipY=cy-by*.35,np=Math.max(2,Math.round((b.legs||4)/2)),hips=[];
  for(let i=0;i<np;i++)hips.push([lerp(bx*.6,-bx*.6,i/(np-1)),hipY,bz*.5]);
  plnLegs(m,hips,{u,s:.18*bx,lift:.12,len:hipY+.05,bend:[-.4,0,0],r0:.2,r1:.15,foot:.22},col(.72),B,P.pose,false);
  plnBlob(m,{c:[0,cy,roll],r:[bx*1.1,by*.95,bz*1.0],sub:2,box:.8,bump:.12,bumpF:1.6,seed:P.sd,col:skin(.8,1.1),mat:B,glow:P.gl});
  plnBlob(m,{c:[bx*.35,cy+by*.4,roll],r:[bx*.55,by*.45,bz*.8],sub:1,box:.8,col:skin(.84,1.08),mat:B});   /* горб плеч */
  if(b.crest||hostile)for(let i=0;i<5;i++)plnBlob(m,{c:[bx*(.5-i*.3),cy+by*(.95-i*.05),roll],r:[.14,hostile?.3:.2,.05],sub:1,box:.55,col:col(1.25),mat:B});
  const hx=bx*1.05+hs*.3,hy=graze?hs*.8:(hostile?cy-by*.3:cy-by*.08),hz=roll*.5;
  plnBlob(m,{c:[hx,hy,hz],r:[hs,hs*.92,hs*.88],sub:2,bump:.06,seed:P.sd+3,col:skin(.78,1.1),mat:B,glow:P.gl});
  plnBlob(m,{c:[hx+hs*.8,hy-hs*.3,hz],r:[hs*.5,hs*.36,hs*.42],sub:1,col:col(.95),mat:B});
  plnBlob(m,{c:[hx+hs*1.25,hy-hs*.25,hz],r:[hs*.13,hs*.1,hs*.13],sub:0,col:col(.3),mat:B});
  if(hostile)plnBeastJaw(m,P,hx,hy,hz,hs);
  if(b.ears)for(const s of [-1,1])plnBlob(m,{c:[hx-hs*.2,hy+hs*.85,s*hs*.55],r:[.12,.16,.1],sub:1,col:col(.8),mat:B});
  P.eyes([hx+hs*.55,hy+hs*.12,hz],hs*.17,hs*.6);
  plnBlob(m,{c:[-bx*1.1,cy+by*.2,0],r:[.2,.14,.12],sub:1,col:col(.7),mat:B});   /* хвост-пуговка */
}
/* ── стоячий: птица, ящер на двух ногах — яйцо тела с наклоном, шея дугой, клюв, хвост-балансир ── */
function plnBeastUpright(m,b,P){
  const {col,skin,B,bx,by,bz,hs,hostile,graze,hop,sw,t2,u}=P;
  const cy=hostile?1.1:1.3,lean=hostile?.15:.5;
  plnLegs(m,[[-bx*.05,cy-by*.3,bz*.45]],{u,s:.3,lift:.28,len:cy-by*.3+.04,bend:[-1,0,0],r0:.1,r1:.06,foot:.26},col(.72),B,P.pose,hop);
  plnBlob(m,{c:[0,cy,0],r:[bx*.95,by*.8,bz*.8],sub:2,box:.88,bump:.1,seed:P.sd,lean,col:skin(.8,1.1),mat:B,glow:P.gl});
  /* сложенное крыло на боку — без него птица читается ящером; злой приподнимает крылья */
  for(const s of [-1,1])plnBlob(m,{c:[-bx*.08,cy+by*.08,s*bz*.74],r:[bx*.62,by*.3,.07],sub:1,box:.6,lean:lean-.3,pitch:hostile?-s*.5:0,col:col(.9),mat:B});
  if(b.crest||hostile)for(let i=0;i<3;i++)plnBlob(m,{c:[-bx*.1-i*.25,cy+by*(.75-i*.12),0],r:[.12,hostile?.26:.18,.04],sub:1,box:.55,lean:.5,col:col(1.25),mat:B});
  /* шея дугой; на ходу голова клюёт вперёд */
  const bob=sw*.12*Math.sin(t2*2),hx=(graze?bx*.9:(hostile?bx*1.2:bx*.75))+bob,hy=graze?hs*.7:(hostile?cy+by*.5:cy+by*1.55);
  const n0=[bx*.55,cy+by*.45,0],n1=graze?[bx*1.0,cy+by*.6,0]:(hostile?[bx*1.0,cy+by*.9,0]:[bx*.95,cy+by*1.25,0]);
  plnTube(m,{path:plnBez(n0,n1,[hx-hs*.2,hy-hs*.1,0],6),rad:t=>lerp(.16,.09,t),sides:6,col:col(.8),mat:B});
  plnBlob(m,{c:[hx,hy,0],r:[hs*.8,hs*.7,hs*.65],sub:2,col:skin(.8,1.1),mat:B,glow:P.gl});
  plnTube(m,{path:[[hx+hs*.5,hy-hs*.05,0],[hx+hs*1.5,hy-hs*(hostile?.1:.3),0]],rad:t=>lerp(.09,.012,t),sides:4,col:col(.45),mat:B,cap:true});   /* клюв */
  if(hostile)plnTube(m,{path:[[hx+hs*.5,hy-hs*.15,0],[hx+hs*1.3,hy-hs*.6,0]],rad:t=>lerp(.07,.012,t),sides:4,col:col(.45),mat:B,cap:true});
  if(b.ears)plnBlob(m,{c:[hx-hs*.2,hy+hs*.7,0],r:[.1,.26,.05],sub:1,box:.6,lean:.4,col:col(1.3),mat:B});   /* гребешок */
  P.eyes([hx+hs*.25,hy+hs*.2,0],hs*.17,hs*.5);
  if(b.tail)plnTube(m,{path:plnBez([-bx*.8,cy-by*.2,0],[-bx*1.6,cy-by*.1,0],[-bx*2.3,cy+by*.1+sw*Math.sin(t2)*.1,0],5),rad:t=>lerp(.18,.03,t),sides:5,col:col(.7),mat:B,cap:true});
  else plnBlob(m,{c:[-bx*1.0,cy-by*.15,0],r:[.5,.1,.38],sub:1,box:.6,lean:-.35,col:col(1.15),mat:B});   /* веер */
}
/* ── членистый: гусеница-многоножка — цепь сегментов волной, пары ног на передних сегментах (по виду), усы ── */
function plnBeastSegment(m,b,P){
  const {col,B,bx,by,hs,hostile,graze,sw,t2,u}=P;
  const n=6,cy=.62,np=Math.min(n-1,Math.max(3,Math.round((b.legs||6)/2))),X=i=>lerp(bx*.9,-bx*1.1,i/(n-1)),Y=i=>cy+sw*.1*Math.sin(t2*2+i*1.1)-(hostile?.08:0);
  for(let i=0;i<n;i++){
    const sg=by*.5*(1-.07*i),x=X(i),y=Y(i);
    plnBlob(m,{c:[x,y,0],r:[sg*1.05,sg*.95,sg*.9],sub:1,box:.95,seed:P.sd+i,col:uu=>plnMul(P.c,lerp(.8,1.1,plnSmooth(-.6,.7,uu[1]))*(i&1?.92:1.05)*(b.spots&&uu[1]>.3?1.3:1)),mat:B,glow:P.gl});
    if(i<np){
      const H0=[x,y-sg*.35,sg*.65],phase=i*.17;
      for(const s of [-1,1]){
        const H=[H0[0],H0[1],s*H0[2]];let F;
        if(P.walk){const q=plnStride(u+phase+(s>0?.5:0),.16,.1);F=[x+q[0],q[1],s*sg*1.25];}
        else if(P.stun)F=[x+.1,H[1]-.15,s*sg*.9];
        else F=[x+(i&1?-.06:.06),0,s*sg*(hostile?1.4:1.2)];
        plnLeg(m,H,F,.5,[0,1,0],.05,.025,col(.72),B);
      }
    }
  }
  const hx=X(0)+hs*.5,hy=graze?hs*.6:Y(0)+.05;
  plnBlob(m,{c:[hx,hy,0],r:[hs*.9,hs*.8,hs*.8],sub:2,box:.9,col:uu=>plnMul(P.c,lerp(.85,1.1,plnSmooth(-.6,.7,uu[1]))),mat:B,glow:P.gl});
  for(const s of [-1,1]){const w=Math.sin(t2*1.5+s)*.12;plnTube(m,{path:plnBez([hx+hs*.4,hy+hs*.5,s*hs*.3],[hx+hs*1.2,hy+hs*1.3+w,s*hs*.6],[hx+hs*2.0,hy+hs*1.0+w*2,s*hs*.9],5),rad:t=>lerp(.035,.012,t),sides:4,col:col(.6),mat:B,cap:true});}
  if(hostile)for(const s of [-1,1])plnTube(m,{path:[[hx+hs*.7,hy-hs*.2,s*hs*.35],[hx+hs*1.35,hy-hs*.35,s*hs*.05]],rad:t=>lerp(.06,.015,t),sides:4,col:col(.4),mat:B,cap:true});   /* жвалы */
  P.eyes([hx+hs*.6,hy+hs*.2,0],hs*.18,hs*.5);
  if(b.tail)plnTube(m,{path:[[X(n-1)-by*.2,Y(n-1),0],[X(n-1)-by*.9,Y(n-1)+.15,0]],rad:t=>lerp(.1,.015,t),sides:4,col:col(.6),mat:B,cap:true});
}
/* земной зверь в позе: собирает контекст и зовёт анатомию по силуэту */
function plnBeastEarth(m,b,pose,t2,sw,c,sd,gl){
  const P={pose,walk:pose==="walk",hostile:pose==="hostile",graze:pose==="graze",stun:pose==="stun",u:t2/TAU,sw,t2,c,sd,gl:gl||0,B:PLN_MAT.beast,
    bx:b.bx||1,by:b.by||1,bz:Math.min(b.bx||1,b.by||1)*.78,hs:b.headSize||.6,hop:!!b.hop&&(b.legs||4)<=2,
    col:q=>plnMul(c,q),
    skin:(lo,hi)=>uu=>plnMul(c,lerp(lo,hi,plnSmooth(-.7,.6,uu[1]))*(b.spots&&plnNoise(uu[0]*4+1.3,uu[2]*4+uu[1]*3,sd)>.45?1.4:1)),
    eyes:(p,r,dz)=>plnBeastEyes(m,b,p,r,dz,pose==="hostile",pose==="stun")};
  const sh=b.shape|0;
  if(sh===1)plnBeastLong(m,b,P);
  else if(sh===2)plnBeastStout(m,b,P);
  else if(sh===3)plnBeastUpright(m,b,P);
  else if(sh===4)plnBeastSegment(m,b,P);
  else plnBeastCapsule(m,b,P);
  if(P.stun)plnBeastLay(m);
}
