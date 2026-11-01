/* Птица сайта treplo3d: те же тело, клюв, глаза, хохол и перья.
   WebGPU и PAR — игровые; внешняя модель и отдельный цикл не нужны. */
const GOVORUN={mesh:null,cv:null,cx:null,dev:null,t:-1,M:null,ot:null,hidden:null,az:1.18,el:.05,scene:null};
function govorunMesh(){
  if(GOVORUN.mesh)return GOVORUN.mesh;
  const it=GOVORUN.job||(GOVORUN.job=govorunMeshGen());let r;
  do{r=it.next();}while(!r.done);GOVORUN.job=null;return r.value;
}
function* govorunMeshGen(){
  const S=SITE_BIRD,blocks=[],step=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const flag=(part,head)=>part+(head>0&&part===0?2048+32768*Math.round(head*255):0);
  const solid=g=>{
    const v=new Float32Array(g.index.length*12);
    for(let k=0;k<g.index.length;k++){
      const i=g.index[k]*11,b=k*12,x=g.verts[i],t=g.verts[i+6],m=g.verts[i+7];
      v.set(g.verts.subarray(i,i+6),b);v.set(g.verts.subarray(i+8,i+11),b+6);
      let part=t<0?14:0,pattern=0,gloss=3.12,em=0;
      if(m>9.5){part=t>.5?5:6;em=.4+Math.pow(Math.max(0,m-10),2)*3;pattern=R3P.neon;}
      else if(m>8.5){part=4;pattern=R3P.birdBeak;}
      else if(m>7.5){part=x<0?9:10;pattern=R3P.skin;}
      else if(m>6.5){part=x<0?7:8;gloss=8.3;}
      else if(m>5.5){em=3;pattern=R3P.neon;}
      else if(m>4.5)pattern=R3P.skin;
      else if(m>3.5){part=x<0?7:8;pattern=R3P.leather;}
      else if(m>2.5){pattern=R3P.wood;gloss=3.1;}
      else if(m>1.5){pattern=R3P.birdEye;gloss=12.6;}
      else if(m>.5){pattern=R3P.birdBeak;gloss=6.24;}
      else for(let r=6;r<9;r++)v[b+r]*=.30;
      v[b+9]=gloss;v[b+10]=em;v[b+11]=flag(part,step(.66,.92,t))+16*pattern;
      const l=Math.hypot(v[b+3],v[b+4],v[b+5]);if(l<1e-6)v[b+4]=1;
    }
    blocks.push(v);
  };
  solid(S.buildBody(72,48));yield;
  solid(S.buildParts());yield;solid(S.buildBeads());yield;
  let feathers=0;
  function* coat(proto,layout){
    const V=proto.verts,I=proto.index,n=layout.length/19,v=new Float32Array(n*I.length*12);
    for(let f=0;f<n;f++){
      const o=f*19,bx=layout[o+3],kind=layout[o+18],t=layout[o+17],head=step(.66,.92,t);
      const part=kind<.5?0:kind<1.5?(bx<0?2:3):kind<2.5?(bx<0?12:13):5;
      const cx=[layout[o],layout[o+4],layout[o+8]],cy=[layout[o+1],layout[o+5],layout[o+9]],cz=[layout[o+2],layout[o+6],layout[o+10]];
      const sx=Math.max(1e-8,cx.reduce((s,x)=>s+x*x,0)),sy=Math.max(1e-8,cy.reduce((s,x)=>s+x*x,0)),sz=Math.max(1e-8,cz.reduce((s,x)=>s+x*x,0));
      for(let k=0;k<I.length;k++){
        const i=I[k]*8,b=(f*I.length+k)*12,z=V[i+2],y=V[i+1]*layout[o+15]+layout[o+16]*z*z*.62;
        for(let r=0;r<3;r++){
          v[b+r]=cx[r]*V[i]+cy[r]*y+cz[r]*z+layout[o+r*4+3];
          v[b+3+r]=cx[r]*V[i+3]/sx+cy[r]*V[i+4]/sy+cz[r]*V[i+5]/sz;
          v[b+6+r]=layout[o+12+r]*(.83+.17*(1-Math.abs(V[i+6])));
        }
        const l=Math.hypot(v[b+3],v[b+4],v[b+5])||1;for(let r=0;r<3;r++)v[b+3+r]/=l;
        v[b+9]=4.17;v[b+11]=flag(part,head)+16*R3P.feather;
      }
      if(f%16===15)yield;
    }
    feathers+=n;blocks.push(v);
  }
  yield* coat(S.buildFeather(5,6),S.layoutCoat(24,40));
  yield* coat(S.buildFeather(3,6,false,true),S.layoutCoat(36,56,.95,0x51f7,1));
  yield* coat(S.buildFeather(7,13,true),S.layoutPlumes());
  const size=blocks.reduce((n,v)=>n+v.length,0),v=new Float32Array(size);let at=0;
  for(const b of blocks){v.set(b,at);at+=b.length;}
  for(let i=0;i<v.length;i+=12){const l=Math.hypot(v[i+3],v[i+4],v[i+5]);
    if(l<1e-6){v[i+3]=0;v[i+4]=1;v[i+5]=0;}else for(let k=3;k<6;k++)v[i+k]/=l;}
  GOVORUN.mesh={v,n:v.length/12,buf:null,dev:null,feathers,source:"bird/"};return GOVORUN.mesh;
}
/* Ограничение и по времени, и по числу порций: тестовый замороженный
   wallMs не должен превращать прогрев в одну большую работу. */
function govorunPump(ms){
  if(GOVORUN.mesh)return 1;
  const it=GOVORUN.job||(GOVORUN.job=govorunMeshGen()),t=wallMs();
  for(let k=0;k<2&&wallMs()-t<ms;k++){const r=it.next();if(r.done){GOVORUN.job=null;return 1;}}
  return 0;
}
function govorunScene(aspect){
  const mesh=govorunMesh(),q=GOVORUN;
  if(!q.M){q.M=new Float32Array(R3_MAXI*R3_PART*16);q.ot=new Float32Array(R3_MAXI*R3_PART*4);}
  const t=PAR.t,B=r3Xf([PAR.step*.002,PAR.hop*.003,0],PAR.turn*TAU,-PAR.bow*.12-PAR.lean*.1,PAR.roll*.12,1+.003*Math.sin(t*1.35));
  for(let k=0;k<R3_PART;k++)q.M.set(B,k*16);q.M.set(r3Xf([0,0,0]),14*16);
  const neck=[0,1.46,-.04],head=r3Pivot(B,neck,PAR.look*.18,PAR.peck*.08-PAR.tuck*.1,Math.sin(t*.6)*.025);
  q.M.set(head,16);
  const pivot=(k,A,p,y,x,z)=>q.M.set(r3Pivot(A,p,y,x,z),k*16);
  pivot(2,B,[-.20,1.16,-.06],PAR.flap*.95+PAR.stretch*.6,0,-PAR.flap*.42);
  pivot(3,B,[.20,1.16,-.06],-PAR.flap*.95-PAR.stretch*.6,0,PAR.flap*.42);
  pivot(4,head,[0,1.676,.118],0,(PAR.beak+PAR.yawn)*.18,0);
  pivot(5,head,[0,1.80,-.02],0,-clamp(PAR.crest,-.5,1.4)*.62,0);
  q.M[5*16+3]=Math.sin(t*1.9)*.025;   /* ус и его бусина гнутся вместе */
  pivot(6,B,[0,.56,-.62],0,PAR.fan*.3,0);
  pivot(7,B,[-.14,.62,-.08],0,PAR.footUp*.25,0);pivot(8,B,[.14,.62,-.08],0,-PAR.scratch*.2,0);
  pivot(9,head,[-.252,1.758,.108],0,-(1-PAR.blink)*1.55,0);
  pivot(10,head,[.252,1.758,.108],0,-(1-PAR.blink)*1.55,0);
  pivot(12,B,[0,.56,-.62],PAR.fan*.62,PAR.fan*.3,0);pivot(13,B,[0,.56,-.62],-PAR.fan*.62,PAR.fan*.3,0);
  if(PAR.hang>.001){const H=r3Pivot(r3Xf([0,0,0]),[0,.15,-.04],0,PAR.hang*Math.PI,0);for(let k=0;k<14;k++)q.M.set(r3Mul(H,q.M.subarray(k*16,k*16+16)),k*16);}
  const view=govorunView(mesh,q.M,aspect),eye=view.eye,vp=view.vp;
  const S={draws:[[mesh,0,1]],vp,cam:eye,t:0,M:q.M,ot:q.ot,
    lights:[{p:[2.4,4.6,2.4],range:9,c:[7.8,6.5,4.9],shadow:1,vol:0},{p:[-3,1.6,-1.5],range:8,c:[.45,.85,1.3],vol:0}],
    sky:[.085,.115,.165,.32],gnd:[.022,.024,.032,0],fog:[0,0,0,0],acc:[.15,.5,.7,1]};
  q.scene=S;return S;
}
/* Подгоняем весь силуэт, включая хвост и раскрытое крыло. Точки выбираются
   один раз из сетки; кадр обходит их, а не сотни тысяч вершин. */
function govorunView(mesh,M,aspect){
  const q=GOVORUN,V=mesh.v;
  if(!q.sample){const ids=[];for(let i=0;i<mesh.n;i+=61)ids.push(i);q.sample=new Uint32Array(ids);}
  const sa=Math.sin(q.az),ca=Math.cos(q.az),se=Math.sin(q.el),ce=Math.cos(q.el);
  const R=[ca,0,-sa],U=[-sa*se,ce,-ca*se],D=[sa*ce,se,ca*ce],lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
  for(const i of q.sample){const a=i*12,f=Math.round(V[a+11]),b=(f&15)*16,c=(f>>11&15)*16,w=(f>>15&255)/255;
    const x=V[a],y=V[a+1],z=V[a+2],P=[0,0,0];
    for(let r=0;r<3;r++){const p=M[b+r]*x+M[b+4+r]*y+M[b+8+r]*z+M[b+12+r];
      P[r]=p*(1-w)+(M[c+r]*x+M[c+4+r]*y+M[c+8+r]*z+M[c+12+r])*w;}
    for(let k=0;k<3;k++){const A=k===0?R:k===1?U:D,v=P[0]*A[0]+P[1]*A[1]+P[2]*A[2];lo[k]=Math.min(lo[k],v);hi[k]=Math.max(hi[k],v);}
  }
  const mid=lo.map((x,k)=>(x+hi[k])/2),target=[0,1,2].map(k=>R[k]*mid[0]+U[k]*mid[1]+D[k]*mid[2]);
  const dist=(Math.max((hi[1]-lo[1])/.56,(hi[0]-lo[0])/(.56*aspect))+(hi[2]-lo[2])/2)*1.13;
  const eye=target.map((x,k)=>x+D[k]*dist);
  return {eye,vp:r3Mul(r3Persp(.56,aspect,.15,40),r3Look(eye,target,[0,1,0]))};
}
function govorunDraw(cv){
  if(!GPU.ok||GPU.lost||!GPU.dev||!r3Dev())return;
  const q=GOVORUN,t=wallMs();if(t-q.t<33)return;q.t=t;
  if(!q.mesh&&!govorunPump(2.5))return;
  if(!q.hidden)q.hidden=document.createElement("canvas");
  if(q.hidden.width!==cv.width)q.hidden.width=cv.width;if(q.hidden.height!==cv.height)q.hidden.height=cv.height;
  if(q.dev!==GPU.dev||q.cv!==cv){q.cx=cv.getContext("webgpu");if(!q.cx)return;
    q.cx.configure({device:GPU.dev,format:"rgba16float",alphaMode:"premultiplied"});q.dev=GPU.dev;q.cv=cv;}
  const R=rpgGet(q.hidden);if(!R)return;R.dpr=PAR_DPR;
  const S=govorunScene(cv.width/cv.height),U=new Float32Array(60);U.set([1,1,1,.7],24);U[44]=.35;U[47]=.6;
  r3Frame(q.hidden,S,(pl,Sv,Vv,Bv)=>rpgField(R,pl,"r3post",R3_POST_WGSL,U,[Sv,{view:R3.blank},Vv,Bv]),{cx:q.cx,w:cv.width,h:cv.height});
}
function govorunPoke(x,y){
  if(y<.24)parrotPoke(0,-195);
  else if(y<.42&&x>.45)parrotPoke(30,-170);
  else if(y<.48)parrotPoke(0,-160);
  else if(y>.58&&x<.43)parrotPoke(-25,-90);
  else parrotPoke(0,-100);
}
