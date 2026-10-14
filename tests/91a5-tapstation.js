/* Тычок по станции в системе включает автопилот (подсказка старта обещает именно это). */
TEST_SUITES.push(()=>suite("тычок по станции ведёт автопилот",()=>{
  resetWorld();
  let st=null;
  for(let r=0;r<=10&&!st;r++)for(let x=-r;x<=r&&!st;x++)for(let y=-r;y<=r&&!st;y++){
    const s=getSystem(x,y);if(!s.station)continue;
    G.sx=x;G.sy=y;G.sys=s;st=s.station;
  }
  ok(!!st,"система со станцией найдена");
  G.mode="system";G.ap=null;G.haul=null;G.marks=[];G.pirates=[];
  updateSystem(.01);
  const sh=G.ship;sh.x=st.x-120;sh.y=st.y-60;
  G.viewCX=undefined;G.viewCY=undefined;
  const Z=G.zoom;
  const sx=W/2+(st.x-sh.x)*Z,sy=H/2+(st.y-sh.y)*Z;
  const near=G.sys.planets.map(p=>Math.round(Math.hypot(p.x-st.x,p.y-st.y))+"/r"+Math.round(p.radius)).join(" ");
  tap(sx,sy);
  ok(!!G.ap&&G.ap.kind==="station","тычок в центр станции → автопилот: "+(G.ap&&G.ap.kind)+" · планеты рядом "+near+" · зум "+Z);
  G.ap=null;
  tap(sx+30,sy-20);
  ok(!!G.ap&&G.ap.kind==="station","тычок рядом (30 px) → автопилот: "+(G.ap&&G.ap.kind));
}));
