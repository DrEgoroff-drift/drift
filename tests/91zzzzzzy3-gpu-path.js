/* ══════════════ Path2D на GPU-холсте: запись и проигрыш (08caa, census §2 дыра 1) ══════════════
   Path2D подменён наследником, что пишет свои команды; GcCtx проигрывает запись через свой путь.
   Мерило — тот же путь, построенный сразу на холсте: треугольники должны совпасть до бита.
   Запись не требует видеокарты — набор живёт и под Node. */
suite("GPU-холст: Path2D — запись, проигрыш, правило заливки",()=>{
  resetWorld();
  const P=new Path2D();
  ok(P instanceof GcPath2D,"new Path2D() — записывающий наследник");
  ok(GC_P2D&&P instanceof GC_P2D,"и по-прежнему настоящий Path2D (2D-контекст его рисует)");
  /* одна и та же фигура — в Path2D и сразу на холсте */
  const draw=q=>{q.moveTo(4,4);q.lineTo(30,6);q.quadraticCurveTo(40,10,36,20);q.bezierCurveTo(30,30,20,34,10,28);
    q.arcTo(2,26,2,16,6);q.closePath();q.arc(20,16,5,0,Math.PI*2,true);q.ellipse(44,40,8,4,.3,0,Math.PI*1.5);
    q.rect(2,40,10,8);q.roundRect(50,4,12,10,[3,2]);};
  draw(P);
  const g=new GcCtx(64,64,2),h=new GcCtx(64,64,2);
  g.translate(3,1);g.scale(1.5,1.25);h.translate(3,1);h.scale(1.5,1.25);
  g.beginPath();g.moveTo(0,0);g.lineTo(9,9);const sp0=g._sp;
  g.fill(P);h.beginPath();draw(h);h.fill();
  eq(g._ops[0].v.join(),h._ops[0].v.join(),"заливка Path2D — те же треугольники, что у пути на холсте");
  ok(g._ops[0].v.length>60,"кривые развёрнуты в ломаную");
  eq(g._ops[0].eo,false,"по умолчанию nonzero");
  ok(g._sp===sp0&&g._sp.length===1&&g._sp[0].p.length===4,"fill(Path2D) не трогает текущий путь холста");
  g.fill(P,"evenodd");eq(g._ops[1].eo,true,"fill(path,\"evenodd\")");
  g.lineWidth=3;g.lineJoin="round";h.lineWidth=3;h.lineJoin="round";g.stroke(P);h.stroke();
  eq(g._ops[2].v.join(),h._ops[1].v.join(),"обводка Path2D — те же треугольники");
  const c=P._c.sp;g.fill(P);ok(P._c.sp===c,"та же матрица — развёрнутый путь из кэша, без нового проигрыша");
  g.save();g.clip(P,"evenodd");const cl=g._clip[g._clip.length-1];g.restore();
  ok(cl.eo===true&&cl.v.join()===gcFan(c,2).join(),"clip(path,\"evenodd\") — веер записанного пути");
  g.translate(10,0);g.fill(P);ok(P._c.sp!==c,"другая матрица — путь развёрнут заново");
  near(g._ops[g._ops.length-1].v[0]-g._ops[0].v[0],10*1.5*2,1e-9,"новая матрица учтена: сдвиг в пикселях выпечки");
  P.lineTo(60,60);g.fill(P);ok(P._c.sp.length>0&&g._ops[g._ops.length-1].v.length>g._ops[0].v.length-1,"дописанный путь — кэш сброшен");
  /* addPath с матрицей — снимок на момент вызова */
  const A=new Path2D();A.rect(0,0,4,4);
  const Q=new Path2D();Q.moveTo(1,1);Q.lineTo(3,1);Q.lineTo(2,3);Q.closePath();Q.addPath(A,new DOMMatrix().translate(5,7));
  A.rect(20,20,4,4);
  const g2=new GcCtx(32,32,1),h2=new GcCtx(32,32,1);g2.fill(Q);
  h2.moveTo(1,1);h2.lineTo(3,1);h2.lineTo(2,3);h2.closePath();h2.save();h2.translate(5,7);h2.rect(0,0,4,4);h2.restore();h2.fill();
  eq(g2._ops[0].v.join(),h2._ops[0].v.join(),"addPath(path, DOMMatrix) — с матрицей, позже дописанное не попадает");
  const Cp=new Path2D(Q);g2.fill(Cp);eq(g2._ops[1].v.join(),g2._ops[0].v.join(),"new Path2D(path) — копия записи");
  /* чего запись не знает — громко */
  const loud=[["Path2D из SVG",()=>g2.fill(new Path2D("M0 0L4 4Z"))],["addPath(SVG)",()=>{const R=new Path2D();R.addPath(new Path2D("M0 0"));g2.stroke(R);}],
    ["незаписанный путь",()=>g2.fill({})]];
  for(const [n,f] of loud){let m="";try{f();}catch(x){m=x.message;}ok(/^GPU-холст: нет/.test(m),n+" — громкий сбой ("+(m||"молча")+")");}
});
