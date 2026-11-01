/* ══════════════ сто жителей станций ══════════════
   Постоянные люди зала: один id — одно лицо. Зал берёт горсть своего типа
   по зерну системы и больше её не меняет. Вега (id 1) в толпу не встаёт:
   её рисует её собственный сюжет, платье и косынка — в cpBody. */
const NPC_LIB=[
 {id:1,st:"bazaar",role:"",name:"Вега",job:"радистка",fem:1,hero:1,build:0.86,hs:1.0,jaw:0.62,brow:0.92,chin:0.58,nose:0.35,lip:0.72,style:2,beard:0,skin:1,hair:0,eye:3,age:0.34,w:0.24,h:0.31,jac:[98,62,138]},
 {id:2,st:"trade",role:"clerk",name:"Илья",job:"смотритель стойки",fem:0,hero:0,build:1.195,hs:0.99,jaw:0.803,brow:0.87,chin:0.9,nose:0.778,lip:0.312,style:6,beard:3,skin:5,hair:6,eye:3,age:0.45,w:0.271,h:0.309,jac:[132,128,118]},
 {id:3,st:"trade",role:"fact",name:"Пётр",job:"продавец",fem:0,hero:0,build:1.36,hs:1.02,jaw:0.888,brow:1.02,chin:0.6,nose:0.333,lip:0.062,style:4,beard:0,skin:2,hair:4,eye:2,age:0.54,w:0.22,h:0.28,jac:[118,62,46]},
 {id:4,st:"trade",role:"fact",name:"Вера",job:"посредница",fem:1,hero:0,build:0.782,hs:1.05,jaw:0.972,brow:0.84,chin:0.95,nose:0.944,lip:0.875,style:5,beard:0,skin:5,hair:5,eye:1,age:0.63,w:0.271,h:0.366,jac:[118,62,46]},
 {id:5,st:"trade",role:"",name:"Семён",job:"грузчик",fem:0,hero:0,build:0.948,hs:1.08,jaw:0.578,brow:0.99,chin:0.65,nose:0.5,lip:0.625,style:6,beard:2,skin:8,hair:6,eye:0,age:0.72,w:0.22,h:0.337,jac:[92,70,74]},
 {id:6,st:"trade",role:"keep",name:"Глеб",job:"кладовщик",fem:0,hero:0,build:1.113,hs:0.9,jaw:0.663,brow:0.81,chin:1.0,nose:0.056,lip:0.375,style:0,beard:3,skin:1,hair:7,eye:5,age:0.81,w:0.271,h:0.309,jac:[58,74,66]},
 {id:7,st:"trade",role:"",name:"Нина",job:"курьер",fem:1,hero:0,build:1.277,hs:0.93,jaw:0.747,brow:0.96,chin:0.7,nose:0.667,lip:0.125,style:1,beard:0,skin:4,hair:8,eye:4,age:0.9,w:0.22,h:0.28,jac:[104,96,80]},
 {id:8,st:"trade",role:"",name:"Оля",job:"покупательница",fem:1,hero:0,build:0.7,hs:0.96,jaw:0.831,brow:0.78,chin:1.05,nose:0.222,lip:0.938,style:2,beard:0,skin:7,hair:9,eye:3,age:0.18,w:0.271,h:0.366,jac:[58,62,70]},
 {id:9,st:"trade",role:"cmd",name:"Марк",job:"капитан",fem:0,hero:0,build:0.865,hs:0.99,jaw:0.916,brow:0.93,chin:0.75,nose:0.833,lip:0.688,style:3,beard:2,skin:0,hair:0,eye:2,age:0.27,w:0.22,h:0.337,jac:[48,54,62]},
 {id:10,st:"trade",role:"clerk",name:"Рая",job:"бухгалтер",fem:1,hero:0,build:1.03,hs:1.02,jaw:1.0,brow:0.75,chin:1.1,nose:0.389,lip:0.438,style:6,beard:0,skin:7,hair:1,eye:1,age:0.36,w:0.271,h:0.309,jac:[132,128,118]},
 {id:11,st:"trade",role:"fact",name:"Лев",job:"перекупщик",fem:0,hero:0,build:1.195,hs:1.05,jaw:0.606,brow:0.9,chin:0.8,nose:1.0,lip:0.188,style:5,beard:0,skin:6,hair:2,eye:0,age:0.45,w:0.22,h:0.28,jac:[118,62,46]},
 {id:12,st:"trade",role:"keep",name:"Тихон",job:"приёмщик",fem:0,hero:0,build:1.36,hs:1.08,jaw:0.691,brow:1.05,chin:0.5,nose:0.556,lip:1.0,style:6,beard:1,skin:9,hair:3,eye:5,age:0.54,w:0.271,h:0.366,jac:[58,74,66]},
 {id:13,st:"trade",role:"",name:"Яков",job:"носильщик",fem:0,hero:0,build:0.782,hs:0.9,jaw:0.775,brow:0.87,chin:0.85,nose:0.111,lip:0.75,style:0,beard:2,skin:2,hair:4,eye:4,age:0.63,w:0.22,h:0.337,jac:[96,80,64]},
 {id:14,st:"trade",role:"fact",name:"Зина",job:"оценщица",fem:1,hero:0,build:0.948,hs:0.93,jaw:0.859,brow:1.02,chin:0.55,nose:0.722,lip:0.5,style:1,beard:0,skin:5,hair:5,eye:3,age:0.72,w:0.271,h:0.309,jac:[118,62,46]},
 {id:15,st:"trade",role:"cmd",name:"Осип",job:"шкипер",fem:0,hero:0,build:1.113,hs:0.96,jaw:0.944,brow:0.84,chin:0.9,nose:0.278,lip:0.25,style:2,beard:0,skin:8,hair:6,eye:2,age:0.81,w:0.22,h:0.28,jac:[48,54,62]},
 {id:16,st:"trade",role:"",name:"Люба",job:"закупщица",fem:1,hero:0,build:1.277,hs:0.99,jaw:0.55,brow:0.99,chin:0.6,nose:0.889,lip:0.0,style:3,beard:0,skin:1,hair:7,eye:1,age:0.9,w:0.271,h:0.366,jac:[70,74,90]},
 {id:17,st:"trade",role:"clerk",name:"Тася",job:"кассир",fem:1,hero:0,build:0.7,hs:1.02,jaw:0.634,brow:0.81,chin:0.95,nose:0.444,lip:0.812,style:3,beard:0,skin:1,hair:6,eye:0,age:0.18,w:0.22,h:0.337,jac:[132,128,118]},
 {id:18,st:"indust",role:"clerk",name:"Фома",job:"мастер смены",fem:0,hero:0,build:0.865,hs:1.05,jaw:0.719,brow:0.96,chin:0.65,nose:0.0,lip:0.562,style:6,beard:3,skin:2,hair:8,eye:5,age:0.27,w:0.271,h:0.309,jac:[132,128,118]},
 {id:19,st:"indust",role:"keep",name:"Наум",job:"ремонтник",fem:0,hero:0,build:1.03,hs:1.08,jaw:0.803,brow:0.78,chin:1.0,nose:0.611,lip:0.312,style:6,beard:0,skin:0,hair:0,eye:4,age:0.36,w:0.22,h:0.28,jac:[58,74,66]},
 {id:20,st:"indust",role:"",name:"Егор",job:"сварщик",fem:0,hero:0,build:1.195,hs:0.9,jaw:0.888,brow:0.93,chin:0.7,nose:0.167,lip:0.062,style:0,beard:1,skin:3,hair:1,eye:3,age:0.45,w:0.271,h:0.366,jac:[86,70,78]},
 {id:21,st:"indust",role:"",name:"Мирон",job:"литейщик",fem:0,hero:0,build:1.36,hs:0.93,jaw:0.972,brow:0.75,chin:1.05,nose:0.778,lip:0.875,style:1,beard:2,skin:6,hair:2,eye:2,age:0.54,w:0.22,h:0.337,jac:[72,68,60]},
 {id:22,st:"indust",role:"sci",name:"Поля",job:"инспектор",fem:1,hero:0,build:0.782,hs:0.96,jaw:0.578,brow:0.9,chin:0.75,nose:0.333,lip:0.625,style:2,beard:0,skin:9,hair:3,eye:1,age:0.63,w:0.271,h:0.309,jac:[168,176,186]},
 {id:23,st:"indust",role:"",name:"Савва",job:"оператор",fem:0,hero:0,build:0.948,hs:0.99,jaw:0.663,brow:1.05,chin:1.1,nose:0.944,lip:0.375,style:3,beard:0,skin:2,hair:4,eye:0,age:0.72,w:0.22,h:0.28,jac:[96,80,64]},
 {id:24,st:"indust",role:"keep",name:"Прохор",job:"механик",fem:0,hero:0,build:1.113,hs:1.02,jaw:0.747,brow:0.87,chin:0.8,nose:0.5,lip:0.125,style:4,beard:1,skin:5,hair:5,eye:5,age:0.81,w:0.271,h:0.366,jac:[58,74,66]},
 {id:25,st:"indust",role:"",name:"Ася",job:"грузчица",fem:1,hero:0,build:1.277,hs:1.05,jaw:0.831,brow:1.02,chin:0.5,nose:0.056,lip:0.938,style:5,beard:0,skin:8,hair:6,eye:4,age:0.9,w:0.22,h:0.337,jac:[92,70,74]},
 {id:26,st:"indust",role:"cmd",name:"Тарас",job:"мастер",fem:0,hero:0,build:0.7,hs:1.08,jaw:0.916,brow:0.84,chin:0.85,nose:0.667,lip:0.688,style:6,beard:3,skin:1,hair:7,eye:3,age:0.18,w:0.271,h:0.309,jac:[48,54,62]},
 {id:27,st:"indust",role:"clerk",name:"Клава",job:"табельщица",fem:1,hero:0,build:0.865,hs:0.9,jaw:1.0,brow:0.99,chin:0.55,nose:0.222,lip:0.438,style:1,beard:0,skin:6,hair:6,eye:2,age:0.27,w:0.22,h:0.28,jac:[132,128,118]},
 {id:28,st:"indust",role:"",name:"Кузьма",job:"наладчик",fem:0,hero:0,build:1.03,hs:0.93,jaw:0.606,brow:0.81,chin:0.9,nose:0.833,lip:0.188,style:1,beard:1,skin:7,hair:9,eye:1,age:0.36,w:0.271,h:0.366,jac:[58,62,70]},
 {id:29,st:"indust",role:"keep",name:"Демид",job:"энергетик",fem:0,hero:0,build:1.195,hs:0.96,jaw:0.691,brow:0.96,chin:0.6,nose:0.389,lip:1.0,style:2,beard:2,skin:0,hair:0,eye:0,age:0.45,w:0.22,h:0.337,jac:[58,74,66]},
 {id:30,st:"indust",role:"",name:"Ефим",job:"крановщик",fem:0,hero:0,build:1.36,hs:0.99,jaw:0.775,brow:0.78,chin:0.95,nose:1.0,lip:0.75,style:3,beard:3,skin:3,hair:1,eye:5,age:0.54,w:0.271,h:0.309,jac:[86,70,78]},
 {id:31,st:"indust",role:"sci",name:"Маша",job:"технолог",fem:1,hero:0,build:0.782,hs:1.02,jaw:0.859,brow:0.93,chin:0.65,nose:0.556,lip:0.5,style:4,beard:0,skin:6,hair:2,eye:4,age:0.63,w:0.22,h:0.28,jac:[168,176,186]},
 {id:32,st:"yard",role:"clerk",name:"Арсений",job:"докмейстер",fem:0,hero:0,build:0.948,hs:1.05,jaw:0.944,brow:0.75,chin:1.0,nose:0.111,lip:0.25,style:2,beard:1,skin:5,hair:6,eye:3,age:0.72,w:0.271,h:0.366,jac:[132,128,118]},
 {id:33,st:"yard",role:"keep",name:"Борис",job:"сборщик",fem:0,hero:0,build:1.113,hs:1.08,jaw:0.55,brow:0.9,chin:0.7,nose:0.722,lip:0.0,style:6,beard:2,skin:2,hair:4,eye:2,age:0.81,w:0.22,h:0.337,jac:[58,74,66]},
 {id:34,st:"yard",role:"",name:"Даша",job:"сварщица",fem:1,hero:0,build:1.277,hs:0.9,jaw:0.634,brow:1.05,chin:1.05,nose:0.278,lip:0.812,style:0,beard:0,skin:5,hair:5,eye:1,age:0.9,w:0.271,h:0.309,jac:[64,82,74]},
 {id:35,st:"yard",role:"sci",name:"Кирилл",job:"конструктор",fem:0,hero:0,build:0.7,hs:0.93,jaw:0.719,brow:0.87,chin:0.75,nose:0.889,lip:0.562,style:1,beard:0,skin:8,hair:6,eye:0,age:0.18,w:0.22,h:0.28,jac:[168,176,186]},
 {id:36,st:"yard",role:"cmd",name:"Матвей",job:"инспектор",fem:0,hero:0,build:0.865,hs:0.96,jaw:0.803,brow:1.02,chin:1.1,nose:0.444,lip:0.312,style:2,beard:1,skin:1,hair:7,eye:5,age:0.27,w:0.271,h:0.366,jac:[48,54,62]},
 {id:37,st:"yard",role:"keep",name:"Роман",job:"моторист",fem:0,hero:0,build:1.03,hs:0.99,jaw:0.888,brow:0.84,chin:0.8,nose:0.0,lip:0.062,style:3,beard:2,skin:4,hair:8,eye:4,age:0.36,w:0.22,h:0.337,jac:[58,74,66]},
 {id:38,st:"yard",role:"",name:"Степан",job:"такелажник",fem:0,hero:0,build:1.195,hs:1.02,jaw:0.972,brow:0.99,chin:0.5,nose:0.611,lip:0.875,style:4,beard:3,skin:7,hair:9,eye:3,age:0.45,w:0.271,h:0.309,jac:[58,62,70]},
 {id:39,st:"yard",role:"clerk",name:"Соня",job:"снабженка",fem:1,hero:0,build:1.36,hs:1.05,jaw:0.578,brow:0.81,chin:0.85,nose:0.167,lip:0.625,style:1,beard:0,skin:6,hair:0,eye:2,age:0.54,w:0.22,h:0.28,jac:[132,128,118]},
 {id:40,st:"yard",role:"",name:"Фёдор",job:"пилот буксира",fem:0,hero:0,build:0.782,hs:1.08,jaw:0.663,brow:0.96,chin:0.55,nose:0.778,lip:0.375,style:6,beard:1,skin:3,hair:1,eye:1,age:0.63,w:0.271,h:0.366,jac:[86,70,78]},
 {id:41,st:"yard",role:"sci",name:"Лиза",job:"чертёжница",fem:1,hero:0,build:0.948,hs:0.9,jaw:0.747,brow:0.78,chin:0.9,nose:0.333,lip:0.125,style:0,beard:0,skin:6,hair:2,eye:0,age:0.72,w:0.22,h:0.337,jac:[168,176,186]},
 {id:42,st:"yard",role:"keep",name:"Юлиан",job:"корпусник",fem:0,hero:0,build:1.113,hs:0.93,jaw:0.831,brow:0.93,chin:0.6,nose:0.944,lip:0.938,style:1,beard:3,skin:9,hair:3,eye:5,age:0.81,w:0.271,h:0.309,jac:[58,74,66]},
 {id:43,st:"yard",role:"",name:"Артём",job:"маляр",fem:0,hero:0,build:1.277,hs:0.96,jaw:0.916,brow:0.75,chin:0.95,nose:0.5,lip:0.688,style:2,beard:0,skin:2,hair:4,eye:4,age:0.9,w:0.22,h:0.28,jac:[96,80,64]},
 {id:44,st:"yard",role:"cmd",name:"Никита",job:"приёмщик",fem:0,hero:0,build:0.7,hs:0.99,jaw:1.0,brow:0.9,chin:0.65,nose:0.056,lip:0.438,style:3,beard:1,skin:5,hair:5,eye:3,age:0.18,w:0.271,h:0.366,jac:[48,54,62]},
 {id:45,st:"yard",role:"",name:"Павел",job:"лебёдчик",fem:0,hero:0,build:0.865,hs:1.02,jaw:0.606,brow:1.05,chin:1.0,nose:0.667,lip:0.188,style:4,beard:2,skin:8,hair:6,eye:2,age:0.27,w:0.22,h:0.337,jac:[92,70,74]},
 {id:46,st:"sci",role:"sci",name:"Катя",job:"руководитель",fem:1,hero:0,build:1.03,hs:1.05,jaw:0.691,brow:0.87,chin:0.7,nose:0.222,lip:1.0,style:5,beard:0,skin:1,hair:7,eye:1,age:0.36,w:0.271,h:0.309,jac:[168,176,186]},
 {id:47,st:"sci",role:"sci",name:"Захар",job:"биолог",fem:0,hero:0,build:1.195,hs:1.08,jaw:0.775,brow:1.02,chin:1.05,nose:0.833,lip:0.75,style:6,beard:0,skin:4,hair:8,eye:0,age:0.45,w:0.22,h:0.28,jac:[168,176,186]},
 {id:48,st:"sci",role:"sci",name:"Надя",job:"геолог",fem:1,hero:0,build:1.36,hs:0.9,jaw:0.859,brow:0.84,chin:0.75,nose:0.389,lip:0.5,style:0,beard:0,skin:7,hair:9,eye:5,age:0.54,w:0.271,h:0.366,jac:[168,176,186]},
 {id:49,st:"sci",role:"clerk",name:"Макар",job:"лаборант",fem:0,hero:0,build:0.782,hs:0.93,jaw:0.944,brow:0.99,chin:1.1,nose:1.0,lip:0.25,style:3,beard:2,skin:3,hair:0,eye:4,age:0.63,w:0.22,h:0.337,jac:[132,128,118]},
 {id:50,st:"sci",role:"sci",name:"Всеволод",job:"ксенолог",fem:0,hero:0,build:0.948,hs:0.96,jaw:0.55,brow:0.81,chin:0.8,nose:0.556,lip:0.0,style:2,beard:3,skin:3,hair:1,eye:3,age:0.72,w:0.271,h:0.309,jac:[168,176,186]},
 {id:51,st:"sci",role:"keep",name:"Григорий",job:"приборист",fem:0,hero:0,build:1.113,hs:0.99,jaw:0.634,brow:0.96,chin:0.5,nose:0.111,lip:0.812,style:3,beard:0,skin:6,hair:2,eye:2,age:0.81,w:0.22,h:0.28,jac:[58,74,66]},
 {id:52,st:"sci",role:"clerk",name:"Юля",job:"архивариус",fem:1,hero:0,build:1.277,hs:1.02,jaw:0.719,brow:0.78,chin:0.85,nose:0.722,lip:0.562,style:2,beard:0,skin:7,hair:6,eye:1,age:0.9,w:0.271,h:0.366,jac:[132,128,118]},
 {id:53,st:"sci",role:"sci",name:"Аня",job:"аналитик",fem:1,hero:0,build:0.7,hs:1.05,jaw:0.803,brow:0.93,chin:0.55,nose:0.278,lip:0.312,style:5,beard:0,skin:2,hair:4,eye:0,age:0.18,w:0.22,h:0.337,jac:[168,176,186]},
 {id:54,st:"sci",role:"",name:"Даниил",job:"препаратор",fem:0,hero:0,build:0.865,hs:1.08,jaw:0.888,brow:0.75,chin:0.9,nose:0.889,lip:0.062,style:6,beard:3,skin:5,hair:5,eye:5,age:0.27,w:0.271,h:0.309,jac:[64,82,74]},
 {id:55,st:"sci",role:"sci",name:"Елисей",job:"химик",fem:0,hero:0,build:1.03,hs:0.9,jaw:0.972,brow:0.9,chin:0.6,nose:0.444,lip:0.875,style:0,beard:0,skin:8,hair:6,eye:4,age:0.36,w:0.22,h:0.28,jac:[168,176,186]},
 {id:56,st:"sci",role:"clerk",name:"Ира",job:"секретарь",fem:1,hero:0,build:1.195,hs:0.93,jaw:0.578,brow:1.05,chin:0.95,nose:0.0,lip:0.625,style:2,beard:0,skin:5,hair:2,eye:3,age:0.45,w:0.271,h:0.366,jac:[132,128,118]},
 {id:57,st:"sci",role:"keep",name:"Игнат",job:"стеклодув",fem:0,hero:0,build:1.36,hs:0.96,jaw:0.663,brow:0.87,chin:0.65,nose:0.611,lip:0.375,style:2,beard:2,skin:4,hair:8,eye:2,age:0.54,w:0.22,h:0.337,jac:[58,74,66]},
 {id:58,st:"sci",role:"sci",name:"Галя",job:"астроном",fem:1,hero:0,build:0.782,hs:0.99,jaw:0.747,brow:1.02,chin:1.0,nose:0.167,lip:0.125,style:3,beard:0,skin:7,hair:9,eye:1,age:0.63,w:0.271,h:0.309,jac:[168,176,186]},
 {id:59,st:"sci",role:"",name:"Климент",job:"курьер проб",fem:0,hero:0,build:0.948,hs:1.02,jaw:0.831,brow:0.84,chin:0.7,nose:0.778,lip:0.938,style:4,beard:0,skin:0,hair:0,eye:0,age:0.72,w:0.22,h:0.28,jac:[120,96,72]},
 {id:60,st:"outpost",role:"cmd",name:"Лавр",job:"дежурный",fem:0,hero:0,build:1.113,hs:1.05,jaw:0.916,brow:0.99,chin:1.05,nose:0.333,lip:0.688,style:5,beard:1,skin:3,hair:1,eye:5,age:0.81,w:0.271,h:0.366,jac:[48,54,62]},
 {id:61,st:"outpost",role:"keep",name:"Нестор",job:"радист",fem:0,hero:0,build:1.277,hs:1.08,jaw:1.0,brow:0.81,chin:0.75,nose:0.944,lip:0.438,style:6,beard:2,skin:6,hair:2,eye:4,age:0.9,w:0.22,h:0.337,jac:[58,74,66]},
 {id:62,st:"outpost",role:"cmd",name:"Тома",job:"патрульная",fem:1,hero:0,build:0.7,hs:0.9,jaw:0.606,brow:0.96,chin:1.1,nose:0.5,lip:0.188,style:0,beard:0,skin:9,hair:3,eye:3,age:0.18,w:0.271,h:0.309,jac:[48,54,62]},
 {id:63,st:"outpost",role:"",name:"Платон",job:"разведчик",fem:0,hero:0,build:0.865,hs:0.93,jaw:0.691,brow:0.78,chin:0.8,nose:0.056,lip:1.0,style:1,beard:0,skin:2,hair:4,eye:2,age:0.27,w:0.22,h:0.28,jac:[96,80,64]},
 {id:64,st:"outpost",role:"clerk",name:"Савелий",job:"писарь",fem:0,hero:0,build:1.03,hs:0.96,jaw:0.775,brow:0.93,chin:0.5,nose:0.667,lip:0.75,style:2,beard:1,skin:7,hair:0,eye:1,age:0.36,w:0.271,h:0.366,jac:[132,128,118]},
 {id:65,st:"outpost",role:"keep",name:"Рита",job:"связистка",fem:1,hero:0,build:1.195,hs:0.99,jaw:0.859,brow:0.75,chin:0.85,nose:0.222,lip:0.5,style:3,beard:0,skin:8,hair:6,eye:0,age:0.45,w:0.22,h:0.337,jac:[58,74,66]},
 {id:66,st:"outpost",role:"",name:"Тит",job:"ремонтник",fem:0,hero:0,build:1.36,hs:1.02,jaw:0.944,brow:0.9,chin:0.55,nose:0.833,lip:0.25,style:4,beard:3,skin:1,hair:7,eye:5,age:0.54,w:0.271,h:0.309,jac:[70,74,90]},
 {id:67,st:"outpost",role:"cmd",name:"Устин",job:"офицер",fem:0,hero:0,build:0.782,hs:1.05,jaw:0.55,brow:1.05,chin:0.9,nose:0.389,lip:0.0,style:5,beard:0,skin:4,hair:8,eye:4,age:0.63,w:0.22,h:0.28,jac:[48,54,62]},
 {id:68,st:"outpost",role:"",name:"Женя",job:"пилот",fem:1,hero:0,build:0.948,hs:1.08,jaw:0.634,brow:0.87,chin:0.6,nose:1.0,lip:0.812,style:6,beard:0,skin:7,hair:9,eye:3,age:0.72,w:0.271,h:0.366,jac:[58,62,70]},
 {id:69,st:"outpost",role:"clerk",name:"Харитон",job:"снабженец",fem:0,hero:0,build:1.113,hs:0.9,jaw:0.719,brow:1.02,chin:0.95,nose:0.556,lip:0.562,style:3,beard:2,skin:6,hair:0,eye:2,age:0.81,w:0.22,h:0.337,jac:[132,128,118]},
 {id:70,st:"outpost",role:"keep",name:"Эраст",job:"оружейник",fem:0,hero:0,build:1.277,hs:0.93,jaw:0.803,brow:0.84,chin:0.65,nose:0.111,lip:0.312,style:1,beard:3,skin:3,hair:1,eye:1,age:0.9,w:0.271,h:0.309,jac:[58,74,66]},
 {id:71,st:"outpost",role:"",name:"Юстин",job:"часовой",fem:0,hero:0,build:0.7,hs:0.96,jaw:0.888,brow:0.99,chin:1.0,nose:0.722,lip:0.062,style:2,beard:0,skin:6,hair:2,eye:0,age:0.18,w:0.22,h:0.28,jac:[72,68,60]},
 {id:72,st:"fuel",role:"clerk",name:"Света",job:"оператор",fem:1,hero:0,build:0.865,hs:0.99,jaw:0.972,brow:0.81,chin:0.7,nose:0.278,lip:0.875,style:2,beard:0,skin:2,hair:6,eye:5,age:0.27,w:0.271,h:0.366,jac:[132,128,118]},
 {id:73,st:"fuel",role:"keep",name:"Ян",job:"техник",fem:0,hero:0,build:1.03,hs:1.02,jaw:0.578,brow:0.96,chin:1.05,nose:0.889,lip:0.625,style:4,beard:2,skin:2,hair:4,eye:4,age:0.36,w:0.22,h:0.337,jac:[58,74,66]},
 {id:74,st:"fuel",role:"",name:"Олег",job:"заправщик",fem:0,hero:0,build:1.195,hs:1.05,jaw:0.663,brow:0.78,chin:0.75,nose:0.444,lip:0.375,style:5,beard:3,skin:5,hair:5,eye:3,age:0.45,w:0.271,h:0.309,jac:[64,82,74]},
 {id:75,st:"fuel",role:"",name:"Влас",job:"механик",fem:0,hero:0,build:1.36,hs:1.08,jaw:0.747,brow:0.93,chin:1.1,nose:0.0,lip:0.125,style:6,beard:0,skin:8,hair:6,eye:2,age:0.54,w:0.22,h:0.28,jac:[92,70,74]},
 {id:76,st:"fuel",role:"clerk",name:"Герман",job:"диспетчер",fem:0,hero:0,build:0.782,hs:0.9,jaw:0.831,brow:0.75,chin:0.8,nose:0.611,lip:0.938,style:2,beard:1,skin:7,hair:2,eye:1,age:0.63,w:0.271,h:0.366,jac:[132,128,118]},
 {id:77,st:"fuel",role:"keep",name:"Денис",job:"шланг",fem:0,hero:0,build:0.948,hs:0.93,jaw:0.916,brow:0.9,chin:0.5,nose:0.167,lip:0.688,style:1,beard:2,skin:4,hair:8,eye:0,age:0.72,w:0.22,h:0.337,jac:[58,74,66]},
 {id:78,st:"fuel",role:"",name:"Лена",job:"буксир",fem:1,hero:0,build:1.113,hs:0.96,jaw:1.0,brow:1.05,chin:0.85,nose:0.778,lip:0.438,style:2,beard:0,skin:7,hair:9,eye:5,age:0.81,w:0.271,h:0.309,jac:[58,62,70]},
 {id:79,st:"fuel",role:"",name:"Ермолай",job:"курьер",fem:0,hero:0,build:1.277,hs:0.99,jaw:0.606,brow:0.87,chin:0.55,nose:0.333,lip:0.188,style:3,beard:0,skin:0,hair:0,eye:4,age:0.9,w:0.22,h:0.28,jac:[120,96,72]},
 {id:80,st:"fuel",role:"keep",name:"Зиновий",job:"резервуар",fem:0,hero:0,build:0.7,hs:1.02,jaw:0.691,brow:1.02,chin:0.9,nose:0.944,lip:1.0,style:4,beard:1,skin:3,hair:1,eye:3,age:0.18,w:0.271,h:0.366,jac:[58,74,66]},
 {id:81,st:"fuel",role:"",name:"Касьян",job:"водитель",fem:0,hero:0,build:0.865,hs:1.05,jaw:0.775,brow:0.84,chin:0.6,nose:0.5,lip:0.75,style:5,beard:2,skin:6,hair:2,eye:2,age:0.27,w:0.22,h:0.337,jac:[72,68,60]},
 {id:82,st:"bazaar",role:"fact",name:"Таня",job:"лоточница",fem:1,hero:0,build:1.03,hs:1.08,jaw:0.859,brow:0.99,chin:0.95,nose:0.056,lip:0.5,style:6,beard:0,skin:9,hair:3,eye:1,age:0.36,w:0.271,h:0.309,jac:[118,62,46]},
 {id:83,st:"bazaar",role:"fact",name:"Лука",job:"скупщик",fem:0,hero:0,build:1.195,hs:0.9,jaw:0.944,brow:0.81,chin:0.65,nose:0.667,lip:0.25,style:0,beard:0,skin:2,hair:4,eye:0,age:0.45,w:0.22,h:0.28,jac:[118,62,46]},
 {id:84,st:"bazaar",role:"",name:"Михей",job:"ремонтник",fem:0,hero:0,build:1.36,hs:0.93,jaw:0.55,brow:0.96,chin:1.0,nose:0.222,lip:0.0,style:1,beard:1,skin:5,hair:5,eye:5,age:0.54,w:0.271,h:0.366,jac:[64,82,74]},
 {id:85,st:"bazaar",role:"fact",name:"Никон",job:"коллекционер",fem:0,hero:0,build:0.782,hs:0.96,jaw:0.634,brow:0.78,chin:0.7,nose:0.833,lip:0.812,style:2,beard:2,skin:8,hair:6,eye:4,age:0.63,w:0.22,h:0.337,jac:[118,62,46]},
 {id:86,st:"bazaar",role:"",name:"Нюра",job:"путешественница",fem:1,hero:0,build:0.948,hs:0.99,jaw:0.719,brow:0.93,chin:1.05,nose:0.389,lip:0.562,style:3,beard:0,skin:1,hair:7,eye:3,age:0.72,w:0.271,h:0.309,jac:[70,74,90]},
 {id:87,st:"bazaar",role:"clerk",name:"Онуфрий",job:"кассир",fem:0,hero:0,build:1.113,hs:1.02,jaw:0.803,brow:0.75,chin:0.75,nose:1.0,lip:0.312,style:1,beard:0,skin:6,hair:6,eye:2,age:0.81,w:0.22,h:0.28,jac:[132,128,118]},
 {id:88,st:"bazaar",role:"fact",name:"Потап",job:"старьёвщик",fem:0,hero:0,build:1.277,hs:1.05,jaw:0.888,brow:0.9,chin:1.1,nose:0.556,lip:0.062,style:5,beard:1,skin:7,hair:9,eye:1,age:0.9,w:0.271,h:0.366,jac:[118,62,46]},
 {id:89,st:"bazaar",role:"",name:"Радий",job:"покупатель",fem:0,hero:0,build:0.7,hs:1.08,jaw:0.972,brow:1.05,chin:0.8,nose:0.111,lip:0.875,style:6,beard:2,skin:0,hair:0,eye:0,age:0.18,w:0.22,h:0.337,jac:[120,96,72]},
 {id:90,st:"bazaar",role:"fact",name:"Феня",job:"антиквар",fem:1,hero:0,build:0.865,hs:0.9,jaw:0.578,brow:0.87,chin:0.5,nose:0.722,lip:0.625,style:0,beard:0,skin:3,hair:1,eye:5,age:0.27,w:0.271,h:0.309,jac:[118,62,46]},
 {id:91,st:"bazaar",role:"keep",name:"Сева",job:"часовщик",fem:0,hero:0,build:1.03,hs:0.93,jaw:0.663,brow:1.02,chin:0.85,nose:0.278,lip:0.375,style:1,beard:0,skin:6,hair:2,eye:4,age:0.36,w:0.22,h:0.28,jac:[58,74,66]},
 {id:92,st:"bazaar",role:"",name:"Трофим",job:"портной",fem:0,hero:0,build:1.195,hs:0.96,jaw:0.747,brow:0.84,chin:0.55,nose:0.889,lip:0.125,style:2,beard:1,skin:9,hair:3,eye:3,age:0.45,w:0.271,h:0.366,jac:[78,84,96]},
 {id:93,st:"bazaar",role:"fact",name:"Ульян",job:"меняла",fem:0,hero:0,build:1.36,hs:0.99,jaw:0.831,brow:0.99,chin:0.9,nose:0.444,lip:0.938,style:3,beard:2,skin:2,hair:4,eye:2,age:0.54,w:0.22,h:0.337,jac:[118,62,46]},
 {id:94,st:"bazaar",role:"",name:"Филипп",job:"бродяга",fem:0,hero:0,build:0.782,hs:1.02,jaw:0.916,brow:0.81,chin:0.6,nose:0.0,lip:0.688,style:4,beard:3,skin:5,hair:5,eye:1,age:0.63,w:0.271,h:0.309,jac:[64,82,74]},
 {id:95,st:"bazaar",role:"clerk",name:"Дуня",job:"писарь",fem:1,hero:0,build:0.948,hs:1.05,jaw:1.0,brow:0.96,chin:0.95,nose:0.611,lip:0.438,style:1,beard:0,skin:1,hair:1,eye:0,age:0.72,w:0.22,h:0.28,jac:[132,128,118]},
 {id:96,st:"bazaar",role:"fact",name:"Эмиль",job:"барышник",fem:0,hero:0,build:1.113,hs:1.08,jaw:0.606,brow:0.78,chin:0.65,nose:0.167,lip:0.188,style:6,beard:1,skin:1,hair:7,eye:5,age:0.81,w:0.271,h:0.366,jac:[118,62,46]},
 {id:97,st:"bazaar",role:"",name:"Шура",job:"музыкант",fem:1,hero:0,build:1.277,hs:0.9,jaw:0.691,brow:0.93,chin:1.0,nose:0.778,lip:1.0,style:0,beard:0,skin:4,hair:8,eye:4,age:0.9,w:0.22,h:0.337,jac:[104,96,80]},
 {id:98,st:"bazaar",role:"fact",name:"Юрий",job:"оценщик",fem:0,hero:0,build:0.7,hs:0.93,jaw:0.775,brow:0.75,chin:0.7,nose:0.333,lip:0.75,style:1,beard:3,skin:7,hair:9,eye:3,age:0.18,w:0.271,h:0.309,jac:[118,62,46]},
 {id:99,st:"bazaar",role:"keep",name:"Аким",job:"жестянщик",fem:0,hero:0,build:0.865,hs:0.96,jaw:0.859,brow:0.9,chin:1.05,nose:0.944,lip:0.5,style:2,beard:0,skin:0,hair:0,eye:2,age:0.27,w:0.22,h:0.28,jac:[58,74,66]},
 {id:100,st:"bazaar",role:"",name:"Богдан",job:"гость",fem:0,hero:0,build:1.03,hs:0.99,jaw:0.944,brow:1.05,chin:0.75,nose:0.5,lip:0.25,style:3,beard:1,skin:3,hair:1,eye:1,age:0.36,w:0.271,h:0.366,jac:[86,70,78]},
];
const NPC_BY={};for(const p of NPC_LIB)NPC_BY[p.id]=p;
const NPC_OF={};for(const p of NPC_LIB){if(p.hero)continue;(NPC_OF[p.st]||(NPC_OF[p.st]=[])).push(p);}
function npcApply(g,id){
  const p=NPC_BY[id];if(!p)return;
  g.build=p.build;g.hs=p.hs;g.jaw=p.jaw;g.brow=p.brow;g.chin=p.chin;g.nose=p.nose;g.lip=p.lip;
  g.style=p.style;g.beard=p.fem?0:p.beard;g.fem=p.fem;g.age=p.age;g.w=p.w;g.h=p.h;
  g.skin=hex2rgb(FACE_SKIN[p.skin]);g.hair=hex2rgb(FACE_HAIR[p.hair]);g.eye=hex2rgb(FACE_EYE[p.eye]);
}
/* слот зала: тот же salt и слот — тот же человек. want — роль (клерк стойки). used не отдаёт человека дважды. */
function npcTake(st,salt,slot,used,want){
  const pool=NPC_OF[st]||NPC_OF.trade;if(!pool||!pool.length)return null;
  const n=pool.length;
  const start=(hashi(salt>>>0,slot,1)>>>0)%n;
  for(let k=0;k<n;k++){
    const p=pool[(start+k)%n];
    if(p.hero||used[p.id])continue;
    if(want&&p.role!==want)continue;
    used[p.id]=1;
    return {seed:(0x51A70000+p.id)>>>0,npc:p.id,role:p.role,style:p.style,jac:p.jac.slice(),loy:50,traits:[],age:p.age};
  }
  return null;
}
