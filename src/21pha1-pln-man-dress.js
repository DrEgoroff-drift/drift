/* ══════════════ планета: человек — голова и одежда рига (M801b) ══════════════
   Закон L2 (docs/DESIGN-remake.md §2): человек — риг, и только он, где бы ни стоял. Скафандр
   (21pha) носят грунт, пещера, шахта, абордаж и смена базы; дома, на зимовке и в санатории человек
   снимает шлем и надевает своё. Кости, книга поз и свет — те же: меняются только части на костях.

   Платья (D.dress):
   bare   — скафандр без шлема и ранца, голова над воротником (смена в жилом отсеке);
   home   — домашнее: свитер, брюки, тапки (дом, жилой отсек);
   shirt  — рубаха с коротким рукавом и светлые брюки (санаторий);
   winter — ватник с тремя переломами силуэта (плечи шире, пояс уже, подол снова шире), ватные
            брюки, валенки, ушанка (зимовка).
   Цвета — D.top, D.bot, D.skin, D.hair, D.shoe: sRGB 0..255, у каждого платья свои по умолчанию.

   Пропорции человека, не скафандра: голова — седьмая часть роста (.25 м из 1.8), шея видна,
   корпус уже бочки «Орлана», руки и ноги тоньше. Ноги на нуле, как у скафандра; кости не
   двигаются — плечи на тех же шарнирах, корпус лишь шире у плеч, чтобы со спины не было щели. */
const PLN_MAN_DRESS={
  home:  {top:[126,136,150],bot:[62,66,74],skin:[206,172,142],hair:[70,54,44],shoe:[52,44,38]},
  shirt: {top:[222,214,196],bot:[176,166,146],skin:[214,170,132],hair:[74,60,50],shoe:[96,72,52]},
  winter:{top:[64,70,74],bot:[46,48,52],skin:[204,160,128],hair:[60,48,40],shoe:[150,146,138],fur:[96,78,62]},
  bare:  {skin:[206,172,142],hair:[70,54,44]}};
function plnManLin(c){return [Math.pow(c[0]/255,2.2),Math.pow(c[1]/255,2.2),Math.pow(c[2]/255,2.2)];}
/* цвета платья: умолчания, поверх — что дал зовущий */
function plnDressCols(D){
  const df=PLN_MAN_DRESS[D.dress]||PLN_MAN_DRESS.home,out={};
  for(const k of ["top","bot","skin","hair","shoe","fur"]){const v=D[k]||df[k]||df.top||[128,128,128];out[k]=plnManLin(v);}
  return out;
}
/* голова человека в системе кости головы (шея — от её начала, макушка — 1.80 м в росте стоя):
   шея, череп с линией волос (выше на лбу, ниже на затылке), нос, уши, брови и глаза — на 8 px
   головы читается лицо, а не шар */
function plnManHead(m,D,M){
  const C=plnDressCols(D),skin=C.skin,hair=C.hair,dk=plnMix3(skin,[0,0,0],.35);
  plnTube(m,{path:[[.0,.0,0],[.02,.13,0]],rad:.052,sides:9,col:skin,mat:M,x:.12,cap:true});
  const hairAt=u=>u[1]>(u[0]>.25?.48:(u[0]>-.2?.22:-.42));
  plnBlob(m,{c:[.005,.235,0],r:[.105,.122,.094],sub:2,col:u=>hairAt(u)?hair:skin,mat:M,x:u=>hairAt(u)?.22:.14});
  /* челюсть: без неё череп-яйцо смотрит вверх */
  plnBlob(m,{c:[.05,.16,0],r:[.068,.048,.074],box:.8,sub:1,col:skin,mat:M,x:.14});
  plnBlob(m,{c:[.107,.215,0],r:[.03,.034,.02],sub:1,col:skin,mat:M,x:.14});
  for(const z of [-.094,.094])plnBlob(m,{c:[-.005,.225,z],r:[.022,.034,.014],sub:1,col:dk,mat:M,x:.1});
  for(const z of [-.04,.04]){
    plnBlob(m,{c:[.097,.268,z],r:[.012,.007,.024],sub:1,col:hair,mat:M,x:.1});
    plnBlob(m,{c:[.099,.244,z],r:[.007,.009,.011],sub:1,col:[.02,.018,.016],mat:M,x:.6});
  }
}
/* одежда без скафандра: части на костях скафандра (21pha PLN_MAN_BONES), один буфер (plnManPack) */
function plnManCloth(P,low,D){
  const M=PLN_MAT.man,parts=[],C=plnDressCols(D),kind=D.dress,win=kind==="winter",shirt=kind==="shirt";
  const top=C.top,bot=C.bot,skin=C.skin,shoe=C.shoe,fur=C.fur||C.hair;
  const topD=plnMix3(top,[0,0,0],.32),botD=plnMix3(bot,[0,0,0],.3),belt=plnMix3(bot,[0,0,0],.55);
  /* ватник стёган: полосы поперёк — светлая и тёмная по 6 см */
  const quilt=p=>((Math.floor((p[1]+4)*16)&1)?plnMix3(top,[0,0,0],.16):top);
  /* dz — сдвиг части вглубь: плечевые шарниры стоят на ширине бочки скафандра (±.30), рука
     человека висит у тела — её сетка сдвинута к середине, кости не трогаются */
  const part=(bone,fn,dz)=>{const m=plnMesh(1024);fn(m);
    if(dz)for(let k=0;k<m.nv;k++)m.v[k*PLN_VS+2]+=dz;
    parts.push({bone,m:plnMeshDone(m),dyn:null});};
  const ring=(m,y,r,rt,col)=>{const path=[];for(let k=0;k<=24;k++){const a=k/24*TAU;path.push([Math.cos(a)*r,y,Math.sin(a)*r*.86]);}
    plnTube(m,{path,rad:rt,sides:7,up:[0,1,0],col,mat:M,x:.15});};
  /* таз: брюки и ремень; ватник — подол шире пояса */
  part(0,m=>{
    plnBlob(m,{c:[0,0,0],r:[.13,.13,.165],box:.7,sub:2,col:bot,mat:M,x:.06});
    /* подол ватника — раструб от пояса до середины бедра, а не надутый круг */
    if(win){plnTube(m,{path:[[0,.15,0],[0,-.03,0],[0,-.22,0]],rad:t=>lerp(.185,.235,t),sides:16,col:(t,a,p)=>quilt(p),mat:M,x:.05,cap:true});
      ring(m,.13,.19,.022,belt);}
    else ring(m,.07,.155,.016,belt);
  });
  /* корпус: свитер, рубаха или ватник; плечи шире бочки, чтобы рука сидела на теле и со спины */
  part(1,m=>{
    if(win){
      plnBlob(m,{c:[0,.31,0],r:[.21,.29,.235],box:.75,sub:3,col:(u,p)=>quilt(p),mat:M,x:.05});
      plnBlob(m,{c:[0,.56,0],r:[.13,.05,.16],sub:2,bump:.3,col:fur,mat:M,x:.04});
    }else{
      plnBlob(m,{c:[.01,.27,0],r:[.16,.27,.20],box:.8,sub:2,col:u=>u[1]<-.75?topD:top,mat:M,x:.06});
      for(const z of [-.19,.19])plnBlob(m,{c:[0,.40,z],r:[.075,.068,.075],sub:1,col:top,mat:M,x:.06});
      if(shirt)plnBlob(m,{c:[.07,.50,0],r:[.06,.035,.09],sub:1,col:topD,mat:M,x:.06});
      else ring(m,.53,.075,.02,topD);
    }
  });
  /* голова; на зимовке — ушанка с ушами вниз */
  part(2,m=>{
    plnManHead(m,D,M);
    if(win){
      plnBlob(m,{c:[-.003,.31,0],r:[.128,.078,.122],sub:2,bump:.25,col:fur,mat:M,x:.04});
      for(const z of [-.102,.102])plnBlob(m,{c:[-.007,.225,z],r:[.055,.07,.03],sub:1,bump:.2,col:fur,mat:M,x:.04});
      plnBlob(m,{c:[.08,.345,0],r:[.045,.045,.11],sub:1,bump:.2,col:fur,mat:M,x:.04});
    }
  });
  /* ноги: брюки; валенки — голенище шире к низу и толстая стопа */
  for(const [th,sh,ft] of [[3,4,5],[6,7,8]]){
    part(th,m=>plnTube(m,{path:[[0,.02,0],[0,-.20,0],[0,-.41,0]],rad:t=>lerp(win?.105:.095,win?.085:.075,t),sides:9,col:bot,mat:M,x:.06,cap:true}));
    part(sh,m=>{
      plnTube(m,{path:[[0,.02,0],[0,-.36,0]],rad:t=>lerp(win?.082:.074,win?.07:.06,t),sides:9,col:bot,mat:M,x:.06,cap:true});
      if(win)plnTube(m,{path:[[0,-.10,0],[0,-.37,0]],rad:t=>lerp(.078,.092,t),sides:9,col:shoe,mat:M,x:.03,cap:true});
    });
    part(ft,m=>{
      if(win)plnBlob(m,{c:[.055,-.05,0],r:[.135,.06,.085],box:.65,sub:2,col:shoe,mat:M,x:.03});
      else{
        plnBlob(m,{c:[.06,-.045,0],r:[.13,.05,.066],box:.6,sub:2,col:shoe,mat:M,x:.2});
        plnBlob(m,{c:[.062,-.088,0],r:[.134,.014,.068],box:.4,sub:1,col:plnMix3(shoe,[0,0,0],.5),mat:M,x:.1});
      }
    });
  }
  /* руки: рукав, кисть; у рубахи рукав короткий, у ватника — манжета и варежка */
  for(const [up,fo,dz] of [[9,10,win?.06:.085],[11,12,win?-.06:-.085]]){
    part(up,m=>{
      plnBlob(m,{c:[0,0,0],r:[win?.095:.075,win?.085:.07,win?.095:.075],sub:1,col:win?quilt([0,0,0]):top,mat:M,x:.06});
      if(shirt){
        plnTube(m,{path:[[0,0,0],[0,-.15,0]],rad:.07,sides:9,col:top,mat:M,x:.06,cap:true});
        plnTube(m,{path:[[0,-.12,0],[0,-.28,0]],rad:t=>lerp(.052,.046,t),sides:8,col:skin,mat:M,x:.12,cap:true});
      }else plnTube(m,{path:[[0,0,0],[0,-.28,0]],rad:t=>lerp(win?.085:.066,win?.075:.056,t),sides:9,col:win?(t,a,p)=>quilt(p):top,mat:M,x:.06,cap:true});
    },dz);
    part(fo,m=>{
      const sl=shirt?skin:top;
      plnTube(m,{path:[[0,.0,0],[0,-.25,0]],rad:t=>lerp(win?.074:.056,win?.07:.046,t),sides:8,col:win?(t,a,p)=>quilt(p):sl,mat:M,x:shirt?.12:.06,cap:true});
      if(win)plnTube(m,{path:[[0,-.21,0],[0,-.26,0]],rad:.078,sides:8,col:fur,mat:M,x:.04,cap:true});
      plnBlob(m,{c:[.005,-.30,0],r:win?[.05,.065,.042]:[.04,.055,.03],sub:1,lean:.2,col:win?plnMix3(fur,[0,0,0],.4):skin,mat:M,x:.12});
    },dz);
  }
  return plnManPack(parts);
}
