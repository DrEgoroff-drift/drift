/* ══════════════ приборы: пять вещей на верстаке (M813–M814, docs/DESIGN-hall.md §8) ══════════════
   Пять гнёзд панели — пять вещей на верстаке у окна, под рабочей лампой. У каждой своё тело, чтобы с 45 px
   читались пять силуэтов, а не пять коробочек: ХРОНОМЕТР — циферблат с двумя малыми кругами под куполом
   и заводной головкой на цоколе; КУРСОГРАФ — плоский барабан с розой курса в вилке, окно ленты спереди;
   МАСС-ДЕТЕКТОР — длинная шкала с коромыслом и грузом-бегунком; ПРИЁМНИК — стоячий ящик с полосой частот,
   бегунком, столбиком сигнала и усом антенны; АКТИНОМЕТР — дуга на стойке с трубкой-датчиком и зеркальцем.
   Материал — завод: казённый — серая эмаль с клеймом, «Сирин» — орех с латунью, артельный — сырой алюминий
   с заклёпками, «Горн» — чёрный бакелит, трофейный — хром с чужой надписью, «Веха» — синяя эмаль.
   Стрелка (бегунок, роза, трубка) гуляет так, как прибор врёт: износ и завод (drift) уводят её от красной
   метки медленной волной, нервная (jit) дрожит поверх; делений столько, сколько прибор различает.
   На плите строки — карточки с тем же телом рисунком; проза ушла (26b строит строки, здесь — переложено). */
const HALL_INSTR={mesh:null,key:"",hot:null,svgN:0};
/* материал корпуса по заводу (ключ u.w, INSTR_WORKS 05b): цвет, металл, блеск, узор; отделка; знак; рисунок плиты */
const HALL_INSTR_MAT={
  kazenny:{c:[112,118,110],s:.2,g:9,p:0,trim:"steel",mark:"stamp",sv:["#7d827a","#5a5e57"]},
  sirin:{c:[104,64,38],s:.12,g:6,p:"wood",trim:"brass",mark:"band",sv:["#7a4c2c","#4c2c18"]},
  artel:{c:[168,170,168],s:.7,g:8,p:"brushed",trim:"steel",mark:"rivets",sv:["#bcbebc","#8a8c8a"]},
  gorn:{c:[30,28,27],s:.15,g:16,p:0,trim:"steel",mark:"gloss",sv:["#34312e","#121110"]},
  trofey:{c:[196,200,206],s:.95,g:18,p:0,trim:"steel",mark:"label",sv:["#e6eaf0","#8a8e96","#d2d6dc"]},
  vekha:{c:[46,58,82],s:.25,g:10,p:0,trim:"brass",mark:"",sv:["#43547a","#26324a"]}};
/* блик плиты по материалу (M814): эмаль — точка, латунь — полоса, хром — полоса окна с чёрной щелью,
   бакелит — глубокий узкий по кромке, алюминий — матовый, без блика, заклёпки */
const HALL_INSTR_HL={kazenny:"spot",sirin:"band",artel:"matte",gorn:"gloss",trofey:"window",vekha:"spot"};
/* рамка тела рисунком (viewBox 120×92): x0,x1,y0,y1 — по ней блик, тень и проверка света */
const HALL_DIAL_BOX={chrono:[22,98,6,88],course:[8,112,8,87],mass:[4,116,27,84],radio:[22,94,14,88],actino:[20,100,8,88]};
/* ключ плиты сверху-слева: верх тела светлее (белый .28), низ темнее (чёрный .42) — эти же числа меряет тест */
const HALL_DIAL_KEY={hi:.28,lo:.42};
/* тела: ширина и высота силуэта (м), передняя грань (полуглубина), точка шкалы — её ловит объектив */
const HALL_INSTR_BODY={chrono:{w:.24,h:.25,d:.07,f:[0,.15,.04]},course:{w:.26,h:.21,d:.11,f:[0,.105,0]},
  mass:{w:.36,h:.13,d:.05,f:[0,.07,.05]},radio:{w:.17,h:.38,d:.06,f:[0,.14,.06]},actino:{w:.2,h:.27,d:.06,f:[0,.13,.02]}};
/* ряд на столешнице (кости 27f4b: верх .91, передний край z −1.92): слева направо по ширине тел с шагом .1,
   первый правее человека у левого края верстака, последний левее пилота у окна (x 2.62) — продавец вещь не заслоняет */
const HALL_INSTR_X0=.5,HALL_INSTR_GAP=.1;
function hallInstrAt(i){
  let x=HALL_INSTR_X0;for(let k=0;k<i;k++)x+=HALL_INSTR_BODY[INSTR_KEYS[k]].w+HALL_INSTR_GAP;
  return [x+HALL_INSTR_BODY[INSTR_KEYS[i]].w/2,.91,-2.06];
}
/* точка шкалы i-го прибора в зале */
function hallInstrFace(i){const p=hallInstrAt(i),f=HALL_INSTR_BODY[INSTR_KEYS[i]].f;return [p[0]+f[0],p[1]+f[1],p[2]+f[2]];}
/* места зала, где верстак с приборами в кадре: вкладка ПРИБОРЫ живёт у окна (группа КОРАБЛЬ), знания — у верстака */
const HALL_INSTR_PLACES=["ship","know"];
/* что прибор показывает: деления, верная метка, как гуляет стрелка, перо; u — свой экземпляр (прилавок) или гнездо */
function hallInstrLook(id,uu){
  const u=uu||instrUnit(id),T=instrTraits(u),w=clamp(u.wear||0,0,1),q=T.res*(1-w*.45),i=INSTR_KEYS.indexOf(id);
  const off=!uu&&typeof subOff==="function"&&subOff(u);
  return {id,u,T,w,q,i,off,mk:HALL_INSTR_MAT[u.w]?u.w:"kazenny",ticks:Math.round(clamp(4+9*q,5,21)),mark:((hashi(i,0x1D5)>>>0)%7-3)*.09,
    drift:(.04+.3*w)*T.drift,jit:.01*T.jit*(1+w),pen:T.pen};
}
/* показание (рад шкалы, по часовой от верха; у бегунков — доля хода ×.95) в момент t: метка + медленный увод + дрожь */
function hallInstrNeedle(id,t){
  const D=hallInstrLook(id),ph=D.i*1.7;
  if(D.off)return -.95;
  return D.mark+D.drift*(.6+.4*Math.sin(t*.11+ph))*Math.sin(t*.23+ph*.5)+D.jit*Math.sin(t*5.1+ph)*(.6+.4*Math.sin(t*.7));
}
/* ход бегунка (м) на полное показание ±.95: груз по коромыслу, метка по полосе частот */
const HALL_INSTR_RUN={mass:.12,radio:.058};

/* ── тела в зале ── */
function hallInstrBody(K,id,D,hot){
  const P=R3P,M=HALL_INSTR_MAT[D.mk],B=HALL_INSTR_BODY[id],Hm=K.mt(M.c,M.s,M.g,M.p?P[M.p]:0);
  const Tr=hot?K.mt(HALL_GOODS_ACC,.3,6,0,1.1,true):M.trim==="brass"?K.mt([196,156,84],.9,12,P.brushed):K.mt([176,180,184],.85,12,P.brushed);
  const Fc=K.mt([228,222,204],.2,4,0,.04),Ink=K.mt([34,32,30],.2,4,0),Red=K.mt([196,52,38],.2,4,0,.15),Dk=K.mt([38,36,34],.3,6,0);
  const n=D.ticks,tk=k=>-.95+1.9*k/(n-1),big=k=>k%Math.max(1,Math.round((n-1)/4))===0;
  /* деления по дуге в плоскости z: центр c, радиусы r0..r1 (крупные длиннее внутрь) */
  const arc=(c,r0,r1)=>{for(let k=0;k<n;k++){const rb=big(k)?r0-(r1-r0)*.6:r0;K.push(c,0,0,-tk(k));K.box([0,(rb+r1)/2,0],[.0014,(r1-rb)/2,.0008],Ink,0);K.pop();}
    K.push(c,0,0,-D.mark);K.box([0,r1+.004,0],[.003,.004,.0008],Red,0);K.pop();};
  let fr;   /* передняя грань под знак завода: x0,x1,y0,y1,z */
  if(id==="chrono"){
    K.box([0,.035,0],[.12,.035,.07],Hm,.012);
    K.push([0,.15,0],0,Math.PI/2);K.lathe([[-.03,.082],[.03,.082],[.034,.074],[.034,0]],22,Hm);K.pop();
    K.push([0,.15,.034],0,Math.PI/2);K.lathe([[0,.079],[.006,.075],[.007,.068]],22,Tr);K.pop();   /* обод купола */
    K.push([0,.15,.035],0,Math.PI/2);K.lathe([[0,.068],[.001,0]],22,Fc);K.pop();
    arc([0,.15,.0365],.052,.062);
    for(const s of [-1,1]){K.push([s*.026,.124,.0364],0,Math.PI/2);K.lathe([[0,.015],[.0006,.0135],[.0008,0]],12,K.mt([206,198,176],.2,4,0,.03));K.pop();
      K.push([s*.026,.124,.0374],0,0,s*.9);K.box([0,.006,0],[.0012,.007,.0005],Ink,0);K.pop();}   /* два малых круга */
    K.box([0,.236,0],[.004,.006,.004],Tr,.001);K.push([0,.24,0]);K.lathe([[0,.012],[.01,.012],[.014,0]],10,Tr);K.pop();   /* головка */
    K.ell([-.034,.186,.043],[.013,.007,.002],K.mt([255,255,255],.1,3,0,.35,true),4,8);   /* блик купола */
    fr=[-.12,.12,0,.07,.07];
  }else if(id==="course"){
    K.box([0,.008,0],[.13,.008,.08],Hm,.004);
    for(const s of [-1,1])K.box([s*.122,.065,0],[.008,.057,.014],Tr,.003);   /* вилка */
    K.push([0,.105,0],0,.95);   /* барабан наклонён к залу: роза видна с места КОРАБЛЬ */
    K.lathe([[-.028,.104],[.022,.104],[.026,.096],[.026,0]],24,Hm);
    K.push([0,.026,0]);K.lathe([[0,.1],[.005,.096],[.006,.09]],24,Tr);K.pop();
    K.push([0,.0265,0]);K.lathe([[0,.09],[.001,0]],24,Fc);K.pop();
    for(let j=0;j<8;j++){const l=j%2?.026:.042;K.push([0,.0278,0],j*Math.PI/4);K.box([0,0,-l],[j%2?.004:.006,.0007,l],j===0?Red:Ink,0);K.pop();}   /* роза */
    for(let k=0;k<n;k++){K.push([0,.0278,0],-tk(k));K.box([0,0,big(k)?-.08:-.083],[.0014,.0007,big(k)?.008:.005],Ink,0);K.pop();}
    K.push([0,.0279,0],-D.mark);K.box([0,0,-.093],[.004,.0008,.004],Red,0);K.pop();
    K.pop();
    K.box([0,.034,.095],[.07,.026,.012],Hm,.005);K.box([0,.036,.1075],[.054,.009,.001],Fc,0);   /* окно ленты */
    K.box([0,.036,.1087],[.05,.0008+.0006*D.pen,.0005],K.mt([44,58,90],.2,4,0),0);
    fr=[-.07,.07,.008,.06,.107];
  }else if(id==="mass"){
    K.box([0,.045,0],[.18,.045,.05],Hm,.008);
    K.box([0,.05,.0505],[.14,.02,.001],Fc,0);
    for(let k=0;k<n;k++){const x=HALL_INSTR_RUN.mass*tk(k)/.95,b=big(k);K.box([x,b?.054:.057,.052],[.0012,b?.012:.009,.0008],Ink,0);}
    K.box([HALL_INSTR_RUN.mass*D.mark/.95,.068,.052],[.003,.004,.0008],Red,0);
    K.box([0,.1,0],[.01,.01,.01],Tr,.002);K.box([0,.113,0],[.165,.0035,.006],Tr,.001);   /* опора и коромысло */
    for(const s of [-1,1])K.ell([s*.165,.103,0],[.014,.016,.014],Tr,6,8);
    fr=[-.18,.18,0,.09,.05];
  }else if(id==="radio"){
    K.box([0,.1,0],[.085,.1,.06],Hm,.012);
    K.box([0,.158,.06],[.07,.021,.0008],Tr,0);K.box([0,.158,.0605],[.066,.017,.001],Fc,0);   /* полоса частот */
    for(let k=0;k<n;k++){const x=HALL_INSTR_RUN.radio*tk(k)/.95,b=big(k);K.box([x,b?.15:.152,.0618],[.001,b?.009:.006,.0006],Ink,0);}
    K.box([HALL_INSTR_RUN.radio*D.mark/.95,.171,.0618],[.003,.003,.0006],Red,0);
    for(let j=0;j<6;j++)K.box([-.014,.04+j*.013,.0608],[.058,.0022,.001],Dk,0);   /* решётка */
    const lit=Math.round(1+clamp(D.q,0,1.5)*2.6);
    for(let j=0;j<5;j++)K.box([.064,.036+j*.016,.0612],[.008,.0055,.0008],j<lit?K.mt([255,170,60],.2,4,0,.8,true):Dk,0);   /* столбик сигнала */
    K.push([.066,.2,-.03],0,0,-.2);K.box([0,.16,0],[.0028,.16,.0028],Tr,0);K.ell([0,.322,0],[.006,.006,.006],Tr,4,6);K.pop();   /* ус */
    fr=[-.085,.085,0,.2,.06];
  }else{   /* actino */
    K.box([0,.025,0],[.09,.025,.06],Hm,.008);K.box([0,.08,0],[.012,.055,.012],Hm,.003);
    for(let k=0;k<=20;k++){K.push([0,.13,0],0,0,-(-1.02+2.04*k/20));K.box([0,.098,0],[.0056,.007,.004],Fc,0);K.pop();}   /* дуга */
    arc([0,.13,.0045],.096,.106);
    K.push([0,.13,.012],0,Math.PI/2);K.lathe([[0,.016],[.006,.012],[.008,0]],12,Tr);K.pop();
    K.push([0,.074,.022],0,-.6);K.box([0,0,0],[.022,.022,.002],K.mt([220,228,236],.95,30,0,.05),0);K.pop();   /* зеркальце */
    fr=[-.09,.09,0,.05,.06];
  }
  /* знак завода на передней грани */
  const [x0,x1,y0,y1,z]=fr;
  if(M.mark==="stamp"){K.box([x0+.022,y0+.016,z+.001],[.014,.008,.001],K.mt([150,40,32],.3,5,0),0);K.box([x0+.022,y0+.016,z+.002],[.009,.0012,.0005],K.mt([230,210,190],.2,4,0),0);}
  else if(M.mark==="rivets"){for(const x of [x0+.01,x1-.01])for(const y of [y0+.01,y1-.01])K.ell([x,y,z+.001],[.0045,.0045,.003],K.mt([206,208,210],.8,10,0),3,6);}
  else if(M.mark==="label"){K.box([x1-.032,y0+.017,z+.001],[.024,.01,.001],K.mt([226,214,180],.2,4,0),0);
    for(const y of [-.004,.003])K.box([x1-.034,y0+.017+y,z+.002],[.017,.0011,.0005],Ink,0);}
  else if(M.mark==="band")K.box([0,y0+.005,z+.001],[(x1-x0)/2,.004,.001],Tr,0);
}
/* стрелка — своя часть: её двигает кадр (hallInstrPose); строится в начале координат своего шарнира */
function hallInstrNeedleMesh(K,id){
  const N=K.mt([30,28,26],.3,6,0,0,true),Rd=K.mt([210,44,32],.3,6,0,.2,true);
  if(id==="chrono"){K.box([0,.024,.004],[.0018,.034,.0012],N,0);K.box([0,-.008,.004],[.0035,.008,.0012],N,0);
    K.push([0,0,.006],0,Math.PI/2);K.lathe([[0,.005],[.003,0]],8,K.mt([150,40,30],.4,8,0,0,true));K.pop();}
  else if(id==="course"){K.box([0,.0295,-.045],[.0022,.0009,.045],N,0);K.push([0,.03,0]);K.lathe([[0,.006],[.003,0]],8,K.mt([150,40,30],.4,8,0,0,true));K.pop();}
  else if(id==="mass"){K.box([0,.122,0],[.012,.009,.011],N,.002);K.box([0,.088,.0545],[.0016,.03,.0008],Rd,0);}
  else if(id==="radio")K.box([0,.158,.0625],[.0022,.016,.0008],Rd,0);
  else{K.lathe([[0,.0085],[.088,.0085],[.092,.011],[.1,.011],[.1,0]],10,N);K.push([0,.1,0]);K.lathe([[0,.011],[.004,0]],10,K.mt([196,156,84],.9,12,R3P.brushed,0,true));K.pop();}
}
function hallInstrMesh(){
  const K=r3Kit();
  INSTR_KEYS.forEach((id,i)=>{const D=hallInstrLook(id);
    K.part=0;K.push(hallInstrAt(i));hallInstrBody(K,id,D,HALL_INSTR.hot===id);K.pop();
    K.part=i+1;hallInstrNeedleMesh(K,id);});
  K.part=0;
  return K.pack();
}
/* сетка по ключу: завод, износ, деления, отключённые, горящий */
function hallInstrUp(){
  const key=INSTR_KEYS.map(id=>{const D=hallInstrLook(id);return D.mk+":"+D.ticks+":"+(D.off?1:0)+":"+Math.round(D.q*4);}).join(",")+"|"+HALL_INSTR.hot;
  if(!HALL_INSTR.mesh||HALL_INSTR.key!==key){r3Drop(HALL_INSTR.mesh);HALL_INSTR.mesh=hallInstrMesh();HALL_INSTR.key=key;}
  return HALL_INSTR.mesh;
}
/* матрица стрелки i-го прибора при показании a: поворот у циферблата и дуги, наклонённая роза, бегунки — сдвиг */
function hallInstrXf(i,a){
  const id=INSTR_KEYS[i],p=hallInstrAt(i);
  if(id==="chrono")return r3Xf([p[0],p[1]+.15,p[2]+.0365],0,0,-a);
  if(id==="course")return r3Mul(r3Xf([p[0],p[1]+.105,p[2]],0,.95,0),r3Xf([0,0,0],-a,0,0));
  if(id==="actino")return r3Xf([p[0],p[1]+.13,p[2]+.02],0,0,-a);
  return r3Xf([p[0]+HALL_INSTR_RUN[id]*a/.95,p[1],p[2]],0,0,0);
}
function hallInstrPose(M,ii,t){INSTR_KEYS.forEach((id,i)=>M.set(hallInstrXf(i,hallInstrNeedle(id,t)),(ii*R3_PART+i+1)*16));}
function hallInstrDrop(){r3Drop(HALL_INSTR.mesh);HALL_INSTR.mesh=null;HALL_INSTR.key="";HALL_INSTR.hot=null;}

/* ── плита: то же тело рисунком (SVG) на настиле карточки; стрелка гуляет (CSS), у курсографа — лента пером ── */
function hallDialSvg(D){
  const id=D.id,M=HALL_INSTR_MAT[D.mk],g="hg"+(++HALL_INSTR.svgN),deg=a=>(a*180/Math.PI).toFixed(1);
  const tr=M.trim==="brass"?"#b8914e":"#b4b8bc",TR="url(#"+g+"t)",fc="#e4ddc9",ink="#26231f",red="#c4362a",F="url(#"+g+")' stroke='rgba(255,255,255,.18)' stroke-width='.8";   /* кромка: чёрный бакелит не тонет в настиле */
  const n=D.ticks,tk=k=>-.95+1.9*k/(n-1),big=k=>k%Math.max(1,Math.round((n-1)/4))===0;
  const at=(cx,cy,a,r)=>(cx+Math.sin(a)*r).toFixed(1)+","+(cy-Math.cos(a)*r).toFixed(1);
  const L=(a,b,c,w)=>"<line x1='"+a.split(",")[0]+"' y1='"+a.split(",")[1]+"' x2='"+b.split(",")[0]+"' y2='"+b.split(",")[1]+"' stroke='"+c+"' stroke-width='"+w+"'/>";
  const arc=(cx,cy,r0,r1)=>{let s="";for(let k=0;k<n;k++)s+=L(at(cx,cy,tk(k),big(k)?r0-(r1-r0)*.6:r0),at(cx,cy,tk(k),r1),ink,big(k)?1.5:1);
    return s+L(at(cx,cy,D.mark,r1+1),at(cx,cy,D.mark,r1+5),red,3);};
  /* стрелка стоит на уводе от метки (износ), гуляет (drift) и дрожит (jit); отключённая — на упоре, без хода */
  const d=D.off?-.95:D.mark+D.drift*.7*((D.i&1)?1:-1),amp=D.off?0:Math.max(.011,D.drift*.5+D.jit*1.5);
  const dur=(D.off?0:clamp(3.2/(D.T.jit*(1+D.w)),.9,6)).toFixed(2)+"s";
  const rot=(ox,oy,body)=>"<g class='hneedle' style='transform-origin:"+ox+"px "+oy+"px;--d:"+deg(d)+"deg;--a:"+deg(amp)+"deg;animation-duration:"+dur+"'>"+body+"</g>";
  const slide=(run,body)=>"<g class='hslide' style='--d:"+(d/.95*run).toFixed(1)+"px;--a:"+Math.max(.6,amp/.95*run).toFixed(1)+"px;animation-duration:"+dur+"'>"+body+"</g>";
  let s="<svg class='hdial-svg' data-kind='"+id+"' viewBox='0 0 120 92' aria-hidden='true'><defs><linearGradient id='"+g+"' x1='0' y1='0' x2='0' y2='1'>";
  M.sv.forEach((c,k)=>{s+="<stop offset='"+(k/(M.sv.length-1))+"' stop-color='"+c+"'/>";});
  const st=(o,c,a)=>"<stop offset='"+o+"' stop-color='"+c+"' stop-opacity='"+a+"'/>",[bx0,bx1,by0,by1]=HALL_DIAL_BOX[id],bw=bx1-bx0,bh=by1-by0;
  const TS=M.trim==="brass"?["#f0d595","#b8914e","#664a20"]:["#f0f3f6","#a8acb0","#565a5e"];
  s+="</linearGradient><linearGradient id='"+g+"t' x1='0' y1='0' x2='0' y2='1'>"+st(0,TS[0],1)+st(.45,TS[1],1)+st(1,TS[2],1)+"</linearGradient>";
  s+="<linearGradient id='"+g+"k' x1='.15' y1='0' x2='.45' y2='1'>"+st(0,"#fff",HALL_DIAL_KEY.hi)+st(.42,"#fff",0)+st(.58,"#000",0)+st(1,"#000",HALL_DIAL_KEY.lo)+"</linearGradient>";
  s+="<radialGradient id='"+g+"s'>"+st(0,"#000",.62)+st(.7,"#000",.25)+st(1,"#000",0)+"</radialGradient>";
  s+="<radialGradient id='"+g+"h'>"+st(0,"#fff",.9)+st(.35,"#fff",.45)+st(1,"#fff",0)+"</radialGradient>";
  s+="<linearGradient id='"+g+"b' x1='0' y1='0' x2='1' y2='0'>"+st(0,"#fff",0)+st(.5,"#fff",.42)+st(1,"#fff",0)+"</linearGradient>";
  /* контактная тень: мягкая, под основанием, высотой ≤ четверти тела */
  s+="</defs><ellipse cx='"+((bx0+bx1)/2)+"' cy='"+(by1+.5)+"' rx='"+(bw/2+3)+"' ry='3.4' fill='url(#"+g+"s)'/>";
  let fr;
  if(id==="chrono"){
    s+="<rect x='14' y='62' width='92' height='26' rx='4' fill='"+F+"'/><rect x='56' y='1' width='8' height='6' rx='2' fill='"+TR+"'/>";
    s+="<circle cx='60' cy='44' r='38' fill='"+F+"'/><circle cx='60' cy='44' r='34' fill='"+TR+"'/><circle cx='60' cy='44' r='30' fill='"+fc+"'/>"+arc(60,44,22,28);
    for(const x of [50,70])s+="<circle cx='"+x+"' cy='54' r='6' fill='#d3c9ad' stroke='"+ink+"' stroke-width='.6'/>"+L(x+",54",(x+(x<60?-3:3))+",50",ink,.8);
    s+=rot(60,44,"<line x1='60' y1='50' x2='60' y2='17' stroke='#1d1b19' stroke-width='1.6' stroke-linecap='round'/>")+"<circle cx='60' cy='44' r='2.6' fill='#8e2a20'/>";
    s+="<path d='M38 30 A26 26 0 0 1 52 20' fill='none' stroke='rgba(255,255,255,.55)' stroke-width='2' stroke-linecap='round'/>";
    fr=[14,106,62,88];
  }else if(id==="course"){
    s+="<rect x='12' y='80' width='96' height='7' rx='2' fill='"+F+"'/><rect x='8' y='26' width='6' height='56' rx='2' fill='"+TR+"'/><rect x='106' y='26' width='6' height='56' rx='2' fill='"+TR+"'/>";
    s+="<ellipse cx='60' cy='42' rx='46' ry='34' fill='"+F+"'/><ellipse cx='60' cy='42' rx='42' ry='30' fill='"+TR+"'/><ellipse cx='60' cy='42' rx='38' ry='27' fill='"+fc+"'/>";
    let r="";for(let j=0;j<8;j++){const a=j*Math.PI/4,l=j%2?17:28,w=j%2?3:4.5,p1=at(0,0,a,l),pl=at(0,0,a-Math.PI/2,w),pr=at(0,0,a+Math.PI/2,w);
      r+="<polygon points='"+p1+" "+pl+" "+pr+"' fill='"+(j===0?red:ink)+"'/>";}
    for(let k=0;k<n;k++)r+=L(at(0,0,tk(k),big(k)?29:31),at(0,0,tk(k),35),ink,big(k)?1.4:.9);
    r+=L(at(0,0,D.mark,35.5),at(0,0,D.mark,38),red,3);
    s+="<g transform='translate(60 42) scale(1 .72)'>"+r+rot(0,0,"<line x1='0' y1='4' x2='0' y2='-33' stroke='#1d1b19' stroke-width='1.8' stroke-linecap='round'/>")+"<circle r='3' fill='#8e2a20'/></g>";
    let pl="";for(let k=0;k<=16;k++){const x=40+k*2.5,y=78+Math.sin(k*1.9+D.i)*Math.min(3,.8+D.T.jit*1.2*(1+D.w))*((k*7+D.i*3)%5/5+.3);pl+=x.toFixed(1)+","+y.toFixed(1)+" ";}
    s+="<path class='glass' d='M24 36 A38 27 0 0 1 44 18' fill='none' stroke='rgba(255,255,255,.5)' stroke-width='2' stroke-linecap='round'/>";
    s+="<rect x='34' y='70' width='52' height='16' rx='3' fill='"+F+"'/><rect x='38' y='73' width='44' height='10' rx='1.5' fill='#d9d2bd'/>";
    s+="<polyline points='"+pl+"' fill='none' stroke='#2c3a5a' stroke-width='"+(.5+D.pen*.7).toFixed(2)+"'/>";
    fr=[34,86,70,86];
  }else if(id==="mass"){
    s+="<rect x='4' y='44' width='112' height='40' rx='5' fill='"+F+"'/><rect x='14' y='51' width='92' height='20' rx='2' fill='"+fc+"'/>";
    for(let k=0;k<n;k++){const x=(60+44*tk(k)/.95).toFixed(1);s+=L(x+",53",x+","+(big(k)?67:62),ink,big(k)?1.3:.9);}
    const mx=(60+44*D.mark/.95).toFixed(1);s+=L(mx+",71",mx+",75",red,3);
    s+="<polygon points='60,30 53,44 67,44' fill='"+TR+"'/><rect x='6' y='27' width='108' height='3.5' rx='1.5' fill='"+TR+"'/>";
    for(const x of [9,111])s+="<circle cx='"+x+"' cy='35' r='6' fill='"+TR+"'/>";
    s+=slide(44,"<rect x='55' y='19' width='10' height='9' rx='2' fill='#2a2826'/><line x1='60' y1='28' x2='60' y2='68' stroke='#d22c20' stroke-width='1.6'/>");
    s+="<polygon class='glass' points='16,52 34,52 24,70 16,70' fill='rgba(255,255,255,.22)'/>";
    fr=[4,116,44,84];
  }else if(id==="radio"){
    s+=L("90,18","112,1",tr,2)+"<circle cx='112' cy='1.5' r='2' fill='"+TR+"'/>";
    s+="<rect x='22' y='14' width='72' height='74' rx='6' fill='"+F+"'/><rect x='26' y='19' width='56' height='17' rx='2' fill='"+TR+"'/><rect x='28' y='21' width='52' height='13' rx='1.5' fill='"+fc+"'/>";
    for(let k=0;k<n;k++){const x=(54+22*tk(k)/.95).toFixed(1);s+=L(x+",22",x+","+(big(k)?30:27),ink,big(k)?1.2:.8);}
    const mx=(54+22*D.mark/.95).toFixed(1);s+=L(mx+",21",mx+",19",red,3);
    for(let j=0;j<6;j++)s+="<rect x='28' y='"+(44+j*6.5)+"' width='46' height='2.4' rx='1' fill='rgba(0,0,0,.45)'/>";
    const lit=Math.round(1+clamp(D.q,0,1.5)*2.6);
    for(let j=0;j<5;j++)s+="<rect x='80' y='"+(76-j*8)+"' width='9' height='5.5' rx='1' fill='"+(j<lit?"#ffaa3c":"rgba(0,0,0,.45)")+"'/>";
    s+=slide(22,"<rect x='53' y='20' width='2.2' height='15' fill='#d22c20'/>");
    s+="<rect class='glass' x='29' y='22' width='50' height='2' rx='1' fill='rgba(255,255,255,.4)'/>";
    fr=[22,94,14,88];
  }else{
    s+="<rect x='24' y='74' width='72' height='14' rx='3' fill='"+F+"'/><rect x='56' y='46' width='8' height='30' fill='"+F+"'/>";
    let band="";for(let k=0;k<=20;k++){const a=-1.02+2.04*k/20;band+=(k?" L":"M")+at(60,46,a,40);}for(let k=20;k>=0;k--){const a=-1.02+2.04*k/20;band+=" L"+at(60,46,a,30);}
    s+="<path d='"+band+" Z' fill='"+fc+"' stroke='"+tr+"' stroke-width='1'/>"+arc(60,46,32,38);
    s+="<polygon points='60,56 66,62 60,68 54,62' fill='#dfe5ec' stroke='#9aa0a8' stroke-width='.6'/>";
    s+="<path class='glass' d='M"+at(60,46,-.92,41)+" A41 41 0 0 1 "+at(60,46,-.5,41)+"' fill='none' stroke='rgba(255,255,255,.55)' stroke-width='1.8' stroke-linecap='round'/>";
    s+=rot(60,46,"<rect x='57' y='12' width='6' height='36' rx='2' fill='#4a4c52' stroke='#a4a8b0' stroke-width='.7'/><rect x='56.5' y='10' width='7' height='5' rx='1.5' fill='#b8914e'/>")+"<circle cx='60' cy='46' r='4' fill='"+TR+"'/>";
    fr=[24,96,74,88];
  }
  const [x0,x1,y0,y1]=fr;
  if(M.mark==="stamp")s+="<rect x='"+(x0+4)+"' y='"+(y1-9)+"' width='11' height='6' rx='1' fill='#963028'/><rect x='"+(x0+6)+"' y='"+(y1-6.6)+"' width='7' height='1' fill='#e6d2be'/>";
  else if(M.mark==="rivets"){for(const x of [x0+3.5,x1-3.5])for(const y of [y0+3.5,y1-3.5])
    s+="<circle cx='"+(x+.5)+"' cy='"+(y+.6)+"' r='2.1' fill='rgba(0,0,0,.45)'/><circle cx='"+x+"' cy='"+y+"' r='2' fill='#c8caca' stroke='#5c5e5e' stroke-width='.5'/><circle cx='"+(x-.6)+"' cy='"+(y-.6)+"' r='.7' fill='#f4f5f5'/>";}
  else if(M.mark==="label")s+="<rect x='"+(x1-20)+"' y='"+(y1-10)+"' width='16' height='7' rx='1' fill='#e2d6b4'/><rect x='"+(x1-18)+"' y='"+(y1-8)+"' width='9' height='1' fill='"+ink+"'/><rect x='"+(x1-18)+"' y='"+(y1-5.6)+"' width='12' height='1' fill='"+ink+"'/>";
  else if(M.mark==="band")s+="<rect x='"+x0+"' y='"+(y1-3)+"' width='"+(x1-x0)+"' height='2.5' fill='#b8914e'/>";
  /* разбитый (износ ≥ .6) — трещина по стеклу шкалы: износ читается раньше слова */
  if(D.w>=.6)s+="<polyline points='40,30 50,36 56,46 70,50' fill='none' stroke='rgba(40,36,30,.6)' stroke-width='.8'/>";
  /* ключ сверху-слева: копия каждого тела поверх него тем же контуром — верх светлее, низ темнее; контуры тел — маска блика */
  const fe=new RegExp("<(rect|circle|ellipse|path|polygon)\\b[^>]*fill='url\\(#"+g+"\\)'[^>]*/>","g"),bare=m=>m.replace(/ stroke='[^']*' stroke-width='[^']*'/,"");
  const bodies=s.match(fe)||[];
  s=s.replace(fe,m=>m+bare(m).replace("url(#"+g+")","url(#"+g+"k)"));
  s=s.replace("</defs>","<clipPath id='"+g+"c'>"+bodies.map(bare).join("")+"</clipPath></defs>");
  const hk=HALL_INSTR_HL[D.mk]||"spot";let hl="";
  if(hk==="spot")hl="<circle cx='"+(bx0+bw*.27).toFixed(1)+"' cy='"+(by0+bh*.18).toFixed(1)+"' r='7' fill='url(#"+g+"h)'/>";
  else if(hk==="band")hl="<rect x='"+(bx0+bw*.18).toFixed(1)+"' y='"+by0+"' width='9' height='"+bh+"' fill='url(#"+g+"b)'/>";
  else if(hk==="window"){const y=by0+bh*.2;hl="<rect x='"+bx0+"' y='"+y.toFixed(1)+"' width='"+bw+"' height='7' fill='rgba(255,255,255,.5)'/><rect x='"+bx0+"' y='"+(y+7).toFixed(1)+"' width='"+bw+"' height='2.4' fill='rgba(0,0,0,.6)'/>"
    +"<rect x='"+bx0+"' y='"+(y+12).toFixed(1)+"' width='"+bw+"' height='1.4' fill='rgba(255,255,255,.35)'/>";}
  else if(hk==="gloss")hl="<polyline points='"+(bx0+3)+","+(by0+bh*.42).toFixed(1)+" "+(bx0+3)+","+(by0+5)+" "+(bx0+6)+","+(by0+3)+" "+(bx0+bw*.55).toFixed(1)+","+(by0+3)+"' fill='none' stroke='rgba(255,255,255,.78)' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/>"
    +"<circle cx='"+(bx0+6)+"' cy='"+(by0+5)+"' r='1.6' fill='#fff'/>";
  s+="<g class='hl' data-hl='"+hk+"' clip-path='url(#"+g+"c)'>"+hl+"</g>";
  return s+"</svg>";
}
/* строки 26b → карточки: гнёзда сеткой по пять, прилавок — тоже телами; проза строки — в теги */
function hallInstrDress(){
  if(!HALL.open)return;
  for(const s of $body.querySelectorAll(".sec")){if(/^ПЯТЬ ГНЁЗД/.test(s.textContent))s.textContent="ПЯТЬ ГНЁЗД ПАНЕЛИ";else if(/^ПРИЛАВОК/.test(s.textContent))s.textContent="ПРИЛАВОК";}
  /* карточка: тело, имя, завод тегом, износ словом; сравнение с вашим — тегом в одно слово (карточка узкая),
     полная фраза — в подсказке; вторая строка-проза (подписка) уходит в подсказку кнопки */
  const card=(r,D,name,cmp)=>{r.classList.add("hdial");
    const ns=[...r.querySelectorAll(":scope>.nm")],nm=ns[0];
    if(nm)nm.innerHTML="<b>"+name+"</b><i class='cls'>"+D.T.ru+"</i>"+(cmp?"<i class='cmp "+(cmp[0]==="л"?"up":cmp[0]==="х"?"dn":"eq")+"' title='различает "+cmp+"'>"+(cmp[0]==="л"?"лучше":cmp[0]==="х"?"хуже":"как ваш")+"</i>":"")+"<s>"+instrWearRu(D.w)+"</s>";
    for(const x of ns.slice(1))if(x.textContent.length>24){const b=r.querySelector("button:last-of-type");if(b)b.title=x.textContent;x.remove();}
    r.insertAdjacentHTML("afterbegin",hallDialSvg(D));};
  const sock=[...$body.querySelectorAll(".row[data-instr]")];
  if(sock.length){const box=el("div","hdials");sock[0].before(box);
    for(const r of sock){card(r,hallInstrLook(r.dataset.instr),INSTR_BY_ID[r.dataset.instr].ru,"");box.appendChild(r);}}
  const offs=[...$body.querySelectorAll(".row[data-offer]")];
  if(offs.length){const box=el("div","hdials");offs[0].before(box);
    for(const r of offs){card(r,hallInstrLook(r.dataset.offer,r.__u),INSTR_BY_ID[r.dataset.offer].ru,r.dataset.cmp||"");box.appendChild(r);}}
  if(HALL_INSTR.hot)for(const r of $body.querySelectorAll(".row.hdial"))r.classList.toggle("hot",(r.dataset.instr||r.dataset.offer)===HALL_INSTR.hot);
}
