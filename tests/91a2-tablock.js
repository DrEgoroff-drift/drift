/* Вкладка, которой уступили место, возвращает запись, когда ушла вкладка, взявшая его. */
TEST_SUITES.push(()=>suite("замок вкладок: закрытие чужой возвращает запись",()=>{
  resetWorld();
  ok(!!TAB_CH,"канал вкладок есть");
  const was=TAB_LIVE,wasTaker=TAB_TAKER;
  TAB_LIVE=true;TAB_TAKER=null;
  TAB_CH.onmessage({data:{k:"hello",id:"other-tab"}});
  ok(!tabLive(),"пришла новая вкладка — запись здесь остановлена");
  TAB_CH.onmessage({data:{k:"bye",id:"stranger"}});
  ok(!tabLive(),"чужой выход не возвращает запись");
  TAB_CH.onmessage({data:{k:"bye",id:"other-tab"}});
  ok(tabLive(),"ушла вкладка, взявшая место — запись вернулась");
  /* ушедшая вкладка успела записать новее — наше состояние старее, запись не возвращаем */
  const keep=stGet(SAVE_KEY);
  TAB_LIVE=true;TAB_TAKER=null;
  TAB_CH.onmessage({data:{k:"hello",id:"other-tab"}});
  stSet(SAVE_KEY,JSON.stringify({v:5,ts:wallNow()+5000}));
  TAB_CH.onmessage({data:{k:"bye",id:"other-tab"}});
  ok(!tabLive(),"другая вкладка записала новее — запись здесь не возвращается");
  TAB_LIVE=true;TAB_TAKER=null;
  TAB_CH.onmessage({data:{k:"hello",id:"other-tab"}});
  stSet(SAVE_KEY,JSON.stringify({v:5,ts:wallNow()-5000}));
  TAB_CH.onmessage({data:{k:"bye",id:"other-tab"}});
  ok(tabLive(),"запись старше нашего молчания — запись вернулась");
  if(keep===null)localStorage.removeItem(SAVE_KEY);else stSet(SAVE_KEY,keep);
  TAB_LIVE=was;TAB_TAKER=wasTaker;
}));
