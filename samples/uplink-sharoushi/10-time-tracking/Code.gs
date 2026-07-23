/**
 * ⑩ 打刻 vs 申告の差分フラグ更新（たたき台）
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('ロジつく労務').addItem('乖離フラグを更新', 'flagGaps').addToUi();
}

function flagGaps() {
  const sh = SpreadsheetApp.getActive().getSheetByName('把握_突合');
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    const diff = Math.abs(Number(vals[i][5]));
    vals[i][6] = diff >= 0.5 ? '要' : '不要';
  }
  sh.getDataRange().setValues(vals);
}
