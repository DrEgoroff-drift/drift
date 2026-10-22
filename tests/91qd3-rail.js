/* ══════════════ поездка на движке (M828 · 18gb) ══════════════
   Кадр поездки, кадр системы с кольцом станции и вспышка выхода из поезда не красят ctx: прежняя 2D-кисть
   drawRail клала 14 вызовов на кадр поездки, railFlash — свои на выходе, запасная ветка drawSysRail — кольцо.
   Вагон и ПАЗик собираются сеткой в пределах h3d, с фарами и кормовыми огнями; остановки маршрута
   строятся фигурами (пройденная гаснет). Настоящий G, без видеокарты: каждый рисующий сам пропускает null */
TEST_SUITES.push(()=>suite("поездка: вагон телом, кадр без 2D",()=>{
  resetWorld();
  const sv={W,H,ctx,mode:G.mode,sx:G.sx,sy:G.sy,sys:G.sys,zoom:G.zoom,sxy:[G.ship.x,G.ship.y],ride:RAIL_RIDE,arr:RAIL_ARRIVE,st:railStopShapes};
  const PAINT=new Set(["fill","stroke","fillText","strokeText","fillRect","strokeRect","drawImage","putImageData","clearRect"]);
  const count=f=>{let n=0;const real=sv.ctx;
    ctx=new Proxy(real,{get(t,p){const v=t[p];return v instanceof Function?(PAINT.has(p)?(...a)=>{n++;return v.apply(t,a);}:v.bind(t)):v;},
      set(t,p,v){t[p]=v;return true;}});
    try{f();}finally{ctx=real;}return n;};
  try{
    /* ── сетки: три рода линии и маршрутка ── */
    for(const [k,bus] of [["radial",false],["ring",false],["arm",false],["arm",true]]){
      const m=railCarMesh(k,bus),v=m&&m.v,nm=bus?"ПАЗик":"вагон «"+k+"»";
      ok(m&&m.n>60,nm+" собран: "+(m&&m.n)+" вершин");
      let fin=true;if(v)for(let i=0;i<v.length;i++)if(!isFinite(v[i])){fin=false;break;}
      ok(fin&&isFinite(m.R)&&m.R>0&&m.R<=24&&m.n<=20000,nm+" в пределах h3d: n="+m.n+" R="+(m.R|0));
      ok(m.L.some(q=>q.x>10)&&m.L.some(q=>q.x<-12),nm+": фара спереди, огонь на корме");
    }
    /* ── кадр поездки: остановки строятся, ctx молчит ── */
    const N=railNet(),l=N.lines.find(q=>q.stops.length>4);
    ok(!!l,"есть линия о пяти остановках");
    if(l){
      G.sx=l.stops[1].sx;G.sy=l.stops[1].sy;G.sys=getSystem(G.sx,G.sy);
      for(const bus of [false,true]){
        railRideStart({l,i0:1,dir:1,k:3,bus});RAIL_RIDE.t=RAIL_RIDE.dur*.45;
        let stops=0,done=0;railStopShapes=(SH,AD,x,y,jn,dn,lx,ly)=>{stops++;if(dn)done++;return sv.st(SH,AD,x,y,jn,dn,lx,ly);};
        for(const z of [[1600,900],[390,844]]){W=z[0];H=z[1];stops=done=0;
          const n=count(()=>drawRail());
          eq(stops,RAIL_RIDE.seq.length,W+(bus?" ПАЗик":" вагон")+": остановки маршрута в кадре");
          ok(done===1,W+": на перегоне пройдена одна — та, откуда ушли ("+done+")");
          eq(n,0,W+(bus?" ПАЗик":" вагон")+": кадр поездки не красит ctx");
        }
        railStopShapes=sv.st;
      }
      RAIL_RIDE=null;
    }
    /* ── кадр системы с кольцом станции и вспышкой выхода ──
       мирный флот у станций рельса стоит почти везде; без прохода сцены 17m не рисует ничего (M818) */
    let S=null;
    for(const q of N.lines)for(const s of q.stops){if(S)break;
      G.sx=s.sx;G.sy=s.sy;G.sys=getSystem(s.sx,s.sy);if(railHere())S=s;}
    ok(!!S,"есть система с кольцом станции");
    if(S){
      const R=railHere();G.mode="system";G.ap=null;G.orbit=null;G.zoom=1;G.ship.x=R.x+50;G.ship.y=R.y+30;
      RAIL_ARRIVE=G.t-6;
      for(const z of [[1600,900],[390,844]]){W=z[0];H=z[1];
        eq(count(()=>drawSystem()),0,W+": кадр системы с кольцом и вспышкой выхода не красит ctx");}
    }
  }finally{W=sv.W;H=sv.H;ctx=sv.ctx;G.mode=sv.mode;G.sx=sv.sx;G.sy=sv.sy;G.sys=sv.sys;G.zoom=sv.zoom;
    G.ship.x=sv.sxy[0];G.ship.y=sv.sxy[1];RAIL_RIDE=sv.ride;RAIL_ARRIVE=sv.arr;railStopShapes=sv.st;}
}));
