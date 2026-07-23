/**
 * アップリンク社労士事務所サンプル ①残業上限（36系）
 * - シートメニュー / WebアプリUI 両対応
 * 判定: 単月100h / 45h超過回数(>6) / 複数月平均80h(2-6ヶ月) / 年720h（年度=4月始まり）
 */

// このスクリプトが紐づくデモシート（Webアプリ実行時用）
var DEMO_SPREADSHEET_ID = '1fJcWExPd439VXQNGEl1PQREXcxmfHXRv3O7QpmOZ3ag';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ロジつく労務')
    .addItem('画面を開く', 'openUiDialog')
    .addItem('デモデータを投入して判定', 'setupDemoAndRun')
    .addItem('上限チェックを実行', 'runOvertimeCheck')
    .addToUi();
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('残業上限チェック | アップリンク社労士事務所')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function openUiDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Index')
    .setWidth(960)
    .setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, '残業上限チェック');
}

function getSs_() {
  try {
    const active = SpreadsheetApp.getActive();
    if (active) return active;
  } catch (e) {
    // web app
  }
  return SpreadsheetApp.openById(DEMO_SPREADSHEET_ID);
}

/** UI用: 現状サマリ */
function apiGetMeta() {
  const ss = getSs_();
  const sh = ss.getSheetByName('勤怠_残業');
  const rows = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  return {
    office: 'アップリンク社労士事務所',
    client: '株式会社サンプル製造',
    sheetUrl: ss.getUrl(),
    inputRows: rows,
    updatedAt: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm')
  };
}

/** UI用: デモ投入＋判定 */
function apiSetupDemoAndCheck() {
  seedDemoData_();
  return apiRunCheck();
}

/** UI用: 判定のみ */
function apiRunCheck() {
  const packed = runCheckCore_();
  if (packed.error) return packed;
  writeResults_(getSs_(), packed.results);
  return packed;
}

/** UI用: CSV文字列を勤怠シートへ書き込み → 判定 */
function apiImportCsvAndCheck(csvText) {
  const parsed = parseCsvText_(csvText);
  if (parsed.error) return { error: parsed.error, results: [], recordCount: 0 };
  writeInputFromMatrix_(parsed.matrix);
  return apiRunCheck();
}

/** UI用: テンプレCSV（BOM付き想定はクライアント側でも可） */
function apiGetTemplateCsv() {
  return [
    '従業員ID,氏名,年月,残業時間（h）',
    'E001,山田 太郎,2025/04,38',
    'E001,山田 太郎,2025/05,52',
    'E002,佐藤 花子,2025/04,10',
    'E003,鈴木 一郎,2025/06,102'
  ].join('\n');
}

function parseCsvText_(csvText) {
  if (!csvText || !String(csvText).trim()) {
    return { error: 'CSVが空です。' };
  }
  const text = String(csvText).replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
  if (lines.length < 2) return { error: 'ヘッダとデータ行が必要です。' };

  const matrix = lines.map(function (line) {
    return splitCsvLine_(line);
  });
  const header = matrix[0].map(function (h) { return String(h).trim(); });
  const ymIdx = findHeader_(header, ['年月', '対象月', '月']);
  const otIdx = findHeader_(header, ['残業時間（h）', '残業時間(h)', '残業時間', '残業h']);
  if (ymIdx < 0 || otIdx < 0) {
    return { error: '必要な列がありません（年月 / 残業時間（h））。テンプレをダウンロードして列名を合わせてください。' };
  }
  return { matrix: matrix };
}

function splitCsvLine_(line) {
  const out = [];
  var cur = '';
  var inQ = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    if (ch === '"') {
      if (inQ && line.charAt(i + 1) === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function writeInputFromMatrix_(matrix) {
  const ss = getSs_();
  let sh = ss.getSheetByName('勤怠_残業');
  if (!sh) sh = ss.insertSheet('勤怠_残業');
  sh.clear();
  const rows = matrix.length;
  const cols = matrix[0].length;
  sh.getRange(1, 1, rows, cols).setNumberFormat('@');
  sh.getRange(1, 1, rows, cols).setValues(matrix);
  // 残業列が数値なら数値書式（ヘッダ名から推定）
  const header = matrix[0].map(function (h) { return String(h).trim(); });
  const otIdx = findHeader_(header, ['残業時間（h）', '残業時間(h)', '残業時間', '残業h']);
  if (otIdx >= 0 && rows > 1) {
    sh.getRange(2, otIdx + 1, rows - 1, 1).setNumberFormat('0.##');
  }
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, cols);
}

/** デモ用: サンプル勤怠を書き込み → 判定まで（シートメニュー） */
function setupDemoAndRun() {
  seedDemoData_();
  runOvertimeCheck();
}

function seedDemoData_() {
  const ss = getSs_();
  let sh = ss.getSheetByName('勤怠_残業');
  if (!sh) sh = ss.insertSheet('勤怠_残業');
  const rows = [
    ['従業員ID', '氏名', '年月', '残業時間（h）'],
    ['E001', '山田 太郎', '2025/04', 38],
    ['E001', '山田 太郎', '2025/05', 52],
    ['E001', '山田 太郎', '2025/06', 61],
    ['E001', '山田 太郎', '2025/07', 48],
    ['E001', '山田 太郎', '2025/08', 55],
    ['E001', '山田 太郎', '2025/09', 70],
    ['E001', '山田 太郎', '2025/10', 66],
    ['E001', '山田 太郎', '2025/11', 58],
    ['E001', '山田 太郎', '2025/12', 45],
    ['E001', '山田 太郎', '2026/01', 40],
    ['E001', '山田 太郎', '2026/02', 36],
    ['E001', '山田 太郎', '2026/03', 30],
    ['E002', '佐藤 花子', '2025/04', 10],
    ['E002', '佐藤 花子', '2025/05', 12],
    ['E002', '佐藤 花子', '2025/06', 8],
    ['E002', '佐藤 花子', '2025/07', 15],
    ['E002', '佐藤 花子', '2025/08', 20],
    ['E002', '佐藤 花子', '2025/09', 18],
    ['E002', '佐藤 花子', '2025/10', 22],
    ['E002', '佐藤 花子', '2025/11', 16],
    ['E002', '佐藤 花子', '2025/12', 12],
    ['E002', '佐藤 花子', '2026/01', 10],
    ['E002', '佐藤 花子', '2026/02', 9],
    ['E002', '佐藤 花子', '2026/03', 11],
    ['E003', '鈴木 一郎', '2025/04', 90],
    ['E003', '鈴木 一郎', '2025/05', 95],
    ['E003', '鈴木 一郎', '2025/06', 102],
    ['E003', '鈴木 一郎', '2025/07', 88],
    ['E003', '鈴木 一郎', '2025/08', 92],
    ['E003', '鈴木 一郎', '2025/09', 85],
    ['E003', '鈴木 一郎', '2025/10', 78],
    ['E003', '鈴木 一郎', '2025/11', 70],
    ['E003', '鈴木 一郎', '2025/12', 60],
    ['E003', '鈴木 一郎', '2026/01', 55],
    ['E003', '鈴木 一郎', '2026/02', 50],
    ['E003', '鈴木 一郎', '2026/03', 48]
  ];
  sh.clear();
  sh.getRange(1, 1, rows.length, 4).setNumberFormat('@');
  sh.getRange(1, 1, rows.length, 4).setValues(rows);
  sh.getRange(2, 4, rows.length - 1, 1).setNumberFormat('0.##');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, 4);

  const legacy = ss.getSheetByName('シート1');
  if (legacy && ss.getSheets().length > 1) {
    ss.deleteSheet(legacy);
  }
}

function runOvertimeCheck() {
  const packed = runCheckCore_();
  if (packed.error) {
    SpreadsheetApp.getUi().alert(packed.error);
    writeResults_(getSs_(), []);
    return;
  }
  writeResults_(getSs_(), packed.results);
  let msg = '判定完了: ' + packed.results.length + ' 行（従業員×年度） / 読取 ' + packed.recordCount + ' 件';
  if (packed.skipped && packed.skipped.length) {
    msg += '\nスキップ行: ' + packed.skipped.slice(0, 10).join(', ') + (packed.skipped.length > 10 ? '…' : '');
  }
  SpreadsheetApp.getUi().alert(msg);
}

function runCheckCore_() {
  const ss = getSs_();
  const sh = ss.getSheetByName('勤怠_残業');
  if (!sh) {
    return { error: '「勤怠_残業」シートがありません。', results: [], recordCount: 0 };
  }

  const values = sh.getDataRange().getValues();
  if (values.length < 2) {
    return { error: 'データ行がありません。', results: [], recordCount: 0 };
  }

  const header = values[0].map(function (h) { return String(h).trim(); });
  const idx = {
    id: findHeader_(header, ['従業員ID', '社員ID', 'ID']),
    name: findHeader_(header, ['氏名', '名前']),
    ym: findHeader_(header, ['年月', '対象月', '月']),
    ot: findHeader_(header, ['残業時間（h）', '残業時間(h)', '残業時間', '残業h'])
  };
  if (idx.ym < 0 || idx.ot < 0) {
    return { error: '必要な列が見つかりません。見出し: ' + header.join(', '), results: [], recordCount: 0 };
  }

  const records = [];
  const skipped = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const parts = cellToYm_(row[idx.ym]);
    const ot = Number(row[idx.ot]);
    if (!parts || isNaN(ot)) {
      skipped.push(r + 1);
      continue;
    }
    let id = idx.id >= 0 ? String(row[idx.id] || '').trim() : '';
    const name = idx.name >= 0 ? String(row[idx.name] || '').trim() : '';
    if (!id) id = name || ('ROW' + (r + 1));
    records.push({
      id: id,
      name: name,
      ym: parts.y + '/' + (parts.m < 10 ? '0' + parts.m : parts.m),
      ot: ot
    });
  }

  if (!records.length) {
    return {
      error: '有効なデータ行を読めませんでした。メニュー「デモデータを投入して判定」を再実行してください。',
      results: [],
      recordCount: 0,
      skipped: skipped
    };
  }

  const results = checkViolations_(records);
  const ng = results.filter(function (r) { return r.violations.length > 0; }).length;
  return {
    results: results,
    recordCount: records.length,
    skipped: skipped,
    summary: {
      total: results.length,
      ng: ng,
      ok: results.length - ng
    }
  };
}

function findHeader_(header, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const idx = header.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }
  return -1;
}

function cellToYm_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    const s = Utilities.formatDate(value, 'Asia/Tokyo', 'yyyy/M');
    return normalizeYm_(s);
  }
  if (typeof value === 'number' && isFinite(value)) {
    const dt = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(dt.getTime())) return cellToYm_(dt);
  }
  return normalizeYm_(value);
}

function checkViolations_(records) {
  const emp = {};
  records.forEach(function (rec) {
    const parts = normalizeYm_(rec.ym);
    if (!parts) return;
    const y = parts.y;
    const m = parts.m;
    if (!emp[rec.id]) emp[rec.id] = { name: rec.name, months: {} };
    emp[rec.id].name = rec.name || emp[rec.id].name;
    emp[rec.id].months[y + '-' + m] = rec.ot;
  });

  const out = [];
  Object.keys(emp).sort().forEach(function (id) {
    const data = emp[id];
    const fys = {};
    Object.keys(data.months).forEach(function (key) {
      const sp = key.split('-');
      const y = Number(sp[0]);
      const m = Number(sp[1]);
      const fy = m >= 4 ? y : y - 1;
      if (!fys[fy]) fys[fy] = {};
      fys[fy][y + '-' + m] = data.months[key];
    });

    const full = {};
    Object.keys(data.months).forEach(function (k) {
      full[k] = data.months[k];
    });

    Object.keys(fys).map(Number).sort().forEach(function (fy) {
      const months = fyMonths_(fy);
      let total = 0;
      let over45 = 0;
      const violations = {};

      months.forEach(function (ym) {
        const key = ym.y + '-' + ym.m;
        const hours = full[key] != null ? Number(full[key]) : 0;
        total += hours;
        if (hours > 45) over45++;
        if (hours > 100) {
          violations['単月100h超過 (' + fmt_(ym.y, ym.m) + ': ' + hours + 'h)'] = true;
        }
        for (let w = 2; w <= 6; w++) {
          let sum = 0;
          for (let i = 0; i < w; i++) {
            const t = addMonths_(ym.y, ym.m, -i);
            const hk = t.y + '-' + t.m;
            sum += full[hk] != null ? Number(full[hk]) : 0;
          }
          const avg = sum / w;
          if (avg > 80) {
            violations['複数月平均80h超過 (' + w + 'ヶ月平均: ' + avg.toFixed(1) + 'h - ' + fmt_(ym.y, ym.m) + '時点)'] = true;
          }
        }
      });

      if (total > 720) violations['年間上限超過 (' + total.toFixed(1) + 'h)'] = true;
      if (over45 > 6) violations['45h超え回数違反 (' + over45 + '回)'] = true;

      out.push({
        id: id,
        name: data.name,
        fy: fy,
        total: Math.round(total * 100) / 100,
        over45: over45,
        violations: Object.keys(violations).sort()
      });
    });
  });
  return out;
}

function writeResults_(ss, results) {
  let sh = ss.getSheetByName('判定結果');
  if (!sh) sh = ss.insertSheet('判定結果');
  sh.clear();
  sh.getRange(1, 1, 1, 6).setValues([[
    '従業員ID', '氏名', '年度(4月始まり)', '年間残業h', '45h超過回数', '違反・注意'
  ]]);
  if (!results.length) return;
  const rows = results.map(function (r) {
    return [r.id, r.name, r.fy, r.total, r.over45, r.violations.join(' / ') || '問題なし'];
  });
  sh.getRange(2, 1, rows.length, 6).setValues(rows);
  sh.autoResizeColumns(1, 6);
}

function normalizeYm_(s) {
  const t = String(s).trim().replace(/-/g, '/');
  const p = t.split('/');
  if (p.length < 2) return null;
  const y = Number(p[0]);
  const m = Number(p[1]);
  if (!y || !m) return null;
  return { y: y, m: m };
}

function fyMonths_(fy) {
  const a = [];
  for (let m = 4; m <= 12; m++) a.push({ y: fy, m: m });
  for (let m = 1; m <= 3; m++) a.push({ y: fy + 1, m: m });
  return a;
}

function addMonths_(y, m, delta) {
  let mm = m + delta;
  let yy = y;
  while (mm < 1) { mm += 12; yy--; }
  while (mm > 12) { mm -= 12; yy++; }
  return { y: yy, m: mm };
}

function fmt_(y, m) {
  return y + '/' + (m < 10 ? '0' + m : m);
}
