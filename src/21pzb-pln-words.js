/* ══════════════ поверхность под движком планеты: слова только на вещах (M830 tail) ══════════════
   Первый кадр поверхности — последний кадр спуска, и в нём нет ничего, чего не было на спуске:
   - #msg молчит, пока идёт передача объектива и человек выходит (PLN.hand и ещё PLN_WORDS_HUSH
     секунды): сообщение держится (msgHeld), а не сгорает — его срок пойдёт, когда кадр встанет;
   - подсказка «ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ» — не полоса сверху, а табличка у ближней залежи в кадре,
     и в ней же счёт залежей, который прежде говорил #msg при посадке; её срок тоже идёт после тишины;
   - строка действия (#prompt) — табличкой «Борта» у корабля, когда человек у корабля, иначе — у
     человека; у памятника и у залежи её вешает hangSurface (08bj). Оранжевого текста на песке без
     плашки нет: #prompt под слоем спрятан (body.plnwords), кнопка ДЕЙСТВИЯ берёт глагол из G.prompt
     как прежде.
   Без видеокарты или со старым видом (?pln=0) ничего этого нет — всё по-прежнему. */
const PLN_WORDS={hush:false,end:-1e9,on:false,cnt:0};
const PLN_WORDS_HUSH=.7;
/* слой слов есть и кадр рисует движок планеты */
function plnWordsOn(){
  return G.mode==="surface"&&typeof PLN!=="undefined"&&PLN.on&&!!PLN_FRAME.live&&hangOk();
}
/* тишина #msg: передача объектива и ещё немного — человек сходит с трапа */
function plnMsgHush(){
  if(!plnWordsOn())return false;
  const t=wallMs();
  if(PLN.hand)PLN_WORDS.end=t;
  return t-PLN_WORDS.end<PLN_WORDS_HUSH*1000;
}
const PLN_OLD_HELD=msgHeld;
msgHeld=function(){return PLN_OLD_HELD()||plnMsgHush();};
/* посадка: «залежей: n» уходит в табличку у залежи, строка истории остаётся сообщению */
const PLN_OLD_ENTER=enterSurface;
enterSurface=function(){
  const r=PLN_OLD_ENTER.apply(this,arguments);
  if(typeof PLN!=="undefined"&&PLN.on&&hangOk()&&G.mode==="surface"&&/^залежей: \d+/.test(String(G.msg||""))){
    const ln=String(G.msg).split("\n");PLN_WORDS.cnt=parseInt(ln[0].slice(9),10)||0;
    if(ln.length>1)G.msg=ln.slice(1).join("\n");else G.msgT=0;
  }
  return r;
};
/* полоса подсказки: подсказку залежей забирает табличка; пока тихо, её срок не идёт */
const PLN_OLD_HINT=surfaceHint;
surfaceHint=function(){
  const h=PLN_OLD_HINT.apply(this,arguments);
  if(!h||!plnWordsOn()||h.indexOf("ЦВЕТНЫЕ КРИСТАЛЛЫ")!==0)return h;
  if(msgHeld())G.surfTipShown=G.t;
  else PLN_WORDS.tip=G.t;
  return null;
};
/* точка мира → пиксели окна тем же объективом, что у кадра (как hangSurface) */
function plnWordsPj(S){
  const C=plnLens(S,G.viewK,{vx:G.viewX,vy:G.viewY}),m=C.vp;
  return v=>{const cw=m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15];if(!(cw>0))return null;
    return [((m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12])/cw*.5+.5)*W,(.5-(m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13])/cw*.5)*H];};
}
/* табличка на вещи высотой h (м) с серединой в c: точка и радиус на экране */
function plnWordsAt(pj,c,h,id,lines,o){
  const a=pj(c),b=pj([c[0],c[1]+h/2,c[2]]);
  if(!a||!b)return false;
  ovHang(id,lines,a[0],a[1],Object.assign({r:Math.max(8,Math.abs(a[1]-b[1]))},o));
  return true;
}
const PLN_OLD_HSURF=hangSurface;
hangSurface=function(){
  const n=HANG.q.length;
  PLN_OLD_HSURF();
  if(!plnWordsOn()||!hangIn())return;
  const S=G.surf,L=PLN_LAND.cur;
  if(!S||!S.tr||!L||G.viewK==null||msgHeld())return;
  const pj=plnWordsPj(S),hung=HANG.q.length>n;
  /* подсказка залежей — у ближней залежи в кадре (свою строку у залежи под ногами вешает hangSurface) */
  if(PLN_WORDS.tip===G.t&&!(hung&&/ЗАЛЕЖЬ/.test(String(G.prompt||"")))){
    let dep=null,dd=1e9;
    for(const d of S.deposits||[]){
      if(d.left<=0)continue;
      const z=plnThingDepZ(d),x=d.x/PLN_M,q=pj([x,plnThingGround(L,x,z).h+.6,z]);
      if(!q||q[0]<W*.06||q[0]>W*.94||q[1]<H*.1||q[1]>H*.95)continue;
      const e=Math.abs(d.x-S.x);if(e<dd){dd=e;dep={d,x,z};}
    }
    if(dep){
      const ln=["ЦВЕТНЫЕ КРИСТАЛЛЫ — ЗАЛЕЖИ",RES[dep.d.res].ru+(PLN_WORDS.cnt?" · залежей здесь "+PLN_WORDS.cnt:"")];
      plnWordsAt(pj,[dep.x,plnThingGround(L,dep.x,dep.z).h+.6,dep.z],1.2,"pln.tip",ln,{up:true});
    }
  }
  /* ворота базы держат свою плашку, когда строку у них забрал скан (21pig, M628b) */
  const gn=plnOwnGateNote(S);
  if(gn)plnWordsAt(pj,gn.c,gn.h,gn.id,gn.lines,{});
  /* строка действия — у корабля или у человека */
  const pr=String(G.prompt||"");
  if(hung||!pr||!PLN.shipW)return;
  const ln=pr.split("\n"),vi=ln.findIndex(s=>/^(УДЕРЖИВАЙТЕ |КНОПКА |НЕТ ТОПЛИВА|ДЕЙСТВИЕ|▲)/.test(s)),o={verb:vi<0?undefined:vi};
  const ow=plnOwnWordsAt(S);   /* у ворот базы и у крыльца дома (21pig, M628a) */
  if(ow)plnWordsAt(pj,ow.c,ow.h,ow.id,ln,o);
  else if(Math.abs(S.x-S.shipX)<shipZoneR()){const s=PLN.shipW;plnWordsAt(pj,[s[0],s[1]+2,s[2]],4,"pln.ship",ln,o);}
  else{const mx=S.x/PLN_M,my=plnY(S.y+10);plnWordsAt(pj,[mx,my+1,0],1.9,"pln.man",ln,Object.assign({up:true},o));}
};
/* #prompt и #msg под слоем — классами тела; переключаются только на перемене */
const PLN_OLD_HUD2=hud;
hud=function(){
  PLN_OLD_HUD2.apply(this,arguments);
  if(typeof document==="undefined"||!document.body||!document.body.classList)return;
  const on=plnWordsOn(),hu=on&&plnMsgHush(),B=document.body.classList;
  if(on!==PLN_WORDS.on){PLN_WORDS.on=on;B.toggle("plnwords",on);}
  if(hu!==PLN_WORDS.hush){PLN_WORDS.hush=hu;B.toggle("plnhush",hu);}
};
