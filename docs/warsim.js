/* ДРЕЙФ — прогон летописи без браузера (M412).
 *
 *   tools\node\node docs\warsim.js            — от нуля до текущей сводки
 *   tools\node\node docs\warsim.js 3000       — столько сводок вперёд от нуля
 *   tools\node\node docs\warsim.js 3000 --lines   — и последние строки
 *
 * Читает site/war.js (собирается build.ps1) и повторяет историю тем же кодом,
 * что игра. Печатает то, по чему видно, идёт ли война «сама и естественно»:
 * по месяцам (120 сводок) — войны, ноты, переходы систем, происшествия, тихие
 * сводки, сила держав; в конце — кто сколько держит, и хэш состояния. Это
 * измеритель, а не тест: тесты — в tests/91zzzw-chron*. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"site","war.js"),"utf8");
/* страница живёт в окне; здесь окна нет — но летопись про него и не спрашивает */
globalThis.localStorage=undefined;
vm.runInThisContext(src,{filename:"war.js"});
const args=process.argv.slice(2);
const want=args.find(a=>/^\d+$/.test(a));
const N=want?(want|0):chronNow();
const showLines=args.includes("--lines");

const st=chronFresh();
const P=MAKER_KEYS.map(k=>POWERS[k].ru);
const month=[];
let cur=null,fresh=[];
/* строки считаем на входе, а не по длине массива: журнал держит 500 и режет старое */
const MOVES={};
const origMove=chronAgentMove;
chronAgentMove=function(s,n,i,rr){const m=origMove(s,n,i,rr);MOVES[m]=(MOVES[m]||0)+1;return m;};
const origLine=chronLine;
chronLine=function(s,n,kind,p,sys,args){fresh.push({kind,args});return origLine(s,n,kind,p,sys,args);};
const t0=Date.now();
let ownersAt=null;
for(let n=0;n<=N;n++){
  fresh=[];
  chronStep(st,n);
  const m=Math.floor(n/120);
  if(!cur||cur.m!==m){
    cur={m,war:0,truce:0,take:0,inc:0,forced:0,ult:0,quiet:0,arc:0,rite:0,strSum:0,strN:0,strMin:1000,strMax:0,frontN:0,changed:0,needSum:0,tensSum:0};
    month.push(cur);
    ownersAt={};for(const k of chronKeys())ownersAt[k]=st.systems[k].owner;
  }
  for(const L of fresh){
    if(L.kind==="war")cur.war++;else if(L.kind==="truce")cur.truce++;else if(L.kind==="take")cur.take++;
    else if(L.kind==="inc"){cur.inc++;if(L.args&&L.args.forced)cur.forced++;}
    else if(L.kind==="ult")cur.ult++;else if(L.kind==="arc")cur.arc++;else if(L.kind==="rite")cur.rite++;
  }
  if(!fresh.length)cur.quiet++;
  for(const p of st.powers){cur.strSum+=p.str;cur.strN++;cur.strMin=Math.min(cur.strMin,p.str);cur.strMax=Math.max(cur.strMax,p.str);
    cur.needSum+=(p.need.ore+p.need.goods+p.need.hulls+p.need.link)/4;cur.tensSum+=p.tension;}
  for(const k of chronKeys())if(st.systems[k].front)cur.frontN++;
  let ch=0;for(const k of chronKeys())if(st.systems[k].owner!==ownersAt[k])ch++;
  cur.changed=ch;
}
const ms=Date.now()-t0;
console.log("сводок: 0…"+N+" · "+ms+" мс · "+(ms/(N+1)).toFixed(2)+" мс на сводку");
console.log("месяц  войны ноты перемир переходы сменили происш(принуд) дуги обряды тихих  сила ср/мин/макс  нужды напряж фронт-сводок");
for(const c of month){
  console.log(String(c.m).padStart(5)+"  "+String(c.war).padStart(5)+String(c.ult).padStart(5)+String(c.truce).padStart(8)+
    String(c.take).padStart(9)+String(c.changed).padStart(8)+String(c.inc).padStart(8)+"("+c.forced+")".padEnd(4)+String(c.arc).padStart(5)+String(c.rite).padStart(7)+
    String(c.quiet).padStart(6)+"   "+String(Math.round(c.strSum/Math.max(1,c.strN))).padStart(4)+"/"+c.strMin+"/"+c.strMax+"   "+
    String(Math.round(c.needSum/Math.max(1,c.strN))).padStart(4)+String(Math.round(c.tensSum/Math.max(1,c.strN))).padStart(6)+"   "+c.frontN);
}
console.log("ходы: "+Object.keys(MOVES).map(k=>k+" "+MOVES[k]).join(" · "));
console.log("владения:");
for(let i=0;i<6;i++){
  const p=st.powers[i];
  console.log("  "+P[i].padEnd(12)+" систем "+String(p.hold).padStart(3)+" (дом "+p.home+") · сила "+p.str+" · напряжение "+p.tension+
    " · нужды "+Object.values(p.need).join("/")+" · отношения "+p.rel.join(","));
}
console.log("войны сейчас: "+st.wars.map(w=>P[w.a]+"×"+P[w.b]+"@"+w.t0).join(", ")+" · ноты: "+(st.ults||[]).map(u=>P[u.a]+"→"+P[u.b]).join(", "));
console.log("хэш: "+chronHash(st));
if(showLines){
  const wave="gt";
  for(const L of st.lines.slice(-40))console.log("  "+L.N+" "+L.kind+" "+P[L.p]+(L.sys?" "+L.sys:"")+(L.args?" "+JSON.stringify(L.args):""));
}
