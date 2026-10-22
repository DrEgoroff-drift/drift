/* ══════════════ абордаж: строка у пульта — плашкой (22.10) ══════════════
   Подсказка рейда (#prompt) висела янтарным текстом без подложки над полом ангара и на светлом
   полу не читалась. В рейде она встаёт плашкой, как строка спуска (style.css body.raidui).
   Класс ставится сменой режима, без чтения DOM в кадре.
   Первая строка «ДЕЙСТВИЕ — …» на плашке не стоит: она только повторила бы кнопку. Глагол
   кнопки hud() берёт из G.prompt (27z, HUD_PROMPT) — его кладём в тот же разбор заранее, а на
   время hud() в G.prompt остаётся одно содержимое плашки; после — подсказка снова целая. */
let RAID_UI=false;
const RAIDUI_HOOKS=[
  ["hud",O=>function(){
    const on=G.mode==="raid";if(on!==RAID_UI){RAID_UI=on;document.body.classList.toggle("raidui",on);}
    const m=on?/^ДЕЙСТВИЕ\s*—\s*([^\n·]+)\n([\s\S]+)$/.exec(String(G.prompt||"")):null;
    if(!m)return O.apply(this,arguments);
    const full=G.prompt,PK=HUD_PROMPT,k=G.mode+"|"+m[2];
    if(PK.k!==k){PK.k=k;PK.dup=false;PK.lbl=[m[1].trim(),true];}
    G.prompt=m[2];
    try{return O.apply(this,arguments);}finally{G.prompt=full;}}]
];
for(const [n,mk] of RAIDUI_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("28u-raid-ui: нет крючка "+n);window[n]=mk(O);}
