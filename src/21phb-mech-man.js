/* Механик на игровом риге. Жёсткие участки едут штатными костями; только
   плавные стыки пересчитываются по четырём исходным весам. Без копий рукавов,
   шаров на коленях и разрывов между частями. Скелет и книга поз не меняются. */
let MECH_SKIN=null;
const MECH_YAW=.25;   /* небольшой поворот к зрителю: видно лицо и второй рукав */
function mechManData(){if(!MECH_SKIN)MECH_SKIN=artSkinRead(ART_MECH_SKIN);return MECH_SKIN;}
function mechManColour(P,D,Q,i,C){
  const k=Q.code[i],a=i*3,lum=.299*Q.c[a]+.587*Q.c[a+1]+.114*Q.c[a+2];
  const src=[Q.c[a],Q.c[a+1],Q.c[a+2]],suit=plnHex("#ee7326"),cloth=suit.map(x=>x*(.55+.65*Math.min(1.2,lum/.45)));
  if(k===4)return src.map((x,j)=>x*.7+C.hair[j]*.3);
  if(k===8&&(!D||!D.dress||D.dress==="suit"))return plnMix3(P.gloves.main,P.gloves.dark,.25);
  /* Цвет глаз, губ и щетины уже есть в исходнике. Серый множитель кожи
     стирал их и превращал лицо в маску. Текстура переведена из sRGB в линейный цвет. */
  if(k===6||k===8)return src.map((x,j)=>x*.88+C.skin[j]*(lum/.48)*.12);
  if(k===5)return src.map((x,j)=>x*.65+P.boots.dark[j]*.12);
  if(k===7)return plnHex("#8d939a");
  if(k===3)return plnHex("#30373c");
  if(k===2)return plnHex("#c5d0d8");
  if(k===0||k===1){
    /* Одна ткань по обе стороны технологического разреза. Тёплая кожа и
       нейтральные металлические детали сохраняются мягкой цветовой маской. */
    const warm=clamp((src[0]-src[2]-.025)/.12,0,1)*clamp((.55-lum)/.3,0,1);
    const spread=Math.max(...src)-Math.min(...src),metal=clamp(1-spread/.035,0,1)*clamp((lum-.3)/.2,0,1)*.65;
    const leather=src.map((x,j)=>x*.9+P.torso.dark[j]*.1);
    return plnMix3(plnMix3(cloth,leather,warm),src,metal);
  }
  return cloth;
}
function mechManBuild(P,low,D){
  /* Цельный герметичный скафандр: чистая геометрия на штатном риге. */
  if(!D||!D.dress||D.dress==="suit")return plnManBuild(P,low,D);
  if(D&&D.dress&&D.dress!=="suit"&&D.dress!=="bare")return plnManBuild(P,low,D);
  const Q=mechManData(),parts=[],groups=Array.from({length:14},()=>[]),suited=!D||!D.dress||D.dress==="suit";
  const C=plnDressCols(D||{dress:"bare"}),colours=Array.from({length:Q.n},(_,i)=>mechManColour(P,D,Q,i,C));
  for(let t=0;t<Q.ix.length;t+=3){let bone=-1;
    if(suited&&Q.code[Q.ix[t]]===4&&Q.code[Q.ix[t+1]]===4&&Q.code[Q.ix[t+2]]===4)continue;
    for(let k=0;k<3;k++){const i=Q.ix[t+k];let b=-1;
      for(let a=0;a<4;a++)if(Q.w[i*4+a]>.001){if(b<0)b=Q.j[i*4+a];else if(b!==Q.j[i*4+a]){b=-2;break;}}
      if(k===0)bone=b;else if(b!==bone)bone=-2;
      if(bone===-2)break;
    }
    const bucket=bone>=0?bone:13;groups[bucket].push(Q.ix[t],Q.ix[t+1],Q.ix[t+2]);
  }
  for(let g=0;g<groups.length;g++){
    const source=groups[g];if(!source.length)continue;
    const bone=g===13?0:g,org=Q.b[bone],n=source.length,v=new Float32Array(n*PLN_VS),ix=new Uint32Array(n);
    for(let k=0;k<n;k++){const i=source[k],a=i*3,b=k*PLN_VS,col=colours[i];
      for(let d=0;d<3;d++){v[b+d]=Q.p[a+d]-org[d];v[b+3+d]=Q.no[a+d];v[b+6+d]=col[d];}
      const material=Q.code[i];
      v[b+9]=PLN_MAT.man;v[b+12]=material===7?.55:material===5?.22:material===6&&Math.max(Q.c[a],Q.c[a+1],Q.c[a+2])-Math.min(Q.c[a],Q.c[a+1],Q.c[a+2])<.045?.65:.12;ix[k]=k;
    }
    parts.push({bone,m:{v,i:ix,nv:n,ni:n},dyn:g===13?"mechskin":null,skin:g===13?new Uint16Array(source):null});
  }
  if(!Q.skinIds)Q.skinIds=new Uint16Array(new Set(groups[13]));
  /* Контраст даётся настоящими ремнями и застёжками, а не серой заливкой
     всего торса. Передняя поверхность берётся с самой куртки. */
  const straps=plnMesh(2048),strapCol=plnMix3(plnHex("#343b42"),P.torso.dark,.12);
  const front=(y,z)=>{let x=.17,found=false;
    for(let i=0;i<Q.n;i++){const a=i*3,dy=Q.p[a+1]-(y+.87),dz=Q.p[a+2]-z;
      if(dy*dy+dz*dz<.0007&&Q.p[a]>0&&Q.p[a]<.32){x=Math.max(x,Q.p[a]);found=true;}}
    return (found?x:.21)+.004;
  };
  for(const side of [-1,1]){
    const ids=[];
    for(let k=0;k<=12;k++){const u=k/12,y=.15+u*.39,z=side*(.10+u*.075),x=front(y,z);
      for(const back of [0,1])for(const edge of [-1,1])ids.push(plnVert(straps,[x-back*.006,y,z+edge*.0175],[1,0,0],strapCol,PLN_MAT.man,0,0,.18));
    }
    for(let k=0;k<12;k++){const a=k*4,b=a+4;
      plnQuad(straps,ids[a],ids[a+1],ids[b+1],ids[b]);plnQuad(straps,ids[a+2],ids[b+2],ids[b+3],ids[a+3]);
      plnQuad(straps,ids[a],ids[b],ids[b+2],ids[a+2]);plnQuad(straps,ids[a+1],ids[a+3],ids[b+3],ids[b+1]);}
    const z=side*.135;plnBlob(straps,{c:[front(.33,z)+.008,.33,z],r:[.010,.024,.026],box:.8,sub:1,col:P.torso.main,mat:PLN_MAT.man,x:.55});
  }
  parts.push({bone:1,m:plnMeshDone(straps)});
  const belt=plnMesh(512),ring=[];
  for(let k=0;k<=28;k++){const a=k/28*TAU;ring.push([Math.cos(a)*.20,.075,Math.sin(a)*.185]);}
  plnTube(belt,{path:ring,rad:.018,sides:6,up:[0,1,0],col:strapCol,mat:PLN_MAT.man,x:.18});
  plnBlob(belt,{c:[.215,.075,0],r:[.010,.026,.033],box:.8,sub:1,col:P.torso.main,mat:PLN_MAT.man,x:.55});
  parts.push({bone:0,m:plnMeshDone(belt)});
  for(const bone of [5,8]){
    const cuff=plnMesh(512);
    plnBlob(cuff,{c:[0,.115,0],r:[.105,.10,.105],box:.65,sub:2,col:plnHex("#30373c"),mat:PLN_MAT.man,x:.22});
    parts.push({bone,m:plnMeshDone(cuff)});
  }
  if(suited){
    const old=plnManBuild(P,low);
    /* Штатные бур, факел, линза и огонёк сохраняют динамику, заряд и места света. */
    for(const q of old.parts)if(q.dyn)parts.push(q);
    const m=plnMesh(512),dk=P.pack.dark;
    plnBlob(m,{c:[-.31,.28,0],r:[.14,.26,.19],box:.45,sub:2,col:P.pack.main,mat:PLN_MAT.man,x:.25});
    for(const z of [-.09,.09])plnTube(m,{path:[[-.46,.04,z],[-.46,.52,z]],rad:.062,sides:8,col:dk,mat:PLN_MAT.man,x:.4,cap:true});
    plnTube(m,{path:[[-.39,.54,.11],[-.405,.90,.11]],rad:.008,sides:5,col:dk,mat:PLN_MAT.man,x:.3});
    parts.push({bone:1,m:plnMeshDone(m)});
    const h=plnMesh(2048),rim=[];
    /* Задняя скорлупа и настоящий край проёма: голова находится в шлеме,
       а не между проволочными кольцами. Перед лицом остаётся ясное стекло. */
    const rows=10,cols=14,ids=[];
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const a=y/rows*Math.PI,b=Math.PI/2+x/cols*Math.PI;
      const n=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
      ids.push(plnVert(h,[n[0]*.235-.035,.25+n[1]*.265,n[2]*.235],n,P.helmet.main,PLN_MAT.man,0,0,.4));
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x;plnQuad(h,ids[a],ids[a+1],ids[a+cols+2],ids[a+cols+1]);}
    for(let k=0;k<=24;k++){const a=k/24*TAU;rim.push([Math.cos(a)*.18,.08,Math.sin(a)*.18]);}
    plnTube(h,{path:rim,rad:.014,sides:6,up:[0,1,0],col:P.helmet.dark,mat:PLN_MAT.man,x:.4});
    const seal=[];for(let k=0;k<=28;k++){const a=k/28*TAU;seal.push([-.035,.25+Math.cos(a)*.265,Math.sin(a)*.235]);}
    plnTube(h,{path:seal,rad:.008,sides:6,up:[1,0,0],col:P.helmet.dark,mat:PLN_MAT.man,x:.35});
    for(const z of [-.17,.17])plnBlob(h,{c:[-.04,.20,z],r:[.05,.055,.025],sub:1,col:P.helmet.main,mat:PLN_MAT.man,x:.35});
    plnTube(h,{path:[[-.02,.37,0],[.21,.40,0]],rad:.046,sides:10,col:P.lamp.dark,mat:PLN_MAT.man,x:.45,cap:true});
    plnTube(h,{path:[[.15,.31,-.15],[.20,.33,-.07],[.21,.32,.01]],rad:.006,sides:5,col:plnHex("#a8bccc"),mat:PLN_MAT.man,x:.8,cap:true});
    parts.push({bone:2,m:plnMeshDone(h)});
  }
  return plnManPack(parts);
}
/* Веса считаются на общих вершинах, не на тройных копиях каждого треугольника. */
function mechManSkin(V,offset,q,W){
  const Q=mechManData(),mat=Q.mat||(Q.mat=Array.from({length:13},()=>new Float32Array(12)));
  for(let k=0;k<13;k++){const w=W[k],o=Q.b[k],m=mat[k];
    m[0]=w.c;m[1]=-w.s;m[3]=w.x-w.c*o[0]+w.s*o[1];m[4]=w.s;m[5]=w.c;m[7]=w.y-w.s*o[0]-w.c*o[1];m[10]=1;m[11]=w.z-o[2];}
  if(!Q.pose)Q.pose={p:new Float32Array(Q.n*3),no:new Float32Array(Q.n*3),ids:Q.skinIds};
  const S=artSkinPose(Q,mat,Q.pose),root=W[0];
  for(let k=0;k<q.skin.length;k++){const a=q.skin[k]*3,b=(offset+k)*PLN_VS,x=S.p[a]-root.x,y=S.p[a+1]-root.y;
    V[b]=root.c*x+root.s*y;V[b+1]=-root.s*x+root.c*y;V[b+2]=S.p[a+2]-root.z;
    V[b+3]=root.c*S.no[a]+root.s*S.no[a+1];V[b+4]=-root.s*S.no[a]+root.c*S.no[a+1];V[b+5]=S.no[a+2];
  }
}
