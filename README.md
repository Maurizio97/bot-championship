# FC26 Discord Bot - Campionato Online

Bot Discord modulare per gestire squadre, giocatori, budget, trasferimenti ed evoluzione overall con controllo admin via ruolo Discord.

## Stack

- Node.js
- discord.js v14
- Sequelize ORM
- PostgreSQL o MySQL

## Struttura progetto

```text
src/
 ├── commands/
 ├── events/
 ├── database/
 ├── models/
 ├── repositories/
 ├── services/
 ├── utils/
 ├── config/
 └── index.js
```

## Setup rapido

1. Copia `.env.example` in `.env`
2. Inserisci token Discord e config DB
3. **Imposta `DISCORD_ADMIN_ROLE_ID`** (ID ruolo o nome ruolo Discord)
4. Installa dipendenze
5. Avvia il bot

```bash
npm install
npm run db:bootstrap
npm start
```

## Database con Docker (consigliato)

Il bot gira in locale, mentre PostgreSQL gira in Docker tramite `docker-compose.yml`.

### Dev - Setup completo

```bash
# Avvia DB
npm run db:up

# Attendi ~2s, poi bootstrap schema
npm run db:bootstrap

# (Opzionale) Carica 10 giocatori per test
npm run db:seed:players

# Avvia bot in watch mode
npm run dev
```

### Dev - Reset completo

```bash
npm run db:down
npm run db:up
npm run db:bootstrap
npm run dev
```

Log DB:

```bash
npm run db:logs
```

Ferma DB:

```bash
npm run db:down
```

## Amministrazione

### Gestione Admin (v2)

Niente tab tabella `admins`. **Tutto via ruolo Discord:**

1. Crea un ruolo nel server Discord (es. "Moderator")
2. Assegna il ruolo ai moderatori
3. Configura nel `.env`:

```env
DISCORD_ADMIN_ROLE_ID=1507438255329771720
```

O con nome ruolo (case-insensitive):

```env
DISCORD_ADMIN_ROLE_ID=Moderator
```

Fatto. Comandi `adminOnly: true` sono bloccati per utenti senza ruolo.

## Valuta interna

- Budget iniziale squadra: `700` unità
- Prezzo giocatori e trasferimenti: scala unità semplice

## Comandi implementati

### Pubblici (tutti)

- `!ordine` — Ordine draft attuale
- `!turno` — Turno squadra corrente
- `!budget [squadra|@owner]` — Budget squadra
- `!chi <giocatore>` — Proprietario giocatore
- `!rosa [squadra|@owner]` — Rosa squadra
- `!valore <giocatore>` — Valore giocatore
- `!comandi` — Elenco comandi
- `!scegli <giocatore>` — Candidatura giocatore (team selection)
- `!acquista <giocatore> <prezzo> <squadraVenditrice|@owner> <squadraAcquirente|@owner>` — Trasferimento durante mercato aperto
- `!teams` — Elenco squadre (admin)
- `!continueteams`, `!closeteams` — Team selection lifecycle

### Staff (Require ruolo Discord)

- `!addteam <nome> <@owner>` — Crea squadra
- `!updateteam <teamId> <nome> <@owner>` — Modifica squadra
- `!deleteteam <teamId>` — Elimina squadra
- `!assegnagiocatore <giocatore> <squadra|@owner> <prezzo>` — Assegna svincolato via asta
- `!svincola <giocatore>` — Rimuove giocatore dalla squadra e rimborsa il costo
- `!iniziodraft`, `!pausadraft`, `!continua`, `!chiudidraft` — Draft control
- `!scegli`, `!assegna` — Draft + team selection actions
- `!aggiungi <squadra> <amount> <reason>` — Accredita budget
- `!togli <squadra> <amount> <reason>` — Addebita budget
- `!aprimercato`, `!chiudimercato` — Market control
- `!comandistaff` — Elenco comandi staff

`&assegnagiocatore` cerca il giocatore per nome o ID; squadra per nome o owner (`@owner`/mention). Alias legacy: `&assignplayer`.

## Schema database

- SQL completo: `database/schema.sql`
- Migrazioni incrementali: `database/migrations/`
- Query esempio: `database/example-queries.sql`
- Setup doc dettagliato: `docs/db-setup.md`

## State persistence

- `league_state`: singleton globale (draft status, market status, turno, round)
- `draft_orders`: ordine draft persistente
- `budget_logs`: storico completo transazioni
- `teams.name`: nome squadra scelto

Restart bot NON resetta progress. Usa `!iniziodraft` per reset consapevole.

## Relazioni principali

- `teams` 1:N `players`
- `players` 1:N `transfers`
- `teams` 1:N `transfers` (from/to)
- `players` 1:N `overall_history`

## Estendibilità

- Nuovi comandi: `src/commands/` + registrare in `src/commands/index.js`
- Business logic: `src/services/`
- DB access: `src/repositories/`
