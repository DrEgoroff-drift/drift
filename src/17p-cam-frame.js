/* ══════════════ камера системы: окно кадра и объектив боя (M826) ══════════════
   Окно кадра — та часть экрана, которую не закрывают приборы: верхний ряд плит (HUD_BAND), пол
   (HUD_FLOOR), правый борт (HUD_RAIL) и открытая стойка (25d: сбоку на ПК, полкой сверху на
   телефоне). Правило «тело в кадре» (17-mode-system) меряет место до кромки этого окна, а не до
   кромки экрана: тело, к которому идёт корабль, не уводится под борт или под стойку.
   Объектив боя — правило plnGlide планеты (21pz) для космоса: на телефоне в бою камера сама
   подъезжает, пока корабль и цель влезают в окно кадра, — пират не остаётся пятном в 40 px. Это зум
   игры (G.zoomT, 15-input), а не второй масштаб вида: тычок, захват и автопилот считают через ту же
   G.zoom. Игрок крутанул зум сам — объектив руки убирает до конца боя; бой кончился — зум прежний. */

function camFree(){
  let x0=8,y0=8,x1=W-8,y1=H-8;
  if(typeof HUD_BAND==="number"&&HUD_BAND>0)y0=Math.max(y0,HUD_BAND+6);
  if(typeof HUD_FLOOR==="number"&&HUD_FLOOR>0)y1=Math.min(y1,HUD_FLOOR-6);
  /* борт телефона — кнопки у пэдов внизу справа, в высоту кадра он не встаёт: режет только на ПК */
  if(W>760&&typeof HUD_RAIL==="number"&&HUD_RAIL>0&&HUD_RAIL<W)x1=Math.min(x1,HUD_RAIL-8);
  const g=typeof rackOpen==="function"&&rackOpen()&&typeof RACK!=="undefined"?RACK.geo:null;
  if(g&&!g.hide){const k=typeof RACK_K==="number"?RACK_K:1;
    if(g.mode==="shelf")y0=Math.max(y0,(g.y+g.h)*k+6);else x1=Math.min(x1,g.x*k-8);}
  if(x1-x0<120){x0=8;x1=W-8;}
  if(y1-y0<120){y0=8;y1=H-8;}
  return {x0,y0,x1,y1};
}
/* от середины экрана по направлению (ux,uy) до кромки окна кадра, px */
function camReach(F,ux,uy){
  let t=1e9;
  if(ux>1e-6)t=Math.min(t,(F.x1-W/2)/ux);else if(ux<-1e-6)t=Math.min(t,(F.x0-W/2)/ux);
  if(uy>1e-6)t=Math.min(t,(F.y1-H/2)/uy);else if(uy<-1e-6)t=Math.min(t,(F.y0-H/2)/uy);
  return Math.max(0,t);
}

const FIGHT_LENS={on:false,zu:1,zw:0,off:false};
const FIGHT_LENS_MAX=3.4;   /* дальше пират и корабль растут медленнее мира (shipScaleCap) — смысла нет */
/* цель боя: взятая (G.marks[0]), если это пират; иначе ближний, кто вас преследует */
function fightTarget(sh){
  const M=G.marks&&G.marks[0];
  if(M&&G.pirates.indexOf(M)>=0)return M;
  let b=null,bd=1e9;
  for(const p of G.pirates){if(!p.aware||p.iff)continue;const d=Math.hypot(p.x-sh.x,p.y-sh.y);if(d<bd){bd=d;b=p;}}
  return b;
}
function fightLens(hostile){
  const L=FIGHT_LENS,sh=G.ship;
  const want=hostile>0&&W<=760&&!G.watch&&!(G.haul&&G.haul.ph!=="free");
  if(!want){
    if(L.on&&!L.off&&typeof zoomTo==="function")zoomTo(L.zu);   /* бой кончился — зум, какой был */
    L.on=false;L.off=false;return;
  }
  if(!L.on){L.on=true;L.off=false;L.zu=G.zoom;L.zw=0;}
  /* зум взял кто-то другой (щипок, колесо, ступени) — объектив руки убирает */
  if(L.zw&&(G.zoomT!=null&&G.zoomT!==L.zw||G.zoomT==null&&Math.abs(G.zoom-L.zw)>.01))L.off=true;
  if(L.off)return;
  const T=fightTarget(sh);if(!T)return;
  const dx=T.x-sh.x,dy=T.y-sh.y,d=Math.hypot(dx,dy)||1,F=camFree();
  /* цель с полем в 48 px внутри окна кадра; корабль — в середине экрана */
  const fit=(camReach(F,dx/d,dy/d)-48)/d;
  const z=clamp(Math.min(fit,FIGHT_LENS_MAX),Math.min(L.zu,FIGHT_LENS_MAX),FIGHT_LENS_MAX);
  if(Math.abs(z-G.zoom)<.01&&G.zoomT==null){L.zw=G.zoom;return;}
  L.zw=clamp(z,ZOOM_MIN,ZOOM_MAX);G.zoomT=L.zw;
}
