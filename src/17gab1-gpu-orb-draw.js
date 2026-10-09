/* ══════════════ планета с орбиты: конвейеры и рисование (разрез 17gab, M825c) ══════════════
   Шейдер GOR_WGSL и константы — в 17gab-gpu-orb.js; здесь — семьи конвейеров (gorCode, gorPipe),
   тело (gorBody), вход gpuOrb и луны. */
const gorLin=c=>Math.pow(Math.max(0,c)/255,2.2);
/* ── один конвейер на семью миров ──
   Все двенадцать миров в одной `surf` компилировались 3.1–3.5 с (Blackwell, D3D12): прогрев
   конвейеров кончался позже всех и ворота старта ждали его одного. Константа вместо `k` не
   спасает (2 с — ветки выбрасываются поздно), вырезанная из текста — спасает: семья стоит
   0.2–1.2 с, и строится она асинхронно, когда впервые понадобилась. Пока не готова — рисует
   запасной шар 17ga: подмена на полсекунды лучше замершего кадра. Семьи — по веткам `surf`:
   0 камень+металл, 1 кристалл, 2 руины, 3 газ, 4 джунгли+океан+земля, 5 лёд, 6 токсик,
   7 вулкан, 8 пустыня */
const GOR_FAM=[0,1,2,3,4,5,6,4,7,4,0,8],GOR_CODE=[];
function gorCode(f){
  if(GOR_CODE[f])return GOR_CODE[f];
  const s=GOR_WGSL,a=s.indexOf("fn surf("),b=s.indexOf("fn rx("),body=s.slice(a,b);
  const h=body.indexOf("  if (k == 0 || k == 10) {"),t=body.lastIndexOf("  return o;");
  const parts=body.slice(h,t).split(/\n  \} else (?:if \([^\n]*\) )?\{/);
  /* ветки разошлись с таблицей семей — честнее целый шар, чем чужая ветка */
  if(h<0||t<0||parts.length!==9)return GOR_CODE[f]=s;
  parts[0]=parts[0].replace(/^  if \([^\n]*\) \{/,"");
  parts[8]=parts[8].replace(/\n  \}\s*$/,"");
  return GOR_CODE[f]=s.slice(0,a)+body.slice(0,h)+"  {"+parts[f]+"\n  }\n"+body.slice(t)+s.slice(b);
}
/* конвейер семьи: прогретый (08b1) — сразу; иначе сборка в фоне и null, пока не собран */
function gorPipe(f){
  const key="pipe:gor"+f+"|over",code=gorCode(f),w=GPU_PIPES.warm.get(key);GPU_PIPES.used.add(key);
  if(GPU.lay["gor"+f+"|over"]||(w&&w.p))return gpuPipe("gor"+f,code,"over");
  if(!w){const d=gpuPipesDev(),e={p:null,code};GPU_PIPES.warm.set(key,e);
    d.createRenderPipelineAsync(gpuPipeDesc(code,"over")).then(p=>{if(GPU_PIPES.dev===d)e.p=p;},
      ()=>{GPU_PIPES.warm.delete(key);GOR_CODE[f]=null;});}
  return null;
}
/* газовые гиганты (M703): своя палитра у каждого — по зерну; у мира одна сиреневая на всех, и все
   гиганты галактики выходили близнецами. Тёмное → светлое, пять ступеней, sRGB */
const GOR_GAS=[
  [[70,42,30],[128,82,52],[184,136,96],[222,196,160],[244,232,214]],     /* юпитер: охра и сливки */
  [[96,74,40],[156,124,72],[204,172,112],[232,212,160],[246,236,206]],   /* сатурн: ириска */
  [[40,88,104],[78,140,152],[128,186,192],[180,222,222],[222,244,240]],  /* ледяной: бирюза */
  [[18,32,92],[36,70,150],[70,118,196],[128,170,226],[204,226,248]],     /* глубокий синий */
  [[40,18,16],[92,40,30],[150,72,46],[198,120,80],[232,180,140]],        /* горячий: ржавь */
  [[64,52,24],[124,104,44],[184,160,76],[220,204,130],[242,234,190]],    /* серный */
  [[52,38,72],[96,68,110],[152,116,138],[204,168,158],[238,216,198]],    /* сиреневый, прежний */
  [[24,52,48],[50,96,84],[96,146,120],[156,194,160],[214,232,204]]];     /* аммиачный, зелёный */
/* одно тело: k — мир (GOR.K), pal — палитра 0..255, air — цвет воздуха, th — его толщина */
function gorBody(pass,key,x,y,r,o){
  const fam=GOR_FAM[o.k]|0,P=gorPipe(fam);if(!P)return false;
  const a=GOR.A;a.fill(0);
  const l=Math.hypot(o.sx,o.sy)||1,kx=Math.sqrt(1-GOR_LZ*GOR_LZ)/l;
  a[0]=x;a[1]=y;a[2]=r;a[3]=o.k;
  a[4]=o.sx*kx;a[5]=o.sy*kx;a[6]=GOR_LZ;a[7]=o.turn||0;
  a[8]=gorLin(o.air[0]);a[9]=gorLin(o.air[1]);a[10]=gorLin(o.air[2]);a[11]=o.th||0;
  /* цвет звезды — наполовину к белому: палитра мира должна читаться и у красного карлика */
  /* у гиганта — на три четверти к белому (M703): облака сами цветные, и под тёплой звездой все гиганты
     сползали в одну желтизну */
  const tw=o.k===3?.75:.5;
  a[12]=tw+(1-tw)*o.sun[0];a[13]=tw+(1-tw)*o.sun[1];a[14]=tw+(1-tw)*o.sun[2];a[15]=o.seed||0;
  const R=o.ring;if(R){a[16]=R.i;a[17]=R.o;a[18]=(R.s%997)*.013;a[19]=R.tilt;a[23]=R.n;}
  a[20]=o.sun[0];a[21]=o.sun[1];a[22]=o.sun[2];
  const pal=o.pal,np=Math.min(6,pal.length);
  a[24]=np;a[25]=GOR_LIT;a[26]=GOR_TILT;a[27]=o.cities||0;
  for(let i=0;i<(o.cities||0)*4;i++)a[64+i]=o.cpts[64+i];
  for(let i=0;i<6;i++){const c=pal[Math.min(i,np-1)];a[32+i*4]=gorLin(c[0]);a[33+i*4]=gorLin(c[1]);a[34+i*4]=gorLin(c[2]);}
  const U=GPUBufferUsage,d=GPU.dev;
  const ub=gpuBuf("gpl.u",32,U.UNIFORM|U.COPY_DST);
  const u=GOR.U;u[0]=GPU.bw;u[1]=GPU.bh;u[2]=W;u[3]=H;u[4]=DPR;u[5]=G.t||0;d.queue.writeBuffer(ub,0,u);
  const sb=gpuBuf("gor.b."+key,1024,U.STORAGE|U.COPY_DST);d.queue.writeBuffer(sb,0,a);
  pass.setPipeline(P);pass.setBindGroup(0,gpuBind("gor"+fam+"."+key,P,[ub,sb]));pass.draw(6);
  return true;
}
/* планета системы: false — мир не из двенадцати, пусть рисует 17ga */
function gpuOrb(p,x,y,r,lights){
  const k=GOR.K[p.type];if(k===undefined||!p.T||!p.T.pal)return false;
  const pass=gpuScene();if(!pass)return true;
  const gas=p.type==="gas",airless=!gas&&p.T.atm==="отсутствует";
  const sky=gas?GOR_GAS[(h01(p.seed|0,3,0x6A5)*GOR_GAS.length)|0][4]:((p.T.sky&&p.T.sky[0])||[130,180,210]);
  const sa=PLANET_BAKE_ANG+planetSunRot(p),sx=Math.cos(sa),sy=Math.sin(sa);
  const o={k,sx,sy,turn:planetSpin(p)/TAU,air:sky,th:airless?0:(GOR_AIR[p.type]||0),sun:gplSun(),seed:p.seed%97,
    pal:gas?GOR_GAS[(h01(p.seed|0,3,0x6A5)*GOR_GAS.length)|0]:p.T.pal,ring:(p.ring&&r>5)?p.ring:null,cities:0};
  /* огни построек — те же точки, что у 17ga; сушу под ними проверяет шейдер своими материками */
  if(lights){const C=GOR.C||(GOR.C=new Float32Array(256));C.fill(0);
    o.cities=gplCities({sx,sy,lights,wet:0,seed:o.seed,T:o.turn},C);o.cpts=C;}
  return gorBody(pass,"p"+(p.idx|0),x,y,r,o);
}
/* луна (M701): тот же шар, каменистый, серый по прежнему тону луны; с M804 серый ряд берёт
   оттенок у палитры своей планеты (ключ луны начинается с номера планеты) — одна пыль на систему */
const GOR_MOON=[[30,32,36],[58,62,68],[92,98,106],[128,136,146],[160,168,178],[196,204,212]];
const GOR_MOONPAL={};
function gorMoonPal(par){
  const pp=par&&par.T&&par.T.pal;if(!pp||!pp.length)return GOR_MOON;
  const ck=par.seed|0;if(GOR_MOONPAL[ck])return GOR_MOONPAL[ck];
  const out=GOR_MOON.map((g,i)=>{const c=pp[Math.min(i,pp.length-1)];
    const y=Math.max(8,c[0]*.3+c[1]*.59+c[2]*.11);
    return [0,1,2].map(j=>Math.round(clamp(g[j]*(1+.55*(c[j]/y-1)),0,255)));});
  return GOR_MOONPAL[ck]=out;
}
function gpuOrbMoon(m,key,x,y,r){
  const pass=gpuScene();if(!pass)return true;
  const dx=-(m.x||0),dy=-(m.y||0),dl=Math.hypot(dx,dy)||1;
  const par=G.sys&&G.sys.planets&&G.sys.planets[parseInt(key,10)|0];
  return gorBody(pass,"m"+key,x,y,Math.max(1.2,r),{k:0,sx:dx/dl,sy:dy/dl,turn:0,air:[0,0,0],th:0,sun:gplSun(),
    seed:(m.seed||key.length*13)%97,pal:gorMoonPal(par),ring:null,cities:0});
}
