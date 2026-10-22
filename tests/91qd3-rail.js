/* ══════════════ поездка на движке (M828 · 18gb) ══════════════
   Вагон и ПАЗик собираются сеткой в пределах h3d, с фарами и кормовыми огнями; остановки маршрута
   строятся фигурами (пройденная гаснет), кадр поездки без видеокарты не падает. Настоящий G.
   «0 вызовов 2D» здесь не меряется: без видеокарты он ничего не значит — ворота с живой видеокартой
   в 91zzzzzzy3-gate2d («поездка», «кольцо рельса и вспышка выхода») */
TEST_SUITES.push(()=>suite("поездка: вагон телом, остановки маршрута",()=>{
  resetWorld();
  const sv={W,H,mode:G.mode,sx:G.sx,sy:G.sy,sys:G.sys,ride:RAIL_RIDE,st:railStopShapes};
  try{
    /* ── сетки: три рода линии и маршрутка ── */
    for(const [k,bus] of [["radial",false],["ring",false],["arm",false],["arm",true]]){
      const m=railCarMesh(k,bus),v=m&&m.v,nm=bus?"ПАЗик":"вагон «"+k+"»";
      ok(m&&m.n>60,nm+" собран: "+(m&&m.n)+" вершин");
      let fin=true;if(v)for(let i=0;i<v.length;i++)if(!isFinite(v[i])){fin=false;break;}
      ok(fin&&isFinite(m.R)&&m.R>0&&m.R<=24&&m.n<=20000,nm+" в пределах h3d: n="+m.n+" R="+(m.R|0));
      ok(m.L.some(q=>q.x>10)&&m.L.some(q=>q.x<-12),nm+": фара спереди, огонь на корме");
    }
    /* ── кадр поездки: каждая остановка маршрута строится, пройдена одна ── */
    const l=railNet().lines.find(q=>q.stops.length>4);
    ok(!!l,"есть линия о пяти остановках");
    if(l){
      G.sx=l.stops[1].sx;G.sy=l.stops[1].sy;G.sys=getSystem(G.sx,G.sy);
      for(const bus of [false,true]){
        railRideStart({l,i0:1,dir:1,k:3,bus});RAIL_RIDE.t=RAIL_RIDE.dur*.45;
        let stops=0,done=0;railStopShapes=(SH,AD,x,y,jn,dn,lx,ly)=>{stops++;if(dn)done++;return sv.st(SH,AD,x,y,jn,dn,lx,ly);};
        for(const z of [[1600,900],[390,844]]){W=z[0];H=z[1];stops=done=0;
          drawRail();
          eq(stops,RAIL_RIDE.seq.length,W+(bus?" ПАЗик":" вагон")+": остановки маршрута в кадре");
          eq(done,1,W+": на перегоне пройдена одна — та, откуда ушли");
        }
        railStopShapes=sv.st;
      }
    }
  }finally{W=sv.W;H=sv.H;G.mode=sv.mode;G.sx=sv.sx;G.sy=sv.sy;G.sys=sv.sys;RAIL_RIDE=sv.ride;railStopShapes=sv.st;}
}));
