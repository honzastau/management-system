# Management System — Claude kontext

## Projekt
Osobní management systém pro správu klientů, zakázek, faktur, měření času a výdajů.
- **Frontend:** `index.html` — jeden soubor, vanilla JS, dark theme `#09090f`
- **Backend:** Google Apps Script (`code.txt`) — CRUD přes Google Sheets
- **Produkce:** GitHub Pages — https://github.com/honzastau/management-system
- **DB tabulky:** clients, orders, entries, invoices, expenses, notes

## Auto-deploy
Stop hook v `~/.claude/settings.json` automaticky commituje a pushuje každou změnu na GitHub. Není třeba commitovat ručně.

## Klíčové technické detaily

### Data flow
- `loadAll()` — načte vše ze serveru, volá `normalizeInvoices()` na fakturách
- `mut(action, sheet, payload)` — async zápis; aktualizuje lokální `DB` objekt a volá `render()`
- `jsonStringFields = ["milestones", "items", "orderIds"]` — backend vrací jako JSON string, `normalizeInvoices()` parsuje centrálně v `loadAll()`
- Po `mut('create'/'update', 'invoices')` server vrátí `items` jako string — `printInv()` a `openIM()` mají vlastní defensivní parsing

### Pasti v kódu
- `render()` dispatch map **neobsahuje** `'orderDetail'` — volání `render()` z order detail view je no-op; použít `vOrderDetail(oid)` přímo
- Průběžná zakázka = `!o.deadline` (žádný deadline)
- Faktury napojeny na zakázky přes `inv.orderId` (číslo) nebo `inv.orderIds` (array)
- Globální stav: `INV_ITEMS[]`, `INV_EDIT_ID`, `_EDIT_INV`, `TS` (timer), `curView`

### Číslování faktur
Formát `YYYY-NNN` (např. `2026-009`), funkce `nin()`

## Uživatel
Jan Staudinger (honzastau), komunikace česky.
