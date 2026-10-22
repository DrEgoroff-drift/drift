/* ══════════════ абордаж: строка у пульта — плашкой (22.10) ══════════════
   Подсказка рейда (#prompt) висела янтарным текстом без подложки над полом ангара и на светлом
   полу не читалась. В рейде она встаёт плашкой, как строка спуска (style.css body.raidui).
   Класс ставится сменой режима, без чтения DOM в кадре. */
let RAID_UI=false;
const RAIDUI_HOOKS=[
  ["hud",O=>function(){const r=O.apply(this,arguments);
    const on=G.mode==="raid";if(on!==RAID_UI){RAID_UI=on;document.body.classList.toggle("raidui",on);}
    return r;}]
];
for(const [n,mk] of RAIDUI_HOOKS){const O=window[n];if(typeof O!=="function")throw new Error("28u-raid-ui: нет крючка "+n);window[n]=mk(O);}
