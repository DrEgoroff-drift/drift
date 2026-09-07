/* ══════════════ загрузка: вторая половина (выделено из 14, M415) ══════════════
   `applySave` — семьсот строк подряд, и это не случайность: порядок в ней
   значим, а полей у мира больше трёхсот. Разрезать её пополам можно ровно
   в одном месте — там, где ни одна локальная переменная не переходит границу
   (`seen` кончается раньше, `pn` тоже, `st` объявляется уже за швом).

   Что здесь: артефакты, курс, дом, базы, холдинг, истории, тринадцать областей
   тринадцатого прохода, «Сорока», почта, попугай и настройки. Что осталось
   в `14-save`: корабль, мир, экономика, экипаж, управляющие — и `snapshot`,
   без которого эту половину не прочесть.

   Белый список полей — по-прежнему белый список: новое поле не переживёт
   перезагрузку, пока его не впишут сюда руками. Разрез этого не меняет,
   но теперь искать надо в двух файлах — grep по `docs/INDEX.md`. */
function applySaveRest(s){
  /* артефакты: только те, что есть в таблице — иначе битая запись пролезла бы
     в слот и в глобальный эффект */
  G.relics={};
  if(s.relics&&typeof s.relics==="object")
    for(const k in s.relics)if(ARTIFACTS[k]&&s.relics[k])G.relics[k]=1;
  /* курс (M321): адрес, к которому идёте, переживает сохранение — иначе «К ЦЕЛИ» гаснет на перезагрузке */
  G.course=(s.course&&typeof s.course==="object")?{sx:s.course.sx|0,sy:s.course.sy|0,rad:s.course.rad||null,what:String(s.course.what||"")}:null;
  G.relicHint=(s.relicHint&&typeof s.relicHint==="object")
    ?{sx:s.relicHint.sx|0,sy:s.relicHint.sy|0}:null;
  G.bio=+s.bio||0;
  /* дом: безопасный дефолт, поля проверяются поимённо — записи старых версий
     грузятся без дома и заводят его при первой же выручке */
  if(s.home&&typeof s.home==="object"){
    const h=homeInit();
    h.turn=Math.max(0,+s.home.turn||0);
    h.tier=clamp(s.home.tier|0,0,HOME_TIERS.length);
    h.sx=s.home.sx|0;h.sy=s.home.sy|0;h.made=+s.home.made||0;h.alloc=s.home.alloc|0;
    h.garage=Array.isArray(s.home.garage)?s.home.garage.filter(id=>!!shipData(id)):[];
    if(s.home.showcase&&typeof s.home.showcase==="object")
      for(const k of RES_KEYS)if(s.home.showcase[k]>0)h.showcase[k]=+s.home.showcase[k];
    h.trophies=Array.isArray(s.home.trophies)?s.home.trophies.slice(0,64):[];
    /* домочадец говорил на этой ступени — иначе перезагрузка сделала бы из него
       кран с частями (12j) */
    h.mateTier=clamp(s.home.mateTier|0,0,HOME_TIERS.length);
    G.home=h;
  }else G.home=null;
  /* надетый артефакт должен быть найденным и ровно у одного владельца */
  {
    const worn={};
    for(const m of G.mgrs){
      if(!m.relic)continue;
      if(!G.relics[m.relic]||worn[m.relic])m.relic=null;
      else worn[m.relic]=1;
    }
  }
  G.blueprints={};
  if(s.blueprints&&typeof s.blueprints==="object")
    for(const k in s.blueprints)if(BLUEPRINTS[k])G.blueprints[k]=s.blueprints[k]>0?1:-1;
  /* базы: тоже новое поле с безопасным дефолтом. Отсчёт ленивого времени
     подтягиваем к загрузке, иначе простой начислится задним числом. */
  G.bases={};
  if(s.bases&&typeof s.bases==="object")
    for(const k in s.bases){
      const b=s.bases[k];
      if(!b||!Array.isArray(b.cells))continue;
      /* число рядов у базы своё: «второй ярус» смотрителя вскрывает пятый
         и остаётся у неё навсегда, поэтому длина массива больше не константа */
      const rows=clamp(b.rows|0,BASE_ROWS,BASE_ROWS_DEEP)||BASE_ROWS;
      const cells=[];
      for(let i=0;i<BASE_COLS*rows;i++){
        const c=b.cells[i];
        cells.push(c&&BUILD[c.k]?{k:c.k,hp:clamp(+c.hp||1,0,1)}:null);
      }
      G.bases[k]={sx:b.sx|0,sy:b.sy|0,idx:b.idx|0,name:String(b.name||"База"),
        type:String(b.type||"rocky"),res:Array.isArray(b.res)?b.res.filter(x=>RES[x]):["iron"],
        rows,cells,pool:(b.pool&&typeof b.pool==="object")?b.pool:{},
        /* смена базы и журнал (M390): `t0` подтягивается к загрузке ровно так
           же, как раньше подтягивался `tMs`, — простой между сеансами базе не
           начисляется. Журнал переживает загрузку: это её память, а не кэш */
        t0:(typeof baseShift==="function")?baseShift():0,
        /* запас и консервация (M391): старая база грузится полной — она и
           правда стояла без людей, а значит ничего не тратила */
        life:{air:(b.life&&+b.life.air>=0)?+b.life.air|0:LIFE_START,
              water:(b.life&&+b.life.water>=0)?+b.life.water|0:LIFE_START,
              food:(b.life&&+b.life.food>=0)?+b.life.food|0:LIFE_START,
              q:(b.life&&b.life.q==="poor")?"poor":"good"},
        low:b.low|0,
        /* гость у затвора (M395): он ждёт и между сеансами — уходить ему некуда */
        guest:(b.guest&&typeof b.guest==="object")?{name:String(b.guest.name||"").slice(0,24),
          role:String(b.guest.role||"driller"),seed:b.guest.seed|0,n:b.guest.n|0}:null,
        /* погода директора (M397): у неё есть сроки, и они переживают выход */
        dust:b.dust|0,cold:b.cold|0,vein:b.vein|0,thief:b.thief|0,dead:b.dead|0,
        /* развалина (M402, §39): из аккаунта ничего не удаляется — база живёт
           в записи и разбитой, вместе с тем, кто в неё въехал */
        ruin:(b.ruin&&typeof b.ruin==="object")?{n:b.ruin.n|0,
          who:(b.ruin.who==="pirate"||b.ruin.who==="squat")?b.ruin.who:null}:null,
        /* устав (M399): законы берутся навсегда, значит они в записи */
        charter:Array.isArray(b.charter)?b.charter.filter(x=>typeof CHARTER_BY!=="undefined"&&CHARTER_BY[x]):[],
        /* договор с управляющим (M405): в записи только НОМЕР — сам он
           выводится броском, как и всё остальное в этой игре */
        mgr:(b.mgr&&typeof b.mgr==="object")?{id:b.mgr.id|0,since:b.mgr.since|0,
          due:b.mgr.due|0}:null,
        /* оборот и суточный расход управляющего: без них доли обнулялись
           перезагрузкой, а потолок стройки начинался заново (разбор 0.409.1) */
        _turn:b._turn|0,_earned:b._earned|0,devSaid:b.devSaid?1:0,
        spend:(b.spend&&typeof b.spend==="object")?{n:b.spend.n|0,q:b.spend.q|0}:null,
        /* участок в реестре ПАЛАТЫ (M408): режим, сроки и долг. Из записи это
           не исчезает — в том и вся мысль §30 */
        pal:(b.pal&&typeof b.pal==="object")?{mode:String(b.pal.mode||"common"),
          since:b.pal.since|0,paid:b.pal.paid|0,svod:b.pal.svod|0,
          debt:Math.max(0,b.pal.debt|0),closed:b.pal.closed?1:0,switched:b.pal.switched|0}:null,
        fire:(b.fire&&typeof b.fire==="object")?{c:b.fire.c|0,r:b.fire.r|0,
          k:String(b.fire.k||"fire"),n:b.fire.n|0}:null,
        park:b.park|0,
        /* срок криогена (M392): это не запас, а до какой смены держит холод */
        cryo:(b.cryo&&typeof b.cryo==="object")?{until:b.cryo.until|0,q:b.cryo.q|0}:null,
        log:Array.isArray(b.log)?b.log.slice(-24).map(x=>({n:x.n|0,k:String(x.k||""),
          t:String(x.t||"").slice(0,160)})):[],
        tMs:Date.now(),built:+b.built||Date.now()};
    }
  G.base=null;
  G.fuseGen=Math.max(0,s.fuseGen|0);
  /* приборы (M127): решение игрока, поэтому персистятся. Старая запись их не
     знает — тогда на корабле стоит казённый набор, как с верфи */
  G.instrKit=(s.instrKit&&typeof s.instrKit==="object")?s.instrKit:null;
  G.instrShelf=Array.isArray(s.instrShelf)?s.instrShelf.slice(0,8):[];
  G.tape=(typeof tapeUnpack==="function")?tapeUnpack(s.tape):null;
  G.tapeLong=s.tapeLong|0;
  /* речь (M128): очередь реплик по местам, счётчик посадок и оторванные ленты —
     всё это память об игроке, а не о мире, и поэтому персистится */
  G.speech=asMap(s.speech);
  G.visits=asMap(s.visits);
  G.walled=asMap(s.walled);
  G.mailed=asMap(s.mailed);
  /* истории (11c): только то, что игрок видел, якоря и повороты */
  /* часы над концами (P8, M416): что и когда сделано — это решение игрока,
     а не производная от seed. Роняем в безопасный вид поимённо */
  G.clocks={};
  if(s.clocks&&typeof s.clocks==="object")
    for(const k in s.clocks){
      if(typeof CLOCKS!=="undefined"&&!CLOCKS[k])continue;
      const c=s.clocks[k];if(!c||typeof c!=="object")continue;
      G.clocks[k]={n:Math.max(0,c.n|0),last:c.last|0};
    }
  G.seen=asMap(s.seen);
  G.storyPin=asMap(s.storyPin);
  G.storyFlags=asMap(s.storyFlags);
  /* память места и одометр (11d): объекты с дефолтами, формат v:4 не менялся */
  G.place={};
  if(s.place&&typeof s.place==="object")for(const k in s.place){
    const p=s.place[k];if(!p||typeof p!=="object")continue;
    G.place[k]={f:Math.max(0,p.f|0),l:Math.max(0,p.l|0),n:Math.max(0,p.n|0),
      take:Math.max(0,p.take|0),hurt:Math.max(0,p.hurt|0),care:Math.max(0,p.care|0)};
  }
  G.odo={lands:Math.max(0,(s.odo&&s.odo.lands)|0),jumps:Math.max(0,(s.odo&&s.odo.jumps)|0)};
  G.mirror={bearing:(s.mirror&&s.mirror.bearing)?1:0};   /* зеркало (11f) */
  /* три света (11g): день первого прихода в ядро и были ли внутри */
  G.lights={t0:(s.lights&&s.lights.t0!=null)?Math.max(-1,s.lights.t0|0):-1,seen:clamp((s.lights&&s.lights.seen)|0,0,2)};
  G.hours={man:(s.hours&&s.hours.man)?1:0};   /* уезд часов (11h): человек прошёл один раз */
  G.grove={turn:Math.max(0,(s.grove&&s.grove.turn)|0),shot:(s.grove&&s.grove.shot)?1:0,cut:(s.grove&&s.grove.cut)?1:0};   /* роща (11j) */
  {const k=s.keepers||{};G.keepers={gone:k.gone?1:0,signed:k.signed?1:0,fed:Math.max(0,k.fed|0),given:Math.max(0,k.given|0)};}   /* смотрители (11k) */
  {const c=s.county||{};G.county={called:c.called?1:0,at:Math.max(0,c.at|0),answered:c.answered?1:0,saw:c.saw?1:0};}   /* большой уезд (11l) */
  {const c=s.charts||{};G.charts={have:c.have?1:0,lost:(c.lost==null?-1:c.lost|0)};}   /* несогласие карт (11m) */
  G.quiet={stay:(s.quiet&&s.quiet.stay)?1:0};   /* тихий уезд (11n) */
  {const c=s.slow||{};G.slow={fig:Array.isArray(c.fig)?c.fig.filter(k=>RES[k]).slice(0,4):null,at:(c.at==null?-1:c.at|0),round:Math.max(0,c.round|0)};if(!G.slow.fig)G.slow.fig=null;}   /* медленный (11o) */
  {const c=s.pass||{};G.pass={lit:c.lit?1:0,told:c.told?1:0};}   /* перевал (11p) */
  G.grown={recip:Math.max(0,(s.grown&&s.grown.recip)|0)};   /* другое взросление (11q) */
  {const c=s.plan||{};G.plan={took:Math.max(0,c.took|0),hauled:Math.max(0,c.hauled|0)};}   /* план (11r) */
  G.ret={seen:(s.ret&&s.ret.seen)?1:0};   /* возвращение (11s) */
  G.name=(typeof s.name==="string")?s.name.slice(0,18):"";   /* имя капитана (M299) */
  G.names={};if(s.names&&typeof s.names==="object")for(const k in s.names)if(typeof s.names[k]==="string")G.names[k]=s.names[k].slice(0,18);   /* имена (11u) */
  G.namesTold={};if(s.namesTold&&typeof s.namesTold==="object")for(const k in s.namesTold)G.namesTold[k]=s.namesTold[k]|0;
  /* почтовый круг (11e): три числа */
  G.post={stage:clamp((s.post&&s.post.stage)|0,0,POST_LINKS.length-1),opened:(s.post&&s.post.opened)?1:0,done:(s.post&&s.post.done)?1:0};
  G.strips=Array.isArray(s.strips)?s.strips.slice(0,8):[];
  for(const st of G.strips)if(st&&typeof st==='object'&&typeof st.mis!=='number')st.mis=0;   /* ленты до невязки (11z): без поля фигура считала NaN */
  G.need=asMap(s.need);
  G.hold=asMap(s.hold);
  G.order=(s.order&&typeof s.order==="object"&&s.order.to)?s.order:null;
  G.things=Array.isArray(s.things)?s.things.slice(0,40):[];
  G.ratios=asMap(s.ratios);
  G.seenPrices=asMap(s.seenPrices);
  /* комплект (M152): шесть мест, каждая вещь проверяется по месту и классу */
  G.kit=null;if(s.kit&&typeof s.kit==="object"){G.kit={};for(const p of KIT_PLACES){const x=s.kit[p];G.kit[p]=(x&&x.p===p)?kitPiece(p,x.cls,x.wear,x.seed):kitPiece(p,1,0,0);if(x&&Array.isArray(x.mods))G.kit[p].mods=x.mods.filter(id=>KIT_MODS[id]).slice(0,2);if(x)G.kit[p].model=clamp(x.model|0,0,2);}}
  G.kitShelf=Array.isArray(s.kitShelf)?s.kitShelf.filter(x=>x&&KIT_PLACES.indexOf(x.p)>=0).map(x=>{const y=kitPiece(x.p,x.cls,x.wear,x.seed);y.model=clamp(x.model|0,0,2);y.mods=Array.isArray(x.mods)?x.mods.filter(id=>KIT_MODS[id]).slice(0,2):[];return y;}).slice(0,12):[];
  G.kitDepot=asMap(s.kitDepot);
  /* Вега (M153, чинено M329): набор полей живёт у неё (VEGA_DEF в 11w-vega),
     здесь он только применяется. Чего в записи нет — то по умолчанию, что
     пришло не числом — то ноль: null вместо числа приезжает из любого JSON,
     потому что NaN в нём записывается именно так, и раньше он доезжал до
     экрана и убивал вкладку. */
  G.vega=null;
  if(s.vega&&typeof s.vega==="object"&&s.vega.stage){
    const V=Object.assign({},VEGA_DEF,s.vega);
    for(const k in VEGA_DEF)V[k]=Number.isFinite(+V[k])?+V[k]:VEGA_DEF[k];
    V.broken=Array.isArray(s.vega.broken)?s.vega.broken.slice(0,8):[];
    V.out=(s.vega.out&&typeof s.vega.out==="object")?s.vega.out:{};
    V.wish=String(s.vega.wish||"");
    G.vega=V;
  }
  G.wishDevice=s.wishDevice|0;G.seat=null;
  G.ring=(s.ring&&typeof s.ring==="object")?Object.assign({heard:0,tapes:[],left:RING_FIRST,jumps:0},s.ring):null;G.ringNow=null;
  G.exp=(s.exp&&typeof s.exp==="object")?Object.assign({phase:0,day0:0,coll:{},gone:[],gave:0,pax:null},s.exp):null;
  G.letters=asMap(s.letters);
  G.island=(s.island&&typeof s.island==="object"&&s.island.letters)?s.island:{letters:{}};
  G.record=(s.record&&typeof s.record==="object"&&Array.isArray(s.record.e))?s.record:null;
  G.inst=(s.inst&&typeof s.inst==="object"&&s.inst.t)?s.inst:null;
  G.duty=(s.duty&&typeof s.duty==="object")?s.duty:null;          /* небесная вахта (M195) */
  /* альбом — двенадцать снимков сцены по паре сотен байт (M188). Не пиксели:
     иначе сохранение, которое ходит в облако, потяжелело бы на треть мегабайта */
  G.album=Array.isArray(s.album)?s.album.slice(0,ALBUM_MAX):[];
  /* почта (M190): в сейве только то, что УЖЕ пришло — стопки и номера цепочек.
     Общая куча живёт на сервере и в сохранение не попадает никогда */
  G.mail=(s.mail&&typeof s.mail==="object"&&Array.isArray(s.mail.st))?s.mail:null;
  /* вымпелы (M196): только время запуска, срок и семя цели — полёт не
     моделируется, он считается от Date.now() в тот момент, когда спросят */
  G.probes=Array.isArray(s.probes)?s.probes.slice(0,PROBE_MAX):[];
  /* зимовка (M197): месяц идёт по суткам, а не по часам, поэтому в сейве
     лежит она целиком — прервать её и вернуться назавтра можно и нужно */
  G.win=(s.win&&typeof s.win==="object"&&s.win.pw)?s.win:null;
  /* санаторий (M199): три дня, которые можно прервать выходом и вернуться
     потом — потому и лежит в сейве, хотя ничего в игре и не меняет */
  G.spa=(s.spa&&typeof s.spa==="object"&&s.spa.days)?s.spa:null;
  /* какие праздники уже отмечены (M201): по одной единице на год и праздник,
     иначе радиограммы придут во второй раз при следующей же стыковке */
  G.hol=(s.hol&&typeof s.hol==="object")?s.hol:null;
  /* полка (M202): только номера найденных книг — тексты лежат в таблице и в
     сохранение не попадают никогда */
  G.smena=Array.isArray(s.smena)?s.smena.map(x=>x|0).filter(x=>x>=1&&x<=72):[];   /* «Смена» (M353) */
  G.books=Array.isArray(s.books)?s.books.filter(x=>!!BOOKS_BY[x|0]).map(x=>x|0):[];
  /* карточки (M203): кого слышал, кому послал, от кого пришло. Позывные
     сверяются с таблицей — чужой id в сейве не заведёт корреспондента */
  G.qsl=null;
  if(s.qsl&&typeof s.qsl==="object"){
    const Q={heard:{},sent:{},got:{}};
    for(const k of ["heard","sent","got"]){
      const src=s.qsl[k];
      if(src&&typeof src==="object")for(const id in src)if(QSL_BY[id])Q[k][id]=src[id];
    }
    G.qsl=Q;
  }
  /* приёмники (M218): что поймано ушами и когда там платили. Где стоят и
     какого рода — считается от посева сектора и не хранится вовсе. Род
     сверяется с таблицей: чужой в сейве не заведёт мачту неизвестной породы */
  G.relay=null;
  if(s.relay&&typeof s.relay==="object"){
    const R={};
    for(const k in s.relay){
      const a=s.relay[k];
      if(!a||typeof a!=="object"||!RELAY_BY[a.k])continue;
      R[k]={k:a.k,call:String(a.call||""),name:String(a.name||""),
            sx:a.sx|0,sy:a.sy|0,day:a.day|0};
      if(a.paid!=null)R[k].paid=a.paid|0;
    }
    G.relay=R;
  }
  /* грядка (M204): имя вида и время посева, больше ничего. Рост считается от
     Date.now() в тот момент, когда на грядку смотрят */
  G.green=null;
  if(s.green&&Array.isArray(s.green.beds)){
    const B=[];
    for(const b of s.green.beds){
      if(!b||typeof b.name!=="string"||!b.name)continue;
      B.push({name:b.name.slice(0,48),t:Math.max(0,+b.t||0)});
      if(B.length>=GREEN_BEDS)break;
    }
    G.green={beds:B};
  }
  /* кино (M205): только список виденных сеансов, и тот ради строки в книжке.
     Где и когда идёт фильм — считается от координат и недели */
  G.kino=Array.isArray(s.kino)?s.kino.filter(x=>typeof x==="string").slice(-40):[];
  /* вымпел (M206): только номера объявленных кварталов, чтобы не повторяться.
     Кто его держит — считается от состава баз и квартала */
  /* «Number.isFinite(+x)» пропускает null: +null это ноль. Проверяем ТИП */
  G.penn=Array.isArray(s.penn)?s.penn.filter(x=>typeof x==="number"&&Number.isFinite(x)).map(x=>x|0).slice(-16):[];
  /* первый час (M207): какие строки сменщика уже сказаны. Повторять их нельзя
     ни при загрузке, ни при возвращении — живые люди не повторяют */
  G.first=Array.isArray(s.first)?s.first.filter(x=>!!FIRST_BY[x]):[];
  /* партии по переписке (M192): в сейве лежат ХОДЫ, а не позиция. Доска
     считается из них, и потому рассинхрона между двумя концами не бывает в
     принципе; а порченый ход обрывает список, а не портит партию целиком */
  G.chess=null;
  if(s.chess&&s.chess.g&&typeof s.chess.g==="object"){
    const GG={};
    for(const ch in s.chess.g){
      if(!/^[a-f0-9]{12}$/.test(ch))continue;
      const g=s.chess.g[ch];
      if(!g||!Array.isArray(g.mv))continue;
      const mv=[];
      for(const m of g.mv.slice(0,300)){
        if(!m)continue;
        const f=m.f|0,t=m.t|0,p=m.p|0;
        if(f<0||f>63||t<0||t>63||p<0||p>3)break;
        mv.push({f,t,p});
      }
      GG[ch]={mv,w:g.w?1:0,t:+g.t||0,sent:+g.sent||0};
    }
    G.chess={g:GG};
  }
  G.trainee=(s.trainee&&typeof s.trainee==="object"&&s.trainee.name)?s.trainee:null;
  G.zoo=(s.zoo&&typeof s.zoo==="object"&&Array.isArray(s.zoo.pen))?s.zoo:null;
  G.concert=(s.concert&&typeof s.concert==="object")?s.concert:null;
  G.road=(s.road&&typeof s.road==="object")?s.road:null;if(G.road&&G.road.cr===undefined)G.road.cr=0;
  /* чужой след (M171): дневной счётчик и встреченные руки. Знак и метка пилота
     живут в localStorage, а не в сейве — они про машину, а не про партию */
  G.trace=(s.trace&&typeof s.trace==="object")?Object.assign({day:"",left:0,hands:{},seen:0},s.trace):null;
  if(G.trace&&typeof G.trace.hands!=="object")G.trace.hands={};
  G.log=Array.isArray(s.log)
    ? s.log.filter(e=>e&&typeof e.s==="string").slice(-LOG_MAX).map(e=>({t:+e.t||Date.now(),k:String(e.k||""),s:e.s}))
    : [];
  G.logNew=0;
  /* Отметка «стол видели» служит и признаком формата: если её в записи нет,
     запись старая, и флагов `noticed` на вещах в ней тоже нет. Тогда считаем
     видимым всё — иначе загрузка старого сохранения зажжёт огонёк на сорока
     давно лежащих бумагах, то есть вернёт ровно ту поломку, ради которой
     отметка и заведена. Ставится после восстановления G.things и G.strips. */
  G.tableSeen=(+s.tableSeen)||0;
  if(!G.tableSeen&&typeof tableNoticeAll==="function")tableNoticeAll();
  /* Главный квест. Возможности — живые и короткие, поэтому валидируются;
     память людей и тетрадь переносятся как есть, потому что закрытая дверь
     обязана пережить и загрузку, и время. */
  G.offers=Array.isArray(s.offers)?s.offers.filter(o=>o&&o.kind&&o.who).slice(-24):[];
  G.folk=asMap(s.folk);
  G.ledger=(s.ledger&&typeof s.ledger==="object")?s.ledger:{n:0,w:0};
  /* докуда дошли реплики своих: иначе после загрузки они начнут с начала и
     повторят то, что игрок уже слышал */
  G.folkSay=asMap(s.folkSay);
  /* поздний час (M225): счётчик посиделок смены — иначе сейв обнуляет стойку */
  G.late=(s.late&&typeof s.late==="object")?{shift:s.late.shift|0,n:s.late.n|0}:null;
  /* тот один (M230): сказал — сказано навсегда */
  G.toldOff=s.toldOff?1:0;
  /* рассказанное не забывается: место, про которое он проговорился, выработают
     и без него, сколько бы раз он ни перезагрузился (11aj) */
  G.told=Array.isArray(s.told)?s.told.slice(-24):[];
  G.lastDig=(s.lastDig&&typeof s.lastDig==="object")?s.lastDig:null;
  G.credits=Math.max(0,s.credits|0);G.data=Math.max(0,s.data|0);
  G.soldTotal=Math.max(0,s.soldTotal|0);   /* оборот для экзамена кооператива (12aj) — раньше терялся при каждой загрузке */
  /* безопасные значения по умолчанию: старый сейв не знает этих полей (M363) */
  G.clearance=Math.max(1,s.clearance|0);
  G.flownMs=Math.max(0,s.flownMs|0);
  G.gunGroup=clamp(s.gunGroup|0,0,2);
  for(const k of RES_KEYS)G.cargo[k]=Math.max(0,(s.cargo&&s.cargo[k])|0);
  const st=stat();
  G.fuel=clamp(+s.fuel||0,0,st.fuelMax);
  G.hull=clamp(+s.hull||st.hullMax,1,st.hullMax);
  G.shield=st.shieldMax;G.energy=st.energyMax;G.shieldHit=0;G.loot=[];   // щит, энергия и лут в системе — эфемерные, не персистятся
  /* курс из старых записей мог накопить десятки оборотов — чиним на входе,
     иначе испорченное сохранение чинит себя только после полного разворота */
  G.ship.x=+s.x||0;G.ship.y=+s.y||-760;G.ship.a=angWrap(+s.a||0);
  G.ship.vx=0;G.ship.vy=0;G.ship.av=0;G.ship.bank=0;
  G.mode="system";G.ap=null;G.land=null;G.surf=null;G.belt=null;G.st=null;G.dig=null;G.cave=null;
  if(!G.opts.keys||typeof G.opts.keys!=="object")G.opts.keys={main:{},belt:{}};
  if(!G.opts.keys.main)G.opts.keys.main={};if(!G.opts.keys.belt)G.opts.keys.belt={};
  if(!G.opts.pads)G.opts.pads="auto";if(!G.opts.padSize)G.opts.padSize=1;
  if(!G.opts.gfx||typeof G.opts.gfx!=="object")G.opts.gfx={draw:1,detail:1,particles:1,plants:1,fps:0};
  for(const k of["draw","detail","particles","plants"])if(!G.opts.gfx[k])G.opts.gfx[k]=1;
  /* потолок кадров: 0 — без потолка. Ноль тут законное значение, поэтому
     проверка на «пусто» ему не годится, нужна проверка на «не из списка». */
  if(![0,30,60].includes(G.opts.gfx.fps))G.opts.gfx.fps=0;
  if(![0,1,1.5,2].includes(G.opts.gfx.res))G.opts.gfx.res=0;
  resize();
  if(!G.opts.audio||typeof G.opts.audio!=="object")G.opts.audio={on:true,music:.6,sfx:.6,engine:.4};
  if(typeof G.opts.audio.music!=="number")G.opts.audio.music=.6;
  if(typeof G.opts.audio.sfx!=="number")G.opts.audio.sfx=.6;
  if(typeof G.opts.audio.engine!=="number")G.opts.audio.engine=.4;
  invalidateKeyMap();applyPadMode();applyPadSize();applyVolumes();
  return true;
}
