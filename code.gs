// ============================================================
//  Management System — Google Apps Script Backend
// ============================================================
//  Nasazení: zkopírovat celý soubor do Apps Script editoru →
//  Deploy → Manage deployments → (tužka) → Version: New version → Deploy.
//  URL zůstává stejná. Předchozí verze zůstává v historii deploymentu.
//
//  Úpravy 2026-11-24 (beze změny existujících dat):
//  - LockService: zápisy se neprolínají (žádné duplicitní id, žádné smazání špatného řádku)
//  - zápis = 1× setNumberFormats + 1× setValues (místo ~10–15 volání)
//  - id a hledání řádku čtou jen sloupec A
//  - CacheService pro getAll (zápisem se cache maže, platnost 5 min)
//  - action "batch" — víc operací v jednom požadavku
//  - nové sloupce na konci: invoices.paymentMethod, todos.date
//  - žádná automatická konverze textu začínajícího [ nebo { na pole/objekt
// ============================================================

const COLUMNS = {
  clients:  ["id","name","company","email","phone","address","city","zip","ico","dic","notes","color"],
  orders:   ["id","clientId","name","description","price","currency","status","stage","created","deadline","color","milestones","delivered","noInvoice","paidDate"],
  entries:  ["id","orderId","description","duration","date"],
  invoices: ["id","orderId","clientId","number","recipient","items","amount","currency","issued","duzp","dueDate","note","status","paidDate","orderIds","paymentMethod"],
  expenses: ["id","orderId","description","amount","category","date","dueDate","paid","paidDate"],
  notes:    ["id","orderId","text","created"],
  todos:    ["id","text","done","created","color","order","date"],
  // Údaje firmy na fakturách (1 řádek) — sdílené mezi zařízeními. List se vytvoří sám při prvním načtení.
  profile:  ["id","companyName","ico","dic","address","city","zip","email","phone","bankAccount","iban"],
};

// Sloupce které musí zůstat jako text (nesmí se konvertovat na číslo)
const TEXT_COLS   = ["ico","dic"];
const DATE_COLS   = ["created","deadline","delivered","issued","duzp","dueDate","paidDate","date"];
const NUMBER_COLS = ["id","clientId","orderId","price","amount","duration"];

const CACHE_KEY   = "getAll_v1";
const CACHE_TTL   = 300;      // sekund
const CACHE_CHUNK = 50000;    // znaků na jeden klíč (limit CacheService je 100 KB)

// ─── HTTP Handlers ─────────────────────────────────────────────

function doGet(e) {
  try {
    const action = e.parameter.action || "getAll";
    const sheet  = e.parameter.sheet;
    let result;
    if (action === "getAll") {
      const gen = cacheGen();
      result = e.parameter.nocache ? null : readCache();
      if (!result) {
        result = {};
        Object.keys(COLUMNS).forEach(function(name){ result[name] = getAll(name); });
        writeCache(result, gen);
      }
    } else if (action === "getSheet" && sheet) {
      result = getAll(sheet);
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (err) {
    return jsonResponse({ error: "Server je zaneprázdněný, zkus to znovu." });
  }
  try {
    const body = JSON.parse(e.postData.contents);
    let result;
    if (body.action === "batch") {
      if (!Array.isArray(body.ops)) throw new Error("batch: chybí ops");
      result = body.ops.map(function(op){ return runOp(op); });
    } else {
      result = runOp(body);
    }
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ error: err.message });
  } finally {
    clearCache();
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function runOp(op) {
  const action = op.action, sheet = op.sheet;
  if (!COLUMNS[sheet]) throw new Error("Neznámý list: " + sheet);
  if (action === "create") return createRow(sheet, op.data);
  if (action === "update") return updateRow(sheet, op.id, op.data);
  if (action === "delete") return deleteRow(sheet, op.id);
  throw new Error("Neznámá akce: " + action);
}

// ─── Cache ─────────────────────────────────────────────────────

// Každý zápis zvýší "generaci" — data uložená pod starou generací se už nikdy nepřečtou.
// Tím se nemůže stát, že čtení běžící souběžně se zápisem uloží do cache stará data.
function cacheGen() {
  try { return CacheService.getScriptCache().get(CACHE_KEY + "_gen") || "0"; } catch (err) { return "x"; }
}

function readCache() {
  try {
    const cache = CacheService.getScriptCache();
    const p = CACHE_KEY + "_" + cacheGen() + "_";
    const n = Number(cache.get(p + "n"));
    if (!n) return null;
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(p + i);
    const parts = cache.getAll(keys);
    let s = "";
    for (let i = 0; i < n; i++) {
      const part = parts[p + i];
      if (part === undefined || part === null) return null;
      s += part;
    }
    return JSON.parse(s);
  } catch (err) { return null; }
}

function writeCache(data, gen) {
  try {
    if (gen === "x" || cacheGen() !== gen) return; // mezitím proběhl zápis
    const p = CACHE_KEY + "_" + gen + "_";
    const s = JSON.stringify(data);
    const obj = {};
    let n = 0;
    for (let i = 0; i < s.length; i += CACHE_CHUNK) { obj[p + n] = s.slice(i, i + CACHE_CHUNK); n++; }
    obj[p + "n"] = String(n);
    CacheService.getScriptCache().putAll(obj, CACHE_TTL);
  } catch (err) { /* cache je jen zrychlení — chyba nevadí */ }
}

function clearCache() {
  try { CacheService.getScriptCache().put(CACHE_KEY + "_gen", String(Date.now()), 21600); } catch (err) {}
}

// ─── CRUD ──────────────────────────────────────────────────────

function getAll(sheetName) {
  const sheet = getSheet(sheetName);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const cols = COLUMNS[sheetName];
  return rows.slice(1).map(function(row) {
    const obj = {};
    cols.forEach(function(col, i) {
      let val = row[i];
      if (val === undefined) val = "";
      // Datová pole — Google Sheets vrací Date objekty, převést na YYYY-MM-DD string
      if (val instanceof Date && DATE_COLS.indexOf(col) >= 0) val = fmtDate(val);
      if (NUMBER_COLS.indexOf(col) >= 0) val = Number(val) || 0;
      if (TEXT_COLS.indexOf(col) >= 0) val = String(val === null ? "" : val);
      obj[col] = val;
    });
    return obj;
  }).filter(function(obj){ return obj.id; });
}

function createRow(sheetName, data) {
  const sheet = getSheet(sheetName);
  const cols  = COLUMNS[sheetName];
  data = Object.assign({}, data);
  data.id = maxId(sheet) + 1;
  const rowIdx = sheet.getLastRow() + 1;
  writeRow(sheet, sheetName, rowIdx, buildRow(cols, data));
  return data;
}

function updateRow(sheetName, id, data) {
  const sheet  = getSheet(sheetName);
  const cols   = COLUMNS[sheetName];
  const rowIdx = findRowIndex(sheet, id);
  if (rowIdx === -1) throw new Error("Záznam id=" + id + " nenalezen v " + sheetName);
  data = Object.assign({}, data, { id: Number(id) });
  writeRow(sheet, sheetName, rowIdx, buildRow(cols, data));
  return data;
}

function deleteRow(sheetName, id) {
  const sheet  = getSheet(sheetName);
  const rowIdx = findRowIndex(sheet, id);
  if (rowIdx === -1) throw new Error("Záznam id=" + id + " nenalezen v " + sheetName);
  sheet.deleteRow(rowIdx);
  return { id: Number(id) };
}

// ─── Helpers ───────────────────────────────────────────────────

// Jeden řádek = jedno nastavení formátů + jeden zápis hodnot.
// Formáty stejné jako dřív: IČO/DIČ jako text "@", data "yyyy-mm-dd".
function writeRow(sheet, sheetName, rowIdx, row) {
  const cols  = COLUMNS[sheetName];
  const range = sheet.getRange(rowIdx, 1, 1, row.length);
  const needFormat = cols.some(function(c){ return TEXT_COLS.indexOf(c) >= 0 || DATE_COLS.indexOf(c) >= 0; });
  if (needFormat) {
    const fmts = range.getNumberFormats()[0].map(function(f, i) {
      const c = cols[i];
      if (TEXT_COLS.indexOf(c) >= 0) return "@";
      if (DATE_COLS.indexOf(c) >= 0) return "yyyy-mm-dd";
      return f;
    });
    range.setNumberFormats([fmts]);
  }
  // IČO/DIČ vždy jako string — s formátem "@" je Sheets nepřevede na číslo
  const vals = row.map(function(v, i){ return TEXT_COLS.indexOf(cols[i]) >= 0 ? String(v) : v; });
  range.setValues([vals]);
}

function buildRow(cols, data) {
  return cols.map(function(col) {
    const val = data[col];
    if (val instanceof Date) return fmtDate(val);
    if (Array.isArray(val) || (typeof val === "object" && val !== null)) return JSON.stringify(val);
    return val !== undefined && val !== null ? val : "";
  });
}

function fmtDate(val) {
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(val, tz, "yyyy-MM-dd");
}

// Čte jen sloupec A (id)
function idColumn(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, 1).getValues();
}

function maxId(sheet) {
  return idColumn(sheet).reduce(function(m, r){ return Math.max(m, Number(r[0]) || 0); }, 0);
}

function findRowIndex(sheet, id) {
  const ids = idColumn(sheet);
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function getSheet(name) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(COLUMNS[name]);
    sheet.getRange(1, 1, 1, COLUMNS[name].length)
         .setBackground("#1a1a2e").setFontColor("#ffffff").setFontWeight("bold");
    const cols = COLUMNS[name] || [];
    TEXT_COLS.forEach(function(col) {
      const idx = cols.indexOf(col);
      if (idx >= 0) sheet.getRange(2, idx + 1, 1000, 1).setNumberFormat("@");
    });
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Kontrola: nové sloupce (spustit ručně jednou, je to bezpečné) ──
// Doplní POUZE chybějící název sloupce v hlavičce (řádek 1) pro nové sloupce
// invoices.paymentMethod a todos.date. Žádná data v řádcích 2+ nemění.
// Pokud je buňka v hlavičce už obsazená jiným názvem, nic nepřepíše a jen to vypíše do logu.
function addMissingHeaders() {
  Object.keys(COLUMNS).forEach(function(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sheet) return;
    const cols = COLUMNS[name];
    const hdr  = sheet.getRange(1, 1, 1, cols.length).getValues()[0];
    cols.forEach(function(col, i) {
      const cur = String(hdr[i] || "");
      if (cur === col) return;
      if (cur === "") {
        // Zkontrolovat, že ve sloupci nejsou žádná data — jinak nesahat
        const last = sheet.getLastRow();
        const colVals = last >= 2 ? sheet.getRange(2, i + 1, last - 1, 1).getValues() : [];
        const hasData = colVals.some(function(r){ return r[0] !== "" && r[0] !== null; });
        if (hasData) { Logger.log("POZOR " + name + ": sloupec " + (i + 1) + " nemá hlavičku, ale obsahuje data — nic neměním."); return; }
        sheet.getRange(1, i + 1).setValue(col);
        Logger.log(name + ": doplněna hlavička '" + col + "' do sloupce " + (i + 1));
      } else {
        Logger.log("POZOR " + name + ": sloupec " + (i + 1) + " má hlavičku '" + cur + "', očekáváno '" + col + "' — nic neměním.");
      }
    });
  });
  clearCache();
  Logger.log("Hotovo.");
}

// ─── Migrace: opravit existující IČO (spustit ručně jednou) ────
function fixExistingIco() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("clients");
  if (!sheet) { Logger.log("Sheet 'clients' nenalezen."); return; }
  const cols   = COLUMNS["clients"];
  const icoIdx = cols.indexOf("ico");
  if (icoIdx < 0) { Logger.log("Sloupec ico nenalezen."); return; }
  const colLetter = icoIdx + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("Žádná data k opravě."); return; }
  sheet.getRange(2, colLetter, lastRow - 1, 1).setNumberFormat("@");
  const range = sheet.getRange(2, colLetter, lastRow - 1, 1);
  const vals  = range.getValues();
  let fixed = 0;
  const newVals = vals.map(function(row) {
    let ico = String(row[0] || "").trim();
    if (/^\d+$/.test(ico) && ico.length > 0 && ico.length < 8) { ico = ico.padStart(8, "0"); fixed++; }
    return [ico];
  });
  range.setValues(newVals);
  clearCache();
  Logger.log("Hotovo. Opraveno IČO: " + fixed + " záznamů z " + vals.length + ".");
}

// ─── Migrace: přidat orderIds do existujících faktur (spustit ručně jednou) ────
function migrateOrderIds() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("invoices");
  if (!sheet) { Logger.log("Sheet 'invoices' nenalezen."); return; }
  var cols = COLUMNS["invoices"];
  var orderIdIdx  = cols.indexOf("orderId");
  var orderIdsIdx = cols.indexOf("orderIds");
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("Žádná data."); return; }
  var vals = sheet.getRange(2, 1, lastRow - 1, cols.length).getValues();
  var updated = 0;
  vals.forEach(function(row, i) {
    var orderId  = row[orderIdIdx];
    var orderIds = row[orderIdsIdx];
    var needsUpdate = false;
    if (!orderIds || orderIds === "") needsUpdate = true;
    else { try { var parsed = JSON.parse(orderIds); if (!Array.isArray(parsed) || parsed.length === 0) needsUpdate = true; } catch(e) { needsUpdate = true; } }
    if (needsUpdate && orderId) { sheet.getRange(i + 2, orderIdsIdx + 1).setValue(JSON.stringify([Number(orderId)])); updated++; }
  });
  clearCache();
  Logger.log("Hotovo. Aktualizováno " + updated + " faktur z " + vals.length + ".");
}
