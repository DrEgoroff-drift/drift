/* ══════════════ подглядка: луг, который помнит свет ══════════════
   Единственное место, где «Долгий Ход» ВИДНО, а не вычитано. Всё остальное в
   игре — показания: зарубка, спутник, трепло. Здесь свидетель не говорит, а
   повторяет: мат из плоских пластинок держит упавший на него свет и отдаёт его
   обратно, когда стемнеет. Стемнеть же на планете может только в затмение —
   и вот ради этого и заведён календарь (M107). Игрок может простоять на нужном
   лугу час и не увидеть ничего; обелиск, называющий дату, становится самой
   дорогой вещью в трюме. Это и есть выплата всей небесной механики.

   ПРАВИЛА ФАЙЛА:
   1. Ни одной подписи к тому, что показано. Фигура, сколько их, что несли,
      куда шли — игрок читает это сам или не читает вовсе. Подписан только сам
      мат («ПОДГЛЯДКА»), иначе луг неотличим от травы и его никто не найдёт.
   2. Луг растёт только там, где затмение вообще возможно: без спутника мир не
      темнеет никогда, и обещание, которое нечем оплатить, — ложь.
   3. Показ детерминирован от зерна планеты. Сцена не бросается заново при
      каждом заходе: тот же мир — те же четверо и тот же ящик.
   4. Своего художественного языка не заводим. Фигуры сложены по пропорциям
      рубки (`hqFigure`: три с половиной головы, плечи шире таза, ноги врозь),
      уменьшенным до человеческого роста поверхности, и нарисованы одним
      светом на «lighter» — это память о свете, а не второй астронавт.
   5. Плата — кусок отчёта (12q), и берётся он у луга как у всякого свидетеля:
      достоять полный проход, стоя в мате. Не «нашёл», а «досмотрел». */

const PEEP_PASS=430;                  /* кадров на проход: затмение живёт около 19 с */
const PEEP_R=150;                     /* полуширина мата */
const PEEP_LOAD=["ящик","бочка","шест","носилки",""];
const PEEP_LIT=[150,235,225];         /* холодный свет памяти */

/* ── где он растёт ──
   Редкость: примерно каждый девятый мир со спутником. Проверка про спутники —
   не украшение, а правило 2. */
function peepHere(p){
  if(!p||p.type==="gas")return false;
  if(typeof glowIsCore==="function"&&glowIsCore(p))return true;   /* ядро уезда (11i): луг есть всегда */
  if(!p.moons||!p.moons.length)return false;
  return hashi(p.seed,0x9EE9,3)%9===0;
}
/* ── что он повторяет ──
   Одна сцена на планету: сколько их шло, что несли, в какую сторону и был ли
   такт — тот, кто остановился и обернулся. Никаких слов. */
function peepScene(p){
  const r=rng(hashi(p.seed,0x5EE1,13));
  const n=1+Math.floor(r()*4);
  let load=PEEP_LOAD[Math.floor(r()*PEEP_LOAD.length)];
  if((load==="носилки"||load==="шест")&&n<2)load="ящик";
  return {n,load,dir:r()<.5?-1:1,beat:Math.floor(r()*3),lag:.07+r()*.05};
}
/* ── место ──
   Луг лежит на ровном: из шести проб берём самую пологую. На склоне мат
   читался как осыпь, а идущие по нему — как падающие. */
function peepMake(tr,p){
  if(!peepHere(p))return null;
  const r=rng(hashi(p.seed,0x9EE9,7));
  let bx=tr.W/2,bs=1e9;
  for(let i=0;i<6;i++){
    const x=clamp(260+r()*Math.max(1,tr.W-520),PEEP_R+40,tr.W-PEEP_R-40);
    const s=Math.abs(groundAt(tr,x-90)-groundAt(tr,x+90))+
            Math.abs(groundAt(tr,x-40)-groundAt(tr,x+40));
    if(s<bs){bs=s;bx=x;}
  }
  return {x:bx,r:PEEP_R,ph:0,watch:0,dk:0,paid:0,scene:peepScene(p)};
}
/* ── ход показа ──
   Темно — идёт проход, светло — мата не видно и счётчик сброшен: досмотреть
   половину в двух затмениях нельзя, свидетеля слушают целиком. */
function peepUpdate(dt){
  const S=G.surf,P=S&&S.peep;
  if(!P)return;
  const dk=typeof celDark==="function"?celDark():0;
  P.dk=dk;
  if(dk<.22){P.ph=0;P.watch=0;P.pass=0;return;}
  P.ph+=dt;
  if(P.ph>PEEP_PASS+120){P.ph=0;P.pass=(P.pass|0)+1;}   /* пауза между проходами; номер прохода — ярус громкости (11i) */
  if(Math.abs(S.x-P.x)<P.r)P.watch+=dt; else P.watch=0;
  if(P.watch>=PEEP_PASS&&!P.paid){
    P.paid=1;
    /* Свидетель отдаёт то же, что и все: кусок отчёта. Место — эта планета в
       этом секторе, поэтому второй луг на другом мире платит своим куском. */
    if(typeof loreTake==="function")
      loreTake("peep:"+G.sx+":"+G.sy+":"+(S.p&&S.p.seed));
  }
}
/* мат — тела PLN (21piid); 2D peepDrawMat снят (G15) */
/* ── ход ──
   Места идущих для lifePeepGpu (20fa): силуэт из свечения, шест и носилки —
   между фигурами там же. */
function peepWalk(camx,camy){
  const S=G.surf,P=S&&S.peep;
  if(!P||(P.dk||0)<.22||P.ph<=0)return null;
  /* ярус громкости (11i): в ядре уезда сцены идут от громкой к тихой */
  const GL=(typeof glowTier==="function")?glowTier(P,S.p):null;
  const sc=GL?GL.scene:P.scene,tr=S.tr,dk=P.dk,gk=GL?GL.k:1;
  const u=P.ph/PEEP_PASS*(sc.fast||1);
  if(GL&&GL.flash)glowFlash(P,camx,camy,u);
  const pos=[];
  for(let i=0;i<sc.n;i++){
    let uu=u-i*sc.lag;
    let face=sc.dir;
    /* такт: один останавливается на середине и оборачивается назад. Такт 2 —
       то же, но оборачивается идущий ПЕРВЫМ, то есть ждёт отставших. */
    const who=sc.beat===1?sc.n-1:(sc.beat===2?0:-1);
    if(i===who){
      const A=.44,B=.60;
      if(uu>=A&&uu<B){face=-sc.dir;uu=A;}
      else if(uu>=B)uu-=B-A;
    }
    if(uu<0||uu>1)continue;
    const wx=P.x-sc.dir*P.r+sc.dir*uu*P.r*2;
    const wy=groundAt(tr,wx);
    let a=dk*.62*clamp(Math.min(uu,1-uu)*7,0,1)*gk;
    /* тихий ярус виден только вплотную: дальше — ничего, и это не баг */
    if(GL&&GL.near&&Math.abs(wx-S.x)>GL.near)continue;
    pos.push({x:wx-camx,y:wy-camy,face,a,ph:uu*P.r*2*.14,i});
  }
  return pos.length?{pos,sc,P}:null;
}
function peepGhosts(camx,camy){
  /* кадр — светом видеокарты (20fa lifePeepGpu); запасного силуэта на холсте нет */
  const pass=gpuNext();if(!pass)return;
  const o=lifeHere(0,0);
  lifePeepGpu(pass,camx,camy,{x0:o.x,y0:o.y,s:o.s});
}
