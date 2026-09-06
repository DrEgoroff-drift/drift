/* ══════════════ формуляр планеты (M400, DESIGN-base §21) ══════════════
   База — не одна и та же головоломка, повторённая двадцать раз. Головоломку
   задаёт ПЛАНЕТА, и выбор планеты — это и есть выбор сложности: не ползунком в
   меню, а тем, куда полетел. В «Дрейфе» не будет ползунка сложности; в нём есть
   галактика, где на некоторых камнях можно и остаться.

   Восемь ручек, и все они ВЫВОДЯТСЯ из того, что у планеты уже есть: тип,
   звезда, семя, залежь. Ничего нового не хранится — формуляр считается, как
   считается всё остальное в этой игре.

   Главное чтение таблицы: ДАРОВОЕ НА МИРЕ НИКОГДА НЕ ТО, ЧТО ДЕЛАЕТ ЕГО
   БОГАТЫМ. Спокойная планета бедна; планета, которая платит, старается вас
   убить. Это и есть вся кривая риска, и рисует её таблица миров, а не рука. */
const DIAL_WORLD={
  /*            тепло свет давл тяж  ветер дрожь лёд порода */
  rocky:    {heat: 0,light:1,press:0,grav:1,   wind:.7,quake:.3,ice:.4,ore:2},
  terran:   {heat: 0,light:1,press:0,grav:1,   wind:.5,quake:.2,ice:1.2,ore:1},
  ice:      {heat:-2,light:.8,press:0,grav:.9, wind:1.3,quake:.2,ice:2,ore:2},
  desert:   {heat: 1,light:1.6,press:0,grav:1, wind:2,quake:.4,ice:0,ore:2},
  ocean:    {heat:-1,light:1,press:1,grav:1.1, wind:.9,quake:.3,ice:2,ore:1},
  volcanic: {heat: 2,light:.9,press:0,grav:1.2,wind:1.4,quake:2,ice:0,ore:4},
  toxic:    {heat: 1,light:.7,press:2,grav:1,  wind:1.5,quake:.6,ice:.3,ore:4},
  gas:      {heat: 0,light:1,press:1,grav:.5,  wind:0,quake:0,ice:.6,ore:1}
};
const DIAL_KEYS=["heat","light","press","grav","wind","quake","ice","ore"];
const DIAL_RU={heat:"тепло",light:"свет",press:"давление",grav:"тяжесть",
  wind:"ветер",quake:"дрожь",ice:"лёд",ore:"порода"};
const PROBE_COST=300;        /* зонд: пять ручек из восьми */
const PROBE_SHOW=5;
/* ── сам формуляр ──
   Тип задаёт основание, семя — разброс, звезда — свет, участок — ±1 к породе и
   льду (§21.4: две базы на одной планете — не одна и та же база). */
function baseDial(sx,sy,idx,type){
  const sys=(typeof getSystem==="function")?getSystem(sx,sy):null;
  const p=(sys&&sys.planets&&sys.planets[idx|0])||null;
  const t=type||(p&&p.type)||"rocky";
  /* тип входит в КЛЮЧ, а не только в счёт: формуляр от него и зависит, и кэш,
     который его не различает, врёт при первом же вопросе про другой мир */
  const key=(sx|0)+","+(sy|0)+":"+(idx|0)+":"+t;
  if(!G._dial)G._dial={};
  if(G._dial[key])return G._dial[key];
  const W=DIAL_WORLD[t]||DIAL_WORLD.rocky;
  const r=rng(hashi((sx|0)*613+(sy|0),(idx|0)*29+11,0x0D1A1));
  const jit=(a)=>(r()-.5)*a;
  const lum=(sys&&sys.cls&&sys.cls.lum)||1;
  const D={
    heat: clamp(W.heat+jit(1),-3,3),
    light:clamp(W.light*lum+jit(.3),0,2),
    press:clamp(W.press+jit(.5),0,2),
    grav: clamp(W.grav+jit(.35),.5,2),
    wind: clamp(W.wind+jit(.5),0,2),
    quake:clamp(W.quake+jit(.5),0,2),
    ice:  clamp(W.ice+jit(.6),0,2),
    ore:  clamp(Math.round(W.ore+jit(1.6)),1,5)
  };
  D.type=t;D.key=key;
  return G._dial[key]=D;
}
function baseDialOf(B){return B?baseDial(B.sx,B.sy,B.idx,B.type):null;}
/* ── что видно до закладки (§21.3) ──
   С орбиты — три слова и ни одного числа. Зонд — пять ручек. Высадка — все
   восемь. Первая ошибка каждого игрока — заложить базу по трём словам, и это
   единственная плата за урок. */
function probeKey(sx,sy,idx){return (sx|0)+","+(sy|0)+":"+(idx|0);}
function probeHas(sx,sy,idx){
  return !!(G.probed&&G.probed[probeKey(sx,sy,idx)]);
}
function probeBuy(sx,sy,idx){
  if(probeHas(sx,sy,idx))return true;
  if(G.credits<PROBE_COST){say("Зонд стоит "+PROBE_COST+" кр");return false;}
  G.credits-=PROBE_COST;
  if(!G.probed)G.probed={};
  G.probed[probeKey(sx,sy,idx)]=1;
  tell("tech","Зонд ушёл к планете","ЗОНД\n"+PROBE_COST+" кр\nпять ручек из восьми — на месте будут все");
  return true;
}
/* высадка: игрок стоит на этой поверхности — значит мерил своими руками */
function dialOnFoot(sx,sy,idx){
  return !!(G.mode==="surface"&&G.surf&&G.surf.p&&(G.surf.p.idx|0)===(idx|0)&&
    (G.sx|0)===(sx|0)&&(G.sy|0)===(sy|0));
}
function dialLevel(sx,sy,idx){
  if(dialOnFoot(sx,sy,idx))return 3;
  if(probeHas(sx,sy,idx))return 2;
  return 1;
}
/* три слова с орбиты: ни одного числа, и этого мало — так и задумано */
function dialWords(D){
  const h=D.heat>=1?"жарко":(D.heat<=-1?"холодно":"терпимо");
  const w=D.wind>=1.4?"ветрено":(D.wind<=.6?"тихо":"ветер бывает");
  const o=D.ore>=4?"порода богатая":(D.ore<=1?"порода пустая":"порода обычная");
  return h+" · "+w+" · "+o;
}
function dialNum(v,k){
  if(k==="ore")return String(v|0);
  if(k==="heat")return (v>0?"+":"")+v.toFixed(1);
  return v.toFixed(1);
}
/* строка формуляра по тому, сколько за неё заплачено */
function dialLine(sx,sy,idx){
  const D=baseDial(sx,sy,idx);
  const lvl=dialLevel(sx,sy,idx);
  if(lvl<=1)return "С ОРБИТЫ: "+dialWords(D);
  const keys=lvl>=3?DIAL_KEYS:DIAL_KEYS.slice(0,PROBE_SHOW);
  return (lvl>=3?"ЗАМЕР НА МЕСТЕ: ":"ЗОНД: ")+
    keys.map(k=>DIAL_RU[k]+" "+dialNum(D[k],k)).join(" · ")+
    (lvl>=3?"":" · остальное — только с высадки");
}
/* ── что ручки делают ── */
function dialHeat(B){const D=baseDialOf(B);return D?Math.round(D.heat*10):0;}
function dialLight(B){const D=baseDialOf(B);return D?D.light:1;}
function dialLeak(B){                       /* сколько воздуха уходит за смену */
  const D=baseDialOf(B);
  return D?Math.round(D.press*2*Math.max(1,(typeof baseCrewN==="function")?baseCrewN(B):1)/2):0;
}
function dialGrav(B){const D=baseDialOf(B);return D?D.grav:1;}
function dialWind(B){const D=baseDialOf(B);return D?D.wind:1;}
function dialQuake(B){const D=baseDialOf(B);return D?D.quake:1;}
function dialIceFree(B){const D=baseDialOf(B);return !!(D&&D.ice>=1.5);}
function dialOreMul(B){const D=baseDialOf(B);return D?(.7+D.ore*.15):1;}
/* тяжесть: тяжёлый мир дороже строить и лучше бурить (§21.1) */
function dialBuildMul(B){const g=dialGrav(B);return clamp(.8+ (g-1)*.5,.7,1.5);}
