/* ══════════════ материал грунта ══════════════ */
/* Большая заливка одним цветом мгновенно выдаёт «нарисовано фигурами», сколько
   бы объектов сверху ни стояло. Поэтому у каждой планеты есть свой материал —
   бесшовный тайл 256×256, посчитанный один раз при заходе на посадку и дальше
   работающий обычным паттерном: на кадр это один fillRect по клипу.

   В тайле три масштаба сразу:
   макро  — геологические пятна и выветренные поля;
   средний— осадочные потёки, трещины, минеральные жилы;
   микро  — зерно, крошка, редкие вкрапления кристаллов.
   Ещё один масштаб добавляется при отрисовке: тот же тайл кладётся вторым
   проходом с увеличением 3.7×, и повторяемость 256 px перестаёт читаться. */

/* шум, бесшовный по обеим осям: решётка берётся по модулю L, поэтому правый
   край сходится с левым, а нижний с верхним — без этого швы видны сразу */
function tnoise(x,y,L,s){
  const fx=x*L,fy=y*L;
  const i=Math.floor(fx),j=Math.floor(fy),u=fx-i,v=fy-j;
  const su=u*u*(3-2*u),sv=v*v*(3-2*v);
  const m=(a,b)=>h01(((a%L)+L)%L,((b%L)+L)%L,s);
  return lerp(lerp(m(i,j),m(i+1,j),su),lerp(m(i,j+1),m(i+1,j+1),su),sv);
}
function tfbm(x,y,L,s,oct){
  let v=0,a=.5,f=1,n=0;
  for(let i=0;i<oct;i++){v+=a*tnoise(x,y,L*f,s+i*97);n+=a;a*=.5;f*=2;}
  return v/n;
}
/* хребтовой шум: из него получаются трещины и жилы — узкие ветвящиеся линии,
   а не пятна. Степень задаёт, насколько тонкой выходит линия. */
const ridged=(v,p)=>Math.pow(1-Math.abs(1-2*v),p);
/* минеральная примесь: у каждой планеты своя, иначе все жилы одного цвета */
const MINERAL=[[210,180,110],[120,210,220],[220,130,150],[150,230,160],
               [190,160,240],[240,190,120],[120,160,230],[230,230,240]];
const MAT_S=256;
function planetMat(p){
  if(p.mat)return p.mat;
  const S=MAT_S,cn=document.createElement("canvas");cn.width=cn.height=S;
  const c=cn.getContext("2d"),img=c.createImageData(S,S),d=img.data;
  const pal=p.T.pal,sd=(p.seed^0x4D41)>>>0;
  const mn=MINERAL[sd%MINERAL.length];
  /* сколько чего на этой планете: выветренность, трещиноватость, богатство жил.
     Две каменистые планеты благодаря этому не выглядят одной и той же породой. */
  const r=rng(sd);
  const wear=.35+r()*.5, crackK=.25+r()*.85, veinK=r()*r()*.75, grainK=.5+r()*.9;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const o=(y*S+x)*4,u=x/S,v=y/S;
    /* макро: крупные поля породы */
    const macro=tfbm(u,v,3,sd,4);
    /* средний: осадочные потёки — растянуты по горизонтали, как намытый слой */
    const sed=tfbm(u*.55,v*2.2,6,sd+11,3);
    let t=clamp(macro*.66+sed*.34,0,1);
    /* выветривание сдвигает светлоту пятнами, а не ровно */
    t=clamp(t+(tfbm(u,v,9,sd+71,2)-.5)*wear,0,1);
    /* диапазон палитры сжат к середине: во всю ширину порода прыгает от
       глубокой тени до снега и читается как камуфляж, а не как камень */
    const c0=ramp(pal,.26+t*.5);
    /* и слегка сводим к собственной светлоте — цветовой разброс внутри одного
       материала должен быть заметен, но не спорить с биомом */
    const lum=(c0[0]*.3+c0[1]*.59+c0[2]*.11);
    let R=lerp(c0[0],lum,.22),Gc=lerp(c0[1],lum,.22),B=lerp(c0[2],lum,.22);
    /* трещины: тонкая тёмная сеть, глубже в углублениях */
    /* трещина должна быть волосяной: широкая «жила» ридж-шума читается
       кишками, а не разломом — отсюда высокая степень и мелкая решётка */
    const crack=ridged(tfbm(u,v,17,sd+29,3),17)*crackK;
    const k=1-clamp(crack,0,.40);
    R*=k;Gc*=k;B*=k;
    /* жилы: узкие светящиеся прожилки минерала, редкие */
    const vein=ridged(tfbm(u,v,5,sd+53,4),38)*veinK;
    if(vein>.01){
      const w=clamp(vein,0,.55);
      R=lerp(R,mn[0],w);Gc=lerp(Gc,mn[1],w);B=lerp(B,mn[2],w);
    }
    /* микро: зерно породы и редкая крошка */
    const g=(h01(x,y,sd+7)-.5)*15*grainK;
    R+=g;Gc+=g;B+=g;
    const peb=h01(x>>1,y>>1,sd+13);
    if(peb>.982){const s2=(peb-.982)*36;R+=s2*70;Gc+=s2*70;B+=s2*70;}
    else if(peb<.006){R*=.62;Gc*=.62;B*=.62;}
    d[o]=clamp(R,0,255);d[o+1]=clamp(Gc,0,255);d[o+2]=clamp(B,0,255);d[o+3]=255;
  }
  c.putImageData(img,0,0);
  p.mat=c.createPattern(cn,"repeat");
  p.matCn=cn;
  return p.mat;
}
/* положить материал в уже построенный путь (путь должен быть текущим).
   Два прохода: свой масштаб и увеличенный — второй убивает видимую сетку 256. */
function fillMaterial(mat,camx,camy,a1,a2,P){
  if(!mat)return;
  ctx.save();
  if(P)ctx.clip(P);else ctx.clip();
  ctx.globalAlpha=a1;
  ctx.translate(-camx,-camy);
  ctx.fillStyle=mat;
  ctx.fillRect(camx-4,camy-4,W+8,H+8);
  ctx.restore();
  /* второй проход — тот же тайл крупно и в режиме overlay: он добавляет
     светлые и тёмные поля масштабом с полэкрана, из-за которых сетка 256
     перестаёт читаться, но цвет породы не уезжает */
  ctx.save();
  if(P)ctx.clip(P);else ctx.clip();
  ctx.globalCompositeOperation="overlay";
  ctx.globalAlpha=a2;
  const K=3.7;
  ctx.scale(K,K);
  ctx.translate(-camx/K*.55,-camy/K*.55);
  ctx.fillStyle=mat;
  ctx.fillRect(camx/K*.55-4,camy/K*.55-4,W/K+8,H/K+8);
  ctx.restore();
}
