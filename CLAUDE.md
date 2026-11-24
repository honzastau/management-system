# Management System

## Projekt
Osobní management systém pro správu klientů, zakázek, faktur, měření času a výdajů.
- **Frontend:** `index.html` — jeden soubor, vanilla JS, světlý vzhled (`--bg:#f8fafc`)
- **Backend:** Google Apps Script `code.gs` (v repu) — CRUD přes Google Sheets. **Nasazuje se ručně**: zkopírovat do Apps Script editoru → Deploy → Manage deployments → New version (URL zůstává). Auto-deploy hook ho NEnasazuje.
- **Produkce:** GitHub Pages — https://github.com/honzastau/management-system
- **DB tabulky:** clients, orders, entries, invoices, expenses, notes, todos
- **Bezpečnost dat:** uživatel výslovně nechce měnit/mazat existující data. Žádné migrace řádků bez souhlasu; nové sloupce jen na konec `COLUMNS` (sloupce se čtou podle pozice!).

## Auto-deploy
Stop hook v `~/.claude/settings.json` automaticky commituje a pushuje každou změnu na GitHub. Není třeba commitovat ručně.

## Development režim
`index.html?dev=1` (`index-dev.html` je jen přesměrování) — stejný soubor, žádné ruční přenášení změn.
- `DEV_MODE` (z URL) → `sendOp()` volá `devOp()` místo serveru — **žádné volání na Google Apps Script**, žádná reálná data.
- Testovací data `SAMPLE_DATA`; "server" je `localStorage` klíč `mgmt_dev_db` (reset = smazat klíč). Časovač má v dev vlastní klíč `mgmt_dev_timer`.
- Lokální test: `file://` ztratí `?dev=1` a sáhl by na reálná data → testovat přes lokální HTTP server (např. node static server) na `http://127.0.0.1:PORT/index.html?dev=1`.

## Klíčové technické detaily

### Data flow
- `loadAll(force)` — při startu okamžitě vykreslí data z cache `localStorage` (`mgmt_db_cache_v1`), pak dotáhne čerstvá ze serveru (`force` → `nocache=1`). `_dbLoaded` = čerstvá data ze serveru jsou načtená.
- `mut(action, sheet, payload)` — klasický zápis přes frontu `enqueue()` (zápisy jdou postupně, až po načtení dat). Update připravený z dat z cache se neodešle (hláška „zopakuj akci“, `SkipErr`).
- `mutFast(sheet,id,data)` / `mutBatchFast(sheet,items)` — okamžitá odezva (úkoly, milníky, stav faktury, řazení úkolů); při chybě `loadAll(true)`. Batch posílá `action:"batch"`, se starým backendem fallback na jednotlivé požadavky.
- `rerender()` — překreslí i detail zakázky/klienta (`_curDetail`).
- Údaje firmy (faktury): list `profile` (1 řádek) přes `prof()`; fallback na `localStorage` `mgmt_profile` se starým backendem. `syncProfileUp()` po načtení nahraje lokální údaje, když je server nemá (jen create, nikdy nepřepíše).
- `invsForOrder(oid)` — jediné místo pro „faktury k zakázce“ (orderId i orderIds).
- Backend: `LockService` na zápisy, `CacheService` pro getAll (generační klíč, TTL 5 min — ruční úprava v Sheets se projeví až do 5 min nebo po „Zkusit znovu“), jeden `setNumberFormats` + `setValues` na řádek, id/hledání řádku jen ze sloupce A.
- `items`, `orderIds`, `milestones` backend vrací jako JSON string, `normalizeInvoices()` parsuje.

### Formulář faktury — pravidla
- **Existující faktury se nikdy automaticky nemění** (výslovné přání uživatele). Auto-chování jen pro novou fakturu (`!INV_EDIT_ID`).
- `syncInvOrderItems(orders)` (z `updateInvInfo`) — nová faktura: každá zaškrtnutá zakázka přidá položku (`_oid`), odškrtnutí ji odebere (i upravenou). `INV_AUTO_DONE` = zakázky, které už položku mají.
- Položka může mít `oid` (zakázka, ke které patří); při ≥2 zakázkách je u položky select. `invAmtForOrder(inv, oid)` = podíl faktury na zakázce — používat všude místo `inv.amount` u součtů za zakázku (zbývá dofakturovat, karty, statistiky). Staré položky bez `oid`: shoda názvu zakázky, zbytek poměrem cen (jen výpočet, data se nemění; uživatel si staré faktury upraví ručně).
- `ordValue(o)` — zobrazovaná hodnota zakázky: průběžná s fakturací = součet `invAmtForOrder` všech faktur (Vyfakturováno), jinak `o.price`. Výjimka: karta AKTIVNÍ průběžné zakázky ukazuje jen zaplacené faktury (`oinvsPaid`) a zisk z nich (`oinvsPaid - náklady`) — přání uživatele.
- Způsob platby: výchozí `prevodem`; prázdný = převodem (tisk i formulář). U úpravy se nezměněná hodnota uloží původní (`data-orig` na `#fpm`).

### Položky faktury — měrné jednotky
- Položka v `items` (JSON): `{desc, note, qty, unit, price}`; `unit` z `INV_UNITS`, chybějící = `'ks'` (staré faktury). Žádný nový sloupec.
- `unitOpts(u)` — options selectu; `getItemSuggestions()` vrací i `unit`, `updIIDesc` ji předvyplní. Množství může být desetinné (tisk s čárkou).

### Náklady (expenses) — splatnost a platba
- Sloupce navíc: `dueDate`, `paid` (boolean), `paidDate`. Pole „Datum“ ve formuláři není; `date` se u nového nákladu plní automaticky dnešním dnem (sloupec zůstává kvůli pozici).
- `isExpPaid(x)` — prázdné `paid` (staré záznamy) = zaplaceno. `expPaidDay(x)` = `paidDate || date` (reporty, dlaždice měsíce počítají jen zaplacené dle data platby).
- `expDueDays(x)` — dny do splatnosti nezaplaceného; Přehled ukazuje ≤5 dní oranžově, den splatnosti a po splatnosti červeně (`expWarn` ve `vDash`).
- `openExpM(oid, editId)` / `saveExp(oid, editId)` — nový i úprava; `payExp(id)` — rychlé „zaplaceno dnes“ přes `mutFast`.
- Past při náhledu: Edit hook otevírá upravený `index.html` v panelu jako `data:` URL **bez `?dev=1`** → běží proti reálným datům. Testovat jen v kartě s `http://127.0.0.1:PORT/index.html?dev=1`.

### Záznamy času — začátek
- Sloupec navíc `entries.startTime` (text `HH:MM`, v `TEXT_COLS`); den zůstává v `date`. Staré záznamy čas nemají.
- Formulář `openEM`: pole „Začátek“ (`#fst`, datetime-local) místo Datum, nápověda konce `updEndHint()`. U úpravy nezměněný začátek uloží původní `startTime` (`data-orig`), takže starým záznamům nepřibude 00:00.
- Časovač ukládá `date`/`startTime` z `TS.startedAt` (`tsDate`, `tsTime`). Tabulky ukazují `entWhen(x)`.
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

### Časomíra (tracker) — redesign ve stylu spent.work (v `index.html` i `index-dev.html`)
- **Perzistence běžícího časovače**: `TS` nově drží `startedAt` (epoch ms) místo pouhého počítadla; ukládá se do `localStorage` (klíč `mgmt_timer` přes `LS` wrapper) v `persistTimer()`. Při startu appky `restoreTimer()` (voláno z `loadAll()` po naplnění `DB`, před `render()`) obnoví běžící časovač a dopočítá uplynulý čas z `Date.now()-startedAt` — časomíra tedy přežije zavření okna/reload, i když JS reálně neběží na pozadí zavřené karty.
- `timerTick()` — centrální funkce pro `setInterval`, aktualizuje `#tdisp`, `#tdisp-inline` a `#ord-t-{orderId}` (živý součet na kartě zakázky) přímo přes `textContent`, bez `render()` (nerozbije focus na inputech).
- Zůstává **jeden globální časovač** (žádné souběžné časovače napříč zakázkami) — vědomé rozhodnutí uživatele.
- `vTime()` karty zakázek přepracovány na vzor spent.work: kulaté ▶/■ tlačítko vlevo (mění se na ■ + `stopTimer()` když běží), velký mono čas vpravo nahoře (`fmtT`, formát HH:MM:SS, živě tiká), zvýrazněné pozadí (`#062016`/`#0d3a25`) na běžícím řádku.
- **Editace záznamu**: `openEM(oid, editId)` a `saveE(returnOid, editId)` nyní podporují úpravu existujícího záznamu (tužka vedle koše v tabulkách ve `vTime()` i `vOrderDetail()`), místo pouze mazání. Pozor: select zakázky ve formuláři musí zahrnout i neaktivní zakázku editovaného záznamu (`o.status==='active'||o.id===selOid`), jinak by uložení záznamu u dokončené/archivované zakázky přehodilo záznam na jinou zakázku.
- Názvy zakázek na kartách se zalamují (karta 320px), běžící karta má světle zelené pozadí `#ecfdf5`/`#86efac` (aplikace je ve světlém vzhledu).
- Tabulka záznamů bez filtru ukazuje jen aktivní zakázky; záznamy dokončených jsou zašedlé pod rozbalovacím řádkem (`toggleTimeDone`).
- `index.html` má CRLF a UTF-8 s BOM — při skriptovaných úpravách zachovat.

## Uživatel
Jan Staudinger (honzastau), komunikace česky.
