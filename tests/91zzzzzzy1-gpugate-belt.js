/* ══════════════ ворота ступени 2: пояс без #c (docs/DESIGN-gpu.md, Stage 2) ══════════════
   Шестьдесят настоящих кадров (frameBody) в поясе: камни рядом и вдали, пыль на ходу и все
   пять ориентиров перед носом. Мир пояса рисуется в проходе сцены (24ba, 24bb): #c
   мира не видит ни одного вызова, отправка в очередь одна на кадр, печёные холсты не
   грузятся (зев устья печётся и грузится раз, на прогреве). Кабина и стекло
   (drawGlassHUD, drawCockpit) — на слое приборов #hud (24bc): на #c ни вызова, копий #c
   нет; на ходу слой перерисовывается, а в покое (корабль встал, рук на органах нет) — ни
   разу, лампы стоек моргают своими холстиками. Кто рисует на #c — называется по стеку */
const BGATE_WARM=30,BGATE_N=60,BGATE_HUD=/drawGlassHUD|drawCockpit/;
function bgateStand(){
  for(let r=0;r<=10;r++)for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++){
    const s=getSystem(x,y);if(!s.belt)continue;
    G.sx=x;G.sy=y;G.sys=s;G.ap=null;G.orbit=null;G.mode="system";enterBelt();return true;
  }
  return false;
}
/* все пять видов ориентиров перед камерой: 3 сверху, 2 снизу */
function bgatePoi(){
  const b=G.belt,B=beltBasis(b),K=["wreck","rig","ring","drusa","maw"],S=[230,200,280,180,340];
  const O=[[-480,300],[0,300],[480,300],[-260,-280],[260,-280]];
  b.poi=K.map((k,i)=>{const d=1400,u=O[i],P=j=>[b.x,b.y,b.z][j]+B.fwd[j]*d+B.right[j]*u[0]+B.up[j]*u[1];
    return {k,ru:k,size:S[i],seed:1234567+i*7919,spin:.001,ph:i*.7,x:P(0),y:P(1),z:P(2)};});
}
TEST_SUITES.push(()=>suite("ворота ступени 2: пояс — мир не рисует на #c, одна отправка на кадр, выгрузок нет",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ворота не меряются"))return;
  resetWorld();
  if(!ok(bgateStand(),"нашлась система с поясом"))return;
  if(!ok(G.mode==="belt"&&G.belt,"вошли в пояс"))return;
  bgatePoi();
  const b=G.belt,Q=GPUQueue.prototype,q0={c:Q.copyExternalImageToTexture,s:Q.submit},run0=G.running,loop0=LOOP_OFF,C=MAIN_CTX,cm={};
  const K={on:false,front:0,sub:0,up:{},bad:0,world:{},hud:0,poiDrawn:0,rd:0,rest:0,restN:0};
  const pd=beltPoiGpu;
  let i=0;
  try{
    beltPoiGpu=function(){K.poiDrawn++;return pd.apply(this,arguments);};
    Q.copyExternalImageToTexture=function(src,dst){
      if(K.on){if(dst.texture===GPU.T.front)K.front++;else{const w=gateWho();K.bad++;K.up[w]=(K.up[w]||0)+1;}}
      return q0.c.apply(this,arguments);};
    Q.submit=function(){if(K.on)K.sub++;return q0.s.apply(this,arguments);};
    gpuFrontHook();   /* крючок 08c ставит свои обёртки один раз — наши поверх него */
    for(const k of ["fill","stroke","fillRect","strokeRect","drawImage","fillText","strokeText","putImageData"]){
      const o=C[k];cm[k]=o;
      C[k]=function(){if(K.on){const s=new Error().stack;if(BGATE_HUD.test(s))K.hud++;else{const w=k+":"+gateWho();K.world[w]=(K.world[w]||0)+1;}}return o.apply(this,arguments);};}
    G.running=true;LOOP_OFF=false;
    for(i=0;i<BGATE_WARM+BGATE_N;i++){
      if(i===BGATE_WARM)K.on=true;
      /* на малом ходу: пыль тянется штрихом, камера почти на месте */
      if(G.belt){G.belt.vx=0;G.belt.vy=0;G.belt.vz=.9;}
      frameBody(wallMs());
      if(G.mode!=="belt")break;
    }
    /* покой: корабль встал, рук на органах нет — кабина не перерисовывается */
    K.rd=BHUD.redraw;K.on=false;
    const kz={};for(const k in keys)if(typeof keys[k]==="boolean"){kz[k]=keys[k];keys[k]=false;}
    for(let j=0;j<BGATE_WARM+BGATE_N&&G.mode==="belt";j++){
      const bb=G.belt;bb.vx=bb.vy=bb.vz=0;bb.avYaw=bb.avPitch=0;if("avRoll" in bb)bb.avRoll=0;
      if(j===BGATE_WARM)K.rest=BHUD.redraw;
      frameBody(wallMs());K.restN++;
    }
    K.rest=BHUD.redraw-K.rest;
    for(const k in kz)keys[k]=kz[k];
  }catch(e){ok(false,"кадр "+i+" упал: "+e.message);}
  finally{
    K.on=false;beltPoiGpu=pd;
    Q.copyExternalImageToTexture=q0.c;Q.submit=q0.s;
    for(const k in cm)C[k]=cm[k];
    G.running=run0;LOOP_OFF=loop0;
  }
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>v+"× "+k).join("; ");
  eq(G.mode,"belt","все кадры прошли в поясе");
  ok(K.poiDrawn>=BGATE_N*5,"ориентиры в кадре: "+K.poiDrawn+" отрисовок за "+BGATE_N+" кадров (≥ пяти на кадр)");
  eq(Object.keys(K.world).length,0,"мир пояса не рисует на #c"+(Object.keys(K.world).length?": "+top(K.world):""));
  eq(K.hud,0,"кабина и стекло не рисуют на #c — они на слое приборов #hud");
  eq(K.front,0,"#c в видеокарту не копируется: копий "+K.front+" за "+BGATE_N);
  ok(K.rd>0,"на ходу кабина перерисовывается (слой живой): "+K.rd+" за "+BGATE_N);
  eq(K.restN,BGATE_WARM+BGATE_N,"покой прошёл в поясе");
  eq(K.rest,0,"в покое кабина не перерисовывается: "+K.rest+" за "+BGATE_N+" кадров");
  eq(K.sub,BGATE_N,"отправок в очередь ровно по одной на кадр");
  eq(K.bad,0,"холсты не грузятся"+(K.bad?": "+top(K.up):""));
  resetWorld();
}));
/* ── оракул ключа кабины (24bc) ──
   Боевой ключ собран руками по входам. Оракул — протокол самого рисунка: подставной ctx
   пишет вызовы и свойства (координаты 1/4 px, углы 1/1024), и каждая смена протокола между
   кадрами обязана сменить ключ — иначе вход забыт и кабина застрянет на старой картинке.
   Панель и лента молчат в протоколе: их стережёт подпись колодки 25c, а стрелки ползут и в
   покое */
const BORC={log:[],mute:0,ids:new WeakMap(),n:0,meas:null};
function borcId(o){let i=BORC.ids.get(o);if(!i){i=++BORC.n;BORC.ids.set(o,i);}return i;}
function borcRecorder(){
  const L=BORC.log,S={font:"10px sans-serif"},stack=[];let gn=0;
  const M=BORC.meas||(BORC.meas=document.createElement("canvas").getContext("2d"));
  const P=CanvasRenderingContext2D.prototype;
  const kind=k=>{const d=typeof k==="string"&&Object.getOwnPropertyDescriptor(P,k);return !d?"x":("value" in d)?(typeof d.value==="function"?"m":"p"):"p";};
  const q=(v,f)=>typeof v==="number"?Math.round(v*f):typeof v==="string"?v:v&&typeof v==="object"?"#"+(v.__g||borcId(v)):String(v);
  const put=s=>{if(!BORC.mute)L.push(s);};
  return new Proxy({},{
    get(_,k){
      if(k==="measureText")return t=>{M.font=S.font;return M.measureText(t);};
      if(k==="save")return ()=>{stack.push(Object.assign({},S));put("s");};
      if(k==="restore")return ()=>{const o=stack.pop();if(o){for(const j in S)delete S[j];Object.assign(S,o);}put("r");};
      if(k==="createLinearGradient"||k==="createRadialGradient")return (...a)=>{
        const g={__g:"g"+(++gn)};put(g.__g+k[6]+a.map(x=>q(x,4)).join());
        g.addColorStop=(o,c)=>{put(g.__g+":"+o+","+c);};return g;};
      const t=kind(k);
      if(t==="m")return (...a)=>{put(k+"("+a.map((x,i)=>q(x,k==="rotate"||(k==="arc"&&i>2)||(k==="ellipse"&&i>3)?1024:4)).join()+")");};
      if(t==="p")return k in S?S[k]:M[k];
      return undefined;
    },
    set(_,k,v){S[k]=v;put(k+"="+q(v,256));return true;}
  });
}
TEST_SUITES.push(()=>suite("ворота ступени 2: ключ кабины пояса ловит всё, что меняет её рисунок",{tier:"browser"},()=>{
  if(!ok(GPU.ok,"видеокарта есть — без неё ключ не нужен"))return;
  resetWorld();
  if(!ok(bgateStand(),"нашлась система с поясом"))return;
  const run0=G.running,loop0=LOOP_OFF,ip=instrPanel,ts=tapeStrip,ps=instrPodSig;
  const bad=[],seen=[];let changed=0,steps=0;
  const kz={};for(const k in keys)if(typeof keys[k]==="boolean")kz[k]=keys[k];
  try{
    instrPanel=function(){BORC.mute++;try{return ip.apply(this,arguments);}finally{BORC.mute--;}};
    tapeStrip=function(){BORC.mute++;try{return ts.apply(this,arguments);}finally{BORC.mute--;}};
    /* панель и лента молчат в протоколе — пусть молчат и в ключе: их подпись ползёт с лентой
       и прятала бы забытый вход (смена ключа «за компанию») */
    instrPodSig=()=>"pod";BHUD.pod="";
    G.running=true;LOOP_OFF=false;
    for(const k in kz)keys[k]=false;
    for(let i=0;i<20;i++){const b=G.belt;b.vx=b.vy=b.vz=0;b.avYaw=b.avPitch=0;frameBody(wallMs());}
    /* захват пояс ставит сам; до шага «цель» его нет — иначе место цели в ключе меняется от
       любого сдвига и прячет забытый радар */
    G.belt.lock=null;G.belt.prog=0;
    /* дальше кадров нет: шаг меняет состояние руками, камера — та же формула, что в 24ba.
       Ни физики, ни часов — между шагами меняется только то, что поменял шаг */
    const snap=()=>{
      const b=G.belt,st=stat(),bas=beltBasis(b),fwd=bas.fwd,right=bas.right,up=bas.up,F=Math.min(W,H)*.95;
      const proj=(px,py,pz)=>{const vx=px-b.x,vy=py-b.y,vz=pz-b.z,zc=vx*fwd[0]+vy*fwd[1]+vz*fwd[2];if(zc<2)return null;
        return {x:W/2+(vx*right[0]+vy*right[1]+vz*right[2])*F/zc,y:H/2-(vx*up[0]+vy*up[1]+vz*up[2])*F/zc,z:zc};};
      const c0=ctx;BORC.log.length=0;
      try{ctx=borcRecorder();BHUD.rec=true;drawGlassHUD(b,proj,fwd,st);drawCockpit(b,st);}finally{BHUD.rec=false;ctx=c0;}
      /* подпись панели прибита целиком: без колодки это невязка, а она зависит от места
         корабля — шаг «сдвиг» менял бы ключ «за компанию» и прятал забытый радар */
      BHUD.pod="pod";BHUD.podF=GPU.frameNo;
      return {log:BORC.log.join(";"),key:bhudKey(b,fwd,st,bas)};
    };
    const front=()=>{const b=G.belt,B=beltBasis(b);let best=null,bd=1e9;
      for(const a of b.ast){const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z,z=dx*B.fwd[0]+dy*B.fwd[1]+dz*B.fwd[2],d=Math.hypot(dx,dy,dz);
        if(z>d*.8&&d<bd){bd=d;best=a;}}return best;};
    const B=()=>G.belt;
    const STEPS=[["покой",()=>{}],["рыскание",()=>{B().yaw+=.05;}],["тангаж",()=>{B().pitch+=.05;}],
      ["крен",()=>{B().roll=(B().roll||0)+.05;}],["ход",()=>{B().vx=.6;}],["сдвиг",()=>{B().x+=40;}],
      ["цель",()=>{B().lock=front();}],["добыча",()=>{B().prog=.5;}],
      ["остаток",()=>{const L=B().lock;if(L)L.left=Math.max(1,L.left-1);}],["без цели",()=>{B().lock=null;B().prog=0;}],
      ["топливо",()=>{G.fuel*=.8;}],["корпус",()=>{G.hull*=.8;}],["трюм",()=>{G.cargo[RES_KEYS[0]]=(G.cargo[RES_KEYS[0]]||0)+3;}],
      ["удар",()=>{B().hit=10;}],["удар гаснет",()=>{B().hit=4;}],["сближение",()=>{B().near=60;}],
      ["тяга",()=>{keys.thrust=true;}],["тормоз",()=>{keys.thrust=false;keys.brake=true;}],
      ["резак",()=>{keys.brake=false;keys.act=true;}],["огонь",()=>{keys.act=false;keys.fire=true;}],
      ["рукоять",()=>{keys.fire=false;B().avYaw=.03;B().avPitch=-.02;}],
      /* время само по себе: мигание ламп стоек живёт мимо ключа, на своих холстиках */
      ["время",()=>{G.t+=13;}],["время +",()=>{G.t+=29;}],["время ++",()=>{G.t+=51;}],["покой",()=>{}]];
    let prev=snap();
    for(const [name,fn] of STEPS){
      fn();const cur=snap();steps++;
      if(cur.log!==prev.log){changed++;seen.push(name);if(cur.key===prev.key)bad.push(name);}
      else if(cur.key!==prev.key&&name==="покой")bad.push("ключ сменился без смены рисунка");
      prev=cur;
    }
  }catch(e){ok(false,"упал: "+e.message);}
  finally{
    instrPanel=ip;tapeStrip=ts;instrPodSig=ps;BHUD.pod="";
    for(const k in kz)keys[k]=kz[k];
    G.running=run0;LOOP_OFF=loop0;
  }
  eq(G.mode,"belt","все шаги прошли в поясе");
  ok(changed>=15,"оракул живой: протокол рисунка менялся на "+changed+" шагах из "+steps+" ("+seen.join(", ")+")");
  eq(bad.length,0,"смена рисунка без смены ключа"+(bad.length?": "+bad.join(", "):""));
  resetWorld();
}));
