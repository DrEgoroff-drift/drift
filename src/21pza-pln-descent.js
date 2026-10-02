/* ══════════════ планета: спуск в новом виде (M621) ══════════════
   Старая посадка (19-mode-landing) считает всё: тягу, наклон, касание, выпуск опор, просадку.
   Здесь — только кадр: та же сцена, что встретит на поверхности (композиция липнет к площадке —
   tr.plnCx — и переживает касание), корабль по корпусу игры висит на своей высоте с креном
   посадки, опоры выходят у земли, факелы посадочных сопел — по тяге, люк закрыт, объектив — окно
   поверхности: земля под кораблём на своей доле кадра, высоко — корабль на 24 % от верха. Пока летим, земля
   строится по бюджету кадра (21pf, 21pga); с касания корабль переставляется на своё место без
   перестройки земли (plnLandMove), и первый кадр поверхности берёт её из кэша. Старая
   рисовалка — запасной выход, как и у поверхности. */
const PLN_DESC={thr:0,S:null,bloom:BLOOM_K.landing};

function plnDescent(){
  const L=G.land,tr=L.tr,p=L.p;
  if(!tr||!p||!tr.h)return false;
  /* композиция липнет к площадке: спуск и поверхность складывают сцену вокруг одной точки */
  if(tr.plnCx==null)tr.plnCx=tr.padX/PLN_M+12.8;
  const touched=L.over>0,sx=touched?L.x:tr.padX;
  let S=PLN_DESC.S;
  if(!S||S.tr!==tr)S=PLN_DESC.S={tr,p,cam:{x:0,y:0},face:1,swim:0,shake:0};
  S.shipX=sx;S.x=L.x;S.y=L.y;S.cam.x=L.x;S.cam.y=L.y;
  const gyw=groundAt(tr,L.x),alt=Math.max(0,gyw-L.y-LAND_GY)/PLN_M;
  /* тяга набирает и гаснет не рывком: факел растёт за несколько кадров */
  PLN_DESC.thr+=((L.thrOn&&!touched?1:0)-PLN_DESC.thr)*.3;
  const thr=PLN_DESC.thr<.01?0:PLN_DESC.thr;
  return plnSurface(S,{
    /* окно: земля под кораблём на той же доле кадра, что и у поверхности (1−f от верха), пока корабль
       не поднялся до 24 % — выше окно идёт за ним; так касание и первый кадр поверхности — одно окно */
    lens:(ws,hs,f)=>({vx:L.x-ws/2,vy:Math.max(-400,Math.min(gyw-hs*(1-f),L.y-hs*.24))}),
    /* опоры выходят с четырнадцати метров и стоят к пяти; жар сопел гаснет с отсчётом касания */
    ship:{x:L.x/PLN_M,alt,gear:Math.max(L.gear||0,plnSmooth(14,5,alt)),sq:L.sq||0,thr,
      hot:(L.hot||0)*(touched?clamp(L.over/70,0,1):0),tilt:-(L.a||0),yaw:.2,down:true}});
}

/* ── переключатель ── */
const PLN_OLD_LANDING=drawLanding;
drawLanding=function(){
  let ok=false;
  if(PLN.on&&PLN.bad<3&&G.land&&G.land.tr&&G.land.p){
    try{
      plnQualAuto();
      ok=plnGpuReady()&&plnDescent();
      if(ok)PLN.bad=0;
    }catch(e){
      PLN.bad++;PLN.err=String((e&&e.stack)||e).slice(0,600);plnLog("спуск: "+PLN.err);
      if(GPU.on&&GPU.dev){GPU.enc=GPU.dev.createCommandEncoder();GPU.scenePass=null;GPU.sceneOn=false;GPU.scene3D=false;}
    }
  }
  BLOOM_K.landing=ok?0:PLN_DESC.bloom;
  if(!ok){PLN_OLD_LANDING.apply(this,arguments);return;}
};
