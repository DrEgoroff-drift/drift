(()=>{
  const r=n=>Math.round(n||0);
  const sh=G.ship||{};
  const vis=el=>{if(!el)return false;const cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<.05)return false;const b=el.getBoundingClientRect();return b.width>0&&b.height>0;};
  /* what hangs over the world: fixed/absolute DOM windows that are visible, large enough */
  const over=[...document.querySelectorAll("body > div, body > section, .scr, [id$=win]")]
    .filter(e=>e.id&&vis(e)&&!/^(hud|ui|pads|rail|stick|console)$/.test(e.id))
    .map(e=>{const b=e.getBoundingClientRect();return e.id+" "+r(b.width)+"x"+r(b.height);}).slice(0,8);
  const btns=[...document.querySelectorAll("button")].filter(vis)
    .map(e=>e.textContent.trim().replace(/\s+/g," ").slice(0,18)).filter(Boolean).slice(0,14);
  const chips=SYS_CHIPS.map(c=>{const t=c.t||{};const p=t.p||{};return (t.kind||"?")+":"+(p.name||t.name||"")+"@"+r(c.x+c.w/2)+","+r(c.y+c.h/2);});
  const log=(G.log||[]).slice(-4).map(l=>String(l.s||l.t||"").slice(0,90));
  return JSON.stringify({
    mode:G.mode, sys:(G.sys&&G.sys.name)+" "+G.sx+","+G.sy, t:r(G.t),
    ship:[r(sh.x),r(sh.y)], v:+Math.hypot(sh.vx||0,sh.vy||0).toFixed(2), ang:+(sh.a||sh.ang||0).toFixed(2),
    fuel:r(G.fuel), hull:r(G.hull), en:r(G.energy), cr:r(G.credits), cargo:Object.entries(G.cargo||{}).filter(e=>e[1]).map(e=>e[0]+":"+e[1]).join(" "),
    tgt:G.target?(G.target.name||G.target.kind||"obj"):null, auto:!!(G.auto||G.autopilot),
    prompt:G.prompt||"", hail:G.hail?{by:G.hail.by,t:r(G.hail.t),warn:G.hail.warn}:null,
    say:(typeof SAY!=="undefined"&&SAY&&SAY.text)||"", over, btns, chips, log
  });
})()
