/**
 * ③ 年休5日 — 達成列の再計算（たたき台）
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('ロジつく労務').addItem('5日達成を再計算', 'recalcPaidLeave').addToUi();
}

function recalcPaidLeave() {
  const sh = SpreadsheetApp.getActive().getSheetByName('年休管理');
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    const got = Number(vals[i][4]);
    const grant = Number(vals[i][3]);
    vals[i][6] = got >= 5 ? '達成' : '未達成';
    vals[i][7] = grant - got;
  }
  sh.getDataRange().setValues(vals);
}
