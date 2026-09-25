/* ══════════════ Узор на GPU-холсте: createPattern (08cab, census §2 дыра 2) ══════════════
   Узор — краска kind 3 с обратной матрицей «px выпечки → пространство плитки». Запись проверяется
   под Node; как её читает шейдер — стенд выпечки (docs/fleet/kit.md). */
suite("GPU-холст: узор — createPattern, матрица, повтор, 2D-узор",()=>{
  resetWorld();
  const cv={width:8,height:4,getContext(){return null;}};
  const g=new GcCtx(64,64,2);
  const P=g.createPattern(cv,"repeat");
  ok(P instanceof GcPat,"createPattern на GPU-холсте — узор, а не громкий сбой");
  eq(P.rep,3,"repeat — обе оси");eq(g.createPattern(cv,null).rep,3,"null — repeat, как у 2D");
  eq(g.createPattern(cv,"repeat-x").rep,1,"repeat-x");eq(g.createPattern(cv,"repeat-y").rep,2,"repeat-y");
  eq(g.createPattern(cv,"no-repeat").rep,0,"no-repeat");
  let e="";try{g.createPattern(cv,"diagonal");}catch(x){e=x.name;}eq(e,"SyntaxError","чужой повтор — SyntaxError, как у 2D");
  e="";try{g.createPattern({},"repeat");}catch(x){e=x.message;}ok(/^GPU-холст: нет/.test(e),"плитка без размера — громко");
  /* обратная матрица: точка выпечки → точка плитки */
  const map=(iv,x,y)=>[iv[0]*x+iv[2]*y+iv[4],iv[1]*x+iv[3]*y+iv[5]];
  g.translate(10,5);g.fillStyle=P;g.fillRect(0,0,20,20);
  const p=g._ops[0].p;eq(p.k,3,"заливка узором — краска kind 3");eq(p.img,cv,"плитка при краске");
  const a=map(p.iv,2*(10+3),2*(5+4));near(a[0],3,1e-9,"x плитки — в пространстве момента заливки");near(a[1],4,1e-9,"y плитки");
  P.setTransform(new DOMMatrix().scale(2,2));g.fillRect(0,0,20,20);
  const b=map(g._ops[1].p.iv,2*(10+6),2*(5+8));near(b[0],3,1e-9,"setTransform узора — учтён");near(b[1],4,1e-9,"setTransform узора — y");
  g.globalAlpha=.5;g.strokeStyle=P;g.lineWidth=2;g.strokeRect(0,0,10,10);
  eq(g._ops[2].p.k,3,"штрих узором");eq(g._ops[2].p.a,.5,"globalAlpha — в краске узора");
  g.imageSmoothingEnabled=false;g.fillRect(0,0,4,4);eq(g._ops[3].p.near,true,"imageSmoothingEnabled=false — ближайший");
  /* узор 2D-контекста помечен обёрткой: GcCtx красит им, как своим */
  const N={_gcImg:cv,_gcRep:1,_gcM:[1,0,0,1,2,0]};g.fillStyle=N;g.fillRect(0,0,4,4);
  const q=g._ops[4].p;eq(q.rep,1,"2D-узор: повтор");near(map(q.iv,2*(10+2),2*5)[0],0,1e-9,"2D-узор: его матрица");
  e="";try{g.fillStyle={};g.fillRect(0,0,1,1);}catch(x){e=x.message;}ok(/^GPU-холст: нет/.test(e),"непомеченный объект краски — громко");
});
/* overlay (08ca): смешением его не собрать — выпечка режет проход и читает фон; запись — обычная команда */
suite("GPU-холст: overlay — запись и громкие края",()=>{
  resetWorld();
  const g=new GcCtx(32,32,1);
  g.fillStyle="#808080";g.fillRect(0,0,32,32);
  g.globalCompositeOperation="overlay";g.globalAlpha=.5;g.fillStyle="#fff";g.fillRect(4,4,8,8);
  eq(g._ops[1].op,"overlay","overlay — команда заливки, а не громкий сбой");
  ok(GC_OPS.overlay.bk&&!GC_OPS.overlay.u,"overlay читает фон и ограничен фигурой");
  g.strokeStyle="#000";g.strokeRect(2,2,20,20);eq(g._ops[2].op,"overlay","overlay у штриха");
  let e="";try{g.shadowBlur=3;g.shadowColor="#000";g.fillRect(0,0,4,4);}catch(x){e=x.message;}
  ok(/^GPU-холст: нет/.test(e),"тень у overlay — громко ("+(e||"молча")+")");
});
