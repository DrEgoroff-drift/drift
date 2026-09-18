/* ══════════════ дипломатический паспорт (M505, PLAN «new mechanics», st. 5) ══════════════
   Все шесть пограничных отметок и отметка Ялты в КНИЖКЕ — и замполит выдаёт
   паспорт: неделю (семь смен) дороги всех шести держав возят даром, а форма
   Орднунга задаёт на один вопрос меньше — декларация без второго нажатия.
   Паспорт выдаётся один раз (R.pass = {at, until}). */
const PASSPORT_KEYS=["gt","co","or","km","ra","hf","yalta"],PASSPORT_LIFE=7;
function passportDue(){
  const R=(typeof stampBook==="function")?stampBook():null;
  return !!(R&&!R.pass&&PASSPORT_KEYS.every(k=>R.st[k]));
}
function passportOn(){const R=(typeof recordAll==="function")?recordAll():null;return !!(R&&R.pass&&now()<R.pass.until);}
function passportIssue(){
  if(!passportDue())return false;
  const R=stampBook();R.pass={at:celDay(),until:now()+PASSPORT_LIFE*HOLD_SHIFT};
  if(typeof recordAdd==="function")recordAdd("замполит","выдан дипломатический паспорт: все шесть держав и Ялта отмечены. Годен на неделю.");
  logAdd("good","Дипломатический паспорт · неделю дороги даром · Орднунг спрашивает на вопрос меньше");
  if(typeof say==="function")say("Дипломатический паспорт\nзамполит: «Вы у нас теперь человек мира»",220);
  return true;
}
