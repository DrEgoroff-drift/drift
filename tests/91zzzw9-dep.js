/* Дорогая жила — находка (M904d, 21pzc): на поверхности кристалл реже железа во столько раз,
   во сколько дороже кремния; тип решает зерно залежи, и перезаход видит то же самое —
   иначе посадку можно было бы перебирать, пока не выпадет кристалл (деньги из воздуха). */
TEST_SUITES.push(()=>suite("дорогая жила: реже по цене, тот же тип при перезаходе",()=>{
  resetWorld();
  const mk=(res,n)=>{const S={p:{idx:2,type:"volcanic"},deposits:[]};
    for(let i=0;i<n;i++)S.deposits.push({x:100+i*40,res,left:9,prog:0,i});return S;};
  const A=mk("crystal",600);depValue(A);
  const keep=A.deposits.filter(d=>d.res==="crystal").length/600,f=DEP_REF/RES.crystal.price;
  ok(Math.abs(keep-f)<.05,"кристалл остался в "+(keep*100).toFixed(0)+" % залежей при весе "+(f*100).toFixed(0)+" %");
  ok(A.deposits.every(d=>d.res==="crystal"||d.res==="iron"),"остальные стали самой дешёвой рудой профиля — железом");
  ok(A.deposits.every(d=>d.left===9),"остаток залежи не тронут");
  const B=mk("crystal",600);depValue(B);
  ok(B.deposits.every((d,i)=>d.res===A.deposits[i].res),"перезаход: те же залежи — те же типы");
  const C=mk("iron",50);depValue(C);
  ok(C.deposits.every(d=>d.res==="iron"),"дешёвая руда не меняется");
  G.sx+=1;const D=mk("crystal",600);depValue(D);
  ok(D.deposits.some((d,i)=>d.res!==A.deposits[i].res),"в соседней системе — свой расклад");
  resetWorld();
}));
