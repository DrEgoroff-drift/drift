/* ══════════════ приборы: пять шкал на верстаке (M813, docs/DESIGN-hall.md §8) ══════════════
   Пять гнёзд панели — пять вещей на верстаке у окна, под рабочей лампой: корпус цвета завода, латунный
   обод, кремовая шкала (делений столько, сколько прибор различает), красная метка верного показания и
   стрелка, которая гуляет. Гуляет так, как прибор врёт: износ и завод (drift) уводят её от метки
   медленной волной, нервная стрелка (jit) дрожит поверх. На плите строки становятся карточками с той же
   шкалой рисунком — проза уходит, остаются имя, завод тегом, износ и кнопки (26b строит их, здесь
   только переложено, как карточки верфи 27f4f). Строка под мышью зажигает свою шкалу и ведёт объектив. */
const HALL_INSTR={mesh:null,key:"",hot:null};
/* цвет корпуса по заводу (INSTR_WORKS, 05b) — по имени, как его пишет instrTraits */
const HALL_INSTR_HOUSE={"Казённый":[92,96,84],"«Горн»":[54,52,50],"«Сирин»":[196,186,158],"«Веха»":[46,58,80],
  "Артельный":[124,92,62],"Трофейный":[98,50,42]};
/* место i-го прибора на столешнице верстака (кости 27f4b: верх .91, передний край z −1.92); пятый — левее
   пилота у окна (x 2.62), первый — правее человека у левого края верстака: с места КОРАБЛЬ видны все пять */
function hallInstrAt(i){return [.3+.36*i,.91,-2.06];}
/* места зала, где верстак с приборами в кадре: вкладка ПРИБОРЫ живёт у окна (группа КОРАБЛЬ), знания — у верстака */
const HALL_INSTR_PLACES=["ship","know"];
const HALL_INSTR_C=[0,.1,.062];   /* центр шкалы в корпусе: высота, вынос к залу */
/* что прибор показывает рисунком: деления, где верная метка, насколько и как гуляет стрелка, перо */
function hallInstrLook(id){
  const u=instrUnit(id),T=instrTraits(u),w=clamp(u.wear||0,0,1),q=T.res*(1-w*.45),i=INSTR_KEYS.indexOf(id);
  const off=typeof subOff==="function"&&subOff(u);
  return {u,T,w,q,i,off,ticks:Math.round(clamp(4+9*q,5,21)),mark:((hashi(i,0x1D5)>>>0)%7-3)*.09,
    drift:(.04+.3*w)*T.drift,jit:.01*T.jit*(1+w),pen:T.pen,house:HALL_INSTR_HOUSE[T.ru]||[92,96,84]};
}
/* угол стрелки (рад, по часовой от верха) в момент t: метка + медленный увод + дрожь; отключённый — лежит на упоре */
function hallInstrNeedle(id,t){
  const D=hallInstrLook(id),ph=D.i*1.7;
  if(D.off)return -.95;
  return D.mark+D.drift*(.6+.4*Math.sin(t*.11+ph))*Math.sin(t*.23+ph*.5)+D.jit*Math.sin(t*5.1+ph)*(.6+.4*Math.sin(t*.7));
}
function hallInstrMesh(){
  const K=r3Kit(),P=R3P,Br=K.mt([196,156,84],.9,12,P.brushed),Fc=K.mt([228,222,204],.2,4,0,.04),Ink=K.mt([34,32,30],.2,4,0);
  INSTR_KEYS.forEach((id,i)=>{const D=hallInstrLook(id),[x,y,z]=hallInstrAt(i),hot=HALL_INSTR.hot===id,c=HALL_INSTR_C;
    K.part=0;K.push([x,y,z]);
    K.box([0,.085,0],[.11,.085,.06],K.mt(D.house,.5,8,P.brushed),.014);   /* корпус */
    K.box([0,.004,0],[.115,.004,.065],K.mt(mixc(D.house,[0,0,0],.4),.4,7,P.brushed),.003);   /* цоколь */
    K.push(c,0,Math.PI/2);K.lathe([[-.004,.074],[.006,.078],[.012,.07],[.013,0]],20,hot?K.mt(HALL_GOODS_ACC,.3,6,0,1.1,true):Br);K.pop();   /* обод: горящий — акцент плиты */
    K.push([c[0],c[1],c[2]+.0135],0,Math.PI/2);K.lathe([[0,.066],[.001,0]],20,Fc);K.pop();   /* шкала */
    for(let k=0;k<D.ticks;k++){const a=-.95+1.9*k/(D.ticks-1),big=k%Math.max(1,Math.round((D.ticks-1)/4))===0,r0=big?.044:.05;
      K.push([c[0],c[1],c[2]+.0155],0,0,-a);K.box([0,(r0+.058)/2,0],[.0018,(.058-r0)/2,.001],Ink,0);K.pop();}
    K.push([c[0],c[1],c[2]+.0156],0,0,-D.mark);K.box([0,.061,0],[.004,.005,.001],K.mt([196,52,38],.2,4,0,.15),0);K.pop();   /* верная метка */
    K.box([.072,.03,.061],[.02,.008,.004],K.mt([24,24,26],.4,8,P.brushed),.002);   /* ручка выверки */
    K.pop();
    /* стрелка — своя часть: её поворачивает кадр (hallInstrPose) вокруг центра шкалы */
    K.part=i+1;K.box([0,.022,.0175],[.0022,.036,.0012],K.mt([30,28,26],.3,6,0,0,true),0);
    K.box([0,-.008,.0175],[.004,.008,.0012],K.mt([30,28,26],.3,6,0,0,true),0);
    K.push([0,0,.019],0,Math.PI/2);K.lathe([[0,.006],[.003,0]],8,K.mt([150,40,30],.4,8,0,0,true));K.pop();});
  K.part=0;
  return K.pack();
}
/* сетка по ключу: завод, износ, деления, отключённые, горящий */
function hallInstrUp(){
  const key=INSTR_KEYS.map(id=>{const D=hallInstrLook(id);return D.T.ru+":"+D.ticks+":"+(D.off?1:0);}).join(",")+"|"+HALL_INSTR.hot;
  if(!HALL_INSTR.mesh||HALL_INSTR.key!==key){r3Drop(HALL_INSTR.mesh);HALL_INSTR.mesh=hallInstrMesh();HALL_INSTR.key=key;}
  return HALL_INSTR.mesh;
}
/* стрелки в кадре: часть i+1 экземпляра ii — центр шкалы i-го прибора и поворот по часовой */
function hallInstrPose(M,ii,t){
  INSTR_KEYS.forEach((id,i)=>{const p=hallInstrAt(i),c=HALL_INSTR_C;
    M.set(r3Xf([p[0]+c[0],p[1]+c[1],p[2]+c[2]],0,0,-hallInstrNeedle(id,t)),(ii*R3_PART+i+1)*16);});
}
function hallInstrDrop(){r3Drop(HALL_INSTR.mesh);HALL_INSTR.mesh=null;HALL_INSTR.key="";HALL_INSTR.hot=null;}

/* ── плита: шкала рисунком (SVG) — деления, метка, стрелка гуляет (CSS), лента самописца пером прибора ── */
function hallDialSvg(D,mini){
  const cx=60,cy=54,R=40,deg=a=>a*180/Math.PI,pt=(a,r)=>[(cx+Math.sin(a)*r).toFixed(1),(cy-Math.cos(a)*r).toFixed(1)];
  let s="<svg class='hdial-svg"+(mini?" mini":"")+"' viewBox='0 0 120 92' aria-hidden='true'>";
  s+="<rect x='8' y='6' width='104' height='82' rx='9' fill='rgb("+D.house.join(",")+")'/>";
  s+="<circle cx='"+cx+"' cy='"+cy+"' r='"+(R+3)+"' fill='#b8914e'/><circle cx='"+cx+"' cy='"+cy+"' r='"+R+"' fill='#e4ddc9'/>";
  for(let k=0;k<D.ticks;k++){const a=-.95+1.9*k/(D.ticks-1),big=k%Math.max(1,Math.round((D.ticks-1)/4))===0,p0=pt(a,big?26:30),p1=pt(a,35);
    s+="<line x1='"+p0[0]+"' y1='"+p0[1]+"' x2='"+p1[0]+"' y2='"+p1[1]+"' stroke='#26231f' stroke-width='"+(big?1.6:1)+"'/>";}
  /* разбитый (износ ≥ .6) — трещина по стеклу: износ читается с карточки раньше слова */
  if(D.w>=.6)s+="<polyline points='"+(cx-30)+","+(cy-14)+" "+(cx-12)+","+(cy-6)+" "+(cx-4)+","+(cy+6)+" "+(cx+18)+","+(cy+12)+"' fill='none' stroke='rgba(40,36,30,.55)' stroke-width='.8'/>";
  const m0=pt(D.mark,36),m1=pt(D.mark,40);
  s+="<line x1='"+m0[0]+"' y1='"+m0[1]+"' x2='"+m1[0]+"' y2='"+m1[1]+"' stroke='#c4362a' stroke-width='3'/>";
  /* стрелка: стоит на уводе от метки (износ), гуляет по нему (drift) и дрожит (jit) — анимация CSS, без мигания */
  const d=D.off?-.95:D.mark+D.drift*.7*((D.i&1)?1:-1),amp=D.off?0:Math.max(.6,deg(D.drift)*.5+deg(D.jit)*1.5);
  const dur=D.off?0:clamp(3.2/(D.T.jit*(1+D.w)),.9,6);
  s+="<g class='hneedle' style='--d:"+deg(d).toFixed(1)+"deg;--a:"+amp.toFixed(1)+"deg;animation-duration:"+dur.toFixed(2)+"s'>";
  s+="<line x1='"+cx+"' y1='"+(cy+7)+"' x2='"+cx+"' y2='"+(cy-33)+"' stroke='#1d1b19' stroke-width='1.6' stroke-linecap='round'/></g>";
  s+="<circle cx='"+cx+"' cy='"+cy+"' r='3.2' fill='#8e2a20'/>";
  /* лента самописца под шкалой: толщина — перо, размах — дрожь стрелки */
  let pl="";for(let k=0;k<=24;k++){const x=22+k*3.2,y=80+Math.sin(k*1.9+D.i)*Math.min(5,1+D.T.jit*1.6*(1+D.w))*((k*7+D.i*3)%5/5+.3);pl+=x.toFixed(1)+","+y.toFixed(1)+" ";}
  s+="<rect x='18' y='72' width='84' height='14' rx='2' fill='#d9d2bd'/><polyline points='"+pl+"' fill='none' stroke='#2c3a5a' stroke-width='"+(.6+D.pen*.9).toFixed(2)+"'/>";
  return s+"</svg>";
}
/* строки 26b → карточки: гнёзда сеткой по пять, прилавок — тоже шкалами; проза строки — в теги */
function hallInstrDress(){
  if(!HALL.open)return;
  const secs=[...$body.querySelectorAll(".sec")];
  for(const s of secs){if(/^ПЯТЬ ГНЁЗД/.test(s.textContent))s.textContent="ПЯТЬ ГНЁЗД ПАНЕЛИ";else if(/^ПРИЛАВОК/.test(s.textContent))s.textContent="ПРИЛАВОК";}
  /* карточка: шкала, имя, завод тегом, износ словом; сравнение с вашим — тегом; вторая строка-проза (подписка) уходит в подсказку кнопки */
  const card=(r,D,name,cmp)=>{r.classList.add("hdial");
    const ns=[...r.querySelectorAll(":scope>.nm")],nm=ns[0];
    /* сравнение тегом в одно слово (карточка узкая), полная фраза — в подсказке */
    if(nm)nm.innerHTML="<b>"+name+"</b><i class='cls'>"+D.T.ru+"</i>"+(cmp?"<i class='cmp "+(cmp[0]==="л"?"up":cmp[0]==="х"?"dn":"eq")+"' title='различает "+cmp+"'>"+(cmp[0]==="л"?"лучше":cmp[0]==="х"?"хуже":"как ваш")+"</i>":"")+"<s>"+instrWearRu(D.w)+"</s>";
    for(const x of ns.slice(1))if(x.textContent.length>24){const b=r.querySelector("button:last-of-type");if(b)b.title=x.textContent;x.remove();}
    r.insertAdjacentHTML("afterbegin",hallDialSvg(D,false));};
  const sock=[...$body.querySelectorAll(".row[data-instr]")];
  if(sock.length){const box=el("div","hdials");sock[0].before(box);
    for(const r of sock){const D=hallInstrLook(r.dataset.instr);card(r,D,INSTR_BY_ID[r.dataset.instr].ru,"");box.appendChild(r);}}
  const offs=[...$body.querySelectorAll(".row[data-offer]")];
  if(offs.length){const box=el("div","hdials");offs[0].before(box);
    for(const r of offs){const u=r.__u,T=instrTraits(u),w=clamp(u.wear||0,0,1),D=Object.assign(hallInstrLook(r.dataset.offer),{u,T,w,
        ticks:Math.round(clamp(4+9*T.res*(1-w*.45),5,21)),drift:(.04+.3*w)*T.drift,jit:.01*T.jit*(1+w),pen:T.pen,house:HALL_INSTR_HOUSE[T.ru]||[92,96,84],off:false});
      card(r,D,INSTR_BY_ID[r.dataset.offer].ru,r.dataset.cmp||"");box.appendChild(r);}}
  if(HALL_INSTR.hot)for(const r of $body.querySelectorAll(".row.hdial"))r.classList.toggle("hot",(r.dataset.instr||r.dataset.offer)===HALL_INSTR.hot);
}
