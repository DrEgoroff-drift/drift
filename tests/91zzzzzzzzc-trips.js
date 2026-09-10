/* ══════════════ рейсы по мирам: один сценарий на дюжине систем (M446, §3.2 «дисбаланс») ══════════════
   «Семена ×100» в этой игре — миры ×N: галактика считается из координат, и
   семя случая двигает только речь, роли и мелочь. Здесь один и тот же рейс —
   к планете, сесть, набурить, вернуться к кораблю, взлететь, к станции,
   состыковаться — идёт ботом в каждой станционной системе первых колец, и
   оракул смотрит на РАСПРЕДЕЛЕНИЕ: сколько кадров и топлива стоил рейс,
   сколько руды дал. Мир, где рейс не закрывается на одном баке или стоит
   втрое дольше медианы, — это баг баланса, который игрок найдёт первым.
   Node, две секунды на дюжину миров. ?worlds=N — сколько миров
   (лаборатория ставит больше). Карантин до 2026-09-18: пороги — по истории. */
const TRIP_N=(()=>{try{const m=/[?&]worlds=(\d+)/.exec(location.search);return m?Math.max(1,+m[1]):12;}catch(e){return 12;}})();
function tripWorlds(n){
  const out=[];
  for(let r=0;r<12&&out.length<n;r++)for(let x=-r;x<=r&&out.length<n;x++)for(let y=-r;y<=r&&out.length<n;y++){
    if(Math.max(Math.abs(x),Math.abs(y))!==r||!starAt(x,y))continue;
    const s=getSystem(x,y);
    if(s.station&&(s.planets||[]).some(p=>p.type!=="gas"&&p.T&&p.T.atm!=="отсутствует"))out.push(s);
  }
  return out;
}
TEST_SUITES.push(()=>suite("рейсы: планета → руда → станция в дюжине миров — кадры, топливо и руда без выбросов",
  {stage:"новый оракул, пороги по истории лаборатории, до 2026-09-18"},()=>{
  resetWorld();
  const worlds=tripWorlds(TRIP_N),rows=[],stuck=[];
  ok(worlds.length>=6,"миров со станцией и твёрдой планетой: "+worlds.length);
  for(const w of worlds){
    T.go("старт");SYS_CACHE.delete(w.key);const s=getSystem(w.sx,w.sy);
    G.sx=s.sx;G.sy=s.sy;G.sys=s;G.ap=null;G.orbit=null;G.mode="system";
    const p=s.planets.find(q=>q.type!=="gas"&&q.T.atm!=="отсутствует");
    G.ship.x=p.x+380;G.ship.y=p.y+220;
    const t0=G.t,f0=G.fuel;let where="";
    for(const [nm,g,a] of [["к планете","planet",p],["посадка","land"],["бурение","mine"],["к кораблю","ship"],["взлёт","launch"],["к станции","station"],["стыковка","dock"]]){
      const r=T.bot(g,a);if(!r.ok){where=nm+": "+r.why;break;}
    }
    const row={id:s.name+" ("+s.sx+":"+s.sy+")",frames:G.t-t0,fuel:f0-G.fuel,ore:held(),ok:!where};
    rows.push(row);
    if(where)stuck.push(row.id+" — "+where);
    T.calm();
  }
  const done=rows.filter(r=>r.ok);
  const med=a=>{const v=a.slice().sort((x,y)=>x-y);return v.length?v[v.length>>1]:0;};
  const fr=done.map(r=>r.frames),fu=done.map(r=>r.fuel),ore=done.map(r=>r.ore);
  note("рейс по "+done.length+" мирам: кадров медиана "+med(fr)+" (мин "+Math.min(...fr)+", макс "+Math.max(...fr)+") · топлива медиана "+med(fu).toFixed(0)+
    " (макс "+Math.max(...fu).toFixed(0)+" из бака "+stat().fuelMax+") · руды медиана "+med(ore)+" (мин "+Math.min(...ore)+")");
  eq(stuck.join(" ;; "),"","рейс закрылся в каждом мире"+(stuck.length?" (застряло "+stuck.length+")":""));
  const slow=done.filter(r=>r.frames>med(fr)*3).map(r=>r.id+" "+r.frames);
  eq(slow.join(" ;; "),"","ни один мир не стоит втрое дольше медианы ("+med(fr)+" кадров)");
  const thirsty=done.filter(r=>r.fuel>stat().fuelMax*.8).map(r=>r.id+" "+r.fuel.toFixed(0));
  eq(thirsty.join(" ;; "),"","ни один рейс не съедает больше 80 % бака");
  const poor=done.filter(r=>r.ore<Math.max(1,med(ore)*.25)).map(r=>r.id+" "+r.ore);
  eq(poor.join(" ;; "),"","ни один мир не даёт меньше четверти медианной руды за рейс");
  /* пороги выше — от медианы ЭТОГО прогона: ровная регрессия (все миры втрое
     дольше, руды вчетверо меньше) двигает медиану вместе с собой и не краснеет.
     Якорь — числа 0.436.0: медиана 2 152 кадра, 26 топлива, 12 руды. Уехало
     в полтора раза — балансовая регрессия, и её надо назвать, а не принять (0.438.0) */
  const TRIP_BASE={frames:2152,fuel:26,ore:12};
  ok(med(fr)<=TRIP_BASE.frames*1.5,"медиана кадров "+med(fr)+" не выше 1.5× якоря "+TRIP_BASE.frames);
  ok(med(fu)<=TRIP_BASE.fuel*1.5,"медиана топлива "+med(fu).toFixed(0)+" не выше 1.5× якоря "+TRIP_BASE.fuel);
  ok(med(ore)>=TRIP_BASE.ore/1.5,"медиана руды "+med(ore)+" не ниже якоря "+TRIP_BASE.ore+"/1.5");
  resetWorld();
}));
