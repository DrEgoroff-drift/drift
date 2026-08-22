/* ══════════════ бортовой журнал ══════════════ */
/* сообщения по центру экрана живут пару секунд, журнал помнит их между сеансами */
const LOG_MAX=90;
let logOpen=false;
function logAdd(kind,text){
  G.log.push({t:Date.now(),k:kind,s:text});
  if(G.log.length>LOG_MAX)G.log.splice(0,G.log.length-LOG_MAX);
  if(logOpen)renderLog(); else{G.logNew=(G.logNew|0)+1;logBtnLabel();}
}
/* сказать и записать одним движением */
const TELL_SFX={money:{f:660,to:990,d:.13,v:.3},tech:{f:520,to:1180,d:.2,v:.3},
                kill:{f:880,to:520,d:.12,v:.26},warn:{f:300,to:190,d:.2,v:.3}};
function tell(kind,short,full){
  const s=TELL_SFX[kind];
  if(s)sfx("ui",s);
  say(full||short);logAdd(kind,short);
}
function logTime(ms){
  const d=new Date(ms);
  return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2);
}
/* Счётчик непрочитанного — значок внутри пункта меню, а не переписанная
   подпись: у пункта есть ещё и вторая строка, и затирать её нельзя. */
function logBtnLabel(){
  const b=document.getElementById("logbtn");if(!b)return;
  const em=b.querySelector("em")||b;
  em.textContent="ЖУРНАЛ";
  if(G.logNew){
    const i=document.createElement("i");
    i.textContent=G.logNew>99?"99+":G.logNew;
    em.appendChild(i);
  }
  /* точка на кнопке МЕНЮ: ящик закрыт, а внутри что-то новое */
  const mb=document.getElementById("menubtn");
  if(mb)mb.classList.toggle("on",!!G.logNew);
}
function renderLog(){
  const box=document.getElementById("loglist");
  box.textContent="";
  /* ── дела впереди ленты ──
     Лента отвечает на вопрос «что было», журнал — «что я должен». Второе важнее,
     поэтому оно сверху, и по строке можно ткнуть: курс ляжет на карту. */
  if(typeof questSync==="function"){
    questSync();
    const open=questOpen();
    if(open.length){
      const head=document.createElement("div");
      head.className="li dim";
      const hs=document.createElement("span");
      hs.textContent="ДЕЛА · "+open.length+" · ТКНИТЕ ПО СТРОКЕ — КУРС НА КАРТЕ";
      head.appendChild(hs);box.appendChild(head);
      for(const q of open){
        const row=document.createElement("div");
        row.className="li quest"+(q.sx!==null?" go":"");
        const em=document.createElement("em");
        em.textContent=q.sx!==null?(q.sx+":"+q.sy):"—";
        const sp=document.createElement("span");
        const left=questLeft(q);
        sp.innerHTML="<b>"+q.ru+"</b>"+(q.from?" <i>· "+q.from+"</i>":"")+
          (left?" <b style='color:#f2b25c'>· "+left+"</b>":"")+
          (q.note?"<br><i>"+q.note+"</i>":"")+
          (q.reward?"<br><i style='color:#8fd08a'>награда: "+q.reward+"</i>":"");
        row.appendChild(em);row.appendChild(sp);
        if(q.sx!==null){
          row.style.cursor="pointer";
          row.onclick=()=>{questGoto(q);};
        }
        box.appendChild(row);
      }
      const sep=document.createElement("div");
      sep.className="li dim";
      const ss=document.createElement("span");ss.textContent="ЛЕНТА СОБЫТИЙ";
      sep.appendChild(ss);box.appendChild(sep);
    }
  }
  if(!G.log.length){
    const e=document.createElement("div");e.className="li dim";
    const s=document.createElement("span");s.textContent="пока пусто";
    e.appendChild(s);box.appendChild(e);return;
  }
  for(let i=G.log.length-1;i>=0;i--){
    const it=G.log[i];
    const row=document.createElement("div");row.className="li "+(it.k||"");
    const em=document.createElement("em");em.textContent=logTime(it.t);
    const sp=document.createElement("span");sp.textContent=it.s;
    row.appendChild(em);row.appendChild(sp);box.appendChild(row);
  }
}
function toggleLog(open){
  logOpen=open===undefined?!logOpen:open;
  document.getElementById("logwin").classList.toggle("open",logOpen);
  if(logOpen){G.logNew=0;renderLog();}
  logBtnLabel();
}
function modCost(k,lvl){return Math.round(MODS[k].base*Math.pow(lvl+1,1.55));}
function addRes(k,n){
  const cap=stat().cargoMax,free=cap-held();
  const t=Math.min(n,free);if(t>0)G.cargo[k]+=t;return t;
}
/* штучная добыча: дробный бонус обогащения копится, чтобы +18% не съедалось округлением */
let refineBank=0;
function minedUnit(k){
  sfx("drill");
  refineBank+=stat().refine;
  const n=Math.floor(refineBank);refineBank-=n;
  if(n>0&&typeof placeNote==="function")placeNote("take",n);   // место помнит, что вырыли (11d)
  return addRes(k,n);
}
