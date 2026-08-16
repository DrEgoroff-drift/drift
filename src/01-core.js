"use strict";
/* Р’РµСЂСЃРёСЏ РёРіСЂС‹. РћРґРЅР° РЅР° РІСЃС‘: Р·Р°СЃС‚Р°РІРєР°, Р¶СѓСЂРЅР°Р», РїР°С‚С‡РЅРѕСѓС‚С‹ (PATCHNOTES.md).
   Рљ С„РѕСЂРјР°С‚Сѓ СЃРѕС…СЂР°РЅРµРЅРёСЏ РѕС‚РЅРѕС€РµРЅРёСЏ РЅРµ РёРјРµРµС‚ вЂ” С‚РѕС‚ РЅР°РІСЃРµРіРґР° v:4. */
const VER="0.61.0";
/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ РјР°С‚РµРјР°С‚РёРєР° в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
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
/* Р Р°Р·РЅРёС†Р° СѓРіР»РѕРІ, РєСЂР°С‚С‡Р°Р№С€РµР№ РґСѓРіРѕР№. РџСЂРµР¶РЅСЏСЏ С„РѕСЂРјСѓР»Р° вЂ” ((a-b+3ПЂ)%TAU)-ПЂ вЂ” РІРµСЂРЅР°
   СЂРѕРІРЅРѕ РґРѕ С‚РµС… РїРѕСЂ, РїРѕРєР° a-b РЅРµ РјРµРЅСЊС€Рµ -3ПЂ: РѕСЃС‚Р°С‚РѕРє РІ JS Р±РµСЂС‘С‚ Р·РЅР°Рє РґРµР»РёРјРѕРіРѕ,
   Рё РЅР° Р±РѕР»СЊС€РёС… РѕС‚СЂРёС†Р°С‚РµР»СЊРЅС‹С… СЂР°Р·РЅРѕСЃС‚СЏС… РѕС‚РІРµС‚ СѓРµР·Р¶Р°РµС‚ Рё РїРѕ Р·РЅР°РєСѓ, Рё Р·Р° РїСЂРµРґРµР»С‹
   РїРѕР»СѓРѕР±РѕСЂРѕС‚Р°. РљСѓСЂСЃ РєРѕСЂР°Р±Р»СЏ РЅРёРіРґРµ РЅРµ СЃРІРѕСЂР°С‡РёРІР°Р»СЃСЏ Рё РєРѕРїРёР»СЃСЏ РѕР±РѕСЂРѕС‚Р°РјРё вЂ” РІ Р¶РёРІРѕРј
   СЃРѕС…СЂР°РЅРµРЅРёРё РѕРЅ РґРѕСЂРѕСЃ РґРѕ -500 СЂР°Рґ, Рё РґРѕРІРѕСЂРѕС‚ РІРµРєС‚РѕСЂР° СЃРєРѕСЂРѕСЃС‚Рё Рє РЅРѕСЃСѓ РїСЂРёРЅСЏР»СЃСЏ
   СЂР°Р·РІРѕСЂР°С‡РёРІР°С‚СЊ СЃРєРѕСЂРѕСЃС‚СЊ РІ РїСЂРѕС‚РёРІРѕРїРѕР»РѕР¶РЅСѓСЋ СЃС‚РѕСЂРѕРЅСѓ. РљРѕСЂР°Р±Р»СЊ РґС‘СЂРіР°Р»СЃСЏ РЅР° РјРµСЃС‚Рµ
   РїРѕРґ РїРѕР»РЅРѕР№ С‚СЏРіРѕР№ Рё Р¶С‘Рі С‚РѕРїР»РёРІРѕ: РЅРё РѕС€РёР±РєРё, РЅРё РїСЂРѕСЃР°РґРєРё РєР°РґСЂРѕРІ. */
const angWrap=x=>{const d=x%TAU;return d>Math.PI?d-TAU:(d<-Math.PI?d+TAU:d);};
const angDiff=(a,b)=>angWrap(a-b);

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ РёРјРµРЅР° в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
const S1=["РєР°","Р·Рµ","РІРѕСЂ","С‚Рё","РјРµР»","СЃР°СЂ","РєРІР°","Р°СЂ","РЅРё","РєСЃРё","Р»Сѓ","РґСЂР°","РѕРЅ","РїРё","С…Р°","С†Рё","СѓСЂ","РіР°Р»","РѕР±","РІРµРєСЃ","СЃРѕР»","РёС‚","РєРѕСЂ","СЌРЅС‚","СЂР°","С‚Р°Сѓ","РЅРµР№","РѕРј"];
const S2=["РЅРёСЃ","С‚Р°СЂ","РѕРЅ","СЌРєСЃ","СѓСЂ","Р°Р»","РёРѕСЃ","Р°С‚","РёРЅ","РѕСЂР°","РёРєСЃ","СѓРЅ","СЌС€","Р°СЂР°","РѕСЂРЅ","РёР»","Р°РґРµ","РёР№","РѕС‚","РёСЃ","СЌР»СЊ","СѓРј"];
const ROMAN=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function genName(r){let s=pick(S1,r);if(r()<.55)s+=pick(S1,r);s+=pick(S2,r);
  return s[0].toUpperCase()+s.slice(1);}

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ СѓРґР°Р»С‘РЅРЅРѕСЃС‚СЊ Рё РЅР°СЃС‚СЂРѕР№ СЃРµРєС‚РѕСЂР° в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
function sysDanger(sx,sy){return clamp(Math.hypot(sx,sy)/40,0,1);}
function sysJitter(gx,gy){
  const jr=rng(hashi(gx,gy,55551));
  const a=jr()*TAU,rad=jr()*.42;
  return [Math.cos(a)*rad,Math.sin(a)*rad];
}
const DESC_MOOD=[
  {w:["С‚РёС…РёР№","Р·Р°Р±С‹С‚С‹Р№","СЃРѕРЅРЅС‹Р№"],ok:s=>!s.station&&!s.belt},
  {w:["РѕР¶РёРІР»С‘РЅРЅС‹Р№","РѕР±Р¶РёС‚РѕР№","РјРЅРѕРіРѕРѕР±РµС‰Р°СЋС‰РёР№"],ok:s=>!!(s.station&&s.belt)},
  {w:["РїРѕРіСЂР°РЅРёС‡РЅС‹Р№","РЅРµСЃРїРѕРєРѕР№РЅС‹Р№","РґРёРєРёР№"],ok:s=>sysDanger(s.sx,s.sy)>.55},
  {w:["СЂР°Р·РІРµРґР°РЅРЅС‹Р№","РєР°СЂС‚РѕРіСЂР°С„РёСЂРѕРІР°РЅРЅС‹Р№"],ok:s=>!!s.station&&sysDanger(s.sx,s.sy)<=.55}
];
const DESC_TAIL=["СЃРµРєС‚РѕСЂ","СЂСѓР±РµР¶","СѓС‡Р°СЃС‚РѕРє","СѓРіРѕР» РіР°Р»Р°РєС‚РёРєРё","РєР°СЂРјР°РЅ РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІР°","Р·Р°РєРѕСѓР»РѕРє"];
function genDesc(r,sys){
  const cands=DESC_MOOD.filter(m=>m.ok(sys));
  const pool=cands.length?cands:DESC_MOOD;
  const mood=pick(pick(pool,r).w,r);
  const tail=pick(DESC_TAIL,r);
  const bits=[mood[0].toUpperCase()+mood.slice(1)+" "+tail];
  const kinds=sys.planets.map(p=>p.T.ru).filter((v,i,a)=>a.indexOf(v)===i);
  if(kinds.length)bits.push(kinds.length+" С‚РёРї"+(kinds.length===1?"":(kinds.length<5?"Р°":"РѕРІ"))+" РјРёСЂРѕРІ: "+kinds.join(", "));
  if(sys.belt)bits.push("РїРѕСЏСЃ Р±РѕРіР°С‚ "+sys.belt.res.map(k=>RES[k].ru.toLowerCase()).join(", "));
  if(sys.station)bits.push(sys.station.kind.toLowerCase());
  return bits.join(" В· ");
}

