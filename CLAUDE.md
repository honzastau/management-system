# Management System

## Projekt
Osobní management systém pro správu klientů, zakázek, faktur, měření času a výdajů.
- **Frontend:** `index.html` — jeden soubor, vanilla JS, dark theme `#09090f`
- **Backend:** Google Apps Script (`code.txt`) — CRUD přes Google Sheets
- **Produkce:** GitHub Pages — https://github.com/honzastau/management-system
- **DB tabulky:** clients, orders, entries, invoices, expenses, notes

## Auto-deploy
Stop hook v `~/.claude/settings.json` automaticky commituje a pushuje každou změnu na GitHub. Není třeba commitovat ručně.

## Development verze
`index-dev.html` — kopie `index.html` pro testování větších změn, aniž by se zasáhlo do produkční verze.
- `DEV_MODE=true` na začátku scriptu přepíná `loadAll()`/`mut()` na lokální mock — **žádné volání na Google Apps Script**, žádná reálná data.
- Sample data v `SAMPLE_DATA` (4 klienti, 5 zakázek různých typů — s deadline, průběžná, hotovostní, archivovaná, 4 faktury ve stavech draft/sent/paid, entries, expenses, notes).
- Mutace se ukládají do `localStorage` klíč `mgmt_dev_db` (persistence mezi reloady, ale odděleně od produkce). Reset na výchozí sample data = smazat tento klíč v localStorage.
- Vizuálně odlišené: title "Management System (DEV)", červený "DEV" label v sidebaru.
- Po pushi dostupné na `https://honzastau.github.io/management-system/index-dev.html` (stejný repo/branch jako produkce, jen jiný soubor).
- **Změny v `index.html` a `index-dev.html` je nutné dělat odděleně** — kopírování větších úprav mezi soubory je ruční (žádný sdílený include).
- Známý (již existující, needěláno v rámci dev verze) bug: `vDash()` u průběžných zakázek (`!o.deadline`) počítá `dl=NaN`, zobrazí se "NaNd" místo "∞ Průběžná zakázka" — projeví se i v produkci, pokud tam existuje průběžná zakázka.

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

### Časomíra (tracker) — redesign ve stylu spent.work (zatím jen `index-dev.html`)
- **Perzistence běžícího časovače**: `TS` nově drží `startedAt` (epoch ms) místo pouhého počítadla; ukládá se do `localStorage` (klíč `mgmt_timer` přes `LS` wrapper) v `persistTimer()`. Při startu appky `restoreTimer()` (voláno z `loadAll()` po naplnění `DB`, před `render()`) obnoví běžící časovač a dopočítá uplynulý čas z `Date.now()-startedAt` — časomíra tedy přežije zavření okna/reload, i když JS reálně neběží na pozadí zavřené karty.
- `timerTick()` — centrální funkce pro `setInterval`, aktualizuje `#tdisp`, `#tdisp-inline` a `#ord-t-{orderId}` (živý součet na kartě zakázky) přímo přes `textContent`, bez `render()` (nerozbije focus na inputech).
- Zůstává **jeden globální časovač** (žádné souběžné časovače napříč zakázkami) — vědomé rozhodnutí uživatele.
- `vTime()` karty zakázek přepracovány na vzor spent.work: kulaté ▶/■ tlačítko vlevo (mění se na ■ + `stopTimer()` když běží), velký mono čas vpravo nahoře (`fmtT`, formát HH:MM:SS, živě tiká), zvýrazněné pozadí (`#062016`/`#0d3a25`) na běžícím řádku.
- **Editace záznamu**: `openEM(oid, editId)` a `saveE(returnOid, editId)` nyní podporují úpravu existujícího záznamu (tužka vedle koše v tabulkách ve `vTime()` i `vOrderDetail()`), místo pouze mazání. Pozor: select zakázky ve formuláři musí zahrnout i neaktivní zakázku editovaného záznamu (`o.status==='active'||o.id===selOid`), jinak by uložení záznamu u dokončené/archivované zakázky přehodilo záznam na jinou zakázku.
- **Neportováno do produkce**: změny jsou zatím jen v `index-dev.html`. Až uživatel odsouhlasí chování, je potřeba ručně přenést do `index.html` (žádný sdílený include mezi soubory).

## Uživatel
Jan Staudinger (honzastau), komunikace česky.
