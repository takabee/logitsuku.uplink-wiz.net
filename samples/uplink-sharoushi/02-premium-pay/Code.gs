/**
 * ② 割増検算（たたき台）
 * 入力_勤怠内訳 × マスタ_単価 で概算し、ソフト支給額との差を出す
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('ロジつく労務').addItem('割増を検算', 'runPremiumCheck').addToUi();
}

function runPremiumCheck() {
  const ss = SpreadsheetApp.getActive();
  const master = Object.fromEntries(
    ss.getSheetByName('マスタ_単価').getDataRange().getValues().slice(1).map(function (r) { return [r[0], Number(r[1])]; })
  );
  const base = master['基礎単価(円)'] || 0;
  const sh = ss.getSheetByName('入力_勤怠内訳');
  const vals = sh.getDataRange().getValues();
  const out = [['従業員ID', '氏名', '対象月', '検算額', 'ソフト支給額', '差額']];
  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    const calc =
      Number(r[3]) * base +
      Number(r[4]) * base * (master['法定外割増'] || 1.25) +
      Number(r[5]) * base * (master['60h超割増'] || 1.5) +
      Number(r[6]) * base * (master['休日割増'] || 1.35) +
      Number(r[7]) * base * (master['深夜割増'] || 0.25);
    const soft = Number(r[8]);
    out.push([r[0], r[1], r[2], Math.round(calc), soft, Math.round(calc - soft)]);
  }
  let res = ss.getSheetByName('検算結果');
  if (!res) res = ss.insertSheet('検算結果');
  res.clear();
  res.getRange(1, 1, out.length, out[0].length).setValues(out);
}
