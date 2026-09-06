/* ══════════════ у всего есть изготовитель (M369, §19.1, §19.4) ══════════════
   Класс отвечает «кто это»: курьер, рудовоз, фрегат. Изготовитель отвечает на
   другой вопрос — «чей»: курьер Орднунга и курьер Коммуны одного класса и
   разной породы. Это ВТОРАЯ ось генератора, поперечная классу, и она не
   покраска: у изготовителя своя грамматика формы.

   Восемь измерений §19.4, и первые три обязаны читаться силуэтом:
     1 закон профиля — как строится кривая полуширины;
     2 набор схем    — какие планеры класс вправе взять у этого изготовителя;
     3 приметы       — то, что ВСЕГДА торчит за обвод;
     4 стык          — чем навеска встречается с обшивкой;
     5 поверхность   — грунт, полоса, лак, износ;
     6 метки и огни  — номер, логотип, имя, вымпел, солнце, глиф;
     7 подпись тяги  — факел и след (нулевого следа нет: обрубок в четверть
                       длины на ходу читается как «следа не оставляет»);
     8 звук и крен   — тембр и то, как корабль ложится в поворот.

   Восьмое нарочно мало: повадка остаётся классовой, изготовитель меняет КРЕН
   и ЗВУК, но никогда числа, за которые игрок заплатил.

   Шести хватает, седьмого не будет (§20, settled). «Яхта» — класс, а не
   изготовитель: яхта Коммуны и яхта Компании различаются этой же таблицей. */
const HULL_MAKER={
  gt:{ru:"ГЛАВТРАССА",ab:"ГТ",short:"ГТ",
    bw:1.06, len:.97,  prof:"step",    forms:null,
    out:["hook","rad"],            joint:"clamp",
    ground:[220,213,194],tint:.10,stripe:1,gloss:0,  wear:1.3,
    mark:"num",  lights:"amber",
    eng:{col:[255,168,86], w:1.25,trail:1,   soot:1},
    snd:{f:70, bank:1},
    note:"по ГОСТу: ступени, хомут, номер и «изделие»"},
  co:{ru:"Компания",ab:"КП",short:"КП",
    bw:.90,  len:1.04, prof:"capsule", forms:["twin","swept"],
    out:["logofin","runline"],     joint:"flush",
    ground:[246,247,249],tint:.06,stripe:2,gloss:1,  wear:.5,
    mark:"logo", lights:"run",
    eng:{col:[150,205,255],w:.85, trail:.5, twin:1},
    snd:{f:150,bank:1.35},
    note:"белое и гладкое, логотип во весь борт, бегущая строка"},
  or:{ru:"Орднунг",ab:"ОР",short:"ОР",
    bw:1.02, len:1.12, prof:"chamfer", forms:["slab","boxed","twin"],
    out:["plinth","comb"],         joint:"flange",
    ground:[138,144,152],tint:.02,stripe:0,gloss:0,  wear:.8, ribs:1,
    mark:"stencil",lights:"none",
    eng:{col:[240,248,255],w:.6,  trail:.25},
    snd:{f:96, bank:0},
    note:"прямые грани, гребень рёбер, номера по трафарету и ни одной лишней линии"},
  km:{ru:"Коммуна",ab:"КМ",short:"КМ",
    bw:.84,  len:1.18, prof:"swan",    forms:["swept","delta"],
    out:["bowsprit","band","pennant"],joint:"fillet",
    ground:[176,204,234],tint:.18,stripe:1,gloss:.6, wear:.9,
    mark:"name", lights:"band",
    eng:{col:[190,150,255],w:1.1, trail:1.5},
    snd:{f:120,bank:1.5},
    note:"лебединый обвод, бушприт, лента окон и вымпел; имя, а не номер"},
  ra:{ru:"Рассвет",ab:"РС",short:"РС",
    bw:1.28, len:.94,  prof:"modules", forms:["boxed","twin","slab"],
    out:["tanks","braces"],        joint:"weld",
    ground:[198,150,74], tint:.20,stripe:0,gloss:0,  wear:1.6,
    mark:"sun",  lights:"lantern",
    eng:{col:[255,214,120],w:1.15,trail:1.2,spark:1},
    snd:{f:58, bank:1.1},
    note:"сваренный из модулей, баки наружу, охра и чёрное, имя от руки"},
  hf:{ru:"Хай-Фронт",ab:"ХФ",short:"ХФ",
    bw:.72,  len:1.16, prof:"spindle", forms:["trident","xwing"],
    out:["array","under"],         joint:"gap",
    ground:[206,216,224],tint:.05,stripe:0,gloss:.35,wear:.6,
    mark:"glyph",lights:"under",
    eng:{col:[130,255,236],w:.5,  trail:.3, pulse:1},
    snd:{f:210,bank:1.8},
    note:"веретено, антенны длиннее корпуса, свет из-под обшивки, один глиф"}
};
const MAKER_KEYS=Object.keys(HULL_MAKER);
/* ── чей это корпус ──
   Каталог ГЛАВТРАССЫ (`SHIPS`) и её же флот — нулевой изготовитель: игрок
   рождается здесь, и его корабль по умолчанию отсюда (§7.5: «ты по рождению
   уже тут»). Всё остальное — уникальные корпуса, пиратские, чужие — берёт
   изготовителя из своего же seed, один раз и навсегда: `by` остаётся в записи
   корабля, а значит переживает и кэш, и сохранение. */
function makerOf(id,S){
  S=S||(id&&shipData(id));
  if(!S)return "gt";
  if(S.by&&HULL_MAKER[S.by])return S.by;
  if(id&&(SHIPS[id]||(typeof FLEET!=="undefined"&&FLEET&&FLEET[id])))return S.by="gt";
  return S.by=MAKER_KEYS[hashi(S.seed||1,0x4B17,0x11)%MAKER_KEYS.length];
}
function makerRow(by){return HULL_MAKER[by]||HULL_MAKER.gt;}
function makerRu(by){return makerRow(by).ru;}
/* схемы планера: изготовитель сужает выбор класса, но не отменяет его —
   если пересечение пусто, класс сильнее (рудовоз Хай-Фронта существует) */
function makerForms(by,forms){
  const M=makerRow(by);
  if(!M.forms)return forms;
  const keep=forms.filter(f=>M.forms.indexOf(f)>=0);
  /* пустое пересечение — не повод отменить грамматику: рудовоз Хай-Фронта
     существует и собран по-хайфронтовски. Класс остаётся в пропорциях, схема
     принадлежит изготовителю (§19.4, измерение 2) */
  return keep.length?keep:M.forms;
}
/* ── закон профиля ──
   Работает поверх уже построенной кривой полуширины: класс задал пропорции,
   изготовитель задаёт ХАРАКТЕР этой кривой. Меняются только полуширины —
   длина и габарит остаются классовыми, иначе изготовитель начал бы менять
   числа корабля. */
function makerProfile(by,prof,r){
  const M=makerRow(by),N=prof.length-1;
  if(N<2)return prof;
  const w0=prof.map(p=>p[1]);
  const wmax=Math.max.apply(null,w0);
  const q=r||Math.random;
  if(M.prof==="step"){
    /* ступени: не кривая вовсе, а полки. Нос — две узкие, мидель — короб во
       всю ширину, корма — две пониже. Плавных переходов нет ни одного: борт
       «по ГОСТу» набирается из готовых секций, и это видно */
    const b0=.30+q()*.06, b1=.60+q()*.06;
    for(let i=0;i<=N;i++){
      const t=i/N;
      let w;
      if(t<b0)      w=wmax*(t<b0*.5?.40:.66);
      else if(t<b1) w=wmax*1.12;      /* короб амидшип шире всего корпуса */
      else          w=wmax*(t<b1+.18?.72:.50);
      prof[i][1]=Math.max(.7,w);
    }
  }else if(M.prof==="capsule"){
    /* капсула: ровная середина и скруглённые концы — таблетка, а не веретено.
       Ровный участок и отличает её от лебедя Коммуны: у капсулы мидель длинный
       и лежит посередине, у лебедя он один и сдвинут к корме */
    for(let i=0;i<=N;i++){
      const t=i/N;
      const w=t<.20?lerp(.34,1,Math.pow(t/.20,.7)):
              (t>.80?lerp(1,.44,Math.pow((t-.80)/.20,1.3)):1);
      prof[i][1]=Math.max(.7,wmax*w);
    }
  }else if(M.prof==="chamfer"){
    /* прямые участки и фаски: три узла, между ними — отрезок, без кривой */
    const kn=[0,.30+q()*.08,.62+q()*.08,1];
    const kw=[w0[0],wmax*(.92+q()*.08),wmax*(.86+q()*.1),w0[N]];
    for(let i=0;i<=N;i++){
      const t=i/N;
      let s=0;while(s<kn.length-2&&t>kn[s+1])s++;
      const u=(t-kn[s])/Math.max(1e-6,kn[s+1]-kn[s]);
      prof[i][1]=Math.max(.7,lerp(kw[s],kw[s+1],u));
    }
  }else if(M.prof==="swan"){
    /* лебедь: узкая талия у носа, единственный мидель ЗА серединой и долгий
       тонкий сход к корме. Ровного участка нет нигде — этим он и не капсула */
    const waist=.26+q()*.06, belly=.62+q()*.06;
    for(let i=0;i<=N;i++){
      const t=i/N;
      const dip=1-.55*Math.exp(-Math.pow((t-waist)/.10,2));
      const bell=Math.exp(-Math.pow((t-belly)/.30,2));
      prof[i][1]=Math.max(.55,wmax*(.18+.82*bell)*dip);
    }
  }else if(M.prof==="modules"){
    /* модули: три-пять блоков разной ширины, встык, со швом между ними */
    const n=3+Math.floor(q()*3),cut=[];
    for(let k=0;k<n;k++)cut.push(wmax*(.55+q()*.45));
    for(let i=0;i<=N;i++){
      const t=i/N,k=Math.min(n-1,Math.floor(t*n));
      prof[i][1]=Math.max(.7,cut[k]);
    }
  }else if(M.prof==="spindle"){
    /* веретено: симметричный эллипс без выемок вовсе */
    for(let i=0;i<=N;i++){
      const t=i/N;
      prof[i][1]=Math.max(.6,wmax*Math.sqrt(Math.max(.03,1-Math.pow(t*2-1,2)))*.98);
    }
  }
  return prof;
}
/* ── приметы: то, что торчит за обвод ──
   Считаются от габаритов корпуса, а не рисуются на глаз: примета обязана
   выходить ЗА силуэт, иначе на восьми пикселях её нет (§0 закон 7). */
function makerOuts(by,nose,tail,bw,len,seed){
  const M=makerRow(by),out=[],r=rng(hashi(seed||1,0x0DE,7));
  for(const k of (M.out||[])){
    if(k==="hook")      out.push({k,x:tail-len*.16,y:0,l:len*.16,w:bw*.7});
    else if(k==="rad")  out.push({k,x:lerp(nose*.1,tail*.6,.5),y:bw*1.32,l:len*.26,w:bw*.30});
    else if(k==="logofin")out.push({k,x:lerp(nose*.42,tail*.3,r()),y:bw*1.9,l:len*.24,w:bw*.7});
    else if(k==="runline")out.push({k,x:nose*.55,y:bw*1.02,l:len*.62,w:bw*.12});
    else if(k==="plinth") out.push({k,x:nose*(.30+r()*.14),y:0,l:len*.14,w:bw*2.2});
    else if(k==="comb")   out.push({k,x:nose*.34,y:0,l:len*.62,w:bw*2.3});
    else if(k==="bowsprit")out.push({k,x:nose,y:0,l:len*.22,w:bw*.34});
    else if(k==="band")   out.push({k,x:nose*.42,y:bw*.9,l:len*.5,w:bw*.30});
    else if(k==="pennant")out.push({k,x:tail+len*.04,y:0,l:len*.16,w:bw*.7});
    else if(k==="tanks")  out.push({k,x:lerp(nose*.2,tail*.5,.4+r()*.2),y:bw*1.7,l:len*.3,w:bw*.9});
    else if(k==="braces") out.push({k,x:lerp(nose*.3,tail*.4,r()),y:bw*1.3,l:len*.16,w:bw*.5});
    else if(k==="array")  out.push({k,x:nose*.3,y:bw*1.5,l:len*1.06,w:bw*.16});
    else if(k==="under")  out.push({k,x:lerp(nose*.5,tail*.6,.5),y:bw*1.06,l:len*.5,w:bw*.16});
  }
  return out;
}
/* ── стык: чем навеска встречается с обшивкой (§19.4, измерение 4) ──
   Одна короткая фигура в точке, где деталь садится на борт. Дёшево, а породу
   держит: у Орднунга фланец с болтами, у Рассвета сварной шов, у Хай-Фронта
   тёмный зазор — деталь висит в пикселе от корпуса. */
function makerJoint(h,x,y,s){
  const J=makerRow(h.by).joint;
  const u=Math.max(.5,h.bw*.24);
  ctx.save();
  if(J==="clamp"){
    ctx.strokeStyle=rgba(h.iron,.9);ctx.lineWidth=.55;
    ctx.beginPath();ctx.rect(x-u*.7,y-u*.5*s-(s>0?0:u*.5),u*1.4,u*.5);ctx.stroke();
  }else if(J==="flush"){
    ctx.strokeStyle=rgba(h.lite,.28);ctx.lineWidth=.4;
    ctx.beginPath();ctx.moveTo(x-u,y);ctx.quadraticCurveTo(x,y-u*.4*s,x+u,y);ctx.stroke();
  }else if(J==="flange"){
    ctx.fillStyle=rgba(h.iron,.95);
    ctx.fillRect(x-u*.8,y-u*.22,u*1.6,u*.44);
    ctx.fillStyle=rgba(h.lite,.5);
    for(let k=0;k<4;k++)ctx.fillRect(x-u*.62+k*u*.4,y-u*.1,u*.14,u*.2);
  }else if(J==="fillet"){
    ctx.strokeStyle=rgba(h.lite,.35);ctx.lineWidth=.5;
    ctx.beginPath();ctx.arc(x,y,u*.8,0,Math.PI,s>0);ctx.stroke();
  }else if(J==="weld"){
    ctx.strokeStyle="rgba(40,32,26,.75)";ctx.lineWidth=.7;
    ctx.beginPath();
    for(let k=0;k<5;k++)ctx.lineTo(x-u+k*u*.5,y+(k&1?u*.16:-u*.16)*s);
    ctx.stroke();
  }else if(J==="gap"){
    ctx.strokeStyle="rgba(0,0,0,.7)";ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(x-u*.9,y);ctx.lineTo(x+u*.9,y);ctx.stroke();
  }
  ctx.restore();
}
/* ── приметы и огни на корпусе ──
   Рисуется после тела и до общего света: примета — часть корабля, а не
   наклейка поверх кадра. */
function makerDraw(h){
  const M=makerRow(h.by),u=h.bw;
  for(const o of (h.outs||[])){
    const sides=(o.k==="hook"||o.k==="plinth"||o.k==="comb"||o.k==="bowsprit"||o.k==="pennant")?[0]:[1,-1];
    for(const s of sides){
      const y=o.y*(s||1);
      ctx.save();
      if(o.k==="hook"){
        /* буксирный крюк: ГЛАВТРАССА возит чужое, и крюк у неё всегда */
        ctx.strokeStyle=rgba(h.iron,1);ctx.lineWidth=Math.max(.6,u*.18);
        ctx.beginPath();ctx.moveTo(o.x+o.l,0);ctx.lineTo(o.x,0);
        ctx.arc(o.x,o.w*.3,o.w*.3,-Math.PI/2,Math.PI*.9);ctx.stroke();
      }else if(o.k==="rad"){
        ctx.fillStyle=rgba(h.radm,1);ctx.strokeStyle=rgba(h.iron,.8);ctx.lineWidth=.4;
        ctx.beginPath();ctx.rect(o.x-o.l*.5,y-o.w*.5*(s||1)-(s>0?0:o.w*.5),o.l,o.w*.5);
        ctx.fill();ctx.stroke();
        makerJoint(h,o.x,y*.72,s||1);
      }else if(o.k==="logofin"){
        /* киль с логотипом: у Компании он и есть вывеска */
        ctx.fillStyle=rgba(h.col,1);ctx.strokeStyle=rgba(h.dark,.8);ctx.lineWidth=.45;
        ctx.beginPath();
        ctx.moveTo(o.x+o.l*.5,y*.62);ctx.lineTo(o.x-o.l*.5,y);
        ctx.lineTo(o.x-o.l*.1,y*1.02);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle="rgba(70,130,220,.95)";
        ctx.beginPath();ctx.arc(o.x-o.l*.14,y*.86,Math.max(.5,u*.16),0,TAU);ctx.fill();
        makerJoint(h,o.x,y*.6,s||1);
      }else if(o.k==="runline"){
        ctx.fillStyle="rgba(120,190,255,.55)";
        ctx.fillRect(o.x-o.l,y-o.w*.5,o.l,o.w);
        ctx.fillStyle="rgba(200,235,255,.9)";
        for(let k=0;k<5;k++)ctx.fillRect(o.x-o.l+k*o.l*.2+((G.t*.6)%(o.l*.2)),y-o.w*.4,o.l*.05,o.w*.8);
      }else if(o.k==="plinth"){
        /* тумба под турель: Орднунг возит её даже на грузовике */
        ctx.fillStyle=rgba(h.body,1);ctx.strokeStyle=rgba(h.iron,.9);ctx.lineWidth=.5;
        ctx.beginPath();ctx.rect(o.x-o.l*.5,-o.w*.5,o.l,o.w);ctx.fill();ctx.stroke();
        ctx.strokeStyle=rgba(h.iron,1);ctx.lineWidth=Math.max(.6,u*.16);
        ctx.beginPath();ctx.moveTo(o.x,0);ctx.lineTo(o.x+o.l*.9,0);ctx.stroke();
        makerJoint(h,o.x-o.l*.5,-o.w*.5,1);
      }else if(o.k==="comb"){
        /* гребень рёбер по хребту: каждые восемь пикселей, ровно */
        ctx.strokeStyle=rgba(h.iron,.85);ctx.lineWidth=.5;
        const n=Math.max(4,Math.round(o.l/Math.max(2,u*.7)));
        for(let k=0;k<n;k++){
          const x=o.x-o.l*(k/n);
          ctx.beginPath();ctx.moveTo(x,-o.w*.5);ctx.lineTo(x,o.w*.5);ctx.stroke();
        }
      }else if(o.k==="bowsprit"){
        /* бушприт: штанга ВПЕРЁД, ни у кого больше её нет. Сходит на конус и
           кончается шаром — иначе на листе это была игла шприца */
        ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=Math.max(1,o.w);
        ctx.beginPath();ctx.moveTo(o.x,0);ctx.lineTo(o.x+o.l*.7,0);ctx.stroke();
        ctx.lineWidth=Math.max(.6,o.w*.55);
        ctx.beginPath();ctx.moveTo(o.x+o.l*.7,0);ctx.lineTo(o.x+o.l,0);ctx.stroke();
        ctx.fillStyle=rgba(h.lite,.85);
        ctx.beginPath();ctx.arc(o.x+o.l,0,Math.max(.6,o.w*.8),0,TAU);ctx.fill();
        /* и растяжки к скулам: без них штанга висит в пустоте */
        ctx.strokeStyle=rgba(h.lite,.45);ctx.lineWidth=.4;
        for(const q of [1,-1]){
          ctx.beginPath();ctx.moveTo(o.x+o.l*.7,0);ctx.lineTo(o.x-o.l*.3,q*h.bw*.55);ctx.stroke();
        }
      }else if(o.k==="band"){
        ctx.fillStyle="rgba(190,230,255,.5)";
        ctx.fillRect(o.x-o.l,y-o.w*.5,o.l,o.w*.6);
        ctx.strokeStyle=rgba(h.lite,.5);ctx.lineWidth=.35;
        ctx.strokeRect(o.x-o.l,y-o.w*.5,o.l,o.w*.6);
      }else if(o.k==="pennant"){
        /* вымпел: у Коммуны он вместо номера */
        ctx.strokeStyle=rgba(h.lite,.7);ctx.lineWidth=.45;
        ctx.beginPath();ctx.moveTo(o.x,0);ctx.lineTo(o.x-o.l,0);ctx.stroke();
        ctx.fillStyle="rgba(226,238,255,.9)";
        ctx.beginPath();
        ctx.moveTo(o.x-o.l,-o.w*.34);ctx.lineTo(o.x-o.l*.45,0);
        ctx.lineTo(o.x-o.l,o.w*.34);ctx.closePath();ctx.fill();
      }else if(o.k==="tanks"){
        /* баки наружу: у Рассвета внутренности снаружи, и это его порода */
        ctx.fillStyle=rgba(h.foil,1);ctx.strokeStyle="rgba(40,32,26,.8)";ctx.lineWidth=.5;
        ctx.beginPath();ctx.rect(o.x-o.l*.5,y-o.w*.5*(s||1)-(s>0?0:o.w*.5),o.l,o.w*.5);
        ctx.fill();ctx.stroke();
        makerJoint(h,o.x,y*.7,s||1);
      }else if(o.k==="braces"){
        ctx.strokeStyle=rgba(h.iron,.95);ctx.lineWidth=Math.max(.5,u*.12);
        ctx.beginPath();
        ctx.moveTo(o.x-o.l*.5,u*.6*(s||1));ctx.lineTo(o.x+o.l*.5,y);
        ctx.moveTo(o.x+o.l*.5,u*.6*(s||1));ctx.lineTo(o.x-o.l*.5,y);
        ctx.stroke();
      }else if(o.k==="array"){
        /* антенны длиннее корпуса (§19.4): но это МАЧТА с траверсами и
           тарелкой на конце, а не волосок во весь лист — тонкая линия длиной
           в полтора корпуса читалась царапиной на снимке, а не антенной */
        ctx.strokeStyle=rgba(h.lite,.95);ctx.lineWidth=Math.max(.9,o.w);
        ctx.beginPath();
        ctx.moveTo(o.x-o.l*.5,y*.5);ctx.lineTo(o.x+o.l*.5,y*.5);ctx.stroke();
        ctx.lineWidth=Math.max(.6,o.w*.7);
        for(let k=1;k<5;k++){
          const x=o.x-o.l*.5+o.l*(k/5);
          ctx.beginPath();ctx.moveTo(x,y*.5-u*(.34+k*.06));ctx.lineTo(x,y*.5+u*(.34+k*.06));ctx.stroke();
        }
        ctx.strokeStyle=rgba(h.lite,.85);ctx.lineWidth=Math.max(.5,o.w*.6);
        ctx.beginPath();ctx.arc(o.x+o.l*.5,y*.5,u*.5,-1.2,1.2);ctx.stroke();
      }else if(o.k==="under"){
        /* свет из-под обшивки: не огонь и не окно — полоса под бортом */
        const g=ctx.createLinearGradient(0,y-o.w,0,y+o.w);
        g.addColorStop(0,"rgba(255,90,80,0)");
        g.addColorStop(.5,"rgba(255,96,86,.75)");
        g.addColorStop(1,"rgba(255,90,80,0)");
        ctx.fillStyle=g;ctx.fillRect(o.x-o.l*.5,y-o.w,o.l,o.w*2);
      }
      ctx.restore();
    }
  }
  /* ── огни изготовителя ── одна семья на всех: не гирлянда, а подпись */
  if(M.lights==="amber"){
    ctx.fillStyle="rgba(255,190,90,.85)";
    for(const s of [1,-1]){
      ctx.beginPath();ctx.arc(h.nose*.42,profW(h.prof,h.nose*.42)*.55*s,Math.max(.5,u*.14),0,TAU);ctx.fill();
    }
  }else if(M.lights==="lantern"){
    const x=h.nose*.5;
    ctx.fillStyle="rgba(255,214,140,.9)";
    ctx.beginPath();ctx.arc(x,-profW(h.prof,x)*.7,Math.max(.6,u*.2),0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(70,52,30,.8)";ctx.lineWidth=.4;ctx.stroke();
  }
}
/* ── метки: номер, логотип, имя, солнце, глиф (измерение 6) ──
   Каждый изготовитель метит корпус по-своему, и это второй после силуэта
   признак: на восьми пикселях его не видно, на тридцати — уже да. */
function makerMarks(h){
  const M=makerRow(h.by),S=h.seed,u=Math.max(1.2,h.bw*.5);
  const mid=lerp(h.nose*.6,h.tail*.4,.5);
  ctx.save();
  if(M.mark==="num"){
    /* номер и слово «изделие»: у ГЛАВТРАССЫ борт — это накладная */
    ctx.fillStyle="rgba(30,28,26,.55)";
    const n=(S%900+100)|0;
    ctx.font=u.toFixed(1)+"px monospace";ctx.textAlign="center";
    ctx.fillText(String(n),mid,u*.35);
  }else if(M.mark==="logo"){
    /* логотип во весь борт: круг с хвостом, читается пятном */
    ctx.strokeStyle="rgba(60,120,210,.75)";ctx.lineWidth=Math.max(.5,u*.22);
    ctx.beginPath();ctx.arc(mid,0,u*.9,-2.1,1.4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mid+u*.5,u*.5);ctx.lineTo(mid+u*1.5,u*.9);ctx.stroke();
  }else if(M.mark==="stencil"){
    /* трафарет в трёх местах и ни одного имени */
    ctx.fillStyle="rgba(20,22,24,.7)";
    ctx.font=(u*.8).toFixed(1)+"px monospace";ctx.textAlign="center";
    const n=(S%90+10)|0;
    for(const t of [.24,.52,.8]){
      const x=lerp(h.nose*.86,h.tail*.86,t);
      ctx.fillText(String(n)+"-"+((S>>>(3+t*10))&7),x,u*.3);
    }
  }else if(M.mark==="name"){
    /* имя, и никогда номер */
    ctx.fillStyle="rgba(40,60,90,.6)";
    ctx.font="italic "+(u*.85).toFixed(1)+"px serif";ctx.textAlign="center";
    ctx.fillText("«"+String.fromCharCode(65+(S%26))+"»",mid,u*.3);
  }else if(M.mark==="sun"){
    /* солнце от руки: круг и лучи, нарочно неровные */
    ctx.strokeStyle="rgba(60,36,18,.8)";ctx.lineWidth=Math.max(.5,u*.16);
    ctx.beginPath();ctx.arc(mid,0,u*.55,0,TAU);ctx.stroke();
    for(let k=0;k<7;k++){
      const a=k/7*TAU+((S>>>k)&3)*.06;
      ctx.beginPath();
      ctx.moveTo(mid+Math.cos(a)*u*.7,Math.sin(a)*u*.7);
      ctx.lineTo(mid+Math.cos(a)*u*1.05,Math.sin(a)*u*1.05);ctx.stroke();
    }
  }else if(M.mark==="glyph"){
    /* один глиф и версия: Хай-Фронт метит корпус так же, как прошивку */
    ctx.strokeStyle="rgba(210,60,50,.85)";ctx.lineWidth=Math.max(.5,u*.2);
    ctx.beginPath();ctx.arc(mid,0,u*.42,0,TAU);ctx.stroke();
    ctx.fillStyle="rgba(40,44,48,.6)";
    ctx.font=(u*.55).toFixed(1)+"px monospace";ctx.textAlign="center";
    ctx.fillText("v"+(1+(S%4))+"."+(S%10),mid+u*1.5,u*.2);
  }
  ctx.restore();
}
/* подпись тяги (измерение 7) и крен со звуком (измерение 8) */
function makerFlame(by){return makerRow(by).eng;}
function makerBank(by){return makerRow(by).snd.bank;}
function makerHum(by){return makerRow(by).snd.f;}
