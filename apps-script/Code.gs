/**
 * HQR — Quiniela 2026 — Backend en Google Apps Script.
 *
 * Maneja TODO el bracket del torneo (16avos → octavos → cuartos → semis →
 * 3er lugar → final). Los ganadores avanzan automáticamente a la siguiente
 * llave cuando el admin registra el resultado.
 *
 * CÓMO INSTALAR (ver README):
 *  1. Crea una Hoja de Google nueva.
 *  2. Extensiones → Apps Script. Pega este archivo.
 *  3. Pon tu CLIENT_ID y tus ADMIN_EMAILS abajo.
 *  4. Implementar → Nueva implementación → "Aplicación web":
 *       Ejecutar como: "Yo"  ·  Quién tiene acceso: "Cualquier persona".
 *  5. Copia la URL (/exec) y pégala en site/config.js.
 */

// ── Configuración ───────────────────────────────────────────────
var CLIENT_ID = 'PEGA_AQUI_TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
var ADMIN_EMAILS = ['ernesto@agency.lat'];
var TOURNAMENT_NAME = 'HQR — Quiniela 2026';

// Partidos de la primera ronda (16avos). El resto del bracket se llena solo.
var SEED_16 = [
  ['Sudáfrica', 'Canadá'], ['Brasil', 'Japón'], ['Alemania', 'Paraguay'],
  ['Países Bajos', 'Marruecos'], ['Costa de Marfil', 'Noruega'], ['Francia', 'Suecia'],
  ['México', 'Ecuador'], ['Inglaterra', 'Congo'], ['Estados Unidos', 'Bosnia'],
  ['Bélgica', 'Senegal'], ['España', 'Austria'], ['Portugal', 'Croacia'],
  ['Suiza', 'Argelia'], ['Australia', 'Egipto'], ['Argentina', 'Cabo Verde'],
  ['Colombia', 'Ghana']
];

// Etapas (orden de presentación) y a qué números de partido corresponden.
function STAGES() {
  return [
    { key: '16avos', label: '16avos de final', orders: range(1, 16) },
    { key: 'octavos', label: 'Octavos de final', orders: range(17, 24) },
    { key: 'cuartos', label: 'Cuartos de final', orders: range(25, 28) },
    { key: 'semis', label: 'Semifinales', orders: range(29, 30) },
    { key: 'tercer', label: 'Tercer lugar', orders: [32] },
    { key: 'final', label: 'Final', orders: [31] }
  ];
}
var TOTAL_MATCHES = 32;

// De dónde sale cada equipo de las rondas posteriores:
//   { A: {src, take}, B: {src, take} }  donde take = 'W' (ganador) o 'L' (perdedor)
function advanceMap() {
  var map = {};
  for (var j = 1; j <= 8; j++) map[16 + j] = { A: { src: 2 * j - 1, take: 'W' }, B: { src: 2 * j, take: 'W' } };
  for (var k = 1; k <= 4; k++) map[24 + k] = { A: { src: 16 + (2 * k - 1), take: 'W' }, B: { src: 16 + 2 * k, take: 'W' } };
  for (var s = 1; s <= 2; s++) map[28 + s] = { A: { src: 24 + (2 * s - 1), take: 'W' }, B: { src: 24 + 2 * s, take: 'W' } };
  map[31] = { A: { src: 29, take: 'W' }, B: { src: 30, take: 'W' } }; // final: ganadores de semis
  map[32] = { A: { src: 29, take: 'L' }, B: { src: 30, take: 'L' } }; // 3er lugar: perdedores de semis
  return map;
}

// ── Entrada HTTP ────────────────────────────────────────────────
function doGet() {
  return ContentService.createTextOutput(
    'Quiniela API en línea. Usa POST con { action, idToken }.'
  ).setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var out;
  try {
    out = route(JSON.parse(e.postData.contents || '{}'));
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function route(body) {
  var user = verifyToken(body.idToken);
  if (!user) return { ok: false, error: 'auth', needLogin: true };
  var isAdmin = ADMIN_EMAILS.map(lower).indexOf(lower(user.email)) >= 0;

  switch (body.action) {
    case 'state':
      return getState(user, isAdmin);
    case 'save':
      return savePredictions(user, body.predictions);
    case 'setResult':
      if (!isAdmin) return { ok: false, error: 'forbidden' };
      return setResult(body.order, body.result);
    case 'setStageOpen':
      if (!isAdmin) return { ok: false, error: 'forbidden' };
      return setStageOpen(body.stage, body.open);
    default:
      return { ok: false, error: 'unknown action' };
  }
}

// ── Verificación del token de Google ────────────────────────────
function verifyToken(idToken) {
  if (!idToken) return null;
  var resp = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) return null;
  var info = JSON.parse(resp.getContentText());
  if (info.aud !== CLIENT_ID) return null;
  if (String(info.email_verified) !== 'true') return null;
  if (Number(info.exp) * 1000 < Date.now()) return null;
  return { email: info.email, name: info.name || info.email, picture: info.picture || '' };
}

// ── Acciones ────────────────────────────────────────────────────
function getState(user, isAdmin) {
  var db = getDb();
  var byOrder = {};
  db.matches.forEach(function (m) { byOrder[m.order] = m; });

  var stages = STAGES().map(function (st) {
    return {
      key: st.key,
      label: st.label,
      isOpen: db.stageOpen[st.key] === true,
      matches: st.orders.map(function (o) {
        var m = byOrder[o] || { order: o, teamA: '', teamB: '', result: null };
        return { order: o, teamA: m.teamA, teamB: m.teamB, result: m.result };
      })
    };
  });

  return {
    ok: true,
    user: user,
    isAdmin: isAdmin,
    tournamentName: db.tournamentName,
    stages: stages,
    myPredictions: readUserPredictions(db, user.email),
    leaderboard: buildLeaderboard(db)
  };
}

function savePredictions(user, predictions) {
  predictions = predictions || {};
  var db = getDb();
  var stageByOrder = orderToStageKey();

  // Fila actual del usuario (o vacía).
  var sheet = db.predSheet;
  var rowIndex = findUserRow(sheet, user.email);
  var current = {};
  if (rowIndex > 0) current = readUserPredictions(db, user.email);

  // Aplica solo las opciones de etapas abiertas.
  Object.keys(predictions).forEach(function (o) {
    var key = stageByOrder[o];
    if (!key || db.stageOpen[key] !== true) return;
    var c = predictions[o];
    current[o] = VALID_CHOICES.indexOf(c) >= 0 ? c : '';
  });

  var rowArr = [user.email, user.name];
  for (var i = 1; i <= TOTAL_MATCHES; i++) rowArr.push(current[i] || '');

  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, rowArr.length).setValues([rowArr]);
  else sheet.appendRow(rowArr);
  return { ok: true };
}

function setResult(order, result) {
  order = Number(order);
  if (!(order >= 1 && order <= TOTAL_MATCHES)) return { ok: false, error: 'order' };
  if (VALID_RESULTS.indexOf(result) < 0) return { ok: false, error: 'result' };
  var sheet = sheetByName('Partidos');
  sheet.getRange(order + 1, 5).setValue(result === '' ? '' : result); // col 5 = result
  recomputeBracket();
  return { ok: true };
}

function setStageOpen(stage, open) {
  var keys = STAGES().map(function (s) { return s.key; });
  if (keys.indexOf(stage) < 0) return { ok: false, error: 'stage' };
  setConfig('open_' + stage, open ? 'TRUE' : 'FALSE');
  return { ok: true };
}

// Recalcula los equipos de octavos…final según los resultados registrados.
function recomputeBracket() {
  var sheet = sheetByName('Partidos');
  var data = sheet.getDataRange().getValues(); // [order, stage, teamA, teamB, result]
  var byOrder = {};
  for (var i = 1; i < data.length; i++) {
    byOrder[data[i][0]] = { teamA: data[i][2], teamB: data[i][3], result: data[i][4] || null };
  }
  var map = advanceMap();

  function teamFrom(spec) {
    var m = byOrder[spec.src];
    if (!m || !m.result) return '';
    var w = winnerOf(m.result);
    var winnerTeam = w === 'A' ? m.teamA : w === 'B' ? m.teamB : '';
    var loserTeam = w === 'A' ? m.teamB : w === 'B' ? m.teamA : '';
    return spec.take === 'W' ? winnerTeam : loserTeam;
  }

  for (var order = 17; order <= TOTAL_MATCHES; order++) {
    var spec = map[order];
    if (!spec) continue;
    var a = teamFrom(spec.A);
    var b = teamFrom(spec.B);
    var cur = byOrder[order];
    if (cur.teamA !== a) sheet.getRange(order + 1, 3).setValue(a);
    if (cur.teamB !== b) sheet.getRange(order + 1, 4).setValue(b);
    byOrder[order].teamA = a;
    byOrder[order].teamB = b;
  }
}

// ── Acceso a la hoja ────────────────────────────────────────────
var VALID_CHOICES = ['A', 'B', 'AP', 'BP'];
var VALID_RESULTS = ['A', 'B', 'AP', 'BP', ''];

function getDb() {
  ensureSheets();
  var rows = sheetByName('Partidos').getDataRange().getValues();
  var matches = [];
  for (var i = 1; i < rows.length; i++) {
    matches.push({
      order: Number(rows[i][0]),
      stage: rows[i][1],
      teamA: rows[i][2],
      teamB: rows[i][3],
      result: rows[i][4] || null
    });
  }
  var stageOpen = {};
  STAGES().forEach(function (s) {
    stageOpen[s.key] = String(getConfig('open_' + s.key)).toUpperCase() === 'TRUE';
  });
  return {
    tournamentName: getConfig('tournamentName') || TOURNAMENT_NAME,
    matches: matches,
    stageOpen: stageOpen,
    predSheet: sheetByName('Pronosticos')
  };
}

function readUserPredictions(db, email) {
  var sheet = db.predSheet;
  var rowIndex = findUserRow(sheet, email);
  var map = {};
  if (rowIndex > 0) {
    var vals = sheet.getRange(rowIndex, 1, 1, 2 + TOTAL_MATCHES).getValues()[0];
    for (var i = 1; i <= TOTAL_MATCHES; i++) {
      if (vals[1 + i]) map[i] = vals[1 + i];
    }
  }
  return map;
}

function buildLeaderboard(db) {
  var resultByOrder = {};
  db.matches.forEach(function (m) { resultByOrder[m.order] = m.result; });
  var data = db.predSheet.getDataRange().getValues();
  var rows = [];
  for (var r = 1; r < data.length; r++) {
    var email = data[r][0];
    if (!email) continue;
    var points = 0, filled = 0;
    for (var m = 1; m <= TOTAL_MATCHES; m++) {
      var choice = data[r][1 + m];
      if (choice) filled++;
      points += scoreFor(choice, resultByOrder[m]);
    }
    if (filled > 0) rows.push({ email: email, name: data[r][1] || email, points: points, filled: filled });
  }
  rows.sort(function (a, b) { return b.points - a.points || String(a.name).localeCompare(String(b.name)); });
  return rows;
}

// ── Puntaje (debe coincidir con site/app.js) ────────────────────
function winnerOf(c) {
  if (c === 'A' || c === 'AP') return 'A';
  if (c === 'B' || c === 'BP') return 'B';
  return null;
}
function isPenales(c) { return c === 'AP' || c === 'BP'; }
function scoreFor(pred, result) {
  if (!result || !pred) return 0;
  var pts = 0;
  var w = winnerOf(pred);
  if (w && w === winnerOf(result)) pts += 1;
  if (isPenales(pred) && pred === result) pts += 0.5;
  return pts;
}

// ── Utilidades ──────────────────────────────────────────────────
function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheetByName(name) { return ss().getSheetByName(name); }
function lower(s) { return String(s).toLowerCase(); }

function orderToStageKey() {
  var map = {};
  STAGES().forEach(function (s) { s.orders.forEach(function (o) { map[o] = s.key; }); });
  return map;
}

function findUserRow(sheet, email) {
  var last = Math.max(sheet.getLastRow(), 1);
  var col = sheet.getRange(1, 1, last, 1).getValues();
  for (var i = 1; i < col.length; i++) {
    if (lower(col[i][0]) === lower(email)) return i + 1;
  }
  return -1;
}

function getConfig(key) {
  var data = sheetByName('Config').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) if (data[i][0] === key) return data[i][1];
  return '';
}
function setConfig(key, value) {
  var sheet = sheetByName('Config');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(value); return; }
  }
  sheet.appendRow([key, value]);
}

// Crea las pestañas y datos iniciales si no existen.
function ensureSheets() {
  var book = ss();

  if (!book.getSheetByName('Config')) {
    var c = book.insertSheet('Config');
    c.appendRow(['key', 'value']);
    c.appendRow(['tournamentName', TOURNAMENT_NAME]);
    STAGES().forEach(function (s, i) {
      c.appendRow(['open_' + s.key, i === 0 ? 'TRUE' : 'FALSE']); // 16avos abierta por defecto
    });
  }

  if (!book.getSheetByName('Partidos')) {
    var p = book.insertSheet('Partidos');
    p.appendRow(['order', 'stage', 'teamA', 'teamB', 'result']);
    for (var i = 0; i < 16; i++) p.appendRow([i + 1, '16avos', SEED_16[i][0], SEED_16[i][1], '']);
    for (var o = 0; o < 8; o++) p.appendRow([17 + o, 'octavos', '', '', '']);
    for (var q = 0; q < 4; q++) p.appendRow([25 + q, 'cuartos', '', '', '']);
    for (var s = 0; s < 2; s++) p.appendRow([29 + s, 'semis', '', '', '']);
    p.appendRow([31, 'final', '', '', '']);
    p.appendRow([32, 'tercer', '', '', '']);
  }

  if (!book.getSheetByName('Pronosticos')) {
    var pr = book.insertSheet('Pronosticos');
    var header = ['email', 'name'];
    for (var j = 1; j <= TOTAL_MATCHES; j++) header.push(String(j));
    pr.appendRow(header);
  }

  var def = book.getSheetByName('Hoja 1') || book.getSheetByName('Sheet1');
  if (def && book.getSheets().length > 1) book.deleteSheet(def);
}

// Ejecútalo una vez desde el editor para crear las pestañas a mano.
function setup() { ensureSheets(); }
