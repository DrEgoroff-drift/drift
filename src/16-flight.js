/* ══════════════ фон ══════════════ */
const STAR_COLS=[[255,206,158],[255,232,196],[228,240,252],[255,255,255],[176,206,255],[205,190,255]];
const BG=[];
for(let i=0;i<340;i++)BG.push({x:Math.random(),y:Math.random(),z:.2+Math.random()*.8,
  ph:Math.random()*TAU, c:STAR_COLS[Math.floor(Math.random()*STAR_COLS.length)]});
function drawStars(cx,cy,par){
  for(const s of BG){
    const px=((s.x*1600-cx*par*s.z)%1600+1600)%1600/1600*W;
    const py=((s.y*1200-cy*par*s.z)%1200+1200)%1200/1200*H;
    const tw=.76+.24*Math.sin(G.t*.045*(.4+s.z)+s.ph);
    const a=(.11+s.z*.55)*tw, c=s.c;
    ctx.fillStyle="rgba("+c[0]+","+c[1]+","+c[2]+","+a.toFixed(2)+")";
    const sz=s.z>.72?1.7:1;
    ctx.fillRect(px,py,sz,sz);
    if(s.z>.9){   // самые яркие получают крестик-ореол
      ctx.fillStyle="rgba("+c[0]+","+c[1]+","+c[2]+","+(a*.3).toFixed(2)+")";
      ctx.fillRect(px-2.4,py+.35,5.8,.8);ctx.fillRect(px+.35,py-2.4,.8,5.8);
    }
  }
}
/* ── туманность: считается один раз в offscreen, дальше только растягивается ── */
let NEBULA=null;
function nebula(){
  if(NEBULA)return NEBULA;
  const S=192,cn=document.createElement("canvas");cn.width=cn.height=S;
  const c=cn.getContext("2d"),img=c.createImageData(S,S),d=img.data;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const o=(y*S+x)*4, u=x/S*3.2, v=y/S*3.2;
    const a=clamp((fbm2(u,v,1337,5)-.44)*2.5,0,1);
    const b=clamp((fbm2(u+5.3,v-2.1,911,4)-.46)*2.3,0,1);
    d[o]  =36+b*140;
    d[o+1]=26+a*74+b*38;
    d[o+2]=66+a*158;
    d[o+3]=clamp((Math.pow(a,1.8)*.52+Math.pow(b,2.1)*.3)*255,0,255);
  }
  c.putImageData(img,0,0);NEBULA=cn;return cn;
}
/* смещение зажато, поэтому картинка не тайлится и швов не бывает */
function drawNebula(cx,cy,par){
  const N=nebula(),ex=W*.2,ey=H*.2;
  const ox=-ex/2+clamp(-cx*par*.01,-ex/2,ex/2);
  const oy=-ey/2+clamp(-cy*par*.01,-ey/2,ey/2);
  ctx.globalAlpha=.6;ctx.drawImage(N,ox,oy,W+ex,H+ey);ctx.globalAlpha=1;
}

/* ══════════════ автопилот ══════════════ */
function targetPos(){
  const ap=G.ap;if(!ap)return null;
  if(ap.kind==="planet")return {x:ap.p.x,y:ap.p.y,vx:ap.p.vx||0,vy:ap.p.vy||0,
    park:ap.p.radius+70};
  if(ap.kind==="station"){const S=G.sys.station;
    return {x:S.x,y:S.y,vx:S.vx,vy:S.vy,park:62};}
  if(ap.kind==="star")return {x:0,y:0,vx:0,vy:0,park:G.sys.radius+220};
  return {x:ap.ax,y:ap.ay,vx:0,vy:0,park:40};
}
/* скорость тела теперь считается численно в updateSystem (p.vx/p.vy) —
   работает одинаково для эллипсов и спутников, без отдельной формулы под каждый случай */
function apVel(p){return {x:p.vx||0,y:p.vy||0};}
function runAutopilot(dt,st){
  const T=targetPos();if(!T)return false;
  const sh=G.ship;
  const dx=T.x-sh.x, dy=T.y-sh.y, dist=Math.hypot(dx,dy)||1;
  const rvx=sh.vx-T.vx, rvy=sh.vy-T.vy;
  const gap=dist-T.park;
  /* упреждение: летим не в текущую точку цели, а в точку встречи — иначе
     на движущемся теле автопилот вечно отстаёт и догоняет его по кругу.
     Одной итерации уточнения хватает, скорость тела считается численно. */
  const cruise=6.4+st.thr*1.6;
  let ax=T.x, ay=T.y;
  for(let i=0;i<2;i++){
    const t=Math.min(Math.hypot(ax-sh.x,ay-sh.y)/Math.max(cruise*.7,.001),900);
    ax=T.x+T.vx*t; ay=T.y+T.vy*t;
  }
  const ldx=ax-sh.x, ldy=ay-sh.y, ldist=Math.hypot(ldx,ldy)||1;
  /* приёмка цели: раньше требовалось подойти на 12 единиц и почти замереть, но
     минимальная скорость сближения была .25 — условие не выполнялось никогда, и
     автопилот наматывал круги у самой планеты. Теперь коридор широкий, а на
     подлёте скорость гасится до нуля, а не до «ползком». */
  const rel=Math.hypot(rvx,rvy);
  if(gap<34&&rel<1.4){
    sh.vx=T.vx;sh.vy=T.vy;
    return arrive();
  }
  if(G.fuel<=0){G.ap=null;say("Топливо кончилось\nавтопилот отключён");return false;}
  /* тормозной профиль: скорость подхода ограничена тем, что реально успеешь
     погасить оставшейся тягой. Линейное gap/22 разрешало 8 ед/кадр уже за 176
     единиц до цели, а гасить их с ускорением .088 нужно ~360 — автопилот
     влетал в тело насквозь и захватывал орбиту внутри планеты.
     Запас в .8 от паспортного ускорения — на поворот и на движение цели. */
  const brake=.088*st.thr*.8;
  const want=clamp(Math.sqrt(Math.max(gap,0)*2*brake),0,cruise);
  const dvx=ldx/ldist*want-rvx, dvy=ldy/ldist*want-rvy;
  const dm=Math.hypot(dvx,dvy)||1;
  const acc=Math.min(dm,.088*st.thr*dt);
  sh.vx+=dvx/dm*acc;sh.vy+=dvy/dm*acc;
  G.fuel=Math.max(0,G.fuel-(G.tech.has("navi")?.011:.022)*dt*(acc/(.088*st.thr*dt||1)));
  /* смотрим на саму цель, а не на вектор коррекции: у коррекции возле цели
     направление скачет туда-сюда, и корабль начинал вертеться на месте */
  const face=Math.atan2(ldy,ldx);
  sh.a+=clamp(angDiff(face,sh.a),-.055,.055)*dt;
  G.prompt="АВТОПИЛОТ · "+Math.round(gap)+" ед · "+Math.hypot(rvx,rvy).toFixed(1);
  return true;
}
function arrive(){
  const ap=G.ap;
  if(ap.kind==="station"){
    G.ap=null;
    if(G.opts.autoDock){openStation();return true;}
    say("Сближение завершено\nДЕЙСТВ — стыковка");
  }else if(ap.kind==="planet"){
    /* вместо того чтобы гоняться регулятором за движущимся телом (и дрожать
       на подлёте), корабль захватывает круговую орбиту вокруг него и держит её,
       пока игрок сам не возьмётся за ручное управление */
    const p=ap.p,sh=G.ship;
    const rx=sh.x-p.x,ry=sh.y-p.y;
    /* радиус захвата не может оказаться внутри тела: иначе корабль запирался
       под поверхностью, пропадал из виду и мелко дрожал на крошечной орбите */
    const rMin=p.radius+46;
    const r=Math.max(Math.hypot(rx,ry)||rMin,rMin);
    const ang0=Math.atan2(ry,rx)||0;
    sh.x=p.x+Math.cos(ang0)*r;sh.y=p.y+Math.sin(ang0)*r;
    const dirCcw=(rx*sh.vy-ry*sh.vx)>=0?1:-1;
    /* тела стали медленнее (M43), поэтому и захват перенастроен: касательная
       скорость по орбите зажата долей крейсерской, иначе корабль обгоняет цель */
    const cruise=6.4+stat().thr*1.6;
    const w=dirCcw*clamp(Math.min(.6/Math.sqrt(r),cruise*.28/Math.max(r,1)),.002,.03);
    G.orbit={p,r,ang:ang0,w};
    G.ap=null;
    say("Захват орбиты\n"+p.name+(G.opts.easyLand?"\nДЕЙСТВ — авто-посадка":"\nДЕЙСТВ — посадка"));
  }else if(ap.kind==="star"){
    G.ap=null;say("Подлёт к звезде\n"+G.sys.name);
  }else{
    G.ap=null;say("У кромки пояса\nДЕЙСТВ — вход");
  }
  return false;
}

/* ══════════════ шлейф двигателей и струи ориентации ══════════════ */
/* частицы живут в координатах системы, поэтому шлейф остаётся висеть там, где корабль был */
const TRAIL=[],TRAIL_MAX=170;
function trailStep(dt,thrusting,turning){
  const sh=G.ship,h=hullOf(G.shipId);
  for(let i=TRAIL.length-1;i>=0;i--){
    const t=TRAIL[i];
    t.x+=t.vx*dt;t.y+=t.vy*dt;t.life-=dt;
    const k=Math.pow(.978,dt);t.vx*=k;t.vy*=k;
    if(t.life<=0)TRAIL.splice(i,1);
  }
  const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
  if(thrusting&&TRAIL.length<TRAIL_MAX){
    for(const e of h.eng){
      if(Math.random()>.55*G.opts.gfx.particles)continue;   // пореже, иначе шлейф превращается в сплошную кашу
      const ex=sh.x+e.x*ca-e.y*sa, ey=sh.y+(e.x*sa+e.y*ca);
      const spread=(Math.random()-.5)*.34, sp=1.2+Math.random()*1.6;
      TRAIL.push({x:ex,y:ey,hot:1,r:e.r*(.22+Math.random()*.3),max:40,life:22+Math.random()*18,
        vx:sh.vx*.3-Math.cos(sh.a+spread)*sp, vy:sh.vy*.3-Math.sin(sh.a+spread)*sp});
    }
  }
  if(turning&&TRAIL.length<TRAIL_MAX&&Math.random()<.55){
    const s=keys.left?-1:1, px=h.nose*.55, py=h.bw*.75*s;
    const ex=sh.x+px*ca-py*sa, ey=sh.y+(px*sa+py*ca);
    const pa=sh.a+Math.PI/2*s;
    TRAIL.push({x:ex,y:ey,hot:0,r:1.5+Math.random(),max:22,life:14+Math.random()*8,
      vx:sh.vx*.6+Math.cos(pa)*1.5, vy:sh.vy*.6+Math.sin(pa)*1.5});
  }
}
function drawTrail(zx,zy,Z){
  for(const t of TRAIL){
    const x=zx(t.x),y=zy(t.y);
    if(x<-30||x>W+30||y<-30||y>H+30)continue;
    const u=clamp(t.life/t.max,0,1);
    const rr=Math.max(.5,t.r*Z*(2.6-u*1.9));
    ctx.fillStyle=t.hot
      ? "rgba(255,"+((105+125*u)|0)+","+((50+75*u)|0)+","+(u*u*.3).toFixed(3)+")"
      : "rgba(205,232,246,"+(u*.2).toFixed(3)+")";
    ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fill();
  }
}
