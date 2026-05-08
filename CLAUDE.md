# Management System

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

### HTML struktura (pozor na past)
- `<nav id="sidebar">` musí být zavřen `</nav>` — **ne `</div>`** (chyba z minulé session způsobila rozbití layoutu)
- Struktura: `body(flex) → #app → nav#sidebar + div#main → div#timer-bar + main#content`

### Funkce pro poznámky
- `openNoteM(oid)` — nová poznámka
- `openEditNoteM(id, oid)` — editace existující poznámky (přidáno)
- `saveEditNote(id, oid)` — uložení editace přes `mut('update','notes',...)`
- `delNote(id, oid)` — smazání s potvrzením

## Hotové úpravy (shrnutí sessions)

### Datová integrita
- `normalizeInvoices()` — centrální parser `string→array` v `loadAll()`
- `updIIDesc()` — doplnění ceny bez ztráty fokusu (DOM target `#ii-price-{i}`)
- `saveI()` — reset + `closeModal()` až po `await mut()` (kritická oprava)
- `saveI()` — odstraněna fallback logika `orderIds`

### Logika / funkce
- Tisk faktury: A4 formát, zápatí na spodku, bez podtitulu
- Upozornění na fakturu: jen po překročení splatnosti (`new Date(dueDate) < now`)
- Průběžné zakázky (`!o.deadline`): zobrazuje zaplacené částky z linked faktur
- Editace poznámek: nová tlačítka ✎ na každé poznámce, `openEditNoteM` + `saveEditNote`

### Přístupnost & kód
- `<nav>`, `<main>`, `role="dialog"`, `aria-modal`, focus trap v modalu
- `aria-label` na všech icon-only tlačítkách
- `for`/`id` propojení label-input ve všech formulářích (36 párů)
- CSS custom properties (`:root` tokeny) pro všechny barvy
- `tbl-wrap` na všech tabulkách (mobile scroll)
- `min-height:44px` touch targety na mobilu

### Design
- Dashboard: 4 `.sc` karty → `.mpanel` instrument panel (1 kontejner, 4 buňky)
- Karty klientů + čas. záznamy: `border-left` → `border-top` (design rule)
- Aktivní milestone tečka: `box-shadow glow` → `transform:scale(1.25)`

## Uživatel
Jan Staudinger (honzastau), komunikace česky.
