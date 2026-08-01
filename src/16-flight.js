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

/* Тело из текущей системы или из прежней? Сектор проверяется первым — он ловит
   прыжок. Сверка по ссылке ловит второй случай: система та же, но пересобрана
   из seed (кэш вытеснил старую), и объект планеты уже другой — захват за старый
   так же мёртв, его тоже надо снять. */
function bodyInSystem(p,sys){
  if(!p||!sys)return false;
  if(G.orbit&&G.orbit.sys&&G.orbit.sys!==G.sx+","+G.sy)return false;
  if(sys.station===p)return true;
  for(const pl of sys.planets){
    if(pl===p)return true;
    for(const m of pl.moons)if(m===p)return true;
  }
  return false;
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
    say("Сближение завершено\nДЕЙСТВИЕ — стыковка");
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
    G.orbit.sys=G.sx+","+G.sy;
    G.ap=null;
    say("Захват орбиты\n"+p.name+(G.opts.easyLand?"\nДЕЙСТВИЕ — авто-посадка":"\nДЕЙСТВИЕ — посадка"));
  }else if(ap.kind==="star"){
    G.ap=null;say("Подлёт к звезде\n"+G.sys.name);
  }else{
    G.ap=null;say("У кромки пояса\nДЕЙСТВИЕ — вход");
  }
  return false;
}

/* ══════════════ шлейф двигателей и струи ориентации ══════════════ */
/* Частицы живут в координатах системы, поэтому шлейф остаётся висеть там, где
   корабль был, и на развороте выписывает ту самую дугу, по которой шли.
   Рисуется он не облаком точек, а лентой: точки одного сопла соединяются
   в полосу, которая ширится и гаснет к хвосту. Дуга траектории видна только так.

   Цвет — от корпуса. Ядро у всех добела раскалённое, а перо тонировано
   акцентом корабля и уходит в него же: «Стриж» тянет бирюзовый хвост,
   «Мамонт» — сиреневый. Длина зависит от двигателя: паспортная тяга задаёт
   базу, модуль двигателя её растягивает — прокачка видна в полёте, а не
   только цифрой на экране корабля. */
/* Масштаб, в котором рисуется сам корабль. При сильном отдалении он держится
   выше мирового, иначе корпус вырождается в точку. Всё, что принадлежит
   кораблю, — факел, шлейф, струи маневровых — обязано считаться по нему же:
   пока эффекты шли по настоящему Z, при зуме 0.16 корпус был втрое крупнее
   мира, а его выхлоп уходил в доли пикселя и попросту исчезал. Оставался
   голый силуэт, к которому пришлось пририсовывать кружок-метку. */
const shipZ=Z=>clamp(Z,.55,1.6);
const TRAIL=[],TRAIL_MAX=560;
const TRAIL_TINT={};
function trailTint(id){
  if(TRAIL_TINT[id])return TRAIL_TINT[id];
  const c=hex2rgb(shipData(id).col);
  /* ядро — почти белое с оттенком акцента, чтобы не выглядело чужой наклейкой */
  const T={core:mixc(c,[255,252,238],.82), mid:mixc(c,[255,214,150],.42), edge:c};
  TRAIL_TINT[id]=T;return T;
}
function trailStep(dt,thrusting,turning,braking){
  const sh=G.ship,h=hullOf(G.shipId),st=stat();
  for(let i=TRAIL.length-1;i>=0;i--){
    const t=TRAIL[i];
    t.x+=t.vx*dt;t.y+=t.vy*dt;t.life-=dt;
    const k=Math.pow(.978,dt);t.vx*=k;t.vy*=k;
    if(t.life<=0)TRAIL.splice(i,1);
  }
  const ca=Math.cos(sh.a),sa=Math.sin(sh.a);
  /* Сопла ставим там, где они нарисованы. Корпус рисуется в масштабе shipZ, а
     смещения сопел до сих пор откладывались в мировых единицах — на экране они
     сходились к середине силуэта, и шлейф бил из центра корабля, а не из дюз.
     Тот же коэффициент переводит смещение из «единиц корпуса» в мировые. */
  const eScale=shipZ(G.zoom)/G.zoom;
  const lvl=G.mods.engine|0;
  /* длина хвоста: тяга корпуса × модуль двигателя. Ниже единицы не опускаем —
     у «Мамонта» шлейф короткий, но он есть */
  const span=(.45+st.thr*.5)*(1+lvl*.28);
  if(thrusting&&TRAIL.length<TRAIL_MAX){
    /* лента непрерывна, поэтому точки ставятся каждый кадр; на слабой графике
       сопла берутся через одно, лента становится реже, но не рвётся */
    const skip=G.opts.gfx.particles<1?2:1;
    for(let i=0;i<h.eng.length;i++){
      if(i%skip)continue;
      const e=h.eng[i];
      const ex=sh.x+(e.x*ca-e.y*sa)*eScale, ey=sh.y+(e.x*sa+e.y*ca)*eScale;
      /* разброс почти нулевой: лента складывается из этих точек, и любой заметный
         джиттер превращает хвост в лесенку вместо плавной дуги */
      /* Точка почти не имеет своей скорости. Раньше она наследовала треть
         скорости корабля и получала полновесный толчок назад — облако уезжало
         следом за кораблём, и хвост выходил коротким мазком у кормы. Газ,
         выброшенный в пустоту, никуда не летит вместе с кораблём: он остаётся
         там, где выброшен. Отсюда и берётся дуга пройденного пути — лента
         просто висит на месте и гаснет. */
      const spread=(Math.random()-.5)*.04, sp=(1.2+Math.random()*.3)*(.8+span*.4)*.4;
      /* лента живёт дольше, чем раньше (было 26): на глаз хвост читался обрубком
         сразу за соплом — видно, что двигатель работает, но не видно, откуда
         корабль пришёл. Дуга траектории — главное, что шлейф вообще сообщает */
      /* Промежуточная точка на полпути к прошлому кадру — и кладём её ПЕРВОЙ,
         потому что она старше: лента соединяет точки в порядке массива, и
         перепутанный порядок дал бы зигзаг вместо полосы. Быстрый корпус за
         кадр уходит на девять пикселей, а лента идёт отрезками — на развороте
         она ломалась углами, и хвост читался как начерченный маршрут, а не как
         струя. «Клинок» страдал сильнее всех: у него и скорость выше, и лента
         длиннее — обе величины растут от тяги. */
      const bx=ex-sh.vx*dt*.5, by=ey-sh.vy*dt*.5;
      TRAIL.push({x:bx,y:by,hot:1,e:i,r:e.r*(.54+Math.random()*.08),
        max:30*span,life:30*span-.5,
        vx:-Math.cos(sh.a+spread)*sp, vy:-Math.sin(sh.a+spread)*sp});
      TRAIL.push({x:ex,y:ey,hot:1,e:i,r:e.r*(.54+Math.random()*.08),
        max:30*span,life:30*span,
        vx:-Math.cos(sh.a+spread)*sp, vy:-Math.sin(sh.a+spread)*sp});
    }
  }
  /* ── струи ориентации ──
     Газ уходит в сторону, ПРОТИВОПОЛОЖНУЮ повороту: чтобы нос пошёл влево,
     носовое сопло выбрасывает вправо, кормовое — влево. Пара струй крест-накрест
     и есть то, чем корабль разворачивают в пустоте. Раньше обе били туда же,
     куда шёл разворот, и картинка спорила с физикой. */
  if(turning&&TRAIL.length<TRAIL_MAX-6&&Math.random()<.4){
    const s=keys.left?-1:1;                      // -1 — разворот влево
    const jets=[[h.nose*.55, h.bw*.8*-s, -s],    // нос: газ наружу по борту -s
                [h.tail*.55, h.bw*.8*s,   s]];   // корма: газ в другую сторону
    for(const j of jets){
      const ex=sh.x+(j[0]*ca-j[1]*sa)*eScale, ey=sh.y+(j[0]*sa+j[1]*ca)*eScale;
      const pa=sh.a+Math.PI/2*j[2];
      /* струя короткая: это укол газа у борта, а не второй шлейф —
         длинная белая цепочка вдоль всего курса читалась как помеха */
      TRAIL.push({x:ex,y:ey,hot:0,e:-1,r:1.4+Math.random(),max:9,life:6+Math.random()*3,
        vx:sh.vx*.9+Math.cos(pa)*2.2, vy:sh.vy*.9+Math.sin(pa)*2.2});
    }
  }
  /* ── торможение: носовые маневровые бьют вперёд ── */
  if(braking&&TRAIL.length<TRAIL_MAX-6&&Math.random()<.8){
    for(const s of [-1,1]){
      const px=h.nose*.5, py=h.bw*.5*s;
      const ex=sh.x+(px*ca-py*sa)*eScale, ey=sh.y+(px*sa+py*ca)*eScale;
      const pa=sh.a+(Math.random()-.5)*.5;       // газ вперёд по курсу
      TRAIL.push({x:ex,y:ey,hot:0,e:-1,r:1.2+Math.random()*.9,max:11,life:7+Math.random()*4,
        vx:sh.vx*.85+Math.cos(pa)*2.4, vy:sh.vy*.85+Math.sin(pa)*2.4});
    }
  }
}
function drawTrail(zx,zy,Z){
  const T=trailTint(G.shipId),SZ=shipZ(Z);
  /* ленты по соплам: массив хронологичен, поэтому в каждой корзине точки
     идут от самой старой к свежей — ровно порядок отрисовки полосы */
  const lanes={};
  for(const t of TRAIL){
    if(!t.hot)continue;
    (lanes[t.e]||(lanes[t.e]=[])).push(t);
  }
  ctx.save();
  ctx.globalCompositeOperation="lighter";
  /* стык встык, а не скруглённый: у быстрого корабля соседние точки далеко,
     и круглые торцы превращали ленту в цепочку бусин */
  ctx.lineCap="butt";ctx.lineJoin="round";
  for(const k in lanes){
    const arr=lanes[k];
    for(let i=1;i<arr.length;i++){
      const a=arr[i-1],b2=arr[i];
      const x0=zx(a.x),y0=zy(a.y),x1=zx(b2.x),y1=zy(b2.y);
      if((x0<-60&&x1<-60)||(x0>W+60&&x1>W+60)||(y0<-60&&y1<-60)||(y0>H+60&&y1>H+60))continue;
      const u=clamp((a.life/a.max+b2.life/b2.max)*.5,0,1);
      /* у сопла — белое ядро, к хвосту цвет уходит в акцент корпуса */
      const col=u>.78?mixc(T.mid,T.core,(u-.78)/.22):mixc(T.edge,T.mid,u/.78);
      /* яркость и толщина подняты примерно вдвое: прежние .13/.30 при толщине
         в пиксель давали ленту на пороге видимости — на тёмном фоне её просто
         не было. Профиль тот же, лента по-прежнему ширится и гаснет к хвосту */
      /* Спад квадратичный, а не линейный: с линейным хвост держал яркость почти
         до конца и выглядел начерченной линией. Газ должен рассеиваться —
         половина пути и половина яркости не одно и то же. */
      ctx.strokeStyle=rgba(col,(u*u*.30+u*u*u*u*.5).toFixed(3));
      ctx.lineWidth=Math.max(1,b2.r*SZ*(2.4-u*1.3));
      ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    }
    /* добела раскалённый корешок у самого сопла */
    const f=arr[arr.length-1];
    if(f){
      const x=zx(f.x),y=zy(f.y);
      if(x>-40&&x<W+40&&y>-40&&y<H+40){
        ctx.fillStyle=rgba(T.core,.62);
        ctx.beginPath();ctx.arc(x,y,Math.max(.8,f.r*SZ*1.3),0,TAU);ctx.fill();
      }
    }
  }
  ctx.restore();
  /* холодные струи маневровых — короткие дымки, не лента */
  for(const t of TRAIL){
    if(t.hot)continue;
    const x=zx(t.x),y=zy(t.y);
    if(x<-30||x>W+30||y<-30||y>H+30)continue;
    const u=clamp(t.life/t.max,0,1);
    const rr=Math.max(.5,t.r*SZ*(2.6-u*1.9));
    ctx.fillStyle="rgba(205,232,246,"+(u*.22).toFixed(3)+")";
    ctx.beginPath();ctx.arc(x,y,rr,0,TAU);ctx.fill();
  }
}
