/* ══════════════ мачта телом (M823 · 11apa) ══════════════ */
/* Кадр системы с мачтой не красит ctx: прежний 2D-силуэт relayDrawSystem клал 179 вызовов на кадр.
   Каждый род мачты собирается сеткой в пределах h3d с обеих сторон звезды; огни — по роду (мигает
   фонарь у маяка, бакена и ретранслятора, тёплое окно — у тех, кто там живёт). Настоящий G, без видеокарты. */
TEST_SUITES.push(()=>suite("мачта: тело в кадре системы, без 2D",()=>{
  resetWorld();
  const sv={W,H,ctx,mode:G.mode,sx:G.sx,sy:G.sy,sys:G.sys,zoom:G.zoom,sxy:[G.ship.x,G.ship.y],rd:relayDrawSystem};
  const PAINT=new Set(["fill","stroke","fillText","strokeText","fillRect","strokeRect","drawImage","putImageData","clearRect"]);
  try{
    /* ── сетки: шесть родов, звезда справа и слева ── */
    for(const K of RELAY_KINDS)for(const sd of [1,-1]){
      const m=relayMesh(K.k,sd),v=m&&m.v;
      ok(m&&m.n>60,"«"+K.k+"» ("+sd+") собрана: "+(m&&m.n)+" вершин");
      let fin=true;if(v)for(let i=0;i<v.length;i++)if(!isFinite(v[i])){fin=false;break;}
      ok(fin&&isFinite(m.R)&&m.R>0&&m.R<=60&&m.n<=20000,"«"+K.k+"» в пределах h3d: n="+m.n+" R="+(m.R|0));
      const blink=m.L.some(q=>q.k>0&&q.r>0),warm=m.L.some(q=>!q.k&&q.g>0);
      if(K.give==="pay")ok(warm,"«"+K.k+"» — жильё: светит окно");
      if(K.k==="beacon"||K.k==="buoy"||K.k==="relay")ok(blink,"«"+K.k+"» мигает огнём");
    }
    /* ── кадр системы с мачтой: ни одного вызова ctx ── */
    let R=null;
    for(let r=1;r<=14&&!R;r++)for(let dy=-r;dy<=r&&!R;dy++)for(let dx=-r;dx<=r;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const q=relayOf(dx,dy);if(q&&!q.own){R=q;break;}}
    ok(!!R,"рядом с нулём есть система с мачтой");
    if(R){
      G.sx=R.sx;G.sy=R.sy;G.sys=getSystem(R.sx,R.sy);G.mode="system";G.ap=null;G.orbit=null;
      const P=relaySpot(R);G.ship.x=P.x+60;G.ship.y=P.y+40;G.zoom=1;
      let seen=null;relayDrawSystem=(zx,zy,Z)=>{seen={x:zx(P.x),y:zy(P.y)};return sv.rd(zx,zy,Z);};
      for(const z of [[1600,900],[390,844]]){
        W=z[0];H=z[1];seen=null;
        let n=0;const real=sv.ctx;
        ctx=new Proxy(real,{get(t,p){const v=t[p];return v instanceof Function?(PAINT.has(p)?(...a)=>{n++;return v.apply(t,a);}:v.bind(t)):v;},
          set(t,p,v){t[p]=v;return true;}});
        drawSystem();
        ctx=real;
        ok(!!seen&&seen.x>0&&seen.x<W&&seen.y>0&&seen.y<H,W+": мачта «"+R.k+"» в кадре"+(seen?" ("+(seen.x|0)+","+(seen.y|0)+")":""));
        eq(n,0,W+": кадр системы с мачтой не красит ctx");
      }
    }
  }finally{W=sv.W;H=sv.H;ctx=sv.ctx;G.mode=sv.mode;G.sx=sv.sx;G.sy=sv.sy;G.sys=sv.sys;G.zoom=sv.zoom;
    G.ship.x=sv.sxy[0];G.ship.y=sv.sxy[1];relayDrawSystem=sv.rd;}
}));
