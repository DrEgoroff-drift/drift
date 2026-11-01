/* Птица собирается порциями в полёте; открытие окна не платит всю сборку. */
workAdd("site-bird",12,()=>!!G.parrot&&!GOVORUN.mesh&&G.mode==="system",()=>govorunPump(2));
