/* ══ железная дорога: сеть (M470, DESIGN-metro §2) ══
   Сеть — функция зерна. Сторож держит: одна и та же сеть при каждом счёте,
   ни одной линии с двумя остановками в одной системе, густота радиусов
   ровная по кругу, и из любой станции сети можно доехать до любой другой. */
TEST_SUITES.push(()=>suite("рельсы: сеть по зерну, связна и ровна",()=>{
  resetWorld();
  RAIL_NET=null;const A=railNet();
  const sig=N=>N.lines.map(l=>l.id+":"+l.stops.map(s=>s.sx+","+s.sy).join(";")).join("|");
  const s1=sig(A);RAIL_NET=null;eq(sig(railNet()),s1,"одна и та же сеть при каждом счёте");
  const N=railNet();
  let dup=0,stops=0;
  for(const l of N.lines){const k=l.stops.map(s=>s.sx+","+s.sy);stops+=k.length;if(new Set(k).size!==k.length)dup++;}
  eq(dup,0,"ни одна линия не стоит дважды в одной системе");
  ok(stops>150,"остановок в сети: "+stops);
  /* густота радиусов по кругу: 6 → 12 → 24 → 48 */
  const cnt=r=>N.lines.filter(l=>l.kind==="radial"&&RAIL_FORK[l.k]<=r&&r<(RAIL_FORK[l.k+1]||1e9)).length;
  eq(cnt(8),6,"на r 8 — шесть радиусов");eq(cnt(15),12,"на r 15 — двенадцать");eq(cnt(30),24,"на r 30 — двадцать четыре");
  /* связность: станции — вершины, соседние остановки линии — рёбра */
  const adj={};
  for(const l of N.lines){
    const k=l.stops.map(s=>s.sx+","+s.sy);
    for(let i=0;i<k.length;i++){(adj[k[i]]||(adj[k[i]]=new Set()));
      if(i)adj[k[i]].add(k[i-1]),adj[k[i-1]].add(k[i]);}
    if(l.loop&&k.length>2){adj[k[0]].add(k[k.length-1]);adj[k[k.length-1]].add(k[0]);}
  }
  const all=Object.keys(adj),seen=new Set([all[0]]),q=[all[0]];
  while(q.length){const v=q.pop();for(const w of adj[v])if(!seen.has(w)){seen.add(w);q.push(w);}}
  eq(seen.size,all.length,"из любой станции сети можно доехать до любой ("+seen.size+" из "+all.length+")");
  const J=Object.keys(N.at).filter(k=>N.at[k].length>1).length;
  ok(J>=20,"пересадок хватает: "+J);
  ok(N.lines.some(l=>l.stops.some(s=>s.halt)),"за r 40 — полустанки");
  /* станция в системе знает свои линии */
  const k0=Object.keys(N.at)[0].split(",").map(Number),S=railStation(k0[0],k0[1]);
  ok(S&&S.lines.length>=1,"railStation называет линии");
}));
