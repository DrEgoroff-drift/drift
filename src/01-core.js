"use strict";
/* Версия игры. Одна на всё: заставка, журнал, патчноуты (PATCHNOTES.md).
   К формату сохранения отношения не имеет — тот навсегда v:4. */
const VER="0.150.0";
/* ══════════════ математика ══════════════ */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
function hashi(x,y,s){
  let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1442695041);
  h=Math.imul(h^(h>>>13),1274126177);
  return (h^(h>>>16))>>>0;
}
const h01=(x,y,s)=>hashi(x,y,s)/4294967296;
function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const pick=(arr,r)=>arr[Math.floor(r()*arr.length)];
function noise1(x,s){const i=Math.floor(x),f=x-i,t=f*f*(3-2*f);return lerp(h01(i,0,s),h01(i+1,0,s),t);}
function fbm1(x,s,oct){let v=0,a=.5,f=1,n=0;oct=oct||5;
  for(let i=0;i<oct;i++){v+=a*noise1(x*f,s+i*131);n+=a;a*=.5;f*=2;}return v/n;}
function noise2(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(h01(xi,yi,s),h01(xi+1,yi,s),u),lerp(h01(xi,yi+1,s),h01(xi+1,yi+1,s),u),v);
}
function fbm2(x,y,s,oct){let v=0,a=.5,f=1,n=0;oct=oct||5;
  for(let i=0;i<oct;i++){v+=a*noise2(x*f,y*f,s+i*97);n+=a;a*=.5;f*=2;}return v/n;}
/* Разница углов, кратчайшей дугой. Прежняя формула — ((a-b+3π)%TAU)-π — верна
   ровно до тех пор, пока a-b не меньше -3π: остаток в JS берёт знак делимого,
   и на больших отрицательных разностях ответ уезжает и по знаку, и за пределы
   полуоборота. Курс корабля нигде не сворачивался и копился оборотами — в живом
   сохранении он дорос до -500 рад, и доворот вектора скорости к носу принялся
   разворачивать скорость в противоположную сторону. Корабль дёргался на месте
   под полной тягой и жёг топливо: ни ошибки, ни просадки кадров. */
const angWrap=x=>{const d=x%TAU;return d>Math.PI?d-TAU:(d<-Math.PI?d+TAU:d);};
const angDiff=(a,b)=>angWrap(a-b);

/* ══════════════ имена ══════════════ */
const S1=["ка","зе","вор","ти","мел","сар","ква","ар","ни","кси","лу","дра","он","пи","ха","ци","ур","гал","об","векс","сол","ит","кор","энт","ра","тау","ней","ом"];
const S2=["нис","тар","он","экс","ур","ал","иос","ат","ин","ора","икс","ун","эш","ара","орн","ил","аде","ий","от","ис","эль","ум"];
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function genName(r){let s=pick(S1,r);if(r()<.55)s+=pick(S1,r);s+=pick(S2,r);
  return s[0].toUpperCase()+s.slice(1);}

/* ══════════════ удалённость и настрой сектора ══════════════ */
function sysDanger(sx,sy){return clamp(Math.hypot(sx,sy)/40,0,1);}
function sysJitter(gx,gy){
  const jr=rng(hashi(gx,gy,55551));
  const a=jr()*TAU,rad=jr()*.42;
  return [Math.cos(a)*rad,Math.sin(a)*rad];
}
const DESC_MOOD=[
  {w:["тихий","забытый","сонный"],ok:s=>!s.station&&!s.belt},
  {w:["оживлённый","обжитой","многообещающий"],ok:s=>!!(s.station&&s.belt)},
  {w:["пограничный","неспокойный","дикий"],ok:s=>sysDanger(s.sx,s.sy)>.55},
  {w:["разведанный","картографированный"],ok:s=>!!s.station&&sysDanger(s.sx,s.sy)<=.55}
];
const DESC_TAIL=["сектор","рубеж","участок","угол галактики","карман пространства","закоулок"];
function genDesc(r,sys){
  const cands=DESC_MOOD.filter(m=>m.ok(sys));
  const pool=cands.length?cands:DESC_MOOD;
  const mood=pick(pick(pool,r).w,r);
  const tail=pick(DESC_TAIL,r);
  const bits=[mood[0].toUpperCase()+mood.slice(1)+" "+tail];
  const kinds=sys.planets.map(p=>p.T.ru).filter((v,i,a)=>a.indexOf(v)===i);
  if(kinds.length)bits.push(kinds.length+" тип"+(kinds.length===1?"":(kinds.length<5?"а":"ов"))+" миров: "+kinds.join(", "));
  if(sys.belt)bits.push("пояс богат "+sys.belt.res.map(k=>RES[k].ru.toLowerCase()).join(", "));
  if(sys.station)bits.push(sys.station.kind.toLowerCase());
  return bits.join(" · ");
}
