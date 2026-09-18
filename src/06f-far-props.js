/* ══════════════ свойства дальних товаров: одно на товар (M468, DESIGN-resources §2, law 4) ══════════════
   Далёкий товар — интересный груз, а не число:
   • ТЯЖЁЛЫЙ — осмий занимает в трюме две единицы места, нейтронная крошка пять
     (held() считает вес, addRes берёт, сколько влезает по весу);
   • ХРУПКИЙ — янтарь: каждое попадание по корпусу колет пятую часть в
     «крошку», и её берут по трети цены («принимаем по весу, вес — наш»);
   • СКОРОПОРТЯЩИЙСЯ И ОПАСНЫЙ — антивещество в ловушке: без питания от
     реактора теряет процент в минуту, и трюм говорит об этом вслух — это
     единственный груз, который разговаривает; корпус ниже пятой части —
     ловушки не держат, груз уходит вспышкой и бьёт по корпусу. */
const FAR_W={osmium:2,neutron:5};                 /* место в трюме на единицу */
function resW(k){return FAR_W[k]||1;}
/* янтарь колется от попадания */
function farCargoHit(){
  const a=G.cargo.amber|0;
  if(a>0){
    const n=Math.max(1,Math.ceil(a*.2));
    G.cargo.amber=a-n;G.cargo.amberchip=(G.cargo.amberchip|0)+n;
    logAdd("warn","Янтарь треснул от удара: "+n+" "+pl3(n,"кусок","куска","кусков")+" в крошку");
  }
  const st=stat();
  if((G.cargo.antimatter|0)>0&&G.hull<st.hullMax*.2){
    const n=G.cargo.antimatter|0;G.cargo.antimatter=0;
    G.hull=Math.max(0,G.hull-st.hullMax*.1);   /* удар, а не приговор: ниже пятой — ещё живы */
    logAdd("bad","Ловушки не удержали антивещество: "+n+" ед. ушло вспышкой, корпус −10 %");
    say("ЛОВУШКИ НЕ ДЕРЖАТ\nгруз ушёл вспышкой",140);
    if(typeof hitFx==="function")hitFx(1);
    if(G.hull<=0){wreck("антивещество в трюме");return true;}
  }
  return false;
}
/* ловушки: питание от реактора или процент в минуту */
let FAR_TRAP_BANK=0,FAR_TRAP_SAID=0;
function farTrapTick(dt){
  const n=G.cargo.antimatter|0;if(n<=0){FAR_TRAP_BANK=0;return;}
  const fed=((G.mods&&G.mods.weapon)|0)>0&&(G.energy||0)>1;
  if(fed){G.energy-=.004*dt;return;}
  FAR_TRAP_BANK+=n*.01*dt/3600;                   /* один процент за минуту игры */
  if(FAR_TRAP_BANK>=1){
    const k=Math.floor(FAR_TRAP_BANK);FAR_TRAP_BANK-=k;G.cargo.antimatter=Math.max(0,n-k);
    if(now()-FAR_TRAP_SAID>60000){FAR_TRAP_SAID=now();
      say("Ловушки без питания\nминус процент в минуту · осталось "+(G.cargo.antimatter|0)+" ед.",120);}
  }
}
